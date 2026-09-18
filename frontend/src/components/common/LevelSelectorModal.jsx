import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock, CheckCircle2 } from 'lucide-react';

export default function LevelSelectorModal({ isOpen, currentLevel, onSelectLevel, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="modal-card"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">How do you want to learn?</h2>
            <p className="step-description">
              Select a learning track tailored to your current linear algebra and matrix understanding.
            </p>
            
            <div className="level-options">
              <motion.div 
                className={`level-card ${currentLevel === 'basic' ? 'selected' : ''}`}
                onClick={() => { onSelectLevel('basic'); onClose(); }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div style={{ background: 'rgba(245, 197, 66, 0.15)', padding: '0.6rem', borderRadius: '10px' }}>
                  <Sparkles size={24} color="#F5C542" />
                </div>
                <div className="level-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Basic Track</h3>
                    <CheckCircle2 size={18} color="#F5C542" />
                  </div>
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', color: '#AAB8CC' }}>
                    Build intuition through interactive 2D pixel grids, color channels, and 2D transformation matrices.
                  </p>
                </div>
              </motion.div>

              <div className="level-card disabled">
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.6rem', borderRadius: '10px' }}>
                  <Lock size={24} color="#64748B" />
                </div>
                <div className="level-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#64748B' }}>Advanced Track</h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.08)', color: '#AAB8CC' }}>Coming Soon</span>
                  </div>
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', color: '#64748B' }}>
                    Explore deeper linear algebra concepts: Eigenvalues, SVD, Determinants, and 3D Vector Spaces.
                  </p>
                </div>
              </div>
            </div>

            <button className="close-btn" onClick={onClose}>Done</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
