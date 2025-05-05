import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const lightColors = {
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  primary: '#007AFF',
  card: '#F2F2F7',
  border: '#C7C7CC',
  buttonText: '#FFFFFF',
};

const darkColors = {
  background: '#000000',
  text: '#FFFFFF',
  textSecondary: '#999999',
  primary: '#0A84FF',
  card: '#1C1C1E',
  border: '#38383A',
  buttonText: '#FFFFFF',
};

export const ThemeContext = createContext({ 
  darkMode: false, 
  setDarkMode: (v: boolean) => {},
  colors: lightColors,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkModeState] = useState(false);

  useEffect(() => {
    // Load dark mode preference from AsyncStorage on mount
    AsyncStorage.getItem('darkMode').then(val => {
      if (val !== null) setDarkModeState(val === 'true');
    });
  }, []);

  const setDarkMode = async (val: boolean) => {
    setDarkModeState(val);
    await AsyncStorage.setItem('darkMode', val ? 'true' : 'false');
  };

  const colors = darkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 