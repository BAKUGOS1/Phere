import { useState, useEffect, useRef, useMemo } from 'react';
import SettingsPage from './src/components/SettingsPage.jsx';
import { moveToTrash } from './src/lib/storage.js';
import { useAuth } from './src/context/AuthContext.jsx';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Home, Receipt, Gift, Users, Phone, Sparkles, Plus,
  Search, Edit2, Trash2, Send, Download, Upload, X,
  Calendar, IndianRupee, AlertCircle, TrendingUp, Check,
  Menu, Settings, Heart, ChevronRight, Loader2, BarChart3,
  Wallet, Clock, PartyPopper, UserPlus, FileText, Save,
  ArrowDownLeft, ArrowUpRight, FileSpreadsheet, Bot, BookOpen
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ============ BRAND ============
const BRAND = {
  name: 'Phere',
  nameHindi: 'फेरे',
  tagline: 'Har Rupaya, Har Rishta',
  storage: 'phere-v3'
};

const CATEGORIES = [
  { name: 'Venue/Hall', color: '#8B1A3A', icon: '🏛️' },
  { name: 'Catering/Khana', color: '#C9A961', icon: '🍽️' },
  { name: 'Decoration', color: '#D4756E', icon: '🌸' },
  { name: 'Photography', color: '#6B4C93', icon: '📸' },
  { name: 'Clothes - Dulhan', color: '#E8859B', icon: '👰' },
  { name: 'Clothes - Dulha', color: '#5B7FA6', icon: '🤵' },
  { name: 'Jewelry/Zewar', color: '#B8860B', icon: '💎' },
  { name: 'Invitation Cards', color: '#A0522D', icon: '💌' },
  { name: 'Transport/Gaadi', color: '#708090', icon: '🚗' },
  { name: 'Music/DJ/Band', color: '#9370DB', icon: '🎵' },
  { name: 'Mehendi', color: '#8B4513', icon: '🌿' },
  { name: 'Sangeet/Haldi', color: '#DAA520', icon: '💃' },
  { name: 'Priest/Pandit', color: '#CD853F', icon: '🕉️' },
  { name: 'Gifts/Return Gifts', color: '#FF69B4', icon: '🎁' },
  { name: 'Makeup/Beauty', color: '#FF8C69', icon: '💄' },
  { name: 'Miscellaneous', color: '#696969', icon: '📦' }
];

