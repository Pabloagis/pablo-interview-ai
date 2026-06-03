'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

// Day: 08:00 – 19:00  |  Night: everything else
const DAY_START = 8 * 60;   // 480
const DAY_END   = 19 * 60;  // 1140

type Theme = 'day' | 'night';

interface ThemeContextType {
  isDayMode: boolean;
  blend: number;       // always 0 (day) or 1 (night) — no gradient
  theme: Theme;
  toggleTheme: () => void;
  manualOverride: 'day' | 'night' | null;
  clearOverride: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDayMode: false,
  blend: 1,
  theme: 'night',
  toggleTheme: () => {},
  manualOverride: null,
  clearOverride: () => {},
});

function getNowMins(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function computeBlend(mins: number): 0 | 1 {
  return mins >= DAY_START && mins < DAY_END ? 0 : 1;
}

function applyTheme(blend: 0 | 1) {
  const root = document.documentElement;
  const target: Theme = blend === 0 ? 'day' : 'night';

  if (root.getAttribute('data-theme') !== target) {
    root.classList.add('theme-transitioning');
    root.setAttribute('data-theme', target);
    setTimeout(() => root.classList.remove('theme-transitioning'), 500);
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [blend, setBlend] = useState<0 | 1>(1); // SSR default; corrected on mount
  const [manualOverride, setManualOverride] = useState<'day' | 'night' | null>(null);
  const overrideRef = useRef<'day' | 'night' | null>(null);
  const isFirstRender = useRef(true);

  // Apply theme to DOM — skip first render so the <head> blocking script's
  // data-theme is never overwritten before state syncs.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    applyTheme(blend);
  }, [blend]);

  useEffect(() => {
    try { localStorage.removeItem('im_theme_override'); } catch {}

    setBlend(computeBlend(getNowMins()));

    // Re-check every minute in case the hour boundary is crossed.
    const interval = setInterval(() => {
      if (!overrideRef.current) {
        setBlend(computeBlend(getNowMins()));
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const isDayMode = blend === 0;

  const toggleTheme = () => {
    const next: 'day' | 'night' = isDayMode ? 'night' : 'day';
    overrideRef.current = next;
    setManualOverride(next);
    setBlend(next === 'day' ? 0 : 1);
  };

  const clearOverride = () => {
    overrideRef.current = null;
    setManualOverride(null);
    setBlend(computeBlend(getNowMins()));
  };

  return (
    <ThemeContext.Provider value={{
      isDayMode,
      blend,
      theme: isDayMode ? 'day' : 'night',
      toggleTheme,
      manualOverride,
      clearOverride,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
