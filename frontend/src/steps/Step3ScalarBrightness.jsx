import React, { useState } from 'react';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import MatrixGrid from '../components/matrix/MatrixGrid';
import StepWrapper from '../components/layout/StepWrapper';
import MathInspectorHUD from '../components/ui/MathInspectorHUD';
import { scaleMatrix } from '../core/mathEngine';

const BASE_MATRIX = [
  [40, 80, 120, 160],
  [80, 120, 160, 200],
  [120, 160, 200, 240],
  [160, 200, 240, 255]
];

export default function Step3ScalarBrightness({ onSelectStep }) {
  const [scalar, setScalar] = useState(1.0);
  const [hoveredCell, setHoveredCell] = useState(null);

  const scaledMatrix = scaleMatrix(BASE_MATRIX, scalar);

  const controls = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem',
        width: '100%',
        padding: '0.35rem 0.65rem',
        borderRadius: '7px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)'
      }}
    >
      {/* Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '220px' }}>
        <span className="control-cluster-label">
          Multiplier (k)
        </span>
        <input
          type="range"
          className="glass-slider"
          min="0.0"
          max="3.0"
          step="0.05"
          value={scalar}
          onChange={(e) => setScalar(parseFloat(e.target.value))}
          style={{ flex: 1, minWidth: '120px', '--slider-pct': `${(scalar / 3.0) * 100}%` }}
          aria-label="Scalar Multiplier"
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-primary)', minWidth: '38px' }}>
          {scalar.toFixed(2)}×
        </span>
      </div>

      {/* Preset Buttons */}
      <div className="control-cluster">
        <span className="control-cluster-label">Presets</span>
        <div className="segmented-control-group">
          {[
            { val: 0.5, label: '0.5×' },
            { val: 1.0, label: '1.0×' },
            { val: 1.5, label: '1.5×' },
            { val: 2.0, label: '2.0×' }
          ].map((pill) => (
            <button
              key={pill.val}
              className={`segmented-control-btn ${Math.abs(scalar - pill.val) < 0.01 ? 'active' : ''}`}
              onClick={() => setScalar(pill.val)}
              type="button"
              title={`Multiplier ${pill.label}`}
            >
              <span>{pill.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const origVal = hoveredCell ? BASE_MATRIX[hoveredCell.row]?.[hoveredCell.col] : null;
  const scaledVal = hoveredCell ? scaledMatrix[hoveredCell.row]?.[hoveredCell.col] : null;

  return (
    <StepWrapper
      stepNumber={3}
      title="Scalar Multiplication & Brightness"
      subtitle="Multiply every matrix element by a single scalar factor to brighten or darken the image."
      formula="A' = clamp(k · A, 0, 255)"
      basicHint="Multiplying by k > 1 brightens the image; k < 1 darkens it."
      advancedFormula="T_k(A) = clamp(k · A, 0, 255),  k ∈ ℝ⁺"
      controls={controls}
      onPrev={() => onSelectStep && onSelectStep(2)}
      onNext={() => onSelectStep && onSelectStep(4)}
    >
      <div className="workspace-duo-stage">
        <PixelCanvas
          matrix={scaledMatrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          pixelSize={70}
          title="Image A'"
        />
        <MatrixGrid
          matrix={scaledMatrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          title={`Matrix A' = ${scalar.toFixed(2)} × A`}
        />
      </div>

      {hoveredCell && (
        <MathInspectorHUD
          cell={hoveredCell}
          formula={`A'[${hoveredCell.row}, ${hoveredCell.col}] = clamp(${scalar.toFixed(2)} × ${origVal})`}
          result={`${scaledVal} / 255`}
          note={origVal * scalar > 255 ? `Raw calculation is ${(origVal * scalar).toFixed(1)} -> Clipped at 255!` : undefined}
        />
      )}
    </StepWrapper>
  );
}
