import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Blend, 
  ArrowLeftRight, 
  RotateCcw, 
  Shuffle, 
  Sliders, 
  Plus, 
  Equal, 
  Layers, 
  Sparkles,
  Info,
  AlertTriangle,
  Scissors
} from 'lucide-react';
import { clampPixel, createEmptyMatrix } from '../core/mathEngine';

// Default presets for Image A and Image B
const PRESET_PAIRS = {
  crossAndFrame: {
    name: 'Cross & Frame',
    desc: 'Center plus shape blended with an outer border box',
    matrixA: [
      [20, 240, 240, 20],
      [240, 240, 240, 240],
      [240, 240, 240, 240],
      [20, 240, 240, 20]
    ],
    matrixB: [
      [220, 220, 220, 220],
      [220, 20,  20,  220],
      [220, 20,  20,  220],
      [220, 220, 220, 220]
    ]
  },
  dualGradients: {
    name: 'Dual Gradients',
    desc: 'Horizontal gradient blended with a vertical gradient',
    matrixA: [
      [20, 90, 170, 240],
      [20, 90, 170, 240],
      [20, 90, 170, 240],
      [20, 90, 170, 240]
    ],
    matrixB: [
      [20,  20,  20,  20],
      [90,  90,  90,  90],
      [170, 170, 170, 170],
      [240, 240, 240, 240]
    ]
  },
  xAndO: {
    name: 'X & O Patterns',
    desc: 'Diagonal X shape blended with an open O square',
    matrixA: [
      [240, 30,  30,  240],
      [30,  240, 240, 30],
      [30,  240, 240, 30],
      [240, 30,  30,  240]
    ],
    matrixB: [
      [210, 210, 210, 210],
      [210, 30,  30,  210],
      [210, 30,  30,  210],
      [210, 210, 210, 210]
    ]
  },
  checkerAndStripes: {
    name: 'Checker & Stripes',
    desc: 'Alternating checkerboard blended with vertical stripes',
    matrixA: [
      [240, 30,  240, 30],
      [30,  240, 30,  240],
      [240, 30,  240, 30],
      [30,  240, 30,  240]
    ],
    matrixB: [
      [220, 30, 220, 30],
      [220, 30, 220, 30],
      [220, 30, 220, 30],
      [220, 30, 220, 30]
    ]
  }
};

/**
 * Compact Canvas Visualizer for side-by-side horizontal line presentation
 */
function CompactPixelCanvas({
  matrix,
  hoveredCell,
  onHoverCell,
  pixelSize = 28,
  highlightColor = 'var(--accent-purple)'
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
        const v = matrix[r][c];
        ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);

        // Adaptive border for high visibility
        if (v < 75) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        } else if (v > 180) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        } else {
          ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.25)';
        }

        ctx.lineWidth = 1;
        ctx.strokeRect(c * pixelSize + 0.5, r * pixelSize + 0.5, pixelSize - 1, pixelSize - 1);

        // Hover highlight
        if (hoveredCell && hoveredCell.row === r && hoveredCell.col === c) {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = highlightColor;
          ctx.strokeRect(c * pixelSize + 1.5, r * pixelSize + 1.5, pixelSize - 3, pixelSize - 3);
          ctx.fillStyle = 'rgba(6, 182, 212, 0.28)';
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    ctx.restore();
  }, [matrix, hoveredCell, rows, cols, pixelSize, highlightColor]);

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
      />
    </div>
  );
}

