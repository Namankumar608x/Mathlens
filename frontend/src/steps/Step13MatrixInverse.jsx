import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  RotateCcw, 
  Activity, 
  Sliders, 
  Compass, 
  CheckCircle2, 
  Undo2, 
  RefreshCw, 
  Upload, 
  AlertTriangle,
  Maximize2,
  FlipHorizontal,
  Grid,
  Sparkles,
  Minus,
  Plus
} from 'lucide-react';
import { 
  computeDeterminant, 
  computeInverseMatrix, 
  multiply2x2, 
  interpolateMatrix 
} from '../core/transformEngine';
import CoordinateTransformCanvas from '../components/visualizers/CoordinateTransformCanvas';
import StepFooter from '../components/layout/StepFooter';
import ModuleDocumentation from '../components/experiment/ModuleDocumentation';

// Curated presets specifically designed for matrix inversion exploration (Zero emojis)
const INVERSE_PRESETS = [
  {
    id: 'user_stretch',
    name: 'Horizontal Stretch',
    badge: 'Scale X',
    matrixA: { a: 2.0, b: 0.0, c: 0.0, d: 1.0 },
    icon: Maximize2,
    desc: 'A=[2 0; 0 1] stretches horizontally. A⁻¹=[0.5 0; 0 1] compresses back to original.'
  },
  {
    id: 'vertical_stretch',
    name: 'Vertical Stretch',
    badge: 'Scale Y',
    matrixA: { a: 1.0, b: 0.0, c: 0.0, d: 1.8 },
    icon: Maximize2,
    desc: 'A=[1 0; 0 1.8] elongates vertically. A⁻¹=[1 0; 0 0.56] restores original height.'
  },
  {
    id: 'rotation_45',
    name: 'Rotation (+45°)',
    badge: 'Orthogonal',
    matrixA: { a: 0.71, b: -0.71, c: 0.71, d: 0.71 },
    icon: Compass,
    desc: 'Rotates by +45°. Inverse rotates by -45° (R⁻¹ = Rᵀ).'
  },
  {
    id: 'shear_x',
    name: 'Horizontal Shear',
    badge: 'Tilt Geometry',
    matrixA: { a: 1.0, b: 1.0, c: 0.0, d: 1.0 },
    icon: Grid,
    desc: 'A=[1 1; 0 1] shears space right. A⁻¹=[1 -1; 0 1] un-skews it back left.'
  },
  {
    id: 'mirror_flip',
    name: 'Horizontal Mirror',
    badge: 'Self-Inverse',
    matrixA: { a: -1.0, b: 0.0, c: 0.0, d: 1.0 },
    icon: FlipHorizontal,
    desc: 'Flips X-axis. Inverting a mirror reflection means mirroring again (A⁻¹ = A).'
  },
  {
    id: 'general_affine',
    name: 'General Matrix',
    badge: 'Scale + Shear',
    matrixA: { a: 1.2, b: 0.4, c: -0.3, d: 1.1 },
    icon: Sparkles,
    desc: 'Combined scaling and shearing. Analytical inverse restores original coordinates.'
  },
  {
    id: 'singular_collapse',
    name: 'Singular Matrix',
    badge: 'Non-Invertible',
    matrixA: { a: 1.0, b: 1.0, c: 1.0, d: 1.0 },
    icon: AlertTriangle,
    desc: 'det(A)=0: Squashes 2D space onto a 1D line. A⁻¹ does not exist (division by zero).'
  }
];

const IDENTITY_MATRIX = { a: 1.0, b: 0.0, c: 0.0, d: 1.0 };

