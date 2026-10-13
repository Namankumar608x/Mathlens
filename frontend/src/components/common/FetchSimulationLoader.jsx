import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FetchSimulationLoader({ isOpen, onComplete, minDuration = 650 }) {
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, minDuration);

    const handleKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        if (onComplete) onComplete();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, minDuration, onComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none"
        style={{
          backgroundColor: 'var(--bg-primary, #0D0F14)',
          transition: 'background-color 0.25s ease'
        }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeInOut' } }}
      >
        <motion.div
          className="flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25 }}
        >
          {/* Elegant Circular Optical Lens Loader */}
          <div className="relative w-28 h-28 mb-5 flex items-center justify-center">
            {/* Ambient soft glow */}
            <div
              className="absolute w-20 h-20 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, var(--accent-subtle, rgba(130, 159, 199, 0.15)) 0%, transparent 70%)',
                filter: 'blur(10px)'
              }}
            />

            {/* Outer Rotating Dashed Ring */}
            <motion.div
              className="absolute w-24 h-24 rounded-full border border-dashed"
              style={{ borderColor: 'var(--border-color, #232836)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            >
              {/* Photon Dot */}
              <div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: 'var(--accent-primary, #829FC7)',
                  boxShadow: '0 0 8px var(--accent-primary, #829FC7)'
                }}
              />
            </motion.div>

            {/* Middle Gyro Ring: Precision Dual-Arc Rotating Counter-Clockwise */}
            <motion.div
              className="absolute w-18 h-18 rounded-full border border-transparent"
              style={{
                borderTopColor: 'var(--accent-primary, #829FC7)',
                borderBottomColor: 'var(--accent-primary, #829FC7)',
                borderWidth: '1.5px'
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
              <div
                className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--text-primary, #FFFFFF)' }}
              />
            </motion.div>

            {/* Inner Core Aperture */}
            <motion.div
              className="relative w-9 h-9 rounded-full border flex items-center justify-center"
              style={{
                backgroundColor: 'var(--bg-secondary, #13161F)',
                borderColor: 'var(--border-hover, #384156)'
              }}
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-primary, #829FC7)' }}
              />
            </motion.div>
          </div>

          {/* Simple Clean MathLens Title */}
          <div className="flex items-center gap-2">
            <span
              className="font-extrabold text-xl tracking-tight"
              style={{ color: 'var(--text-primary, #FFFFFF)', fontFamily: 'var(--font-sans)' }}
            >
              MathLens
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
