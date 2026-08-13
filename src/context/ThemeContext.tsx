'use client';
import { createContext, useContext, useEffect } from 'react';

type Theme = 'day' | 'night';

interface ThemeContextType {
  isDayMode: boolean;
  blend: number;
  theme: Theme;
  toggleTheme: () => void;
  manualOverride: 'day' | 'night' | null;
  clearOverride: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDayMode: true,
  blend: 0,
  theme: 'day',
  toggleTheme: () => {},
  manualOverride: null,
  clearOverride: () => {},
});

// Night mode is permanently disabled — the app uses the light aurora theme.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'day');
  }, []);

  return (
    <ThemeContext.Provider value={{
      isDayMode: true,
      blend: 0,
      theme: 'day',
      toggleTheme: () => {},
      manualOverride: null,
      clearOverride: () => {},
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