export default function Step13MatrixInverse({ onSelectStep }) {
  // Matrix A definition
  const [matrixA, setMatrixA] = useState({ a: 2.0, b: 0.0, c: 0.0, d: 1.0 });
  const [activePreset, setActivePreset] = useState('user_stretch');

  // Stages: 'original' | 'transformed' | 'inverted'
  const [currentStage, setCurrentStage] = useState('transformed');

  // Animation interpolation state (0 = transformed A, 1 = inverted / restored I)
  const [isAnimating, setIsAnimating] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const animFrameRef = useRef(null);

  // Visualization subject: clean geometry by default (NO rocket, NO emoji face)
  const [subjectType, setSubjectType] = useState('geometry');
  const [customImage, setCustomImage] = useState(null);
  const [customImagePreview, setCustomImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Canvas layer toggles
  const [showParallelogram, setShowParallelogram] = useState(true);
  const [showBasisVectors, setShowBasisVectors] = useState(true);
  const [showGhostOutline, setShowGhostOutline] = useState(true);

  // Determinant and Inverse Calculation
  const detA = computeDeterminant(matrixA);
  const inverseA = useMemo(() => computeInverseMatrix(matrixA), [matrixA]);
  const isSingular = !inverseA;

  // Identity product verification: A^-1 * A
  const identityProduct = useMemo(() => {
    if (!inverseA) return null;
    return multiply2x2(inverseA, matrixA);
  }, [inverseA, matrixA]);

  // Current effective matrix displayed on the canvas
  const effectiveMatrix = useMemo(() => {
    if (isAnimating) {
      return interpolateMatrix(matrixA, IDENTITY_MATRIX, animProgress);
    }
    if (currentStage === 'original' || currentStage === 'inverted') {
      return IDENTITY_MATRIX;
    }
    return matrixA;
  }, [currentStage, matrixA, isAnimating, animProgress]);

  // Sliders handler
  const handleSliderChange = (key, value) => {
    const num = parseFloat(value);
    setMatrixA(prev => ({ ...prev, [key]: num }));
    setActivePreset(null);
    setCurrentStage('transformed');
  };

  const handleStepValue = (key, delta) => {
    setMatrixA(prev => {
      const nextVal = Math.round((prev[key] + delta) * 100) / 100;
      return { ...prev, [key]: nextVal };
    });
    setActivePreset(null);
    setCurrentStage('transformed');
  };

  const handleApplyPreset = (preset) => {
    setMatrixA(preset.matrixA);
    setActivePreset(preset.id);
    setCurrentStage('transformed');
    setAnimProgress(0);
    setIsAnimating(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  const handleResetIdentity = () => {
    setMatrixA({ a: 1.0, b: 0.0, c: 0.0, d: 1.0 });
    setActivePreset(null);
    setCurrentStage('original');
    setIsAnimating(false);
    setAnimProgress(0);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  // Animated "Undo Using Inverse" execution
  const handleUndoUsingInverse = () => {
    if (isSingular) return;

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsAnimating(true);
    setAnimProgress(0);

    const startTime = performance.now();
    const duration = 850;

    const stepAnimation = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      const eased = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      setAnimProgress(eased);

      if (progress < 1.0) {
        animFrameRef.current = requestAnimationFrame(stepAnimation);
      } else {
        setIsAnimating(false);
        setCurrentStage('inverted');
      }
    };

    animFrameRef.current = requestAnimationFrame(stepAnimation);
  };

  // Re-apply forward transformation A
  const handleReapplyTransform = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsAnimating(true);
    setAnimProgress(1);

    const startTime = performance.now();
    const duration = 750;

    const stepAnimation = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const eased = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      setAnimProgress(1 - eased);

      if (progress < 1.0) {
        animFrameRef.current = requestAnimationFrame(stepAnimation);
      } else {
        setIsAnimating(false);
        setCurrentStage('transformed');
      }
    };

    animFrameRef.current = requestAnimationFrame(stepAnimation);
  };

  // Custom photo upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setCustomImage(img);
        setCustomImagePreview(event.target.result);
        setSubjectType('custom');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Standardized Matrix Entry Slider Control matching Step 12
  const renderEntryControl = (key, role) => {
    const val = matrixA[key];
    const min = -2.5;
    const max = 2.5;
    const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
    const subscript = key === 'a' ? '₁₁' : key === 'b' ? '₁₂' : key === 'c' ? '₂₁' : '₂₂';
    const isDiagonal = key === 'a' || key === 'd';

    return (
      <div key={key} className="det-matrix-cell">
        <div className="det-cell-header">
          <div className="det-cell-key-group">
            <span className="det-cell-key">a{subscript}</span>
          </div>
          <span className="det-cell-role">{role}</span>
        </div>

        <div className="det-cell-value-row">
          <input
            type="number"
            step="0.05"
            min="-2.5"
            max="2.5"
            value={val}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              if (!isNaN(parsed)) {
                handleSliderChange(key, Math.min(2.5, Math.max(-2.5, parsed)));
              }
            }}
            className="det-cell-val-input"
            aria-label={`Matrix entry a${subscript}`}
          />
          <div className="det-stepper-group">
            <button
              type="button"
              className="det-stepper-btn"
              onClick={() => handleStepValue(key, -0.1)}
              title={`Decrease a${subscript} by 0.1`}
              aria-label={`Decrease a${subscript}`}
            >
              <Minus size={11} />
            </button>
            <button
              type="button"
              className="det-stepper-btn"
              onClick={() => handleStepValue(key, 0.1)}
              title={`Increase a${subscript} by 0.1`}
              aria-label={`Increase a${subscript}`}
            >
              <Plus size={11} />
            </button>
            <button
              type="button"
              className="det-stepper-btn det-stepper-reset"
              onClick={() => handleSliderChange(key, isDiagonal ? 1.0 : 0.0)}
              title={`Reset to default (${isDiagonal ? '1.0' : '0.0'})`}
              aria-label={`Reset a${subscript}`}
            >
              <RotateCcw size={10} />
            </button>
          </div>
        </div>

        <div className="det-cell-controls">
          <input
            type="range"
            min={min}
            max={max}
            step="0.05"
            value={val}
            onChange={(e) => handleSliderChange(key, e.target.value)}
            className="det-cell-slider"
            style={{
              '--slider-pct': `${pct}%`
            }}
            aria-label={`Slider for a${subscript}`}
          />
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* 1. CLEAN COMPACT HEADER */}
      <div className="step-header-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <h2 className="step-heading" style={{ margin: 0 }}>
            Matrix Inverse
          </h2>
          <span className="badge-tag-mini" style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem' }}>
            Reversible Transformations: x = A⁻¹x′
          </span>
        </div>
        <p className="step-description">
          A linear transformation maps coordinates via <code>x′ = Ax</code>. If <code>det(A) ≠ 0</code>, 
          its inverse matrix <code>A⁻¹</code> exists and satisfies <code>A⁻¹ · A = I</code>. Applying <code>x = A⁻¹x′</code> 
          mathematically reverses the transformation, returning every coordinate point to its original position.
        </p>

        {/* Compact 3-Stage Progress Navigation */}
        <div className="step13-stage-nav">
          <button 
            type="button"
            className={`step13-stage-btn ${currentStage === 'original' ? 'active' : ''}`}
            onClick={() => { setCurrentStage('original'); setIsAnimating(false); }}
          >
            <span>1. Original Geometry (I)</span>
          </button>

          <button 
            type="button"
            className={`step13-stage-btn ${currentStage === 'transformed' ? 'active' : ''}`}
            onClick={() => { setCurrentStage('transformed'); setIsAnimating(false); }}
          >
            <span>2. Forward Matrix A (x′ = Ax)</span>
          </button>

          <button 
            type="button"
            disabled={isSingular}
            className={`step13-stage-btn ${currentStage === 'inverted' ? 'active' : ''}`}
            onClick={() => { if (!isSingular) handleUndoUsingInverse(); }}
            title={isSingular ? "Matrix is singular (det = 0): No inverse exists" : "Restore original shape via A⁻¹"}
          >
            <span>3. Restored via A⁻¹ (x = A⁻¹x′)</span>
          </button>
        </div>
      </div>

      {/* 2. BALANCED TWO-COLUMN LAB WORKBENCH */}
      <div className="step12-desktop-grid" style={{ marginTop: '1.25rem' }}>

        {/* LEFT COLUMN: Matrix Panel, Inverse Display & Undo Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>

          {/* Card 1: Transformation Matrix A Controls */}
          <div className="control-panel-card" style={{ padding: '0.85rem 1rem' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Sliders size={15} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.90rem', fontWeight: 700 }}>
                  Forward Matrix A
                </span>
              </div>
              <button
                type="button"
                className="icon-action-btn"
                onClick={handleResetIdentity}
                title="Reset to Identity Matrix I"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.76rem' }}
              >
                <RotateCcw size={12} />
                <span>Identity I</span>
              </button>
            </div>

            {/* 2x2 Matrix Controls Grid */}
            <div className="det-matrix-2x2-grid">
              {renderEntryControl('a', 'Scale X')}
              {renderEntryControl('b', 'Shear X')}
              {renderEntryControl('c', 'Shear Y')}
              {renderEntryControl('d', 'Scale Y')}
            </div>

            {/* Compact, Clearly Structured Determinant Summary */}
            <div className="det-summary-box" style={{ marginTop: '0.75rem' }}>
              <div className="det-summary-header-row">
                <div className="det-summary-formula">
                  <span>det(A) = ad − bc =</span>
                  <span>({matrixA.a.toFixed(2)})({matrixA.d.toFixed(2)}) − ({matrixA.b.toFixed(2)})({matrixA.c.toFixed(2)}) =</span>
                  <strong style={{ color: isSingular ? '#DC2626' : 'var(--text-primary)' }}>
                    {detA.toFixed(2)}
                  </strong>
                </div>
                <span
                  className="det-summary-badge"
                  style={{
                    color: isSingular ? '#DC2626' : undefined,
                    borderColor: isSingular ? 'rgba(220, 38, 38, 0.4)' : undefined
                  }}
                >
                  {isSingular ? 'Singular (det = 0)' : `1/det = ${(1 / detA).toFixed(2)}`}
                </span>
              </div>

              <div className="det-summary-metrics">
                <div className="det-metric-item">
                  <span className="det-metric-label">Area Scale</span>
                  <span className="det-metric-val">{Math.abs(detA).toFixed(2)}×</span>
                </div>
                <div className="det-metric-item">
                  <span className="det-metric-label">Inverse Det</span>
                  <span className="det-metric-val" style={{ color: isSingular ? '#DC2626' : undefined }}>
                    {isSingular ? 'Undefined' : `${(1 / detA).toFixed(2)}`}
                  </span>
                </div>
                <div className="det-metric-item">
                  <span className="det-metric-label">Trace</span>
                  <span className="det-metric-val">{(matrixA.a + matrixA.d).toFixed(2)}</span>
                </div>
                <div className="det-metric-item">
                  <span className="det-metric-label">Invertibility</span>
                  <span
                    className="det-metric-val"
                    style={{ color: isSingular ? '#DC2626' : 'var(--accent-primary, #697951)' }}
                  >
                    {isSingular ? 'Non-Invertible' : 'Invertible'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Inverse Matrix A^-1 & Verification Strip */}
          <div className="control-panel-card" style={{ padding: '0.85rem 1rem' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Activity size={15} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.90rem', fontWeight: 700 }}>
                  Inverse Matrix A⁻¹ &amp; Verification
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                A⁻¹ · A = I
              </span>
            </div>

            {/* Side-by-side matrices representation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
              {/* Matrix A representation */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.55rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Forward A</div>
                <div style={{ display: 'inline-flex', borderLeft: '2px solid var(--border-color)', borderRight: '2px solid var(--border-color)', borderRadius: '4px', padding: '0.15rem 0.6rem', gap: '0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.90rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span>{matrixA.a.toFixed(2)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{matrixA.c.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{matrixA.b.toFixed(2)}</span>
                    <span>{matrixA.d.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Inverse Matrix A^-1 representation */}
              <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${isSingular ? '#DC2626' : 'var(--border-color)'}`, borderRadius: '8px', padding: '0.55rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: isSingular ? '#DC2626' : 'var(--text-muted)', marginBottom: '0.25rem' }}>Inverse A⁻¹</div>
                {isSingular ? (
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#DC2626', padding: '0.35rem 0' }}>
                    Undefined (det = 0)
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', borderLeft: '2px solid var(--accent-primary, #697951)', borderRight: '2px solid var(--accent-primary, #697951)', borderRadius: '4px', padding: '0.15rem 0.6rem', gap: '0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.90rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary, #697951)' }}>{inverseA.a.toFixed(2)}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{inverseA.c.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{inverseA.b.toFixed(2)}</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary, #697951)' }}>{inverseA.d.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Formula Strip */}
            <div style={{ marginTop: '0.65rem', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>
                <strong>Formula:</strong> A⁻¹ = (1/det(A)) · [ d −b; −c a ]
              </div>
              {identityProduct && (
                <div style={{ color: 'var(--accent-primary, #697951)', fontWeight: 700 }}>
                  Verification: A⁻¹ · A = [ {identityProduct.a.toFixed(2)} {identityProduct.b.toFixed(2)}; {identityProduct.c.toFixed(2)} {identityProduct.d.toFixed(2)} ] = I
                </div>
              )}
            </div>

            {/* Action Button Row */}
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                disabled={isSingular || isAnimating || currentStage === 'inverted'}
                onClick={handleUndoUsingInverse}
                className="action-btn"
                style={{
                  flex: 1,
                  padding: '0.55rem 0.95rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  borderRadius: '8px'
                }}
              >
                {isSingular ? (
                  <>
                    <AlertTriangle size={14} />
                    <span>Cannot Invert (det = 0)</span>
                  </>
                ) : isAnimating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Applying A⁻¹...</span>
                  </>
                ) : currentStage === 'inverted' ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Restored via A⁻¹</span>
                  </>
                ) : (
                  <>
                    <Undo2 size={14} />
                    <span>Undo Using Inverse (A⁻¹)</span>
                  </>
                )}
              </button>

              {currentStage === 'inverted' && (
                <button
                  type="button"
                  onClick={handleReapplyTransform}
                  className="icon-action-btn"
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  title="Re-apply Forward Matrix A"
                >
                  <RefreshCw size={13} />
                  <span>Forward A</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Geometric Properties & Inversion Principles */}
          <div className="control-panel-card" style={{ padding: '0.85rem 1rem' }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
              <Compass size={15} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.90rem', fontWeight: 700 }}>Inversion Properties</span>
            </div>

            <div className="geo-props-list">
              <div className="geo-prop-row">
                <span className="geo-prop-label">Invertibility Status:</span>
                <span className="geo-prop-val" style={{ color: isSingular ? '#DC2626' : undefined }}>
                  {isSingular ? 'Singular (det = 0, No Inverse)' : 'Invertible (Unique Solution)'}
                </span>
              </div>
              <div className="geo-prop-row">
                <span className="geo-prop-label">Subspace Dimension:</span>
                <span className="geo-prop-val" style={{ color: isSingular ? '#DC2626' : undefined }}>
                  {isSingular ? '1D Line Collapse (Rank 1)' : '2D Full Plane (Rank 2)'}
                </span>
              </div>
              <div className="geo-prop-row">
                <span className="geo-prop-label">Transformation Mapping:</span>
                <span className="geo-prop-val" style={{ color: isSingular ? '#DC2626' : undefined }}>
                  {isSingular ? 'Degenerate (Information Lost)' : 'Bijective (One-to-One)'}
                </span>
              </div>
              <div className="geo-prop-row">
                <span className="geo-prop-label">Round-Trip Identity:</span>
                <span className="geo-prop-val geo-prop-val-mono" style={{ color: 'var(--accent-primary, #697951)' }}>
                  A⁻¹(Ax) = (A⁻¹A)x = Ix = x
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Coordinate Canvas + Subject Selection + Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>

          {/* 1. Large Coordinate Transformation Canvas */}
          <CoordinateTransformCanvas
            matrix2x2={effectiveMatrix}
            subjectType={subjectType}
            customImage={customImage}
            showImage={true}
            showParallelogram={showParallelogram}
            showBasisVectors={showBasisVectors}
            showGhostOutline={showGhostOutline}
            showGrid={true}
            showOrientationArc={false}
            title={
              isAnimating 
                ? "Applying Inverse: x = A⁻¹x′ (Animating...)" 
                : currentStage === 'inverted' 
                  ? "Restored Geometry: x = A⁻¹x′ (Identity)" 
                  : "Forward Transformed: x′ = Ax"
            }
            subtitle={
              isSingular 
                ? "Singular Matrix: det(A) = 0 (No Inverse Exists)" 
                : currentStage === 'inverted'
                  ? "Transformation reversed: original coordinates restored"
                  : "Click 'Undo Using Inverse' to reverse this deformation"
            }
          />

          {/* 2. Compact Visualization Layers & Subject Selector Strip */}
          <div className="control-panel-card" style={{ padding: '0.6rem 0.95rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem' }}>
              {/* Layer checkboxes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.80rem', color: 'var(--text-primary)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={showParallelogram}
                    onChange={(e) => setShowParallelogram(e.target.checked)}
                  />
                  <span style={{ fontWeight: 600 }}>Parallelogram</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={showBasisVectors}
                    onChange={(e) => setShowBasisVectors(e.target.checked)}
                  />
                  <span style={{ fontWeight: 600 }}>Basis Vectors</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={showGhostOutline}
                    onChange={(e) => setShowGhostOutline(e.target.checked)}
                  />
                  <span>Ghost Reference</span>
                </label>
              </div>

              {/* Subject selector pills: clean geometry (NO rocket, NO emojis) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  className={`sub-chapter-pill ${subjectType === 'geometry' ? 'active' : ''}`}
                  onClick={() => setSubjectType('geometry')}
                  style={{ fontSize: '0.74rem', padding: '0.2rem 0.55rem' }}
                >
                  <span>Geometric Shape</span>
                </button>
                <button
                  type="button"
                  className={`sub-chapter-pill ${subjectType === 'custom' ? 'active' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: '0.74rem', padding: '0.2rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Upload size={12} />
                  <span>Upload Photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* 3. Inversion Presets Grid (Fills under-graph area) */}
          <div className="control-panel-card" style={{ padding: '0.85rem 1.05rem' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Compass size={15} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.90rem', fontWeight: 700 }}>Inversion Presets</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>1-Click Transforms</span>
            </div>

            <div className="det-preset-grid">
              {INVERSE_PRESETS.map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`det-preset-btn ${isSelected ? 'active' : ''}`}
                    title={preset.desc}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {preset.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-muted)',
                          background: 'var(--bg-primary)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {preset.badge}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-secondary)', lineHeight: 1.25 }}>
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. STANDARDIZED EDUCATIONAL DOCUMENTATION */}
      <div style={{ marginTop: '1.25rem' }}>
        <ModuleDocumentation stepNumber={13} defaultOpen={false} />
      </div>

      <StepFooter stepNumber={13} onSelectStep={onSelectStep} />
    </motion.div>
  );
}
