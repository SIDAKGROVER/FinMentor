# FinMentor - AI-Powered Financial Education with Voice Chat

A modern full-stack web application that combines AI-powered financial education with real-time voice communication. Learn about personal finance, investing, budgeting, and savings with an intelligent mentor—complete with voice chat capabilities!

## 🎯 Features

### 🎤 Real-Time Voice Chat (Agora Integration)
- **WebRTC Technology**: Peer-to-peer audio communication
- **Automatic Setup**: Voice chat activates on page load
- **Status Display**: Real-time connection status
- **Quality Audio**: Crystal-clear voice transmission

### 🤖 AI Financial Advisor
- **Smart Responses**: Powered by OpenAI GPT models
- **Finance Topics**: Budgeting, savings, investments, compound interest
- **Fallback Mode**: Pre-written expert responses if AI unavailable
- **Context-Aware**: Personalized financial advice

### 🔊 Text-to-Speech
- **Automatic TTS**: AI responses spoken aloud
- **Browser Native**: Uses Web Speech API
- **Customizable**: Adjustable speech rate

### 🎨 Beautiful UI/UX
- **Modern Design**: Gradient theme with smooth animations
- **Responsive Layout**: Works on desktop, tablet, mobile
- **Intuitive Interface**: Easy-to-use chat experience
- **Real-time Updates**: Auto-scrolling chat history

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Lightning-fast build tool
- **Agora RTC SDK** - Real-time communication
- **Axios** - HTTP client
- **CSS3** - Modern styling with gradients & animations

### Backend
- **Node.js + Express** - Server framework
- **agora-token** - Agora token generation
- **OpenAI API** - AI responses (optional)
- **CORS** - Cross-origin support
- **dotenv** - Environment configuration

---

## 📦 Installation

