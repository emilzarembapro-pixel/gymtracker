export function vibrate(pattern: number | number[] = 30): void {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

export const HAPTIC = {
  light: () => vibrate(10),
  medium: () => vibrate(30),
  heavy: () => vibrate([50, 30, 50]),
  prCelebration: () => vibrate([40, 30, 40, 30, 80]),
} as const;
