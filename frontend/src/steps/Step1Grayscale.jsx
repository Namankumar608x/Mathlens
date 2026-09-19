import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import MatrixGrid from '../components/matrix/MatrixGrid';

const PRESETS = {
  black: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  white: [
    [255, 255, 255, 255],
    [255, 255, 255, 255],
    [255, 255, 255, 255],
    [255, 255, 255, 255]
  ],
  checkerboard: [
    [0, 255, 0, 255],
    [255, 0, 255, 0],
    [0, 255, 0, 255],
    [255, 0, 255, 0]
  ],
  gradient: [
    [0, 50, 100, 150],
    [50, 100, 150, 200],
    [100, 150, 200, 230],
    [150, 200, 230, 255]
  ]
};

export default function Step1Grayscale() {
  const [matrix, setMatrix] = useState(PRESETS.black);
  const [activePreset, setActivePreset] = useState('black');
  const [hoveredCell, setHoveredCell] = useState(null);

  const handleSelectPreset = (key) => {
    setActivePreset(key);
    setMatrix(PRESETS[key]);
  };

  return (
    <motion.div 
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="step-header-box">
        <h2 className="step-heading">From Pixels to Matrices</h2>
        <p className="step-description">
          Every digital image is stored as a 2D numerical array (a <strong>matrix</strong>). In an 8-bit grayscale image, each element represents a pixel intensity from <strong>0 (Black)</strong> to <strong>255 (White)</strong>.
        </p>
      </div>

      <div className="top-control-card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Select Matrix Preset:
          </span>
          <div className="preset-buttons" style={{ margin: 0 }}>
            <button 
              className={`preset-btn ${activePreset === 'black' ? 'active' : ''}`} 
              onClick={() => handleSelectPreset('black')}
            >
              ⬛ Black (All 0s)
            </button>
            <button 
              className={`preset-btn ${activePreset === 'white' ? 'active' : ''}`} 
              onClick={() => handleSelectPreset('white')}
            >
              ⬜ White (All 255s)
            </button>
            <button 
              className={`preset-btn ${activePreset === 'checkerboard' ? 'active' : ''}`} 
              onClick={() => handleSelectPreset('checkerboard')}
            >
              🏁 Checkerboard
            </button>
            <button 
              className={`preset-btn ${activePreset === 'gradient' ? 'active' : ''}`} 
              onClick={() => handleSelectPreset('gradient')}
            >
              📈 Gradient
            </button>
          </div>
        </div>
      </div>

      <div className="side-by-side-container">
        <PixelCanvas
          matrix={matrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          title="Digital Image View (4×4 Pixels)"
        />
        <MatrixGrid
          matrix={matrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          title="Corresponding Matrix View A"
        />
      </div>

      {/* FLOATING CURSOR TOOLTIP AT CURSOR POSITION */}
      {hoveredCell && hoveredCell.x !== undefined && (
        <div 
          className="cursor-tooltip"
          style={{
            position: 'fixed',
            left: `${hoveredCell.x + 14}px`,
            top: `${hoveredCell.y + 14}px`,
            pointerEvents: 'none',
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            borderRadius: '20px',
            padding: '0.35rem 0.85rem',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ color: '#94A3B8', fontWeight: 600 }}>({hoveredCell.row + 1}, {hoveredCell.col + 1})</span>
          <span style={{ opacity: 0.3, color: '#94A3B8' }}>|</span>
          <span>Val: <strong style={{ color: '#38BDF8', fontWeight: 700 }}>{matrix[hoveredCell.row][hoveredCell.col]}</strong></span>
        </div>
      )}
    </motion.div>
  );
}
