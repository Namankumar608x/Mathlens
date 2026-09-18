import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CoordinateTransformCanvas from '../components/visualizers/CoordinateTransformCanvas';
import { getRotationMatrix, getScalingMatrix, getShearMatrix } from '../core/transformEngine';

export default function Step7ImageTransforms() {
  const [matrix2x2, setMatrix2x2] = useState({ a: 1, b: 0, c: 0, d: 1 });
  const [matrixInputs, setMatrixInputs] = useState({ a: "1.00", b: "0.00", c: "0.00", d: "1.00" });
  const [transformType, setTransformType] = useState('identity');

  const handleSelectPreset = (type) => {
    setTransformType(type);
    let m = { a: 1, b: 0, c: 0, d: 1 };
    if (type === 'rotate45') m = getRotationMatrix(45);
    else if (type === 'rotate90') m = getRotationMatrix(90);
    else if (type === 'scaleDouble') m = getScalingMatrix(1.5, 1.5);
    else if (type === 'shearX') m = getShearMatrix(0.5, 0);
    else if (type === 'reflectX') m = { a: -1, b: 0, c: 0, d: 1 };

    setMatrix2x2(m);
    setMatrixInputs({
      a: m.a.toFixed(2),
      b: m.b.toFixed(2),
      c: m.c.toFixed(2),
      d: m.d.toFixed(2)
    });
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
        Entry {labelName}:
      </span>
      <div className="matrix-cell-stepper" style={{ border: '1px solid rgba(59, 130, 246, 0.4)' }}>
        <input 
          type="text" 
          inputMode="decimal"
          value={matrixInputs[key]} 
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleInputChange(key, e.target.value)} 
          onBlur={() => handleInputBlur(key)}
          onKeyDown={(e) => handleKeyDown(key, e)}
          style={{ color: '#3B82F6', fontWeight: 800 }}
        />
        <div className="stepper-arrow-buttons">
          <button 
            className="stepper-arrow-btn" 
            onClick={() => handleStepValue(key, 0.1)}
            title="Increase (+0.1)"
          >
            ▲
          </button>
          <button 
            className="stepper-arrow-btn" 
            onClick={() => handleStepValue(key, -0.1)}
            title="Decrease (-0.1)"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div 
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="step-header-box">
        <h2 className="step-heading">Step 7: 2D Image Transformation Lab</h2>
        <p className="step-description">
          Transform spatial coordinates of pixels directly via matrix-vector multiplication: <code>P' = AP</code> where <strong>A</strong> is a 2×2 transformation matrix. Use the <strong>▲/▼ buttons</strong> or <strong>Arrow keys</strong> to adjust entries.
        </p>
      </div>

      <div className="preset-buttons">
        <button className={`preset-btn ${transformType === 'identity' ? 'active' : ''}`} onClick={() => handleSelectPreset('identity')}>
          Identity (Original)
        </button>
        <button className={`preset-btn ${transformType === 'rotate45' ? 'active' : ''}`} onClick={() => handleSelectPreset('rotate45')}>
          Rotate 45°
        </button>
        <button className={`preset-btn ${transformType === 'rotate90' ? 'active' : ''}`} onClick={() => handleSelectPreset('rotate90')}>
          Rotate 90°
        </button>
        <button className={`preset-btn ${transformType === 'scaleDouble' ? 'active' : ''}`} onClick={() => handleSelectPreset('scaleDouble')}>
          Scale 1.5×
        </button>
        <button className={`preset-btn ${transformType === 'shearX' ? 'active' : ''}`} onClick={() => handleSelectPreset('shearX')}>
          Shear X
        </button>
        <button className={`preset-btn ${transformType === 'reflectX' ? 'active' : ''}`} onClick={() => handleSelectPreset('reflectX')}>
          Reflect Y-Axis
        </button>
      </div>

      <div className="step-7-layout">
        <div className="transform-matrix-input-card">
          <div className="matrix-header">
            <h3 className="card-title">Transformation Matrix A</h3>
            <span className="matrix-dims" style={{ borderColor: 'rgba(59, 130, 246, 0.4)', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.12)' }}>
              2 × 2
            </span>
          </div>

          <div className="matrix-bracket-container" style={{ flex: 1, margin: 'auto 0' }}>
            <span className="bracket" style={{ color: '#3B82F6' }}>[</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '280px' }}>
              {renderCellInput('a', 'a₁₁')}
              {renderCellInput('b', 'a₁₂')}
              {renderCellInput('c', 'a₂₁')}
              {renderCellInput('d', 'a₂₂')}
            </div>
            <span className="bracket" style={{ color: '#3B82F6' }}>]</span>
          </div>
        </div>

        <CoordinateTransformCanvas matrix2x2={matrix2x2} />
      </div>
    </motion.div>
  );
}
