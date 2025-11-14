# FinMentor - Quick Visual Guide

## 🎯 What You'll See

### Main Application Screen

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  ┌──────────────┐  ┌────────────────────────────────┐   │
│  │   SIDEBAR    │  │      CHAT AREA                 │   │
│  │              │  │                                │   │
│  │  💰 FinMentor│  │  🤖 Hi! I'm FinMentor...     │   │
│  │              │  │                                │   │
│  │  🎤 Voice    │  │                                │   │
│  │  ✓ Connected │  │  📝 Previous messages...     │   │
│  │              │  │                                │   │
│  │  💡 Tips     │  │                                │   │
│  │  • Budgeting │  │                                │   │
│  │  • Investing │  │  👤 Your message here...     │   │
│  │  • Savings   │  │                                │   │
│  │              │  ├────────────────────────────────┤   │
│  │              │  │ 📝 Ask something...     [Send] │   │
│  └──────────────┘  └────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## 🎤 Voice Chat Status

```
Connected ✓               Not Connected ✗           Error ✗
┌─────────────────┐     ┌─────────────────┐      ┌──────────────┐
│ 🎤 Voice Chat   │     │ 🎤 Voice Chat   │      │ 🎤 Voice     │
│ ✓ Mic Active    │     │ Connecting...   │      │ Connection   │
│                 │     │ (or Initializing)     │ failed       │
└─────────────────┘     └─────────────────┘      └──────────────┘
```

## 💬 Chat Bubble Styles

```
BOT Response:                 USER Message:
┌──────────────────┐         ┌──────────────────┐
│ 🤖 "Here's what  │         │                  │ 👤
│    compound      │         │ "What is ROI?"   │
│    interest is"  │         └──────────────────┘
└──────────────────┘
(Gray background,     (Purple gradient,
 left-aligned)        right-aligned)
```

## 📋 User Journey

```
1. OPEN APP
   ↓
   http://localhost:5173
   ↓
   
2. GRANT PERMISSIONS
   ↓
   Browser: "Allow microphone?" → YES
   ↓
   
3. WAIT FOR CONNECTION
   ↓
   Status: "Initializing..." → "Connecting..." → "✓ Connected"
   ↓
   
4. ASK QUESTIONS
   ↓
   Type: "How do I save money?"
   Send: [Send Button]
   ↓
   
5. GET RESPONSE
   ↓
   Bot replies with answer
   Response is spoken aloud 🔊
   ↓
   
6. CONTINUE CHATTING
   ↓
   Ask more questions...
```

## 🔧 Setup Journey

```
START HERE
    ↓
1. GET AGORA CREDENTIALS
   Visit: https://console.agora.io/
   Sign up → Create project → Copy App ID & Cert
    ↓
2. UPDATE CONFIGURATION
   Edit: backend/.env
   Paste credentials
    ↓
3. INSTALL DEPENDENCIES
   Backend: npm install
   Frontend: npm install
    ↓
4. START SERVERS
   Backend: npm start (port 5000)
   Frontend: npm run dev (port 5173)
    ↓
5. OPEN BROWSER
   http://localhost:5173
    ↓
6. ENJOY! 🎉
```

## 🌐 Network Diagram

```
YOUR COMPUTER
┌────────────────────────────────────────┐
│  Browser                               │
│  http://localhost:5173                 │
│  ┌────────────────────────────────┐   │
│  │  React Frontend                │   │
│  │  • Chat UI                     │   │
│  │  • Agora RTC Client            │   │
│  │  • Text-to-Speech              │   │
│  └────────────────────────────────┘   │
│           ↓ HTTP & WebRTC ↑            │
│  ┌────────────────────────────────┐   │
│  │  Express Backend               │   │
│  │  http://localhost:5000         │   │
│  │  • API Routes                  │   │
│  │  • Token Generation            │   │
│  │  • AI Proxy                    │   │
│  └────────────────────────────────┘   │
└────────────────────────────────────────┘
      ↓ HTTPS                ↓ WebRTC
   ┌─────────────┐        ┌──────────────┐
   │  OpenAI API │        │  Agora Cloud │
   │  (AI)       │        │  (Voice)     │
   └─────────────┘        └──────────────┘
```

