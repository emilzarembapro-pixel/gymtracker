import { useState, useRef, useCallback, useEffect } from 'react';
import { HAPTIC } from '../utils/haptics';

interface UseRestTimerReturn {
  secondsLeft: number;
  isRunning: boolean;
  start: (durationSeconds: number) => void;
  stop: () => void;
  addSeconds: (s: number) => void;
}

export function useRestTimer(onComplete?: () => void): UseRestTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const endTimestampRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setSecondsLeft(0);
    endTimestampRef.current = 0;
  }, []);

  const tick = useCallback(() => {
    const remaining = Math.max(0, Math.ceil((endTimestampRef.current - Date.now()) / 1000));
    setSecondsLeft(remaining);
    if (remaining <= 0) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
      HAPTIC.heavy();
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Gym Tracker', {
          body: 'Czas odpoczynku minął! 💪',
          icon: '/icons/icon-192.svg',
        });
      }
      onComplete?.();
    }
  }, [onComplete]);

  const start = useCallback((durationSeconds: number) => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    endTimestampRef.current = Date.now() + durationSeconds * 1000;
    setSecondsLeft(durationSeconds);
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 250);
  }, [tick]);

  const addSeconds = useCallback((s: number) => {
    endTimestampRef.current += s * 1000;
    tick();
  }, [tick]);

  // Resync on visibility change
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [isRunning, tick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { secondsLeft, isRunning, start, stop, addSeconds };
}
