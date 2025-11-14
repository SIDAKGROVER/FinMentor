# FinMentor - Financial Education AI with Agora Voice Chat

A full-stack web application combining AI-powered financial education with real-time voice communication using Agora.

## Features

✨ **Key Features:**
- **Agora Voice Chat Integration** - Real-time audio communication
- **AI Financial Advisor** - Chat with an AI tutor about personal finance
- **Text-to-Speech** - Automatic voice replies from the AI
- **Modern UI** - Beautiful, responsive design
- **Real-time Communication** - WebRTC-based voice chat

## Prerequisites

- **Node.js** (v16+)
- **npm** or **yarn**
- **Agora Account** - [Create free account at console.agora.io](https://console.agora.io/)
- **OpenAI API Key** (Optional) - [Get from platform.openai.com](https://platform.openai.com/account/api-keys)

## Setup Instructions

### Step 1: Get Agora Credentials

1. Go to [https://console.agora.io/](https://console.agora.io/)
2. Sign up or log in
3. Create a new project
4. Copy your **App ID** and **App Certificate**

### Step 2: Configure Backend

1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update `.env` file with your credentials:
   ```env
   AGORA_APP_ID=your_agora_app_id_here
   AGORA_APP_CERTIFICATE=your_agora_app_certificate_here
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=5000
   ```

### Step 3: Start Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Backend will run at: `http://localhost:5000`

### Step 4: Setup Frontend

1. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Verify `.env` file:
   ```env
   VITE_BACKEND_URL=http://localhost:5000
   ```

### Step 5: Start Frontend Dev Server

```bash
npm run dev
```

Frontend will run at: `http://localhost:5173` (or the port shown in terminal)

## How to Use

1. **Open the Application**: Navigate to `http://localhost:5173` in your browser
2. **Grant Microphone Permission**: Allow browser access to microphone
3. **Wait for Agora Connection**: The sidebar will show voice chat status
4. **Ask Financial Questions**: Use the chat area to ask anything about:
   - Budgeting strategies
   - Saving tips
   - Investment basics
   - Compound interest
   - And more!
5. **Voice Chat**: Microphone is automatically active for multi-user conversations

## API Endpoints

### Backend Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/agora/token` | GET | Generate Agora RTC token |
| `/api/ai/chat` | POST | Send message to AI |
| `/api/audio/upload` | POST | Upload audio for processing |

### Example Requests

**Get Agora Token:**
```bash
curl "http://localhost:5000/api/agora/token?channel=finmentor&uid=12345"
```

**Send Chat Message:**
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is compound interest?"}'
```

## Project Structure

```
finmentor-prototype/
├── backend/
│   ├── server.js           # Express server
│   ├── agoraToken.js       # Agora token generation
│   ├── package.json        # Backend dependencies
│   └── .env                # Backend configuration
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── AgoraAudio.jsx  # Agora integration component
│   │   ├── styles.css      # Styling
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.js      # Vite configuration
│   └── .env                # Frontend configuration
```

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **Agora RTC SDK** - Real-time communication
- **Axios** - HTTP client

### Backend
- **Node.js + Express** - Server framework
- **Agora Token** - Token generation
- **OpenAI API** - AI responses (optional)
- **Cors** - Cross-origin support

## Troubleshooting

### Issue: "Agora connection failed"
- ✓ Check your App ID and Certificate in `.env`
- ✓ Ensure browser has microphone permissions
- ✓ Check network connectivity

### Issue: "Cannot connect to backend"
- ✓ Verify backend is running on `http://localhost:5000`
- ✓ Check `VITE_BACKEND_URL` in frontend `.env`

### Issue: "AI responses are canned replies"
- ✓ Add `OPENAI_API_KEY` to backend `.env`
- ✓ Verify API key is valid
- ✓ Check OpenAI account has available credits

### Issue: "Microphone not working"
- ✓ Grant browser microphone permission
- ✓ Check browser console for errors
- ✓ Try a different browser

## Development Commands

### Frontend
```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend
```bash
cd backend
npm start        # Start server
npm run dev      # Start with nodemon
```

## Production Deployment

### Frontend
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting
```

### Backend
```bash
# Set environment variables on your hosting
export AGORA_APP_ID=your_id
export AGORA_APP_CERTIFICATE=your_cert
export OPENAI_API_KEY=your_key
export PORT=5000

node backend/server.js
```

## License

MIT License - Feel free to use this project for learning and development.

## Support

For issues or questions:
- Check [Agora Documentation](https://docs.agora.io/)
- Check [OpenAI Documentation](https://platform.openai.com/docs/)
- Review console logs in browser and terminal

---

Happy Learning! 🚀 Happy Investing! 💰
