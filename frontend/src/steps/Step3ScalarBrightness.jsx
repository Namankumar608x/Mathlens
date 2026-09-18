import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import MatrixGrid from '../components/matrix/MatrixGrid';
import { scaleMatrix } from '../core/mathEngine';

const BASE_MATRIX = [
  [40, 80, 120, 160],
  [80, 120, 160, 200],
  [120, 160, 200, 240],
  [160, 200, 240, 255]
];

export default function Step3ScalarBrightness() {
  const [scalar, setScalar] = useState(1.0);
  const [hoveredCell, setHoveredCell] = useState(null);

  const scaledMatrix = scaleMatrix(BASE_MATRIX, scalar);

  return (
    <motion.div 
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="step-header-box">
        <h2 className="step-heading">Step 3: Scalar Multiplication & Image Brightness</h2>
        <p className="step-description">
          Multiplying a matrix <strong>A</strong> by a scalar multiplier <strong>k</strong> (<code>A' = kA</code>) scales pixel intensity. When <strong>k &gt; 1</strong>, the image brightens (e.g. <code>A' = 1.5A</code>). When <strong>0 &lt; k &lt; 1</strong>, the image darkens (e.g. <code>A' = 0.5A</code>). Values above 255 are clipped.
        </p>
      </div>

      {/* TOP CONTROL CARD DIVIDED INTO TWO PARTS */}
      <div className="top-control-card">
        <div className="two-part-grid">
          {/* Part 1: Slider Input & Math Formula */}
          <div className="slider-group" style={{ marginBottom: 0 }}>
            <div className="slider-label" style={{ marginBottom: '0.35rem' }}>
              <span>Scalar Multiplier (k):</span>
              <span className="font-mono" style={{ color: '#38BDF8', fontSize: '1.25rem', fontWeight: '800' }}>
                {scalar.toFixed(2)}×
              </span>
            </div>
            <input
              type="range"
              className="slider-input"
              min="0.0"
              max="3.0"
              step="0.05"
              value={scalar}
              onChange={(e) => setScalar(parseFloat(e.target.value))}
              onInput={(e) => setScalar(parseFloat(e.target.value))}
            />
            <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Operation: <span style={{ color: '#38BDF8' }}>A' = {scalar.toFixed(2)} × A</span> (max clip at 255)
            </div>
          </div>

          {/* Part 2: Quick Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Preset Multipliers:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', width: '100%' }}>
              <button 
                className={`preset-btn ${Math.abs(scalar - 0.5) < 0.01 ? 'active' : ''}`} 
                onClick={() => setScalar(0.5)}
                style={{ justifyContent: 'center', textAlign: 'center' }}
              >
                k = 0.5 (Dark)
              </button>
              <button 
                className={`preset-btn ${Math.abs(scalar - 1.0) < 0.01 ? 'active' : ''}`} 
                onClick={() => setScalar(1.0)}
                style={{ justifyContent: 'center', textAlign: 'center' }}
              >
                k = 1.0 (Normal)
              </button>
              <button 
                className={`preset-btn ${Math.abs(scalar - 1.5) < 0.01 ? 'active' : ''}`} 
                onClick={() => setScalar(1.5)}
                style={{ justifyContent: 'center', textAlign: 'center' }}
              >
                k = 1.5 (Bright)
              </button>
              <button 
                className={`preset-btn ${Math.abs(scalar - 2.0) < 0.01 ? 'active' : ''}`} 
                onClick={() => setScalar(2.0)}
                style={{ justifyContent: 'center', textAlign: 'center' }}
              >
                k = 2.0 (Clipped)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TWO EQUAL PARTS BELOW FOR IMAGE & MATRIX */}
      <div className="side-by-side-container">
        <PixelCanvas
          matrix={scaledMatrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          highlightColor="#38BDF8"
          title="Resulting Scaled Image (A')"
        />
        <MatrixGrid
          matrix={scaledMatrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          accentColor="#38BDF8"
          title="Resulting Output Matrix A' = kA"
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
            background: 'rgba(6, 10, 20, 0.94)',
            border: '1px solid #38BDF8',
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
          <span>
            {BASE_MATRIX[hoveredCell.row][hoveredCell.col]} × {scalar.toFixed(2)} = <strong style={{ color: '#38BDF8' }}>{scaledMatrix[hoveredCell.row][hoveredCell.col]}</strong>
          </span>
        </div>
      )}
    </motion.div>
  );
}
