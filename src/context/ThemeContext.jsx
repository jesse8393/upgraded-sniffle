import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fh_theme');
    return saved ? saved === 'dark' : true; // default dark
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('fh_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      <div data-theme={isDark ? 'dark' : 'light'} style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Hook lives alongside the provider — single source of truth, no benefit to splitting.
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
