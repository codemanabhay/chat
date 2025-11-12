import React, { createContext, useState, useCallback, useEffect } from 'react';

export const ThemeContext = createContext();

const themes = {
  dark: {
    bg: 'bg-slate-950',
    text: 'text-white',
    card: 'bg-slate-900/50 border border-slate-700/50',
    accent: 'from-cyan-500 to-blue-500',
    hover: 'hover:bg-slate-800/70'
  },
  light: {
    bg: 'bg-white',
    text: 'text-slate-900',
    card: 'bg-gray-100 border border-gray-200',
    accent: 'from-blue-600 to-cyan-600',
    hover: 'hover:bg-gray-200'
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [theme, setTheme] = useState(themes.dark);
  const [animations, setAnimations] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      setIsDark(false);
      setTheme(themes.light);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newVal = !prev;
      localStorage.setItem('theme', newVal ? 'dark' : 'light');
      setTheme(newVal ? themes.dark : themes.light);
      return newVal;
    });
  }, []);

  const toggleAnimations = useCallback(() => {
    setAnimations(prev => {
      localStorage.setItem('animations', !prev);
      return !prev;
    });
  }, []);

  const value = {
    isDark,
    theme,
    toggleTheme,
    animations,
    toggleAnimations
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
