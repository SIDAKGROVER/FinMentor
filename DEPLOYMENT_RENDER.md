# FinMentor Backend Deployment Guide

## Deploy to Render.com (Recommended)

### Prerequisites
- GitHub account with your code pushed to a repo
- Render account (https://render.com — free tier available)

### Steps

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/finmentor.git
   git push -u origin main
   ```

2. **On Render.com Dashboard:**
   - Click **New** → **Web Service**
   - Connect your GitHub repo
   - Select the `backend` folder as the root directory (or leave blank if `server.js` is in repo root)
   
3. **Configure environment variables in Render:**
   - Add the following under **Environment Variables:**
     ```
     AGORA_APP_ID=4a410e05b4554ec1a81555f44bc3228e
     AGORA_APP_CERTIFICATE=02f9818234cb497d8ec7770cec6ffb82
     AGORA_CHAT_APPKEY=411421092#1623519
     OPENAI_API_KEY=YOUR_OPENAI_KEY (or leave as placeholder)
     MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/finmentor
     PORT=5000
     NODE_ENV=production
     ```

4. **Build Command:** `npm install && npm start`
5. **Start Command:** `node server.js`

6. **Click Deploy** — Render will auto-restart on code changes

7. **Copy your backend URL** (e.g., `https://finmentor-backend.onrender.com`)
   - Use this in frontend `.env.production` and Vercel env vars

---

## Alternative: Deploy to Railway.app

1. Go to https://railway.app → New Project → Import from GitHub
2. Select your repo
3. Set Root Directory: `backend/`
4. Add environment variables (same as above)
5. Click Deploy

Railway will assign a public URL automatically.

---

## Alternative: Deploy to Heroku (legacy)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create finmentor-backend

# Set environment variables
heroku config:set AGORA_APP_ID=4a410e05b4554ec1a81555f44bc3228e
heroku config:set AGORA_APP_CERTIFICATE=02f9818234cb497d8ec7770cec6ffb82
# ... (set all vars)

# Deploy
git push heroku main
```

---

## Verify Deployment

After backend is live:

```bash
# Test token endpoint
curl https://YOUR_BACKEND_URL/api/agora/token

# Expected response:
# {
#   "token": "006...",
#   "appId": "4a410e05b4554ec1a81555f44bc3228e",
#   "uid": XXXXX,
#   "channel": "finmentor-channel",
#   "tokenMode": "secure",
#   "chatAppKey": "411421092#1623519"
# }
```

If token endpoint works, frontend will connect correctly.

---

## Troubleshooting

### Backend not starting
- Check logs in Render/Railway dashboard
- Ensure `npm install` runs successfully
- Verify `PORT` env var is set

### Token endpoint returns 500
- Check if `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are set in env vars
- Verify MongoDB connection string if using MongoDB Atlas

### Frontend can't reach backend
- Confirm `VITE_BACKEND_URL` env var in Vercel matches your backend URL
- Check CORS settings in `backend/server.js` (currently allows all origins)
