import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const THEME_KEY = 'gearRentTheme';

export function ThemeProvider({ children }) {
  const [isLightTheme, setIsLightTheme] = useState(
    () => window.localStorage.getItem(THEME_KEY) === 'light'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = isLightTheme ? 'light' : 'dark';
    window.localStorage.setItem(THEME_KEY, isLightTheme ? 'light' : 'dark');
  }, [isLightTheme]);

  const toggleTheme = () => setIsLightTheme((lightTheme) => !lightTheme);

  return (
    <ThemeContext.Provider value={{ isLightTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
