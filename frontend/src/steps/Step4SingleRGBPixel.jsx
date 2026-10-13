import React, { useState } from 'react';
import StepWrapper from '../components/layout/StepWrapper';
import MathInspectorHUD from '../components/ui/MathInspectorHUD';

export default function Step4SingleRGBPixel({ onSelectStep }) {
  const [r, setR] = useState(128);
  const [g, setG] = useState(0);
  const [b, setB] = useState(128);

  const setPreset = (redVal, greenVal, blueVal) => {
    setR(redVal);
    setG(greenVal);
    setB(blueVal);
  };

  const controls = (
    <div className="control-bar-inner">
      <span className="control-bar-label">Preset RGB Vectors:</span>
      <div className="preset-pills-row">
        <button
          className={`preset-pill-btn ${r === 255 && g === 0 && b === 0 ? 'active' : ''}`}
          onClick={() => setPreset(255, 0, 0)}
          type="button"
        >
          <span className="color-dot bg-red-500" />
          <span>Red [255, 0, 0]</span>
        </button>

        <button
          className={`preset-pill-btn ${r === 0 && g === 255 && b === 0 ? 'active' : ''}`}
          onClick={() => setPreset(0, 255, 0)}
          type="button"
        >
          <span className="color-dot bg-emerald-500" />
          <span>Green [0, 255, 0]</span>
        </button>

        <button
          className={`preset-pill-btn ${r === 0 && g === 0 && b === 255 ? 'active' : ''}`}
          onClick={() => setPreset(0, 0, 255)}
          type="button"
        >
          <span className="color-dot bg-blue-500" />
          <span>Blue [0, 0, 255]</span>
        </button>

        <button
          className={`preset-pill-btn ${r === 128 && g === 0 && b === 128 ? 'active' : ''}`}
          onClick={() => setPreset(128, 0, 128)}
          type="button"
        >
          <span className="color-dot bg-purple-500" />
          <span>Purple [128, 0, 128]</span>
        </button>

        <button
          className={`preset-pill-btn ${r === 255 && g === 255 && b === 0 ? 'active' : ''}`}
          onClick={() => setPreset(255, 255, 0)}
          type="button"
        >
          <span className="color-dot bg-yellow-400" />
          <span>Yellow [255, 255, 0]</span>
        </button>

        <button
          className={`preset-pill-btn ${r === 0 && g === 255 && b === 255 ? 'active' : ''}`}
          onClick={() => setPreset(0, 255, 255)}
          type="button"
        >
          <span className="color-dot bg-cyan-400" />
          <span>Cyan [0, 255, 255]</span>
        </button>
      </div>
    </div>
  );

  return (
    <StepWrapper
      stepNumber={4}
      title="Single RGB Pixel as a 3D Vector"
      subtitle="Represent any color pixel as a 3D column vector [R, G, B]ᵀ in Euclidean color space."
      formula="p⃗ = [R, G, B]ᵀ ∈ ℝ³,  0 ≤ R, G, B ≤ 255"
      basicHint="Red + Blue makes Purple [128, 0, 128]. Red + Green makes Yellow [255, 255, 0]. Additive color mixes into light!"
      advancedFormula="p⃗ = R·êᵣ + G·ê_g + B·ê_b,  p⃗ ∈ [0, 255]³"
      controls={controls}
      onPrev={() => onSelectStep && onSelectStep(3)}
      onNext={() => onSelectStep && onSelectStep(5)}
    >
      <div className="workspace-duo-stage">
        {/* Sliders Card */}
        <div className="rgb-sliders-card glass-level-2">
          <div className="card-header-line">
            <h3 className="card-title-text">Channel Intensity Sliders</h3>
            <span className="text-xs text-muted">3 Orthogonal Axes</span>
          </div>

          <div className="rgb-slider-rows">
            {/* Red */}
            <div className="rgb-channel-row">
              <div className="channel-label-line">
                <span className="text-red-400 font-bold">Red Channel (R)</span>
                <span className="font-mono text-red-400 font-bold">{r}</span>
              </div>
              <input
                type="range"
                className="channel-slider red-track"
                min="0"
                max="255"
                value={r}
                onChange={(e) => setR(parseInt(e.target.value, 10))}
                style={{ '--slider-pct': `${(r / 255) * 100}%` }}
              />
            </div>

            {/* Green */}
            <div className="rgb-channel-row">
              <div className="channel-label-line">
                <span className="text-emerald-400 font-bold">Green Channel (G)</span>
                <span className="font-mono text-emerald-400 font-bold">{g}</span>
              </div>
              <input
                type="range"
                className="channel-slider green-track"
                min="0"
                max="255"
                value={g}
                onChange={(e) => setG(parseInt(e.target.value, 10))}
                style={{ '--slider-pct': `${(g / 255) * 100}%` }}
              />
            </div>

            {/* Blue */}
            <div className="rgb-channel-row">
              <div className="channel-label-line">
                <span className="text-blue-400 font-bold">Blue Channel (B)</span>
                <span className="font-mono text-blue-400 font-bold">{b}</span>
              </div>
              <input
                type="range"
                className="channel-slider blue-track"
                min="0"
                max="255"
                value={b}
                onChange={(e) => setB(parseInt(e.target.value, 10))}
                style={{ '--slider-pct': `${(b / 255) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Swatch & Mathematical Vector Display */}
        <div className="rgb-swatch-card glass-level-2">
          <div className="card-header-line">
            <h3 className="card-title-text">Emitted Color & Vector State</h3>
          </div>

          <div className="swatch-center-stage">
              <div
                className="color-swatch-box"
                style={{
                  backgroundColor: `rgb(${r}, ${g}, ${b})`,
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                }}
              />
          </div>

          {/* Mathematical Column Vector Presentation */}
          <div className="rgb-vector-display">
            <span className="vector-label">Vector p = </span>
            <div className="vector-bracket">[</div>
            <div className="vector-column-entries">
              <span className="text-red-400">{r}</span>
              <span className="text-emerald-400">{g}</span>
              <span className="text-blue-400">{b}</span>
            </div>
            <div className="vector-bracket">]</div>
            <span className="vector-transpose">ᵀ</span>
          </div>
        </div>
      </div>

      <MathInspectorHUD
        title="Additive Color Vector"
        formula={`p = [${r}, ${g}, ${b}]ᵀ`}
        result={`rgb(${r}, ${g}, ${b})`}
        note={`Red weight: ${Math.round((r/255)*100)}% • Green weight: ${Math.round((g/255)*100)}% • Blue weight: ${Math.round((b/255)*100)}%`}
      />
    </StepWrapper>
  );
}
