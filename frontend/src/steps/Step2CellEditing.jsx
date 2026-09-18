import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import MatrixGrid from '../components/matrix/MatrixGrid';
import { createEmptyMatrix } from '../core/mathEngine';

export default function Step2CellEditing() {
  const [matrix, setMatrix] = useState([
    [0, 50, 100, 150],
    [50, 100, 150, 200],
    [100, 150, 200, 220],
    [150, 200, 220, 255]
  ]);
  const [hoveredCell, setHoveredCell] = useState(null);

  const handleCellChange = (r, c, val) => {
    const next = matrix.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrix(next);
  };

  const handleAnimateTransition = () => {
    let currentVal = 0;
    const interval = setInterval(() => {
      currentVal += 50;
      if (currentVal > 255) {
        currentVal = 255;
        clearInterval(interval);
      }
      setMatrix(prev => prev.map(row => row.map(() => currentVal)));
    }, 400);
  };

  return (
    <motion.div 
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="step-header-box">
        <h2 className="step-heading">Step 2: Edit Individual Matrix Elements</h2>
        <p className="step-description">
          Directly edit individual cell values in the matrix below to see the pixel shade update immediately. Watch how values transition visually from <strong>0 (Black)</strong> → <strong>50</strong> → <strong>100</strong> → <strong>150</strong> → <strong>200</strong> → <strong>255 (White)</strong>.
        </p>
      </div>

      <div className="top-control-card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Interactive Actions:
          </span>
          <div className="preset-buttons" style={{ margin: 0 }}>
            <button className="preset-btn active" onClick={handleAnimateTransition}>
              ▶ Play Animation (0 → 255)
            </button>
            <button className="preset-btn" onClick={() => setMatrix(createEmptyMatrix(4, 4, 128))}>
              ↺ Reset to Mid-Gray (128)
            </button>
          </div>
        </div>
      </div>

      <div className="side-by-side-container">
        <PixelCanvas
          matrix={matrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          title="Live Image Pixel Canvas"
        />
        <MatrixGrid
          matrix={matrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          editable={true}
          onChangeCell={handleCellChange}
          title="Editable Matrix Grid A"
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
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-cyan)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            padding: '0.4rem 0.75rem',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>Block: <strong>({hoveredCell.row + 1}, {hoveredCell.col + 1})</strong></span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>Val: <strong style={{ color: 'var(--accent-cyan)' }}>{matrix[hoveredCell.row][hoveredCell.col]}</strong></span>
        </div>
      )}
    </motion.div>
  );
}
