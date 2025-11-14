// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
const multer = require('multer');
const { generateAgoraRtcToken } = require('./agoraToken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const APP_ID = process.env.AGORA_APP_ID;
const APP_CERT = process.env.AGORA_APP_CERTIFICATE;
const AGORA_CHAT_APPKEY = process.env.AGORA_CHAT_APPKEY || process.env.AGORA_APP_KEY || null;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finmentor';

// Basic env validation (helps debug missing keys)
if (!APP_ID || !APP_CERT) {
  console.warn('Warning: AGORA_APP_ID or AGORA_APP_CERTIFICATE missing in .env');
}
if (!OPENAI_KEY) {
  console.warn('Warning: OPENAI_API_KEY missing in .env — server will use canned replies');
}

// Generate Agora Token endpoint
app.get('/api/agora/token', (req, res) => {
  try {
    const channel = req.query.channel || 'finmentor-channel';
    const uid = req.query.uid ? Number(req.query.uid) : Math.floor(Math.random() * 999999);
    const token = generateAgoraRtcToken(APP_ID, APP_CERT, channel, uid);
    // Note: token may be null in tokenless mode (if no certificate provided)
    res.json({ token, appId: APP_ID, uid, channel, tokenMode: token ? 'secure' : 'tokenless', chatAppKey: AGORA_CHAT_APPKEY });
  } catch (err) {
    console.error('Token generation error:', err);
    res.status(500).json({ error: 'Token generation failed' });
  }
});

// ----- MongoDB + User Auth (simple) -----
// Connect to MongoDB but don't crash server if unavailable
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.warn('MongoDB connection warning:', err.message));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Signup route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' });

    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, passwordHash });
    // return minimal user info (no password)
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Small helper: canned replies if LLM is unavailable
function cannedReply(message) {
  const m = (message || '').toLowerCase();
  if (m.includes('compound')) {
    return 'Compound interest means earning interest on previous interest. Example: ₹100 at 10% → ₹110 after 1 year; interest next year is on ₹110.';
  }
  if (m.includes('budget')) {
    return 'A simple budget: try the 50/30/20 rule — 50% needs, 30% wants, 20% savings.';
  }
  if (m.includes('quiz')) {
    return 'Quiz: What is ROI? A) Return on Investment B) Rate of Interest C) Revenue on Input';
  }
  return "I can explain budgeting, savings, ROI, compound interest — ask a specific question like 'How do I save ₹2000/month?'.";
}

// AI Chat Route (proxy to OpenAI / Gemini)
app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  // If API key not set, return canned reply immediately
  if (!OPENAI_KEY) {
    return res.json({ reply: cannedReply(message) });
  }

  try {
    // Replace model with one you have access to if needed
    const modelName = 'gpt-4o-mini'; // <-- change if your API account uses a different model

    const payload = {
      model: modelName,
      messages: [
        { role: 'system', content: 'You are FinMentor Edu, a friendly AI tutor teaching personal finance to students. Keep answers short and include examples when possible.' },
        { role: 'user', content: message }
      ],
      max_tokens: 400,
      temperature: 0.2
    };

    const aiResp = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });

    const reply = aiResp?.data?.choices?.[0]?.message?.content;
    if (!reply) {
      console.warn('LLM returned no content, falling back to canned reply');
      return res.json({ reply: cannedReply(message) });
    }

    res.json({ reply });

  } catch (err) {
    console.error('LLM request failed:', err?.response?.data || err.message);
    // fallback so demo never breaks
    res.json({ reply: cannedReply(message) });
  }
});

// Optional: audio upload endpoint (demo stub for STT/TTS integration later)
const upload = multer({ dest: 'uploads/' });
app.post('/api/audio/upload', upload.single('file'), async (req, res) => {
  try {
    // In production: run STT -> LLM -> TTS pipeline here.
    // For hackathon demo we delete the file and return a canned response.
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.json({ reply: 'Audio received (demo mode). Use text chat for live replies.' });
  } catch (err) {
    console.error('Audio upload error:', err);
    res.status(500).json({ error: 'audio handling failed' });
  }
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`   FinMentor Backend Server`);
  console.log(`========================================`);
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ API URL: http://localhost:${PORT}`);
  console.log(`✓ Agora Status: ${APP_ID ? '✓ Configured' : '✗ Missing credentials'}`);
  console.log(`✓ OpenAI Status: ${OPENAI_KEY ? '✓ Configured' : '✗ Using canned replies'}`);
  console.log(`========================================\n`);
});
