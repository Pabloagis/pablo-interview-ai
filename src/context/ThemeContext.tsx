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

// No-op if theme already matches — prevents unnecessary transitions
function applyTheme(dayMode: boolean) {
  const target = dayMode ? 'day' : 'night';
  if (document.documentElement.getAttribute('data-theme') === target) return;
  document.documentElement.classList.add('theme-transitioning');
  document.documentElement.setAttribute('data-theme', target);
  setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 500);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe default; corrected from DOM on mount (see effect below)
  const [isDayMode, setIsDayMode] = useState(false);
  const [manualOverride, setManualOverride] = useState<'day' | 'night' | null>(null);
  const overrideRef = useRef<'day' | 'night' | null>(null);
  const isFirstRender = useRef(true);

  // Apply theme to DOM on every isDayMode change — but skip the very first
  // render so we never clobber the data-theme the <head> script already set.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    applyTheme(isDayMode);
  }, [isDayMode]);

  useEffect(() => {
    // Clear any stale localStorage override from previous sessions so a fresh
    // load always starts from the time-based theme.
    try { localStorage.removeItem('im_theme_override'); } catch {}

    // Sync React state with what the <head> blocking script already set.
    const domTheme = document.documentElement.getAttribute('data-theme');
    setIsDayMode(domTheme === 'day');

    // Hourly auto-update (only when no manual override for this session)
    const interval = setInterval(() => {
      if (!overrideRef.current) {
        setIsDayMode(getIsInDayHours());
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const next: 'day' | 'night' = isDayMode ? 'night' : 'day';
    overrideRef.current = next;
    setManualOverride(next);
    setIsDayMode(next === 'day');
    // Intentionally NOT persisting to localStorage — override is session-only.
    // Fresh page load always uses the time-based rule.
  };

  const clearOverride = () => {
    overrideRef.current = null;
    setManualOverride(null);
    setIsDayMode(getIsInDayHours());
  };

  return (
    <ThemeContext.Provider value={{
      isDayMode,
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
