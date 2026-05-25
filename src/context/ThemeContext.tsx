'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

const DAY_START_HOUR = 6;
const DAY_END_HOUR   = 20;

type Theme = 'day' | 'night';

interface ThemeContextType {
  isDayMode: boolean;
  theme: Theme;
  toggleTheme: () => void;
  manualOverride: 'day' | 'night' | null;
  clearOverride: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDayMode: false,
  theme: 'night',
  toggleTheme: () => {},
  manualOverride: null,
  clearOverride: () => {},
});

function getIsInDayHours(): boolean {
  const h = new Date().getHours();
  return h >= DAY_START_HOUR && h < DAY_END_HOUR;
}

function applyTheme(dayMode: boolean) {
  document.documentElement.classList.add('theme-transitioning');
  document.documentElement.setAttribute('data-theme', dayMode ? 'day' : 'night');
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 500);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isInDayHours, setIsInDayHours]       = useState(() =>
    typeof window !== 'undefined' ? getIsInDayHours() : false
  );
  const [manualOverride, setManualOverride]    = useState<'day' | 'night' | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('im_theme_override') as 'day' | 'night' | null;
  });
  const isFirstRender = useRef(true);

  useEffect(() => {
    setIsInDayHours(getIsInDayHours());

    const interval = setInterval(() => setIsInDayHours(getIsInDayHours()), 60_000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const resolvedIsDayMode = manualOverride
    ? manualOverride === 'day'
    : isInDayHours;

  useEffect(() => {
    if (isFirstRender.current) {
      document.documentElement.setAttribute('data-theme', resolvedIsDayMode ? 'day' : 'night');
      isFirstRender.current = false;
      return;
    }
    applyTheme(resolvedIsDayMode);
  }, [resolvedIsDayMode]);

  const toggleTheme = () => {
    const next: 'day' | 'night' = resolvedIsDayMode ? 'night' : 'day';
    setManualOverride(next);
    localStorage.setItem('im_theme_override', next);
  };

  const clearOverride = () => {
    setManualOverride(null);
    localStorage.removeItem('im_theme_override');
  };

  return (
    <ThemeContext.Provider value={{
      isDayMode: resolvedIsDayMode,
      theme: resolvedIsDayMode ? 'day' : 'night',
      toggleTheme,
      manualOverride,
      clearOverride,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