### Prerequisites
- Node.js v16+ ([Download](https://nodejs.org/))
- Agora Account (FREE - [Sign up](https://console.agora.io/))
- OpenAI API Key (Optional - [Get here](https://platform.openai.com/account/api-keys))

### Step 1: Clone & Setup

```bash
# Clone or download the project
cd finmentor-prototype

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### Step 2: Configure Agora (Required)

1. Visit [https://console.agora.io/](https://console.agora.io/)
2. Create a free account
3. Create a new project
4. Copy your **App ID** and **App Certificate**

### Step 3: Setup Environment Variables

Edit `backend/.env`:
```env
# Required: Agora credentials from console.agora.io
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here

# Optional: For real AI responses (uses canned replies if omitted)
OPENAI_API_KEY=sk-your_key_here

# Server Configuration
PORT=5000
```

### Step 4: Start the Application

**Option A: Quick Start Script**
```bash
# Windows
START.bat

# PowerShell
powershell -ExecutionPolicy Bypass -File START.ps1
```

**Option B: Manual Start**

Terminal 1 - Backend:
```bash
cd backend
npm start
# or with auto-reload: npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### Step 5: Open in Browser

Visit: **http://localhost:5173**

---

## 🚀 Usage

1. **Grant Permissions**: Allow microphone access when prompted
2. **Voice Ready**: Check sidebar for "✓ Mic Active" status
3. **Ask Questions**: Type financial questions in the chat
4. **Listen**: Responses are automatically spoken aloud
5. **Share**: Invite others to chat with you

### Example Questions
- "How do I create a budget?"
- "What is compound interest and why is it important?"
- "How much should I save each month?"
- "What's the best way to invest as a beginner?"
- "Can you explain ROI to me?"

---

## 📚 API Documentation

### Backend Endpoints

#### 1. Generate Agora Token
```
GET /api/agora/token?channel=finmentor&uid=123
```
**Response:**
```json
{
  "token": "...",
  "appId": "...",
  "uid": 123,
  "channel": "finmentor"
}
```

#### 2. Chat with AI
```
POST /api/ai/chat
Content-Type: application/json

{
  "message": "What is compound interest?"
}
```
**Response:**
```json
{
  "reply": "Compound interest means earning interest on your previous interest..."
}
```

#### 3. Audio Upload (Demo)
```
POST /api/audio/upload
Content-Type: multipart/form-data

[audio file]
```

### Example Requests

```bash
# Get Agora Token
curl "http://localhost:5000/api/agora/token"

# Send Chat Message
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is budgeting?"}'
```

---

## 🏗️ Project Structure

```
finmentor-prototype/
├── backend/
│   ├── server.js              # Express server & API routes
│   ├── agoraToken.js          # Agora token generation
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Configuration (secrets)
│   └── uploads/               # Temporary audio storage
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main chat component
│   │   ├── AgoraAudio.jsx     # Voice chat component
│   │   ├── styles.css         # Component styling
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── .env                   # Frontend configuration
│   └── index.html             # HTML template
│
├── START.bat                  # Windows quick start
├── START.ps1                  # PowerShell quick start
├── SETUP_GUIDE.md             # Detailed setup guide
├── CONFIG_GUIDE.md            # Configuration help
└── IMPLEMENTATION_SUMMARY.md  # What was implemented
```

---

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
| Variable | Type | Required | Example |
|----------|------|----------|---------|
| AGORA_APP_ID | string | YES | abc123def456789 |
| AGORA_APP_CERTIFICATE | string | YES | xyz789abc123... |
| OPENAI_API_KEY | string | NO | sk-proj-xxx... |
| PORT | number | NO | 5000 |

**Frontend (.env)**
| Variable | Type | Default |
|----------|------|---------|
| VITE_BACKEND_URL | string | http://localhost:5000 |

---

## 🎯 How It Works

### Architecture Flow

```
User Browser
    ↓
React Frontend (Vite)
    ├─→ Agora RTC SDK (Voice Chat)
    └─→ Express Backend (API)
        ├─→ Agora Service (Token Generation)
        └─→ OpenAI API (AI Responses)
```

### Message Flow

1. User types question in browser
2. Frontend sends to backend API
3. Backend proxies to OpenAI (or returns canned reply)
4. Response returned to frontend
5. Text displayed in chat
6. Browser speaks response using TTS

### Voice Chat Flow

1. Frontend loads Agora component
2. Backend generates RTC token
3. Agora SDK joins channel
4. Microphone activated
5. Real-time peer-to-peer audio

---

## 🐛 Troubleshooting

### Issue: Microphone Permission Denied
**Solution:**
- Click lock icon in browser address bar
- Allow microphone access
- Refresh page

### Issue: "Cannot connect to Agora"
**Solution:**
- Verify App ID & Certificate in backend/.env
- Check backend is running (http://localhost:5000)
- Restart both frontend and backend

### Issue: "Backend connection failed"
**Solution:**
- Ensure backend is running: `npm start` in backend folder
- Check VITE_BACKEND_URL in frontend/.env matches backend URL
- Check for port conflicts (use `netstat` or similar)

### Issue: "AI responses not working / Getting canned replies"
**Solution:**
- Without OPENAI_API_KEY, AI uses pre-written replies
- Add OPENAI_API_KEY to backend/.env
- Restart backend
- Verify OpenAI account has available credits

### Issue: "Module not found" errors
**Solution:**
- Run `npm install` in the affected directory
- Delete node_modules and package-lock.json, then reinstall
- Check for typos in require/import statements

### Issue: "Port 5000 already in use"
**Solution:**
- Change PORT in backend/.env to 5001, 5002, etc.
- Or find and kill process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```

---

## 📈 Performance Optimization

### Frontend
- Vite provides fast dev server with HMR
- React 19 with optimized rendering
- Lazy loading for components

### Backend
- Express for fast HTTP routing
- Connection pooling ready
- Efficient token generation

### Agora
- WebRTC for low-latency audio
- Adaptive bit rate
- Echo cancellation

---

## 🔒 Security Considerations

### Credentials
- **Never commit .env files** to git
- **Rotate API keys regularly**
- Use environment variables in production
- Restrict Agora App ID to specific domains

### CORS
- Backend properly configured for CORS
- Frontend and backend on same port in production
- Add domain whitelist in production

### API Keys
- OpenAI keys should have rate limits
- Consider using API proxies for sensitive operations

---

## 🚢 Production Deployment

### Frontend (Vercel, Netlify, GitHub Pages)
```bash
cd frontend
npm run build
# Deploy 'dist' folder
```

### Backend (Heroku, Railway, AWS, DigitalOcean)
```bash
# Set environment variables in hosting platform
export AGORA_APP_ID=...
export AGORA_APP_CERTIFICATE=...
export OPENAI_API_KEY=...
export NODE_ENV=production
export PORT=3000

node backend/server.js
```

---

## 📚 Learning Resources

- **Agora Documentation**: https://docs.agora.io/
- **OpenAI API Docs**: https://platform.openai.com/docs/
- **React Documentation**: https://react.dev/
- **Vite Guide**: https://vitejs.dev/
- **Express.js**: https://expressjs.com/
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

## 📝 License

MIT License - Feel free to use for educational and commercial purposes.

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

---

## 💬 Support & Questions

- Check the troubleshooting section above
- Review console logs for errors
- Check backend logs for API issues
- Visit Agora docs for voice chat issues

---

## 🎉 Getting Started Checklist

- [ ] Download and extract project
- [ ] Install Node.js
- [ ] Create Agora account and get credentials
- [ ] Update backend/.env with Agora credentials
- [ ] Run `npm install` in backend folder
- [ ] Run `npm install` in frontend folder
- [ ] Start backend: `npm start` in backend folder
- [ ] Start frontend: `npm run dev` in frontend folder
- [ ] Open http://localhost:5173 in browser
- [ ] Grant microphone permission
- [ ] Start asking financial questions!

**You're all set! Enjoy learning with FinMentor! 🚀💰**

---

Made with ❤️ for financial education
