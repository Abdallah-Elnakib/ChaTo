import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import I18n from '../constants/i18n';

interface LanguageContextProps {
  locale: string;
  setLocale: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextProps>({
  locale: I18n.locale,
  setLocale: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState(I18n.locale);

   
  useEffect(() => {
    AsyncStorage.getItem('locale').then(storedLocale => {
      if (storedLocale && storedLocale !== locale) {
        I18n.locale = storedLocale;
        setLocaleState(storedLocale);
      }
    });
  }, [locale]);

  const setLocale = async (lang: string) => {
    I18n.locale = lang;
    setLocaleState(lang);
    await AsyncStorage.setItem('locale', lang);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}; 