'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'day' | 'night';
interface ThemeContextType { isDayMode: boolean; theme: Theme; }
const ThemeContext = createContext<ThemeContextType>({ isDayMode: false, theme: 'night' });

function getIsDayMode() { const h = new Date().getHours(); return h >= 6 && h < 20; }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDayMode, setIsDayMode] = useState(false);
  useEffect(() => {
    const update = () => {
      const day = getIsDayMode();
      setIsDayMode(day);
      document.documentElement.setAttribute('data-theme', day ? 'day' : 'night');
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);
  return <ThemeContext.Provider value={{ isDayMode, theme: isDayMode ? 'day' : 'night' }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