## 📁 File Purpose Overview

```
ESSENTIAL FILES YOU NEED TO MODIFY:

backend/.env
└─ YOUR CREDENTIALS HERE
   AGORA_APP_ID=paste_here
   AGORA_APP_CERTIFICATE=paste_here

frontend/.env
└─ Already configured
   VITE_BACKEND_URL=http://localhost:5000


FILES THAT ARE READY TO USE:

backend/server.js
└─ Express server (no changes needed)

backend/agoraToken.js
└─ Token generation (fixed and working)

frontend/src/App.jsx
└─ Chat UI (enhanced and working)

frontend/src/AgoraAudio.jsx
└─ Voice chat (fixed and working)

frontend/src/styles.css
└─ Beautiful styling (updated)


START SCRIPTS (Pick one):

Windows:
└─ Double-click START.bat

PowerShell:
└─ powershell -ExecutionPolicy Bypass -File START.ps1

Manual:
└─ Terminal 1: cd backend && npm start
└─ Terminal 2: cd frontend && npm run dev
```

## 🎨 Color Scheme

```
PRIMARY COLORS:
├─ Purple Gradient: #667eea → #764ba2
│  Used for: Logo, buttons, messages
│
├─ Light Gray: #f5f5f5
│  Used for: Background
│
├─ White: #ffffff
│  Used for: Sidebar, chat area
│
└─ Status Colors:
   ├─ Green: #4ade80 (Connected)
   ├─ Yellow: #fbbf24 (Connecting)
   └─ Red: #f87171 (Error)
```

## 🚀 Key Interactions

### Sending a Message
```
User Types          Hits Enter or Click
      ↓                     ↓
  Input Field  →  Message Sent to Backend
      ↓                     ↓
  Added to Chat   API Call to /api/ai/chat
      ↓                     ↓
  Input Cleared   Response from AI
      ↓                     ↓
  Scrolls Down    Message Displayed
                  ↓
              Voice Output 🔊
```

### Voice Chat Connection
```
Page Load
    ↓
Get Agora Token from Backend
    ↓
Create RTC Client
    ↓
Request Microphone Permission
    ↓
Initialize Microphone Audio Track
    ↓
Join Channel
    ↓
Publish Audio Track
    ↓
✓ Ready to Chat! 🎤
```

## 📊 Data Flow

```
1. CHAT MESSAGE
   User Input
      ↓
   Frontend sends POST /api/ai/chat
      ↓
   Backend receives message
      ↓
   Backend sends to OpenAI API (or uses canned reply)
      ↓
   OpenAI returns response
      ↓
   Backend sends back to frontend
      ↓
   Frontend displays message
      ↓
   Frontend speaks message with TTS

2. VOICE CHAT
   Browser requests microphone access
      ↓
   Frontend gets Agora token from backend
      ↓
   Agora SDK joins channel
      ↓
   Peer 1 publishes audio
      ↓
   Peer 2 subscribes to audio
      ↓
   Real-time audio communication ✓
```

## ✅ Success Indicators

You'll know everything is working when you see:

✓ Backend terminal shows:
```
========================================
   FinMentor Backend Server
========================================
✓ Server running on port 5000
✓ API URL: http://localhost:5000
✓ Agora Status: ✓ Configured
✓ OpenAI Status: ✓ Configured (or ✗ Using canned replies)
```

✓ Frontend displays:
```
- FinMentor logo with subtitle
- 🎤 Voice Chat panel with "✓ Mic Active"
- Chat area with "Hi! I'm FinMentor..."
- Input field ready for questions
```

✓ When you send a message:
```
- Your message appears with 👤 avatar
- "Thinking..." appears briefly
- Bot response appears with 🤖 avatar
- Response is spoken aloud
```

✓ Troubleshooting:
```
If you see errors, check:
1. Backend console for API errors
2. Browser console (F12) for frontend errors
3. .env files for correct credentials
4. Agora console for valid App ID
```

---

**Now you're ready to explore FinMentor! 🚀💰**
