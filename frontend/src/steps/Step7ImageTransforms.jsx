import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CoordinateTransformCanvas from '../components/visualizers/CoordinateTransformCanvas';
import { getRotationMatrix, getScalingMatrix, getShearMatrix } from '../core/transformEngine';

export default function Step7ImageTransforms() {
  const [matrix2x2, setMatrix2x2] = useState({ a: 1, b: 0, c: 0, d: 1 });
  const [matrixInputs, setMatrixInputs] = useState({ a: "1.00", b: "0.00", c: "0.00", d: "1.00" });
  const [transformType, setTransformType] = useState('identity');

  const animateToMatrix = (target) => {
    const start = { ...matrix2x2 };
    const duration = 250;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      const current = {
        a: start.a + (target.a - start.a) * ease,
        b: start.b + (target.b - start.b) * ease,
        c: start.c + (target.c - start.c) * ease,
        d: start.d + (target.d - start.d) * ease
      };

      setMatrix2x2(current);
      setMatrixInputs({
        a: current.a.toFixed(2),
        b: current.b.toFixed(2),
        c: current.c.toFixed(2),
        d: current.d.toFixed(2)
      });

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  const handleSelectPreset = (type) => {
    setTransformType(type);
    let m = { a: 1, b: 0, c: 0, d: 1 };
    if (type === 'rotate45') m = getRotationMatrix(45);
    else if (type === 'rotate90') m = getRotationMatrix(90);
    else if (type === 'scaleDouble') m = getScalingMatrix(1.5, 1.5);
    else if (type === 'shearX') m = getShearMatrix(0.5, 0);
    else if (type === 'reflectX') m = { a: -1, b: 0, c: 0, d: 1 };

    animateToMatrix(m);
  };

  const handleInputChange = (key, rawVal) => {
    setMatrixInputs(prev => ({ ...prev, [key]: rawVal }));
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed)) {
      setMatrix2x2(prev => ({ ...prev, [key]: parsed }));
    }
  };

  const handleInputBlur = (key) => {
    const parsed = parseFloat(matrixInputs[key]);
    const valid = isNaN(parsed) ? 0 : parsed;
    setMatrixInputs(prev => ({ ...prev, [key]: valid.toFixed(2) }));
    setMatrix2x2(prev => ({ ...prev, [key]: valid }));
  };

  const handleStepValue = (key, delta) => {
    const current = parseFloat(matrixInputs[key]);
    const valid = isNaN(current) ? 0 : current;
    const nextVal = (valid + delta).toFixed(2);
    const nextNum = parseFloat(nextVal);
    setMatrixInputs(prev => ({ ...prev, [key]: nextVal }));
    setMatrix2x2(prev => ({ ...prev, [key]: nextNum }));
  };

  const handleKeyDown = (key, e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleStepValue(key, 0.1);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      handleStepValue(key, -0.1);
    }
  };

  const renderCellInput = (key, labelName) => (
    <div className="matrix-cell-card">
      <div className="matrix-cell-header">
        <span className="matrix-cell-tag">{labelName}</span>
      </div>
      <div className="matrix-cell-input-row">
        <input 
          type="text" 
          inputMode="decimal"
          value={matrixInputs[key]} 
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleInputChange(key, e.target.value)} 
          onBlur={() => handleInputBlur(key)}
          onKeyDown={(e) => handleKeyDown(key, e)}
        />
        <div className="stepper-arrow-buttons">
          <button 
            className="stepper-arrow-btn" 
            onClick={() => handleStepValue(key, 0.1)}
            title="Increase (+0.1)"
            type="button"
          >
            ▲
          </button>
          <button 
            className="stepper-arrow-btn" 
            onClick={() => handleStepValue(key, -0.1)}
            title="Decrease (-0.1)"
            type="button"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );

  const det = (matrix2x2.a * matrix2x2.d - matrix2x2.b * matrix2x2.c).toFixed(2);
  const trace = (matrix2x2.a + matrix2x2.d).toFixed(2);

  return (
    <motion.div 
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="step-header-box">
        <h2 className="step-heading">2D Image Transformation Lab</h2>
        <p className="step-description">
          Transform spatial coordinates of pixels directly via matrix-vector multiplication: <code>P' = AP</code> where <strong>A</strong> is a 2×2 transformation matrix. Use the <strong>▲/▼ buttons</strong>, <strong>Arrow keys</strong>, or <strong>Presets</strong> below to explore linear transformations.
        </p>
      </div>

      <div className="preset-buttons">
        <button className={`preset-btn ${transformType === 'identity' ? 'active' : ''}`} onClick={() => handleSelectPreset('identity')}>
          ↺ Identity
        </button>
        <button className={`preset-btn ${transformType === 'rotate45' ? 'active' : ''}`} onClick={() => handleSelectPreset('rotate45')}>
          🔄 Rotate 45°
        </button>
        <button className={`preset-btn ${transformType === 'rotate90' ? 'active' : ''}`} onClick={() => handleSelectPreset('rotate90')}>
          🔄 Rotate 90°
        </button>
        <button className={`preset-btn ${transformType === 'scaleDouble' ? 'active' : ''}`} onClick={() => handleSelectPreset('scaleDouble')}>
          🔍 Scale 1.5×
        </button>
        <button className={`preset-btn ${transformType === 'shearX' ? 'active' : ''}`} onClick={() => handleSelectPreset('shearX')}>
          📐 Shear X
        </button>
        <button className={`preset-btn ${transformType === 'reflectX' ? 'active' : ''}`} onClick={() => handleSelectPreset('reflectX')}>
          🪞 Reflect Y
        </button>
      </div>

      <div className="step-7-layout">
        <div className="transform-matrix-input-card">
          <div className="matrix-header">
            <h3 className="card-title">Transformation Matrix A</h3>
            <span className="matrix-dims" style={{ borderColor: 'var(--border-violet)', color: 'var(--accent-purple)', background: 'rgba(139, 92, 246, 0.14)' }}>
              2 × 2
            </span>
          </div>

          <div className="matrix-input-container">
            {/* Mathematical Bracket Frame */}
            <div className="matrix-bracket-frame">
              <div className="matrix-input-grid">
                {renderCellInput('a', 'a₁₁')}
                {renderCellInput('b', 'a₁₂')}
                {renderCellInput('c', 'a₂₁')}
                {renderCellInput('d', 'a₂₂')}
              </div>
            </div>

            {/* Matrix Properties Banner */}
            <div className="matrix-formula-banner">
              <span>det(A) = <strong style={{ color: 'var(--accent-purple)' }}>{det}</strong></span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span>Tr(A) = <strong style={{ color: 'var(--accent-purple)' }}>{trace}</strong></span>
            </div>
          </div>
        </div>

        <CoordinateTransformCanvas matrix2x2={matrix2x2} />
      </div>
    </motion.div>
  );
}
