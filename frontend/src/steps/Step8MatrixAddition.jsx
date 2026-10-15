import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { 
  RotateCcw, 
  ArrowLeftRight, 
  Shuffle, 
  Plus, 
  Minus, 
  Equal, 
  Sliders
} from 'lucide-react';
import StepWrapper from '../components/layout/StepWrapper';
import MathInspectorHUD from '../components/ui/MathInspectorHUD';
import { clampPixel, createEmptyMatrix } from '../core/mathEngine';

// Presets for Matrix A and Matrix B
const PRESET_PAIRS = {
  crossAndFrame: {
    name: 'Cross & Frame',
    desc: 'Center plus shape with an outer border box',
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
    desc: 'Horizontal gradient with vertical gradient',
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
    desc: 'Diagonal X shape with open O square',
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
    desc: 'Alternating checkerboard with vertical stripes',
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
  },
  motionDetect: {
    name: 'Motion Delta',
    desc: 'Moving target isolated from static background',
    matrixA: [
      [35,  35,  35,  35],
      [35, 235, 235,  35],
      [35, 235, 235,  35],
      [35,  35,  35,  35]
    ],
    matrixB: [
      [35, 35, 35, 35],
      [35, 35, 35, 35],
      [35, 35, 35, 35],
      [35, 35, 35, 35]
    ]
  },
  defectInspect: {
    name: 'Defect Inspect',
    desc: 'Baseline component compared against defective part',
    matrixA: [
      [180, 180, 180, 180],
      [180,  30, 180, 180],
      [180, 180, 180, 180],
      [180, 180, 180, 180]
    ],
    matrixB: [
      [180, 180, 180, 180],
      [180, 180, 180, 180],
      [180, 180, 180, 180],
      [180, 180, 180, 180]
    ]
  }
};

/**
 * Compact Image Visualizer Canvas
 */
const BlendingPixelCanvas = memo(function BlendingPixelCanvas({
  matrix,
  hoveredCell,
  onHoverCell,
  pixelSize = 32
}) {
  const canvasRef = useRef(null);
  const rows = matrix ? matrix.length : 0;
  const cols = matrix && matrix[0] ? matrix[0].length : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rows || !cols) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = cols * pixelSize;
    const height = rows * pixelSize;

    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);
    if (canvas.width !== targetW) canvas.width = targetW;
    if (canvas.height !== targetH) canvas.height = targetH;
    if (canvas.style.width !== `${width}px`) canvas.style.width = `${width}px`;
    if (canvas.style.height !== `${height}px`) canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = matrix[r][c];
        ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);

        // Adaptive grid borders
        if (v < 75) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        } else if (v > 180) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        } else {
          ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
        }

        ctx.lineWidth = 1;
        ctx.strokeRect(c * pixelSize + 0.5, r * pixelSize + 0.5, pixelSize - 1, pixelSize - 1);

        // Hover highlight
        if (hoveredCell && hoveredCell.row === r && hoveredCell.col === c) {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = isLight ? '#424F34' : '#FFFFFF';
          ctx.strokeRect(c * pixelSize + 1.5, r * pixelSize + 1.5, pixelSize - 3, pixelSize - 3);
          ctx.fillStyle = isLight ? 'rgba(105, 121, 81, 0.25)' : 'rgba(255, 255, 255, 0.25)';
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    ctx.restore();
  }, [matrix, hoveredCell, rows, cols, pixelSize]);

  const handlePointer = (e) => {
    if (!onHoverCell || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    if (clientX === undefined || clientY === undefined) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = Math.floor(x / (rect.width / cols));
    const row = Math.floor(y / (rect.height / rows));

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      onHoverCell({ row, col });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.45rem',
        borderRadius: '10px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        width: 'fit-content',
        margin: '0 auto'
      }}
      onMouseLeave={() => onHoverCell && onHoverCell(null)}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handlePointer}
        onTouchStart={handlePointer}
        onTouchMove={handlePointer}
        style={{
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          cursor: 'pointer',
          touchAction: 'none',
          display: 'block'
        }}
      />
    </div>
  );
});

