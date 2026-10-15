import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sliders, RotateCcw, Compass, Activity, Minus, Plus } from 'lucide-react';
import { computeDeterminant, getDeterminantAnalysis } from '../core/transformEngine';
import CoordinateTransformCanvas from '../components/visualizers/CoordinateTransformCanvas';
import StepFooter from '../components/layout/StepFooter';
import ModuleDocumentation from '../components/experiment/ModuleDocumentation';

const DETERMINANT_PRESETS = [
  {
    id: 'identity',
    name: 'Identity Matrix',
    badge: 'det = 1.00',
    matrix: { a: 1.0, b: 0.0, c: 0.0, d: 1.0 },
    desc: 'Standard orthogonal basis'
  },
  {
    id: 'stretch',
    name: 'Uniform Stretch',
    badge: 'det = 2.25',
    matrix: { a: 1.5, b: 0.0, c: 0.0, d: 1.5 },
    desc: 'Uniform 1.5× area expansion'
  },
  {
    id: 'shrink',
    name: 'Uniform Shrink',
    badge: 'det = 0.36',
    matrix: { a: 0.6, b: 0.0, c: 0.0, d: 0.6 },
    desc: 'Uniform 0.6× area compression'
  },
  {
    id: 'shear_preserve',
    name: 'Pure Shear',
    badge: 'det = 1.00',
    matrix: { a: 1.0, b: 0.8, c: 0.0, d: 1.0 },
    desc: 'Horizontal shear, area preserved'
  },
  {
    id: 'rotation_45',
    name: 'Rotation 45°',
    badge: 'det = 1.00',
    matrix: { a: 0.71, b: -0.71, c: 0.71, d: 0.71 },
    desc: 'Rigid spin, area & orientation preserved'
  },
  {
    id: 'flip_mirror',
    name: 'Orientation Flip',
    badge: 'det = -1.00',
    matrix: { a: -1.0, b: 0.0, c: 0.0, d: 1.0 },
    desc: 'Y-axis mirror reflection'
  },
  {
    id: 'collapse_line',
    name: 'Line Collapse',
    badge: 'det = 0.00',
    matrix: { a: 1.0, b: 1.0, c: 1.0, d: 1.0 },
    desc: 'Squashed onto 1D line y = x'
  },
  {
    id: 'collapse_axis',
    name: 'Axis Collapse',
    badge: 'det = 0.00',
    matrix: { a: 1.2, b: 0.0, c: 0.0, d: 0.0 },
    desc: 'Flattened completely onto X-axis'
  }
];

