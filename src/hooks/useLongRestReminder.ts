import { useCallback, useEffect, useRef } from 'react';
import { HAPTIC } from '../utils/haptics';

/** Buzz when a rest between sets runs past this mark. */
export const LONG_REST_MS = 180_000;

/**
 * Vibrates once when 180 s pass since the last saved set, independent of the
 * rest timer (which may be off or set to a shorter duration).
 */
export function useLongRestReminder() {
  const timeoutRef = useRef<number | null>(null);
  const dueAtRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    dueAtRef.current = null;
  }, []);

  const fire = useCallback(() => {
    clear();
    HAPTIC.heavy();
  }, [clear]);

  const arm = useCallback(() => {
    clear();
    dueAtRef.current = Date.now() + LONG_REST_MS;
    timeoutRef.current = window.setTimeout(fire, LONG_REST_MS);
  }, [clear, fire]);

  // Timers are throttled in background tabs — resync when the app comes back
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState !== 'visible' || dueAtRef.current === null) return;
      const remaining = dueAtRef.current - Date.now();
      if (remaining <= 0) {
        fire();
        return;
      }
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(fire, remaining);
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [fire]);

  useEffect(() => clear, [clear]);

  return { arm, clear };
}