/**
 * Editable Matrix Cell with Focus Tracking
 */
const EditableCell = memo(function EditableCell({
  value,
  row,
  col,
  isHovered,
  onChange,
  onHover
}) {
  const [text, setText] = useState(String(value));
  const isFocusedRef = useRef(false);

  useEffect(() => {
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
        width: '44px',
        height: '44px',
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
          fontSize: '0.94rem',
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
 * Result Matrix Cell (Read-Only with Saturated / Underflow Badges)
 */
const ResultCell = memo(function ResultCell({
  value,
  row,
  col,
  isHovered,
  isOverflow,
  isUnderflow,
  onHover
}) {
  return (
    <div
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '7px',
        border: `1px solid ${
          isOverflow
            ? '#DC2626'
            : isUnderflow
            ? '#D97706'
            : isHovered
            ? 'var(--accent-primary)'
            : 'var(--border-color)'
        }`,
        background: isOverflow
          ? 'rgba(220, 38, 38, 0.12)'
          : isUnderflow
          ? 'rgba(217, 119, 6, 0.12)'
          : isHovered
          ? 'var(--bg-hover)'
          : 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={onHover}
      onTouchStart={onHover}
    >
      <span
        style={{
          color: isOverflow ? '#DC2626' : isUnderflow ? '#D97706' : 'var(--text-primary)',
          fontWeight: 700,
          fontSize: '0.94rem',
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {value}
      </span>
      {isOverflow && (
        <span
          style={{
            position: 'absolute',
            bottom: '1px',
            fontSize: '0.55rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: '#DC2626',
            lineHeight: 1
          }}
        >
          MAX
        </span>
      )}
      {isUnderflow && (
        <span
          style={{
            position: 'absolute',
            bottom: '1px',
            fontSize: '0.55rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: '#D97706',
            lineHeight: 1
          }}
        >
          MIN
        </span>
      )}
    </div>
  );
});

export default function Step8MatrixAddition({ onSelectStep }) {
  // Primary Operation: 'add' (Addition/Blending) or 'sub' (Subtraction)
  const [operation, setOperation] = useState('add');

  // Addition Mode: 'blend' (C = αA + (1-α)B) or 'direct' (C = min(255, A + B))
  const [mode, setMode] = useState('blend');

  // Subtraction Mode: 'abs' (|A - B|), 'direct' (clamp(A - B)), or 'weighted' (clamp(A - αB))
  const [subMode, setSubMode] = useState('abs');

  // Blending factor alpha (0.00 to 1.00)
  const [alpha, setAlpha] = useState(0.5);

  // Selected preset key
  const [currentPresetKey, setCurrentPresetKey] = useState('crossAndFrame');

  // Input Matrices A and B
  const [matrixA, setMatrixA] = useState(() => PRESET_PAIRS.crossAndFrame.matrixA.map(r => [...r]));
  const [matrixB, setMatrixB] = useState(() => PRESET_PAIRS.crossAndFrame.matrixB.map(r => [...r]));

  // Hovered Cell synchronization { row, col }
  const [hoveredCell, setHoveredCell] = useState(null);

  // Derived Result Matrix C
  const matrixC = useMemo(() => {
    const rows = matrixA.length;
    const cols = matrixA[0].length;
    const result = createEmptyMatrix(rows, cols);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const valA = matrixA[i][j];
        const valB = matrixB[i][j];

        if (operation === 'add') {
          if (mode === 'direct') {
            result[i][j] = clampPixel(valA + valB);
          } else {
            result[i][j] = clampPixel(Math.round(alpha * valA + (1 - alpha) * valB));
          }
        } else {
          if (subMode === 'abs') {
            result[i][j] = clampPixel(Math.abs(valA - valB));
          } else if (subMode === 'weighted') {
            result[i][j] = clampPixel(Math.round(valA - alpha * valB));
          } else {
            result[i][j] = clampPixel(valA - valB);
          }
        }
      }
    }
    return result;
  }, [matrixA, matrixB, alpha, mode, operation, subMode]);

  // Overflow and Underflow Counts
  const overflowCount = useMemo(() => {
    if (operation !== 'add' || mode !== 'direct') return 0;
    let count = 0;
    for (let i = 0; i < matrixA.length; i++) {
      for (let j = 0; j < matrixA[0].length; j++) {
        if (matrixA[i][j] + matrixB[i][j] > 255) count++;
      }
    }
    return count;
  }, [matrixA, matrixB, mode, operation]);

  const underflowCount = useMemo(() => {
    if (operation !== 'sub' || subMode === 'abs') return 0;
    let count = 0;
    for (let i = 0; i < matrixA.length; i++) {
      for (let j = 0; j < matrixA[0].length; j++) {
        const valA = matrixA[i][j];
        const valB = matrixB[i][j];
        const diff = subMode === 'weighted' ? valA - alpha * valB : valA - valB;
        if (diff < 0) count++;
      }
    }
    return count;
  }, [matrixA, matrixB, subMode, operation, alpha]);

  // Handlers for cell editing
  const handleCellChangeA = useCallback((r, c, val) => {
    setMatrixA(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = Math.min(255, Math.max(0, val));
      return next;
    });
  }, []);

  const handleCellChangeB = useCallback((r, c, val) => {
    setMatrixB(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = Math.min(255, Math.max(0, val));
      return next;
    });
  }, []);

  const handleSelectPreset = useCallback((key) => {
    setCurrentPresetKey(key);
    if (PRESET_PAIRS[key]) {
      setMatrixA(PRESET_PAIRS[key].matrixA.map(r => [...r]));
      setMatrixB(PRESET_PAIRS[key].matrixB.map(r => [...r]));
    }
  }, []);

  const handleSwapMatrices = useCallback(() => {
    setMatrixA(prevA => {
      setMatrixB(prevA);
      return matrixB;
    });
  }, [matrixB]);

  const handleRandomize = useCallback(() => {
    const rows = 4, cols = 4;
    setMatrixA(Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.floor(Math.random() * 18) * 15)
    ));
    setMatrixB(Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.floor(Math.random() * 18) * 15)
    ));
  }, []);

  const handleReset = useCallback(() => {
    handleSelectPreset('crossAndFrame');
    setAlpha(0.5);
    setOperation('add');
    setMode('blend');
  }, [handleSelectPreset]);

  const handleInvertA = useCallback(() => {
    setMatrixA(prev => prev.map(row => row.map(v => 255 - v)));
  }, []);

  const handleInvertB = useCallback(() => {
    setMatrixB(prev => prev.map(row => row.map(v => 255 - v)));
  }, []);

  const handleMidGrayA = useCallback(() => {
    setMatrixA(createEmptyMatrix(4, 4, 128));
  }, []);

  const handleMidGrayB = useCallback(() => {
    setMatrixB(createEmptyMatrix(4, 4, 128));
  }, []);

  // Controls Bar (Above Matrix Blocks)
  const controls = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
      {/* Row 1: Operations, Modes, Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* Operation Switch */}
          <div className="control-cluster">
            <span className="control-cluster-label">Operation</span>
            <div className="segmented-control-group">
              <button
                className={`segmented-control-btn ${operation === 'add' ? 'active' : ''}`}
                onClick={() => setOperation('add')}
                type="button"
                title="Addition (Image & Matrix Blending)"
              >
                <Plus size={11} strokeWidth={2.5} />
                <span>Addition</span>
              </button>
              <button
                className={`segmented-control-btn ${operation === 'sub' ? 'active' : ''}`}
                onClick={() => setOperation('sub')}
                type="button"
                title="Subtraction (Delta & Difference Detection)"
              >
                <Minus size={11} strokeWidth={2.5} />
                <span>Subtraction</span>
              </button>
            </div>
          </div>

          {/* Mode Switch */}
          <div className="control-cluster">
            <span className="control-cluster-label">Mode</span>
            <div className="segmented-control-group">
              {operation === 'add' ? (
                <>
                  <button
                    className={`segmented-control-btn ${mode === 'blend' ? 'active' : ''}`}
                    onClick={() => setMode('blend')}
                    type="button"
                    title="Linear Alpha Blending: αA + (1−α)B"
                  >
                    <span>Blend (α)</span>
                  </button>
                  <button
                    className={`segmented-control-btn ${mode === 'direct' ? 'active' : ''}`}
                    onClick={() => setMode('direct')}
                    type="button"
                    title="Direct Matrix Addition: clamp(A + B)"
                  >
                    <span>Direct (A + B)</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`segmented-control-btn ${subMode === 'abs' ? 'active' : ''}`}
                    onClick={() => setSubMode('abs')}
                    type="button"
                    title="Absolute Delta: |A − B| (Motion & Change Detection)"
                  >
                    <span>Absolute |A − B|</span>
                  </button>
                  <button
                    className={`segmented-control-btn ${subMode === 'direct' ? 'active' : ''}`}
                    onClick={() => setSubMode('direct')}
                    type="button"
                    title="Direct Clamped Subtraction: clamp(A − B)"
                  >
                    <span>Direct (A − B)</span>
                  </button>
                  <button
                    className={`segmented-control-btn ${subMode === 'weighted' ? 'active' : ''}`}
                    onClick={() => setSubMode('weighted')}
                    type="button"
                    title="Weighted Subtraction: clamp(A − αB)"
                  >
                    <span>Weighted (α)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Utility Actions */}
        <div className="segmented-control-group">
          <button
            className="segmented-control-btn"
            onClick={handleSwapMatrices}
            type="button"
            title="Swap Matrix A and Matrix B"
          >
            <ArrowLeftRight size={11} />
            <span>Swap A ⇄ B</span>
          </button>
          <button
            className="segmented-control-btn"
            onClick={handleRandomize}
            type="button"
            title="Generate Random Inputs"
          >
            <Shuffle size={11} />
            <span>Random</span>
          </button>
          <button
            className="segmented-control-btn"
            onClick={handleReset}
            type="button"
            title="Reset to default preset"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Row 2: Blending Factor Slider (when blending or weighted subtraction active) */}
      {(operation === 'add' ? mode === 'blend' : subMode === 'weighted') && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.35rem 0.65rem',
            borderRadius: '7px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              {operation === 'add' ? 'Blend Factor (α)' : 'Weight Factor (α)'}
            </span>
            <input
              type="range"
              className="glass-slider"
              min="0.0"
              max="1.0"
              step="0.01"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              style={{
                flex: 1,
                minWidth: '140px',
                '--slider-pct': `${alpha * 100}%`
              }}
              aria-label="Alpha blending slider"
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-primary)', minWidth: '36px' }}>
              {alpha.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Row 3: Presets Strip */}
      <div className="control-cluster" style={{ flexWrap: 'wrap' }}>
        <span className="control-cluster-label">
          Presets
        </span>
        <div className="segmented-control-group" style={{ flexWrap: 'wrap' }}>
          {Object.entries(PRESET_PAIRS).map(([key, data]) => (
            <button
              key={key}
              className={`segmented-control-btn ${currentPresetKey === key ? 'active' : ''}`}
              onClick={() => handleSelectPreset(key)}
              type="button"
              title={data.desc}
            >
              <span>{data.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Live Hovered Math Calculation for HUD
  const hoveredInfo = useMemo(() => {
    if (!hoveredCell) return null;
    const { row, col } = hoveredCell;
    const valA = matrixA[row]?.[col] ?? 0;
    const valB = matrixB[row]?.[col] ?? 0;
    const valC = matrixC[row]?.[col] ?? 0;

    let mathFormula = '';
    let mathResult = '';

    if (operation === 'add') {
      if (mode === 'blend') {
        mathFormula = `C[${row}, ${col}] = ${alpha.toFixed(2)} · ${valA} + ${(1 - alpha).toFixed(2)} · ${valB}`;
        mathResult = `${Math.round(alpha * valA)} + ${Math.round((1 - alpha) * valB)} = ${valC}`;
      } else {
        mathFormula = `C[${row}, ${col}] = ${valA} + ${valB}`;
        mathResult = `${valA + valB}${valA + valB > 255 ? ' ➔ clamped to 255' : ` = ${valC}`}`;
      }
    } else {
      if (subMode === 'abs') {
        mathFormula = `C[${row}, ${col}] = |${valA} − ${valB}|`;
        mathResult = `|${valA - valB}| = ${valC}`;
      } else if (subMode === 'weighted') {
        const rawW = Math.round(valA - alpha * valB);
        mathFormula = `C[${row}, ${col}] = clamp(${valA} − ${alpha.toFixed(2)} · ${valB}, 0, 255)`;
        mathResult = `${rawW < 0 ? `${rawW} ➔ clamped to 0` : `= ${valC}`}`;
      } else {
        const rawD = valA - valB;
        mathFormula = `C[${row}, ${col}] = clamp(${valA} − ${valB}, 0, 255)`;
        mathResult = `${rawD < 0 ? `${rawD} ➔ clamped to 0` : `= ${valC}`}`;
      }
    }

    return { row, col, valA, valB, valC, mathFormula, mathResult };
  }, [hoveredCell, matrixA, matrixB, matrixC, operation, mode, subMode, alpha]);

  return (
    <StepWrapper
      stepNumber={8}
      title="Matrix Blending & Image Addition"
      subtitle="Combine image matrices element-by-element using convex alpha weighting: C = α·A + (1 − α)·B."
      formula={
        operation === 'add'
          ? (mode === 'blend' ? 'C = α · A + (1 − α) · B  (0 ≤ α ≤ 1)' : 'C = min(255, A + B)')
          : (subMode === 'abs' ? 'C = |A − B|' : subMode === 'weighted' ? 'C = clamp(A − α·B, 0, 255)' : 'C = clamp(A − B, 0, 255)')
      }
      basicHint="Matrix addition combines pixels at identical [row, col] coordinates. Alpha weighting α controls the transparency and blend ratio of the two images."
      advancedFormula={
        operation === 'add'
          ? 'C[i, j] = clamp(α · A[i, j] + (1 − α) · B[i, j], 0, 255)'
          : 'C[i, j] = clamp(|A[i, j] − B[i, j]|, 0, 255)'
      }
      controls={controls}
      onPrev={() => onSelectStep && onSelectStep(7)}
      onNext={() => onSelectStep && onSelectStep(9)}
    >
      {/* 3-Column Balanced Equation Stage: Matrix A  [+]  Matrix B  [=]  Result C */}
      <div
        className="matrix-blending-stage"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr)',
          alignItems: 'stretch',
          gap: '0.75rem',
          width: '100%'
        }}
      >
        {/* CARD 1: INPUT A */}
        <div
          className="canvas-card glass-level-2"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem'
          }}
        >
          <div>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '0.45rem',
                marginBottom: '0.65rem',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Image & Matrix A
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {operation === 'add' && mode === 'blend' && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      padding: '0.12rem 0.45rem',
                      borderRadius: '5px'
                    }}
                  >
                    α = {alpha.toFixed(2)}
                  </span>
                )}
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '0.12rem 0.45rem',
                    borderRadius: '5px'
                  }}
                >
                  4 × 4
                </span>
              </div>
            </div>

            {/* Visual Canvas Preview */}
            <BlendingPixelCanvas
              matrix={matrixA}
              hoveredCell={hoveredCell}
              onHoverCell={setHoveredCell}
              pixelSize={30}
            />

            {/* 4x4 Numerical Matrix Grid */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'fit-content',
                margin: '0.75rem auto 0.25rem'
              }}
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
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '5px',
                  width: 'fit-content'
                }}
              >
                {matrixA.map((row, r) =>
                  row.map((val, c) => (
                    <EditableCell
                      key={`a-${r}-${c}`}
                      value={val}
                      row={r}
                      col={c}
                      isHovered={hoveredCell && hoveredCell.row === r && hoveredCell.col === c}
                      onChange={handleCellChangeA}
                      onHover={() => setHoveredCell({ row: r, col: c })}
                    />
                  ))
                )}
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
          </div>

          {/* Card Utility Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.4rem',
              marginTop: '0.65rem',
              paddingTop: '0.45rem',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <button
              className="preset-pill-btn"
              onClick={handleInvertA}
              type="button"
              style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
            >
              Invert A
            </button>
            <button
              className="preset-pill-btn"
              onClick={handleMidGrayA}
              type="button"
              style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
            >
              128 Gray
            </button>
          </div>
        </div>

        {/* OPERATOR BADGE 1: (+) or (−) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            padding: '0 0.15rem'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              border: '1.5px solid var(--border-color)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            {operation === 'add' ? <Plus size={18} strokeWidth={2.6} /> : <Minus size={18} strokeWidth={2.6} />}
          </div>
          <span
            style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap'
            }}
          >
            {operation === 'add' ? (mode === 'blend' ? 'αA+(1−α)B' : 'A + B') : (subMode === 'abs' ? '|A − B|' : 'A − B')}
          </span>
        </div>

        {/* CARD 2: INPUT B */}
        <div
          className="canvas-card glass-level-2"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem'
          }}
        >
          <div>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '0.45rem',
                marginBottom: '0.65rem',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Image & Matrix B
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {operation === 'add' && mode === 'blend' && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      padding: '0.12rem 0.45rem',
                      borderRadius: '5px'
                    }}
                  >
                    1−α = {(1 - alpha).toFixed(2)}
                  </span>
                )}
                {operation === 'sub' && subMode === 'weighted' && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      padding: '0.12rem 0.45rem',
                      borderRadius: '5px'
                    }}
                  >
                    α = {alpha.toFixed(2)}
                  </span>
                )}
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '0.12rem 0.45rem',
                    borderRadius: '5px'
                  }}
                >
                  4 × 4
                </span>
              </div>
            </div>

            {/* Visual Canvas Preview */}
            <BlendingPixelCanvas
              matrix={matrixB}
              hoveredCell={hoveredCell}
              onHoverCell={setHoveredCell}
              pixelSize={30}
            />

            {/* 4x4 Numerical Matrix Grid */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'fit-content',
                margin: '0.75rem auto 0.25rem'
              }}
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
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '5px',
                  width: 'fit-content'
                }}
              >
                {matrixB.map((row, r) =>
                  row.map((val, c) => (
                    <EditableCell
                      key={`b-${r}-${c}`}
                      value={val}
                      row={r}
                      col={c}
                      isHovered={hoveredCell && hoveredCell.row === r && hoveredCell.col === c}
                      onChange={handleCellChangeB}
                      onHover={() => setHoveredCell({ row: r, col: c })}
                    />
                  ))
                )}
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
          </div>

          {/* Card Utility Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.4rem',
              marginTop: '0.65rem',
              paddingTop: '0.45rem',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <button
              className="preset-pill-btn"
              onClick={handleInvertB}
              type="button"
              style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
            >
              Invert B
            </button>
            <button
              className="preset-pill-btn"
              onClick={handleMidGrayB}
              type="button"
              style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
            >
              128 Gray
            </button>
          </div>
        </div>

        {/* OPERATOR BADGE 2: (=) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            padding: '0 0.15rem'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              border: '1.5px solid var(--border-color)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Equal size={18} strokeWidth={2.6} />
          </div>
          <span
            style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap'
            }}
          >
            Output C
          </span>
        </div>

        {/* CARD 3: RESULT C */}
        <div
          className="canvas-card glass-level-2"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem'
          }}
        >
          <div>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '0.45rem',
                marginBottom: '0.65rem',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Result Matrix C
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    background: 'var(--accent-subtle)',
                    border: '1px solid var(--border-color)',
                    padding: '0.12rem 0.45rem',
                    borderRadius: '5px'
                  }}
                >
                  Live Output
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '0.12rem 0.45rem',
                    borderRadius: '5px'
                  }}
                >
                  4 × 4
                </span>
              </div>
            </div>

            {/* Visual Canvas Preview */}
            <BlendingPixelCanvas
              matrix={matrixC}
              hoveredCell={hoveredCell}
              onHoverCell={setHoveredCell}
              pixelSize={30}
            />

            {/* 4x4 Numerical Matrix Grid */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'fit-content',
                margin: '0.75rem auto 0.25rem'
              }}
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
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '5px',
                  width: 'fit-content'
                }}
              >
                {matrixC.map((row, r) =>
                  row.map((val, c) => {
                    const rawAdd = matrixA[r][c] + matrixB[r][c];
                    const isOverflow = operation === 'add' && mode === 'direct' && rawAdd > 255;
                    const rawSub = subMode === 'weighted' ? matrixA[r][c] - alpha * matrixB[r][c] : matrixA[r][c] - matrixB[r][c];
                    const isUnderflow = operation === 'sub' && subMode !== 'abs' && rawSub < 0;

                    return (
                      <ResultCell
                        key={`c-${r}-${c}`}
                        value={val}
                        row={r}
                        col={c}
                        isHovered={hoveredCell && hoveredCell.row === r && hoveredCell.col === c}
                        isOverflow={isOverflow}
                        isUnderflow={isUnderflow}
                        onHover={() => setHoveredCell({ row: r, col: c })}
                      />
                    );
                  })
                )}
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
          </div>

          {/* Card Status Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              marginTop: '0.65rem',
              paddingTop: '0.45rem',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)'
            }}
          >
            {overflowCount > 0 ? (
              <span style={{ color: '#DC2626', fontWeight: 700 }}>
                {overflowCount} cell{overflowCount > 1 ? 's' : ''} saturated (&gt;255)
              </span>
            ) : underflowCount > 0 ? (
              <span style={{ color: '#D97706', fontWeight: 700 }}>
                {underflowCount} cell{underflowCount > 1 ? 's' : ''} clamped to 0
              </span>
            ) : (
              <span>
                {operation === 'add'
                  ? mode === 'blend'
                    ? 'Convex Superposition'
                    : 'Direct Element Sum'
                  : subMode === 'abs'
                  ? 'Absolute Delta'
                  : 'Element Difference'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Math Inspector HUD */}
      <MathInspectorHUD
        title="Element-by-Element Arithmetic"
        formula={
          hoveredInfo
            ? hoveredInfo.mathFormula
            : operation === 'add'
            ? mode === 'blend'
              ? `C[i, j] = ${alpha.toFixed(2)} · A[i, j] + ${(1 - alpha).toFixed(2)} · B[i, j]`
              : 'C[i, j] = min(255, A[i, j] + B[i, j])'
            : subMode === 'abs'
            ? 'C[i, j] = |A[i, j] − B[i, j]|'
            : 'C[i, j] = max(0, A[i, j] − B[i, j])'
        }
        result={
          hoveredInfo
            ? hoveredInfo.mathResult
            : operation === 'add'
            ? mode === 'blend'
              ? `Active blend at α = ${alpha.toFixed(2)} (${Math.round(alpha * 100)}% A + ${Math.round((1 - alpha) * 100)}% B)`
              : overflowCount > 0
              ? `${overflowCount} pixels clipped at max 255`
              : 'Direct addition without overflow'
            : subMode === 'abs'
            ? 'Absolute difference measures delta for motion tracking'
            : underflowCount > 0
            ? `${underflowCount} negative pixels clamped to min 0`
            : 'Direct difference without negative clipping'
        }
        note={
          hoveredInfo
            ? `Corresponding pixel [${hoveredInfo.row}, ${hoveredInfo.col}] in A (${hoveredInfo.valA}) and B (${hoveredInfo.valB}) combined to yield C (${hoveredInfo.valC}).`
            : 'Hover any cell or drag the alpha slider to inspect pixel-by-pixel arithmetic across all three matrices.'
        }
      />
    </StepWrapper>
  );
}
