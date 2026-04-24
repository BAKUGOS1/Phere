import { createContext, useContext, useState, useCallback } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

const LANG_KEY = 'phere-lang';
const SUPPORTED = ['en', 'hinglish', 'hi', 'gu'];

export function LanguageProvider({ children }) {
  const [language, setLang] = useState(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return SUPPORTED.includes(saved) ? saved : 'hinglish';
  });

  const setLanguage = useCallback((code) => {
    if (SUPPORTED.includes(code)) {
      setLang(code);
      localStorage.setItem(LANG_KEY, code);
    }
  }, []);

  const t = useCallback((key, vars) => {
    let str = translations[language]?.[key] || translations['hinglish']?.[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    return str;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, SUPPORTED }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
