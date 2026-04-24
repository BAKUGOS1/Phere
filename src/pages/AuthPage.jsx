import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email, password);
        if (err) throw err;
      } else if (mode === 'register') {
        if (password.length < 8) {
          throw new Error('Password minimum 8 characters hona chahiye');
        }
        const { error: err } = await signUp(email, password, displayName);
        if (err) throw err;
        setSuccess('Account created! Check your email for verification (or login directly if email confirmation is disabled).');
        // Try logging in immediately after signup
        const { error: loginErr } = await signIn(email, password);
        if (loginErr) {
          // If login fails, they may need to verify email first
          setSuccess('Account created! Please check your email to verify, then login.');
        }
      } else if (mode === 'forgot') {
        const { error: err } = await resetPassword(email);
        if (err) throw err;
        setSuccess('Password reset link bhej diya hai email pe!');
      }
    } catch (err) {
      let msg = err.message || 'Kuch gadbad ho gayi. Try again.';
      // Friendly messages for common Supabase errors
      if (msg.includes('rate limit') || msg.includes('Rate limit')) {
        msg = 'Too many emails sent. Please wait 1 hour or check your inbox.';
      } else if (msg.includes('recovery') || msg.includes('sending')) {
        msg = 'Email send nahi ho paya. Please login directly — password reset link aapke registered email pe aayega.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'Email ya password galat hai. Try again.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Email verify nahi hua. Supabase Dashboard mein \'Confirm email\' band karein.';
      } else if (msg.includes('User already registered')) {
        msg = 'Ye email pehle se registered hai. Login karein.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
         style={{ background: '#FDF8EE', fontFamily: 'Manrope, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-body { font-family: 'Manrope', system-ui, sans-serif; }
        .gold-border { border: 1px solid rgba(201, 169, 97, 0.3); }
        .card-shadow { box-shadow: 0 2px 20px rgba(139, 26, 58, 0.08); }
        input:focus { outline: 2px solid rgba(139, 26, 58, 0.3); outline-offset: 1px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(3deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        .fade-up { animation: fadeUp 0.5s ease-out; }
        .float { animation: float 6s ease-in-out infinite; }
        .pulse-slow { animation: pulse 4s ease-in-out infinite; }
      `}</style>

      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10 float"
             style={{ background: 'radial-gradient(circle, #C9A961, transparent)' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-8 pulse-slow"
             style={{ background: 'radial-gradient(circle, #8B1A3A, transparent)' }} />
        <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full opacity-5"
             style={{ background: '#C9A961', animation: 'float 8s ease-in-out infinite 2s' }} />
        {/* Decorative mandala dots */}
        {[...Array(6)].map((_, i) => (
          <div key={i}
               className="absolute rounded-full"
               style={{
                 width: 4 + Math.random() * 8,
                 height: 4 + Math.random() * 8,
                 background: i % 2 === 0 ? '#C9A961' : '#8B1A3A',
                 opacity: 0.15,
                 top: `${10 + Math.random() * 80}%`,
                 left: `${5 + Math.random() * 90}%`,
                 animation: `float ${4 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 3}s`
               }} />
        ))}
      </div>

      {/* Main card */}
      <div className="w-full max-w-md relative z-10 fade-up">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <svg viewBox="0 0 48 48" width={56} height={56} xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="authHeart" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B1A3A" />
                  <stop offset="100%" stopColor="#C9A961" />
                </linearGradient>
              </defs>
              <path d="M24 42 C8 30, 4 22, 4 14 C4 8, 9 4, 14 4 C18 4, 22 7, 24 11 C26 7, 30 4, 34 4 C39 4, 44 8, 44 14 C44 22, 40 30, 24 42 Z"
                    fill="url(#authHeart)" />
              <line x1="12" y1="15" x2="36" y2="15" stroke="white" strokeWidth="1" opacity="0.45" />
              <line x1="14" y1="20" x2="34" y2="20" stroke="white" strokeWidth="1" opacity="0.45" />
              <line x1="16" y1="25" x2="32" y2="25" stroke="white" strokeWidth="1" opacity="0.45" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-semibold mb-1" style={{ color: '#8B1A3A' }}>
            Phere
          </h1>
          <p className="font-display text-lg" style={{ color: '#C9A961' }}>
            फेरे
          </p>
          <p className="text-sm font-body mt-2" style={{ color: '#6B5050' }}>
            Har Rupaya, Har Rishta — Smart Wedding Expense Tracker
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl p-6 md:p-8 card-shadow gold-border" style={{ background: 'white' }}>
          <h2 className="font-display text-2xl font-semibold mb-1" style={{ color: '#8B1A3A' }}>
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
          </h2>
          <p className="text-sm font-body mb-6" style={{ color: '#6B5050' }}>
            {mode === 'login'
              ? 'Login karein apna khata dekhne ke liye'
              : mode === 'register'
              ? 'Naya account banayein shaadi ki planning ke liye'
              : 'Email daalein, reset link bhej denge'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm font-body" style={{ background: 'rgba(196, 62, 62, 0.1)', color: '#C43E3E' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg text-sm font-body" style={{ background: 'rgba(74, 124, 89, 0.1)', color: '#4A7C59' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold font-body mb-1.5 uppercase tracking-wider" style={{ color: '#6B5050' }}>
                  Your Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5050' }} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Priya & Rohan"
                    className="w-full pl-10 pr-3 py-3 rounded-lg gold-border text-sm font-body"
                    style={{ background: '#FDFAF5' }}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold font-body mb-1.5 uppercase tracking-wider" style={{ color: '#6B5050' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5050' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-3 rounded-lg gold-border text-sm font-body"
                  style={{ background: '#FDFAF5' }}
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-semibold font-body mb-1.5 uppercase tracking-wider" style={{ color: '#6B5050' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5050' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Min 8 characters' : '••••••••'}
                    className="w-full pl-10 pr-10 py-3 rounded-lg gold-border text-sm font-body"
                    style={{ background: '#FDFAF5' }}
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: '#6B5050' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm font-body flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading ? '#6B5050' : 'linear-gradient(135deg, #8B1A3A 0%, #5A0E26 100%)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Please wait...</>
              ) : mode === 'login' ? (
                <><ArrowRight size={16} /> Login</>
              ) : mode === 'register' ? (
                <><Sparkles size={16} /> Create Account</>
              ) : (
                <><Mail size={16} /> Send Reset Link</>
              )}
            </button>
          </form>

          {/* Mode toggles */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  className="text-xs font-body underline block mx-auto"
                  style={{ color: '#6B5050' }}
                >
                  Forgot password?
                </button>
                <p className="text-sm font-body" style={{ color: '#6B5050' }}>
                  Don't have an account?{' '}
                  <button
                    onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                    className="font-semibold underline"
                    style={{ color: '#8B1A3A' }}
                  >
                    Register
                  </button>
                </p>
              </>
            )}
            {mode === 'register' && (
              <p className="text-sm font-body" style={{ color: '#6B5050' }}>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="font-semibold underline"
                  style={{ color: '#8B1A3A' }}
                >
                  Login
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-sm font-body font-semibold underline"
                style={{ color: '#8B1A3A' }}
              >
                ← Back to Login
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs font-body mt-6" style={{ color: '#6B5050', opacity: 0.6 }}>
          Made with ❤️ for Indian Weddings
        </p>
      </div>
    </div>
  );
}
