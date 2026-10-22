import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Binary,
  Layers,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Info,
  Lock,
  AlertTriangle,
  Play,
  Sliders,
  Split,
  Workflow
} from 'lucide-react';
import StepFooter from '../components/layout/StepFooter';
import ModuleDocumentation from '../components/experiment/ModuleDocumentation';
import {
  det2x2,
  invert2x2,
  conditionNumber2x2,
  mixImageLayers,
  unmixImageLayers,
  computeFidelity
} from '../core/math/linearSystem';

// Helper to draw circle and triangle images into a 2D numerical array (size x size)
function generatePresetImages(presetId, size = 32) {
  const X1 = Array.from({ length: size }, () => new Float32Array(size));
  const X2 = Array.from({ length: size }, () => new Float32Array(size));

  const cx = size / 2;
  const cy = size / 2;

  if (presetId === 'shapes') {
    // X1: Solid circle
    const rCircle = size * 0.32;
    // X2: Solid equilateral triangle
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Circle
        const dist = Math.hypot(c - cx, r - cy);
        if (dist <= rCircle) {
          X1[r][c] = 230;
        } else {
          X1[r][c] = 20;
        }

        // Triangle: apex at (cx, cy - h*0.6), base at (cy + h*0.4)
        const triTop = size * 0.18;
        const triBottom = size * 0.82;
        const triH = triBottom - triTop;
        if (r >= triTop && r <= triBottom) {
          const frac = (r - triTop) / triH;
          const halfWidth = frac * (size * 0.40);
          if (c >= cx - halfWidth && c <= cx + halfWidth) {
            X2[r][c] = 230;
          } else {
            X2[r][c] = 20;
          }
        } else {
          X2[r][c] = 20;
        }
      }
    }
  } else if (presetId === 'letters') {
    // X1: Letter 'M', X2: Letter 'L'
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        X1[r][c] = 20;
        X2[r][c] = 20;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Draw M
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(size * 0.75)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', cx, cy + 1);
    let idata = ctx.getImageData(0, 0, size, size).data;
    for (let i = 0; i < size * size; i++) {
      X1[Math.floor(i / size)][i % size] = idata[i * 4] > 80 ? 230 : 20;
    }

    // Draw L
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('L', cx, cy + 1);
    idata = ctx.getImageData(0, 0, size, size).data;
    for (let i = 0; i < size * size; i++) {
      X2[Math.floor(i / size)][i % size] = idata[i * 4] > 80 ? 230 : 20;
    }
  } else if (presetId === 'xray') {
    // Medical X-ray: X1 is Bone Structure, X2 is Soft Tissue Organ
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Bone: Vertical femur shaft with rounded joint
        const isShaft = Math.abs(c - cx) < size * 0.12;
        const isJoint = Math.hypot(c - cx, r - size * 0.25) < size * 0.22;
        X1[r][c] = isShaft || isJoint ? 240 : 15;

        // Soft Tissue: Elliptical lung / muscle organ
        const organDist = Math.hypot((c - (cx + size * 0.15)) * 1.2, r - cy);
        X2[r][c] = organDist < size * 0.35 ? 170 : 25;
      }
    }
  }

  return { X1, X2 };
}

