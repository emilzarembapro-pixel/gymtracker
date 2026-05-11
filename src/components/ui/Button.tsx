import React from 'react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl min-h-[40px]',
  md: 'px-5 py-3 text-base rounded-2xl min-h-[48px]',
  lg: 'px-6 py-4 text-lg rounded-2xl min-h-[56px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  style,
  children,
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-150 active:scale-[0.97]',
        'disabled:opacity-40 disabled:pointer-events-none',
        variant === 'secondary' && 'glass-card text-white/80 hover:bg-white/10',
        variant === 'ghost' && 'bg-transparent text-white/50 hover:text-white/80 hover:bg-white/5 rounded-2xl',
        (isPrimary || isDanger) && 'accent-glow text-white',
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      style={{
        ...(isPrimary && {
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-muted) 100%)',
          transition: 'background 0.45s ease, box-shadow 0.45s ease, transform 0.15s ease',
        }),
        ...(isDanger && {
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)',
        }),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
