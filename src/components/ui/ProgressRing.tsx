import { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ProgressRingProps {
  value: number;
  size: number;
  stroke: number;
  label?: React.ReactNode;
}

export function ProgressRing({ value, size, stroke, label }: ProgressRingProps) {
  const prefersReducedMotion = useReducedMotion();
  const clamped = Math.min(Math.max(value, 0), 1);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - clamped);
  const isComplete = clamped >= 1;

  const prevRef = useRef(clamped);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (clamped >= 1 && prevRef.current < 1 && !prefersReducedMotion) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 600);
      return () => clearTimeout(t);
    }
    prevRef.current = clamped;
  }, [clamped, prefersReducedMotion]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <motion.div
      style={{
        width: size,
        height: size,
        position: 'relative',
        flexShrink: 0,
        filter: isComplete
          ? `drop-shadow(0 0 ${Math.round(size * 0.14)}px rgba(var(--accent-rgb), 0.55))`
          : 'none',
        transition: 'filter 0.4s ease',
      }}
      animate={bounce ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: dashOffset }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 180, damping: 22 }
          }
        />
      </svg>
      {label && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {label}
        </div>
      )}
    </motion.div>
  );
}
