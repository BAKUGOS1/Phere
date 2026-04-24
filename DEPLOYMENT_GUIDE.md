# Phere - Production Deployment Guide

## 🎯 Quick Overview
Phere is a React-based wedding expense tracker with AI assistance (powered by Groq + LLaMA 3.3). This guide will help you deploy it to production.

---

## 📋 Prerequisites
1. **Groq API Key** (for AI features — free tier available)
2. **Vercel/Netlify Account** (free tier works)
3. **Node.js 18+** installed locally (optional, for local testing)

---

## 🔑 Step 1: Get Your Groq API Key

1. Visit: **https://console.groq.com/keys**
2. Sign up or log in with Google/GitHub
3. Click **"Create API Key"**
4. Copy your API key (starts with `gsk_...`)
5. **IMPORTANT:** Save it securely!

### Pricing (as of 2026)
- **Free Tier:** Generous rate limits for personal use
- **LLaMA 3.3 70B Versatile:** Included in free tier
- **Cost estimate:** ₹0 for personal wedding planning! 🎉

---

## 🚀 Step 2: Deploy to Vercel (Easiest)

### Method 1: Direct Deploy (No GitHub needed)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Navigate to project folder:**
```bash
cd /path/to/Phere
```

3. **Install dependencies:**
```bash
npm install
```

4. **Deploy:**
```bash
vercel
```

5. **Add Environment Variable in Vercel Dashboard:**
   - Go to your project in Vercel dashboard
   - Settings → Environment Variables
   - Add: `VITE_GROQ_API_KEY` = `your_api_key_here`
   - Add: `VITE_AI_MODEL` = `llama-3.3-70b-versatile`
   - Redeploy: `vercel --prod`

---

### Method 2: Deploy via GitHub (Recommended for teams)

1. **Create GitHub repo** and push code
2. **Connect to Vercel:**
   - Go to https://vercel.com/new
   - Import your GitHub repo
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Add Environment Variables:**
   - In project settings → Environment Variables
   - Add `VITE_GROQ_API_KEY`
   - Add `VITE_AI_MODEL`
4. **Deploy** — Auto-deploys on every push!

---

## 🌐 Step 3: Deploy to Netlify (Alternative)

1. **Create netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Deploy via Netlify CLI:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

3. **Add Environment Variables:**
   - Netlify Dashboard → Site Settings → Environment Variables
   - Add `VITE_GROQ_API_KEY`
   - Add `VITE_AI_MODEL`

---

## 🧪 Step 4: Local Testing (Optional)

Before deploying, test locally:

1. **Create .env file** (copy from .env.example):
```bash
cp .env.example .env
```

2. **Add your API key in .env:**
```
VITE_GROQ_API_KEY=gsk_your_key_here
VITE_AI_MODEL=llama-3.3-70b-versatile
```

3. **Install dependencies:**
```bash
npm install
```

4. **Run dev server:**
```bash
npm run dev
```

5. **Open:** http://localhost:5173

---

## 🔒 Security Best Practices

### ⚠️ NEVER commit .env file to Git!
Add to `.gitignore`:
```
.env
.env.local
node_modules/
dist/
```

### API Key Safety:
- ✅ DO: Use environment variables
- ✅ DO: Set API key only in hosting platform (Vercel/Netlify)
- ❌ DON'T: Hardcode API key in source code
- ❌ DON'T: Commit .env to GitHub
- ❌ DON'T: Share API key publicly

### Rate Limiting (Optional but Recommended):
For production, consider adding rate limiting to prevent abuse:
- Use Vercel Edge Middleware
- Or implement backend proxy with rate limiting
- Current setup: Direct client-side API calls (simple but less secure for public apps)

---

## 💡 Production Optimization Tips

### 1. **Data Persistence:**
The app uses `window.storage` (polyfilled with localStorage). For production:
- Current: **localStorage** (browser-based, free)
- Upgrade to: **Supabase/Firebase** (cloud-based, better sync)

### 2. **Multi-User Support:**
Current version: Single-user (data on device)
To add multi-user:
- Add authentication (Firebase Auth, Clerk, Auth0)
- Move data to cloud database (Supabase, Firebase)
- Share wedding data with family members

### 3. **PWA (Progressive Web App):**
Make it installable on mobile:
```bash
npm install vite-plugin-pwa
```

Add to vite.config.js:
```javascript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Phere',
        short_name: 'Phere',
        description: 'Smart Wedding Expense Tracker',
        theme_color: '#8B1A3A',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

---

## 📱 App Features Checklist

- ✅ Dashboard with budget overview
- ✅ Expense tracking (kharcha)
- ✅ Shagun/gift tracking
- ✅ Lena-Dena (receivables/payables)
- ✅ Vendor management
- ✅ Guest list with RSVP
- ✅ AI Assistant (direct expense addition via natural language)
- ✅ Excel export with formulas (dashboard auto-calculates)
- ✅ Excel import (bulk upload)
- ✅ Sample template download
- ✅ Mobile-responsive design
- ✅ Maroon + gold Indian wedding theme
- ✅ Data persistence
- ✅ Backup/restore functionality

---

## 🆘 Troubleshooting

### "API key not found" error:
- Check environment variable name: `VITE_GROQ_API_KEY` (exact spelling)
- Redeploy after adding environment variables
- Clear browser cache and reload

### AI not responding:
- Verify API key is valid at https://console.groq.com/keys
- Check browser console for errors (F12)
- Ensure you haven't exceeded Groq rate limits

### Build fails:
- Check Node.js version (need 18+)
- Delete `node_modules` and run `npm install` again
- Verify all dependencies in package.json

### Data not saving:
- localStorage may be full — clear old data
- Or implement cloud database (Supabase/Firebase)

---

## 📊 Cost Estimation

**Hosting:** FREE (Vercel/Netlify free tier)
**AI API:** FREE (Groq free tier — generous limits)
**Database:** FREE (localStorage) or ~₹0-500/month (Supabase free tier)

**Total:** ₹0/month for a full wedding planning app! 🎉

---

## 🎨 Customization Ideas

1. **Change brand colors:** Edit hex values in code (`#8B1A3A`, `#C9A961`)
2. **Add logo:** Replace `<Logo>` component with your own
3. **Custom categories:** Modify `CATEGORIES` array
4. **Multi-language:** Add Hindi/Gujarati translations
5. **WhatsApp integration:** Add share buttons
6. **Payment reminders:** Use email/SMS APIs

---

## 📞 Support & Contact

**App Name:** Phere (फेरे)
**Tagline:** Har Rupaya, Har Rishta
**Version:** 3.0
**Tech Stack:** React + Vite + Tailwind CSS v4 + Recharts + XLSX + Groq AI

---

## 🚀 Next Steps

1. Get API key from Groq Console
2. Deploy to Vercel/Netlify
3. Add API key in environment variables
4. Share app link with family
5. Start tracking your wedding expenses! 💒

**Demo deployed URL example:** https://phere.vercel.app

---

Made with ❤️ for Indian weddings 🇮🇳
