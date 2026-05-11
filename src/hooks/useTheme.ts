import { useEffect } from 'react';
import { useProfileStore } from '../stores/profileStore';
import { useSettingsStore } from '../stores/settingsStore';
import { PROFILES } from '../constants/profiles';

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function hexToRgba(hex: string, alpha: number): string {
  return `rgba(${hexToRgb(hex)}, ${alpha})`;
}

export function useTheme() {
  const profile = useProfileStore(s => s.activeProfile);
  const theme = useSettingsStore(s => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const { accent, accentMuted, accent2, soft, soft2 } = PROFILES[profile];
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-muted', accentMuted);
    root.style.setProperty('--accent-rgb', hexToRgb(accent));
    root.style.setProperty('--accent-shadow', hexToRgba(accent, 0.3));
    root.style.setProperty('--accent2', accent2);
    root.style.setProperty('--soft', soft);
    root.style.setProperty('--soft2', soft2);

    const applyDark = (dark: boolean) => root.classList.toggle('dark', dark);
    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyDark(mq.matches);
      const handler = (e: MediaQueryListEvent) => applyDark(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      applyDark(theme === 'dark');
    }
  }, [profile, theme]);
}
