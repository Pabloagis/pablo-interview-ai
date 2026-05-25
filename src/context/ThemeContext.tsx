'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

// ─── Time rules ────────────────────────────────────────────────────────────
// Hard day:   08:00 – 19:00
// Dusk blend: 19:00 – 21:00  (day → night, 2-hour gradient)
// Hard night: 21:00 – 06:00
// Dawn blend: 06:00 – 08:00  (night → day, 2-hour gradient)
const DAY_FIRM   = 8 * 60;   // 480  — hard day starts
const DUSK_START = 19 * 60;  // 1140 — dusk transition starts
const NIGHT_FIRM = 21 * 60;  // 1260 — hard night starts
const DAWN_START = 6 * 60;   // 360  — dawn transition starts
const DAWN_END   = 8 * 60;   // 480  — hard day starts (= DAY_FIRM)

type Theme = 'day' | 'night';

interface ThemeContextType {
  isDayMode: boolean;
  blend: number;       // 0 = full day, 1 = full night
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

/** 0 = full day · 1 = full night */
function computeBlend(mins: number): number {
  if (mins >= DAY_FIRM && mins < DUSK_START) return 0;
  if (mins >= DUSK_START && mins < NIGHT_FIRM)
    return (mins - DUSK_START) / (NIGHT_FIRM - DUSK_START);
  if (mins >= NIGHT_FIRM || mins < DAWN_START) return 1;
  return 1 - (mins - DAWN_START) / (DAWN_END - DAWN_START);
}

// ─── CSS variable interpolation ────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function bHex(h1: string, h2: string, t: number): string {
  const p = (h: string, o: number) => parseInt(h.slice(o, o + 2), 16);
  return `rgb(${lerp(p(h1,1),p(h2,1),t)},${lerp(p(h1,3),p(h2,3),t)},${lerp(p(h1,5),p(h2,5),t)})`;
}

function bRgba(a: number[], b: number[], t: number): string {
  return `rgba(${lerp(a[0],b[0],t)},${lerp(a[1],b[1],t)},${lerp(a[2],b[2],t)},${+(a[3]+(b[3]-a[3])*t).toFixed(3)})`;
}

const BLEND_KEYS = [
  '--bg-base','--bg-mid','--bg-surface','--bg-elevated',
  '--nav-bg','--nav-border','--modal-bg',
  '--text-primary',
  '--bg-gradient','--blob-a','--blob-b','--blob-c',
];

function applyBlend(blend: number) {
  const root = document.documentElement;
  const dayMode = blend < 0.5;
  const target = dayMode ? 'day' : 'night';

  if (root.getAttribute('data-theme') !== target) {
    root.classList.add('theme-transitioning');
    root.setAttribute('data-theme', target);
    setTimeout(() => root.classList.remove('theme-transitioning'), 500);
  }

  if (blend === 0 || blend === 1) {
    BLEND_KEYS.forEach(k => root.style.removeProperty(k));
    return;
  }

  // Interpolate backgrounds, nav, text
  const bg1 = bHex('#f0eeea', '#0d0f14', blend);
  const bg2 = bHex('#e8e6e2', '#111520', blend);
  const bg3 = bHex('#ffffff', '#161a28', blend);
  const bg4 = bHex('#f5f4f1', '#1c2135', blend);

  root.style.setProperty('--bg-base', bg1);
  root.style.setProperty('--bg-mid', bg2);
  root.style.setProperty('--bg-surface', bg3);
  root.style.setProperty('--bg-elevated', bg4);
  root.style.setProperty('--nav-bg',     bRgba([255,255,255,0.82],[13,15,20,0.88], blend));
  root.style.setProperty('--nav-border', bRgba([0,0,0,0.07],[255,255,255,0.08],   blend));
  root.style.setProperty('--modal-bg',   bRgba([255,255,255,0.97],[28,33,53,0.97], blend));
  root.style.setProperty('--text-primary', bHex('#0d1117', '#ffffff', blend));

  // Background component vars
  const bgStop2 = bHex('#ebe9e4', '#111520', blend);
  const bgStop3 = bHex('#edeae6', '#0a0e18', blend);
  root.style.setProperty('--bg-gradient',
    `linear-gradient(145deg,${bg1} 0%,${bgStop2} 45%,${bgStop3} 100%)`);
  root.style.setProperty('--blob-a', bRgba([58,85,192,0.10],[60,90,200,0.28], blend));
  root.style.setProperty('--blob-b', bRgba([96,48,184,0.08],[100,60,180,0.22], blend));
  root.style.setProperty('--blob-c', bRgba([26,122,150,0.07],[40,130,160,0.18], blend));
}

// ─── Provider ──────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [blend, setBlend] = useState(1); // SSR default; corrected on mount from DOM
  const [manualOverride, setManualOverride] = useState<'day' | 'night' | null>(null);
  const overrideRef = useRef<'day' | 'night' | null>(null);
  const isFirstRender = useRef(true);

  // Apply blend to DOM on every change — skip first render so the <head>
  // blocking script's data-theme is never overwritten before state syncs.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    applyBlend(blend);
  }, [blend]);

  useEffect(() => {
    // Remove any stale localStorage override; fresh load always uses the time rule.
    try { localStorage.removeItem('im_theme_override'); } catch {}

    // Sync React state with what the blocking script already set.
    setBlend(computeBlend(getNowMins()));

    // Re-compute every minute (handles transition windows + hour crossings).
    const interval = setInterval(() => {
      if (!overrideRef.current) {
        setBlend(computeBlend(getNowMins()));
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const isDayMode = blend < 0.5;

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
