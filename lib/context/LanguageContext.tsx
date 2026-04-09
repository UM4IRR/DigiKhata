'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.language || 'en');
  const [dir, setDir] = useState<'ltr' | 'rtl'>(language === 'ur' ? 'rtl' : 'ltr');

  useEffect(() => {
    const handleLangChange = (lng: string) => {
      setLanguageState(lng);
      const direction = lng === 'ur' ? 'rtl' : 'ltr';
      setDir(direction);
      document.documentElement.dir = direction;
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', handleLangChange);
    // Initial set
    handleLangChange(i18n.language);

    return () => {
      i18n.off('languageChanged', handleLangChange);
    };
  }, [i18n]);

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
