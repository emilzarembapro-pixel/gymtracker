import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            className={cn(
              'relative w-full rounded-t-3xl',
              'max-h-[92vh] overflow-y-auto',
              'pb-[env(safe-area-inset-bottom,0px)]',
              className,
            )}
            style={{
              background: 'rgba(17,17,17,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: 'none',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Header */}
            {title && (
              <div
                className="flex items-center justify-between px-5 py-3 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <h2 className="text-base font-bold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-white/40 hover:text-white/70 transition-colors"
                  aria-label="Zamknij"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
