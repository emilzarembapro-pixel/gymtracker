import type { ProfileId, AppSettings } from '../types';

export const PROFILE_ID: ProfileId = 'emil';

export const PROFILE = {
  id: 'emil' as ProfileId,
  accent: '#3b82f6',
  accentMuted: '#1d4ed8',
  accent2: '#6366F1',
  soft: 'rgba(59,130,246,0.14)',
  soft2: 'rgba(59,130,246,0.28)',
};

export const DEFAULT_SETTINGS: AppSettings = {
  timerEnabled: { emil: false },
  timerDuration: { emil: 90 },
  pinnedExercises: { emil: [] },
};
