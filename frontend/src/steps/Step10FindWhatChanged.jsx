import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Minus, 
  Equal, 
  Filter, 
  Sparkles, 
  RotateCcw, 
  Shuffle, 
  AlertCircle,
  Camera,
  Upload,
  Move,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  Video,
  VideoOff,
  Image as ImageIcon,
  Grid,
  Volume2
} from 'lucide-react';
import { clampPixel, subtractMatrices, thresholdMatrix } from '../core/mathEngine';
import StepFooter from '../components/layout/StepFooter';
import ModuleDocumentation from '../components/experiment/ModuleDocumentation';

// Presets representing 4 core change detection scenarios with high-contrast photographic values
const CHANGE_PRESETS = {
  objectAdded: {
    id: 'objectAdded',
    name: 'Object Added (+)',
    badge: 'Added',
    type: 'added',
    scenario: 'Coffee Mug Placed on Clean Desk',
    desc: 'Scene A shows a wooden tabletop. In Scene B, a bright ceramic mug is placed in the center-right.',
    defaultT: 25,
    matrixA: [
      [145, 148, 142, 150],
      [142, 140, 145, 148],
      [146, 144, 142, 145],
      [148, 150, 146, 144]
    ],
    matrixB: [
      [145, 148, 142, 150],
      [142, 140, 240, 240],
      [146, 144, 240, 240],
      [148, 150, 146, 144]
    ]
  },
  objectRemoved: {
    id: 'objectRemoved',
    name: 'Object Removed (−)',
    badge: 'Removed',
    type: 'removed',
    scenario: 'Keys Missing from Entry Table',
    desc: 'Scene A has bright keys on the table. In Scene B, the keys were picked up and removed.',
    defaultT: 25,
    matrixA: [
      [135, 132, 136, 130],
      [132, 245, 245, 132],
      [136, 245, 245, 136],
      [130, 135, 132, 134]
    ],
    matrixB: [
      [135, 132, 136, 130],
      [132, 134, 132, 132],
      [136, 132, 135, 136],
      [130, 135, 132, 134]
    ]
  },
  objectMoved: {
    id: 'objectMoved',
    name: 'Object Moved (⇄)',
    badge: 'Moved',
    type: 'moved',
    scenario: 'Chess Piece Shifted to New Square',
    desc: 'Scene A shows a piece at Top-Left (0, 0). In Scene B, it moved to Bottom-Right (2, 2). Subtraction reveals two change hotspots!',
    defaultT: 30,
    matrixA: [
      [240, 240, 125, 125],
      [240, 240, 125, 125],
      [125, 125, 125, 125],
      [125, 125, 125, 125]
    ],
    matrixB: [
      [125, 125, 125, 125],
      [125, 125, 125, 125],
      [125, 125, 240, 240],
      [125, 125, 240, 240]
    ]
  },
  securityDoor: {
    id: 'securityDoor',
    name: 'Security Cam',
    badge: 'Surveillance',
    type: 'added',
    scenario: 'Person Walking Through Hallway',
    desc: 'Surveillance camera monitors empty corridor. Subtraction detects intruder stepping into doorway.',
    defaultT: 25,
    matrixA: [
      [110, 125, 140, 155],
      [110, 125, 140, 155],
      [110, 125, 140, 155],
      [110, 125, 140, 155]
    ],
    matrixB: [
      [110, 125, 140, 155],
      [110, 235, 235, 155],
      [110, 235, 235, 155],
      [110, 125, 140, 155]
    ]
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
 * Compact Canvas Component with change highlight bounding box & theme consistency
 * Avoids solid black fills and uses the theme primary accent for changes
 */
function PipelineCanvas({
  matrix,
  hoveredCell,
  onHoverCell,
  pixelSize = 20,
  title,
  mode = 'normal', // 'normal', 'diff', 'highlightOverlay', 'mask'
  threshold = 25,
  matrixA = null,
  matrixB = null
}) {
  const canvasRef = useRef(null);
  const rows = matrix.length;
  const cols = matrix[0].length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rows || !cols) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = cols * pixelSize;
    const height = rows * pixelSize;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    let minR = rows, maxR = -1, minC = cols, maxC = -1;
    let hasChanges = false;

    // 1. Draw base pixel tiles
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r][c];

        if (mode === 'mask') {
          // Binary Change Mask M: Changed is Primary Accent, Unchanged is Neutral Card Surface
          const isChanged = val === 1 || val === 255;
          if (isChanged) {
            ctx.fillStyle = isLight ? '#697951' : '#FFFFFF';
          } else {
            ctx.fillStyle = isLight ? '#FAF9F2' : '#130F0D';
          }
        } else if (mode === 'diff') {
          // Difference Matrix D: Unchanged is Neutral Card Surface, Nonzero gets subtle or accent tint
          const isChanged = val > threshold;
          if (isChanged) {
            ctx.fillStyle = isLight ? 'rgba(105, 121, 81, 0.45)' : 'rgba(255, 255, 255, 0.45)';
          } else if (val > 0) {
            ctx.fillStyle = isLight ? 'rgba(105, 121, 81, 0.12)' : 'rgba(255, 255, 255, 0.1)';
          } else {
            ctx.fillStyle = isLight ? '#FAF9F2' : '#130F0D';
          }
        } else if (mode === 'highlightOverlay') {
          // Highlight Overlay over Scene 2: Grayscale base + Primary Accent tint on changed cluster
          const delta = Math.abs((matrixB?.[r]?.[c] ?? 0) - (matrixA?.[r]?.[c] ?? 0));
          const isChanged = delta > threshold;
          const baseB = matrixB ? matrixB[r][c] : val;

          if (isChanged) {
            hasChanges = true;
            if (r < minR) minR = r;
            if (r > maxR) maxR = r;
            if (c < minC) minC = c;
            if (c > maxC) maxC = c;

            // Soft theme accent tint
            ctx.fillStyle = isLight ? 'rgba(105, 121, 81, 0.45)' : 'rgba(255, 255, 255, 0.45)';
          } else {
            ctx.fillStyle = `rgb(${baseB}, ${baseB}, ${baseB})`;
          }
        } else {
          // Normal grayscale tile
          ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        }

        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);

        // Subtle tile borders
        ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * pixelSize + 0.5, r * pixelSize + 0.5, pixelSize - 1, pixelSize - 1);

        // Synchronized hover highlight using theme accent
        if (hoveredCell && hoveredCell.row === r && hoveredCell.col === c) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = isLight ? '#424F34' : '#FFFFFF';
          ctx.strokeRect(c * pixelSize + 1, r * pixelSize + 1, pixelSize - 2, pixelSize - 2);
          ctx.fillStyle = isLight ? 'rgba(105, 121, 81, 0.2)' : 'rgba(255, 255, 255, 0.18)';
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    // 2. In highlight mode, draw subtle bounding box around changed cluster
    if (mode === 'highlightOverlay' && hasChanges && maxR >= minR && maxC >= minC) {
      const boxX = minC * pixelSize;
      const boxY = minR * pixelSize;
      const boxW = (maxC - minC + 1) * pixelSize;
      const boxH = (maxR - minR + 1) * pixelSize;

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isLight ? '#424F34' : '#FFFFFF';
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [matrix, hoveredCell, rows, cols, pixelSize, mode, threshold, matrixA, matrixB]);

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
 * Matrix Bracket Wrapper - Clean brackets matching Step 8 and Step 9
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
 * Clean Editable Matrix Cell matching Step 8 and Step 9
 * Highlights changed cells with soft accent tint instead of solid black or bright colors
 */
