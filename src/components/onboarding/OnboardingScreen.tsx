import { motion } from 'framer-motion';
import { useProfileStore } from '../../stores/profileStore';
import { PROFILES } from '../../constants/profiles';
import type { ProfileId } from '../../types';
import { Button } from '../ui/Button';

export function OnboardingScreen() {
  const setProfile = useProfileStore(s => s.setProfile);
  const activeProfile = useProfileStore(s => s.activeProfile);
  const completeOnboarding = useProfileStore(s => s.completeOnboarding);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100dvh' }}>
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)' }}>
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-white mb-2 text-center">
          Witaj w Gym Tracker!
        </h1>
        <p className="text-white/40 text-center mb-10 text-base">Kto dzisiaj trenuje?</p>

        <div className="w-full max-w-sm flex flex-col gap-3 mb-10">
          {(Object.values(PROFILES) as typeof PROFILES[ProfileId][]).map(profile => {
            const isSelected = activeProfile === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => setProfile(profile.id)}
                className="relative flex items-center gap-4 p-5 rounded-3xl transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: isSelected
                    ? `rgba(${profile.id === 'emil' ? '59,130,246' : '244,63,94'}, 0.12)`
                    : 'var(--bg-surface)',
                  border: `1px solid ${isSelected ? profile.accent : 'var(--border-glass)'}`,
                }}
              >
                {isSelected && (
                  <motion.div
                    layoutId="onboard-profile-ring"
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{ border: `2px solid ${profile.accent}` }}
                    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                  />
                )}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${profile.accent}, ${profile.accentMuted})` }}
                >
                  {profile.fullName[0]}
                </div>
                <div className="text-left">
                  <div className="text-base font-bold text-white">{profile.fullName}</div>
                  <div className="text-sm font-medium mt-0.5" style={{ color: profile.accent }}>
                    {profile.nickname}
                  </div>
                </div>
                {isSelected && (
                  <div
                    className="ml-auto w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: profile.accent }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <Button size="lg" fullWidth className="max-w-sm text-xl font-black min-h-[64px]" onClick={completeOnboarding}>
          Zacznij trenować
        </Button>
      </div>
    </div>
  );
}
