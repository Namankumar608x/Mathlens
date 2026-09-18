import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import { combineRGBChannels, scaleMatrix, splitRGBChannels } from '../core/mathEngine';

const SAMPLE_COLOR_GRID = [
  [{ r: 239, g: 68, b: 68 }, { r: 59, g: 130, b: 246 }, { r: 16, g: 185, b: 129 }, { r: 245, g: 197, b: 66 }],
  [{ r: 168, g: 85, b: 247 }, { r: 236, g: 72, b: 153 }, { r: 14, g: 165, b: 233 }, { r: 249, g: 115, b: 22 }],
  [{ r: 34, g: 197, b: 94 }, { r: 234, g: 179, b: 8 }, { r: 99, g: 102, b: 241 }, { r: 217, g: 70, b: 239 }],
  [{ r: 20, g: 184, b: 166 }, { r: 244, g: 63, b: 94 }, { r: 132, g: 204, b: 22 }, { r: 56, g: 189, b: 248 }]
];

export default function Step6RGBScalarMult() {
  const [scalar, setScalar] = useState(1.0);
  const [hoveredCell, setHoveredCell] = useState(null);

  const { rMatrix, gMatrix, bMatrix } = splitRGBChannels(SAMPLE_COLOR_GRID);
  const scaledR = scaleMatrix(rMatrix, scalar);
  const scaledG = scaleMatrix(gMatrix, scalar);
  const scaledB = scaleMatrix(bMatrix, scalar);

  const modifiedColorGrid = combineRGBChannels(scaledR, scaledG, scaledB);

  return (
    <motion.div 
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="step-header-box">
        <h2 className="step-heading">Step 6: RGB Scalar Brightness Scaling</h2>
        <p className="step-description">
          Multiplying all three RGB channel matrices by a scalar multiplier <strong>k</strong> scales colour brightness across channels: <code>R' = kR, G' = kG, B' = kB</code>.
        </p>
      </div>

      {/* TOP SLIDER CONTROL DIVIDED INTO TWO PARTS */}
      <div className="top-control-card">
        <div className="two-part-grid">
          {/* Part 1: Slider Input & Real-time Value */}
          <div className="slider-group" style={{ marginBottom: 0 }}>
            <div className="slider-label" style={{ marginBottom: '0.35rem' }}>
              <span>Brightness Multiplier (k):</span>
              <span className="font-mono" style={{ color: 'var(--accent-gold)', fontSize: '1.25rem', fontWeight: '800' }}>
                {scalar.toFixed(2)}×
              </span>
            </div>
            <input 
              type="range" 
              className="slider-input" 
              min="0.0" 
              max="2.5" 
              step="0.05" 
              value={scalar} 
              onChange={(e) => setScalar(parseFloat(e.target.value))} 
              onInput={(e) => setScalar(parseFloat(e.target.value))}
            />
            <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Channel Formula: <span style={{ color: 'var(--accent-gold)' }}>RGB' = {scalar.toFixed(2)} × [R, G, B]</span>
            </div>
          </div>

          {/* Part 2: Quick Preset Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Preset Brightness Levels:
            </span>
            <div className="preset-buttons" style={{ margin: 0 }}>
              <button className={`preset-btn ${Math.abs(scalar - 0.5) < 0.01 ? 'active' : ''}`} onClick={() => setScalar(0.5)}>
                k = 0.5 (Dim)
              </button>
              <button className={`preset-btn ${Math.abs(scalar - 1.0) < 0.01 ? 'active' : ''}`} onClick={() => setScalar(1.0)}>
                k = 1.0 (Normal)
              </button>
              <button className={`preset-btn ${Math.abs(scalar - 1.5) < 0.01 ? 'active' : ''}`} onClick={() => setScalar(1.5)}>
                k = 1.5 (Vibrant)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TWO EQUAL PARTS BELOW FOR IMAGES */}
      <div className="side-by-side-container">
        <PixelCanvas 
          colorGrid={SAMPLE_COLOR_GRID} 
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          pixelSize={65} 
          title="Original Colour Image (k = 1.00×)" 
        />
        <PixelCanvas 
          colorGrid={modifiedColorGrid} 
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          pixelSize={65} 
          title={`Resulting Scaled Image (k = ${scalar.toFixed(2)}×)`} 
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
            background: 'rgba(5, 11, 24, 0.94)',
            border: '1px solid var(--accent-gold)',
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
            RGB: [{modifiedColorGrid[hoveredCell.row][hoveredCell.col].r}, {modifiedColorGrid[hoveredCell.row][hoveredCell.col].g}, {modifiedColorGrid[hoveredCell.row][hoveredCell.col].b}]
          </span>
        </div>
      )}
    </motion.div>
  );
}
