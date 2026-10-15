import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Scissors, 
  Minus, 
  Equal, 
  Filter, 
  Sparkles, 
  RotateCcw, 
  Shuffle, 
  Volume2, 
  AlertCircle
} from 'lucide-react';
import { clampPixel, createEmptyMatrix, subtractMatrices, thresholdMatrix } from '../core/mathEngine';
import StepFooter from '../components/layout/StepFooter';
import ModuleDocumentation from '../components/experiment/ModuleDocumentation';

// Presets representing Scene with Object (I) and Empty Background (B)
const SUBTRACTION_PRESETS = {
  movingBox: {
    name: 'Moving Box',
    desc: 'Bright physical box placed onto a textured floor background',
    bg: [
      [65, 72, 68, 75],
      [70, 64, 78, 66],
      [68, 76, 65, 72],
      [74, 69, 73, 67]
    ],
    scene: [
      [65, 72,  68,  75],
      [70, 230, 230, 66],
      [68, 230, 230, 72],
      [74, 69,  73,  67]
    ],
    defaultT: 25
  },
  securityHallway: {
    name: 'Hallway Person',
    desc: 'Surveillance scene of a person walking into a hallway',
    bg: [
      [30, 50, 70, 90],
      [30, 50, 70, 90],
      [30, 50, 70, 90],
      [30, 50, 70, 90]
    ],
    scene: [
      [30, 240, 240, 90],
      [30, 240, 240, 90],
      [30, 240, 240, 90],
      [30, 50,  70,  90]
    ],
    defaultT: 30
  },
  centerGem: {
    name: 'Tabletop Gem',
    desc: 'High-contrast glowing diamond placed on a dark tabletop',
    bg: [
      [35, 40, 42, 38],
      [38, 36, 40, 42],
      [42, 40, 38, 36],
      [36, 42, 35, 40]
    ],
    scene: [
      [35,  245, 245, 38],
      [245, 255, 255, 245],
      [245, 255, 255, 245],
      [36,  245, 245, 40]
    ],
    defaultT: 20
  },
  shadowChallenge: {
    name: 'Object & Shadow',
    desc: 'Dark object with faint shadow demonstrating threshold separation',
    bg: [
      [180, 180, 180, 180],
      [180, 180, 180, 180],
      [180, 180, 180, 180],
      [180, 180, 180, 180]
    ],
    scene: [
      [180, 180, 180, 180],
      [180, 40,  40,  180],
      [180, 40,  40,  165],
      [180, 180, 165, 165]
    ],
    defaultT: 30
  }
};

const THRESHOLD_PRESETS = [
  { val: 0, label: 'T = 0 (Raw)' },
  { val: 12, label: 'T = 12 (Low)' },
  { val: 25, label: 'T = 25 (Optimal)' },
  { val: 50, label: 'T = 50 (High)' },
  { val: 100, label: 'T = 100 (Strict)' }
];

/**
 * Compact Canvas Component for the 4-column horizontal pipeline
 */