export default function Step12DeterminantVisualizer({ onSelectStep }) {
  const [matrix, setMatrix] = useState({ a: 1.0, b: 0.0, c: 0.0, d: 1.0 });
  const [activePreset, setActivePreset] = useState('identity');

  // Layer toggles for coordinate canvas
  const [showParallelogram, setShowParallelogram] = useState(true);
  const [showBasisVectors, setShowBasisVectors] = useState(true);
  const [showGhostOutline, setShowGhostOutline] = useState(true);

  // Real-time determinant calculations
  const rawDet = computeDeterminant(matrix);
  const detAnalysis = getDeterminantAnalysis(rawDet);
  const trace = matrix.a + matrix.d;

  const handleSliderChange = (key, value) => {
    const num = parseFloat(value);
    setMatrix(prev => ({ ...prev, [key]: num }));
    setActivePreset(null);
  };

  const handleStepValue = (key, delta) => {
    setMatrix(prev => {
      const nextVal = Math.round((prev[key] + delta) * 100) / 100;
      return { ...prev, [key]: nextVal };
    });
    setActivePreset(null);
  };

  const handleApplyPreset = (preset) => {
    setMatrix(preset.matrix);
    setActivePreset(preset.id);
  };

  const handleResetIdentity = () => {
    setMatrix({ a: 1.0, b: 0.0, c: 0.0, d: 1.0 });
    setActivePreset('identity');
  };

  const renderEntryControl = (key, role) => {
    const val = matrix[key];
    const isDiagonal = key === 'a' || key === 'd';
    const minVal = -2.5;
    const maxVal = 2.5;
    const pct = Math.max(0, Math.min(100, ((val - minVal) / (maxVal - minVal)) * 100));
    const subscript = key === 'a' ? '₁₁' : key === 'b' ? '₁₂' : key === 'c' ? '₂₁' : '₂₂';

    return (
      <div className="det-matrix-cell" key={key}>
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
            min="-2.5"
            max="2.5"
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
            Determinant Lab
          </h2>
          <span className="badge-tag-mini" style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem' }}>
            2D Linear Transformations
          </span>
        </div>
        <p className="step-description">
          The determinant of a 2×2 matrix <code>A = [a b; c d]</code> is <code>det(A) = ad − bc</code>.
          Geometrically, it measures the signed area scaling factor of the transformation:
          values greater than 1 stretch area, values between 0 and 1 shrink area, 
          <code>det(A) = 0</code> collapses space into a 1D line, and negative values flip orientation.
        </p>
      </div>

      {/* 2. BALANCED TWO-COLUMN LAB WORKBENCH */}
      <div className="step12-desktop-grid" style={{ marginTop: '1.25rem' }}>

        {/* LEFT COLUMN: Matrix Panel & Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>

          {/* Card 1: Transformation Matrix & Live Determinant Summary */}
          <div className="control-panel-card" style={{ padding: '0.85rem 1rem' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Sliders size={15} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.90rem', fontWeight: 700 }}>
                  Transformation Matrix A
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

            {/* Clean 2x2 Matrix Controls Grid */}
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
                  <span>({matrix.a.toFixed(2)})({matrix.d.toFixed(2)}) − ({matrix.b.toFixed(2)})({matrix.c.toFixed(2)}) =</span>
                  <strong style={{ color: detAnalysis.type === 'collapse' ? '#DC2626' : 'var(--text-primary)' }}>
                    {rawDet.toFixed(2)}
                  </strong>
                </div>
                <span
                  className="det-summary-badge"
                  style={{
                    color: detAnalysis.type === 'collapse' ? '#DC2626' : undefined,
                    borderColor: detAnalysis.type === 'collapse' ? 'rgba(220, 38, 38, 0.4)' : undefined
                  }}
                >
                  {detAnalysis.shortBadge}
                </span>
              </div>

              <div className="det-summary-metrics">
                <div className="det-metric-item">
                  <span className="det-metric-label">Area Scale</span>
                  <span className="det-metric-val">{Math.abs(rawDet).toFixed(2)}×</span>
                </div>
                <div className="det-metric-item">
                  <span className="det-metric-label">Trace</span>
                  <span className="det-metric-val">{trace.toFixed(2)}</span>
                </div>
                <div className="det-metric-item">
                  <span className="det-metric-label">Orientation</span>
                  <span
                    className="det-metric-val"
                    style={{
                      color: detAnalysis.type === 'collapse'
                        ? '#DC2626'
                        : detAnalysis.orientationFlipped
                          ? '#B45309'
                          : 'var(--accent-primary, #697951)'
                    }}
                  >
                    {detAnalysis.type === 'collapse' ? 'Collapsed (0)' : detAnalysis.orientationFlipped ? 'Reversed (−)' : 'Preserved (+)'}
                  </span>
                </div>
                <div className="det-metric-item">
                  <span className="det-metric-label">Invertibility</span>
                  <span
                    className="det-metric-val"
                    style={{ color: detAnalysis.type === 'collapse' ? '#DC2626' : 'var(--accent-primary, #697951)' }}
                  >
                    {detAnalysis.type === 'collapse' ? 'Singular' : 'Invertible'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Geometric Properties (Non-redundant, Aligned Key-Value List) */}
          <div className="control-panel-card" style={{ padding: '0.85rem 1rem' }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
              <Activity size={15} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.90rem', fontWeight: 700 }}>Geometric Properties</span>
            </div>
            
            <div className="geo-props-list">
              <div className="geo-prop-row">
                <span className="geo-prop-label">Subspace Dimension:</span>
                <span className="geo-prop-val" style={{ color: detAnalysis.type === 'collapse' ? '#DC2626' : undefined }}>
                  {detAnalysis.type === 'collapse' ? '1D Line Subspace (Rank 1)' : '2D Full Plane (Rank 2)'}
                </span>
              </div>
              <div className="geo-prop-row">
                <span className="geo-prop-label">Matrix Invertibility:</span>
                <span className="geo-prop-val" style={{ color: detAnalysis.type === 'collapse' ? '#DC2626' : undefined }}>
                  {detAnalysis.type === 'collapse' ? 'Singular (No Inverse)' : 'Invertible (A⁻¹ Exists)'}
                </span>
              </div>
              <div className="geo-prop-row">
                <span className="geo-prop-label">Orientation Handedness:</span>
                <span className="geo-prop-val" style={{ color: detAnalysis.orientationFlipped ? '#B45309' : undefined }}>
                  {detAnalysis.orientationFlipped ? 'Left-Handed (Reflected)' : 'Right-Handed (Preserved)'}
                </span>
              </div>
              <div className="geo-prop-row">
                <span className="geo-prop-label">Geometric Action:</span>
                <span className="geo-prop-val" style={{ color: 'var(--text-secondary)', fontWeight: 500, maxWidth: '62%' }}>
                  {detAnalysis.description}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Large Coordinate Graph + Presets (Balanced Layout) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>

          {/* 1. Large Prominent Coordinate Graph */}
          <CoordinateTransformCanvas
            matrix2x2={matrix}
            title="2D Transformation Plane"
            showParallelogram={showParallelogram}
            showBasisVectors={showBasisVectors}
            showGhostOutline={showGhostOutline}
          />

          {/* 2. Compact Visualization Layers Strip */}
          <div className="control-panel-card" style={{ padding: '0.55rem 0.95rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '0.80rem',
                color: 'var(--text-primary)'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={showParallelogram}
                  onChange={(e) => setShowParallelogram(e.target.checked)}
                />
                <span style={{ fontWeight: 600 }}>Parallelogram Area</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={showBasisVectors}
                  onChange={(e) => setShowBasisVectors(e.target.checked)}
                />
                <span style={{ fontWeight: 600 }}>Basis Vectors (î′, ĵ′)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={showGhostOutline}
                  onChange={(e) => setShowGhostOutline(e.target.checked)}
                />
                <span>Reference Ghost [0, 1]²</span>
              </label>
            </div>
          </div>

          {/* 3. Transformation Presets Grid - Fills under-graph space evenly */}
          <div className="control-panel-card" style={{ padding: '0.85rem 1.05rem' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Compass size={15} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.90rem', fontWeight: 700 }}>Transformation Presets</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>1-Click Transforms</span>
            </div>

            <div className="det-preset-grid">
              {DETERMINANT_PRESETS.map((preset) => {
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

      {/* 3. STANDARDIZED EDUCATIONAL DOCUMENTATION (Collapsed by Default for Vertical Compactness) */}
      <div style={{ marginTop: '1.25rem' }}>
        <ModuleDocumentation stepNumber={12} defaultOpen={false} />
      </div>

      {/* 4. FOOTER NAVIGATION */}
      <StepFooter stepNumber={12} onSelectStep={onSelectStep} />
    </motion.div>
  );
}
