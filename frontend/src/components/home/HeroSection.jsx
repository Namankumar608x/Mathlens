import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Grid,
  Compass,
  Maximize2,
  Blend,
  Play,
  Layers,
  Zap,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { FEATURES, CATEGORIES } from '../../config/features';

export default function HeroSection({ onStartExploring, onSelectStep, onSelectView, onOpenCommandPalette }) {
  // Interactive mini 3x3 matrix in the hero visualizer
  const [heroMatrix, setHeroMatrix] = useState([
    [220, 45, 180],
    [90, 255, 120],
    [15, 175, 240]
  ]);
  const [selectedCell, setSelectedCell] = useState({ r: 1, c: 1 });
  const [angle, setAngle] = useState(0);

  // Subtle continuous rotation of the 3D coordinate frame
  useEffect(() => {
    const timer = setInterval(() => {
      setAngle(prev => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const handleCellClick = (r, c) => {
    setSelectedCell({ r, c });
    // Cycle value
    setHeroMatrix(prev => {
      const copy = prev.map(row => [...row]);
      copy[r][c] = (copy[r][c] + 65) % 256;
      return copy;
    });
  };

  return (
    <div className="hero-page-wrapper">
      {/* 1. Main Hero Presentation */}
      <section className="hero-masthead-section">
        <div className="hero-content-grid">
          {/* Left: Copy & Value Proposition */}
          <motion.div 
            className="hero-copy-column"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Pill Tag */}
            <div className="hero-status-pill">
              <span className="hero-pulse-dot" />
              <span className="hero-pill-text">Interactive Linear Algebra & Vision Lab</span>
              <Sparkles size={13} className="text-cyan-400" />
            </div>

            {/* Headline */}
            <h1 className="hero-headline">
              See Mathematics <br />
              <span className="hero-gradient-text">Differently.</span>
            </h1>

            {/* Subheading */}
            <p className="hero-subheading">
              Don’t just calculate mathematics. <em>See it. Manipulate it. Understand it.</em> Bridge the gap between abstract matrix equations and tangible digital pixels through 14 real-time interactive laboratory experiments.
            </p>

            {/* CTAs */}
            <div className="hero-cta-row">
              <motion.button
                className="hero-primary-btn"
                onClick={() => onSelectStep(1)}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>Start Exploring</span>
                <ArrowRight size={17} />
              </motion.button>

              <motion.button
                className="hero-secondary-btn glass-level-2"
                onClick={onOpenCommandPalette}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>Search Modules (⌘K)</span>
              </motion.button>
            </div>

            {/* Trust / Stats strip */}
            <div className="hero-stats-strip">
              <div className="hero-stat-item">
                <span className="stat-value">14</span>
                <span className="stat-label">Interactive Labs</span>
              </div>
              <div className="stat-separator" />
              <div className="hero-stat-item">
                <span className="stat-value">60 FPS</span>
                <span className="stat-label">Canvas Engine</span>
              </div>
              <div className="stat-separator" />
              <div className="hero-stat-item">
                <span className="stat-value">100%</span>
                <span className="stat-label">Visual Math</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Interactive 3D / Isometric Mathematical Visualization */}
          <motion.div
            className="hero-visual-column"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-visual-stage glass-level-3">
              {/* Stage Header */}
              <div className="visual-stage-header">
                <div className="stage-dots">
                  <span className="stage-dot red" />
                  <span className="stage-dot yellow" />
                  <span className="stage-dot green" />
                </div>
                <span className="stage-title">Interactive Tensor Viewport</span>
                <span className="stage-badge">Live Math</span>
              </div>

              {/* Central Interactive Grid Visualizer */}
              <div className="stage-interactive-core">
                {/* 3x3 Matrix Grid */}
                <div className="hero-matrix-box">
                  <span className="matrix-label-top">Matrix A (3×3)</span>
                  <div className="hero-matrix-bracket left">[</div>
                  <div className="hero-matrix-grid">
                    {heroMatrix.map((row, r) =>
                      row.map((val, c) => {
                        const isSelected = selectedCell.r === r && selectedCell.c === c;
                        return (
                          <div
                            key={`${r}-${c}`}
                            className={`hero-matrix-cell ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleCellClick(r, c)}
                            title={`Cell (${r}, ${c}): ${val} - Click to cycle`}
                          >
                            <span className="hero-cell-val">{val}</span>
                            <span className="hero-cell-coord">[{r},{c}]</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="hero-matrix-bracket right">]</div>
                </div>

                {/* Animated Transformation Vector Arrow */}
                <div className="hero-transform-connector">
                  <div className="connector-pulse-line" />
                  <span className="connector-operator">X' = AX</span>
                </div>

                {/* Resulting 3x3 Pixel Canvas */}
                <div className="hero-canvas-box">
                  <span className="matrix-label-top">Rendered Pixels</span>
                  <div className="hero-pixel-grid">
                    {heroMatrix.map((row, r) =>
                      row.map((val, c) => {
                        const isSelected = selectedCell.r === r && selectedCell.c === c;
                        return (
                          <div
                            key={`px-${r}-${c}`}
                            className={`hero-pixel-square ${isSelected ? 'pulse-border' : ''}`}
                            style={{
                              backgroundColor: `rgb(${val}, ${val}, ${val})`
                            }}
                            onClick={() => handleCellClick(r, c)}
                          />
                        );
                      })
                    )}
                  </div>
                  <span className="matrix-hint-bot">Click any cell to mutate pixel</span>
                </div>
              </div>

              {/* Floating Formula Badge */}
              <div className="stage-formula-pill">
                <span className="formula-tag">Active State:</span>
                <code className="formula-code">
                  I({selectedCell.r}, {selectedCell.c}) = {heroMatrix[selectedCell.r][selectedCell.c]}
                </code>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Structured Learning Pathways / Feature Showcase */}
      <section className="hero-curriculum-overview">
        <div className="section-header-block">
          <span className="section-pre-tag">Core Curriculum</span>
          <h2 className="section-headline">Four Foundations of Visual Linear Algebra</h2>
          <p className="section-description">
            Explore 14 progressive modules, carefully engineered to make mathematical intuition instant and memorable.
          </p>
        </div>

        <div className="hero-pathways-grid">
          {/* Pathway 1 */}
          <motion.div
            className="pathway-card glass-level-2"
            whileHover={{ y: -4, borderColor: 'rgba(34, 211, 238, 0.4)' }}
            onClick={() => onSelectStep(1)}
          >
            <div className="pathway-icon-box cyan-glow">
              <Grid size={22} className="text-cyan-400" />
            </div>
            <div className="pathway-step-count">Steps 01 — 06</div>
            <h3 className="pathway-title">Pixel & Matrix Foundations</h3>
            <p className="pathway-desc">
              Understand pixels as numerical intensity arrays. Edit cells, scale brightness with scalar $kA$, and decompose color images into 3D RGB tensors.
            </p>
            <div className="pathway-footer">
              <span>6 Modules</span>
              <ArrowRight size={14} className="pathway-arrow" />
            </div>
          </motion.div>

          {/* Pathway 2 */}
          <motion.div
            className="pathway-card glass-level-2"
            whileHover={{ y: -4, borderColor: 'rgba(168, 85, 247, 0.4)' }}
            onClick={() => onSelectStep(7)}
          >
            <div className="pathway-icon-box violet-glow">
              <Compass size={22} className="text-violet-400" />
            </div>
            <div className="pathway-step-count">Step 07</div>
            <h3 className="pathway-title">2D Coordinate Transformations</h3>
            <p className="pathway-desc">
              See what matrices do to physical space: rotate, shear, scale, and reflect shapes by mapping vector coordinates $X' = AX$.
            </p>
            <div className="pathway-footer">
              <span>Interactive Space</span>
              <ArrowRight size={14} className="pathway-arrow" />
            </div>
          </motion.div>

          {/* Pathway 3: Visual Labs */}
          <motion.div
            className="pathway-card glass-level-2"
            whileHover={{ y: -4, borderColor: 'rgba(59, 130, 246, 0.4)' }}
            onClick={() => onSelectStep(8)}
          >
            <div className="pathway-icon-box blue-glow">
              <Blend size={22} className="text-blue-400" />
            </div>
            <div className="pathway-step-count">Steps 08 — 14</div>
            <h3 className="pathway-title">Visual Labs</h3>
            <p className="pathway-desc">
              Matrix blending, background subtraction, defect change detection, negative inversion, determinant area scaling, and reversible inverse transformations.
            </p>
            <div className="pathway-footer">
              <span>7 Interactive Labs</span>
              <ArrowRight size={14} className="pathway-arrow" />
            </div>
          </motion.div>

          {/* Pathway 4: Coming Soon - Advanced Mathematics */}
          <motion.div
            className="pathway-card glass-level-2 roadmap-pathway-card"
            whileHover={{ y: -4, borderColor: 'rgba(245, 158, 11, 0.4)' }}
            onClick={() => onSelectView ? onSelectView('roadmap') : onSelectStep(12)}
          >
            <div className="pathway-icon-box amber-glow">
              <Lock size={22} className="text-amber-400" />
            </div>
            <div className="pathway-step-count" style={{ color: 'var(--accent-amber)' }}>Coming Soon</div>
            <h3 className="pathway-title">Advanced Mathematics</h3>
            <p className="pathway-desc">
              Eigenvalues, Eigenvectors, SVD, PCA, Fourier Transforms, and AI Math Tutoring currently in active research &amp; development.
            </p>
            <div className="pathway-footer">
              <span style={{ color: 'var(--accent-amber)' }}>Product Roadmap</span>
              <ArrowRight size={14} className="pathway-arrow text-amber-400" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Quick Start Interactive Directory */}
      <section className="hero-modules-directory">
        <div className="section-header-block">
          <span className="section-pre-tag">All Experiments</span>
          <h2 className="section-headline">Jump Straight into Any Module</h2>
        </div>

        <div className="directory-cards-grid">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.button
                key={feat.id}
                className="directory-item-card glass-level-1"
                onClick={() => onSelectStep(feat.stepNumber)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="dir-item-top">
                  <div className="dir-icon-box">
                    <Icon size={16} />
                  </div>
                  <span className="dir-step-pill">0{feat.stepNumber}</span>
                </div>
                <h4 className="dir-item-title">{feat.shortTitle}</h4>
                <p className="dir-item-desc">{feat.summary}</p>
                <div className="dir-item-formula">
                  <code>{feat.formula}</code>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