// ============ HELPERS ============
const fmt = (n) => {
  const num = Number(n) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const fmtFull = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;
const today = () => new Date().toISOString().split('T')[0];
const newId = () => Date.now() + Math.floor(Math.random() * 1000);

const defaultData = {
  expenses: [],
  shagun: [],
  vendors: [],
  guests: [],
  lena: [],   // Receivables — paise jo humein milne hain
  dena: [],   // Payables — paise jo humein dene hain
  settings: { coupleName: '', weddingDate: '', totalBudget: 1000000 }
};

// ============ AI TOOLS (function calling) ============
const AI_TOOLS = [
  {
    name: 'add_expense',
    description: 'Add a new wedding expense (kharcha). Use when user mentions they spent money or paid someone.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: `One of: ${CATEGORIES.map(c => c.name).join(', ')}` },
        description: { type: 'string', description: 'Short description of the expense' },
        amount: { type: 'number', description: 'Amount in INR' },
        vendor: { type: 'string', description: 'Vendor or shop name (optional)' },
        status: { type: 'string', enum: ['Paid', 'Pending'] },
        paymentMode: { type: 'string', enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card', 'Debit Card'] },
        paidBy: { type: 'string', description: 'Person who paid (e.g. Papa, Self)' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        dueDate: { type: 'string', description: 'Due date if status is Pending, YYYY-MM-DD' }
      },
      required: ['category', 'description', 'amount']
    }
  },
  {
    name: 'add_shagun',
    description: 'Add a shagun/gift received from someone at the wedding.',
    input_schema: {
      type: 'object',
      properties: {
        giverName: { type: 'string', description: 'Who gave the shagun' },
        amount: { type: 'number', description: 'Amount in INR' },
        relationship: { type: 'string', description: 'Relationship (e.g. Mama, Chacha, Friend)' },
        side: { type: 'string', enum: ['Dulhan', 'Dulha', 'Both'] },
        mode: { type: 'string', enum: ['Cash', 'UPI', 'Cheque', 'Gift Item'] },
        giftItem: { type: 'string', description: 'If mode is Gift Item, what was given' },
        date: { type: 'string', description: 'Date YYYY-MM-DD' }
      },
      required: ['giverName', 'amount']
    }
  },
  {
    name: 'add_lena',
    description: 'Add a receivable — money someone owes the user (paise jo humein milne hain).',
    input_schema: {
      type: 'object',
      properties: {
        person: { type: 'string', description: 'Person who owes money' },
        phone: { type: 'string' },
        amount: { type: 'number' },
        purpose: { type: 'string', description: 'Why — e.g. advance wapas, udhaar' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        dueDate: { type: 'string', description: 'YYYY-MM-DD' }
      },
      required: ['person', 'amount']
    }
  },
  {
    name: 'add_dena',
    description: 'Add a payable — money the user owes someone (paise jo humein dene hain).',
    input_schema: {
      type: 'object',
      properties: {
        person: { type: 'string', description: 'Person to whom money is owed' },
        phone: { type: 'string' },
        amount: { type: 'number' },
        purpose: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        dueDate: { type: 'string', description: 'YYYY-MM-DD' }
      },
      required: ['person', 'amount']
    }
  },
  {
    name: 'query_data',
    description: 'Look up specific information from the wedding data. Use for questions like "kitna X diya", "pending kya hai", etc.',
    input_schema: {
      type: 'object',
      properties: {
        query_type: {
          type: 'string',
          enum: ['category_total', 'vendor_total', 'giver_total', 'pending_payments', 'summary', 'lena_pending', 'dena_pending']
        },
        filter: { type: 'string', description: 'Optional filter value (category name, vendor name, etc.)' }
      },
      required: ['query_type']
    }
  }
];

// ============ LOGO ============
function Logo({ size = 40 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skHeart" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B1A3A" />
          <stop offset="100%" stopColor="#C9A961" />
        </linearGradient>
      </defs>
      <path d="M24 42 C8 30, 4 22, 4 14 C4 8, 9 4, 14 4 C18 4, 22 7, 24 11 C26 7, 30 4, 34 4 C39 4, 44 8, 44 14 C44 22, 40 30, 24 42 Z"
            fill="url(#skHeart)" />
      <line x1="12" y1="15" x2="36" y2="15" stroke="white" strokeWidth="1" opacity="0.45" />
      <line x1="14" y1="20" x2="34" y2="20" stroke="white" strokeWidth="1" opacity="0.45" />
      <line x1="16" y1="25" x2="32" y2="25" stroke="white" strokeWidth="1" opacity="0.45" />
    </svg>
  );
}

// ============ MAIN APP ============
export default function Phere() {
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState(null);

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(BRAND.storage);
        if (r && r.value) {
          const parsed = JSON.parse(r.value);
          setData({ ...defaultData, ...parsed });
        }
      } catch (e) { /* fresh start */ }
      setLoaded(true);
    })();
  }, []);

  // Save to storage
  useEffect(() => {
    if (!loaded) return;
    window.storage.set(BRAND.storage, JSON.stringify(data)).catch(() => {});
  }, [data, loaded]);

  const updateData = (updater) => setData((prev) => updater(prev));

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF8EE' }}>
        <div className="text-center">
          <Logo size={64} />
          <p className="mt-3 font-body text-sm" style={{ color: '#8B1A3A' }}>Loading khata...</p>
        </div>
      </div>
    );
  }

  const { user } = useAuth();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'expenses', label: 'Kharcha', icon: Receipt },
    { id: 'shagun', label: 'Shagun', icon: Gift },
    { id: 'lenadena', label: 'Lena-Dena', icon: BookOpen },
    { id: 'vendors', label: 'Vendors', icon: Phone },
    { id: 'guests', label: 'Guests', icon: Users },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen" style={{ background: '#FDF8EE', fontFamily: 'Manrope, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-body { font-family: 'Manrope', system-ui, sans-serif; }
        .mandala-bg {
          background-image: radial-gradient(circle at 20% 10%, rgba(201, 169, 97, 0.08) 0%, transparent 40%),
                            radial-gradient(circle at 80% 90%, rgba(139, 26, 58, 0.06) 0%, transparent 40%);
        }
        .card-shadow { box-shadow: 0 2px 20px rgba(139, 26, 58, 0.08); }
        .gold-border { border: 1px solid rgba(201, 169, 97, 0.3); }
        input:focus, textarea:focus, select:focus { outline: 2px solid rgba(139, 26, 58, 0.3); outline-offset: 1px; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #C9A961; border-radius: 3px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease-out; }
        .slide-down { animation: slideDown 0.3s ease-out; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-body slide-down card-shadow"
             style={{ background: toast.type === 'error' ? '#C43E3E' : '#4A7C59', color: 'white' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 mandala-bg border-b gold-border" style={{ background: 'rgba(253, 248, 238, 0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div>
              <h1 className="font-display text-xl md:text-2xl font-semibold leading-none" style={{ color: '#8B1A3A' }}>
                {BRAND.name}
              </h1>
              <p className="text-xs font-body mt-0.5" style={{ color: '#6B5050' }}>
                {data.settings.coupleName || BRAND.tagline}
              </p>
            </div>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="md:hidden p-2 rounded-lg" style={{ background: 'rgba(139, 26, 58, 0.1)' }}>
            <Menu size={20} style={{ color: '#8B1A3A' }} />
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
                  style={{
                    background: active ? '#8B1A3A' : 'transparent',
                    color: active ? 'white' : '#2B1810'
                  }}>
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
        {showMenu && (
          <div className="md:hidden border-t gold-border px-4 py-2 grid grid-cols-4 gap-2" style={{ background: '#FDF8EE' }}>
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => { setTab(t.id); setShowMenu(false); }}
                  className="p-2 rounded-lg flex flex-col items-center gap-1 text-xs font-medium"
                  style={{
                    background: active ? '#8B1A3A' : 'rgba(201, 169, 97, 0.1)',
                    color: active ? 'white' : '#2B1810'
                  }}>
                  <Icon size={18} />
                  <span className="text-[10px]">{t.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="fade-up">
          {tab === 'dashboard' && <Dashboard data={data} setTab={setTab} updateData={updateData} />}
          {tab === 'expenses' && <Expenses data={data} updateData={updateData} showToast={showToast} />}
          {tab === 'shagun' && <Shagun data={data} updateData={updateData} showToast={showToast} />}
          {tab === 'lenadena' && <LenaDena data={data} updateData={updateData} showToast={showToast} />}
          {tab === 'vendors' && <Vendors data={data} updateData={updateData} showToast={showToast} />}
          {tab === 'guests' && <Guests data={data} updateData={updateData} showToast={showToast} />}
          {tab === 'ai' && <AIAssistant data={data} updateData={updateData} showToast={showToast} setTab={setTab} />}
          {tab === 'settings' && <SettingsPage data={data} updateData={updateData} showToast={showToast} />}
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex overflow-x-auto gap-0 border-t gold-border scrollbar-thin"
           style={{ background: 'rgba(253, 248, 238, 0.98)', backdropFilter: 'blur(10px)' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="py-2 px-3 flex flex-col items-center gap-0.5 transition-all flex-shrink-0 min-w-[52px]"
              style={{ color: active ? '#8B1A3A' : '#6B5050' }}>
              <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[8px] font-semibold leading-none">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ============ DASHBOARD ============
function Dashboard({ data, setTab, updateData }) {
  const [editSettings, setEditSettings] = useState(false);

  const totalSpent = data.expenses.filter(e => e.status === 'Paid').reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalPending = data.expenses.filter(e => e.status === 'Pending').reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalShagun = data.shagun.reduce((s, g) => s + Number(g.amount || 0), 0);
  const totalLena = data.lena.filter(x => x.status !== 'Settled').reduce((s, x) => s + (Number(x.amount) - Number(x.paidAmount || 0)), 0);
  const totalDena = data.dena.filter(x => x.status !== 'Settled').reduce((s, x) => s + (Number(x.amount) - Number(x.paidAmount || 0)), 0);
  const budget = Number(data.settings.totalBudget || 0);
  const remaining = budget - totalSpent - totalPending;
  const netPosition = totalShagun + totalLena - totalSpent - totalPending - totalDena;

  const catData = CATEGORIES.map(c => {
    const amt = data.expenses
      .filter(e => e.category === c.name)
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    return { name: c.name, value: amt, color: c.color };
  }).filter(c => c.value > 0);

  const upcoming = data.expenses
    .filter(e => e.status === 'Pending' && e.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const daysToWedding = data.settings.weddingDate
    ? Math.ceil((new Date(data.settings.weddingDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  // Payment mode breakdown
  const paymentModeData = useMemo(() => {
    const modes = {};
    data.expenses.forEach(e => {
      if (e.status === 'Paid' && e.paymentMode) {
        modes[e.paymentMode] = (modes[e.paymentMode] || 0) + Number(e.amount || 0);
      }
    });
    return Object.entries(modes).map(([name, value]) => ({ name, value }));
  }, [data.expenses]);

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="rounded-2xl p-6 md:p-8 relative overflow-hidden card-shadow"
           style={{ background: 'linear-gradient(135deg, #8B1A3A 0%, #5A0E26 100%)', color: 'white' }}>
        <div className="absolute top-0 right-0 opacity-10">
          <Heart size={200} fill="white" strokeWidth={0} />
        </div>
        <div className="relative z-10">
          <p className="text-xs md:text-sm font-body opacity-80 uppercase tracking-wider mb-2">Wedding Budget Overview</p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-1">{fmtFull(budget)}</h2>
          <p className="font-body text-sm opacity-80">Total Planned Budget</p>
          {daysToWedding !== null && daysToWedding >= 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <PartyPopper size={16} />
              <span className="text-sm font-body">{daysToWedding} days to go!</span>
            </div>
          )}
          <button onClick={() => setEditSettings(true)}
            className="mt-4 ml-2 text-xs underline opacity-70 hover:opacity-100 font-body">
            Edit Settings
          </button>
        </div>
      </div>

      {editSettings && (
        <SettingsModal data={data} updateData={updateData} onClose={() => setEditSettings(false)} />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Spent Till Now" value={totalSpent} icon={Wallet} color="#8B1A3A" />
        <StatCard label="Pending Payments" value={totalPending} icon={Clock} color="#D4756E" />
        <StatCard label="Shagun Received" value={totalShagun} icon={Gift} color="#C9A961" />
        <StatCard label={remaining >= 0 ? "Remaining Budget" : "Over Budget"} value={Math.abs(remaining)}
                  icon={TrendingUp} color={remaining >= 0 ? "#4A7C59" : "#C43E3E"} />
      </div>

      {/* Lena-Dena Strip */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div onClick={() => setTab('lenadena')}
             className="rounded-2xl p-4 md:p-5 gold-border card-shadow cursor-pointer" style={{ background: 'white' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wider font-body" style={{ color: '#6B5050' }}>Lena Hai</p>
            <ArrowDownLeft size={18} style={{ color: '#4A7C59' }} />
          </div>
          <p className="font-display text-xl md:text-2xl font-semibold" style={{ color: '#4A7C59' }}>{fmtFull(totalLena)}</p>
          <p className="text-xs font-body mt-1" style={{ color: '#6B5050' }}>
            {data.lena.filter(x => x.status !== 'Settled').length} log udhaar
          </p>
        </div>
        <div onClick={() => setTab('lenadena')}
             className="rounded-2xl p-4 md:p-5 gold-border card-shadow cursor-pointer" style={{ background: 'white' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wider font-body" style={{ color: '#6B5050' }}>Dena Hai</p>
            <ArrowUpRight size={18} style={{ color: '#C43E3E' }} />
          </div>
          <p className="font-display text-xl md:text-2xl font-semibold" style={{ color: '#C43E3E' }}>{fmtFull(totalDena)}</p>
          <p className="text-xs font-body mt-1" style={{ color: '#6B5050' }}>
            {data.dena.filter(x => x.status !== 'Settled').length} log ko
          </p>
        </div>
      </div>

      {/* Net Position */}
      <div className="rounded-2xl p-5 md:p-6 gold-border card-shadow" style={{ background: 'white' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wider font-body" style={{ color: '#6B5050' }}>Net Position</p>
            <h3 className="font-display text-2xl md:text-3xl font-semibold mt-1"
                style={{ color: netPosition >= 0 ? '#4A7C59' : '#C43E3E' }}>
              {netPosition >= 0 ? '+' : ''}{fmtFull(netPosition)}
            </h3>
            <p className="text-xs font-body mt-1" style={{ color: '#6B5050' }}>
              (Shagun + Lena) − (Expenses + Dena)
            </p>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
               style={{ background: netPosition >= 0 ? 'rgba(74, 124, 89, 0.1)' : 'rgba(196, 62, 62, 0.1)' }}>
            {netPosition >= 0 ? <TrendingUp style={{ color: '#4A7C59' }} /> : <AlertCircle style={{ color: '#C43E3E' }} />}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Category Pie */}
        <div className="rounded-2xl p-5 gold-border card-shadow" style={{ background: 'white' }}>
          <h3 className="font-display text-xl font-semibold mb-4" style={{ color: '#8B1A3A' }}>
            Category-wise Kharcha
          </h3>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                     outerRadius={85} innerRadius={45} paddingAngle={2}>
                  {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtFull(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-sm font-body" style={{ color: '#6B5050' }}>
              No expenses yet. Add some to see the breakdown!
            </div>
          )}
          {catData.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {catData.slice(0, 6).map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs font-body">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }}></span>
                  <span style={{ color: '#2B1810' }}>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Mode Bar */}
        <div className="rounded-2xl p-5 gold-border card-shadow" style={{ background: 'white' }}>
          <h3 className="font-display text-xl font-semibold mb-4" style={{ color: '#8B1A3A' }}>
            Payment Mode Breakdown
          </h3>
          {paymentModeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentModeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B5050' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B5050' }} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={(v) => fmtFull(v)} />
                <Bar dataKey="value" fill="#8B1A3A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-sm font-body" style={{ color: '#6B5050' }}>
              No paid expenses yet.
            </div>
          )}
        </div>
      </div>

      {/* Pending Payments */}
      <div className="rounded-2xl p-5 gold-border card-shadow" style={{ background: 'white' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold" style={{ color: '#8B1A3A' }}>
            Pending Payments
          </h3>
          <AlertCircle size={18} style={{ color: '#D4756E' }} />
        </div>
        {upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg"
                   style={{ background: 'rgba(212, 117, 110, 0.08)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-body truncate" style={{ color: '#2B1810' }}>
                    {e.vendor || e.description}
                  </p>
                  <p className="text-xs font-body" style={{ color: '#6B5050' }}>
                    Due: {e.dueDate} · {e.category}
                  </p>
                </div>
                <span className="font-semibold font-body text-sm" style={{ color: '#C43E3E' }}>
                  {fmt(e.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-body text-center py-6" style={{ color: '#6B5050' }}>
            No pending payments 🎉
          </p>
        )}
      </div>

      {/* Data Manager */}
      <DataManager data={data} updateData={updateData} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl p-4 gold-border card-shadow" style={{ background: 'white' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wider font-body" style={{ color: '#6B5050' }}>{label}</p>
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
             style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p className="font-display text-xl md:text-2xl font-semibold" style={{ color }}>
        {fmt(value)}
      </p>
    </div>
  );
}

// ============ EXPENSES ============
function Expenses({ data, updateData, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = data.expenses
    .filter(e => !search || (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
                 (e.vendor || '').toLowerCase().includes(search.toLowerCase()))
    .filter(e => !filterCat || e.category === filterCat)
    .filter(e => !filterStatus || e.status === filterStatus)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const save = (exp) => {
    updateData(d => {
      if (editing) return { ...d, expenses: d.expenses.map(x => x.id === exp.id ? exp : x) };
      return { ...d, expenses: [...d.expenses, { ...exp, id: newId() }] };
    });
    showToast(editing ? 'Kharcha updated!' : 'Kharcha added!');
    setShowForm(false);
    setEditing(null);
  };

  const del = async (id) => {
    if (confirm('Delete karna hai? (Trash mein jayega, recover kar sakte ho)')) {
      const item = data.expenses.find(x => x.id === id);
      if (item && user) {
        await moveToTrash(user.id, 'expense', item);
      }
      updateData(d => ({ ...d, expenses: d.expenses.filter(x => x.id !== id) }));
      showToast('Moved to trash');
    }
  };

  const togglePaid = (id) => {
    updateData(d => ({
      ...d,
      expenses: d.expenses.map(x => x.id === id ? { ...x, status: x.status === 'Paid' ? 'Pending' : 'Paid' } : x)
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold" style={{ color: '#8B1A3A' }}>
            Kharcha
          </h2>
          <p className="text-sm font-body" style={{ color: '#6B5050' }}>
            Total: {data.expenses.length} entries
          </p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 text-white font-body"
          style={{ background: '#8B1A3A' }}>
          <Plus size={16} /> Add Kharcha
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-2">
        <div className="relative md:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5050' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg gold-border text-sm font-body"
            style={{ background: 'white' }} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2.5 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.name}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }}>
          <option value="">All Status</option>
          <option>Paid</option>
          <option>Pending</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl gold-border" style={{ background: 'white' }}>
          <Receipt size={48} style={{ color: '#C9A961' }} className="mx-auto mb-3 opacity-50" />
          <p className="font-body" style={{ color: '#6B5050' }}>
            {data.expenses.length === 0 ? 'No expenses yet. Add your first kharcha!' : 'No results found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(e => {
            const cat = CATEGORIES.find(c => c.name === e.category);
            return (
              <div key={e.id} className="rounded-xl p-4 gold-border card-shadow" style={{ background: 'white' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg"
                         style={{ background: `${cat?.color || '#696969'}20` }}>
                      {cat?.icon || '📦'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold font-body text-sm md:text-base" style={{ color: '#2B1810' }}>
                        {e.description}
                      </p>
                      <p className="text-xs font-body mt-0.5" style={{ color: '#6B5050' }}>
                        {e.category} · {e.date}{e.vendor && ` · ${e.vendor}`}
                      </p>
                      {e.paidBy && <p className="text-xs font-body mt-0.5" style={{ color: '#6B5050' }}>
                        Paid by: {e.paidBy} ({e.paymentMode})
                      </p>}
                      {e.notes && <p className="text-xs font-body mt-1 italic" style={{ color: '#6B5050' }}>{e.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-lg md:text-xl font-semibold" style={{ color: '#8B1A3A' }}>
                      {fmt(e.amount)}
                    </p>
                    <button onClick={() => togglePaid(e.id)}
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-body mt-1"
                      style={{
                        background: e.status === 'Paid' ? 'rgba(74, 124, 89, 0.15)' : 'rgba(212, 117, 110, 0.15)',
                        color: e.status === 'Paid' ? '#4A7C59' : '#C43E3E'
                      }}>
                      {e.status}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setEditing(e); setShowForm(true); }}
                    className="text-xs px-2 py-1 rounded flex items-center gap-1 font-body"
                    style={{ background: 'rgba(139, 26, 58, 0.1)', color: '#8B1A3A' }}>
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => del(e.id)}
                    className="text-xs px-2 py-1 rounded flex items-center gap-1 font-body"
                    style={{ background: 'rgba(196, 62, 62, 0.1)', color: '#C43E3E' }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ExpenseForm
          expense={editing}
          onSave={save}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function ExpenseForm({ expense, onSave, onClose }) {
  const [form, setForm] = useState(expense || {
    description: '', category: 'Venue/Hall', amount: '', vendor: '', vendorContact: '',
    status: 'Paid', paidBy: '', paymentMode: 'UPI', date: today(), dueDate: '', notes: ''
  });

  const handleSubmit = () => {
    if (!form.description || !form.amount) {
      alert('Description aur amount zaroori hai');
      return;
    }
    onSave({ ...form, id: expense?.id, amount: Number(form.amount) });
  };

  return (
    <Modal onClose={onClose} title={expense ? 'Edit Kharcha' : 'Add Kharcha'}>
      <div className="space-y-3">
        <Field label="Description *">
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Mandap booking advance"
            className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }}>
              {CATEGORIES.map(c => <option key={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vendor Name">
            <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })}
              placeholder="Royal Palace"
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
          <Field label="Vendor Contact">
            <input value={form.vendorContact} onChange={e => setForm({ ...form, vendorContact: e.target.value })}
              placeholder="Phone"
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹) *">
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="50000"
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }}>
              <option>Paid</option>
              <option>Pending</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Paid By">
            <input value={form.paidBy} onChange={e => setForm({ ...form, paidBy: e.target.value })}
              placeholder="Papa / Self"
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
          <Field label="Payment Mode">
            <select value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }}>
              <option>Cash</option><option>UPI</option><option>Bank Transfer</option>
              <option>Cheque</option><option>Credit Card</option><option>Debit Card</option>
            </select>
          </Field>
        </div>
        {form.status === 'Pending' && (
          <Field label="Due Date">
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
        )}
        <Field label="Notes">
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Extra note..." rows={2}
            className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body resize-none" style={{ background: 'white' }} />
        </Field>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm font-body"
            style={{ background: '#8B1A3A' }}>
            {expense ? 'Update' : 'Save'} Kharcha
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm font-body gold-border"
            style={{ background: 'white', color: '#6B5050' }}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============ SHAGUN ============
function Shagun({ data, updateData, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = data.shagun
    .filter(g => !search || (g.giverName || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = data.shagun.reduce((s, g) => s + Number(g.amount || 0), 0);

  const save = (g) => {
    updateData(d => {
      if (editing) return { ...d, shagun: d.shagun.map(x => x.id === g.id ? g : x) };
      return { ...d, shagun: [...d.shagun, { ...g, id: newId() }] };
    });
    showToast(editing ? 'Shagun updated!' : 'Shagun added!');
    setShowForm(false);
    setEditing(null);
  };

  const del = (id) => {
    if (confirm('Delete karna hai?')) {
      updateData(d => ({ ...d, shagun: d.shagun.filter(x => x.id !== id) }));
      showToast('Shagun deleted');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold" style={{ color: '#8B1A3A' }}>
            Shagun & Gifts
          </h2>
          <p className="text-sm font-body" style={{ color: '#6B5050' }}>
            Total: <span className="font-semibold" style={{ color: '#C9A961' }}>{fmtFull(total)}</span>
          </p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 text-white font-body"
          style={{ background: '#8B1A3A' }}>
          <Plus size={16} /> Add Shagun
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5050' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by giver..."
          className="w-full pl-9 pr-3 py-2.5 rounded-lg gold-border text-sm font-body"
          style={{ background: 'white' }} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl gold-border" style={{ background: 'white' }}>
          <Gift size={48} style={{ color: '#C9A961' }} className="mx-auto mb-3 opacity-50" />
          <p className="font-body" style={{ color: '#6B5050' }}>No shagun entries yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(g => (
            <div key={g.id} className="rounded-xl p-4 gold-border card-shadow" style={{ background: 'white' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg"
                       style={{ background: 'rgba(201, 169, 97, 0.2)' }}>
                    🎁
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold font-body text-sm md:text-base" style={{ color: '#2B1810' }}>
                      {g.giverName}
                    </p>
                    <p className="text-xs font-body mt-0.5" style={{ color: '#6B5050' }}>
                      {g.relationship} · {g.side} · {g.date}
                    </p>
                    {g.giftItem && <p className="text-xs font-body mt-1" style={{ color: '#6B5050' }}>🎀 {g.giftItem}</p>}
                    {g.notes && <p className="text-xs font-body mt-1 italic" style={{ color: '#6B5050' }}>{g.notes}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-display text-lg md:text-xl font-semibold" style={{ color: '#C9A961' }}>
                    {fmt(g.amount)}
                  </p>
                  <p className="text-[10px] font-body" style={{ color: '#6B5050' }}>{g.mode}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setEditing(g); setShowForm(true); }}
                  className="text-xs px-2 py-1 rounded flex items-center gap-1 font-body"
                  style={{ background: 'rgba(139, 26, 58, 0.1)', color: '#8B1A3A' }}>
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => del(g.id)}
                  className="text-xs px-2 py-1 rounded flex items-center gap-1 font-body"
                  style={{ background: 'rgba(196, 62, 62, 0.1)', color: '#C43E3E' }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ShagunForm item={editing} onSave={save} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}
    </div>
  );
}

function ShagunForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || {
    giverName: '', relationship: '', side: 'Dulhan', amount: '',
    mode: 'Cash', giftItem: '', date: today(), notes: ''
  });

  const handleSubmit = () => {
    if (!form.giverName || !form.amount) { alert('Name aur amount zaroori hai'); return; }
    onSave({ ...form, id: item?.id, amount: Number(form.amount) });
  };

  return (
    <Modal onClose={onClose} title={item ? 'Edit Shagun' : 'Add Shagun'}>
      <div className="space-y-3">
        <Field label="Giver Name *">
          <input value={form.giverName} onChange={e => setForm({ ...form, giverName: e.target.value })}
            placeholder="Mama ji" className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Relationship">
            <input value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })}
              placeholder="Mama" className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
          <Field label="Side">
            <select value={form.side} onChange={e => setForm({ ...form, side: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }}>
              <option>Dulhan</option><option>Dulha</option><option>Both</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹) *">
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
          <Field label="Mode">
            <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }}>
              <option>Cash</option><option>UPI</option><option>Cheque</option><option>Gift Item</option>
            </select>
          </Field>
        </div>
        <Field label="Date">
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
            className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
        </Field>
        {form.mode === 'Gift Item' && (
          <Field label="Gift Item Description">
            <input value={form.giftItem} onChange={e => setForm({ ...form, giftItem: e.target.value })}
              placeholder="Silver tray, saree..."
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
        )}
        <Field label="Notes">
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2} className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body resize-none" style={{ background: 'white' }} />
        </Field>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm font-body" style={{ background: '#8B1A3A' }}>
            {item ? 'Update' : 'Save'}
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm font-body gold-border"
            style={{ background: 'white', color: '#6B5050' }}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

// ============ LENA-DENA (Receivables & Payables) ============
function LenaDena({ data, updateData, showToast }) {
  const [subTab, setSubTab] = useState('lena');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [search, setSearch] = useState('');

  const items = data[subTab] || [];
  const filtered = items
    .filter(x => !search || (x.person || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.status !== 'Settled' && b.status === 'Settled') return -1;
      if (a.status === 'Settled' && b.status !== 'Settled') return 1;
      return new Date(b.date) - new Date(a.date);
    });

  const totalPending = items
    .filter(x => x.status !== 'Settled')
    .reduce((s, x) => s + (Number(x.amount) - Number(x.paidAmount || 0)), 0);

  const totalSettled = items
    .filter(x => x.status === 'Settled')
    .reduce((s, x) => s + Number(x.amount), 0);

  const save = (item) => {
    updateData(d => {
      const list = d[subTab] || [];
      if (editing) return { ...d, [subTab]: list.map(x => x.id === item.id ? item : x) };
      return { ...d, [subTab]: [...list, { ...item, id: newId() }] };
    });
    showToast(editing ? 'Updated!' : 'Entry added!');
    setShowForm(false);
    setEditing(null);
  };

  const del = (id) => {
    if (confirm('Delete karna hai?')) {
      updateData(d => ({ ...d, [subTab]: d[subTab].filter(x => x.id !== id) }));
      showToast('Deleted');
    }
  };

  const addPayment = (id, paidNow) => {
    updateData(d => ({
      ...d,
      [subTab]: d[subTab].map(x => {
        if (x.id !== id) return x;
        const newPaid = Number(x.paidAmount || 0) + Number(paidNow);
        const settled = newPaid >= Number(x.amount);
        return {
          ...x,
          paidAmount: newPaid,
          status: settled ? 'Settled' : 'Partial',
          settledDate: settled ? today() : x.settledDate
        };
      })
    }));
    showToast('Payment recorded!');
    setPayingId(null);
  };

  const markSettled = (id) => {
    updateData(d => ({
      ...d,
      [subTab]: d[subTab].map(x => x.id === id
        ? { ...x, status: 'Settled', paidAmount: x.amount, settledDate: today() }
        : x)
    }));
    showToast('Settled!');
  };

  const isLena = subTab === 'lena';
  const primaryColor = isLena ? '#4A7C59' : '#C43E3E';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold" style={{ color: '#8B1A3A' }}>
          Lena-Dena (Udhaari)
        </h2>
        <p className="text-sm font-body" style={{ color: '#6B5050' }}>
          Kisne paise dene hain, kisko dene hain — sab yahan
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 rounded-xl gold-border" style={{ background: 'white' }}>
        <button onClick={() => setSubTab('lena')}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold font-body flex items-center justify-center gap-2 transition-all"
          style={{
            background: subTab === 'lena' ? '#4A7C59' : 'transparent',
            color: subTab === 'lena' ? 'white' : '#6B5050'
          }}>
          <ArrowDownLeft size={16} /> Lena Hai (Receivable)
        </button>
        <button onClick={() => setSubTab('dena')}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold font-body flex items-center justify-center gap-2 transition-all"
          style={{
            background: subTab === 'dena' ? '#C43E3E' : 'transparent',
            color: subTab === 'dena' ? 'white' : '#6B5050'
          }}>
          <ArrowUpRight size={16} /> Dena Hai (Payable)
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 gold-border" style={{ background: 'white' }}>
          <p className="text-xs uppercase tracking-wider font-body" style={{ color: '#6B5050' }}>Pending</p>
          <p className="font-display text-xl md:text-2xl font-semibold mt-1" style={{ color: primaryColor }}>
            {fmtFull(totalPending)}
          </p>
          <p className="text-xs font-body mt-1" style={{ color: '#6B5050' }}>
            {items.filter(x => x.status !== 'Settled').length} entries
          </p>
        </div>
        <div className="rounded-xl p-4 gold-border" style={{ background: 'white' }}>
          <p className="text-xs uppercase tracking-wider font-body" style={{ color: '#6B5050' }}>Settled</p>
          <p className="font-display text-xl md:text-2xl font-semibold mt-1" style={{ color: '#6B5050' }}>
            {fmtFull(totalSettled)}
          </p>
          <p className="text-xs font-body mt-1" style={{ color: '#6B5050' }}>
            {items.filter(x => x.status === 'Settled').length} entries
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5050' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 text-white font-body"
          style={{ background: primaryColor }}>
          <Plus size={16} /> Add
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl gold-border" style={{ background: 'white' }}>
          <BookOpen size={48} style={{ color: '#C9A961' }} className="mx-auto mb-3 opacity-50" />
          <p className="font-body" style={{ color: '#6B5050' }}>
            {isLena ? 'Kisi se paise nahi aane — chalo!' : 'Kisi ko paise nahi dene — mast!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const remaining = Number(item.amount) - Number(item.paidAmount || 0);
            const percent = Math.round((Number(item.paidAmount || 0) / Number(item.amount)) * 100);
            return (
              <div key={item.id} className="rounded-xl p-4 gold-border card-shadow" style={{ background: 'white' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                         style={{ background: `${primaryColor}20` }}>
                      {isLena ? <ArrowDownLeft size={18} style={{ color: primaryColor }} /> : <ArrowUpRight size={18} style={{ color: primaryColor }} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold font-body text-sm md:text-base" style={{ color: '#2B1810' }}>
                        {item.person}
                      </p>
                      <p className="text-xs font-body mt-0.5" style={{ color: '#6B5050' }}>
                        {item.purpose} · {item.date}
                      </p>
                      {item.phone && <p className="text-xs font-body mt-0.5" style={{ color: '#6B5050' }}>
                        📞 {item.phone}
                      </p>}
                      {item.dueDate && item.status !== 'Settled' && (
                        <p className="text-xs font-body mt-0.5" style={{ color: '#C43E3E' }}>
                          Due: {item.dueDate}
                        </p>
                      )}
                      {item.notes && <p className="text-xs font-body mt-1 italic" style={{ color: '#6B5050' }}>{item.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-lg md:text-xl font-semibold" style={{ color: primaryColor }}>
                      {fmt(item.amount)}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-body"
                      style={{
                        background: item.status === 'Settled' ? 'rgba(107, 80, 80, 0.15)' :
                                    item.status === 'Partial' ? 'rgba(201, 169, 97, 0.2)' : 'rgba(212, 117, 110, 0.15)',
                        color: item.status === 'Settled' ? '#6B5050' :
                               item.status === 'Partial' ? '#C9A961' : '#C43E3E'
                      }}>
                      {item.status || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Progress bar if partial */}
                {item.status === 'Partial' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs font-body mb-1">
                      <span style={{ color: '#6B5050' }}>
                        Paid: {fmtFull(item.paidAmount || 0)} / {fmtFull(item.amount)}
                      </span>
                      <span style={{ color: primaryColor, fontWeight: 600 }}>{percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(201, 169, 97, 0.2)' }}>
                      <div className="h-full rounded-full" style={{ width: `${percent}%`, background: primaryColor }} />
                    </div>
                    <p className="text-xs font-body mt-1" style={{ color: '#C43E3E' }}>
                      Baki: {fmtFull(remaining)}
                    </p>
                  </div>
                )}

                {/* Pay now form */}
                {payingId === item.id && item.status !== 'Settled' && (
                  <div className="mt-3 p-3 rounded-lg flex gap-2" style={{ background: 'rgba(201, 169, 97, 0.08)' }}>
                    <input type="number" placeholder={`Max ${remaining}`} id={`pay-${item.id}`}
                      max={remaining}
                      className="flex-1 px-3 py-2 rounded gold-border text-sm font-body" style={{ background: 'white' }} />
                    <button onClick={() => {
                      const val = Number(document.getElementById(`pay-${item.id}`).value);
                      if (val > 0 && val <= remaining) addPayment(item.id, val);
                      else alert(`Amount 1 se ${remaining} ke beech me dalein`);
                    }}
                      className="px-3 py-2 rounded text-white text-xs font-semibold font-body"
                      style={{ background: primaryColor }}>
                      Record
                    </button>
                    <button onClick={() => setPayingId(null)}
                      className="px-3 py-2 rounded text-xs font-body gold-border" style={{ background: 'white' }}>
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex gap-2 mt-2 flex-wrap">
                  {item.status !== 'Settled' && (
                    <>
                      <button onClick={() => setPayingId(item.id)}
                        className="text-xs px-2 py-1 rounded flex items-center gap-1 font-body"
                        style={{ background: `${primaryColor}20`, color: primaryColor }}>
                        <IndianRupee size={12} /> Part Payment
                      </button>
                      <button onClick={() => markSettled(item.id)}
                        className="text-xs px-2 py-1 rounded flex items-center gap-1 font-body"
                        style={{ background: 'rgba(74, 124, 89, 0.15)', color: '#4A7C59' }}>
                        <Check size={12} /> Mark Settled
                      </button>
                    </>
                  )}
                  <button onClick={() => { setEditing(item); setShowForm(true); }}
                    className="text-xs px-2 py-1 rounded flex items-center gap-1 font-body"
                    style={{ background: 'rgba(139, 26, 58, 0.1)', color: '#8B1A3A' }}>
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => del(item.id)}
                    className="text-xs px-2 py-1 rounded flex items-center gap-1 font-body"
                    style={{ background: 'rgba(196, 62, 62, 0.1)', color: '#C43E3E' }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <LenaDenaForm item={editing} type={subTab} onSave={save} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}
    </div>
  );
}

function LenaDenaForm({ item, type, onSave, onClose }) {
  const isLena = type === 'lena';
  const [form, setForm] = useState(item || {
    person: '', phone: '', amount: '', paidAmount: 0, purpose: '',
    date: today(), dueDate: '', status: 'Pending', notes: ''
  });

  const handleSubmit = () => {
    if (!form.person || !form.amount) { alert('Name aur amount zaroori hai'); return; }
    onSave({ ...form, id: item?.id, amount: Number(form.amount), paidAmount: Number(form.paidAmount || 0) });
  };

  return (
    <Modal onClose={onClose} title={`${item ? 'Edit' : 'Add'} ${isLena ? 'Lena (Receivable)' : 'Dena (Payable)'}`}>
      <div className="space-y-3">
        <div className="rounded-lg p-3" style={{ background: isLena ? 'rgba(74, 124, 89, 0.08)' : 'rgba(196, 62, 62, 0.08)' }}>
          <p className="text-xs font-body" style={{ color: isLena ? '#4A7C59' : '#C43E3E' }}>
            {isLena ? '💰 Ye paise aapko wapas milenge' : '💸 Ye paise aapko kisi ko dene hain'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={isLena ? "Kisse Lena *" : "Kisko Dena *"}>
            <input value={form.person} onChange={e => setForm({ ...form, person: e.target.value })}
              placeholder="Name" className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="98XXX" className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
        </div>
        <Field label="Purpose / Reason">
          <input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}
            placeholder="Udhaar, advance, shagun ka return..."
            className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹) *">
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
          <Field label="Already Paid/Received">
            <input type="number" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })}
              placeholder="0" className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Entry Date">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
          <Field label="Due Date">
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2} className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body resize-none" style={{ background: 'white' }} />
        </Field>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm font-body"
            style={{ background: isLena ? '#4A7C59' : '#C43E3E' }}>
            {item ? 'Update' : 'Save'}
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm font-body gold-border"
            style={{ background: 'white', color: '#6B5050' }}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

// ============ VENDORS ============
function Vendors({ data, updateData, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const vendorStats = data.vendors.map(v => {
    const exps = data.expenses.filter(e => e.vendor === v.name);
    const totalAmt = exps.reduce((s, e) => s + Number(e.amount || 0), 0);
    const paid = exps.filter(e => e.status === 'Paid').reduce((s, e) => s + Number(e.amount || 0), 0);
    return { ...v, totalAmt, paid, due: totalAmt - paid, expenseCount: exps.length };
  });

  const save = (v) => {
    updateData(d => {
      if (editing) return { ...d, vendors: d.vendors.map(x => x.id === v.id ? v : x) };
      return { ...d, vendors: [...d.vendors, { ...v, id: newId() }] };
    });
    showToast(editing ? 'Vendor updated!' : 'Vendor added!');
    setShowForm(false);
    setEditing(null);
  };

  const del = (id) => {
    if (confirm('Delete karna hai?')) {
      updateData(d => ({ ...d, vendors: d.vendors.filter(x => x.id !== id) }));
      showToast('Deleted');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold" style={{ color: '#8B1A3A' }}>Vendors</h2>
          <p className="text-sm font-body" style={{ color: '#6B5050' }}>{data.vendors.length} vendors saved</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 text-white font-body"
          style={{ background: '#8B1A3A' }}>
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      {vendorStats.length === 0 ? (
        <div className="text-center py-16 rounded-2xl gold-border" style={{ background: 'white' }}>
          <Phone size={48} style={{ color: '#C9A961' }} className="mx-auto mb-3 opacity-50" />
          <p className="font-body" style={{ color: '#6B5050' }}>No vendors yet. Add contacts!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {vendorStats.map(v => (
            <div key={v.id} className="rounded-xl p-4 gold-border card-shadow" style={{ background: 'white' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold font-body text-base" style={{ color: '#2B1810' }}>{v.name}</p>
                  <p className="text-xs font-body" style={{ color: '#6B5050' }}>{v.category}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(v); setShowForm(true); }}
                    className="p-1.5 rounded" style={{ background: 'rgba(139, 26, 58, 0.1)' }}>
                    <Edit2 size={12} style={{ color: '#8B1A3A' }} />
                  </button>
                  <button onClick={() => del(v.id)}
                    className="p-1.5 rounded" style={{ background: 'rgba(196, 62, 62, 0.1)' }}>
                    <Trash2 size={12} style={{ color: '#C43E3E' }} />
                  </button>
                </div>
              </div>
              {v.phone && (
                <a href={`tel:${v.phone}`} className="text-xs font-body block" style={{ color: '#8B1A3A' }}>
                  📞 {v.phone}
                </a>
              )}
              {v.address && <p className="text-xs font-body mt-1" style={{ color: '#6B5050' }}>📍 {v.address}</p>}
              {v.notes && <p className="text-xs font-body mt-1 italic" style={{ color: '#6B5050' }}>{v.notes}</p>}

              {v.expenseCount > 0 && (
                <div className="mt-3 pt-3 border-t gold-border grid grid-cols-3 gap-1 text-center">
                  <div>
                    <p className="text-[10px] uppercase font-body" style={{ color: '#6B5050' }}>Total</p>
                    <p className="text-xs font-semibold font-body" style={{ color: '#2B1810' }}>{fmt(v.totalAmt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-body" style={{ color: '#4A7C59' }}>Paid</p>
                    <p className="text-xs font-semibold font-body" style={{ color: '#4A7C59' }}>{fmt(v.paid)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-body" style={{ color: '#C43E3E' }}>Due</p>
                    <p className="text-xs font-semibold font-body" style={{ color: '#C43E3E' }}>{fmt(v.due)}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <VendorForm item={editing} onSave={save} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}
    </div>
  );
}

function VendorForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || {
    name: '', category: 'Venue/Hall', phone: '', address: '', notes: ''
  });

  const handleSubmit = () => {
    if (!form.name) { alert('Name zaroori hai'); return; }
    onSave({ ...form, id: item?.id });
  };

  return (
    <Modal onClose={onClose} title={item ? 'Edit Vendor' : 'Add Vendor'}>
      <div className="space-y-3">
        <Field label="Vendor Name *">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
        </Field>
        <Field label="Category">
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }}>
            {CATEGORIES.map(c => <option key={c.name}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
        </Field>
        <Field label="Address">
          <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
            rows={2} className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body resize-none" style={{ background: 'white' }} />
        </Field>
        <Field label="Notes">
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2} className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body resize-none" style={{ background: 'white' }} />
        </Field>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm font-body" style={{ background: '#8B1A3A' }}>
            {item ? 'Update' : 'Save'}
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm font-body gold-border"
            style={{ background: 'white', color: '#6B5050' }}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

// ============ GUESTS ============
function Guests({ data, updateData, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = data.guests
    .filter(g => filter === 'all' || g.status === filter)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const counts = {
    all: data.guests.length,
    Confirmed: data.guests.filter(g => g.status === 'Confirmed').length,
    Pending: data.guests.filter(g => g.status === 'Pending').length,
    Declined: data.guests.filter(g => g.status === 'Declined').length
  };

  const save = (g) => {
    updateData(d => {
      if (editing) return { ...d, guests: d.guests.map(x => x.id === g.id ? g : x) };
      return { ...d, guests: [...d.guests, { ...g, id: newId() }] };
    });
    showToast(editing ? 'Guest updated!' : 'Guest added!');
    setShowForm(false);
    setEditing(null);
  };

  const del = (id) => {
    if (confirm('Delete?')) {
      updateData(d => ({ ...d, guests: d.guests.filter(x => x.id !== id) }));
      showToast('Deleted');
    }
  };

  const toggleConfirm = (id) => {
    updateData(d => ({
      ...d,
      guests: d.guests.map(x => x.id === id ? { ...x, status: x.status === 'Confirmed' ? 'Pending' : 'Confirmed' } : x)
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold" style={{ color: '#8B1A3A' }}>Guest List</h2>
          <p className="text-sm font-body" style={{ color: '#6B5050' }}>
            {counts.Confirmed} confirmed / {counts.all} total
          </p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 text-white font-body"
          style={{ background: '#8B1A3A' }}>
          <UserPlus size={16} /> Add Guest
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin">
        {['all', 'Confirmed', 'Pending', 'Declined'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold font-body whitespace-nowrap"
            style={{
              background: filter === s ? '#8B1A3A' : 'white',
              color: filter === s ? 'white' : '#2B1810',
              border: '1px solid rgba(201, 169, 97, 0.3)'
            }}>
            {s === 'all' ? 'All' : s} ({counts[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl gold-border" style={{ background: 'white' }}>
          <Users size={48} style={{ color: '#C9A961' }} className="mx-auto mb-3 opacity-50" />
          <p className="font-body" style={{ color: '#6B5050' }}>No guests yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(g => (
            <div key={g.id} className="rounded-xl p-3 gold-border card-shadow flex items-center gap-3" style={{ background: 'white' }}>
              <button onClick={() => toggleConfirm(g.id)}
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{
                  background: g.status === 'Confirmed' ? '#4A7C59' : 'rgba(201, 169, 97, 0.2)',
                  color: g.status === 'Confirmed' ? 'white' : '#C9A961'
                }}>
                <Check size={14} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold font-body text-sm" style={{ color: '#2B1810' }}>{g.name}</p>
                <p className="text-xs font-body" style={{ color: '#6B5050' }}>
                  {g.side} · {g.relationship} · {g.count || 1} person{(g.count || 1) > 1 ? 's' : ''}
                  {g.accommodation && ' · 🏠 Stay'}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => { setEditing(g); setShowForm(true); }}
                  className="p-1.5 rounded" style={{ background: 'rgba(139, 26, 58, 0.1)' }}>
                  <Edit2 size={12} style={{ color: '#8B1A3A' }} />
                </button>
                <button onClick={() => del(g.id)}
                  className="p-1.5 rounded" style={{ background: 'rgba(196, 62, 62, 0.1)' }}>
                  <Trash2 size={12} style={{ color: '#C43E3E' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <GuestForm item={editing} onSave={save} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}
    </div>
  );
}

function GuestForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || {
    name: '', phone: '', relationship: '', side: 'Dulhan', count: 1,
    accommodation: false, status: 'Pending', notes: ''
  });

  const handleSubmit = () => {
    if (!form.name) { alert('Name zaroori hai'); return; }
    onSave({ ...form, id: item?.id, count: Number(form.count) });
  };

  return (
    <Modal onClose={onClose} title={item ? 'Edit Guest' : 'Add Guest'}>
      <div className="space-y-3">
        <Field label="Name *">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
          <Field label="Relationship">
            <input value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Side">
            <select value={form.side} onChange={e => setForm({ ...form, side: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }}>
              <option>Dulhan</option><option>Dulha</option><option>Both</option>
            </select>
          </Field>
          <Field label="Count">
            <input type="number" value={form.count} onChange={e => setForm({ ...form, count: e.target.value })}
              min={1} className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }}>
              <option>Pending</option><option>Confirmed</option><option>Declined</option>
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.accommodation} onChange={e => setForm({ ...form, accommodation: e.target.checked })} />
          <span className="text-sm font-body" style={{ color: '#2B1810' }}>Accommodation needed</span>
        </label>
        <Field label="Notes">
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2} className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body resize-none" style={{ background: 'white' }} />
        </Field>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm font-body" style={{ background: '#8B1A3A' }}>
            {item ? 'Update' : 'Save'}
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm font-body gold-border"
            style={{ background: 'white', color: '#6B5050' }}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

// ============ AI ASSISTANT (with tool calling) ============
function AIAssistant({ data, updateData, showToast, setTab }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! 🙏 Main aapka Phere AI hoon.\n\nAb main seedha expenses, shagun, lena-dena add bhi kar sakta hoon! Bas bolo:\n\n• "50000 mandap booking ka advance diya"\n• "Mama ji ne 21000 shagun diya"\n• "Chacha se 5000 lena hai udhaar ka"\n\nYa kuch bhi poocho apne data ke baare mein!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Execute tool locally and return result
  const executeTool = (name, args) => {
    try {
      if (name === 'add_expense') {
        const entry = {
          id: newId(),
          description: args.description,
          category: args.category,
          amount: Number(args.amount),
          vendor: args.vendor || '',
          status: args.status || 'Paid',
          paymentMode: args.paymentMode || 'UPI',
          paidBy: args.paidBy || '',
          date: args.date || today(),
          dueDate: args.dueDate || '',
          notes: ''
        };
        updateData(d => ({ ...d, expenses: [...d.expenses, entry] }));
        return { success: true, message: `Expense added: ${args.description} — ${fmtFull(args.amount)}`, id: entry.id };
      }
      if (name === 'add_shagun') {
        const entry = {
          id: newId(),
          giverName: args.giverName,
          amount: Number(args.amount),
          relationship: args.relationship || '',
          side: args.side || 'Dulhan',
          mode: args.mode || 'Cash',
          giftItem: args.giftItem || '',
          date: args.date || today(),
          notes: ''
        };
        updateData(d => ({ ...d, shagun: [...d.shagun, entry] }));
        return { success: true, message: `Shagun added: ${args.giverName} — ${fmtFull(args.amount)}`, id: entry.id };
      }
      if (name === 'add_lena') {
        const entry = {
          id: newId(),
          person: args.person,
          phone: args.phone || '',
          amount: Number(args.amount),
          paidAmount: 0,
          purpose: args.purpose || '',
          date: args.date || today(),
          dueDate: args.dueDate || '',
          status: 'Pending',
          notes: ''
        };
        updateData(d => ({ ...d, lena: [...d.lena, entry] }));
        return { success: true, message: `Lena added: ${args.person} se ${fmtFull(args.amount)}`, id: entry.id };
      }
      if (name === 'add_dena') {
        const entry = {
          id: newId(),
          person: args.person,
          phone: args.phone || '',
          amount: Number(args.amount),
          paidAmount: 0,
          purpose: args.purpose || '',
          date: args.date || today(),
          dueDate: args.dueDate || '',
          status: 'Pending',
          notes: ''
        };
        updateData(d => ({ ...d, dena: [...d.dena, entry] }));
        return { success: true, message: `Dena added: ${args.person} ko ${fmtFull(args.amount)}`, id: entry.id };
      }
      if (name === 'query_data') {
        const { query_type, filter } = args;
        if (query_type === 'category_total') {
          const total = data.expenses.filter(e => e.category === filter).reduce((s, e) => s + Number(e.amount), 0);
          return { category: filter, total, count: data.expenses.filter(e => e.category === filter).length };
        }
        if (query_type === 'vendor_total') {
          const total = data.expenses.filter(e => (e.vendor || '').toLowerCase().includes((filter || '').toLowerCase())).reduce((s, e) => s + Number(e.amount), 0);
          return { vendor: filter, total };
        }
        if (query_type === 'giver_total') {
          const matches = data.shagun.filter(g => (g.giverName || '').toLowerCase().includes((filter || '').toLowerCase()));
          return { giver: filter, total: matches.reduce((s, g) => s + Number(g.amount), 0), entries: matches.length };
        }
        if (query_type === 'pending_payments') {
          return {
            pending: data.expenses.filter(e => e.status === 'Pending').map(e => ({
              description: e.description, vendor: e.vendor, amount: e.amount, dueDate: e.dueDate
            }))
          };
        }
        if (query_type === 'lena_pending') {
          return {
            pending: data.lena.filter(x => x.status !== 'Settled').map(x => ({
              person: x.person, amount: x.amount, paidAmount: x.paidAmount || 0, remaining: Number(x.amount) - Number(x.paidAmount || 0)
            }))
          };
        }
        if (query_type === 'dena_pending') {
          return {
            pending: data.dena.filter(x => x.status !== 'Settled').map(x => ({
              person: x.person, amount: x.amount, paidAmount: x.paidAmount || 0, remaining: Number(x.amount) - Number(x.paidAmount || 0)
            }))
          };
        }
        if (query_type === 'summary') {
          const totalSpent = data.expenses.filter(e => e.status === 'Paid').reduce((s, e) => s + Number(e.amount), 0);
          const totalPending = data.expenses.filter(e => e.status === 'Pending').reduce((s, e) => s + Number(e.amount), 0);
          const totalShagun = data.shagun.reduce((s, g) => s + Number(g.amount), 0);
          return {
            budget: data.settings.totalBudget,
            totalSpent, totalPending, totalShagun,
            remaining: Number(data.settings.totalBudget) - totalSpent - totalPending,
            expenseCount: data.expenses.length,
            shagunCount: data.shagun.length
          };
        }
      }
      return { error: 'Unknown tool' };
    } catch (e) {
      return { error: e.message };
    }
  };

  const buildContext = () => {
    const totalSpent = data.expenses.filter(e => e.status === 'Paid').reduce((s, e) => s + Number(e.amount), 0);
    const totalPending = data.expenses.filter(e => e.status === 'Pending').reduce((s, e) => s + Number(e.amount), 0);
    const totalShagun = data.shagun.reduce((s, g) => s + Number(g.amount), 0);
    const totalLena = data.lena.filter(x => x.status !== 'Settled').reduce((s, x) => s + (Number(x.amount) - Number(x.paidAmount || 0)), 0);
    const totalDena = data.dena.filter(x => x.status !== 'Settled').reduce((s, x) => s + (Number(x.amount) - Number(x.paidAmount || 0)), 0);

    return `Tum Phere ke AI assistant ho — ek Indian wedding expense tracker. User Hinglish me baat karta hai. Tum bhi Hinglish me warm, friendly, helpful tone me jawab do.

CURRENT DATA SNAPSHOT:
- Couple: ${data.settings.coupleName || 'Not set'}
- Wedding Date: ${data.settings.weddingDate || 'Not set'}
- Total Budget: ${fmtFull(data.settings.totalBudget)}
- Paid: ${fmtFull(totalSpent)} | Pending: ${fmtFull(totalPending)}
- Shagun Received: ${fmtFull(totalShagun)}
- Lena (incoming): ${fmtFull(totalLena)} | Dena (outgoing): ${fmtFull(totalDena)}
- Expenses count: ${data.expenses.length} | Shagun count: ${data.shagun.length}
- Vendors: ${data.vendors.length} | Guests: ${data.guests.length}

TOOLS TUMHARE PAAS HAIN:
1. add_expense — jab user kuch kharcha mention kare
2. add_shagun — jab koi shagun/gift diye ka mention ho
3. add_lena — jab koi paise dena hai user ko (receivable)
4. add_dena — jab user ko kisi ko paise dena hai (payable)
5. query_data — specific lookup ke liye

RULES:
- Jab user spend/paid/gave bole — tool use karke add karo
- Amount convert karo: "21 hazaar" = 21000, "1.5 lakh" = 150000, "ek crore" = 10000000
- Date nahi bataye to aaj ki date use karo
- Category match nahi to "Miscellaneous"
- Hinglish me jawab do, brief
- Tool use ke baad ek line confirmation do`;
  };

  // Convert AI_TOOLS from Claude format to OpenAI function calling format
  const getGroqTools = () => AI_TOOLS.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema
    }
  }));

  const callGroqAPI = async (apiMessages) => {
    const apiKey = import.meta.env?.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Groq API key nahi mila. .env file me VITE_GROQ_API_KEY set karo.');
    }
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: import.meta.env?.VITE_AI_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: buildContext() },
          ...apiMessages
        ],
        tools: getGroqTools(),
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build API messages (strip UI-only fields, keep only role + content)
      const apiMessages = [...messages, userMsg]
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      // Remove initial greeting from API call
      if (apiMessages.length > 0 && apiMessages[0].role === 'assistant' && typeof apiMessages[0].content === 'string' && apiMessages[0].content.startsWith('Namaste')) {
        apiMessages.shift();
      }

      let response = await callGroqAPI(apiMessages);
      let loops = 0;

      // Handle tool calling loop (OpenAI format: finish_reason === 'tool_calls')
      while (response.choices?.[0]?.finish_reason === 'tool_calls' && loops < 5) {
        loops++;
        const assistantMsg = response.choices[0].message;
        const toolCalls = assistantMsg.tool_calls || [];
        const confirmations = [];

        // Add the assistant message with tool_calls to conversation
        apiMessages.push({
          role: 'assistant',
          content: assistantMsg.content || null,
          tool_calls: toolCalls
        });

        // Execute each tool and add results
        for (const tc of toolCalls) {
          const args = JSON.parse(tc.function.arguments);
          const result = executeTool(tc.function.name, args);
          
          apiMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(result)
          });
          
          if (result.success && result.message) confirmations.push(result.message);
        }

        // Show confirmation toast
        if (confirmations.length > 0) showToast(`✓ ${confirmations.length} entry added`);

        // Call API again with tool results
        response = await callGroqAPI(apiMessages);
      }

      // Extract final text response
      const finalText = response.choices?.[0]?.message?.content || 'Ho gaya! ✓';
      
      // If there were tool calls in the final response too, execute them
      const finalToolCalls = response.choices?.[0]?.message?.tool_calls;
      if (finalToolCalls && finalToolCalls.length > 0) {
        const confirmations = [];
        for (const tc of finalToolCalls) {
          const args = JSON.parse(tc.function.arguments);
          const result = executeTool(tc.function.name, args);
          if (result.success && result.message) confirmations.push(result.message);
        }
        if (confirmations.length > 0) showToast(`✓ ${confirmations.length} entry added`);
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: finalText }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Oops, kuch error aa gaya: ${err.message}. Thodi der baad try karein.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    '50000 mandap ka advance diya',
    'Mama ji ne 21000 shagun diya',
    'Chacha se 10000 lena hai',
    'Pending payments kya hain?',
    'Decoration pe kitna kharcha?',
    'Overall summary batao'
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold" style={{ color: '#8B1A3A' }}>
          AI Assistant
        </h2>
        <p className="text-sm font-body" style={{ color: '#6B5050' }}>
          Ab seedha add bhi kar sakte ho bas bolke!
        </p>
      </div>

      <div className="rounded-2xl gold-border card-shadow flex flex-col" style={{ background: 'white', height: 'calc(100vh - 280px)', minHeight: '400px' }}>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-body whitespace-pre-wrap`}
                style={{
                  background: m.role === 'user' ? '#8B1A3A' : 'rgba(201, 169, 97, 0.12)',
                  color: m.role === 'user' ? 'white' : '#2B1810'
                }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2.5" style={{ background: 'rgba(201, 169, 97, 0.12)' }}>
                <Loader2 size={16} className="animate-spin" style={{ color: '#8B1A3A' }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setInput(s)}
                className="text-xs px-3 py-1.5 rounded-full font-body"
                style={{ background: 'rgba(139, 26, 58, 0.08)', color: '#8B1A3A' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 border-t gold-border flex gap-2" style={{ background: 'rgba(253, 248, 238, 0.5)' }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Kuch bhi likhein... 'mandap ka 50k diya'"
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg gold-border text-sm font-body"
            style={{ background: 'white' }} />
          <button onClick={send} disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-lg text-white font-body flex items-center gap-1 disabled:opacity-50"
            style={{ background: '#8B1A3A' }}>
            <Send size={16} />
          </button>
        </div>
      </div>

      <div className="rounded-xl p-4 gold-border" style={{ background: 'rgba(201, 169, 97, 0.08)' }}>
        <p className="text-xs font-body" style={{ color: '#6B5050' }}>
          💡 <strong>Pro Tip:</strong> Natural language me bolo — "aaj mehendi wale ko 15k cash diye", "mausi ne 5100 diye", "halwai se 20k lena hai". AI samajhke turant add kar dega.
        </p>
      </div>
    </div>
  );
}

// ============ DATA MANAGER (Excel Export/Import + Sample) ============
function DataManager({ data, updateData }) {
  const fileRef = useRef(null);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Dashboard sheet with formulas
    const dashRows = [
      [`${BRAND.name} — Dashboard`],
      [`Couple: ${data.settings.coupleName || 'N/A'}`],
      [`Wedding Date: ${data.settings.weddingDate || 'N/A'}`],
      [`Generated: ${new Date().toLocaleString('en-IN')}`],
      [],
      ['Metric', 'Amount'],
      ['Total Budget', Number(data.settings.totalBudget) || 0],
      ['Total Paid', { t: 'n', f: `SUMIF(Expenses!F:F,"Paid",Expenses!E:E)` }],
      ['Total Pending', { t: 'n', f: `SUMIF(Expenses!F:F,"Pending",Expenses!E:E)` }],
      ['Total Shagun', { t: 'n', f: `SUM(Shagun!D:D)` }],
      ['Lena (Pending)', { t: 'n', f: `SUMIFS(Lena!D:D,Lena!H:H,"<>Settled")-SUMIFS(Lena!E:E,Lena!H:H,"<>Settled")` }],
      ['Dena (Pending)', { t: 'n', f: `SUMIFS(Dena!D:D,Dena!H:H,"<>Settled")-SUMIFS(Dena!E:E,Dena!H:H,"<>Settled")` }],
      ['Remaining Budget', { t: 'n', f: `B7-B8-B9` }],
      ['Net Position', { t: 'n', f: `B10+B11-B8-B9-B12` }],
      [],
      ['Category', 'Total Kharcha'],
      ...CATEGORIES.map(c => [c.name, { t: 'n', f: `SUMIF(Expenses!B:B,"${c.name}",Expenses!E:E)` }])
    ];
    const dashWs = XLSX.utils.aoa_to_sheet(dashRows);
    dashWs['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, dashWs, 'Dashboard');

    // Expenses
    const expHeader = ['Date', 'Category', 'Description', 'Vendor', 'Amount', 'Status', 'Paid By', 'Payment Mode', 'Due Date', 'Notes'];
    const expRows = [expHeader, ...data.expenses.map(e => [
      e.date || '', e.category || '', e.description || '', e.vendor || '',
      Number(e.amount) || 0, e.status || 'Paid', e.paidBy || '', e.paymentMode || '',
      e.dueDate || '', e.notes || ''
    ])];
    // Add totals row with formula
    const lastRow = expRows.length + 1;
    expRows.push(['', '', '', 'TOTAL', { t: 'n', f: `SUM(E2:E${lastRow - 1})` }, '', '', '', '', '']);
    const expWs = XLSX.utils.aoa_to_sheet(expRows);
    expWs['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, expWs, 'Expenses');

    // Shagun
    const shagunHeader = ['Date', 'Giver Name', 'Relationship', 'Amount', 'Side', 'Mode', 'Gift Item', 'Notes'];
    const shagunRows = [shagunHeader, ...data.shagun.map(g => [
      g.date || '', g.giverName || '', g.relationship || '', Number(g.amount) || 0,
      g.side || '', g.mode || '', g.giftItem || '', g.notes || ''
    ])];
    shagunRows.push(['', '', 'TOTAL', { t: 'n', f: `SUM(D2:D${shagunRows.length})` }, '', '', '', '']);
    const shagunWs = XLSX.utils.aoa_to_sheet(shagunRows);
    shagunWs['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, shagunWs, 'Shagun');

    // Lena (Receivables)
    const lenaHeader = ['Date', 'Person', 'Phone', 'Amount', 'Paid Amount', 'Purpose', 'Due Date', 'Status', 'Notes'];
    const lenaRows = [lenaHeader, ...data.lena.map(x => [
      x.date || '', x.person || '', x.phone || '', Number(x.amount) || 0,
      Number(x.paidAmount) || 0, x.purpose || '', x.dueDate || '', x.status || 'Pending', x.notes || ''
    ])];
    const lenaWs = XLSX.utils.aoa_to_sheet(lenaRows);
    lenaWs['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, lenaWs, 'Lena');

    // Dena (Payables)
    const denaRows = [lenaHeader, ...data.dena.map(x => [
      x.date || '', x.person || '', x.phone || '', Number(x.amount) || 0,
      Number(x.paidAmount) || 0, x.purpose || '', x.dueDate || '', x.status || 'Pending', x.notes || ''
    ])];
    const denaWs = XLSX.utils.aoa_to_sheet(denaRows);
    denaWs['!cols'] = lenaWs['!cols'];
    XLSX.utils.book_append_sheet(wb, denaWs, 'Dena');

    // Vendors
    const vendorHeader = ['Name', 'Category', 'Phone', 'Address', 'Notes'];
    const vendorRows = [vendorHeader, ...data.vendors.map(v => [
      v.name || '', v.category || '', v.phone || '', v.address || '', v.notes || ''
    ])];
    const vendorWs = XLSX.utils.aoa_to_sheet(vendorRows);
    vendorWs['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 30 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, vendorWs, 'Vendors');

    // Guests
    const guestHeader = ['Name', 'Phone', 'Relationship', 'Side', 'Count', 'Accommodation', 'Status', 'Notes'];
    const guestRows = [guestHeader, ...data.guests.map(g => [
      g.name || '', g.phone || '', g.relationship || '', g.side || '',
      Number(g.count) || 1, g.accommodation ? 'Yes' : 'No', g.status || 'Pending', g.notes || ''
    ])];
    const guestWs = XLSX.utils.aoa_to_sheet(guestRows);
    guestWs['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, guestWs, 'Guests');

    // Settings sheet (for round-trip)
    const settingsRows = [
      ['Setting', 'Value'],
      ['Couple Name', data.settings.coupleName || ''],
      ['Wedding Date', data.settings.weddingDate || ''],
      ['Total Budget', Number(data.settings.totalBudget) || 0]
    ];
    const settingsWs = XLSX.utils.aoa_to_sheet(settingsRows);
    settingsWs['!cols'] = [{ wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, settingsWs, 'Settings');

    const fileName = `${BRAND.name}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const downloadSampleTemplate = () => {
    const wb = XLSX.utils.book_new();

    const sampleExpenses = [
      ['Date', 'Category', 'Description', 'Vendor', 'Amount', 'Status', 'Paid By', 'Payment Mode', 'Due Date', 'Notes'],
      ['2026-05-01', 'Venue/Hall', 'Mandap booking advance', 'Royal Palace Banquet', 50000, 'Paid', 'Papa', 'UPI', '', 'Advance receipt #1234'],
      ['2026-05-05', 'Catering/Khana', 'Catering advance — 300 plates', 'Sharma Caterers', 75000, 'Paid', 'Self', 'Bank Transfer', '', ''],
      ['2026-05-10', 'Decoration', 'Floral decoration for mandap', 'Lotus Decor', 45000, 'Pending', '', 'Cash', '2026-06-01', ''],
      ['2026-05-12', 'Photography', 'Candid photography package', 'Click Studios', 85000, 'Paid', 'Papa', 'UPI', '', '2 days coverage'],
      ['2026-05-15', 'Jewelry/Zewar', 'Dulhan ka set', 'Tanishq', 250000, 'Pending', '', 'Cheque', '2026-05-30', 'Gold 22K'],
      ['2026-05-18', 'Clothes - Dulhan', 'Lehenga', 'Manyavar', 85000, 'Paid', 'Mummy', 'Credit Card', '', '']
    ];
    const expWs = XLSX.utils.aoa_to_sheet(sampleExpenses);
    expWs['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, expWs, 'Expenses');

    const sampleShagun = [
      ['Date', 'Giver Name', 'Relationship', 'Amount', 'Side', 'Mode', 'Gift Item', 'Notes'],
      ['2026-06-15', 'Ramesh Uncle', 'Mama', 21000, 'Dulhan', 'Cash', '', ''],
      ['2026-06-15', 'Sunita Aunty', 'Bua', 11000, 'Dulhan', 'UPI', '', ''],
      ['2026-06-16', 'Verma Ji', 'Family Friend', 5100, 'Both', 'Cash', '', 'Papa ke office colleague'],
      ['2026-06-16', 'Sharma Family', 'Neighbour', 0, 'Both', 'Gift Item', 'Silver plate set', '']
    ];
    const shagunWs = XLSX.utils.aoa_to_sheet(sampleShagun);
    shagunWs['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, shagunWs, 'Shagun');

    const sampleLena = [
      ['Date', 'Person', 'Phone', 'Amount', 'Paid Amount', 'Purpose', 'Due Date', 'Status', 'Notes'],
      ['2026-05-01', 'Chacha ji', '9876543210', 10000, 0, 'Udhaar liya tha pehle', '2026-06-30', 'Pending', ''],
      ['2026-05-15', 'Amit', '9123456789', 5000, 2000, 'Half wapas aa gaya', '', 'Partial', '']
    ];
    const lenaWs = XLSX.utils.aoa_to_sheet(sampleLena);
    lenaWs['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, lenaWs, 'Lena');

    const sampleDena = [
      ['Date', 'Person', 'Phone', 'Amount', 'Paid Amount', 'Purpose', 'Due Date', 'Status', 'Notes'],
      ['2026-05-10', 'Bansal Jewellers', '9988776655', 50000, 20000, 'Zewar ki baki payment', '2026-06-15', 'Partial', '']
    ];
    const denaWs = XLSX.utils.aoa_to_sheet(sampleDena);
    denaWs['!cols'] = lenaWs['!cols'];
    XLSX.utils.book_append_sheet(wb, denaWs, 'Dena');

    const sampleVendors = [
      ['Name', 'Category', 'Phone', 'Address', 'Notes'],
      ['Royal Palace Banquet', 'Venue/Hall', '9876543210', 'Ring Road, Delhi', '300-400 capacity'],
      ['Sharma Caterers', 'Catering/Khana', '9876543211', 'Karol Bagh', 'Pure veg specialist'],
      ['Click Studios', 'Photography', '9876543212', 'Lajpat Nagar', 'Candid + traditional'],
      ['Tanishq', 'Jewelry/Zewar', '9876543213', 'Connaught Place', '']
    ];
    const vendorWs = XLSX.utils.aoa_to_sheet(sampleVendors);
    vendorWs['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 30 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, vendorWs, 'Vendors');

    const sampleGuests = [
      ['Name', 'Phone', 'Relationship', 'Side', 'Count', 'Accommodation', 'Status', 'Notes'],
      ['Ramesh Uncle Family', '9876543210', 'Mama', 'Dulhan', 4, 'Yes', 'Confirmed', ''],
      ['Verma Family', '9876543211', 'Family Friend', 'Both', 5, 'Yes', 'Pending', 'Out of city'],
      ['Priya Bhabhi', '9876543212', 'Friend', 'Dulhan', 1, 'No', 'Confirmed', '']
    ];
    const guestWs = XLSX.utils.aoa_to_sheet(sampleGuests);
    guestWs['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, guestWs, 'Guests');

    const settingsRows = [
      ['Setting', 'Value'],
      ['Couple Name', 'Priya & Rohan'],
      ['Wedding Date', '2026-06-15'],
      ['Total Budget', 1500000]
    ];
    const settingsWs = XLSX.utils.aoa_to_sheet(settingsRows);
    settingsWs['!cols'] = [{ wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, settingsWs, 'Settings');

    // Instructions sheet
    const instructions = [
      [`${BRAND.name} — Sample Template`],
      [],
      ['Instructions:'],
      ['1. Har sheet me apna data dalein — header row (1st row) mat hataein'],
      ['2. Date format: YYYY-MM-DD (e.g. 2026-06-15)'],
      ['3. Amount sirf numbers, no ₹ symbol'],
      ['4. Status fields are limited values — check sample data for valid options'],
      ['5. Is file ko Phere me Import karein'],
      [],
      ['Sheets ka purpose:'],
      ['• Expenses — saare wedding ke kharche'],
      ['• Shagun — jo shagun/gift aapne receive kiya'],
      ['• Lena — jo paise aapko milne hain (receivables)'],
      ['• Dena — jo paise aapko dene hain (payables)'],
      ['• Vendors — vendor contacts directory'],
      ['• Guests — guest list with RSVP'],
      ['• Settings — couple name, wedding date, budget']
    ];
    const instrWs = XLSX.utils.aoa_to_sheet(instructions);
    instrWs['!cols'] = [{ wch: 70 }];
    XLSX.utils.book_append_sheet(wb, instrWs, 'README');

    XLSX.writeFile(wb, `${BRAND.name}-Sample-Template.xlsx`);
  };

  const importExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const arr = new Uint8Array(ev.target.result);
        const wb = XLSX.read(arr, { type: 'array' });

        const parseSheet = (name) => {
          const ws = wb.Sheets[name];
          if (!ws) return [];
          return XLSX.utils.sheet_to_json(ws, { defval: '' });
        };

        const expenses = parseSheet('Expenses')
          .filter(r => r.Description && r.Amount)
          .map(r => ({
            id: newId(),
            date: typeof r.Date === 'string' ? r.Date : String(r.Date || today()),
            category: r.Category || 'Miscellaneous',
            description: r.Description,
            vendor: r.Vendor || '',
            amount: Number(r.Amount) || 0,
            status: r.Status || 'Paid',
            paidBy: r['Paid By'] || '',
            paymentMode: r['Payment Mode'] || 'UPI',
            dueDate: r['Due Date'] || '',
            notes: r.Notes || ''
          }));

        const shagun = parseSheet('Shagun')
          .filter(r => r['Giver Name'])
          .map(r => ({
            id: newId(),
            date: String(r.Date || today()),
            giverName: r['Giver Name'],
            relationship: r.Relationship || '',
            amount: Number(r.Amount) || 0,
            side: r.Side || 'Dulhan',
            mode: r.Mode || 'Cash',
            giftItem: r['Gift Item'] || '',
            notes: r.Notes || ''
          }));

        const parseLenaDena = (name) => parseSheet(name)
          .filter(r => r.Person)
          .map(r => ({
            id: newId(),
            date: String(r.Date || today()),
            person: r.Person,
            phone: String(r.Phone || ''),
            amount: Number(r.Amount) || 0,
            paidAmount: Number(r['Paid Amount']) || 0,
            purpose: r.Purpose || '',
            dueDate: r['Due Date'] || '',
            status: r.Status || 'Pending',
            notes: r.Notes || ''
          }));

        const lena = parseLenaDena('Lena');
        const dena = parseLenaDena('Dena');

        const vendors = parseSheet('Vendors')
          .filter(r => r.Name)
          .map(r => ({
            id: newId(),
            name: r.Name,
            category: r.Category || 'Miscellaneous',
            phone: String(r.Phone || ''),
            address: r.Address || '',
            notes: r.Notes || ''
          }));

        const guests = parseSheet('Guests')
          .filter(r => r.Name)
          .map(r => ({
            id: newId(),
            name: r.Name,
            phone: String(r.Phone || ''),
            relationship: r.Relationship || '',
            side: r.Side || 'Dulhan',
            count: Number(r.Count) || 1,
            accommodation: r.Accommodation === 'Yes' || r.Accommodation === true,
            status: r.Status || 'Pending',
            notes: r.Notes || ''
          }));

        // Settings
        const settingsSheet = parseSheet('Settings');
        let settings = { ...data.settings };
        settingsSheet.forEach(row => {
          if (row.Setting === 'Couple Name') settings.coupleName = row.Value || '';
          if (row.Setting === 'Wedding Date') settings.weddingDate = String(row.Value || '');
          if (row.Setting === 'Total Budget') settings.totalBudget = Number(row.Value) || 0;
        });

        if (confirm('Existing data replace ho jaayega. Continue?')) {
          updateData(() => ({ expenses, shagun, lena, dena, vendors, guests, settings }));
          alert(`Successfully imported!\nExpenses: ${expenses.length}\nShagun: ${shagun.length}\nLena: ${lena.length}\nDena: ${dena.length}\nVendors: ${vendors.length}\nGuests: ${guests.length}`);
        }
      } catch (err) {
        console.error(err);
        alert(`Import failed: ${err.message}\n\nMake sure the file has sheets: Expenses, Shagun, Lena, Dena, Vendors, Guests, Settings`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const clearAll = () => {
    if (confirm('Saara data delete ho jayega. Sure?') && confirm('Really sure? Ye undone nahi ho sakta!')) {
      updateData(() => defaultData);
    }
  };

  return (
    <div className="rounded-2xl p-5 gold-border card-shadow" style={{ background: 'white' }}>
      <h3 className="font-display text-xl font-semibold mb-1" style={{ color: '#8B1A3A' }}>
        Data Management
      </h3>
      <p className="text-xs font-body mb-4" style={{ color: '#6B5050' }}>
        Excel me export karein, dusre device pe import karein, ya sample template download karein
      </p>
      <div className="grid grid-cols-2 md:flex gap-2 md:flex-wrap">
        <button onClick={exportExcel}
          className="px-4 py-2 rounded-lg text-sm font-semibold font-body flex items-center justify-center gap-2 text-white"
          style={{ background: '#8B1A3A' }}>
          <FileSpreadsheet size={14} /> Export Excel
        </button>
        <button onClick={() => fileRef.current?.click()}
          className="px-4 py-2 rounded-lg text-sm font-semibold font-body flex items-center justify-center gap-2 gold-border"
          style={{ background: 'white', color: '#2B1810' }}>
          <Upload size={14} /> Import Excel
        </button>
        <input type="file" ref={fileRef} accept=".xlsx,.xls" onChange={importExcel} className="hidden" />
        <button onClick={downloadSampleTemplate}
          className="px-4 py-2 rounded-lg text-sm font-semibold font-body flex items-center justify-center gap-2 gold-border"
          style={{ background: 'rgba(201, 169, 97, 0.1)', color: '#8B1A3A' }}>
          <Download size={14} /> Sample Template
        </button>
        <button onClick={clearAll}
          className="px-4 py-2 rounded-lg text-sm font-semibold font-body flex items-center justify-center gap-2 md:ml-auto col-span-2 md:col-span-1"
          style={{ background: 'rgba(196, 62, 62, 0.1)', color: '#C43E3E' }}>
          <Trash2 size={14} /> Clear All
        </button>
      </div>
      <p className="text-xs font-body mt-3" style={{ color: '#6B5050' }}>
        💡 Export me Excel formulas hain (Dashboard sheet pe SUM, SUMIF auto-calculate). Excel/Google Sheets me directly kaam karega.
      </p>
    </div>
  );
}

// ============ SETTINGS MODAL ============
function SettingsModal({ data, updateData, onClose }) {
  const [form, setForm] = useState(data.settings);
  const save = () => {
    updateData(d => ({ ...d, settings: { ...d.settings, ...form, totalBudget: Number(form.totalBudget) || 0 } }));
    onClose();
  };
  return (
    <Modal onClose={onClose} title="Settings">
      <div className="space-y-3">
        <Field label="Couple Name">
          <input value={form.coupleName} onChange={e => setForm({ ...form, coupleName: e.target.value })}
            placeholder="Priya & Rohan"
            className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
        </Field>
        <Field label="Wedding Date">
          <input type="date" value={form.weddingDate} onChange={e => setForm({ ...form, weddingDate: e.target.value })}
            className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
        </Field>
        <Field label="Total Budget (₹)">
          <input type="number" value={form.totalBudget} onChange={e => setForm({ ...form, totalBudget: e.target.value })}
            className="w-full px-3 py-2 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
        </Field>
        <div className="flex gap-2 pt-2">
          <button onClick={save}
            className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm font-body" style={{ background: '#8B1A3A' }}>
            Save
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm font-body gold-border"
            style={{ background: 'white', color: '#6B5050' }}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============ SHARED ============
function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-up"
         style={{ background: 'rgba(43, 24, 16, 0.5)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin card-shadow"
           style={{ background: '#FDF8EE' }}
           onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 p-4 border-b gold-border flex items-center justify-between"
             style={{ background: '#FDF8EE' }}>
          <h3 className="font-display text-xl font-semibold" style={{ color: '#8B1A3A' }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(139, 26, 58, 0.1)' }}>
            <X size={16} style={{ color: '#8B1A3A' }} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold font-body mb-1 uppercase tracking-wider" style={{ color: '#6B5050' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
