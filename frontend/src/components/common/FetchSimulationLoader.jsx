import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FEATURES } from '../../config/features';

const STAGES = [
  { pct: 20, label: 'Initializing mathematical core...' },
  { pct: 50, label: 'Synthesizing pixel coordinate tensors...' },
  { pct: 75, label: 'Calibrating transformation matrices...' },
  { pct: 90, label: 'Preparing ray optics & visual laboratories...' },
  { pct: 100, label: 'Environment ready' }
];

export default function FetchSimulationLoader({ isOpen, onComplete, minDuration = 2800 }) {
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setStageIndex(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / minDuration) * 100));

      setProgress(pct);

      const matched = STAGES.findIndex((st, i) => {
        const next = STAGES[i + 1];
        return pct >= st.pct && (!next || pct < next.pct);
      });
      if (matched !== -1) {
        setStageIndex(matched);
      }

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 380);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isOpen, minDuration, onComplete]);

  // Press Esc to dismiss immediately
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setProgress(100);
        if (onComplete) onComplete();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const currentStage = STAGES[stageIndex] || STAGES[0];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none"
        style={{
          backgroundColor: '#070a12',
          backdropFilter: 'blur(20px)',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.99, filter: 'blur(8px)' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Subtle, soft monochromatic radial background vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(14, 165, 233, 0.06), transparent 70%), radial-gradient(circle 300px at 50% 50%, rgba(255, 255, 255, 0.02), transparent 80%)'
          }}
        />

        {/* Minimal grid lines in the background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            backgroundPosition: 'center center'
          }}
        />

        {/* Center Content Card */}
        <motion.div
          className="relative z-10 flex flex-col items-center text-center px-6"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={{ maxWidth: '420px', width: '100%' }}
        >
          {/* High-Tech Circular Optical / Orbital Lens Visualizer */}
          <div className="relative w-36 h-36 mb-6 flex items-center justify-center">
            {/* Ambient soft glow behind circular engine */}
            <div
              className="absolute w-28 h-28 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
                filter: 'blur(12px)'
              }}
            />

            {/* Circular Pulse Wave Ripple 1 (radiating outward) */}
            <motion.div
              className="absolute rounded-full border border-cyan-500/20 pointer-events-none"
              animate={{
                width: ['40px', '136px'],
                height: ['40px', '136px'],
                opacity: [0.7, 0]
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeOut'
              }}
            />

            {/* Circular Pulse Wave Ripple 2 (staggered) */}
            <motion.div
              className="absolute rounded-full border border-sky-400/15 pointer-events-none"
              animate={{
                width: ['40px', '136px'],
                height: ['40px', '136px'],
                opacity: [0.7, 0]
              }}
              transition={{
                duration: 2.8,
                delay: 1.4,
                repeat: Infinity,
                ease: 'easeOut'
              }}
            />

            {/* Outer Orbital Ring 1: Subtle dashed ring rotating clockwise */}
            <motion.div
              className="absolute w-32 h-32 rounded-full border border-dashed border-slate-600/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            >
              {/* Orbiting Satellite Photon on Outer Ring */}
              <motion.div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#38bdf8]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>

            {/* Middle Gyro Ring 2: Precision dual-arc rotating counter-clockwise */}
            <motion.div
              className="absolute w-24 h-24 rounded-full border border-white/10 border-t-cyan-400/80 border-b-cyan-400/80"
              animate={{ rotate: -360 }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            >
              {/* Secondary photon on middle ring */}
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
            </motion.div>

            {/* Middle Ring 3: Segmented optical ticks ring */}
            <motion.div
              className="absolute w-20 h-20 rounded-full border border-white/5 border-l-sky-400/60 border-r-sky-400/60"
              animate={{ rotate: 360 }}
              transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
            />

            {/* Optical Radar/Ray Sweeping Beam */}
            <motion.div
              className="absolute w-28 h-28 rounded-full pointer-events-none"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, transparent 315deg, rgba(56, 189, 248, 0.18) 360deg)'
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'linear' }}
            />

            {/* Inner Precision Crosshairs (Axis alignment) */}
            <div className="absolute w-16 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />
            <div className="absolute h-16 w-[1px] bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent pointer-events-none" />

            {/* Central Optical Aperture / Core */}
            <motion.div
              className="relative w-11 h-11 rounded-full bg-slate-950/80 border border-cyan-400/40 shadow-[0_0_20px_rgba(56,189,248,0.25)] flex items-center justify-center backdrop-blur-md"
              animate={{
                scale: [0.96, 1.04, 0.96],
                borderColor: [
                  'rgba(56, 189, 248, 0.35)',
                  'rgba(56, 189, 248, 0.7)',
                  'rgba(56, 189, 248, 0.35)'
                ]
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Concentric innermost aperture ring */}
              <div className="w-6 h-6 rounded-full border border-dashed border-cyan-300/40 flex items-center justify-center">
                {/* Glowing Center Pupil Dot */}
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-cyan-400 to-sky-200 shadow-[0_0_10px_#38bdf8]"
                  animate={{
                    scale: [0.85, 1.25, 0.85],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          </div>

          {/* Brand & Subtitle */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-cyan-400">◈</span>
            <span className="text-sm font-semibold tracking-wider uppercase text-slate-100">
              MathLens
            </span>
            <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
              LABS
            </span>
          </div>

          <h2 className="text-base font-medium text-slate-200 tracking-tight mb-6">
            Loading Visual Laboratory
          </h2>

          {/* Minimal hairline progress track */}
          <div className="w-full mb-3">
            <div className="relative w-full h-[3px] rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                style={{ width: `${progress}%`, transition: 'width 0.15s ease-out' }}
              />
            </div>
          </div>

          {/* Status text & percentage counter */}
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="text-slate-400 font-sans tracking-normal truncate text-left pr-2">
              {currentStage.label}
            </span>
            <span className="text-slate-200 font-semibold tabular-nums flex-shrink-0">
              {progress}%
            </span>
          </div>

          {/* Discreet footer meta */}
          <div className="mt-8 flex items-center gap-3 text-[11px] text-slate-500">
            <span>{FEATURES.length} Interactive Modules</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setProgress(100);
                if (onComplete) onComplete();
              }}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer underline underline-offset-4 decoration-white/10"
            >
              Skip (Esc)
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
