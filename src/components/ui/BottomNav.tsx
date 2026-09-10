import React from 'react';
import type { TabId } from '../../types';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: Array<{
  id: TabId;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'workout',
    label: 'Trening',
    icon: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9v6M6 6v12M9 8v8M15 8v8M18 6v12M21 9v6M9 12h6"/>
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'Historia',
    icon: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Statystyki',
    icon: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19V6M4 19h16M8 16V11M12 16V8M16 16v-3"/>
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Ustawienia',
    icon: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>
      </svg>
    ),
  },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.65) 30%, rgba(10,10,10,0.92) 100%)',
        backdropFilter: 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingTop: 10,
        paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
      }}
    >
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 8px',
              minWidth: 56,
              color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.42)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
          >
            {tab.icon}
            <span style={{
              fontSize: 10.5,
              fontWeight: isActive ? 600 : 500,
              lineHeight: 1,
            }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