export default function Step8MatrixAddition({ onSelectStep }) {
  // Alpha slider state (0.0 to 1.0)
  const [alpha, setAlpha] = useState(0.5);
  // Mode: 'blend' (C = αA + (1-α)B) or 'direct' (C = min(255, A + B))
  const [mode, setMode] = useState('blend');
  // Selected preset key
  const [currentPresetKey, setCurrentPresetKey] = useState('crossAndFrame');

  // Matrix A and Matrix B state
  const [matrixA, setMatrixA] = useState(PRESET_PAIRS.crossAndFrame.matrixA);
  const [matrixB, setMatrixB] = useState(PRESET_PAIRS.crossAndFrame.matrixB);

  // Synchronized hovered cell: { row, col, x, y }
  const [hoveredCell, setHoveredCell] = useState(null);

  // Calculate Result Matrix C = αA + (1-α)B or C = A + B
  const matrixC = useMemo(() => {
    const rows = matrixA.length;
    const cols = matrixA[0].length;
    const result = createEmptyMatrix(rows, cols);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const valA = matrixA[i][j];
        const valB = matrixB[i][j];
        if (mode === 'direct') {
          // Direct addition clamped to [0, 255]
          result[i][j] = clampPixel(valA + valB);
        } else {
          // Convex Blending: C = αA + (1-α)B
          result[i][j] = clampPixel(alpha * valA + (1 - alpha) * valB);
        }
      }
    }
    return result;
  }, [matrixA, matrixB, alpha, mode]);

  // Count cells clipped at 255 in direct mode (for pedagogical feedback)
  const clippedCellsCount = useMemo(() => {
    if (mode !== 'direct') return 0;
    let count = 0;
    for (let i = 0; i < matrixA.length; i++) {
      for (let j = 0; j < matrixA[0].length; j++) {
        if (matrixA[i][j] + matrixB[i][j] > 255) count++;
      }
    }
    return count;
  }, [matrixA, matrixB, mode]);

  // Handlers for cell editing
  const handleCellChangeA = (r, c, val) => {
    const next = matrixA.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixA(next);
  };

  const handleCellChangeB = (r, c, val) => {
    const next = matrixB.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixB(next);
  };

  // Swap Matrices A and B
  const handleSwapMatrices = () => {
    const temp = matrixA;
    setMatrixA(matrixB);
    setMatrixB(temp);
  };

  // Select Preset
  const handleSelectPreset = (key) => {
    setCurrentPresetKey(key);
    setMatrixA(PRESET_PAIRS[key].matrixA.map(row => [...row]));
    setMatrixB(PRESET_PAIRS[key].matrixB.map(row => [...row]));
  };

  // Randomize both matrices with clean stepped values (multiples of 15)
  const handleRandomize = () => {
    const rows = 4;
    const cols = 4;
    const newA = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.floor(Math.random() * 17) * 15)
    );
    const newB = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.floor(Math.random() * 17) * 15)
    );
    setMatrixA(newA);
    setMatrixB(newB);
  };

  // Invert matrix values
  const handleInvertA = () => {
    setMatrixA(prev => prev.map(row => row.map(v => 255 - v)));
  };

  const handleInvertB = () => {
    setMatrixB(prev => prev.map(row => row.map(v => 255 - v)));
  };

  // Reset to current preset
  const handleReset = () => {
    handleSelectPreset(currentPresetKey);
    setAlpha(0.5);
  };

  // Current hovered values
  const hoveredInfo = useMemo(() => {
    if (!hoveredCell) return null;
    const { row, col } = hoveredCell;
    const valA = matrixA[row]?.[col] ?? 0;
    const valB = matrixB[row]?.[col] ?? 0;
    const valC = matrixC[row]?.[col] ?? 0;
    const rawSum = valA + valB;
    const isClipped = mode === 'direct' && rawSum > 255;
    return { row, col, valA, valB, valC, rawSum, isClipped };
  }, [hoveredCell, matrixA, matrixB, matrixC, mode]);

  return (
    <motion.div 
      className="step-module addition-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* STEP HEADER */}
      <div className="step-header-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="modal-badge-tag" style={{ margin: 0 }}>
              Chapter 8.1
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Matrix Addition & Blending
            </span>
          </div>

          {/* Sub-Chapter Switcher */}
          <div className="sub-chapter-nav">
            <button className="sub-chapter-pill active" title="Current: 8.1 Matrix Addition">
              <Blend size={13} />
              <span>8.1 Matrix Addition</span>
            </button>
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(9) : null}
              title="Jump to 8.2 Matrix Subtraction"
            >
              <Scissors size={13} />
              <span>8.2 Matrix Subtraction</span>
            </button>
          </div>
        </div>
        <h2 className="step-heading">8.1 Matrix Addition: Blend Two Images</h2>
        <p className="step-description">
          Combine two images of the same size using matrix addition. Since direct addition (<code>C = A + B</code>) can produce pixel values exceeding 255 (causing intensity blowout/saturation), we introduce a blending factor: <strong>C = αA + (1 − α)B</strong>, where <strong>0 ≤ α ≤ 1</strong>. Notice how corresponding pixels combine element-by-element!
        </p>
      </div>

      {/* TOP CONTROLS CARD */}
      <div className="top-control-card addition-controls-card">
        <div className="addition-controls-grid">
          {/* Part 1: Alpha Blending Slider */}
          <div className="slider-group" style={{ marginBottom: 0 }}>
            <div className="slider-label" style={{ marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Blend size={16} color="var(--accent-purple)" />
                <span>Blending Factor (α):</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span className="font-mono" style={{ color: 'var(--accent-purple)', fontSize: '1.25rem', fontWeight: '800' }}>
                  {alpha.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ({Math.round(alpha * 100)}% A + {Math.round((1 - alpha) * 100)}% B)
                </span>
              </div>
            </div>

            <input
              type="range"
              className="slider-input"
              min="0.0"
              max="1.0"
              step="0.01"
              value={alpha}
              disabled={mode === 'direct'}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              onInput={(e) => setAlpha(parseFloat(e.target.value))}
              style={{ 
                '--slider-pct': `${alpha * 100}%`, 
                '--slider-color': 'var(--accent-purple)',
                opacity: mode === 'direct' ? 0.4 : 1 
              }}
            />

            {/* Quick Alpha Presets */}
            <div className="alpha-presets-row">
              <button 
                className={`mini-preset-pill ${mode === 'blend' && alpha === 1.0 ? 'active' : ''}`}
                onClick={() => { setMode('blend'); setAlpha(1.0); }}
                title="100% Image A"
              >
                100% A
              </button>
              <button 
                className={`mini-preset-pill ${mode === 'blend' && alpha === 0.75 ? 'active' : ''}`}
                onClick={() => { setMode('blend'); setAlpha(0.75); }}
                title="75% Image A, 25% Image B"
              >
                75% A
              </button>
              <button 
                className={`mini-preset-pill ${mode === 'blend' && alpha === 0.5 ? 'active' : ''}`}
                onClick={() => { setMode('blend'); setAlpha(0.5); }}
                title="Equal 50/50 blend"
              >
                50/50
              </button>
              <button 
                className={`mini-preset-pill ${mode === 'blend' && alpha === 0.25 ? 'active' : ''}`}
                onClick={() => { setMode('blend'); setAlpha(0.25); }}
                title="25% Image A, 75% Image B"
              >
                25% A
              </button>
              <button 
                className={`mini-preset-pill ${mode === 'blend' && alpha === 0.0 ? 'active' : ''}`}
                onClick={() => { setMode('blend'); setAlpha(0.0); }}
                title="100% Image B"
              >
                100% B
              </button>
            </div>
          </div>

          {/* Part 2: Math Mode & Preset Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Addition Mode:
              </span>
              <div className="addition-mode-toggle">
                <button
                  className={`mode-btn ${mode === 'blend' ? 'active' : ''}`}
                  onClick={() => setMode('blend')}
                >
                  <Blend size={13} /> Blending C = αA + (1-α)B
                </button>
                <button
                  className={`mode-btn ${mode === 'direct' ? 'active' : ''}`}
                  onClick={() => setMode('direct')}
                >
                  <Plus size={13} /> Direct C = A + B
                </button>
              </div>
            </div>

            {/* Presets & Actions Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '0.2rem' }}>
                Presets:
              </span>
              {Object.entries(PRESET_PAIRS).map(([key, data]) => (
                <button
                  key={key}
                  className={`preset-btn mini-btn ${currentPresetKey === key ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(key)}
                  title={data.desc}
                >
                  {data.name}
                </button>
              ))}

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
                <button 
                  className="preset-btn mini-btn icon-only-btn" 
                  onClick={handleSwapMatrices}
                  title="Swap Matrix A and Matrix B"
                >
                  <ArrowLeftRight size={13} />
                  <span>Swap A ⇄ B</span>
                </button>
                <button 
                  className="preset-btn mini-btn icon-only-btn" 
                  onClick={handleRandomize}
                  title="Generate Random Clean Pixel Matrices"
                >
                  <Shuffle size={13} />
                  <span>Random</span>
                </button>
                <button 
                  className="preset-btn mini-btn icon-only-btn" 
                  onClick={handleReset}
                  title="Reset to default"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ELEMENT-BY-ELEMENT LIVE FORMULA INSPECTOR STRIP */}
      <div className="addition-formula-inspector">
        {hoveredInfo ? (
          <div className="formula-inspector-content active">
            <span className="inspector-pill">
              Cell ({hoveredInfo.row + 1}, {hoveredInfo.col + 1})
            </span>
            <div className="formula-math-tokens">
              {mode === 'blend' ? (
                <>
                  <span className="token-var">C<sub>{hoveredInfo.row+1},{hoveredInfo.col+1}</sub></span>
                  <span className="token-op">=</span>
                  <span className="token-val" style={{ color: 'var(--accent-purple)' }}>{alpha.toFixed(2)} × {hoveredInfo.valA}</span>
                  <span className="token-op">+</span>
                  <span className="token-val" style={{ color: '#F59E0B' }}>{(1 - alpha).toFixed(2)} × {hoveredInfo.valB}</span>
                  <span className="token-op">=</span>
                  <span className="token-sub">
                    {Math.round(alpha * hoveredInfo.valA)} + {Math.round((1 - alpha) * hoveredInfo.valB)}
                  </span>
                  <span className="token-op">=</span>
                  <span className="token-result">{hoveredInfo.valC}</span>
                </>
              ) : (
                <>
                  <span className="token-var">C<sub>{hoveredInfo.row+1},{hoveredInfo.col+1}</sub></span>
                  <span className="token-op">=</span>
                  <span className="token-val" style={{ color: 'var(--accent-purple)' }}>{hoveredInfo.valA}</span>
                  <span className="token-op">+</span>
                  <span className="token-val" style={{ color: '#F59E0B' }}>{hoveredInfo.valB}</span>
                  <span className="token-op">=</span>
                  <span className="token-sub">{hoveredInfo.rawSum}</span>
                  {hoveredInfo.isClipped && (
                    <span className="token-clipped-warning">
                      <AlertTriangle size={13} /> Clamped to max 255!
                    </span>
                  )}
                  <span className="token-op">➔</span>
                  <span className="token-result">{hoveredInfo.valC}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="formula-inspector-content idle">
            <Sparkles size={14} className="sparkle-idle-icon" />
            <span>
              <strong>Element-by-Element Principle:</strong> Corresponding pixels of Matrix A and Matrix B are combined individually. Hover over any cell below to inspect its exact arithmetic!
            </span>
          </div>
        )}

        {mode === 'direct' && clippedCellsCount > 0 && (
          <div className="clipped-summary-badge">
            <AlertTriangle size={13} />
            <span>{clippedCellsCount} cell{clippedCellsCount > 1 ? 's' : ''} saturated (&gt; 255)</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          THE HORIZONTAL ADDITION LINE:
          MATRIX A  ➕  MATRIX B  🟰  RESULTANT MATRIX C
          All placed side-by-side in ONE horizontal line so changes are visible instantly!
         ========================================================================= */}
      <div className="addition-horizontal-line-container">
        
        {/* COLUMN 1: MATRIX & IMAGE A */}
        <div className="addition-column-card card-matrix-a">
          <div className="addition-column-header">
            <div className="col-header-left">
              <span className="matrix-title-badge badge-a">A</span>
              <div>
                <h3 className="addition-card-title">Image & Matrix A</h3>
                <span className="addition-card-subtitle">Editable Inputs (0–255)</span>
              </div>
            </div>
            <div className="col-header-right">
              {mode === 'blend' && (
                <span className="addition-weight-pill pill-a" title="Current alpha weight for Image A">
                  α = {alpha.toFixed(2)}
                </span>
              )}
              <span className="matrix-dims">4 × 4</span>
            </div>
          </div>

          {/* Interactive Visual + Numerical Matrix Stack */}
          <div className="addition-card-body">
            {/* Visual Canvas Preview */}
            <div className="canvas-subrow">
              <CompactPixelCanvas
                matrix={matrixA}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                pixelSize={28}
                highlightColor="var(--accent-purple)"
              />
              <div className="canvas-subrow-info">
                <span className="subrow-label">Visual Representation A</span>
                <span className="subrow-hint">Grayscale: 0 (black) to 255 (white)</span>
                <div className="subrow-actions">
                  <button className="text-action-btn" onClick={handleInvertA} title="Invert colors (255 - x)">
                    Invert A
                  </button>
                  <button 
                    className="text-action-btn" 
                    onClick={() => setMatrixA(createEmptyMatrix(4, 4, 128))}
                    title="Fill with mid-gray (128)"
                  >
                    128 Gray
                  </button>
                </div>
              </div>
            </div>

            {/* Editable 4x4 Numerical Matrix Grid */}
            <div className="matrix-bracket-container compact-bracket">
              <div 
                className="matrix-grid compact-grid"
                style={{ gridTemplateColumns: `repeat(${matrixA[0].length}, 1fr)` }}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {matrixA.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    return (
                      <div
                        key={`a-${i}-${j}`}
                        className={`matrix-cell editable-cell compact-cell ${isHovered ? 'hovered' : ''}`}
                        style={{
                          '--cell-accent': 'var(--accent-purple)',
                          borderColor: isHovered ? 'var(--accent-purple)' : undefined,
                          background: `linear-gradient(135deg, rgba(${val},${val},${val},0.14) 0%, var(--bg-secondary) 100%)`
                        }}
                        onMouseEnter={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                      >
                        <div className="editable-cell-inner compact-inner">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={val}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value);
                              const valid = isNaN(parsed) ? 0 : Math.min(255, Math.max(0, parsed));
                              handleCellChangeA(i, j, valid);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                                e.preventDefault();
                                handleCellChangeA(i, j, Math.min(255, val + 5));
                              } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                                e.preventDefault();
                                handleCellChangeA(i, j, Math.max(0, val - 5));
                              }
                            }}
                            className="matrix-cell-input compact-input"
                            style={{ color: 'var(--accent-purple)' }}
                          />
                          <div className="stepper-arrow-buttons compact-steppers">
                            <button
                              type="button"
                              className="stepper-arrow-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellChangeA(i, j, Math.min(255, val + 10));
                              }}
                              title="+10"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className="stepper-arrow-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellChangeA(i, j, Math.max(0, val - 10));
                              }}
                              title="-10"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MATH OPERATOR: ➕ */}
        <div className="addition-operator-divider">
          <div className="operator-badge plus-badge" title="Matrix Addition Operator">
            <Plus size={22} strokeWidth={2.8} />
          </div>
          <span className="operator-label">
            {mode === 'blend' ? 'αA + (1-α)B' : 'A + B'}
          </span>
        </div>

        {/* COLUMN 2: MATRIX & IMAGE B */}
        <div className="addition-column-card card-matrix-b">
          <div className="addition-column-header">
            <div className="col-header-left">
              <span className="matrix-title-badge badge-b">B</span>
              <div>
                <h3 className="addition-card-title">Image & Matrix B</h3>
                <span className="addition-card-subtitle">Editable Inputs (0–255)</span>
              </div>
            </div>
            <div className="col-header-right">
              {mode === 'blend' && (
                <span className="addition-weight-pill pill-b" title="Current (1-alpha) weight for Image B">
                  1-α = {(1 - alpha).toFixed(2)}
                </span>
              )}
              <span className="matrix-dims" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.12)' }}>
                4 × 4
              </span>
            </div>
          </div>

          {/* Interactive Visual + Numerical Matrix Stack */}
          <div className="addition-card-body">
            {/* Visual Canvas Preview */}
            <div className="canvas-subrow">
              <CompactPixelCanvas
                matrix={matrixB}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                pixelSize={28}
                highlightColor="#F59E0B"
              />
              <div className="canvas-subrow-info">
                <span className="subrow-label">Visual Representation B</span>
                <span className="subrow-hint">Grayscale: 0 (black) to 255 (white)</span>
                <div className="subrow-actions">
                  <button className="text-action-btn" onClick={handleInvertB} title="Invert colors (255 - x)">
                    Invert B
                  </button>
                  <button 
                    className="text-action-btn" 
                    onClick={() => setMatrixB(createEmptyMatrix(4, 4, 128))}
                    title="Fill with mid-gray (128)"
                  >
                    128 Gray
                  </button>
                </div>
              </div>
            </div>

            {/* Editable 4x4 Numerical Matrix Grid */}
            <div className="matrix-bracket-container compact-bracket">
              <div 
                className="matrix-grid compact-grid"
                style={{ gridTemplateColumns: `repeat(${matrixB[0].length}, 1fr)` }}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {matrixB.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    return (
                      <div
                        key={`b-${i}-${j}`}
                        className={`matrix-cell editable-cell compact-cell ${isHovered ? 'hovered' : ''}`}
                        style={{
                          '--cell-accent': '#F59E0B',
                          borderColor: isHovered ? '#F59E0B' : undefined,
                          background: `linear-gradient(135deg, rgba(${val},${val},${val},0.14) 0%, var(--bg-secondary) 100%)`
                        }}
                        onMouseEnter={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                      >
                        <div className="editable-cell-inner compact-inner">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={val}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value);
                              const valid = isNaN(parsed) ? 0 : Math.min(255, Math.max(0, parsed));
                              handleCellChangeB(i, j, valid);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                                e.preventDefault();
                                handleCellChangeB(i, j, Math.min(255, val + 5));
                              } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                                e.preventDefault();
                                handleCellChangeB(i, j, Math.max(0, val - 5));
                              }
                            }}
                            className="matrix-cell-input compact-input"
                            style={{ color: '#F59E0B' }}
                          />
                          <div className="stepper-arrow-buttons compact-steppers">
                            <button
                              type="button"
                              className="stepper-arrow-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellChangeB(i, j, Math.min(255, val + 10));
                              }}
                              title="+10"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className="stepper-arrow-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellChangeB(i, j, Math.max(0, val - 10));
                              }}
                              title="-10"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MATH OPERATOR: 🟰 */}
        <div className="addition-operator-divider">
          <div className="operator-badge equals-badge" title="Equals Result">
            <Equal size={22} strokeWidth={2.8} />
          </div>
          <span className="operator-label">
            Output C
          </span>
        </div>

        {/* COLUMN 3: RESULTANT MATRIX & IMAGE C */}
        <div className="addition-column-card card-matrix-c">
          <div className="addition-column-header">
            <div className="col-header-left">
              <span className="matrix-title-badge badge-c">C</span>
              <div>
                <h3 className="addition-card-title">Result Matrix C</h3>
                <span className="addition-card-subtitle" style={{ color: 'var(--accent-emerald)' }}>
                  {mode === 'blend' ? 'Live Blended Output' : 'Live Direct Sum'}
                </span>
              </div>
            </div>
            <div className="col-header-right">
              <span className="addition-weight-pill pill-c" title="Resulting mathematical formulation">
                {mode === 'blend' ? 'C = αA + (1-α)B' : 'C = A + B'}
              </span>
              <span className="matrix-dims" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10B981', background: 'rgba(16, 185, 129, 0.12)' }}>
                4 × 4
              </span>
            </div>
          </div>

          {/* Interactive Visual + Numerical Matrix Stack */}
          <div className="addition-card-body">
            {/* Visual Canvas Preview */}
            <div className="canvas-subrow">
              <CompactPixelCanvas
                matrix={matrixC}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                pixelSize={28}
                highlightColor="var(--accent-emerald)"
              />
              <div className="canvas-subrow-info">
                <span className="subrow-label" style={{ color: 'var(--text-primary)' }}>
                  Combined Image C
                </span>
                <span className="subrow-hint">
                  {mode === 'blend' ? (
                    `Smooth convex transition at α = ${alpha.toFixed(2)}`
                  ) : (
                    clippedCellsCount > 0 ? `${clippedCellsCount} saturated pixels` : 'Direct element sum'
                  )}
                </span>
                <div className="subrow-actions">
                  <span className="status-live-indicator">
                    <span className="pulse-dot"></span> Live Reactive
                  </span>
                </div>
              </div>
            </div>

            {/* Read-Only Resulting 4x4 Matrix Grid */}
            <div className="matrix-bracket-container compact-bracket">
              <div 
                className="matrix-grid compact-grid"
                style={{ gridTemplateColumns: `repeat(${matrixC[0].length}, 1fr)` }}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {matrixC.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    const rawDirect = matrixA[i][j] + matrixB[i][j];
                    const isClipped = mode === 'direct' && rawDirect > 255;

                    return (
                      <div
                        key={`c-${i}-${j}`}
                        className={`matrix-cell result-cell compact-cell ${isHovered ? 'hovered' : ''} ${isClipped ? 'clipped-cell' : ''}`}
                        style={{
                          '--cell-accent': 'var(--accent-emerald)',
                          borderColor: isHovered ? 'var(--accent-emerald)' : undefined,
                          background: `linear-gradient(135deg, rgba(${val},${val},${val},0.18) 0%, var(--bg-secondary) 100%)`
                        }}
                        onMouseEnter={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                      >
                        <span 
                          className="matrix-cell-val compact-val" 
                          style={{ 
                            color: isClipped ? '#EF4444' : isHovered ? '#FFFFFF' : 'var(--accent-emerald)',
                            fontWeight: '800'
                          }}
                        >
                          {val}
                        </span>
                        {isClipped && (
                          <span className="clipped-corner-tag" title={`Unclipped sum was ${rawDirect}`}>
                            MAX
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FLOATING CURSOR TOOLTIP */}
      {hoveredCell && hoveredCell.x !== undefined && (
        <div 
          className="cursor-tooltip"
          style={{
            position: 'fixed',
            left: `${hoveredCell.x + 14}px`,
            top: `${hoveredCell.y + 14}px`,
            pointerEvents: 'none',
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '20px',
            padding: '0.35rem 0.85rem',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-mono)',
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
            ({hoveredCell.row + 1}, {hoveredCell.col + 1})
          </span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>A: <strong style={{ color: 'var(--accent-purple)' }}>{matrixA[hoveredCell.row][hoveredCell.col]}</strong></span>
          <span style={{ opacity: 0.3 }}>+</span>
          <span>B: <strong style={{ color: '#F59E0B' }}>{matrixB[hoveredCell.row][hoveredCell.col]}</strong></span>
          <span style={{ opacity: 0.3 }}>=</span>
          <span>C: <strong style={{ color: '#10B981' }}>{matrixC[hoveredCell.row][hoveredCell.col]}</strong></span>
        </div>
      )}
    </motion.div>
  );
}
