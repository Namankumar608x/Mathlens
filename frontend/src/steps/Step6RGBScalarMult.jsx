import React, { useState } from 'react';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import StepWrapper from '../components/layout/StepWrapper';
import MathInspectorHUD from '../components/ui/MathInspectorHUD';
import WipeSlider from '../components/ui/WipeSlider';
import { combineRGBChannels, scaleMatrix, splitRGBChannels } from '../core/mathEngine';

const SAMPLE_COLOR_GRID = [
  [{ r: 239, g: 68, b: 68 }, { r: 59, g: 130, b: 246 }, { r: 16, g: 185, b: 129 }, { r: 245, g: 197, b: 66 }],
  [{ r: 168, g: 85, b: 247 }, { r: 236, g: 72, b: 153 }, { r: 14, g: 165, b: 233 }, { r: 249, g: 115, b: 22 }],
  [{ r: 34, g: 197, b: 94 }, { r: 234, g: 179, b: 8 }, { r: 99, g: 102, b: 241 }, { r: 217, g: 70, b: 239 }],
  [{ r: 20, g: 184, b: 166 }, { r: 244, g: 63, b: 94 }, { r: 132, g: 204, b: 22 }, { r: 56, g: 189, b: 248 }]
];

export default function Step6RGBScalarMult({ onSelectStep }) {
  const [scalar, setScalar] = useState(1.0);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [viewMode, setViewMode] = useState('sideBySide');

  const { rMatrix, gMatrix, bMatrix } = splitRGBChannels(SAMPLE_COLOR_GRID);
  const scaledR = scaleMatrix(rMatrix, scalar);
  const scaledG = scaleMatrix(gMatrix, scalar);
  const scaledB = scaleMatrix(bMatrix, scalar);

  const modifiedColorGrid = combineRGBChannels(scaledR, scaledG, scaledB);

  const controls = (
    <div className="control-bar-grid">
      <div className="control-slider-block">
        <div className="control-slider-header">
          <span className="control-slider-label">Brightness Multiplier (k):</span>
          <span className="control-slider-val text-amber-400 font-mono font-bold">
            {scalar.toFixed(2)}×
          </span>
        </div>
        <input 
          type="range" 
          className="glass-slider" 
          min="0.0" 
          max="2.5" 
          step="0.05" 
          value={scalar} 
          onChange={(e) => setScalar(parseFloat(e.target.value))} 
          style={{ '--slider-pct': `${(scalar / 2.5) * 100}%` }}
        />
        <div className="control-slider-meta">
          <span>Vector Operation: <strong className="text-amber-400">p' = {scalar.toFixed(2)} × [R, G, B]</strong> (clamped at 255)</span>
        </div>
      </div>

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
          <button className={`preset-pill-btn ${Math.abs(scalar - 0.5) < 0.01 ? 'active' : ''}`} onClick={() => setScalar(0.5)} type="button">
            0.5× (Dim)
          </button>
          <button className={`preset-pill-btn ${Math.abs(scalar - 1.0) < 0.01 ? 'active' : ''}`} onClick={() => setScalar(1.0)} type="button">
            1.0× (Normal)
          </button>
          <button className={`preset-pill-btn ${Math.abs(scalar - 1.5) < 0.01 ? 'active' : ''}`} onClick={() => setScalar(1.5)} type="button">
            1.5× (Vibrant)
          </button>
          <button className={`preset-pill-btn ${Math.abs(scalar - 2.0) < 0.01 ? 'active' : ''}`} onClick={() => setScalar(2.0)} type="button">
            2.0× (Saturated)
          </button>
        </div>
      </div>
    </div>
  );

  const origPixel = hoveredCell ? SAMPLE_COLOR_GRID[hoveredCell.row]?.[hoveredCell.col] : null;
  const modPixel = hoveredCell ? modifiedColorGrid[hoveredCell.row]?.[hoveredCell.col] : null;

  return (
    <StepWrapper
      stepNumber={6}
      title="Multi-Channel Scalar Operations"
      subtitle="Applying scalar multiplication across all three color channels simultaneously scales brightness while preserving the chromatic hue ratio: R'=kR, G'=kG, B'=kB."
      formula="R' = \min(255, kR), \quad G' = \min(255, kG), \quad B' = \min(255, kB)"
      basicHint="Scaling all 3 channels by the same factor keeps the tint unchanged while brightening or dimming the scene."
      advancedFormula="\vec{p}' = \text{clamp}(k \cdot \vec{p}, 0, 255), \quad \frac{R'}{G'} = \frac{R}{G} \text{ (below clipping threshold)}"
      controls={controls}
      onPrev={() => onSelectStep && onSelectStep(5)}
      onNext={() => onSelectStep && onSelectStep(7)}
      onReset={() => setScalar(1.0)}
      insightTitle="Hue Preservation in Linear Color Scaling"
      insightBody="As long as neither channel clips at 255, multiplying [R, G, B] by a scalar moves along a straight ray in 3D color space starting at the origin (0, 0, 0). The hue and chromaticity coordinates (r = R/(R+G+B)) remain strictly invariant."
    >
      {viewMode === 'wipe' ? (
        <div className="workspace-wipe-wrapper">
          <WipeSlider
            originalContent={
              <PixelCanvas
                colorGrid={SAMPLE_COLOR_GRID}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                title="Original Image (1.0×)"
              />
            }
            modifiedContent={
              <PixelCanvas
                colorGrid={modifiedColorGrid}
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
            colorGrid={SAMPLE_COLOR_GRID} 
            hoveredCell={hoveredCell}
            onHoverCell={setHoveredCell}
            title="Original Colour Image (1.00×)" 
          />
          <PixelCanvas 
            colorGrid={modifiedColorGrid} 
            hoveredCell={hoveredCell}
            onHoverCell={setHoveredCell}
            title={`Resulting Scaled Image (${scalar.toFixed(2)}×)`} 
          />
        </div>
      )}

      {hoveredCell && origPixel && modPixel && (
        <MathInspectorHUD
          cell={hoveredCell}
          formula={`[R', G', B'] = ${scalar.toFixed(2)} × [${origPixel.r}, ${origPixel.g}, ${origPixel.b}]`}
          result={`[${modPixel.r}, ${modPixel.g}, ${modPixel.b}]`}
          note={origPixel.r * scalar > 255 || origPixel.g * scalar > 255 || origPixel.b * scalar > 255 ? "One or more channels clipped at 255 saturation limit!" : undefined}
        />
      )}
    </StepWrapper>
  );
}
