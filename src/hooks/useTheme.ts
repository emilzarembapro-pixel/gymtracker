import { useEffect } from 'react';
import { PROFILE } from '../constants/profiles';

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

/** Publishes the accent palette as CSS custom properties. The app is dark-only. */
export function useTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const { accent, accentMuted, accent2, soft, soft2 } = PROFILE;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-muted', accentMuted);
    root.style.setProperty('--accent-rgb', hexToRgb(accent));
    root.style.setProperty('--accent-shadow', `rgba(${hexToRgb(accent)}, 0.3)`);
    root.style.setProperty('--accent2', accent2);
    root.style.setProperty('--soft', soft);
    root.style.setProperty('--soft2', soft2);
    root.classList.add('dark');
  }, []);
}