const Step10EditableCell = React.memo(function Step10EditableCell({
  value,
  row,
  col,
  isHovered,
  isChanged = false,
  badgeText = null,
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
        width: '40px',
        height: '40px',
        borderRadius: '7px',
        border: `1px solid ${
          isHovered
            ? 'var(--accent-primary)'
            : isChanged
            ? 'var(--border-hover)'
            : 'var(--border-color)'
        }`,
        background: isHovered
          ? 'var(--bg-hover)'
          : isChanged
          ? 'var(--accent-subtle)'
          : 'var(--bg-secondary)',
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
          fontWeight: isChanged ? 800 : 700,
          fontSize: '0.92rem',
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          cursor: 'pointer'
        }}
        aria-label={`Cell [${row}, ${col}]`}
      />
      {badgeText && isChanged && (
        <span
          style={{
            position: 'absolute',
            bottom: '1px',
            fontSize: '0.52rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: 'var(--text-secondary)',
            lineHeight: 1,
            pointerEvents: 'none'
          }}
        >
          {badgeText}
        </span>
      )}
    </div>
  );
});

/**
 * Result Matrix Cell (Read-Only) for Card 3 (D) and Card 4 (M)
 * Displays unchanged pixels with neutral background, and differences with soft primary accent
 */
const Step10ResultCell = React.memo(function Step10ResultCell({
  value,
  row,
  col,
  isHovered,
  isHighlighted = false,
  isNonZero = false,
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
          isHovered
            ? 'var(--accent-primary)'
            : isHighlighted
            ? 'var(--accent-primary)'
            : 'var(--border-color)'
        }`,
        background: isHovered
          ? 'var(--bg-hover)'
          : isHighlighted
          ? 'var(--accent-subtle)'
          : isNonZero
          ? 'var(--bg-tertiary)'
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
          color: isHighlighted
            ? 'var(--text-primary)'
            : isNonZero
            ? 'var(--text-secondary)'
            : value === 0 || value === '0'
            ? 'var(--text-muted)'
            : 'var(--text-primary)',
          fontWeight: isHighlighted ? 800 : isNonZero ? 700 : 600,
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

export default function Step10FindWhatChanged({ onSelectStep }) {
  // Main view mode: 'matrix' (4x4 numerical pipeline) or 'photoLab' (custom photos upload/camera)
  const [activeTab, setActiveTab] = useState('matrix');

  // Preset Selection for Matrix Mode
  const [currentPresetKey, setCurrentPresetKey] = useState('objectAdded');

  // Matrices for Scene 1 (A) and Scene 2 (B)
  const [matrixA, setMatrixA] = useState(CHANGE_PRESETS.objectAdded.matrixA);
  const [matrixB, setMatrixB] = useState(CHANGE_PRESETS.objectAdded.matrixB);

  // Threshold T for change detection
  const [threshold, setThreshold] = useState(25);

  // Sensor Noise Level: 0 (clean), 4 (subtle), 10 (heavy)
  const [noiseLevel, setNoiseLevel] = useState(0);

  // Card 4 View: 'diffMask' (Binary Mask 1/0), 'highlight' (Overlay Scene B), 'signed' (B - A with + / -)
  const [card4View, setCard4View] = useState('diffMask');

  // Synchronized hovered cell: { row, col, x, y }
  const [hoveredCell, setHoveredCell] = useState(null);

  // -------------------------------------------------------------
  // Custom Photo Lab State
  // -------------------------------------------------------------
  const [photoA, setPhotoA] = useState(null);
  const [photoB, setPhotoB] = useState(null);
  const [photoLabResolution, setPhotoLabResolution] = useState(8); // 8x8 or 16x16
  const [photoMatrixA, setPhotoMatrixA] = useState(null);
  const [photoMatrixB, setPhotoMatrixB] = useState(null);
  const [photoThreshold, setPhotoThreshold] = useState(30);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStep, setCameraStep] = useState(1);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const fileInputRefA = useRef(null);
  const fileInputRefB = useRef(null);

  // Apply deterministic sensor noise to matrix B if enabled
  const noisyMatrixB = useMemo(() => {
    if (noiseLevel === 0) return matrixB;
    return matrixB.map((row, r) =>
      row.map((val, c) => {
        const jitter = Math.sin((r + 1) * 3.7 + (c + 2) * 5.3) * noiseLevel;
        return clampPixel(val + Math.round(jitter));
      })
    );
  }, [matrixB, noiseLevel]);

  // Difference Matrix D = |A - B|
  const matrixD = useMemo(() => {
    return subtractMatrices(matrixA, noisyMatrixB, true);
  }, [matrixA, noisyMatrixB]);

  // Binary Change Mask M = 1 if D > T, else 0
  const matrixM = useMemo(() => {
    return thresholdMatrix(matrixD, threshold, 1);
  }, [matrixD, threshold]);

  // Change Detection Intelligence & Statistics
  const changeAnalysis = useMemo(() => {
    const rows = matrixA.length;
    const cols = matrixA[0].length;
    let changedCount = 0;
    let totalPixels = rows * cols;
    let posDeltaCount = 0;
    let negDeltaCount = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const delta = matrixD[r][c];
        if (delta > threshold) {
          changedCount++;
          const signed = noisyMatrixB[r][c] - matrixA[r][c];
          if (signed > 0) posDeltaCount++;
          else if (signed < 0) negDeltaCount++;
        }
      }
    }

    let classification = 'No Significant Change';
    let classBadge = 'Static';

    if (changedCount > 0) {
      if (posDeltaCount > 0 && negDeltaCount > 0) {
        classification = 'Object Moved (Displacement)';
        classBadge = '⇄ Moved / Motion';
      } else if (posDeltaCount >= negDeltaCount) {
        classification = 'Object Added (Brightness Gain)';
        classBadge = '+ Object Added';
      } else {
        classification = 'Object Removed (Returned to BG)';
        classBadge = '− Object Removed';
      }
    }

    const pctChanged = ((changedCount / totalPixels) * 100).toFixed(0);

    return {
      changedCount,
      totalPixels,
      pctChanged,
      classification,
      classBadge
    };
  }, [matrixA, noisyMatrixB, matrixD, threshold]);

  // Handle cell value change in Scene 1 (A)
  const handleCellChangeA = (r, c, val) => {
    const next = matrixA.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixA(next);
  };

  // Handle cell value change in Scene 2 (B)
  const handleCellChangeB = (r, c, val) => {
    const next = matrixB.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixB(next);
  };

  // Preset Selection
  const handleSelectPreset = (key) => {
    setCurrentPresetKey(key);
    const p = CHANGE_PRESETS[key];
    setMatrixA(p.matrixA.map(row => [...row]));
    setMatrixB(p.matrixB.map(row => [...row]));
    setThreshold(p.defaultT);
  };

  // Reset to default preset
  const handleReset = () => {
    handleSelectPreset(currentPresetKey);
    setNoiseLevel(0);
  };

  // Swap Scene A and Scene B
  const handleSwapScenes = () => {
    const tempA = matrixA.map(row => [...row]);
    setMatrixA(matrixB.map(row => [...row]));
    setMatrixB(tempA);
  };

  // Randomize Scene and altered object with realistic medium-tone background
  const handleRandomize = () => {
    const rows = 4;
    const cols = 4;
    const bgBase = Math.floor(Math.random() * 35) + 125; // 125 to 160
    const newA = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => bgBase + Math.floor(Math.random() * 10) - 5)
    );
    const newB = newA.map(row => [...row]);

    const type = Math.floor(Math.random() * 3);
    const startR = Math.floor(Math.random() * 2);
    const startC = Math.floor(Math.random() * 2);

    if (type === 0) {
      // Added
      for (let r = startR; r < startR + 2; r++) {
        for (let c = startC; c < startC + 2; c++) {
          newB[r][c] = Math.min(255, bgBase + 85 + Math.floor(Math.random() * 25));
        }
      }
    } else if (type === 1) {
      // Removed
      for (let r = startR; r < startR + 2; r++) {
        for (let c = startC; c < startC + 2; c++) {
          newA[r][c] = Math.min(255, bgBase + 85 + Math.floor(Math.random() * 25));
        }
      }
    } else {
      // Moved
      newA[0][0] = 240; newA[0][1] = 240;
      newA[1][0] = 240; newA[1][1] = 240;
      newB[2][2] = 240; newB[2][3] = 240;
      newB[3][2] = 240; newB[3][3] = 240;
    }

    setMatrixA(newA);
    setMatrixB(newB);
  };

  // Hovered Info
  const hoveredInfo = useMemo(() => {
    if (!hoveredCell) return null;
    const { row, col } = hoveredCell;
    const valA = matrixA[row]?.[col] ?? 0;
    const valB = noisyMatrixB[row]?.[col] ?? 0;
    const valD = matrixD[row]?.[col] ?? 0;
    const isAboveT = valD > threshold;
    const signedDiff = valB - valA;

    return { row, col, valA, valB, valD, isAboveT, signedDiff };
  }, [hoveredCell, matrixA, noisyMatrixB, matrixD, threshold]);

  // -----------------------------------------------------------------
  // Photo Lab: Convert image file/data to downsampled matrix
  // -----------------------------------------------------------------
  const processImageToMatrix = (imageSrc, targetSize) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetSize, targetSize);
        const imgData = ctx.getImageData(0, 0, targetSize, targetSize).data;

        const mat = [];
        for (let r = 0; r < targetSize; r++) {
          const row = [];
          for (let c = 0; c < targetSize; c++) {
            const idx = (r * targetSize + c) * 4;
            const red = imgData[idx];
            const green = imgData[idx + 1];
            const blue = imgData[idx + 2];
            const gray = clampPixel(0.299 * red + 0.587 * green + 0.114 * blue);
            row.push(gray);
          }
          mat.push(row);
        }
        resolve(mat);
      };
      img.src = imageSrc;
    });
  };

  const handleFileUpload = (e, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (slot === 'A') {
        setPhotoA(dataUrl);
        const mat = await processImageToMatrix(dataUrl, photoLabResolution);
        setPhotoMatrixA(mat);
      } else {
        setPhotoB(dataUrl);
        const mat = await processImageToMatrix(dataUrl, photoLabResolution);
        setPhotoMatrixB(mat);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadSamplePhotos = async (scenarioType) => {
    const createSampleCanvas = (hasObject, isMoved) => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');

      // Light wood desk texture with balanced contrast
      ctx.fillStyle = '#C8B097';
      ctx.fillRect(0, 0, 160, 160);
      ctx.fillStyle = '#B8A087';
      for (let i = 0; i < 160; i += 20) {
        ctx.fillRect(0, i, 160, 10);
      }

      if (hasObject) {
        const objX = isMoved ? 115 : 45;
        const objY = isMoved ? 110 : 45;
        ctx.beginPath();
        ctx.arc(objX, objY, 26, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(objX, objY, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#423326';
        ctx.fill();
      }

      return canvas.toDataURL('image/png');
    };

    if (scenarioType === 'added') {
      const urlA = createSampleCanvas(false, false);
      const urlB = createSampleCanvas(true, false);
      setPhotoA(urlA);
      setPhotoB(urlB);
      const matA = await processImageToMatrix(urlA, photoLabResolution);
      const matB = await processImageToMatrix(urlB, photoLabResolution);
      setPhotoMatrixA(matA);
      setPhotoMatrixB(matB);
    } else if (scenarioType === 'removed') {
      const urlA = createSampleCanvas(true, false);
      const urlB = createSampleCanvas(false, false);
      setPhotoA(urlA);
      setPhotoB(urlB);
      const matA = await processImageToMatrix(urlA, photoLabResolution);
      const matB = await processImageToMatrix(urlB, photoLabResolution);
      setPhotoMatrixA(matA);
      setPhotoMatrixB(matB);
    } else {
      const urlA = createSampleCanvas(true, false);
      const urlB = createSampleCanvas(true, true);
      setPhotoA(urlA);
      setPhotoB(urlB);
      const matA = await processImageToMatrix(urlA, photoLabResolution);
      const matB = await processImageToMatrix(urlB, photoLabResolution);
      setPhotoMatrixA(matA);
      setPhotoMatrixB(matB);
    }
  };

  useEffect(() => {
    if (photoA) {
      processImageToMatrix(photoA, photoLabResolution).then(setPhotoMatrixA);
    }
    if (photoB) {
      processImageToMatrix(photoB, photoLabResolution).then(setPhotoMatrixB);
    }
  }, [photoLabResolution]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 320, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setCameraStep(1);
    } catch {
      setCameraError('Camera access denied or unavailable. You can still upload photos from disk!');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromCamera = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 160, 160);
    const dataUrl = canvas.toDataURL('image/jpeg');

    if (cameraStep === 1) {
      setPhotoA(dataUrl);
      const mat = await processImageToMatrix(dataUrl, photoLabResolution);
      setPhotoMatrixA(mat);
      setCameraStep(2);
    } else {
      setPhotoB(dataUrl);
      const mat = await processImageToMatrix(dataUrl, photoLabResolution);
      setPhotoMatrixB(mat);
      stopCamera();
    }
  };

  const photoMatrixD = useMemo(() => {
    if (!photoMatrixA || !photoMatrixB) return null;
    return subtractMatrices(photoMatrixA, photoMatrixB, true);
  }, [photoMatrixA, photoMatrixB]);

  const photoStats = useMemo(() => {
    if (!photoMatrixD) return null;
    let changed = 0;
    const total = photoMatrixD.length * photoMatrixD[0].length;
    for (let r = 0; r < photoMatrixD.length; r++) {
      for (let c = 0; c < photoMatrixD[0].length; c++) {
        if (photoMatrixD[r][c] > photoThreshold) changed++;
      }
    }
    return {
      changed,
      total,
      pct: ((changed / total) * 100).toFixed(0)
    };
  }, [photoMatrixD, photoThreshold]);

  return (
    <motion.div 
      className="step-module subtraction-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* STEP HEADER */}
      <div className="step-header-box">
        <h2 className="step-heading">Change Detection</h2>
        <p className="step-description">
          Take two photographs or matrices of the same scene: <strong>Scene 1 (A)</strong> and <strong>Scene 2 (B)</strong>. Compute the element-wise absolute difference <code>D = |A − B|</code> to isolate altered regions. Applying sensitivity threshold <strong>T</strong> creates a binary change mask: <strong>M(x, y) = 1 if D(x, y) &gt; T, else 0</strong>.
        </p>

        {/* Mode Switcher Tabs */}
        <div className="addition-mode-toggle" style={{ marginTop: '0.85rem' }}>
          <button
            type="button"
            className={`mode-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
          >
            <Grid size={14} />
            <span>Interactive Matrix Pipeline (4×4)</span>
          </button>
          <button
            type="button"
            className={`mode-btn ${activeTab === 'photoLab' ? 'active' : ''}`}
            onClick={() => setActiveTab('photoLab')}
          >
            <Camera size={14} />
            <span>Photo Change Detection Lab</span>
          </button>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <>
          {/* TOP CONTROLS CARD */}
          <div className="subtraction-controls-card">
            <div className="subtraction-controls-grid">
              
              {/* Part 1: Threshold Slider & Presets */}
              <div className="slider-group" style={{ marginBottom: 0 }}>
                <div className="threshold-label-row">
                  <div className="threshold-title-wrap">
                    <Filter size={15} style={{ color: 'var(--text-secondary)' }} />
                    <span>Change Sensitivity Threshold (T):</span>
                  </div>
                  <div className="threshold-val-wrap">
                    <span className="threshold-num-large font-mono">
                      {threshold}
                    </span>
                    <span className="threshold-formula-sub">
                      (|A − B| &gt; {threshold} ➔ Change 1)
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
                      Scenarios:
                    </span>
                    {Object.entries(CHANGE_PRESETS).map(([key, data]) => (
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
                      title="Generate random scene change"
                    >
                      <Shuffle size={13} />
                      <span>Random</span>
                    </button>
                    <button 
                      type="button"
                      className="icon-action-btn" 
                      onClick={handleSwapScenes}
                      title="Swap Scene A and Scene B"
                    >
                      <Move size={13} />
                      <span>Swap</span>
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
              {hoveredInfo ? (
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  Cell ({hoveredInfo.row + 1}, {hoveredInfo.col + 1}):{' '}
                  A = <strong>{hoveredInfo.valA}</strong> &minus; B = <strong>{hoveredInfo.valB}</strong> &rarr;{' '}
                  D = |{hoveredInfo.valA} &minus; {hoveredInfo.valB}| = <strong>{hoveredInfo.valD}</strong>{' '}
                  ({hoveredInfo.valD} {hoveredInfo.isAboveT ? '>' : '\u2264'} T={threshold}) &rarr;{' '}
                  <strong>M = {hoveredInfo.isAboveT ? `1 (Change Detected: ${hoveredInfo.signedDiff > 0 ? '+' : ''}${hoveredInfo.signedDiff})` : '0 (Static)'}</strong>
                </span>
              ) : (
                <span>
                  <strong>Threshold Logic:</strong> D(x, y) = |A(x, y) &minus; B(x, y)|. If D &gt; {threshold}, M(x, y) = 1 (Change Detected). Otherwise M(x, y) = 0 (Static). Hover any cell to inspect!
                </span>
              )}
            </div>
            {noiseLevel > 0 && (
              <span className="noise-alert-badge" title="Sensor noise alters unchanged background pixels">
                <AlertCircle size={12} />
                Noise Active: Sensor jitter (2&ndash;{noiseLevel})
              </span>
            )}
          </div>

          {/* =========================================================================
              THE 4-COLUMN HORIZONTAL LINE PIPELINE:
              SCENE 1 (A)  ➖  SCENE 2 (B)  🟰  DIFFERENCE (D)  ➔  CHANGE MASK (M)
              Identical to Visual Lab 09
             ========================================================================= */}
          <div className="subtraction-horizontal-line-container">
            
            {/* COLUMN 1: SCENE 1 (A) */}
            <div className="addition-column-card glass-level-2">
              <div className="matrix-header">
                <div className="matrix-header-title-row">
                  <h3 className="matrix-title-text">Scene 1 (A)</h3>
                </div>
                <div className="matrix-header-badge-wrap">
                  <span className="matrix-dims-badge">4 × 4</span>
                </div>
              </div>

              <div className="canvas-subrow">
                <PipelineCanvas
                  matrix={matrixA}
                  hoveredCell={hoveredCell}
                  onHoverCell={setHoveredCell}
                  pixelSize={20}
                  title="Scene 1 (Reference A)"
                />
                <div className="canvas-subrow-info">
                  <span className="subrow-label">Scene 1 (A)</span>
                  <span className="subrow-hint">Initial state before change</span>
                  <div className="subrow-actions">
                    <span className="badge-tag-mini">Editable</span>
                  </div>
                </div>
              </div>

              {/* 4x4 Numerical Matrix Grid */}
              <MatrixBracketWrapper onMouseLeave={() => setHoveredCell(null)}>
                {matrixA.map((row, i) =>
                  row.map((val, j) => (
                    <Step10EditableCell
                      key={`a-${i}-${j}`}
                      value={val}
                      row={i}
                      col={j}
                      isHovered={hoveredCell && hoveredCell.row === i && hoveredCell.col === j}
                      onChange={handleCellChangeA}
                      onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                    />
                  ))
                )}
              </MatrixBracketWrapper>

              <div className="matrix-footer-hint" style={{ marginTop: '0.45rem' }}>
                <span>Click to edit • Use ▲ ▼ keys</span>
              </div>
            </div>

            {/* OPERATOR 1: ➖ COMPARE */}
            <div className="addition-operator-divider">
              <div className="operator-badge" title="Subtract matrices element-by-element: [A - B]">
                <Minus size={18} strokeWidth={2.6} />
              </div>
              <span className="operator-label">Compare</span>
            </div>

            {/* COLUMN 2: SCENE 2 (B) */}
            <div className="addition-column-card glass-level-2">
              <div className="matrix-header">
                <div className="matrix-header-title-row">
                  <h3 className="matrix-title-text">Scene 2 (B)</h3>
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
                  title="Scene 2 (Modified B)"
                />
                <div className="canvas-subrow-info">
                  <span className="subrow-label">Scene 2 (B)</span>
                  <span className="subrow-hint">Object added, removed, or moved</span>
                  <div className="subrow-actions">
                    <span className="badge-tag-mini">Editable</span>
                  </div>
                </div>
              </div>

              {/* 4x4 Numerical Matrix Grid */}
              <MatrixBracketWrapper onMouseLeave={() => setHoveredCell(null)}>
                {noisyMatrixB.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    const isChanged = Math.abs(val - matrixA[i][j]) > threshold;
                    const badgeText = isChanged ? (val > matrixA[i][j] ? '+Δ' : '−Δ') : null;
                    return (
                      <Step10EditableCell
                        key={`b-${i}-${j}`}
                        value={val}
                        row={i}
                        col={j}
                        isHovered={isHovered}
                        isChanged={isChanged}
                        badgeText={badgeText}
                        onChange={handleCellChangeB}
                        onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                      />
                    );
                  })
                )}
              </MatrixBracketWrapper>

              <div className="matrix-footer-hint" style={{ marginTop: '0.45rem' }}>
                <span>{noiseLevel > 0 ? `±${noiseLevel} sensor noise active` : 'Click to edit scene 2'}</span>
              </div>
            </div>

            {/* OPERATOR 2: 🟰 SUBTRACT */}
            <div className="addition-operator-divider">
              <div className="operator-badge" title="Difference Matrix D = |A - B|">
                <Equal size={18} strokeWidth={2.6} />
              </div>
              <span className="operator-label">Difference</span>
            </div>

            {/* COLUMN 3: DIFFERENCE (D) */}
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
                  mode="diff"
                  threshold={threshold}
                  title="Difference Matrix Heatmap (D)"
                />
                <div className="canvas-subrow-info">
                  <span className="subrow-label">Delta |A − B|</span>
                  <span className="subrow-hint">Altered when D &gt; {threshold}</span>
                  <div className="subrow-actions">
                    <span className="badge-tag-mini">D = |A − B|</span>
                  </div>
                </div>
              </div>

              {/* 4x4 Numerical Matrix Grid */}
              <MatrixBracketWrapper onMouseLeave={() => setHoveredCell(null)}>
                {matrixD.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    const exceedsT = val > threshold;
                    const isNonZero = val > 0 && !exceedsT;
                    return (
                      <Step10ResultCell
                        key={`d-${i}-${j}`}
                        value={val}
                        row={i}
                        col={j}
                        isHovered={isHovered}
                        isHighlighted={exceedsT}
                        isNonZero={isNonZero}
                        badgeText={exceedsT ? '>T' : null}
                        onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                      />
                    );
                  })
                )}
              </MatrixBracketWrapper>

              <div className="matrix-footer-hint" style={{ marginTop: '0.45rem' }}>
                <span>Values &gt; {threshold} highlight altered pixels</span>
              </div>
            </div>

            {/* OPERATOR 3: ➔ HIGHLIGHT CHANGE */}
            <div className="addition-operator-divider">
              <div className="operator-badge" title={`Threshold Test: D(x, y) > ${threshold}`}>
                <Filter size={17} strokeWidth={2.5} />
              </div>
              <span className="operator-label">&gt; T({threshold})</span>
            </div>

            {/* COLUMN 4: CHANGE MASK (M) */}
            <div className="addition-column-card glass-level-2">
              <div className="matrix-header">
                <div className="matrix-header-title-row">
                  <h3 className="matrix-title-text">Change Mask (M)</h3>
                </div>
                <div className="matrix-header-badge-wrap">
                  <span className="matrix-dims-badge">4 × 4</span>
                </div>
              </div>

              <div className="canvas-subrow">
                <PipelineCanvas
                  matrix={card4View === 'diffMask' ? matrixM : noisyMatrixB}
                  matrixA={matrixA}
                  matrixB={noisyMatrixB}
                  hoveredCell={hoveredCell}
                  onHoverCell={setHoveredCell}
                  pixelSize={20}
                  mode={card4View === 'highlight' ? 'highlightOverlay' : card4View === 'diffMask' ? 'mask' : 'normal'}
                  threshold={threshold}
                  title="Highlighted Change Visualizer"
                />
                <div className="canvas-subrow-info">
                  <span className="subrow-label">
                    {changeAnalysis.classification}
                  </span>
                  <span className="subrow-hint">
                    {changeAnalysis.changedCount} / {changeAnalysis.totalPixels} cells altered ({changeAnalysis.pctChanged}%)
                  </span>
                  <div className="subrow-actions">
                    <div className="subrow-toggle-group">
                      <button
                        type="button"
                        className={`subrow-toggle-pill ${card4View === 'diffMask' ? 'active' : ''}`}
                        onClick={() => setCard4View('diffMask')}
                        title="View Binary Change Mask (1/0)"
                      >
                        Mask (M)
                      </button>
                      <button
                        type="button"
                        className={`subrow-toggle-pill ${card4View === 'highlight' ? 'active' : ''}`}
                        onClick={() => setCard4View('highlight')}
                        title="View Scene 2 with Highlight Overlay"
                      >
                        Overlay
                      </button>
                      <button
                        type="button"
                        className={`subrow-toggle-pill ${card4View === 'signed' ? 'active' : ''}`}
                        onClick={() => setCard4View('signed')}
                        title="View Signed Difference (B - A)"
                      >
                        Signed Δ
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4x4 Numerical Matrix Grid */}
              <MatrixBracketWrapper onMouseLeave={() => setHoveredCell(null)}>
                {card4View === 'diffMask' ? (
                  matrixM.map((row, i) =>
                    row.map((val, j) => {
                      const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                      const isChanged = val === 1;
                      return (
                        <Step10ResultCell
                          key={`m-${i}-${j}`}
                          value={val}
                          row={i}
                          col={j}
                          isHovered={isHovered}
                          isHighlighted={isChanged}
                          badgeText={isChanged ? 'CHG' : null}
                          onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                        />
                      );
                    })
                  )
                ) : card4View === 'signed' ? (
                  matrixD.map((row, i) =>
                    row.map((val, j) => {
                      const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                      const isChanged = val > threshold;
                      const signedVal = noisyMatrixB[i][j] - matrixA[i][j];
                      const displayVal = signedVal > 0 ? `+${signedVal}` : `${signedVal}`;
                      return (
                        <Step10ResultCell
                          key={`s-${i}-${j}`}
                          value={displayVal}
                          row={i}
                          col={j}
                          isHovered={isHovered}
                          isHighlighted={isChanged}
                          isNonZero={val > 0 && !isChanged}
                          badgeText={isChanged ? (signedVal > 0 ? '+Δ' : '−Δ') : null}
                          onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                        />
                      );
                    })
                  )
                ) : (
                  noisyMatrixB.map((row, i) =>
                    row.map((val, j) => {
                      const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                      const isChanged = matrixM[i][j] === 1;
                      return (
                        <Step10ResultCell
                          key={`ov-${i}-${j}`}
                          value={isChanged ? val : 0}
                          row={i}
                          col={j}
                          isHovered={isHovered}
                          isHighlighted={isChanged}
                          badgeText={isChanged ? 'CHG' : null}
                          onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                        />
                      );
                    })
                  )
                )}
              </MatrixBracketWrapper>

              <div className="matrix-footer-hint" style={{ marginTop: '0.45rem' }}>
                <span>{card4View === 'diffMask' ? '1 = Altered Pixel (Mask M)' : card4View === 'signed' ? 'Signed Difference (B − A)' : 'Altered pixels extracted from B'}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* -------------------------------------------------------------
           CUSTOM PHOTO LAB (UPLOAD OR SNAP 2 PHOTOGRAPHS)
           ------------------------------------------------------------- */
        <div className="subtraction-controls-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Camera size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>Custom Photography Laboratory: Find What Changed</span>
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                Upload two photos or snap them with your webcam to watch matrix subtraction detect changes automatically!
              </p>
            </div>

            {/* Resolution selector for downsampled matrix */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Grid Resolution:</span>
              <div className="noise-pill-group">
                <button
                  type="button"
                  className={`noise-btn ${photoLabResolution === 8 ? 'active' : ''}`}
                  onClick={() => setPhotoLabResolution(8)}
                  title="8x8 Matrix (64 numerical cells)"
                >
                  8 × 8
                </button>
                <button
                  type="button"
                  className={`noise-btn ${photoLabResolution === 16 ? 'active' : ''}`}
                  onClick={() => setPhotoLabResolution(16)}
                  title="16x16 Matrix (256 numerical cells)"
                >
                  16 × 16
                </button>
              </div>
            </div>
          </div>

          {/* Quick Demo Sample Photo Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Demo Photos:</span>
            <button
              type="button"
              className="preset-btn mini-btn"
              onClick={() => loadSamplePhotos('added')}
              title="Desk without Coffee Mug ➔ Coffee Mug Added"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <PlusCircle size={13} style={{ color: 'var(--accent-primary)' }} />
              <span>Coffee Mug Added</span>
            </button>
            <button
              type="button"
              className="preset-btn mini-btn"
              onClick={() => loadSamplePhotos('removed')}
              title="Desk with Coffee Mug ➔ Coffee Mug Removed"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <MinusCircle size={13} style={{ color: 'var(--accent-primary)' }} />
              <span>Mug Removed</span>
            </button>
            <button
              type="button"
              className="preset-btn mini-btn"
              onClick={() => loadSamplePhotos('moved')}
              title="Mug shifted across the desk"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Move size={13} style={{ color: 'var(--accent-primary)' }} />
              <span>Mug Moved (Motion)</span>
            </button>

            {/* Webcam Button */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              {!isCameraActive ? (
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={startCamera}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Video size={13} />
                  <span>Use Webcam</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={stopCamera}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <VideoOff size={13} />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>
          </div>

          {/* Camera Error banner if any */}
          {cameraError && (
            <div style={{ padding: '0.65rem 0.85rem', background: 'var(--accent-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Active Webcam Streaming Card */}
          {isCameraActive && (
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative', width: '220px', height: '220px', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--border-color)', background: 'var(--bg-card)' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', textAlign: 'center', background: 'rgba(0,0,0,0.7)', padding: '4px', borderRadius: '6px', fontSize: '0.74rem', color: '#FFF', fontFamily: 'var(--font-mono)' }}>
                  {cameraStep === 1 ? 'Step 1: Snap Scene 1' : 'Step 2: Move an item & Snap Scene 2!'}
                </div>
              </div>
              <button
                type="button"
                className="preset-btn mini-btn"
                onClick={capturePhotoFromCamera}
                style={{ padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
              >
                <Camera size={15} />
                <span>{cameraStep === 1 ? 'Capture Photo 1 (Reference)' : 'Capture Photo 2 (After Change)'}</span>
              </button>
            </div>
          )}

          {/* PHOTO SLOTS: PHOTO 1 & PHOTO 2 UPLOAD TILES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            
            {/* Slot A: Photo 1 */}
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>Photo 1 (Scene A - Before)</span>
              
              {photoA ? (
                <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={photoA} alt="Photo 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '140px', height: '140px', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                  <ImageIcon size={26} />
                  <span style={{ fontSize: '0.72rem' }}>No Photo Selected</span>
                </div>
              )}

              <input 
                ref={fileInputRefA}
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileUpload(e, 'A')}
              />
              <button
                type="button"
                className="preset-btn mini-btn"
                onClick={() => fileInputRefA.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Upload size={13} />
                <span>Upload Photo 1</span>
              </button>
            </div>

            {/* Slot B: Photo 2 */}
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>Photo 2 (Scene B - After)</span>
              
              {photoB ? (
                <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={photoB} alt="Photo 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '140px', height: '140px', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                  <ImageIcon size={26} />
                  <span style={{ fontSize: '0.72rem' }}>No Photo Selected</span>
                </div>
              )}

              <input 
                ref={fileInputRefB}
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileUpload(e, 'B')}
              />
              <button
                type="button"
                className="preset-btn mini-btn"
                onClick={() => fileInputRefB.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Upload size={13} />
                <span>Upload Photo 2</span>
              </button>
            </div>
          </div>

          {/* Photo Difference Results Pipeline */}
          {photoMatrixA && photoMatrixB && photoMatrixD ? (
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Live Matrix Difference: D = |A − B| ({photoLabResolution}×{photoLabResolution} Grid)
                </span>
                
                {/* Threshold Slider for Photos */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Filter Threshold:</span>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={photoThreshold}
                    onChange={(e) => setPhotoThreshold(parseInt(e.target.value, 10))}
                    style={{ width: '90px' }}
                  />
                  <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700 }}>
                    {photoThreshold}
                  </span>
                </div>
              </div>

              {/* 4 Pipeline Canvases for Photos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1rem', alignItems: 'center' }}>
                
                {/* Canvas 1: Photo Matrix A */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Photo Matrix A</span>
                  <PipelineCanvas
                    matrix={photoMatrixA}
                    pixelSize={photoLabResolution === 8 ? 16 : 8}
                    title="Photo A Grayscale Matrix"
                  />
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>−</div>

                {/* Canvas 2: Photo Matrix B */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Photo Matrix B</span>
                  <PipelineCanvas
                    matrix={photoMatrixB}
                    pixelSize={photoLabResolution === 8 ? 16 : 8}
                    title="Photo B Grayscale Matrix"
                  />
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>=</div>

                {/* Canvas 3: Difference Matrix D */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Difference (D)</span>
                  <PipelineCanvas
                    matrix={photoMatrixD}
                    pixelSize={photoLabResolution === 8 ? 16 : 8}
                    mode="diff"
                    threshold={photoThreshold}
                    title="Photo Difference Heatmap"
                  />
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>➔</div>

                {/* Canvas 4: Highlight Changes on Photo B */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Detected Change</span>
                  <PipelineCanvas
                    matrix={photoMatrixB}
                    matrixA={photoMatrixA}
                    matrixB={photoMatrixB}
                    pixelSize={photoLabResolution === 8 ? 16 : 8}
                    mode="highlightOverlay"
                    threshold={photoThreshold}
                    title="Changes Highlighted on Photo B"
                  />
                </div>
              </div>

              {/* Detection Summary Banner */}
              {photoStats && (
                <div style={{ marginTop: '1rem', padding: '0.65rem 0.95rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)' }} />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        Change Detection Complete!
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Detected <strong>{photoStats.changed}</strong> changed matrix pixels out of {photoStats.total} ({photoStats.pct}% of scene).
                      </div>
                    </div>
                  </div>
                  <span className="badge-tag-mini" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>
                    {photoStats.pct}% Altered
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Choose a demo photo pair above or upload Photo 1 and Photo 2 to run change detection!
            </div>
          )}
        </div>
      )}

      {/* STANDARDIZED EDUCATIONAL DOCUMENTATION */}
      <div style={{ marginTop: '1.25rem' }}>
        <ModuleDocumentation stepNumber={10} />
      </div>

      <StepFooter stepNumber={10} onSelectStep={onSelectStep} />
    </motion.div>
  );
}
