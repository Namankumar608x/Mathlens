import React, { useState } from 'react';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import MatrixGrid from '../components/matrix/MatrixGrid';
import StepWrapper from '../components/layout/StepWrapper';
import MathInspectorHUD from '../components/ui/MathInspectorHUD';
import WipeSlider from '../components/ui/WipeSlider';
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
  const [viewMode, setViewMode] = useState('sideBySide'); // 'sideBySide' | 'wipe'

  const scaledMatrix = scaleMatrix(BASE_MATRIX, scalar);

  const controls = (
    <div className="control-bar-grid">
      {/* Slider Column */}
      <div className="control-slider-block">
        <div className="control-slider-header">
          <span className="control-slider-label">Scalar Multiplier (k):</span>
          <span className="control-slider-val text-amber-400 font-mono font-bold">
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
          <span>Operation: <strong className="text-amber-400">A' = {scalar.toFixed(2)} × A</strong> (clipped to [0, 255])</span>
        </div>
      </div>

      {/* Preset Buttons & Mode Switcher */}
      <div className="control-presets-block">
        <div className="preset-label-row">
          <span className="control-bar-label">Multiplier Presets:</span>
          <div className="view-mode-tabs">
            <button
              className={`view-mode-tab ${viewMode === 'sideBySide' ? 'active' : ''}`}
              onClick={() => setViewMode('sideBySide')}
              type="button"
            >
              Side-by-Side
            </button>
            <button
              className={`view-mode-tab ${viewMode === 'wipe' ? 'active' : ''}`}
              onClick={() => setViewMode('wipe')}
              type="button"
            >
              Wipe Comparison
            </button>
          </div>
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
      title="Scalar Multiplication & Image Brightness"
      subtitle="Multiplying an image matrix A by a scalar multiplier k (A' = kA) scales pixel intensity. When k > 1, the image brightens; when 0 < k < 1, the image darkens. Values exceeding 255 are clamped."
      formula="A' = \min(255, \max(0, k \cdot A))"
      basicHint="Multiplying by 1.5 makes the whole picture 50% brighter. Multiplying by 0.5 cuts brightness in half."
      advancedFormula="T_k(A) = \text{clamp}(k \cdot A, 0, 255), \quad k \in \mathbb{R}^+"
      controls={controls}
      onPrev={() => onSelectStep && onSelectStep(2)}
      onNext={() => onSelectStep && onSelectStep(4)}
      onReset={() => setScalar(1.0)}
      insightTitle="Linear Scaling vs Saturation Clamping"
      insightBody="In pure linear algebra, scalar multiplication is unbounded: (kA)ᵢⱼ = k · Aᵢⱼ. In digital image processing, however, pixel depth is constrained to an 8-bit unsigned integer range [0, 255]. Any product above 255 saturates into pure white, causing highlight clipping (loss of high-dynamic-range detail)."
    >
      {viewMode === 'wipe' ? (
        <div className="workspace-wipe-wrapper">
          <WipeSlider
            originalContent={
              <PixelCanvas
                matrix={BASE_MATRIX}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                title="Original Baseline Image (1.0×)"
              />
            }
            modifiedContent={
              <PixelCanvas
                matrix={scaledMatrix}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                title={`Scaled Image (${scalar.toFixed(2)}×)`}
              />
            }
            originalLabel="Original (1.0×)"
            modifiedLabel={`Scaled (${scalar.toFixed(2)}×)`}
          />
        </div>
      ) : (
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
      )}

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