function PipelineCanvas({
  matrix,
  isMask = false,
  extractedImage = null,
  hoveredCell,
  onHoverCell,
  pixelSize = 22,
  title
}) {
  const canvasRef = React.useRef(null);
  const rows = matrix.length;
  const cols = matrix[0].length;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rows || !cols) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = cols * pixelSize;
    const height = rows * pixelSize;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let fillStyle = '#000000';

        if (extractedImage) {
          const val = extractedImage[r][c];
          fillStyle = `rgb(${val}, ${val}, ${val})`;
        } else if (isMask) {
          // Binary mask: 1 = pure white (255), 0 = black / dark surface
          const isFg = matrix[r][c] === 1 || matrix[r][c] === 255;
          fillStyle = isFg ? '#FFFFFF' : (isLight ? '#E8EDDF' : '#130F0D');
        } else {
          // Grayscale / difference intensity
          const v = matrix[r][c];
          fillStyle = `rgb(${v}, ${v}, ${v})`;
        }

        ctx.fillStyle = fillStyle;
        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);

        // Adaptive grid borders
        let brightness = matrix[r][c];
        if (extractedImage) brightness = extractedImage[r][c];
        if (isMask) brightness = matrix[r][c] ? 255 : 0;

        if (brightness < 60) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        } else if (brightness > 190) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        } else {
          ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
        }

        ctx.lineWidth = 1;
        ctx.strokeRect(c * pixelSize + 0.5, r * pixelSize + 0.5, pixelSize - 1, pixelSize - 1);

        // Synchronized hover outline (Theme consistent)
        if (hoveredCell && hoveredCell.row === r && hoveredCell.col === c) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = isLight ? '#424F34' : '#FFFFFF';
          ctx.strokeRect(c * pixelSize + 1, r * pixelSize + 1, pixelSize - 2, pixelSize - 2);
          ctx.fillStyle = isLight ? 'rgba(105, 121, 81, 0.2)' : 'rgba(255, 255, 255, 0.15)';
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    ctx.restore();
  }, [matrix, isMask, extractedImage, hoveredCell, rows, cols, pixelSize]);

  const handleMouseMove = (e) => {
    if (!onHoverCell || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / pixelSize);
    const row = Math.floor(y / pixelSize);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      onHoverCell({ row, col, x: e.clientX, y: e.clientY });
    }
  };

  return (
    <div className="compact-canvas-wrapper" onMouseLeave={() => onHoverCell && onHoverCell(null)}>
      <canvas
        ref={canvasRef}
        className="compact-pixel-canvas"
        onMouseMove={handleMouseMove}
        onClick={handleMouseMove}
        title={title}
      />
    </div>
  );
}

/**
 * Matrix Bracket Wrapper - Clean brackets matching Matrix 8
 */
function MatrixBracketWrapper({ children, onMouseLeave }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'fit-content',
        margin: '0.65rem auto 0.25rem'
      }}
      onMouseLeave={onMouseLeave}
    >
      <div
        style={{
          width: '7px',
          alignSelf: 'stretch',
          border: '2.5px solid var(--border-color)',
          borderRight: 'none',
          borderRadius: '7px 0 0 7px',
          marginRight: '5px'
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 40px)',
          gap: '5px',
          width: 'fit-content'
        }}
      >
        {children}
      </div>
      <div
        style={{
          width: '7px',
          alignSelf: 'stretch',
          border: '2.5px solid var(--border-color)',
          borderLeft: 'none',
          borderRadius: '0 7px 7px 0',
          marginLeft: '5px'
        }}
      />
    </div>
  );
}

/**
 * Clean, modern editable matrix cell matching Step 8's EditableCell
 */
