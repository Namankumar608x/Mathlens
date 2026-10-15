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
  ZoomIn, 
  ZoomOut,
  Minus,
  Plus
} from 'lucide-react';
import { 
  multiply2x2, 
  interpolateMatrix 
} from '../core/transformEngine';
import CoordinateTransformCanvas from '../components/visualizers/CoordinateTransformCanvas';
import StepFooter from '../components/layout/StepFooter';
import ModuleDocumentation from '../components/experiment/ModuleDocumentation';

// Curated presets specifically designed for zoom and inverse scaling (Zero emojis)
const ZOOM_PRESETS = [
  {
    id: 'zoom_in_2x',
    name: 'Zoom In 2×',
    badge: 'k = 2.0',
    k: 2.0,
    icon: ZoomIn,
    desc: 'Scales coordinates by 2× (Area 4×). S⁻¹=[0.5 0; 0 0.5] restores 1×.'
  },
  {
    id: 'zoom_out_half',
    name: 'Zoom Out 0.5×',
    badge: 'k = 0.5',
    k: 0.5,
    icon: ZoomOut,
    desc: 'Contracts coordinates by half (Area 0.25×). S⁻¹=[2 0; 0 2] restores 1×.'
  },
  {
    id: 'zoom_in_3x',
    name: 'Zoom In 3×',
    badge: 'k = 3.0',
    k: 3.0,
    icon: ZoomIn,
    desc: 'High magnification: 3× linear scale (Area 9×). S⁻¹=[0.33 0; 0 0.33].'
  },
  {
    id: 'zoom_out_quarter',
    name: 'Zoom Out 0.25×',
    badge: 'k = 0.25',
    k: 0.25,
    icon: ZoomOut,
    desc: 'Wide view: 0.25× linear footprint. S⁻¹=[4 0; 0 4] magnifies it back.'
  },
  {
    id: 'identity_1x',
    name: 'Original 1×',
    badge: 'k = 1.0',
    k: 1.0,
    icon: RotateCcw,
    desc: 'Unaltered standard 1× coordinate scale: S = S⁻¹ = I.'
  }
];

const IDENTITY_MATRIX = { a: 1.0, b: 0.0, c: 0.0, d: 1.0 };

