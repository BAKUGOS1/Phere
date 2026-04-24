# Phere - फेरे

> **Har Rupaya, Har Rishta** — Your Smart Indian Wedding Expense Tracker with AI

![Version](https://img.shields.io/badge/version-3.0-8B1A3A)
![React](https://img.shields.io/badge/React-18-61DAFB)
![AI](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-C9A961)

---

## ✨ Features

### 📊 Comprehensive Tracking
- **Kharcha (Expenses)** — Track every rupee spent with categories, vendors, payment modes
- **Shagun** — Record gifts received from relatives & friends
- **Lena-Dena** — Manage receivables (paise lena hai) & payables (paise dena hai)
- **Vendors** — Contact directory with payment tracking
- **Guests** — RSVP tracking, accommodation management
- **Dashboard** — Visual analytics with charts, budget overview

### 🤖 AI Assistant (Powered by Groq + LLaMA 3.3)
- **Natural Language Entry:** Just say "50000 mandap ka advance diya" — AI adds it automatically!
- **Hinglish Support:** Speak in natural Hindi+English mix
- **Smart Queries:** Ask "Decoration pe kitna kharcha?" or "Pending payments kya hain?"
- **Direct Actions:** Add expenses, shagun, lena-dena just by chatting

### 📈 Smart Analytics
- Real-time budget tracking with formulas
- Category-wise breakdown (pie charts)
- Payment mode analysis (bar charts)
- Net position calculation: (Shagun + Lena) - (Expenses + Dena)
- Pending payment alerts

### 📤 Export & Import
- **Excel Export** with formulas (Dashboard auto-calculates in Excel!)
- **Excel Import** — Bulk upload all data
- **Sample Template** download for quick start
- **Backup/Restore** — JSON export/import

### 📱 Mobile-First Design
- Responsive layout for phone/tablet/desktop
- Bottom navigation on mobile
- Touch-friendly buttons
- Works offline (after first load)

### 🎨 Indian Wedding Theme
- Maroon & gold color palette
- Elegant typography (Cormorant + Manrope)
- Cultural icons (🎁, 💍, 🏛️, etc.)
- Mandala-inspired backgrounds

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add .env file
cp .env.example .env
# Edit .env and add your Groq API key

# 3. Run locally
npm run dev

# 4. Deploy to Vercel
vercel
```

**Get your Groq API key at:** https://console.groq.com/keys

---

## 📦 What's Included

```
Phere/
├── public/
│   ├── favicon.svg           # Heart-ledger logo
│   └── manifest.json         # PWA manifest
├── src/
│   ├── components/
│   │   └── ErrorBoundary.jsx  # Crash recovery
│   ├── lib/
│   │   ├── constants.js       # BRAND, CATEGORIES, AI_TOOLS
│   │   ├── helpers.js         # fmt, fmtFull, today, newId
│   │   └── storage.js         # Storage abstraction
│   ├── main.jsx               # Entry point + ErrorBoundary
│   └── index.css              # Tailwind CSS
├── ShaadiKhata.jsx            # Main app component (legacy name)
├── index.html                 # HTML template + PWA
├── package.json               # Dependencies
├── vite.config.js             # Build config (Tailwind v4)
├── .env.example               # API key template
├── .gitignore                 # Security
├── DEPLOYMENT_GUIDE.md        # Step-by-step deployment
└── README.md                  # This file
```

---

## 🔑 API Key Setup

1. Get key from: https://console.groq.com/keys
2. Create `.env` file:
   ```
   VITE_GROQ_API_KEY=gsk_your_key_here
   VITE_AI_MODEL=llama-3.3-70b-versatile
   ```
3. **Never commit `.env` to Git!**

---

## 💰 Cost Estimate

| Service | Cost |
|---------|------|
| Vercel/Netlify Hosting | **FREE** |
| Groq AI API | **FREE** (generous free tier) |
| Database (localStorage) | **FREE** |
| **Total** | **₹0/month** 🎉 |

---

## 🛠️ Tech Stack

- **Frontend:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **Icons:** Lucide React
- **Excel:** SheetJS (XLSX)
- **AI:** Groq API (LLaMA 3.3 70B Versatile)
- **Storage:** localStorage (via window.storage polyfill)

---

## 📸 Screenshots

### Dashboard
![Dashboard with budget overview, pie charts, analytics]

### AI Assistant
![Natural language expense entry in Hinglish]

### Excel Export
![Fully formulated Excel file with auto-calculations]

---

## 🎯 Use Cases

Perfect for:
- 👰 **Bride & Groom** — Track your entire wedding budget
- 👨‍👩‍👧 **Parents** — Manage family contributions & expenses
- 💼 **Wedding Planners** — Professional expense tracking for clients
- 👥 **Joint Families** — Collaborative budget management

---

## 🔐 Security & Privacy

- ✅ All data stored locally (localStorage)
- ✅ No user tracking or analytics
- ✅ API key stored in environment variables only
- ✅ `.env` files excluded from Git (via .gitignore)
- ⚠️ For production: Consider adding authentication (Firebase/Clerk)

---

## 🤝 Contributing

Ideas for improvement:
- [ ] Multi-user authentication (Firebase/Auth0)
- [ ] Cloud sync (Supabase/Firebase)
- [ ] WhatsApp sharing integration
- [ ] Payment reminders via email/SMS
- [ ] Multiple language support (Hindi, Gujarati, Tamil, etc.)
- [ ] PWA for mobile app installation
- [ ] Dark mode theme

---

## 📄 License

MIT License — Free to use, modify, and distribute!

---

## 🙏 Credits

- **Built for Indian weddings** with ❤️
- **AI powered by** [Groq](https://groq.com/) + [Meta LLaMA](https://llama.meta.com/)
- **Excel handling by** [SheetJS](https://sheetjs.com/)
- **Icons by** [Lucide](https://lucide.dev/)

---

## 📞 Support

- 📖 Read **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for setup help
- 🐛 Report bugs via GitHub Issues

---

**Made with ❤️ for Indian weddings** 🇮🇳

**शादी मुबारक हो!** 💒✨
