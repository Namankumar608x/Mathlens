import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock, CheckCircle2, Cpu } from 'lucide-react';

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
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-block">
              <span className="modal-badge-tag">Learning Pathways</span>
              <h2 className="modal-title">Select Learning Track</h2>
              <p className="step-description" style={{ fontSize: '0.92rem', marginBottom: 0 }}>
                Choose an interactive track tailored to your current matrix and linear algebra exploration goals.
              </p>
            </div>
            
            <div className="level-options">
              {/* Basic Intuition Track */}
              <motion.div 
                className={`level-card ${currentLevel === 'basic' ? 'selected' : ''}`}
                onClick={() => { onSelectLevel('basic'); onClose(); }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
              >
                <div className="level-card-icon-box active-icon-box">
                  <Sparkles size={22} className="level-sparkle-icon" />
                </div>
                <div className="level-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="level-card-title">Basic Intuition Track</h3>
                    {currentLevel === 'basic' && (
                      <span className="track-status-pill active-pill">
                        <CheckCircle2 size={13} /> Active
                      </span>
                    )}
                  </div>
                  <p className="level-card-desc">
                    Build visual intuition through 2D pixel grids, RGB channel matrix decomposition, scalar multipliers, and 2D spatial transformation matrices.
                  </p>
                </div>
              </motion.div>

              {/* Advanced Linear Algebra Track */}
              <div className="level-card disabled">
                <div className="level-card-icon-box disabled-icon-box">
                  <Cpu size={22} color="var(--text-muted)" />
                </div>
                <div className="level-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="level-card-title disabled-title">Advanced Track</h3>
                    <span className="track-status-pill coming-soon-pill">
                      <Lock size={12} /> Coming Soon
                    </span>
                  </div>
                  <p className="level-card-desc disabled-desc">
                    Explore deeper vector spaces: Eigenvalues & Eigenvectors, Singular Value Decomposition (SVD), 3D Projections, and Image Compression Tensors.
                  </p>
                </div>
              </div>
            </div>

            <button className="close-btn" onClick={onClose}>Apply Track & Continue</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