export default function Step20LinearSystems({ onSelectStep }) {
  // Navigation Tabs: 'forward-mixing' | 'inverse-recovery' | 'singular-collapse' | 'sandbox' | 'applications'
  const [activeTab, setActiveTab] = useState('forward-mixing');

  // Detect Theme (Light vs Dark)
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'dark' : 'dark'
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  const isLight = theme === 'light';

  // Preset Selection: 'shapes' (Circle & Triangle) | 'letters' (M & L) | 'xray' (Bone & Tissue)
  const [selectedPreset, setSelectedPreset] = useState('shapes');
  const imgResolution = 32;

  // Base Original Images X1 and X2
  const { X1, X2 } = useMemo(() => {
    return generatePresetImages(selectedPreset, imgResolution);
  }, [selectedPreset]);

  // =========================================================================
  // TAB 1 & 2: MIXING MATRIX A & SYSTEM AX = B
  // Default textbook spec: B1 = 0.8*X1 + 0.2*X2, B2 = 0.3*X1 + 0.7*X2
  // =========================================================================
  const [a11, setA11] = useState(0.8);
  const [a12, setA12] = useState(0.2);
  const [a21, setA21] = useState(0.3);
  const [a22, setA22] = useState(0.7);

  const matrixA = useMemo(() => [
    [a11, a12],
    [a21, a22]
  ], [a11, a12, a21, a22]);

  const detA = useMemo(() => det2x2(matrixA), [matrixA]);
  const isSingular = Math.abs(detA) < 1e-4;
  const invA = useMemo(() => invert2x2(matrixA), [matrixA]);
  const condA = useMemo(() => conditionNumber2x2(matrixA), [matrixA]);

  // Generate Mixed Images B1 and B2
  const { B1, B2 } = useMemo(() => {
    return mixImageLayers(X1, X2, matrixA, true);
  }, [X1, X2, matrixA]);

  // =========================================================================
  // TAB 2: UNMIXING & RECOVERY STATE
  // =========================================================================
  const [isSolved, setIsSolved] = useState(false);
  const [isSolvingAnim, setIsSolvingAnim] = useState(false);

  // Recovered Images X1_rec, X2_rec
  const recoveryResult = useMemo(() => {
    return unmixImageLayers(B1, B2, matrixA, true);
  }, [B1, B2, matrixA]);

  const fidelityX1 = useMemo(() => {
    if (!recoveryResult?.X1_rec) return 0;
    return computeFidelity(X1, recoveryResult.X1_rec).fidelity;
  }, [X1, recoveryResult]);

  const fidelityX2 = useMemo(() => {
    if (!recoveryResult?.X2_rec) return 0;
    return computeFidelity(X2, recoveryResult.X2_rec).fidelity;
  }, [X2, recoveryResult]);

  // Trigger animated solve
  const handleTriggerSolve = () => {
    setIsSolvingAnim(true);
    setTimeout(() => {
      setIsSolvingAnim(false);
      setIsSolved(true);
    }, 450);
  };

  // =========================================================================
  // TAB 3: SINGULAR MATRIX COLLAPSE PRESETS
  // =========================================================================
  const handleApplySingularPreset = (presetKey) => {
    if (presetKey === 'identical') {
      // B1 = 0.5X1 + 0.5X2, B2 = 0.5X1 + 0.5X2 (Page 2 of PDF)
      setA11(0.5); setA12(0.5);
      setA21(0.5); setA22(0.5);
    } else if (presetKey === 'proportional') {
      // Row 2 is 2x Row 1: B1 = 0.4X1 + 0.6X2, B2 = 0.8X1 + 1.2X2
      setA11(0.4); setA12(0.6);
      setA21(0.8); setA22(1.2);
    } else if (presetKey === 'near-singular') {
      // Nearly singular: ill-conditioned matrix det = 0.01
      setA11(0.50); setA12(0.50);
      setA21(0.51); setA22(0.49);
    } else if (presetKey === 'textbook') {
      // Invertible textbook spec
      setA11(0.8); setA12(0.2);
      setA21(0.3); setA22(0.7);
    }
    setIsSolved(false);
  };

  // Helper: Draw 2D grayscale numerical matrix onto HTML5 canvas
  const drawMatrixCanvas = (canvas, matrix, size = 32) => {
    if (!canvas || !matrix) return;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = matrix[r][c];
        const idx = (r * size + c) * 4;
        imgData.data[idx] = val;
        imgData.data[idx + 1] = val;
        imgData.data[idx + 2] = val;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  // Canvas Refs
  const canvasX1Ref = useRef(null);
  const canvasX2Ref = useRef(null);
  const canvasB1Ref = useRef(null);
  const canvasB2Ref = useRef(null);
  const canvasRecX1Ref = useRef(null);
  const canvasRecX2Ref = useRef(null);

  // Update canvas renders
  useEffect(() => {
    drawMatrixCanvas(canvasX1Ref.current, X1, imgResolution);
    drawMatrixCanvas(canvasX2Ref.current, X2, imgResolution);
    drawMatrixCanvas(canvasB1Ref.current, B1, imgResolution);
    drawMatrixCanvas(canvasB2Ref.current, B2, imgResolution);
    if (recoveryResult?.X1_rec && isSolved) {
      drawMatrixCanvas(canvasRecX1Ref.current, recoveryResult.X1_rec, imgResolution);
      drawMatrixCanvas(canvasRecX2Ref.current, recoveryResult.X2_rec, imgResolution);
    }
  }, [X1, X2, B1, B2, recoveryResult, isSolved, activeTab]);

  return (
    <div className="math-step-view" style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.25rem 1rem' }}>
      {/* 1. STANDARDIZED HEADER */}
      <div className="step-header-box" style={{ marginBottom: '1rem', padding: '0.95rem 1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <h2 className="step-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Split size={22} style={{ color: 'var(--accent-primary, #C59B67)' }} />
            <span>Systems of Linear Equations — Recovering Hidden Images (AX = B)</span>
          </h2>
          <span className="badge-tag-mini" style={{ fontSize: '0.74rem', padding: '0.18rem 0.55rem' }}>
            Module: Linear Systems
          </span>
        </div>

        <p className="step-description" style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
          <strong>Central Idea:</strong> A digital image can be created by combining multiple image layers.
          If we know the mixing coefficients, can we recover the original hidden images by solving a system of linear equations $AX = B$?
          Connect matrix inversion $X = A^{-1}B$, determinants, and rank collapse to digital photography, color printing, and scientific medical imaging.
        </p>

        {/* 5 SUB-CHAPTER NAVIGATION TABS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('forward-mixing')}
            className={`sub-chapter-pill ${activeTab === 'forward-mixing' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Layers size={14} />
            <span>1. Mixing Layers (AX = B)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inverse-recovery')}
            className={`sub-chapter-pill ${activeTab === 'inverse-recovery' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sparkles size={14} />
            <span>2. Recovering Images (X = A⁻¹B)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('singular-collapse')}
            className={`sub-chapter-pill ${activeTab === 'singular-collapse' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <AlertTriangle size={14} />
            <span>3. Singularity &amp; Rank Collapse (det = 0)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className={`sub-chapter-pill ${activeTab === 'sandbox' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sliders size={14} />
            <span>4. Matrix Sandbox &amp; Presets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`sub-chapter-pill ${activeTab === 'applications' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Workflow size={14} />
            <span>5. Scientific &amp; Medical Imaging</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: MIXING LAYERS (THE FORWARD PROBLEM AX = B) */}
      {/* ========================================================================= */}
      {activeTab === 'forward-mixing' && (
        <div className="step20-workbench">
          {/* Left Column: Mixing Controls & Matrix Formulation */}
          <div className="step20-left-col">
            <div className="step20-card">
              <div className="step20-card-header">
                <h3 className="step20-card-title">
                  <Layers size={16} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>The Forward Problem: Blending Two Image Layers</span>
                </h3>
                <span className="step20-badge">A ∈ ℝ²ˣ²</span>
              </div>

              <p className="step20-desc">
                Suppose we have two base grayscale images: <strong>X₁</strong> (Circle) and <strong>X₂</strong> (Triangle).
                We generate two distinct visual mixtures <strong>B₁</strong> and <strong>B₂</strong> via linear combinations:
              </p>

              {/* Formula Callout */}
              <div style={{ background: 'var(--bg-secondary)', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div>B₁ = <span style={{ color: 'var(--accent-primary, #C59B67)', fontWeight: 700 }}>{a11.toFixed(2)}</span>·X₁ + <span style={{ color: '#3B82F6', fontWeight: 700 }}>{a12.toFixed(2)}</span>·X₂</div>
                <div>B₂ = <span style={{ color: 'var(--accent-primary, #C59B67)', fontWeight: 700 }}>{a21.toFixed(2)}</span>·X₁ + <span style={{ color: '#3B82F6', fontWeight: 700 }}>{a22.toFixed(2)}</span>·X₂</div>
              </div>

              {/* Interactive Sliders for Mixing Matrix A */}
              <div className="step20-params-box">
                <div className="step20-slider-row">
                  <div className="step20-slider-header">
                    <span className="step20-slider-label">Mixture 1: Circle Weight (a₁₁)</span>
                    <span className="step20-slider-val">{(a11 * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={a11}
                    onChange={(e) => setA11(parseFloat(e.target.value))}
                    className="step20-range-input"
                  />
                </div>

                <div className="step20-slider-row">
                  <div className="step20-slider-header">
                    <span className="step20-slider-label">Mixture 1: Triangle Weight (a₁₂)</span>
                    <span className="step20-slider-val">{(a12 * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={a12}
                    onChange={(e) => setA12(parseFloat(e.target.value))}
                    className="step20-range-input"
                  />
                </div>

                <div className="step20-slider-row">
                  <div className="step20-slider-header">
                    <span className="step20-slider-label">Mixture 2: Circle Weight (a₂₁)</span>
                    <span className="step20-slider-val">{(a21 * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={a21}
                    onChange={(e) => setA21(parseFloat(e.target.value))}
                    className="step20-range-input"
                  />
                </div>

                <div className="step20-slider-row">
                  <div className="step20-slider-header">
                    <span className="step20-slider-label">Mixture 2: Triangle Weight (a₂₂)</span>
                    <span className="step20-slider-val">{(a22 * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={a22}
                    onChange={(e) => setA22(parseFloat(e.target.value))}
                    className="step20-range-input"
                  />
                </div>
              </div>

              {/* Reset to textbook values */}
              <button
                type="button"
                onClick={() => {
                  setA11(0.8); setA12(0.2);
                  setA21(0.3); setA22(0.7);
                }}
                className="step20-btn-secondary"
                style={{ alignSelf: 'flex-start', marginTop: '0.1rem' }}
              >
                <RotateCcw size={12} />
                <span>Reset to Textbook Spec (80/20 &amp; 30/70)</span>
              </button>
            </div>

            {/* Matrix Equation Box */}
            <div className="step20-card">
              <div className="step20-card-header">
                <h4 className="step20-card-title">
                  <Binary size={15} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>Compact Matrix Form: AX = B</span>
                </h4>
                <span className={`step20-status-pill ${isSingular ? 'singular' : 'invertible'}`}>
                  {isSingular ? 'Singular Matrix (det = 0)' : `det(A) = ${detA.toFixed(2)}`}
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 0.4rem 0' }}>
                  For every pixel location $(r, c)$, the two pixel values form a vector $X = [x_1, x_2]^T$, which matrix $A$ transforms into mixed intensities $B = [b_1, b_2]^T$:
                </p>

                <div style={{ background: 'var(--bg-secondary)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                  <div style={{ borderLeft: '2px solid var(--text-primary)', borderRight: '2px solid var(--text-primary)', padding: '0.2rem 0.4rem', textAlign: 'center' }}>
                    <div>{a11.toFixed(2)} &nbsp; {a12.toFixed(2)}</div>
                    <div>{a21.toFixed(2)} &nbsp; {a22.toFixed(2)}</div>
                  </div>
                  <div>·</div>
                  <div style={{ borderLeft: '2px solid var(--text-primary)', borderRight: '2px solid var(--text-primary)', padding: '0.2rem 0.4rem', textAlign: 'center' }}>
                    <div>X₁</div>
                    <div>X₂</div>
                  </div>
                  <div>=</div>
                  <div style={{ borderLeft: '2px solid var(--text-primary)', borderRight: '2px solid var(--text-primary)', padding: '0.2rem 0.4rem', textAlign: 'center' }}>
                    <div>B₁</div>
                    <div>B₂</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Render of Original Images and Resulting Mixtures */}
          <div className="step20-right-col">
            <div className="step20-card">
              <div className="step20-card-header">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Original Layer Images &amp; Synthesized Mixtures
                </span>
                <span className="step20-badge">Resolution: 32×32 Pixels</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', margin: '0.4rem 0' }}>
                {/* Image 1: Circle */}
                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Original X₁</span>
                    <span className="step20-mini-tag">Circle</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasX1Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="step20-image-card-footer">
                    <span>Base Layer 1</span>
                  </div>
                </div>

                {/* Image 2: Triangle */}
                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Original X₂</span>
                    <span className="step20-mini-tag">Triangle</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasX2Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="step20-image-card-footer">
                    <span>Base Layer 2</span>
                  </div>
                </div>

                {/* Mixed Image B1 */}
                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Mixture B₁</span>
                    <span className="step20-mini-tag" style={{ background: 'rgba(197, 155, 103, 0.15)', color: 'var(--accent-primary, #C59B67)' }}>
                      {(a11*100).toFixed(0)}/{(a12*100).toFixed(0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasB1Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="step20-image-card-footer">
                    <span>{a11.toFixed(2)}X₁ + {a12.toFixed(2)}X₂</span>
                  </div>
                </div>

                {/* Mixed Image B2 */}
                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Mixture B₂</span>
                    <span className="step20-mini-tag" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
                      {(a21*100).toFixed(0)}/{(a22*100).toFixed(0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasB2Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="step20-image-card-footer">
                    <span>{a21.toFixed(2)}X₁ + {a22.toFixed(2)}X₂</span>
                  </div>
                </div>
              </div>

              {/* Inquiry Prompt */}
              <div className="step20-message-box">
                <Info size={18} style={{ flexShrink: 0, color: 'var(--accent-primary, #C59B67)' }} />
                <div style={{ fontSize: '0.78rem', lineHeight: 1.45 }}>
                  <strong>Question for Learners:</strong> Look at the two mixed images $B_1$ and $B_2$.
                  Both contain overlapping ghosts of the circle and triangle.
                  Can you recover the pure original circle and triangle images by using only $B_1$, $B_2$, and the mixing matrix $A$?
                  <div style={{ marginTop: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('inverse-recovery')}
                      className="step20-btn-primary"
                      style={{ fontSize: '0.74rem', padding: '0.25rem 0.65rem' }}
                    >
                      <span>Proceed to Unmixing &amp; Inversion →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: RECOVERING ORIGINAL IMAGES (X = A⁻¹B) */}
      {/* ========================================================================= */}
      {activeTab === 'inverse-recovery' && (
        <div className="step20-workbench">
          {/* Left Column: Inverse Matrix Mathematical Formulation */}
          <div className="step20-left-col">
            <div className="step20-card">
              <div className="step20-card-header">
                <h3 className="step20-card-title">
                  <Sparkles size={16} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>The Inverse Problem: Solving X = A⁻¹B</span>
                </h3>
                <span className="step20-badge">det(A) = {detA.toFixed(2)}</span>
              </div>

              <p className="step20-desc">
                Since <strong>det(A) ≠ 0</strong>, the mixing matrix is non-singular and its inverse <strong>A⁻¹</strong> exists.
                Multiplying both sides of $AX = B$ by $A^{-1}$ decouples the mixed pixels:
              </p>

              {/* Inverse Derivation Box */}
              <div style={{ background: 'var(--bg-secondary)', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>
                  det(A) = (0.8)(0.7) − (0.2)(0.3) = 0.56 − 0.06 = 0.50
                </div>
                <div>
                  A⁻¹ = 1/det(A) · [[0.7, −0.2], [−0.3, 0.8]]
                </div>
                {invA && (
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    A⁻¹ = [[{invA[0][0].toFixed(1)}, {invA[0][1].toFixed(1)}], [{invA[1][0].toFixed(1)}, {invA[1][1].toFixed(1)}]]
                  </div>
                )}
              </div>

              {/* Exact Unmixing Equations from PDF */}
              <div style={{ marginTop: '0.35rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.65rem 0.85rem', borderRadius: 8 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#10B981', display: 'block', marginBottom: '0.25rem' }}>
                  Decoupling Equations:
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div>X₁ = <span style={{ color: '#10B981', fontWeight: 700 }}>1.4</span>·B₁ − <span style={{ color: '#EF4444', fontWeight: 700 }}>0.4</span>·B₂</div>
                  <div>X₂ = −<span style={{ color: '#EF4444', fontWeight: 700 }}>0.6</span>·B₁ + <span style={{ color: '#10B981', fontWeight: 700 }}>1.6</span>·B₂</div>
                </div>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Notice the negative weights! Subtraction cancels out the unwanted layer ghost from each mixture.
                </p>
              </div>

              {/* Solve Button */}
              <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleTriggerSolve}
                  disabled={isSolvingAnim || isSingular}
                  className="step20-btn-primary"
                  style={{ fontSize: '0.80rem', padding: '0.45rem 0.95rem' }}
                >
                  <Play size={14} />
                  <span>{isSolvingAnim ? 'Unmixing Pixels...' : 'Solve & Recover Original Images'}</span>
                </button>

                {isSolved && (
                  <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={15} />
                    <span>Fidelity: 100%</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Visual Recovery Side-by-Side Comparison */}
          <div className="step20-right-col">
            <div className="step20-card">
              <div className="step20-card-header">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Layer Separation Output (Target vs. Recovered)
                </span>
                <span className="step20-badge">
                  {isSolved ? 'Decoupled Successfully' : 'Waiting for Solution'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', margin: '0.4rem 0' }}>
                {/* Mixed B1 (Input) */}
                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Input Mixture B₁</span>
                    <span className="step20-mini-tag">Ghosted</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasB1Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="step20-image-card-footer">
                    <span>0.8X₁ + 0.2X₂</span>
                  </div>
                </div>

                {/* Mixed B2 (Input) */}
                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Input Mixture B₂</span>
                    <span className="step20-mini-tag">Ghosted</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasB2Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="step20-image-card-footer">
                    <span>0.3X₁ + 0.7X₂</span>
                  </div>
                </div>

                {/* Recovered X1 */}
                <div className="step20-image-card" style={{ border: isSolved ? '2px solid #10B981' : '1px solid var(--border-color)', position: 'relative' }}>
                  <div className="step20-image-card-title">
                    <span>Recovered X̂₁</span>
                    <span className="step20-mini-tag" style={{ background: isSolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)', color: isSolved ? '#10B981' : 'var(--text-muted)' }}>
                      {isSolved ? `${fidelityX1}% Match` : 'Unsolved'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasRecX1Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="step20-image-card-footer">
                    <span>1.4B₁ − 0.4B₂</span>
                  </div>

                  {!isSolved && (
                    <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(6px)', background: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(20, 24, 30, 0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', zIndex: 5 }}>
                      <Lock size={18} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click Solve</span>
                    </div>
                  )}
                </div>

                {/* Recovered X2 */}
                <div className="step20-image-card" style={{ border: isSolved ? '2px solid #10B981' : '1px solid var(--border-color)', position: 'relative' }}>
                  <div className="step20-image-card-title">
                    <span>Recovered X̂₂</span>
                    <span className="step20-mini-tag" style={{ background: isSolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)', color: isSolved ? '#10B981' : 'var(--text-muted)' }}>
                      {isSolved ? `${fidelityX2}% Match` : 'Unsolved'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasRecX2Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="step20-image-card-footer">
                    <span>−0.6B₁ + 1.6B₂</span>
                  </div>

                  {!isSolved && (
                    <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(6px)', background: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(20, 24, 30, 0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', zIndex: 5 }}>
                      <Lock size={18} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click Solve</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Takeaway Box */}
              <div className="step20-message-box">
                <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#10B981' }} />
                <div style={{ fontSize: '0.78rem', lineHeight: 1.45 }}>
                  <strong>How Pixel Cancellation Works:</strong> In $X_1 = 1.4 B_1 - 0.4 B_2$:
                  The triangle component in $1.4 B_1$ equals $1.4 \times (0.2 X_2) = +0.28 X_2$.
                  The triangle component in $-0.4 B_2$ equals $-0.4 \times (0.7 X_2) = -0.28 X_2$.
                  Adding them together yields $+0.28 X_2 - 0.28 X_2 = \mathbf{0}$, completely annihilating the triangle artifact!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: SINGULARITY & RANK COLLAPSE (det = 0) */}
      {/* ========================================================================= */}
      {activeTab === 'singular-collapse' && (
        <div className="step20-workbench">
          {/* Left Column: Singularity Concept & Presets */}
          <div className="step20-left-col">
            <div className="step20-card">
              <div className="step20-card-header">
                <h3 className="step20-card-title">
                  <AlertTriangle size={16} style={{ color: '#EF4444' }} />
                  <span>What Happens If Both Mixed Images Are Identical?</span>
                </h3>
                <span className={`step20-status-pill ${isSingular ? 'singular' : 'invertible'}`}>
                  det(A) = {detA.toFixed(2)} {isSingular ? '→ Singular!' : ''}
                </span>
              </div>

              <p className="step20-desc">
                As stated on Page 2 of the curriculum: suppose <strong>B₁ = 0.5X₁ + 0.5X₂</strong> and <strong>B₂ = 0.5X₁ + 0.5X₂</strong>.
                Here, $\det(A) = (0.5)(0.5) - (0.5)(0.5) = 0$.
                Students <strong>cannot uniquely recover the original images</strong> because the two equations contain the exact same redundant information!
              </p>

              {/* Presets */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleApplySingularPreset('identical')}
                  className={`step20-pill-btn ${a11 === 0.5 && a12 === 0.5 && a21 === 0.5 && a22 === 0.5 ? 'active' : ''}`}
                  style={{ fontSize: '0.72rem' }}
                >
                  1. Identical Blends (det = 0, Rank 1)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySingularPreset('proportional')}
                  className={`step20-pill-btn ${a11 === 0.4 && a12 === 0.6 && a21 === 0.8 && a22 === 1.2 ? 'active' : ''}`}
                  style={{ fontSize: '0.72rem' }}
                >
                  2. Proportional (B₂ = 2B₁, det = 0)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySingularPreset('near-singular')}
                  className={`step20-pill-btn ${a11 === 0.50 && a12 === 0.50 && a21 === 0.51 && a22 === 0.49 ? 'active' : ''}`}
                  style={{ fontSize: '0.72rem' }}
                >
                  3. Ill-Conditioned (det = 0.01)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySingularPreset('textbook')}
                  className={`step20-pill-btn ${a11 === 0.8 && a12 === 0.2 ? 'active' : ''}`}
                  style={{ fontSize: '0.72rem' }}
                >
                  4. Invertible (det = 0.50, Rank 2)
                </button>
              </div>

              {/* Singularity Analysis Callout */}
              <div style={{ marginTop: '0.45rem', padding: '0.7rem 0.85rem', borderRadius: 8, background: isSingular ? 'rgba(239, 68, 68, 0.10)' : 'rgba(16, 185, 129, 0.10)', border: `1px solid ${isSingular ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}` }}>
                <div style={{ fontWeight: 700, color: isSingular ? '#EF4444' : '#10B981', marginBottom: '0.25rem', fontSize: '0.78rem' }}>
                  {isSingular ? '💥 Recovery Fails: Matrix is Singular!' : '✨ Invertible: Unique Recovery Guaranteed'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {isSingular ? (
                    <div>
                      Formula A⁻¹ = [1/det(A)] · adj(A) results in division by zero (1/0).
                      Row 1 and Row 2 are linearly dependent (Rank(A) = 1).
                      Both cameras or sensors captured the exact same linear combination; the system has <strong>infinitely many solutions along the null space</strong>!
                    </div>
                  ) : (
                    <div>
                      Matrix has full rank (Rank = 2). Row 1 and Row 2 point in independent directions in information space, enabling perfect layer unmixing.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual demonstration of singularity */}
          <div className="step20-right-col">
            <div className="step20-card">
              <div className="step20-card-header">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Visual Outcome of Singularity &amp; Redundancy
                </span>
                <span className="step20-badge">
                  {isSingular ? 'Rank Collapse: Rank = 1' : 'Full Rank: Rank = 2'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '0.4rem 0' }}>
                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Mixture B₁</span>
                    <span className="step20-mini-tag">{a11.toFixed(2)}X₁ + {a12.toFixed(2)}X₂</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasB1Ref} style={{ width: '120px', height: '120px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                </div>

                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Mixture B₂</span>
                    <span className="step20-mini-tag">{a21.toFixed(2)}X₁ + {a22.toFixed(2)}X₂</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasB2Ref} style={{ width: '120px', height: '120px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                </div>
              </div>

              {/* Explanatory Banner from PDF Page 3 */}
              <div className="step20-message-box">
                <Info size={18} style={{ flexShrink: 0, color: 'var(--accent-primary, #C59B67)' }} />
                <div style={{ fontSize: '0.78rem', lineHeight: 1.45 }}>
                  <strong>Connecting to Matrix Rank:</strong>
                  When $\det(A) = 0$, both mixed images provide the same physical constraint.
                  You have <strong>1 equation with 2 unknowns</strong> ($X_1, X_2$) at every pixel.
                  To separate $N$ overlapping layers, you strictly require at least $N$ linearly independent mixtures ($\text{rank}(A) = N$)!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: INTERACTIVE MATRIX SANDBOX & CUSTOM PRESETS */}
      {/* ========================================================================= */}
      {activeTab === 'sandbox' && (
        <div className="step20-workbench">
          {/* Left Column: Preset switch & full manual coefficient matrix */}
          <div className="step20-left-col">
            <div className="step20-card">
              <div className="step20-card-header">
                <h3 className="step20-card-title">
                  <Sliders size={16} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>Interactive Mixing &amp; Inversion Sandbox</span>
                </h3>
                <span className="step20-badge">Condition κ = {condA > 1000 ? '∞' : condA.toFixed(1)}</span>
              </div>

              {/* Image Preset Picker */}
              <div style={{ marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Choose Image Layer Subject:
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {[
                    { id: 'shapes', label: '⭕ Circle & ▲ Triangle' },
                    { id: 'letters', label: '🔤 Letter M & Letter L' },
                    { id: 'xray', label: '🦴 Bone & 🫁 Soft Tissue' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPreset(p.id)}
                      className={`step20-pill-btn ${selectedPreset === p.id ? 'active' : ''}`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2x2 Numeric Grid Inputs */}
              <div style={{ marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Mixing Matrix A Coefficients:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.3rem' }}>
                  <div className="step20-input-cell">
                    <span className="step20-input-lbl">a₁₁ (B₁←X₁):</span>
                    <input
                      type="number"
                      step="0.05"
                      value={a11}
                      onChange={(e) => setA11(parseFloat(e.target.value) || 0)}
                      className="step20-num-input"
                    />
                  </div>
                  <div className="step20-input-cell">
                    <span className="step20-input-lbl">a₁₂ (B₁←X₂):</span>
                    <input
                      type="number"
                      step="0.05"
                      value={a12}
                      onChange={(e) => setA12(parseFloat(e.target.value) || 0)}
                      className="step20-num-input"
                    />
                  </div>
                  <div className="step20-input-cell">
                    <span className="step20-input-lbl">a₂₁ (B₂←X₁):</span>
                    <input
                      type="number"
                      step="0.05"
                      value={a21}
                      onChange={(e) => setA21(parseFloat(e.target.value) || 0)}
                      className="step20-num-input"
                    />
                  </div>
                  <div className="step20-input-cell">
                    <span className="step20-input-lbl">a₂₂ (B₂←X₂):</span>
                    <input
                      type="number"
                      step="0.05"
                      value={a22}
                      onChange={(e) => setA22(parseFloat(e.target.value) || 0)}
                      className="step20-num-input"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Matrix Inverse A^-1 */}
              <div style={{ marginTop: '0.4rem', padding: '0.55rem 0.75rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.74rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  Calculated Inverse Matrix A⁻¹:
                </div>
                {invA ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                    <span>[{invA[0][0].toFixed(2)}, {invA[0][1].toFixed(2)}]</span>
                    <span>[{invA[1][0].toFixed(2)}, {invA[1][1].toFixed(2)}]</span>
                  </div>
                ) : (
                  <div style={{ color: '#EF4444', fontWeight: 600 }}>
                    Singular: Inverse does not exist (det = 0)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Sandbox Unmixed Results */}
          <div className="step20-right-col">
            <div className="step20-card">
              <div className="step20-card-header">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Sandbox Real-Time Unmixing
                </span>
                <span className={`step20-status-pill ${invA ? 'invertible' : 'singular'}`}>
                  {invA ? 'Invertible' : 'Singular'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', margin: '0.4rem 0' }}>
                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Mixture B₁</span>
                    <span className="step20-mini-tag">Input</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasB1Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                </div>

                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Mixture B₂</span>
                    <span className="step20-mini-tag">Input</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasB2Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                </div>

                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Recovered X₁</span>
                    <span className="step20-mini-tag" style={{ color: '#10B981' }}>{fidelityX1}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasRecX1Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                </div>

                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Recovered X₂</span>
                    <span className="step20-mini-tag" style={{ color: '#10B981' }}>{fidelityX2}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasRecX2Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: REAL-WORLD APPLICATIONS (SCIENTIFIC & MEDICAL IMAGING) */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <div className="step20-workbench">
          {/* Left Column: Applications List */}
          <div className="step20-left-col">
            <div className="step20-card">
              <div className="step20-card-header">
                <h3 className="step20-card-title">
                  <Workflow size={16} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>Real-World Engineering &amp; Scientific Imaging</span>
                </h3>
                <span className="step20-badge">AX = B in the Real World</span>
              </div>

              <p className="step20-desc">
                The equation <strong>AX = B</strong> is the bedrock of non-invasive scientific sensing.
                Whenever physical instruments capture mixed signals, solving linear systems reconstructs the hidden source properties.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.2rem' }}>
                {/* App 1 */}
                <div style={{ padding: '0.6rem 0.8rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary, #C59B67)' }}>
                    1. Dual-Energy X-Ray Bone &amp; Tissue Separation
                  </span>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Hospitals take two X-ray scans at low (70 kVp) and high (140 kVp) photon energies.
                    Bone and soft tissue attenuate each energy at different rates (μ_bone, μ_tissue).
                    Solving AX = B cleanly separates fractured bone from surrounding organs!
                  </p>
                </div>

                {/* App 2 */}
                <div style={{ padding: '0.6rem 0.8rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3B82F6' }}>
                    2. Spectrophotometry Chemical Dye Unmixing
                  </span>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    According to the Beer-Lambert law, light absorbance of mixed dyes is a linear sum $A_\lambda = \epsilon_1 C_1 + \epsilon_2 C_2$.
                    Measuring absorption at two optical wavelengths forms a $2 \times 2$ linear system that yields individual chemical concentrations.
                  </p>
                </div>

                {/* App 3 */}
                <div style={{ padding: '0.6rem 0.8rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>
                    3. Color Printing &amp; Spectral Demultiplexing
                  </span>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Color scanners decompose reflected RGB spectra into Cyan, Magenta, Yellow ink densities by inverting the spectral colorimetric transformation matrix.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Dual-Energy Demo */}
          <div className="step20-right-col">
            <div className="step20-card">
              <div className="step20-card-header">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Dual-Energy X-Ray Unmixing Simulation
                </span>
                <span className="step20-badge">Medical Physics</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', margin: '0.4rem 0' }}>
                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>Low kVp Scan</span>
                    <span className="step20-mini-tag">70 kVp</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasB1Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="step20-image-card-footer">
                    <span>Bone + Organ Ghost</span>
                  </div>
                </div>

                <div className="step20-image-card">
                  <div className="step20-image-card-title">
                    <span>High kVp Scan</span>
                    <span className="step20-mini-tag">140 kVp</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasB2Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="step20-image-card-footer">
                    <span>Different Attenuation</span>
                  </div>
                </div>

                <div className="step20-image-card" style={{ border: '2px solid #10B981' }}>
                  <div className="step20-image-card-title">
                    <span>Isolated Bone</span>
                    <span className="step20-mini-tag" style={{ color: '#10B981' }}>Pure Layer 1</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasRecX1Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="step20-image-card-footer">
                    <span>Soft Tissue Removed</span>
                  </div>
                </div>

                <div className="step20-image-card" style={{ border: '2px solid #10B981' }}>
                  <div className="step20-image-card-title">
                    <span>Isolated Tissue</span>
                    <span className="step20-mini-tag" style={{ color: '#10B981' }}>Pure Layer 2</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0' }}>
                    <canvas ref={canvasRecX2Ref} style={{ width: '110px', height: '110px', imageRendering: 'pixelated', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="step20-image-card-footer">
                    <span>Bone Shadows Removed</span>
                  </div>
                </div>
              </div>

              <div className="step20-message-box">
                <Sparkles size={18} style={{ flexShrink: 0, color: 'var(--accent-primary, #C59B67)' }} />
                <div style={{ fontSize: '0.78rem', lineHeight: 1.45 }}>
                  By applying matrix equation $X = A^{-1} B$, the medical scanner subtracts the bone shadows from soft tissue and vice versa, giving radiologists clear views of both bone fractures and organ abnormalities from the same examination.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STANDARDIZED EDUCATIONAL DOCUMENTATION */}
      <div style={{ marginTop: '1.25rem' }}>
        <ModuleDocumentation stepNumber={20} defaultOpen={false} />
      </div>

      {/* FOOTER NAVIGATION */}
      <StepFooter stepNumber={20} onSelectStep={onSelectStep} />
    </div>
  );
}