const SubtractionEditableCell = React.memo(function SubtractionEditableCell({
  value,
  row,
  col,
  isHovered,
  onChange,
  onHover
}) {
  const [text, setText] = useState(String(value));
  const isFocusedRef = React.useRef(false);

  React.useEffect(() => {
    if (!isFocusedRef.current) {
      setText(String(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setText(raw);
    if (raw !== '') {
      const num = Math.min(255, Math.max(0, parseInt(raw, 10)));
      onChange && onChange(row, col, num);
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    let finalVal = 0;
    if (text !== '') {
      const parsed = parseInt(text, 10);
      if (!isNaN(parsed)) {
        finalVal = Math.min(255, Math.max(0, parsed));
      }
    }
    setText(String(finalVal));
    onChange && onChange(row, col, finalVal);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseInt(text, 10) || 0;
      const step = e.shiftKey ? 15 : 5;
      const next = Math.min(255, current + step);
      setText(String(next));
      onChange && onChange(row, col, next);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseInt(text, 10) || 0;
      const step = e.shiftKey ? 15 : 5;
      const next = Math.max(0, current - step);
      setText(String(next));
      onChange && onChange(row, col, next);
    } else if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '7px',
        border: `1px solid ${isHovered ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        background: isHovered ? 'var(--bg-hover)' : 'var(--bg-secondary)',
        boxShadow: isHovered ? '0 0 0 1px var(--border-hover)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={onHover}
      onTouchStart={onHover}
      onWheel={(e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 5 : -5;
        const current = parseInt(text, 10) || 0;
        const next = Math.min(255, Math.max(0, current + delta));
        setText(String(next));
        onChange && onChange(row, col, next);
      }}
    >
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={3}
        value={text}
        onFocus={(e) => {
          isFocusedRef.current = true;
          onHover && onHover();
          e.target.select();
        }}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          height: '100%',
          textAlign: 'center',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontWeight: 700,
          fontSize: '0.92rem',
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          cursor: 'pointer'
        }}
        aria-label={`Cell [${row}, ${col}]`}
      />
    </div>
  );
});

/**
 * Result Matrix Cell (Read-Only) matching Step 8's ResultCell
 */
const SubtractionResultCell = React.memo(function SubtractionResultCell({
  value,
  row,
  col,
  isHovered,
  isHighlighted = false,
  badgeText = null,
  onHover
}) {
  return (
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '7px',
        border: `1px solid ${
          isHighlighted
            ? 'var(--accent-primary)'
            : isHovered
            ? 'var(--border-hover)'
            : 'var(--border-color)'
        }`,
        background: isHighlighted
          ? 'var(--accent-subtle)'
          : isHovered
          ? 'var(--bg-hover)'
          : 'var(--bg-secondary)',
        boxShadow: isHovered ? '0 0 0 1px var(--border-hover)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all 0.15s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={onHover}
      onTouchStart={onHover}
    >
      <span
        style={{
          color: 'var(--text-primary)',
          fontWeight: isHighlighted ? 800 : 700,
          fontSize: '0.92rem',
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {value}
      </span>
      {badgeText && isHighlighted && (
        <span
          style={{
            position: 'absolute',
            bottom: '1px',
            fontSize: '0.52rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: 'var(--accent-primary)',
            lineHeight: 1
          }}
        >
          {badgeText}
        </span>
      )}
    </div>
  );
});

export default function Step9MatrixSubtraction({ onSelectStep }) {
  // Preset selection
  const [currentPresetKey, setCurrentPresetKey] = useState('movingBox');

  // Matrix I (Scene with Object) and Matrix B (Empty Background)
  const [matrixI, setMatrixI] = useState(SUBTRACTION_PRESETS.movingBox.scene);
  const [matrixB, setMatrixB] = useState(SUBTRACTION_PRESETS.movingBox.bg);

  // Threshold T for binary mask M
  const [threshold, setThreshold] = useState(25);

  // Camera sensor noise level: 0 (clean), 4 (subtle), 10 (heavy)
  const [noiseLevel, setNoiseLevel] = useState(0);

  // Output representation in Column 4: 'mask' (M binary 1/0) or 'segmented' (I * M)
  const [outputView, setOutputView] = useState('mask');

  // Synchronized hovered cell
  const [hoveredCell, setHoveredCell] = useState(null);

  // Background matrix with deterministic sensor noise simulation
  const noisyMatrixB = useMemo(() => {
    if (noiseLevel === 0) return matrixB;
    return matrixB.map((row, r) =>
      row.map((val, c) => {
        // Deterministic pseudo-jitter offset across all cells
        const jitter = Math.sin((r + 1) * 3.7 + (c + 2) * 5.3) * noiseLevel;
        return clampPixel(val + Math.round(jitter));
      })
    );
  }, [matrixB, noiseLevel]);

  // Difference Matrix D = |I - B|
  const matrixD = useMemo(() => {
    return subtractMatrices(matrixI, noisyMatrixB, true);
  }, [matrixI, noisyMatrixB]);

  // Binary Mask Matrix M(x,y) = 1 if D(x,y) > T else 0
  const matrixM = useMemo(() => {
    return thresholdMatrix(matrixD, threshold, 1);
  }, [matrixD, threshold]);

  // Extracted Foreground Object F(x,y) = M(x,y) * I(x,y)
  const extractedObject = useMemo(() => {
    const rows = matrixI.length;
    const cols = matrixI[0].length;
    const res = createEmptyMatrix(rows, cols);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        res[i][j] = matrixM[i][j] === 1 ? matrixI[i][j] : 0;
      }
    }
    return res;
  }, [matrixI, matrixM]);

  // Stats: count of foreground vs background pixels detected
  const stats = useMemo(() => {
    let fgCount = 0;
    let bgCount = 0;
    for (let r = 0; r < matrixM.length; r++) {
      for (let c = 0; c < matrixM[0].length; c++) {
        if (matrixM[r][c] === 1) fgCount++;
        else bgCount++;
      }
    }
    return { fgCount, bgCount, total: matrixM.length * matrixM[0].length };
  }, [matrixM]);

  // Cell editing handlers
  const handleCellChangeI = (r, c, val) => {
    const next = matrixI.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixI(next);
  };

  const handleCellChangeB = (r, c, val) => {
    const next = matrixB.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixB(next);
  };

  // Select Preset
  const handleSelectPreset = (key) => {
    setCurrentPresetKey(key);
    const p = SUBTRACTION_PRESETS[key];
    setMatrixI(p.scene.map(row => [...row]));
    setMatrixB(p.bg.map(row => [...row]));
    setThreshold(p.defaultT);
  };

  // Reset to default
  const handleReset = () => {
    handleSelectPreset(currentPresetKey);
    setNoiseLevel(0);
  };

  // Randomize Scene and Background
  const handleRandomize = () => {
    const rows = 4;
    const cols = 4;
    const bgBase = Math.floor(Math.random() * 80) + 30;
    const newB = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => bgBase + Math.floor(Math.random() * 12) - 6)
    );
    const newI = newB.map(row => [...row]);
    // Place a random bright 2x2 object
    const startR = Math.floor(Math.random() * 2);
    const startC = Math.floor(Math.random() * 2);
    for (let r = startR; r < startR + 2; r++) {
      for (let c = startC; c < startC + 2; c++) {
        newI[r][c] = Math.min(255, bgBase + 140 + Math.floor(Math.random() * 40));
      }
    }
    setMatrixB(newB);
    setMatrixI(newI);
  };

  // Hover arithmetic detail
  const hoverDetail = useMemo(() => {
    if (!hoveredCell) return null;
    const { row, col } = hoveredCell;
    const valI = matrixI[row]?.[col] ?? 0;
    const valB = noisyMatrixB[row]?.[col] ?? 0;
    const valD = matrixD[row]?.[col] ?? 0;
    const valM = matrixM[row]?.[col] ?? 0;
    const isFg = valD > threshold;

    return { row, col, valI, valB, valD, valM, isFg };
  }, [hoveredCell, matrixI, noisyMatrixB, matrixD, matrixM, threshold]);

  return (
    <motion.div 
      className="step-module subtraction-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* STEP HEADER */}
      <div className="step-header-box">
        <h2 className="step-heading">Background Detection</h2>
        <p className="step-description">
          Subtract an empty background image matrix <strong>B</strong> from a scene matrix containing an object <strong>I</strong>: <code>D = |I − B|</code>. Unchanged background pixels yield values close to zero, while the introduced object creates a high difference. We then apply threshold <strong>T</strong> to construct a binary mask: <strong>M(x, y) = 1 if D(x, y) &gt; T, else 0</strong>.
        </p>
      </div>

      {/* TOP CONTROLS CARD */}
      <div className="subtraction-controls-card">
        <div className="subtraction-controls-grid">
          
          {/* Part 1: Threshold Slider & Presets */}
          <div className="slider-group" style={{ marginBottom: 0 }}>
            <div className="threshold-label-row">
              <div className="threshold-title-wrap">
                <Filter size={15} style={{ color: 'var(--text-secondary)' }} />
                <span>Detection Threshold (T):</span>
              </div>
              <div className="threshold-val-wrap">
                <span className="threshold-num-large font-mono">
                  {threshold}
                </span>
                <span className="threshold-formula-sub">
                  (D &gt; {threshold} ➔ Foreground 1)
                </span>
              </div>
            </div>

            <input
              type="range"
              className="slider-input"
              min="0"
              max="150"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              onInput={(e) => setThreshold(parseInt(e.target.value, 10))}
              style={{ 
                '--slider-pct': `${(threshold / 150) * 100}%`, 
                '--slider-color': 'var(--text-primary)' 
              }}
            />

            {/* Synchronized Threshold Presets Strip */}
            <div className="threshold-presets-strip">
              {THRESHOLD_PRESETS.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  className={`threshold-preset-pill ${threshold === p.val ? 'active' : ''}`}
                  onClick={() => setThreshold(p.val)}
                  title={`Set threshold to ${p.val}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Part 2: Sensor Noise & Presets */}
          <div className="subtraction-right-controls">
            <div className="control-row-group">
              <div className="control-row-label-wrap">
                <Volume2 size={14} style={{ color: 'var(--text-secondary)' }} />
                <span>Camera Noise &amp; Light Jitter:</span>
              </div>
              
              <div className="noise-pill-group">
                <button
                  type="button"
                  className={`noise-btn ${noiseLevel === 0 ? 'active' : ''}`}
                  onClick={() => setNoiseLevel(0)}
                  title="Ideal: No sensor noise"
                >
                  0 (Ideal)
                </button>
                <button
                  type="button"
                  className={`noise-btn ${noiseLevel === 4 ? 'active' : ''}`}
                  onClick={() => setNoiseLevel(4)}
                  title="Subtle sensor noise: ±4"
                >
                  &plusmn;4 (Subtle)
                </button>
                <button
                  type="button"
                  className={`noise-btn ${noiseLevel === 10 ? 'active' : ''}`}
                  onClick={() => setNoiseLevel(10)}
                  title="Heavy lighting noise: ±10"
                >
                  &plusmn;10 (Heavy)
                </button>
              </div>
            </div>

            {/* Presets and Actions Row */}
            <div className="control-row-group">
              <div className="presets-pill-group">
                <span className="control-row-label-wrap" style={{ marginRight: '0.15rem' }}>
                  Presets:
                </span>
                {Object.entries(SUBTRACTION_PRESETS).map(([key, data]) => (
                  <button
                    key={key}
                    type="button"
                    className={`preset-btn mini-btn ${currentPresetKey === key ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(key)}
                    title={data.desc}
                  >
                    {data.name}
                  </button>
                ))}
              </div>

              <div className="action-btn-group">
                <button 
                  type="button"
                  className="icon-action-btn" 
                  onClick={handleRandomize}
                  title="Generate Random Clean Scene & Background"
                >
                  <Shuffle size={13} />
                  <span>Random</span>
                </button>
                <button 
                  type="button"
                  className="icon-action-btn" 
                  onClick={handleReset}
                  title="Reset to default preset"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* THRESHOLD LOGIC & NOISE STATUS BAR */}
      <div className="subtraction-logic-bar">
        <div className="logic-bar-left">
          <Sparkles size={14} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
          {hoverDetail ? (
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              Cell ({hoverDetail.row + 1}, {hoverDetail.col + 1}):{' '}
              I = <strong>{hoverDetail.valI}</strong> &minus; B = <strong>{hoverDetail.valB}</strong> &rarr;{' '}
              D = |{hoverDetail.valI} &minus; {hoverDetail.valB}| = <strong>{hoverDetail.valD}</strong>{' '}
              ({hoverDetail.valD} {hoverDetail.isFg ? '>' : '\u2264'} T={threshold}) &rarr;{' '}
              <strong>M = {hoverDetail.isFg ? '1 (Foreground)' : '0 (Background)'}</strong>
            </span>
          ) : (
            <span>
              <strong>Threshold Logic:</strong> D(x, y) = |I(x, y) &minus; B(x, y)|. If D &gt; {threshold}, M(x, y) = 1 (Foreground). Otherwise M(x, y) = 0 (Background). Hover any cell to inspect!
            </span>
          )}
        </div>
        {noiseLevel > 0 && (
          <span className="noise-alert-badge" title="Sensor noise alters unchanged background pixels">
            <AlertCircle size={12} />
            Noise Active: Unchanged BG has small delta (2&ndash;{noiseLevel})
          </span>
        )}
      </div>

      {/* =========================================================================
          THE 4-COLUMN HORIZONTAL LINE PIPELINE:
          IMAGE WITH OBJECT (I)  ➖  BACKGROUND (B)  🟰  DIFFERENCE (D)  ➔  MASK (M)
          Styled using canonical MathLens MatrixGrid design and theme colors
         ========================================================================= */}
      <div className="subtraction-horizontal-line-container">
        
        {/* COLUMN 1: SCENE WITH OBJECT (I) */}
        <div className="addition-column-card glass-level-2">
          <div className="matrix-header">
            <div className="matrix-header-title-row">
              <h3 className="matrix-title-text">Scene Image (I)</h3>
            </div>
            <div className="matrix-header-badge-wrap">
              <span className="matrix-dims-badge">4 × 4</span>
            </div>
          </div>

          <div className="canvas-subrow">
            <PipelineCanvas
              matrix={matrixI}
              hoveredCell={hoveredCell}
              onHoverCell={setHoveredCell}
              pixelSize={20}
              title="Scene with Object (I)"
            />
            <div className="canvas-subrow-info">
              <span className="subrow-label">Scene Matrix I</span>
              <span className="subrow-hint">Object inside background</span>
              <div className="subrow-actions">
                <span className="badge-tag-mini">Editable</span>
              </div>
            </div>
          </div>

          {/* Matrix Grid Container */}
          <MatrixBracketWrapper onMouseLeave={() => setHoveredCell(null)}>
            {matrixI.map((row, i) =>
              row.map((val, j) => (
                <SubtractionEditableCell
                  key={`i-${i}-${j}`}
                  value={val}
                  row={i}
                  col={j}
                  isHovered={hoveredCell && hoveredCell.row === i && hoveredCell.col === j}
                  onChange={handleCellChangeI}
                  onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                />
              ))
            )}
          </MatrixBracketWrapper>

          <div className="matrix-footer-hint" style={{ marginTop: '0.45rem' }}>
            <span>Click to edit • Use ▲ ▼ keys</span>
          </div>
        </div>

        {/* OPERATOR 1: ➖ */}
        <div className="addition-operator-divider">
          <div className="operator-badge" title="Matrix Subtraction: [I - B]">
            <Minus size={18} strokeWidth={2.6} />
          </div>
          <span className="operator-label">Subtract</span>
        </div>

        {/* COLUMN 2: EMPTY BACKGROUND (B) */}
        <div className="addition-column-card glass-level-2">
          <div className="matrix-header">
            <div className="matrix-header-title-row">
              <h3 className="matrix-title-text">Background (B)</h3>
            </div>
            <div className="matrix-header-badge-wrap">
              <span className="matrix-dims-badge">4 × 4</span>
            </div>
          </div>

          <div className="canvas-subrow">
            <PipelineCanvas
              matrix={noisyMatrixB}
              hoveredCell={hoveredCell}
              onHoverCell={setHoveredCell}
              pixelSize={20}
              title="Empty Background (B)"
            />
            <div className="canvas-subrow-info">
              <span className="subrow-label">Background Matrix B</span>
              <span className="subrow-hint">Scene without the object</span>
              <div className="subrow-actions">
                <span className="badge-tag-mini">Reference</span>
              </div>
            </div>
          </div>

          {/* Matrix Grid Container */}
          <MatrixBracketWrapper onMouseLeave={() => setHoveredCell(null)}>
            {noisyMatrixB.map((row, i) =>
              row.map((val, j) => (
                <SubtractionEditableCell
                  key={`b-${i}-${j}`}
                  value={val}
                  row={i}
                  col={j}
                  isHovered={hoveredCell && hoveredCell.row === i && hoveredCell.col === j}
                  onChange={handleCellChangeB}
                  onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                />
              ))
            )}
          </MatrixBracketWrapper>

          <div className="matrix-footer-hint" style={{ marginTop: '0.45rem' }}>
            <span>{noiseLevel > 0 ? `±${noiseLevel} sensor noise active` : 'Click to edit background'}</span>
          </div>
        </div>

        {/* OPERATOR 2: 🟰 */}
        <div className="addition-operator-divider">
          <div className="operator-badge" title="Difference Matrix D = |I - B|">
            <Equal size={18} strokeWidth={2.6} />
          </div>
          <span className="operator-label">Difference</span>
        </div>

        {/* COLUMN 3: DIFFERENCE MATRIX (D) */}
        <div className="addition-column-card glass-level-2">
          <div className="matrix-header">
            <div className="matrix-header-title-row">
              <h3 className="matrix-title-text">Difference (D)</h3>
            </div>
            <div className="matrix-header-badge-wrap">
              <span className="matrix-dims-badge">4 × 4</span>
            </div>
          </div>

          <div className="canvas-subrow">
            <PipelineCanvas
              matrix={matrixD}
              hoveredCell={hoveredCell}
              onHoverCell={setHoveredCell}
              pixelSize={20}
              title="Difference Matrix Heatmap (D)"
            />
            <div className="canvas-subrow-info">
              <span className="subrow-label">Delta Intensity</span>
              <span className="subrow-hint">Object: delta &gt; T. BG: ~0 delta</span>
              <div className="subrow-actions">
                <span className="badge-tag-mini">Live |I - B|</span>
              </div>
            </div>
          </div>

          {/* Matrix Grid Container */}
          <MatrixBracketWrapper onMouseLeave={() => setHoveredCell(null)}>
            {matrixD.map((row, i) =>
              row.map((val, j) => {
                const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                const exceedsT = val > threshold;
                return (
                  <SubtractionResultCell
                    key={`d-${i}-${j}`}
                    value={val}
                    row={i}
                    col={j}
                    isHovered={isHovered}
                    isHighlighted={exceedsT}
                    badgeText={exceedsT ? '>T' : null}
                    onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                  />
                );
              })
            )}
          </MatrixBracketWrapper>

          <div className="matrix-footer-hint" style={{ marginTop: '0.45rem' }}>
            <span>Delta: D(x, y) = |I &minus; B|</span>
          </div>
        </div>

        {/* OPERATOR 3: ➔ THRESHOLD T */}
        <div className="addition-operator-divider">
          <div className="operator-badge" title={`Threshold Test: D(x, y) > ${threshold}`}>
            <Filter size={17} strokeWidth={2.5} />
          </div>
          <span className="operator-label">&gt; T({threshold})</span>
        </div>

        {/* COLUMN 4: BINARY MASK (M) & EXTRACTED OBJECT */}
        <div className="addition-column-card glass-level-2">
          <div className="matrix-header">
            <div className="matrix-header-title-row">
              <h3 className="matrix-title-text">
                {outputView === 'mask' ? 'Binary Mask (M)' : 'Object (I·M)'}
              </h3>
            </div>
            <div className="matrix-header-badge-wrap">
              <span className="matrix-dims-badge">4 × 4</span>
            </div>
          </div>

          <div className="canvas-subrow">
            <PipelineCanvas
              matrix={matrixM}
              isMask={outputView === 'mask'}
              extractedImage={outputView === 'segmented' ? extractedObject : null}
              hoveredCell={hoveredCell}
              onHoverCell={setHoveredCell}
              pixelSize={20}
              title={outputView === 'mask' ? 'Binary Mask M' : 'Segmented Foreground Object'}
            />
            <div className="canvas-subrow-info">
              <span className="subrow-label">
                {outputView === 'mask' ? 'Isolated Mask' : 'Segmented Object'}
              </span>
              <span className="subrow-hint">
                {stats.fgCount} FG, {stats.bgCount} BG
              </span>
              <div className="subrow-actions">
                <div className="subrow-toggle-group">
                  <button
                    type="button"
                    className={`subrow-toggle-pill ${outputView === 'mask' ? 'active' : ''}`}
                    onClick={() => setOutputView('mask')}
                    title="View Binary Mask M"
                  >
                    Mask
                  </button>
                  <button
                    type="button"
                    className={`subrow-toggle-pill ${outputView === 'segmented' ? 'active' : ''}`}
                    onClick={() => setOutputView('segmented')}
                    title="View Segmented Object (I * M)"
                  >
                    Object
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Matrix Grid Container */}
          <MatrixBracketWrapper onMouseLeave={() => setHoveredCell(null)}>
            {matrixM.map((row, i) =>
              row.map((val, j) => {
                const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                const isFg = val === 1;
                const displayVal = outputView === 'mask' ? val : extractedObject[i][j];

                return (
                  <SubtractionResultCell
                    key={`m-${i}-${j}`}
                    value={displayVal}
                    row={i}
                    col={j}
                    isHovered={isHovered}
                    isHighlighted={isFg}
                    badgeText={isFg && outputView === 'mask' ? 'FG' : null}
                    onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                  />
                );
              })
            )}
          </MatrixBracketWrapper>

          <div className="matrix-footer-hint" style={{ marginTop: '0.45rem' }}>
            <span>{outputView === 'mask' ? '1 = Foreground, 0 = Background' : 'F(x, y) = M(x, y) · I(x, y)'}</span>
          </div>
        </div>

      </div>

      {/* FLOATING CURSOR TOOLTIP */}
      {hoveredCell && hoveredCell.x !== undefined && (() => {
        const tooltipWidth = 320;
        const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const leftPos = hoveredCell.x > (screenWidth - tooltipWidth - 20)
          ? Math.max(10, hoveredCell.x - tooltipWidth - 14)
          : hoveredCell.x + 14;

        const valI = matrixI[hoveredCell.row][hoveredCell.col];
        const valB = noisyMatrixB[hoveredCell.row][hoveredCell.col];
        const valD = matrixD[hoveredCell.row][hoveredCell.col];
        const valM = matrixM[hoveredCell.row][hoveredCell.col];
        const isFg = valM === 1;

        return (
          <div 
            className="cursor-tooltip"
            style={{
              position: 'fixed',
              left: `${leftPos}px`,
              top: `${hoveredCell.y + 14}px`,
              pointerEvents: 'none',
              zIndex: 9999,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontWeight: 700 }}>
              ({hoveredCell.row + 1}, {hoveredCell.col + 1})
            </span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>I: <strong>{valI}</strong></span>
            <span style={{ opacity: 0.3 }}>&minus;</span>
            <span>B: <strong>{valB}</strong></span>
            <span style={{ opacity: 0.3 }}>=</span>
            <span>D: <strong>{valD}</strong></span>
            <span style={{ opacity: 0.3 }}>&rarr;</span>
            <span>M: <strong>{valM} ({isFg ? 'FG' : 'BG'})</strong></span>
          </div>
        );
      })()}

      {/* STANDARDIZED EDUCATIONAL DOCUMENTATION */}
      <div style={{ marginTop: '1.25rem' }}>
        <ModuleDocumentation stepNumber={9} />
      </div>

      <StepFooter stepNumber={9} onSelectStep={onSelectStep} />
    </motion.div>
  );
}

