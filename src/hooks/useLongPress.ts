import React, { useRef, useCallback } from 'react';

/**
 * Fires `onLongPress` after `delay` and swallows the click that follows,
 * so a long press does not also trigger the button's own onClick.
 */
export function useLongPress(onLongPress: () => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const start = useCallback(() => {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (firedRef.current) {
      firedRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onClickCapture,
  };
}
