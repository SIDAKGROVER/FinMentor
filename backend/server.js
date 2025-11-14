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
    // Quick validations to give clearer errors instead of a generic 500
    if (!APP_ID) {
      const msg = 'AGORA_APP_ID is not configured on the server';
      console.error(msg);
      return res.status(500).json({ error: msg });
    }

    // Generate token (may return null in tokenless mode)
    let token;
    try {
      token = generateAgoraRtcToken(APP_ID, APP_CERT, channel, uid);
    } catch (err) {
      console.error('generateAgoraRtcToken threw:', err && err.stack ? err.stack : err);
      // If debug flag provided, return error details to help troubleshooting
      if (req.query.debug === '1') {
        return res.status(500).json({ error: 'Token generation failed', details: String(err && err.message), stack: err && err.stack });
      }
      return res.status(500).json({ error: 'Token generation failed' });
    }

    // Note: token may be null in tokenless mode (if no certificate provided)
    res.json({ token, appId: APP_ID, uid, channel, tokenMode: token ? 'secure' : 'tokenless', chatAppKey: AGORA_CHAT_APPKEY });
  } catch (err) {
    console.error('Token generation error:', err);
    if (req.query.debug === '1') {
      return res.status(500).json({ error: 'Token generation failed', details: err && err.message, stack: err && err.stack });
    }
    res.status(500).json({ error: 'Token generation failed' });
  }
});

