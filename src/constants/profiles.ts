import type { ProfileId, AppSettings } from '../types';

export const PROFILES: Record<ProfileId, {
  id: ProfileId;
  fullName: string;
  nickname: string;
  accent: string;
  accentMuted: string;
  accent2: string;
  soft: string;
  soft2: string;
  avatar: string;
}> = {
  emil: {
    id: 'emil',
    fullName: 'Emil',
    nickname: 'Nunek',
    accent: '#3b82f6',
    accentMuted: '#1d4ed8',
    accent2: '#6366F1',
    soft: 'rgba(59,130,246,0.14)',
    soft2: 'rgba(59,130,246,0.28)',
    avatar: '/avatars/emil.jpg',
  },
  nikola: {
    id: 'nikola',
    fullName: 'Nikola',
    nickname: 'Nuna',
    accent: '#F43F5E',
    accentMuted: '#E11D48',
    accent2: '#FB7185',
    soft: 'rgba(244,63,94,0.14)',
    soft2: 'rgba(244,63,94,0.28)',
    avatar: '/avatars/nikola.jpg',
  },
};

export const DEFAULT_SETTINGS: AppSettings = {
  timerEnabled: { emil: false, nikola: true },
  timerDuration: { emil: 90, nikola: 90 },
  theme: 'dark',
  pinnedExercises: { emil: [], nikola: [] },
};
