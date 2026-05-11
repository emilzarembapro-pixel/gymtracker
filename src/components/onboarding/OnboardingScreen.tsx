import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '../../stores/profileStore';
import { PROFILES } from '../../constants/profiles';
import type { ProfileId } from '../../types';
import { Button } from '../ui/Button';

function StepProfile({ onNext }: { onNext: () => void }) {
  const setProfile = useProfileStore(s => s.setProfile);
  const activeProfile = useProfileStore(s => s.activeProfile);

  return (
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

      <Button size="lg" fullWidth className="max-w-sm" onClick={onNext}>
        Dalej
      </Button>
    </div>
  );
}

function StepHowTo({ onFinish }: { onFinish: () => void }) {
  const steps = [
    {
      num: '1',
      text: 'Kliknij „Rozpocznij trening" na ekranie Trening',
    },
    {
      num: '2',
      text: 'Wybierz ćwiczenie z listy lub wyszukaj je',
    },
    {
      num: '3',
      text: 'Wpisz ciężar i liczbę powtórzeń, zapisz serię',
    },
    {
      num: '4',
      text: 'Po skończeniu kliknij „Zakończ trening"',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)' }}>
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path d="M9 7h6M9 11h6M9 15h4" />
        </svg>
      </div>
      <h2 className="text-3xl font-black text-white mb-2 text-center">
        Jak to działa?
      </h2>
      <p className="text-white/40 text-center mb-10 text-sm">
        Tak prosto jak to tylko możliwe
      </p>

      <div className="w-full max-w-sm space-y-3 mb-10">
        {steps.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card flex items-start gap-4 p-4"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-muted))' }}
            >
              {item.num}
            </div>
            <p className="text-white/75 text-sm leading-relaxed pt-1">{item.text}</p>
          </motion.div>
        ))}
      </div>

      <p className="text-white/25 text-xs text-center mb-8 max-w-xs leading-relaxed">
        Wszystkie dane zapisywane są lokalnie w przeglądarce — żadnych kont, żadnych serwerów.
      </p>

      <Button size="lg" fullWidth className="max-w-sm text-xl font-black min-h-[64px]" onClick={onFinish}>
        Zacznij trenować
      </Button>
    </div>
  );
}

export function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const completeOnboarding = useProfileStore(s => s.completeOnboarding);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100dvh' }}>
      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <StepProfile onNext={() => setStep(1)} />
          </motion.div>
        ) : (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <StepHowTo onFinish={completeOnboarding} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicator */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-2 pointer-events-none">
        {[0, 1].map(i => (
          <motion.div
            key={i}
            animate={{
              width: i === step ? 24 : 8,
              opacity: i === step ? 1 : 0.3,
            }}
            transition={{ duration: 0.3 }}
            className="h-2 rounded-full"
            style={{ background: 'var(--accent)' }}
          />
        ))}
      </div>
    </div>
  );
}
