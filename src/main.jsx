import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { initStorage } from './lib/storage.js';

// Initialize storage abstraction (sets up window.storage polyfill)
initStorage();

// Lazy-load the main app to reduce initial bundle
const Phere = React.lazy(() => import('../Phere.jsx'));

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF8EE' }}>
        <div className="text-center">
          <svg viewBox="0 0 48 48" width={48} height={48} className="mx-auto mb-3 animate-pulse" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="loadHeart" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B1A3A" />
                <stop offset="100%" stopColor="#C9A961" />
              </linearGradient>
            </defs>
            <path d="M24 42 C8 30, 4 22, 4 14 C4 8, 9 4, 14 4 C18 4, 22 7, 24 11 C26 7, 30 4, 34 4 C39 4, 44 8, 44 14 C44 22, 40 30, 24 42 Z"
                  fill="url(#loadHeart)" />
          </svg>
          <p style={{ color: '#8B1A3A', fontFamily: 'Cormorant Garamond, serif', fontSize: 18 }}>Loading Phere...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF8EE' }}>
        <p style={{ color: '#8B1A3A', fontFamily: 'Cormorant Garamond, serif', fontSize: 18 }}>Loading...</p>
      </div>
    }>
      <Phere />
    </React.Suspense>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
