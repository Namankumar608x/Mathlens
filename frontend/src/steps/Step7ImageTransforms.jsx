import React, { useState } from 'react';
import CoordinateTransformCanvas from '../components/visualizers/CoordinateTransformCanvas';
import StepWrapper from '../components/layout/StepWrapper';
import MathInspectorHUD from '../components/ui/MathInspectorHUD';
import { getRotationMatrix, getScalingMatrix, getShearMatrix } from '../core/transformEngine';

export default function Step7ImageTransforms({ onSelectStep }) {
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

  const det = (matrix2x2.a * matrix2x2.d - matrix2x2.b * matrix2x2.c).toFixed(2);
  const trace = (matrix2x2.a + matrix2x2.d).toFixed(2);

  const controls = (
    <div className="control-bar-inner">
      <span className="control-bar-label">Geometric Presets:</span>
      <div className="preset-pills-row">
        <button className={`preset-pill-btn ${transformType === 'identity' ? 'active' : ''}`} onClick={() => handleSelectPreset('identity')} type="button">
          ↺ Identity (I)
        </button>
        <button className={`preset-pill-btn ${transformType === 'rotate45' ? 'active' : ''}`} onClick={() => handleSelectPreset('rotate45')} type="button">
          🔄 Rotate 45°
        </button>
        <button className={`preset-pill-btn ${transformType === 'rotate90' ? 'active' : ''}`} onClick={() => handleSelectPreset('rotate90')} type="button">
          🔄 Rotate 90°
        </button>
        <button className={`preset-pill-btn ${transformType === 'scaleDouble' ? 'active' : ''}`} onClick={() => handleSelectPreset('scaleDouble')} type="button">
          🔍 Scale 1.5×
        </button>
        <button className={`preset-pill-btn ${transformType === 'shearX' ? 'active' : ''}`} onClick={() => handleSelectPreset('shearX')} type="button">
          📐 Shear along X
        </button>
        <button className={`preset-pill-btn ${transformType === 'reflectX' ? 'active' : ''}`} onClick={() => handleSelectPreset('reflectX')} type="button">
          🪞 Reflect Y-Axis
        </button>
      </div>
    </div>
  );

  const renderCellInput = (key, labelName) => (
    <div className="transform-cell-box">
      <span className="transform-cell-tag">{labelName}</span>
      <div className="transform-cell-input-row">
        <input 
          type="text" 
          inputMode="decimal"
          value={matrixInputs[key]} 
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleInputChange(key, e.target.value)} 
          onBlur={() => handleInputBlur(key)}
          onKeyDown={(e) => handleKeyDown(key, e)}
          className="transform-cell-input"
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

  return (
    <StepWrapper
      stepNumber={7}
      title="2D Coordinate Geometric Transformations"
      subtitle="Transform spatial 2D coordinates of digital vectors and images via matrix-vector multiplication: X' = AX. The columns of matrix A dictate where the standard basis vectors î = [1, 0]ᵀ and ĵ = [0, 1]ᵀ land."
      formula="\begin{bmatrix} x' \\ y' \end{bmatrix} = \begin{bmatrix} a & b \\ c & d \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix} = x \begin{bmatrix} a \\ c \end{bmatrix} + y \begin{bmatrix} b \\ d \end{bmatrix}"
      basicHint="Moving pixel positions according to a matrix formula allows you to rotate, stretch, shear, and reflect entire pictures!"
      advancedFormula="\vec{v}' = A \vec{v}, \quad A = [\vec{T}(\hat{e}_1) \; \vec{T}(\hat{e}_2)], \quad \det(A) = ad - bc"
      controls={controls}
      onPrev={() => onSelectStep && onSelectStep(6)}
      onNext={() => onSelectStep && onSelectStep(8)}
      onReset={() => handleSelectPreset('identity')}
      insightTitle="Basis Vector Mapping"
      insightBody="The first column [a, c]ᵀ is the transformed destination of the X-axis unit vector î = [1, 0]ᵀ. The second column [b, d]ᵀ is the destination of the Y-axis unit vector ĵ = [0, 1]ᵀ. By tracking only these two unit vectors, you know the destination of every point in the 2D plane!"
    >
      <div className="workspace-duo-stage">
        {/* 2x2 Matrix Input Card */}
        <div className="transform-matrix-card glass-level-2">
          <div className="matrix-header">
            <h3 className="matrix-title-text">Transformation Matrix A</h3>
            <span className="matrix-dims-badge text-purple-400">2 × 2</span>
          </div>

          <div className="transform-grid-bracket-wrap">
            <div className="matrix-left-bracket" />
            <div className="transform-2x2-grid">
              {renderCellInput('a', 'a₁₁ (x → x)')}
              {renderCellInput('b', 'a₁₂ (y → x)')}
              {renderCellInput('c', 'a₂₁ (x → y)')}
              {renderCellInput('d', 'a₂₂ (y → y)')}
            </div>
            <div className="matrix-right-bracket" />
          </div>

          <div className="matrix-invariants-banner">
            <div className="invariant-pill">
              <span>Determinant:</span>
              <strong className="text-cyan-400 font-mono font-bold">det(A) = {det}</strong>
            </div>
            <div className="invariant-pill">
              <span>Trace:</span>
              <strong className="text-purple-400 font-mono font-bold">Tr(A) = {trace}</strong>
            </div>
          </div>
        </div>

        {/* 2D Coordinate Transformation Canvas */}
        <div className="transform-canvas-card glass-level-2">
          <CoordinateTransformCanvas matrix2x2={matrix2x2} />
        </div>
      </div>

      <MathInspectorHUD
        title="2D Linear Map"
        formula={`A = [${matrix2x2.a.toFixed(2)}, ${matrix2x2.b.toFixed(2)}; ${matrix2x2.c.toFixed(2)}, ${matrix2x2.d.toFixed(2)}]`}
        result={`det(A) = ${det} (${parseFloat(det) === 0 ? 'Space collapses into 1D line' : parseFloat(det) < 0 ? 'Orientation inverted (reflection)' : 'Preserves orientation'})`}
      />
    </StepWrapper>
  );
}
