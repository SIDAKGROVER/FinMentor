# FinMentor Frontend Deployment Guide

## Deploy to Vercel (Recommended for Vite/React)

### Prerequisites
- GitHub repo with code pushed
- Vercel account (https://vercel.com — free tier includes Hobby projects)

### Steps

1. **Push code to GitHub** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/finmentor.git
   git push -u origin main
   ```

2. **On Vercel Dashboard:**
   - Click **Add New...** → **Project**
   - Select your GitHub repo (`finmentor`)
   - Choose **Framework Preset:** React
   - Root Directory: `frontend/` (or `/`)
   - Build Command: `npm run build` (auto-detected for Vite)
   - Output Directory: `dist` (auto-detected)

3. **Set Environment Variable:**
   - Under **Environment Variables**, add:
     ```
     VITE_BACKEND_URL=https://YOUR_BACKEND_URL
     ```
     (Replace `YOUR_BACKEND_URL` with your Render backend URL, e.g., `https://finmentor-backend.onrender.com`)

4. **Click Deploy** — Vercel will build and deploy automatically

5. **Your app URL:** Vercel assigns a domain like `finmentor.vercel.app`

---

## Alternative: Netlify

1. Go to https://netlify.com → New site from Git
2. Select your GitHub repo
3. Build Command: `npm run build`
4. Publish Directory: `dist`
5. Set env var: `VITE_BACKEND_URL=<your_backend_url>`
6. Deploy

---

## Verify Deployment

1. Visit your Vercel/Netlify URL in browser
2. Open DevTools → Console
3. Check that the app loads without errors
4. Try Voice Chat:
   - Click the Voice Chat button
   - Verify it fetches token from your backend
   - Confirm status shows "Joined (mic published)" or attempts to join

### If voice chat fails
- Check browser console for Agora errors
- Verify `VITE_BACKEND_URL` is correctly set in Vercel env vars
- Test backend token endpoint directly:
  ```bash
  curl https://YOUR_BACKEND_URL/api/agora/token
  ```

---

## Post-Deployment

- **Custom Domain:** Go to Vercel Project Settings → Domains → add your custom domain
- **CI/CD:** Any push to `main` branch auto-deploys (disable under Project Settings if needed)
- **SSL/HTTPS:** Automatically enabled (free Let's Encrypt cert)

---

## Tips

- If frontend loads but shows "Connection failed", check that `VITE_BACKEND_URL` matches your deployed backend
- To debug in production, use Vercel Logs: Project → Deployments → View Logs
- Use Vercel Analytics to monitor performance
