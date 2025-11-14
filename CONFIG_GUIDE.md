# FinMentor Configuration Guide

## Quick Setup (5 minutes)

### 1️⃣ Get Agora Credentials (FREE)

1. Visit: https://console.agora.io/
2. Click "Sign Up" or "Log In"
3. Create a new project
4. You'll get an **App ID** - copy this
5. Go to "Settings" → Enable "App Certificate" - copy this

### 2️⃣ Configure Backend

1. Open `backend/.env`:
   ```env
   AGORA_APP_ID=paste_your_app_id_here
   AGORA_APP_CERTIFICATE=paste_your_certificate_here
   OPENAI_API_KEY=optional_leave_blank_initially
   PORT=5000
   ```

### 3️⃣ Run the Project

**Option A: Quick Start Script**
- **Windows**: Double-click `START.bat`
- **PowerShell**: `powershell -ExecutionPolicy Bypass -File START.ps1`

**Option B: Manual Start**

Terminal 1 (Backend):
```bash
cd backend
npm install
npm start
```

Terminal 2 (Frontend):
```bash
cd frontend
npm install
npm run dev
```

### 4️⃣ Open in Browser

Visit: `http://localhost:5173`

---

## Optional: Add OpenAI for Better AI Responses

Without this, the AI uses pre-written replies. With this, it gives real AI-powered responses.

1. Get API Key from: https://platform.openai.com/account/api-keys
2. Update `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-your_key_here
   ```
3. Restart backend: `npm start`

---

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `AGORA_APP_ID` | YES | abc123def456 | From Agora console |
| `AGORA_APP_CERTIFICATE` | YES | xyz789... | From Agora console |
| `OPENAI_API_KEY` | NO | sk-... | From OpenAI console |
| `PORT` | NO | 5000 | Server port (default: 5000) |

### Frontend (.env)

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `VITE_BACKEND_URL` | NO | http://localhost:5000 | Backend API URL |

---

## Common Issues & Fixes

### ❌ "Microphone permission denied"
- ✓ Click the lock icon in browser address bar
- ✓ Allow microphone access
- ✓ Refresh page

### ❌ "Failed to connect to Agora"
- ✓ Check backend is running: http://localhost:5000
- ✓ Verify App ID & Certificate in .env are correct
- ✓ Restart both servers

### ❌ "Cannot find module agora-token"
- ✓ Run `npm install` in backend folder
- ✓ Make sure node_modules exists

### ❌ "AI responses not working"
- ✓ Responses fall back to pre-written if OpenAI key missing
- ✓ Add OPENAI_API_KEY to backend/.env
- ✓ Check OpenAI account has credits

### ❌ "Port 5000 already in use"
- ✓ Change PORT in backend/.env to something else (5001, 5002, etc)
- ✓ Or kill existing process on port 5000

---

## Testing the API Manually

### Test Agora Token Generation
```bash
curl "http://localhost:5000/api/agora/token"
```

Expected response:
```json
{
  "token": "...",
  "appId": "...",
  "uid": 123456,
  "channel": "finmentor-channel"
}
```

### Test Chat API
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is compound interest?"}'
```

---

## Project Structure Explained

```
finmentor-prototype/
│
├── backend/                    # Node.js/Express server
│   ├── server.js              # Main server file
│   ├── agoraToken.js          # Agora token generation
│   ├── .env                   # Configuration (SECRETS - never commit)
│   ├── package.json           # Backend dependencies
│   └── uploads/               # Temp folder for audio files
│
├── frontend/                  # React app (Vite)
│   ├── src/
│   │   ├── App.jsx            # Main chat UI component
│   │   ├── AgoraAudio.jsx     # Agora voice chat component
│   │   ├── styles.css         # App styling
│   │   ├── index.css          # Global styles
│   │   ├── main.jsx           # React entry point
│   │   └── assets/            # Images, icons, etc
│   ├── .env                   # Frontend config
│   ├── index.html             # HTML template
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite build config
│
├── START.bat                  # Quick start for Windows
├── START.ps1                  # Quick start for PowerShell
├── SETUP_GUIDE.md             # Detailed setup guide
└── CONFIG_GUIDE.md            # This file

```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  User's Browser                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  React Frontend (http://localhost:5173)      │   │
│  │  ├── Chat UI                                  │   │
│  │  ├── Agora RTC Component                      │   │
│  │  └── Text-to-Speech                           │   │
│  └──────────────────────────────────────────────┘   │
│              ↓ HTTP ↕ WebRTC                        │
├─────────────────────────────────────────────────────┤
│              Your Computer / Server                  │
│  ┌──────────────────────────────────────────────┐   │
│  │  Node.js Backend (http://localhost:5000)     │   │
│  │  ├── Express API Server                       │   │
│  │  ├── Agora Token Generator                    │   │
│  │  └── OpenAI Proxy (optional)                  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
             ↓ API Calls                
    ┌──────────────────────────────┐
    │  External Services           │
    │  ├── Agora.io (Voice)        │
    │  └── OpenAI (AI Responses)   │
    └──────────────────────────────┘
```

---

## Key Features Explained

### 🎤 Agora Voice Chat
- **What**: Real-time voice communication
- **How**: WebRTC peer-to-peer connection
- **Where**: AgoraAudio.jsx component

### 💬 AI Chat
- **What**: Chat with AI about finance
- **How**: Text sent to backend → OpenAI API → Response
- **Where**: App.jsx chat area

### 🔊 Text-to-Speech
- **What**: AI responses spoken aloud
- **How**: Browser's Web Speech API
- **Where**: App.jsx - automatic when bot replies

---

## Want to Deploy to Production?

### Frontend Deployment (Vercel, Netlify, etc)
```bash
cd frontend
npm run build
# Deploy the 'dist' folder
```

### Backend Deployment (Heroku, Railway, etc)
```bash
# Set environment variables in your host
# Make sure PORT is not hardcoded
node backend/server.js
```

---

For more help:
- 📖 Agora Docs: https://docs.agora.io/
- 🔑 OpenAI Docs: https://platform.openai.com/docs/
- ⚛️ React Docs: https://react.dev/
- 📦 Vite Docs: https://vitejs.dev/

Happy Building! 🚀
