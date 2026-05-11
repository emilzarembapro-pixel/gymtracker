import type { AppSettings } from '../../types';
import { useSettingsStore } from '../../stores/settingsStore';
import { cn } from '../../utils/cn';

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}


const OPTIONS: Array<{ id: AppSettings['theme']; label: string; icon: React.ReactNode }> = [
  { id: 'dark', label: 'Ciemny', icon: <MoonIcon /> },
];

import React from 'react';

export function ThemeToggle() {
  const theme = useSettingsStore(s => s.theme);
  const setTheme = useSettingsStore(s => s.setTheme);

  return (
    <div className="flex flex-col gap-2">
      {OPTIONS.map(opt => {
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            className={cn(
              'flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-sm font-semibold',
              isActive ? 'text-white' : 'text-white/40',
            )}
            style={isActive ? {
              background: 'rgba(var(--accent-rgb), 0.12)',
              borderColor: 'var(--accent)',
              transition: 'background 0.45s ease, border-color 0.45s ease',
            } : {
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {isActive && (
              <div className="ml-auto">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
