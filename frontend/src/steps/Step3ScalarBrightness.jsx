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
    <div className="control-bar-grid">
      {/* Slider Column */}
      <div className="control-slider-block">
        <div className="control-slider-header">
          <span className="control-slider-label">Scalar Multiplier (k):</span>
          <span className="control-slider-val font-mono font-bold" style={{ color: 'var(--accent-primary)' }}>
            {scalar.toFixed(2)}×
          </span>
        </div>
        <input
          type="range"
          className="glass-slider"
          min="0.0"
          max="3.0"
          step="0.05"
          value={scalar}
          onChange={(e) => setScalar(parseFloat(e.target.value))}
          style={{ '--slider-pct': `${(scalar / 3.0) * 100}%` }}
        />
        <div className="control-slider-meta">
          <span>Operation: <strong style={{ color: 'var(--accent-primary)' }}>A' = {scalar.toFixed(2)} × A</strong> (clipped to [0, 255])</span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="control-presets-block">
        <div className="preset-label-row">
          <span className="control-bar-label">Multiplier Presets:</span>
        </div>

        <div className="preset-pills-row">
          <button
            className={`preset-pill-btn ${Math.abs(scalar - 0.5) < 0.01 ? 'active' : ''}`}
            onClick={() => setScalar(0.5)}
            type="button"
          >
            0.5× (Darken)
          </button>
          <button
            className={`preset-pill-btn ${Math.abs(scalar - 1.0) < 0.01 ? 'active' : ''}`}
            onClick={() => setScalar(1.0)}
            type="button"
          >
            1.0× (Original)
          </button>
          <button
            className={`preset-pill-btn ${Math.abs(scalar - 1.5) < 0.01 ? 'active' : ''}`}
            onClick={() => setScalar(1.5)}
            type="button"
          >
            1.5× (Brighten)
          </button>
          <button
            className={`preset-pill-btn ${Math.abs(scalar - 2.0) < 0.01 ? 'active' : ''}`}
            onClick={() => setScalar(2.0)}
            type="button"
          >
            2.0× (Clipped)
          </button>
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
      basicHint="Multiplying by 1.5 makes the whole picture 50% brighter. Multiplying by 0.5 cuts brightness in half."
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
          title="Resulting Scaled Image A'"
        />
        <MatrixGrid
          matrix={scaledMatrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          title={`Output Matrix A' = ${scalar.toFixed(2)} × A`}
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