export default function Step14MatrixInverseZoom({ onSelectStep }) {
  // Zoom factor k
  const [zoomFactorK, setZoomFactorK] = useState(2.0);
  const [activePreset, setActivePreset] = useState('zoom_in_2x');

  // Stages: 'original' | 'zoomed' | 'inverted'
  const [currentStage, setCurrentStage] = useState('zoomed');

  // Animation interpolation state
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

  // Scaling matrix S = [k 0; 0 k]
  const matrixS = useMemo(() => ({
    a: zoomFactorK,
    b: 0.0,
    c: 0.0,
    d: zoomFactorK
  }), [zoomFactorK]);

  // Inverse scaling matrix S^-1 = [1/k 0; 0 1/k]
  const inverseS = useMemo(() => {
    if (Math.abs(zoomFactorK) < 1e-4) return null;
    const invK = 1.0 / zoomFactorK;
    return {
      a: invK,
      b: 0.0,
      c: 0.0,
      d: invK,
      kInv: invK
    };
  }, [zoomFactorK]);

  // Identity product verification: S^-1 * S
  const identityProduct = useMemo(() => {
    if (!inverseS) return null;
    return multiply2x2(inverseS, matrixS);
  }, [inverseS, matrixS]);

  // Determinant: det(S) = k^2, det(S^-1) = 1/k^2
  const detS = zoomFactorK * zoomFactorK;

  // Effective matrix applied to the visual canvas
  const effectiveMatrix = useMemo(() => {
    if (isAnimating) {
      return interpolateMatrix(matrixS, IDENTITY_MATRIX, animProgress);
    }
    if (currentStage === 'original' || currentStage === 'inverted') {
      return IDENTITY_MATRIX;
    }
    return matrixS;
  }, [currentStage, matrixS, isAnimating, animProgress]);

  // Zoom slider change handler
  const handleSliderChange = (val) => {
    const num = Math.max(0.2, Math.min(3.5, parseFloat(val)));
    setZoomFactorK(num);
    setActivePreset(null);
    setCurrentStage('zoomed');
  };

  const handleStepValue = (delta) => {
    const nextVal = Math.round((zoomFactorK + delta) * 100) / 100;
    if (nextVal >= 0.2 && nextVal <= 3.5) {
      setZoomFactorK(nextVal);
      setActivePreset(null);
      setCurrentStage('zoomed');
    }
  };

  const handleApplyPreset = (preset) => {
    setZoomFactorK(preset.k);
    setActivePreset(preset.id);
    setCurrentStage('zoomed');
    setAnimProgress(0);
    setIsAnimating(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  const handleResetIdentity = () => {
    setZoomFactorK(1.0);
    setActivePreset('identity_1x');
    setCurrentStage('original');
    setIsAnimating(false);
    setAnimProgress(0);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  // Animated "Apply Inverse S^-1" transition
  const handleApplyInverse = () => {
    if (!inverseS) return;
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

  // Re-apply forward zoom S
  const handleReapplyZoom = () => {
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
        setCurrentStage('zoomed');
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

  const minK = 0.2;
  const maxK = 3.5;
  const sliderPct = Math.max(0, Math.min(100, ((zoomFactorK - minK) / (maxK - minK)) * 100));

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
            Zoom &amp; Matrix Inversion
          </h2>
          <span className="badge-tag-mini" style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem' }}>
            Scaling Inversion: S⁻¹ · S = I
          </span>
        </div>
        <p className="step-description">
          Camera zoom and image scaling represent diagonal linear transformations: <code>x′ = Sx</code> with 
          scaling matrix <code>S = [k 0; 0 k]</code>. For instance, <code>S = [2 0; 0 2]</code> doubles both coordinate axes. 
          Applying the inverse scaling matrix <code>S⁻¹ = [1/k 0; 0 1/k]</code> (e.g. <code>[0.5 0; 0 0.5]</code>) precisely cancels 
          the zoom and restores the exact initial coordinate proportions.
        </p>

        {/* 3-Stage Progress Indicator Bar */}
        <div style={{
          marginTop: '0.85rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: '0.65rem'
        }}>
          <button 
            type="button"
            onClick={() => { setCurrentStage('original'); setIsAnimating(false); }}
            style={{
              padding: '0.65rem 0.85rem',
              background: currentStage === 'original' ? 'var(--bg-card-hover)' : 'var(--bg-secondary)',
              border: currentStage === 'original' ? '1.5px solid var(--accent-primary, #697951)' : '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                1. Original Scale
              </span>
              <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                1.00× (I)
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Standard coordinate scale
            </span>
          </button>

          <button 
            type="button"
            onClick={() => { setCurrentStage('zoomed'); setIsAnimating(false); }}
            style={{
              padding: '0.65rem 0.85rem',
              background: currentStage === 'zoomed' ? 'var(--bg-card-hover)' : 'var(--bg-secondary)',
              border: currentStage === 'zoomed' ? '1.5px solid var(--accent-primary, #697951)' : '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                2. Scaled Zoom S
              </span>
              <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                k = {zoomFactorK.toFixed(2)}×
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Coordinates scaled by S
            </span>
          </button>

          <button 
            type="button"
            onClick={() => handleApplyInverse()}
            style={{
              padding: '0.65rem 0.85rem',
              background: currentStage === 'inverted' ? 'var(--bg-card-hover)' : 'var(--bg-secondary)',
              border: currentStage === 'inverted' ? '1.5px solid var(--accent-primary, #697951)' : '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                3. Restored via S⁻¹
              </span>
              <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                1/k = {inverseS ? inverseS.a.toFixed(2) : '—'}×
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Inverse restores exact 1.00× scale
            </span>
          </button>
        </div>
      </div>

      {/* 2. BALANCED TWO-COLUMN LAB WORKBENCH */}
      <div className="step12-desktop-grid" style={{ marginTop: '1.25rem' }}>

        {/* LEFT COLUMN: Zoom Scaling Slider, Matrices S vs S^-1 & Theory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', width: '100%' }}>

          {/* Card 1: Zoom Factor Controls */}
          <div className="control-panel-card" style={{ padding: '1rem 1.15rem' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.94rem', fontWeight: 700 }}>
                  Zoom Factor k
                </span>
              </div>
              <button
                type="button"
                className="icon-action-btn"
                onClick={handleResetIdentity}
                title="Reset to 1.00× Standard Scale"
                style={{ padding: '0.22rem 0.55rem', fontSize: '0.78rem' }}
              >
                <RotateCcw size={13} />
                <span>1.00× (I)</span>
              </button>
            </div>

            {/* Main Zoom Cell Control */}
            <div className="det-matrix-cell" style={{ padding: '0.85rem 1rem' }}>
              <div className="det-cell-header">
                <div className="det-cell-key-group">
                  <span className="det-cell-key">k</span>
                  <span className="det-cell-subscript">scale</span>
                </div>
                <span className="det-cell-role">Uniform Scale Factor</span>
              </div>

              <div className="det-cell-value-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <input
                    type="number"
                    step="0.05"
                    min={minK}
                    max={maxK}
                    value={zoomFactorK}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value);
                      if (!isNaN(parsed)) {
                        handleSliderChange(Math.min(maxK, Math.max(minK, parsed)));
                      }
                    }}
                    className="det-cell-val-input"
                    aria-label="Scale factor k"
                    title="Click or type to edit scale directly"
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)' }}>×</span>
                </div>
                <div className="det-stepper-group">
                  <button
                    type="button"
                    className="det-stepper-btn"
                    onClick={() => handleStepValue(-0.1)}
                    title="Decrease zoom by 0.1×"
                    aria-label="Decrease zoom"
                  >
                    <Minus size={13} />
                  </button>
                  <button
                    type="button"
                    className="det-stepper-btn"
                    onClick={() => handleStepValue(0.1)}
                    title="Increase zoom by 0.1×"
                    aria-label="Increase zoom"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    type="button"
                    className="det-stepper-btn det-stepper-reset"
                    onClick={() => handleSliderChange(1.0)}
                    title="Reset to 1.00×"
                    aria-label="Reset zoom"
                  >
                    <RotateCcw size={11} />
                  </button>
                </div>
              </div>

              <div className="det-cell-controls">
                <input
                  type="range"
                  min={minK}
                  max={maxK}
                  step="0.05"
                  value={zoomFactorK}
                  onChange={(e) => handleSliderChange(e.target.value)}
                  className="det-cell-slider"
                  style={{
                    '--slider-pct': `${sliderPct}%`
                  }}
                  title={`Zoom Factor k = ${zoomFactorK.toFixed(2)}×`}
                />
              </div>

              {/* Quick Jump Buttons */}
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                {[0.5, 1.0, 1.5, 2.0, 3.0].map((stepVal) => (
                  <button
                    key={stepVal}
                    type="button"
                    className="stepper-mini-btn"
                    onClick={() => handleSliderChange(stepVal)}
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.15rem 0.45rem',
                      background: Math.abs(zoomFactorK - stepVal) < 0.04 ? 'var(--bg-card-hover)' : 'var(--bg-primary)',
                      borderColor: Math.abs(zoomFactorK - stepVal) < 0.04 ? 'var(--accent-primary, #697951)' : 'var(--border-color)'
                    }}
                  >
                    {stepVal.toFixed(1)}×
                  </button>
                ))}
              </div>
            </div>

            {/* Determinant & Area Status Strip */}
            <div className="det-formula-box" style={{ marginTop: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.86rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Linear Scale:</span>
                  <strong style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{zoomFactorK.toFixed(2)}×</strong>
                  <span style={{ color: 'var(--text-muted)', margin: '0 0.25rem' }}>•</span>
                  <span style={{ color: 'var(--text-muted)' }}>Area Scale (k²):</span>
                  <strong style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{detS.toFixed(2)}×</strong>
                </div>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '5px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Inverse: 1/k = {inverseS ? inverseS.a.toFixed(2) : '—'}×
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Scaling Matrix S vs S^-1 & Inverse Action */}
          <div className="control-panel-card" style={{ padding: '0.95rem 1.15rem' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                  Scaling Matrix S &amp; Inverse S⁻¹
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                S⁻¹ · S = I
              </span>
            </div>

            {/* Side-by-side matrices representation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.35rem' }}>
              {/* Scaling Matrix S */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Forward Zoom S</div>
                <div style={{ display: 'inline-flex', borderLeft: '2px solid var(--border-color)', borderRight: '2px solid var(--border-color)', borderRadius: '4px', padding: '0.2rem 0.65rem', gap: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.92rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span>{matrixS.a.toFixed(2)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>0.00</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>0.00</span>
                    <span>{matrixS.d.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Inverse Matrix S^-1 */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Inverse Zoom S⁻¹</div>
                {inverseS && (
                  <div style={{ display: 'inline-flex', borderLeft: '2px solid var(--accent-primary, #697951)', borderRight: '2px solid var(--accent-primary, #697951)', borderRadius: '4px', padding: '0.2rem 0.65rem', gap: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.92rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontWeight: 700 }}>{inverseS.a.toFixed(2)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>0.00</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>0.00</span>
                      <span style={{ fontWeight: 700 }}>{inverseS.d.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Formula Strip */}
            <div style={{ marginTop: '0.75rem', padding: '0.55rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div>
                <strong>Diagonal Inverse:</strong> S⁻¹ = [ (1/k)  0; 0  (1/k) ]
              </div>
              {identityProduct && (
                <div style={{ color: 'var(--accent-primary, #697951)', fontWeight: 700 }}>
                  Verification: S⁻¹ · S = [ {identityProduct.a.toFixed(2)}  {identityProduct.b.toFixed(2)}; {identityProduct.c.toFixed(2)}  {identityProduct.d.toFixed(2)} ] = I
                </div>
              )}
            </div>

            {/* Inverse Action Button */}
            <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
              <button
                type="button"
                disabled={isAnimating || currentStage === 'inverted'}
                onClick={handleApplyInverse}
                className="action-btn"
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  borderRadius: '8px'
                }}
              >
                {isAnimating ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Applying S⁻¹...</span>
                  </>
                ) : currentStage === 'inverted' ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Restored 1.00× via S⁻¹</span>
                  </>
                ) : (
                  <>
                    <Undo2 size={15} />
                    <span>Apply Inverse Zoom (S⁻¹)</span>
                  </>
                )}
              </button>

              {currentStage === 'inverted' && (
                <button
                  type="button"
                  onClick={handleReapplyZoom}
                  className="icon-action-btn"
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                  title="Re-apply Zoom S"
                >
                  <RefreshCw size={14} />
                  <span>Zoom S</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Geometric Properties Strip */}
          <div className="control-panel-card" style={{ padding: '0.85rem 1rem' }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
              <Compass size={15} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.90rem', fontWeight: 700 }}>Scaling Properties</span>
            </div>

            <div className="geo-props-list">
              <div className="geo-prop-row">
                <span className="geo-prop-label">Aspect Ratio:</span>
                <span className="geo-prop-val">Preserved (Uniform k)</span>
              </div>
              <div className="geo-prop-row">
                <span className="geo-prop-label">Area Determinant:</span>
                <span className="geo-prop-val font-mono">det(S) = k² = {detS.toFixed(2)}</span>
              </div>
              <div className="geo-prop-row">
                <span className="geo-prop-label">Inverse Determinant:</span>
                <span className="geo-prop-val font-mono">det(S⁻¹) = 1/k² = {(1 / detS).toFixed(2)}</span>
              </div>
              <div className="geo-prop-row">
                <span className="geo-prop-label">Round-Trip Product:</span>
                <span className="geo-prop-val geo-prop-val-mono" style={{ color: 'var(--accent-primary, #697951)' }}>
                  S⁻¹ · S = I
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
                ? "Applying Inverse Zoom: x = S⁻¹x′ (Animating...)" 
                : currentStage === 'inverted' 
                  ? "Original 1.00× Scale Restored via S⁻¹" 
                  : `Zoomed Image: x′ = Sx (${zoomFactorK.toFixed(2)}× Scale)`
            }
            subtitle={
              currentStage === 'inverted'
                ? "Scale restored! S⁻¹ · S = I (Identity Matrix)"
                : `Coordinates scaled by ${zoomFactorK.toFixed(2)}× (Area scaled by ${detS.toFixed(2)}×)`
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
                  <span style={{ fontWeight: 600 }}>Parallelogram Area</span>
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

          {/* 3. Zoom Presets Grid (Fills under-graph area) */}
          <div className="control-panel-card" style={{ padding: '0.85rem 1.05rem' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Compass size={15} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.90rem', fontWeight: 700 }}>Zoom Factor Presets</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>1-Click Scale</span>
            </div>

            <div className="det-preset-grid">
              {ZOOM_PRESETS.map((preset) => {
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
        <ModuleDocumentation stepNumber={14} defaultOpen={false} />
      </div>

      <StepFooter stepNumber={14} onSelectStep={onSelectStep} />
    </motion.div>
  );
}
