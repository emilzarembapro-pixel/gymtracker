import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProfileStore } from './stores/profileStore';
import { useTheme } from './hooks/useTheme';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';
import { SplashScreen } from './components/ui/SplashScreen';
import { PRToast } from './components/ui/PRToast';
import { BottomNav } from './components/ui/BottomNav';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { StatsScreen } from './screens/StatsScreen';
import { ComparisonScreen } from './screens/ComparisonScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import type { TabId } from './types';

const tabTransition = { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const };

function App() {
  useTheme();
  const onboardingDone = useProfileStore(s => s.onboardingDone);
  const [tab, setTab] = useState<TabId>('workout');
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('splash_shown'));

  const handleSplashDone = () => {
    sessionStorage.setItem('splash_shown', '1');
    setShowSplash(false);
  };

  if (!onboardingDone) {
    return <OnboardingScreen />;
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onDone={handleSplashDone} />}
      </AnimatePresence>
      <PRToast />
      <div className="flex flex-col min-h-dvh" style={{ background: 'var(--bg-base)' }}>
        <main
          className="flex-1 overflow-y-auto"
          style={{
            paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
            backgroundImage: 'radial-gradient(120% 60% at 50% -10%, var(--soft) 0%, transparent 60%)',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={tabTransition}
            >
              {tab === 'workout' && <WorkoutScreen />}
              {tab === 'history' && <HistoryScreen />}
              {tab === 'stats' && <StatsScreen />}
              {tab === 'comparison' && <ComparisonScreen />}
              {tab === 'settings' && <SettingsScreen />}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav activeTab={tab} onTabChange={setTab} />
      </div>
    </>
  );
}

export default App;
