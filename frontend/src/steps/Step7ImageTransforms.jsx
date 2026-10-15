import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { RotateCcw, Minus, Plus } from 'lucide-react';
import CoordinateTransformCanvas from '../components/visualizers/CoordinateTransformCanvas';
import StepWrapper from '../components/layout/StepWrapper';
import MathInspectorHUD from '../components/ui/MathInspectorHUD';
import { getRotationMatrix, getScalingMatrix, getShearMatrix } from '../core/transformEngine';

export default function Step7ImageTransforms({ onSelectStep }) {
  const [matrix2x2, setMatrix2x2] = useState({ a: 1, b: 0, c: 0, d: 1 });
  const [matrixInputs, setMatrixInputs] = useState({ a: "1.00", b: "0.00", c: "0.00", d: "1.00" });
  const [transformType, setTransformType] = useState('identity');
  const animRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const animateToMatrix = useCallback((target) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const start = { ...matrix2x2 };
    const duration = 240;
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
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null;
      }
    };
    animRef.current = requestAnimationFrame(step);
  }, [matrix2x2]);

  const handleSelectPreset = (type) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setTransformType(type);
    let m = { a: 1, b: 0, c: 0, d: 1 };
    if (type === 'rotate45') m = getRotationMatrix(45);
    else if (type === 'rotate90') m = getRotationMatrix(90);
    else if (type === 'scaleDouble') m = getScalingMatrix(1.5, 1.5);
    else if (type === 'shearX') m = getShearMatrix(0.5, 0);
    else if (type === 'reflectY') m = { a: -1, b: 0, c: 0, d: 1 };

    animateToMatrix(m);
  };

  const handleInputChange = (key, rawVal) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setTransformType('custom');
    setMatrixInputs(prev => ({ ...prev, [key]: rawVal }));
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed)) {
      setMatrix2x2(prev => ({ ...prev, [key]: parsed }));
    }
  };

  const handleInputBlur = (key) => {
    const parsed = parseFloat(matrixInputs[key]);
    const valid = isNaN(parsed) ? (key === 'a' || key === 'd' ? 1 : 0) : parsed;
    setMatrixInputs(prev => ({ ...prev, [key]: valid.toFixed(2) }));
    setMatrix2x2(prev => ({ ...prev, [key]: valid }));
  };

  const handleStepValue = (key, delta) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setTransformType('custom');
    const current = parseFloat(matrixInputs[key]);
    const valid = isNaN(current) ? 0 : current;
    const nextNum = Math.round((valid + delta) * 100) / 100;
    const nextVal = nextNum.toFixed(2);
    setMatrixInputs(prev => ({ ...prev, [key]: nextVal }));
    setMatrix2x2(prev => ({ ...prev, [key]: nextNum }));
  };

  const handleKeyDown = (key, e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleStepValue(key, e.shiftKey ? 0.5 : 0.1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleStepValue(key, e.shiftKey ? -0.5 : -0.1);
    } else if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const rawDet = matrix2x2.a * matrix2x2.d - matrix2x2.b * matrix2x2.c;
  const cleanDet = Math.abs(rawDet) < 1e-10 ? 0 : rawDet;
  const detStr = cleanDet.toFixed(2);

  const rawTrace = matrix2x2.a + matrix2x2.d;
  const cleanTrace = Math.abs(rawTrace) < 1e-10 ? 0 : rawTrace;
  const traceStr = cleanTrace.toFixed(2);

  const controls = (
    <div className="control-bar-inner">
      <span className="control-bar-label">
        Transformation:
      </span>
      <div className="preset-pills-row">
        <button
          className={`preset-pill-btn ${transformType === 'identity' ? 'active' : ''}`}
          onClick={() => handleSelectPreset('identity')}
          type="button"
        >
          Identity (I)
        </button>
        <button
          className={`preset-pill-btn ${transformType === 'rotate45' ? 'active' : ''}`}
          onClick={() => handleSelectPreset('rotate45')}
          type="button"
        >
          Rotate 45°
        </button>
        <button
          className={`preset-pill-btn ${transformType === 'rotate90' ? 'active' : ''}`}
          onClick={() => handleSelectPreset('rotate90')}
          type="button"
        >
          Rotate 90°
        </button>
        <button
          className={`preset-pill-btn ${transformType === 'scaleDouble' ? 'active' : ''}`}
          onClick={() => handleSelectPreset('scaleDouble')}
          type="button"
        >
          Scale 1.5×
        </button>
        <button
          className={`preset-pill-btn ${transformType === 'shearX' ? 'active' : ''}`}
          onClick={() => handleSelectPreset('shearX')}
          type="button"
        >
          Shear X
        </button>
        <button
          className={`preset-pill-btn ${transformType === 'reflectY' ? 'active' : ''}`}
          onClick={() => handleSelectPreset('reflectY')}
          type="button"
        >
          Reflect Y
        </button>
      </div>

      <button
        className="preset-pill-btn"
        onClick={() => handleSelectPreset('identity')}
        type="button"
        title="Reset matrix to Identity"
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}
      >
        <RotateCcw size={13} />
        <span>Reset</span>
      </button>
    </div>
  );

  const isLight = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') === 'light' : true;
  const col1Color = isLight ? '#DC2626' : '#F87171';
  const col2Color = isLight ? '#4D5D3B' : '#A3B882';

  const renderCellInput = (key, subscript, colColor) => (
    <div 
      className="step7-cell" 
      key={key}
      onWheel={(e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        handleStepValue(key, delta);
      }}
    >
      <span className="step7-cell-sub" style={{ color: colColor }}>
        a{subscript}
      </span>

      <input
        type="text"
        inputMode="decimal"
        value={matrixInputs[key]}
        onFocus={(e) => e.target.select()}
        onChange={(e) => handleInputChange(key, e.target.value)}
        onBlur={() => handleInputBlur(key)}
        onKeyDown={(e) => handleKeyDown(key, e)}
        className="step7-cell-input"
        aria-label={`Matrix entry a${subscript}`}
        title="Direct click or type to edit value, scroll or use arrow keys"
      />

      <div className="step7-cell-steppers">
        <button
          className="step7-stepper-btn"
          onClick={(e) => { e.stopPropagation(); handleStepValue(key, 0.1); }}
          title="Increase (+0.1)"
          type="button"
          aria-label={`Increase a${subscript}`}
        >
          <Plus size={10} />
        </button>
        <button
          className="step7-stepper-btn"
          onClick={(e) => { e.stopPropagation(); handleStepValue(key, -0.1); }}
          title="Decrease (-0.1)"
          type="button"
          aria-label={`Decrease a${subscript}`}
        >
          <Minus size={10} />
        </button>
      </div>
    </div>
  );

  return (
    <StepWrapper
      stepNumber={7}
      title="2D Geometric Transformations"
      subtitle="Transform spatial coordinates using matrix-vector multiplication: x' = A · x."
      formula="[x', y']ᵀ = [a  b; c  d] · [x, y]ᵀ"
      basicHint="A 2D matrix transforms every vector in space. The columns of matrix A represent the transformed destinations of basis vectors î and ĵ."
      advancedFormula="x⃗' = A·x⃗,  where col₁(A) = T(î) = [a, c]ᵀ  and  col₂(A) = T(ĵ) = [b, d]ᵀ"
      controls={controls}
      onPrev={() => onSelectStep && onSelectStep(6)}
      onNext={() => onSelectStep && onSelectStep(8)}
    >
      <div className="transform-stage">
        {/* 2x2 Matrix Input Card */}
        <div className="step7-matrix-card glass-level-2">
          <div>
            <div className="matrix-header">
              <div className="matrix-header-title-row">
                <span className="matrix-bracket-symbol">[</span>
                <h3 className="matrix-title-text">Transformation Matrix A</h3>
                <span className="matrix-bracket-symbol">]</span>
              </div>
              <div className="matrix-header-badge-wrap">
                <span className="matrix-dims-badge">
                  2 × 2 • ℝ² → ℝ²
                </span>
              </div>
            </div>

            {/* Column Headers above matrix */}
            <div className="step7-col-headers">
              <span className="step7-col-header-item" style={{ color: col1Color }}>
                col₁ (î')
              </span>
              <span className="step7-col-header-item" style={{ color: col2Color }}>
                col₂ (ĵ')
              </span>
            </div>

            {/* Matrix Bracket Container */}
            <div className="step7-bracket-container">
              <div className="step7-bracket-left" />
              <div className="step7-2x2-grid">
                {renderCellInput('a', '₁₁', col1Color)}
                {renderCellInput('b', '₁₂', col2Color)}
                {renderCellInput('c', '₂₁', col1Color)}
                {renderCellInput('d', '₂₂', col2Color)}
              </div>
              <div className="step7-bracket-right" />
            </div>

            {/* Column Mapping Vectors */}
            <div className="step7-vector-pills">
              <div className="step7-vector-pill">
                <span style={{ color: col1Color, fontWeight: 700 }}>col₁ (î')</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  [{matrix2x2.a.toFixed(2)}, {matrix2x2.c.toFixed(2)}]ᵀ
                </span>
              </div>
              <div className="step7-vector-pill">
                <span style={{ color: col2Color, fontWeight: 700 }}>col₂ (ĵ')</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  [{matrix2x2.b.toFixed(2)}, {matrix2x2.d.toFixed(2)}]ᵀ
                </span>
              </div>
            </div>
          </div>

          {/* Matrix Invariants Strip */}
          <div className="step7-invariants-strip">
            <div>
              <span>det(A): </span>
              <strong style={{ color: cleanDet === 0 ? '#DC2626' : undefined }}>{detStr}</strong>
            </div>
            <div>
              <span>Tr(A): </span>
              <strong>{traceStr}</strong>
            </div>
            <div>
              <span>Area: </span>
              <strong>{Math.abs(cleanDet).toFixed(2)}×</strong>
            </div>
          </div>
        </div>

        {/* 2D Coordinate Transformation Canvas */}
        <CoordinateTransformCanvas matrix2x2={matrix2x2} showImage={false} />
      </div>

      <MathInspectorHUD
        title="2D Matrix-Vector Mapping"
        formula={`A = [${matrix2x2.a.toFixed(2)}, ${matrix2x2.b.toFixed(2)}; ${matrix2x2.c.toFixed(2)}, ${matrix2x2.d.toFixed(2)}]`}
        result={`det(A) = ${detStr} (${
          cleanDet === 0
            ? 'Singular matrix: 2D area collapses into 0D/1D subspace'
            : cleanDet < 0
            ? 'Negative determinant: orientation reversed (mirror reflection)'
            : Math.abs(cleanDet - 1.0) < 0.01
            ? 'Equi-areal: exact 1.00× area preservation'
            : cleanDet > 1.0
            ? `Area expanded by ${(cleanDet * 100).toFixed(0)}%`
            : `Area compressed to ${(cleanDet * 100).toFixed(0)}%`
        })`}
        note="Edit matrix entries or use preset transformations to observe basis vector mapping and area scaling."
      />
    </StepWrapper>
  );
}
