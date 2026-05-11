import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={onDone}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        overflow: 'hidden', cursor: 'pointer',
      }}
    >
      <img
        src="/splash-photo.jpg"
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center top',
        }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)',
      }} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative',
          padding: '0 32px calc(env(safe-area-inset-bottom, 0px) + 52px)',
          textAlign: 'center', width: '100%',
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 10 }}>
          Miłego treningu!
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.62)', fontWeight: 500, marginBottom: 28 }}>
          Emil &amp; Nikola
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 20px', borderRadius: 999,
          background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600,
        }}>
          <span>Dotknij, żeby zacząć</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