// Debug: Inspect generated Agora token internals (guarded by DEBUG_AGORA env or ?debug=1)
app.get('/api/agora/token_inspect', (req, res) => {
  try {
    const allow = (process.env.DEBUG_AGORA === '1') || req.query.debug === '1';
    if (!allow) return res.status(403).json({ error: 'token inspect disabled' });

    const channel = req.query.channel || 'finmentor-channel';
    const uid = req.query.uid ? Number(req.query.uid) : Math.floor(Math.random() * 999999);
    const token = generateAgoraRtcToken(APP_ID, APP_CERT, channel, uid);
    if (!token) return res.json({ token: null, note: 'tokenless mode (no certificate configured)' });

    // token format: version (e.g. '006') + base64(payload)
    const prefix = token.slice(0,3);
    const base64 = token.slice(3);
    const buf = Buffer.from(base64, 'base64');

    // signature: first 32 bytes
    const signature = buf.slice(0, 32);
    // appId: next 16 bytes
    const appIdBuf = buf.slice(32, 48);
    // channel crc: next 4
    const channelCrc = buf.readUInt32BE(48);
    // uid crc: next 4
    const uidCrc = buf.readUInt32BE(52);
    // message: rest
    const messageBuf = buf.slice(56);

    // parse message: uint16 count, then count * (uint16 privilege, uint32 expire)
    const msg = {};
    if (messageBuf.length >= 2) {
      const count = messageBuf.readUInt16BE(0);
      msg.count = count;
      let off = 2;
      msg.items = [];
      for (let i = 0; i < count; i++) {
        if (off + 6 <= messageBuf.length) {
          const p = messageBuf.readUInt16BE(off); off += 2;
          const exp = messageBuf.readUInt32BE(off); off += 4;
          msg.items.push({ privilege: p, expireTs: exp });
        }
      }
    }

    res.json({
      tokenVersion: prefix,
      tokenBase64Length: base64.length,
      signatureHex: signature.toString('hex'),
      appIdHex: appIdBuf.toString('hex'),
      appIdAscii: appIdBuf.toString('ascii'),
      channelCrc,
      uidCrc,
      message: msg,
      rawHex: buf.toString('hex')
    });
  } catch (err) {
    console.error('Token inspect error:', err);
    res.status(500).json({ error: 'inspect failed', details: err.message });
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

// Temporary in-memory user store used when MongoDB is unavailable (for quick testing/demo)
const inMemoryUsers = new Map(); // key: email -> { id, name, email, passwordHash, createdAt }
function isMongoConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

// Signup route
app.post('/api/auth/signup', async (req, res) => {
  try {
    // Debug: optionally log request body when ?debug=1 is present
    if (req.query.debug === '1') {
      console.log('DEBUG /api/auth/signup body:', req.body);
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' });

    if (isMongoConnected()) {
      const existing = await User.findOne({ email }).lean();
      if (existing) return res.status(409).json({ error: 'User already exists' });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({ name, email, passwordHash });
      // return minimal user info (no password)
      return res.json({ id: user._id, name: user.name, email: user.email });
    }

    // Fallback to in-memory store when MongoDB is unavailable
    if (inMemoryUsers.has(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const memUser = { id: `mem-${Date.now()}`, name, email, passwordHash, createdAt: new Date() };
    inMemoryUsers.set(email, memUser);
    return res.json({ id: memUser.id, name: memUser.name, email: memUser.email });
  } catch (err) {
    console.error('Signup error:', err);
    // Handle duplicate key (email already exists) explicitly
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'User already exists (duplicate email)' });
    }
    // If debug flag present, return error details to help troubleshooting (do not expose in production)
    if (req.query.debug === '1') {
      return res.status(500).json({ error: 'Signup failed', details: err.message });
    }
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    if (req.query.debug === '1') {
      console.log('DEBUG /api/auth/login body:', req.body);
    }
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    if (isMongoConnected()) {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      return res.json({ id: user._id, name: user.name, email: user.email });
    }

    // Fallback: check in-memory users
    const mem = inMemoryUsers.get(email);
    if (!mem) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, mem.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    return res.json({ id: mem.id, name: mem.name, email: mem.email });
  } catch (err) {
    console.error('Login error:', err);
    if (req.query.debug === '1') {
      return res.status(500).json({ error: 'Login failed', details: err.message });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

// Small helper: canned replies if LLM is unavailable
function cannedReply(message) {
  const m = (message || '').toLowerCase();
  const variants = [];
  if (m.includes('compound')) {
    variants.push('Compound interest is earning interest on previous interest. Example: ₹100 at 10% → ₹110 after 1 year; next year interest is on ₹110.');
    variants.push('Think of compound interest as interest on interest. ₹100 at 10% becomes ₹110 after a year; the next year you earn interest on ₹110.');
  }
  if (m.includes('budget')) {
    variants.push('Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings — adjust to your situation.');
    variants.push('A simple start: list all income, subtract essentials, set a savings target (20%) and cap wants to 30%.');
  }
  if (m.includes('quiz')) {
    variants.push('Quiz: What does ROI stand for? A) Return on Investment B) Rate of Interest C) Revenue on Input');
    variants.push('Pop quiz: ROI usually means Return on Investment — which option matches that?');
  }

  if (variants.length === 0) {
    variants.push("I can explain budgeting, savings, ROI, compound interest — ask a specific question like 'How do I save ₹2000/month'?\");
    variants.push("Ask me a specific finance question (budgeting, saving or investing). For example: 'How do I make a monthly budget?'\");
    variants.push("I'm FinMentor — I can explain savings, budgets, and compound interest. Try: 'Explain compound interest with an example.'");
  }

  // Return a random variant to avoid identical canned replies
  return variants[Math.floor(Math.random() * variants.length)];
}

// AI Chat Route (proxy to OpenAI / Gemini)
app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  // If API key not set, return canned reply immediately
  if (!OPENAI_KEY) {
    if (req.query.debug === '1') console.log('DEBUG /api/ai/chat (canned) body:', req.body);
    return res.json({ reply: cannedReply(message), debug: 'OPENAI_KEY not set' });
  }

  try {
    const modelName = 'gpt-4o-mini';

    // Build messages array for the LLM; include optional conversation history
    const messages = [
      { role: 'system', content: 'You are FinMentor Edu, a concise friendly AI tutor teaching personal finance to students. Always: 1) Keep answers short (2–4 sentences) and clear; 2) Provide a concrete example when possible; 3) Vary phrasing to avoid repeating the same sentence; 4) If the user question is ambiguous, ask one brief clarifying question; 5) Prefer simple language and include one actionable tip or step. Avoid using the same exact wording across replies.' }
    ];

    // Accept an optional `history` array from the frontend (last messages)
    // Each history item is expected to have shape { from: 'user'|'bot', text: '...' }
    const history = req.body.history;
    if (Array.isArray(history)) {
      history.forEach(h => {
        try {
          if (h && h.from === 'user') messages.push({ role: 'user', content: String(h.text || '') });
          else if (h && h.from === 'bot') messages.push({ role: 'assistant', content: String(h.text || '') });
        } catch (e) { /* ignore malformed history items */ }
      });
    }

    // Current user message appended last
    messages.push({ role: 'user', content: message });

    const payload = {
      model: modelName,
      messages,
      max_tokens: 512,
      // Slightly higher temperature to encourage varied replies
      temperature: 0.7,
      // Encourage variety and reduce repetition
      presence_penalty: 0.6,
      frequency_penalty: 0.5,
      top_p: 0.95
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
    // If debug requested, return error details to help troubleshooting
    if (req.query.debug === '1') {
      return res.json({ reply: cannedReply(message), error: err?.response?.data || err.message });
    }
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

// Debug status endpoint (safe for local use) - shows config flags and DB state
app.get('/api/debug/status', (req, res) => {
  try {
    const dbState = mongoose.connection && mongoose.connection.readyState;
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    res.json({
      agoraAppIdPresent: !!APP_ID,
      openAiKeyPresent: !!OPENAI_KEY,
      mongoUriPresent: !!process.env.MONGO_URI,
      mongoReadyState: dbState,
      mongoReadyStateText: dbState === 1 ? 'connected' : (dbState === 2 ? 'connecting' : (dbState === 0 ? 'disconnected' : String(dbState)))
    });
  } catch (err) {
    res.status(500).json({ error: 'debug failed', details: err.message });
  }
});
