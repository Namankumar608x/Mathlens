import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Minus, 
  Equal, 
  Filter, 
  Sparkles, 
  RotateCcw, 
  Shuffle, 
  ArrowRight,
  Camera, 
  Upload, 
  Video, 
  VideoOff, 
  Image as ImageIcon,
  Grid,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { clampPixel, createEmptyMatrix, invertMatrix } from '../core/mathEngine';
import StepFooter from '../components/layout/StepFooter';
import ModuleDocumentation from '../components/experiment/ModuleDocumentation';

// Presets representing diverse imagery for inversion with clear photographic contrast
const INVERSION_PRESETS = {
  handSkeleton: {
    id: 'handSkeleton',
    name: 'Hand Radiograph',
    category: 'Anatomy Silhouette',
    desc: 'Dense bone structure on soft tissue background. Inversion turns bone to radiopaque absorption and tissue to luminous exposure.',
    matrixA: [
      [125, 125, 125, 125],
      [125, 240, 240, 125],
      [125, 240, 240, 125],
      [125, 160, 160, 125]
    ]
  },
  botanicalLeaf: {
    id: 'botanicalLeaf',
    name: 'Botanical Leaf',
    category: 'Nature Structure',
    desc: 'Leaf structure with delicate veins and luminous blade edges.',
    matrixA: [
      [125, 230, 230, 125],
      [230, 135, 135, 230],
      [230, 135, 135, 230],
      [125, 230, 230, 125]
    ]
  },
  mechanicalGear: {
    id: 'mechanicalGear',
    name: 'Mechanical Gear',
    category: 'Engineering Part',
    desc: 'Machine cog with dark core and polished metallic teeth.',
    matrixA: [
      [235, 130, 130, 235],
      [130, 245, 245, 130],
      [130, 245, 245, 130],
      [235, 130, 130, 235]
    ]
  },
  contrastSteps: {
    id: 'contrastSteps',
    name: 'Gradient Steps',
    category: 'Mathematical Scale',
    desc: 'Pure mathematical step values showing explicit symmetrical flips across 127.5.',
    matrixA: [
      [30,   80, 130, 160],
      [175, 195, 215, 245],
      [245, 215, 195, 175],
      [160, 130,  80,  30]
    ]
  }
};

/**
 * Compact High-DPI Pipeline Canvas Component (Theme-Consistent Grayscale)
 * Eliminates solid black fills and uses theme-defined surfaces and accents
 */
function PipelineCanvas({
  matrix,
  hoveredCell,
  onHoverCell,
  pixelSize = 20,
  title,
  mode = 'normal', // 'normal', 'ceiling255', 'inverted', 'xray'
  inversionFactor = 1.0,
  matrixOriginal = null
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

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let val = matrix[r][c];

        if (mode === 'ceiling255') {
          // Peak White Ceiling: Clean white pixel
          ctx.fillStyle = '#FFFFFF';
        } else if (mode === 'xray') {
          // X-Ray Negative with dynamic blend factor k
          if (matrixOriginal) {
            const orig = matrixOriginal[r][c];
            const inv = 255 - orig;
            val = clampPixel(Math.round((1 - inversionFactor) * orig + inversionFactor * inv));
          }
          ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        } else {
          ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        }

        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);

        // Subtle tile borders (NO heavy or bright borders)
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

    ctx.restore();
  }, [matrix, hoveredCell, rows, cols, pixelSize, mode, inversionFactor, matrixOriginal]);

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
 * Matrix Bracket Wrapper - Clean brackets matching Step 8, 9, 10
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
 * Clean Editable Matrix Cell matching Step 8, 9, 10
 */
const Step11EditableCell = React.memo(function Step11EditableCell({
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
 * Result Matrix Cell (Read-Only) for Card 2 (255), Card 3 (A'), and Card 4 (X-Ray)
 */
const Step11ResultCell = React.memo(function Step11ResultCell({
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

export default function Step11ImageInversionXRay({ onSelectStep }) {
  // Active Tab: 'matrix' (4-Stage Pipeline) or 'photoLab' (Upload / Camera)
  const [activeTab, setActiveTab] = useState('matrix');

  // Selected Preset
  const [currentPresetKey, setCurrentPresetKey] = useState('handSkeleton');

  // Matrix A (Grayscale Intensity)
  const [matrixA, setMatrixA] = useState(INVERSION_PRESETS.handSkeleton.matrixA);

  // Inversion factor k in [0, 1] (Default 1.0 = Full 255 - A inversion)
  const [inversionFactor, setInversionFactor] = useState(1.0);

  // Card 4 View Toggle: 'negative' (A' = 255 - A), 'blend' ((1-k)A + k(255-A)), 'shift' (Symmetrical Delta)
  const [card4View, setCard4View] = useState('negative');

  // Synchronized hovered cell
  const [hoveredCell, setHoveredCell] = useState(null);

  // -------------------------------------------------------------
  // Custom Photo Lab State
  // -------------------------------------------------------------
  const [customPhotoUrl, setCustomPhotoUrl] = useState(null);
  const [photoResolution, setPhotoResolution] = useState(8);
  const [customMatrixA, setCustomMatrixA] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Matrix of uniform 255 ceiling
  const matrix255 = useMemo(() => {
    return Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => 255));
  }, []);

  // Inverted Matrix A' = 255 - A
  const matrixInverted = useMemo(() => {
    return invertMatrix(matrixA, 1.0);
  }, [matrixA]);

  // Dynamically blended Matrix = clamp((1 - k)A + k(255 - A))
  const matrixBlended = useMemo(() => {
    return invertMatrix(matrixA, inversionFactor);
  }, [matrixA, inversionFactor]);

  // Matrix editing handlers
  const handleCellChangeA = useCallback((r, c, val) => {
    setMatrixA(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = Math.min(255, Math.max(0, val));
      return next;
    });
  }, []);

  // Preset Selection
  const handleSelectPreset = useCallback((key) => {
    setCurrentPresetKey(key);
    const p = INVERSION_PRESETS[key];
    if (p) {
      setMatrixA(p.matrixA.map(row => [...row]));
      setInversionFactor(1.0);
    }
  }, []);

  // Reset to default preset values
  const handleReset = useCallback(() => {
    handleSelectPreset(currentPresetKey);
    setInversionFactor(1.0);
  }, [currentPresetKey, handleSelectPreset]);

  // Randomize values with pleasant medium-tone range
  const handleRandomize = useCallback(() => {
    const rows = 4;
    const cols = 4;
    const bgBase = Math.floor(Math.random() * 40) + 120;
    const rand = createEmptyMatrix(rows, cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rand[r][c] = bgBase + Math.floor(Math.random() * 20) - 10;
      }
    }
    // Add bright feature
    rand[1][1] = 240;
    rand[1][2] = 240;
    rand[2][1] = 240;
    rand[2][2] = 240;
    setMatrixA(rand);
  }, []);

  // Hovered Cell Info Calculation
  const hoveredInfo = useMemo(() => {
    if (!hoveredCell) return null;
    const { row, col } = hoveredCell;
    const origVal = matrixA[row]?.[col] ?? 0;
    const invertedVal = matrixInverted[row]?.[col] ?? (255 - origVal);

    let commentary = '';
    if (origVal < 60) {
      commentary = `Dark shadow (${origVal}) flips to luminous highlight (${invertedVal})`;
    } else if (origVal > 200) {
      commentary = `Bright highlight (${origVal}) flips to dense absorption (${invertedVal})`;
    } else if (Math.abs(origVal - 128) <= 15) {
      commentary = `Midtone gray (${origVal}) maps to (${invertedVal}) — near invariant midpoint`;
    } else {
      commentary = `Midtone (${origVal}) symmetrically mirrors across 127.5 to (${invertedVal})`;
    }

    return { row, col, origVal, invertedVal, commentary };
  }, [hoveredCell, matrixA, matrixInverted]);

  // -----------------------------------------------------------------
  // Custom Photo Processing
  // -----------------------------------------------------------------
  const processImageToGrayscaleMatrix = (imgSrc, size) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        const mat = [];
        for (let r = 0; r < size; r++) {
          const row = [];
          for (let c = 0; c < size; c++) {
            const idx = (r * size + c) * 4;
            const gray = clampPixel(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
            row.push(gray);
          }
          mat.push(row);
        }
        resolve(mat);
      };
      img.src = imgSrc;
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      setCustomPhotoUrl(dataUrl);
      const mat = await processImageToGrayscaleMatrix(dataUrl, photoResolution);
      setCustomMatrixA(mat);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      setCameraError('Camera access denied or unavailable. You can still upload images from your device.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const snapCameraPhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 180, 180);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCustomPhotoUrl(dataUrl);
    const mat = await processImageToGrayscaleMatrix(dataUrl, photoResolution);
    setCustomMatrixA(mat);
    stopCamera();
  };

  const loadDemoPhoto = async (type) => {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    if (type === 'hand') {
      ctx.fillStyle = '#C8B097';
      ctx.fillRect(0, 0, 180, 180);
      ctx.fillStyle = '#E5D6C5';
      ctx.beginPath();
      ctx.ellipse(90, 115, 45, 50, 0, 0, Math.PI * 2);
      ctx.fill();

      const fingerPositions = [55, 78, 102, 125];
      ctx.fillStyle = '#FFFFFF';
      fingerPositions.forEach(fx => {
        ctx.beginPath();
        ctx.roundRect(fx - 9, 30, 18, 70, 9);
        ctx.fill();
      });
    } else {
      ctx.fillStyle = '#C8B097';
      ctx.fillRect(0, 0, 180, 180);
      ctx.fillStyle = '#E5D6C5';
      ctx.beginPath();
      ctx.ellipse(90, 90, 35, 70, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(70, 150);
      ctx.lineTo(110, 30);
      ctx.stroke();
    }

    const dataUrl = canvas.toDataURL('image/png');
    setCustomPhotoUrl(dataUrl);
    const mat = await processImageToGrayscaleMatrix(dataUrl, photoResolution);
    setCustomMatrixA(mat);
  };

  useEffect(() => {
    if (customPhotoUrl) {
      processImageToGrayscaleMatrix(customPhotoUrl, photoResolution).then(setCustomMatrixA);
    }
  }, [photoResolution]);

  const customMatrixInverted = useMemo(() => {
    if (!customMatrixA) return null;
    return invertMatrix(customMatrixA, 1.0);
  }, [customMatrixA]);

  return (
    <motion.div 
      className="step-module subtraction-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* STEP HEADER */}
      <div className="step-header-box">
        <h2 className="step-heading">Image Inversion</h2>
        <p className="step-description">
          Invert 8-bit image matrices by subtracting each pixel from the maximum intensity ceiling: <code>A′ = 255 − A</code>. Optical absorption shadows flip into luminous highlights, while highlights become dark, revealing hidden internal structures like medical X-ray radiographs and photographic film negatives.
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
            <span>Photo Inversion Lab (Upload / Camera)</span>
          </button>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <>
          {/* TOP CONTROLS CARD */}
          <div className="subtraction-controls-card">
            <div className="subtraction-controls-grid">
              
              {/* Part 1: Inversion Blend Factor (k) Slider & Presets */}
              <div className="slider-group" style={{ marginBottom: 0 }}>
                <div className="threshold-label-row">
                  <div className="threshold-title-wrap">
                    <Filter size={15} style={{ color: 'var(--text-secondary)' }} />
                    <span>Inversion Blend Factor (k):</span>
                  </div>
                  <div className="threshold-val-wrap">
                    <span className="threshold-num-large font-mono">
                      {(inversionFactor * 100).toFixed(0)}%
                    </span>
                    <span className="threshold-formula-sub">
                      {inversionFactor === 1.0 ? '(A′ = 255 − A)' : inversionFactor === 0.0 ? '(Original A)' : `(k = ${inversionFactor.toFixed(2)})`}
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  className="slider-input"
                  min="0.0"
                  max="1.0"
                  step="0.01"
                  value={inversionFactor}
                  onChange={(e) => setInversionFactor(parseFloat(e.target.value))}
                  onInput={(e) => setInversionFactor(parseFloat(e.target.value))}
                  style={{ 
                    '--slider-pct': `${inversionFactor * 100}%`, 
                    '--slider-color': 'var(--text-primary)' 
                  }}
                  aria-label="Inversion blend factor slider"
                />

                {/* 5 Inversion Blend Presets */}
                <div className="threshold-presets-strip">
                  {[
                    { val: 0.0, label: '0% (Orig)' },
                    { val: 0.25, label: '25% Subtle' },
                    { val: 0.5, label: '50% Neutral' },
                    { val: 0.75, label: '75% Heavy' },
                    { val: 1.0, label: '100% Invert' }
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      className={`threshold-preset-pill ${inversionFactor === p.val ? 'active' : ''}`}
                      onClick={() => setInversionFactor(p.val)}
                      title={`Set blend factor to ${(p.val * 100).toFixed(0)}%`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Part 2: Presets & Action Buttons */}
              <div className="subtraction-right-controls">
                <div className="control-row-group">
                  <div className="presets-pill-group">
                    <span className="control-row-label-wrap" style={{ marginRight: '0.15rem' }}>
                      Subjects:
                    </span>
                    {Object.entries(INVERSION_PRESETS).map(([key, data]) => (
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
                      title="Generate random matrix values"
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
              {hoveredInfo ? (
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  Cell ({hoveredInfo.row + 1}, {hoveredInfo.col + 1}):{' '}
                  Original A = <strong>{hoveredInfo.origVal}</strong> &rarr;{' '}
                  Inverted A′ = 255 &minus; {hoveredInfo.origVal} = <strong>{hoveredInfo.invertedVal}</strong>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>({hoveredInfo.commentary})</span>
                </span>
              ) : (
                <span>
                  <strong>Inversion Rule:</strong> A′(x, y) = 255 &minus; A(x, y). Dark shadows (0) flip to luminous highlights (255); invariant midtone 128 maps to 127. Hover any cell to inspect!
                </span>
              )}
            </div>
          </div>

          {/* =========================================================================
              THE 4-COLUMN HORIZONTAL LINE PIPELINE:
              SCENE (A)  ➖  PEAK CEILING (255)  🟰  INVERTED MATRIX (A′)  ➔  X-RAY FILM
              Identical to Visual Labs 09 and 10
             ========================================================================= */}
          <div className="subtraction-horizontal-line-container">
            
            {/* COLUMN 1: SCENE IMAGE (A) */}
            <div className="addition-column-card glass-level-2">
              <div className="matrix-header">
                <div className="matrix-header-title-row">
                  <h3 className="matrix-title-text">Scene Image (A)</h3>
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
                  title="Original Scene Representation (A)"
                />
                <div className="canvas-subrow-info">
                  <span className="subrow-label">{INVERSION_PRESETS[currentPresetKey]?.name}</span>
                  <span className="subrow-hint">Luminance range [0, 255]</span>
                  <div className="subrow-actions">
                    <span className="badge-tag-mini">Editable</span>
                  </div>
                </div>
              </div>

              {/* 4x4 Numerical Matrix Grid */}
              <MatrixBracketWrapper onMouseLeave={() => setHoveredCell(null)}>
                {matrixA.map((row, i) =>
                  row.map((val, j) => (
                    <Step11EditableCell
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

            {/* OPERATOR 1: ➖ SUBTRACT */}
            <div className="addition-operator-divider">
              <div className="operator-badge" title="Subtract from peak ceiling: 255 - A">
                <Minus size={18} strokeWidth={2.6} />
              </div>
              <span className="operator-label">255 − A</span>
            </div>

            {/* COLUMN 2: PEAK WHITE CEILING (255) */}
            <div className="addition-column-card glass-level-2">
              <div className="matrix-header">
                <div className="matrix-header-title-row">
                  <h3 className="matrix-title-text">Peak White (255)</h3>
                </div>
                <div className="matrix-header-badge-wrap">
                  <span className="matrix-dims-badge">4 × 4</span>
                </div>
              </div>

              <div className="canvas-subrow">
                <PipelineCanvas
                  matrix={matrix255}
                  hoveredCell={hoveredCell}
                  onHoverCell={setHoveredCell}
                  pixelSize={20}
                  mode="ceiling255"
                  title="Peak White 8-Bit Dynamic Ceiling"
                />
                <div className="canvas-subrow-info">
                  <span className="subrow-label">Reference Matrix</span>
                  <span className="subrow-hint">Full-scale ceiling ceiling 255</span>
                  <div className="subrow-actions">
                    <span className="badge-tag-mini">Ceiling</span>
                  </div>
                </div>
              </div>

              {/* 4x4 Numerical Matrix Grid */}
              <MatrixBracketWrapper onMouseLeave={() => setHoveredCell(null)}>
                {matrix255.map((row, i) =>
                  row.map((val, j) => (
                    <Step11ResultCell
                      key={`max-${i}-${j}`}
                      value={val}
                      row={i}
                      col={j}
                      isHovered={hoveredCell && hoveredCell.row === i && hoveredCell.col === j}
                      onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                    />
                  ))
                )}
              </MatrixBracketWrapper>

              <div className="matrix-footer-hint" style={{ marginTop: '0.45rem' }}>
                <span>Uniform 8-bit dynamic ceiling</span>
              </div>
            </div>

            {/* OPERATOR 2: 🟰 RESULT */}
            <div className="addition-operator-divider">
              <div className="operator-badge" title="Result of inversion: A′ = 255 - A">
                <Equal size={18} strokeWidth={2.6} />
              </div>
              <span className="operator-label">Invert</span>
            </div>

            {/* COLUMN 3: INVERTED MATRIX (A′) */}
            <div className="addition-column-card glass-level-2">
              <div className="matrix-header">
                <div className="matrix-header-title-row">
                  <h3 className="matrix-title-text">Inverted Matrix (A′)</h3>
                </div>
                <div className="matrix-header-badge-wrap">
                  <span className="matrix-dims-badge">4 × 4</span>
                </div>
              </div>

              <div className="canvas-subrow">
                <PipelineCanvas
                  matrix={matrixInverted}
                  hoveredCell={hoveredCell}
                  onHoverCell={setHoveredCell}
                  pixelSize={20}
                  title="Inverted Pixel Matrix A′"
                />
                <div className="canvas-subrow-info">
                  <span className="subrow-label">A′ = 255 − A</span>
                  <span className="subrow-hint">0 ⇄ 255 Symmetrical Flip</span>
                  <div className="subrow-actions">
                    <span className="badge-tag-mini">A′ = 255 − A</span>
                  </div>
                </div>
              </div>

              {/* 4x4 Numerical Matrix Grid */}
              <MatrixBracketWrapper onMouseLeave={() => setHoveredCell(null)}>
                {matrixInverted.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    const origVal = matrixA[i][j];
                    const isSignificantShadow = origVal < 60;
                    const isSignificantHighlight = origVal > 200;
                    const badgeText = isSignificantShadow ? 'LUM' : isSignificantHighlight ? 'ABS' : null;
                    return (
                      <Step11ResultCell
                        key={`inv-${i}-${j}`}
                        value={val}
                        row={i}
                        col={j}
                        isHovered={isHovered}
                        isHighlighted={isSignificantShadow || isSignificantHighlight}
                        badgeText={badgeText}
                        onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                      />
                    );
                  })
                )}
              </MatrixBracketWrapper>

              <div className="matrix-footer-hint" style={{ marginTop: '0.45rem' }}>
                <span>Dark shadows become luminous highlights</span>
              </div>
            </div>

            {/* OPERATOR 3: ➔ X-RAY OUTPUT */}
            <div className="addition-operator-divider">
              <div className="operator-badge" title="Dynamic radiographic blend factor">
                <ArrowRight size={17} strokeWidth={2.5} />
              </div>
              <span className="operator-label">k = {(inversionFactor * 100).toFixed(0)}%</span>
            </div>

            {/* COLUMN 4: X-RAY FILM OUTPUT */}
            <div className="addition-column-card glass-level-2">
              <div className="matrix-header">
                <div className="matrix-header-title-row">
                  <h3 className="matrix-title-text">X-Ray Output</h3>
                </div>
                <div className="matrix-header-badge-wrap">
                  <span className="matrix-dims-badge">Film</span>
                </div>
              </div>

              <div className="canvas-subrow">
                <PipelineCanvas
                  matrix={card4View === 'blend' ? matrixBlended : matrixInverted}
                  matrixOriginal={matrixA}
                  inversionFactor={inversionFactor}
                  mode="xray"
                  hoveredCell={hoveredCell}
                  onHoverCell={setHoveredCell}
                  pixelSize={20}
                  title="Inverted Negative Visual Output"
                />
                <div className="canvas-subrow-info">
                  <span className="subrow-label">
                    Radiographic Film
                  </span>
                  <span className="subrow-hint">
                    Tonal negative radiograph
                  </span>
                  <div className="subrow-actions">
                    <div className="subrow-toggle-group">
                      <button
                        type="button"
                        className={`subrow-toggle-pill ${card4View === 'negative' ? 'active' : ''}`}
                        onClick={() => setCard4View('negative')}
                        title="Pure Inverted Matrix (255 - A)"
                      >
                        Film (A′)
                      </button>
                      <button
                        type="button"
                        className={`subrow-toggle-pill ${card4View === 'blend' ? 'active' : ''}`}
                        onClick={() => setCard4View('blend')}
                        title="Dynamic Blend with Factor k"
                      >
                        Blend (k)
                      </button>
                      <button
                        type="button"
                        className={`subrow-toggle-pill ${card4View === 'shift' ? 'active' : ''}`}
                        onClick={() => setCard4View('shift')}
                        title="Symmetrical Midpoint Delta"
                      >
                        Shift Δ
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4x4 Numerical Matrix Grid */}
              <MatrixBracketWrapper onMouseLeave={() => setHoveredCell(null)}>
                {card4View === 'blend' ? (
                  matrixBlended.map((row, i) =>
                    row.map((val, j) => {
                      const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                      return (
                        <Step11ResultCell
                          key={`bl-${i}-${j}`}
                          value={val}
                          row={i}
                          col={j}
                          isHovered={isHovered}
                          onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                        />
                      );
                    })
                  )
                ) : card4View === 'shift' ? (
                  matrixA.map((row, i) =>
                    row.map((origVal, j) => {
                      const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                      const delta = 127.5 - origVal;
                      const displayVal = delta > 0 ? `+${Math.round(delta)}` : `${Math.round(delta)}`;
                      return (
                        <Step11ResultCell
                          key={`sh-${i}-${j}`}
                          value={displayVal}
                          row={i}
                          col={j}
                          isHovered={isHovered}
                          badgeText={delta !== 0 ? 'Δ' : '0'}
                          onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                        />
                      );
                    })
                  )
                ) : (
                  matrixInverted.map((row, i) =>
                    row.map((val, j) => {
                      const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                      const origVal = matrixA[i][j];
                      const isSignificantShadow = origVal < 60;
                      const isSignificantHighlight = origVal > 200;
                      const badgeText = isSignificantShadow ? 'LUM' : isSignificantHighlight ? 'ABS' : null;
                      return (
                        <Step11ResultCell
                          key={`out-${i}-${j}`}
                          value={val}
                          row={i}
                          col={j}
                          isHovered={isHovered}
                          isHighlighted={isSignificantShadow || isSignificantHighlight}
                          badgeText={badgeText}
                          onHover={(e) => setHoveredCell({ row: i, col: j, x: e?.clientX, y: e?.clientY })}
                        />
                      );
                    })
                  )
                )}
              </MatrixBracketWrapper>

              <div className="matrix-footer-hint" style={{ marginTop: '0.45rem' }}>
                <span>Photographic negative &amp; medical X-Ray density</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* -------------------------------------------------------------
           CUSTOM PHOTO INVERSION LABORATORY (UPLOAD OR SNAP)
           ------------------------------------------------------------- */
        <div className="subtraction-controls-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Camera size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>Custom Photography Laboratory: Image Inversion &amp; X-Ray</span>
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                Upload an image or capture with your webcam to watch matrix inversion reveal radiograph negatives!
              </p>
            </div>

            {/* Resolution selector for downsampled matrix */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Grid Resolution:</span>
              <div className="noise-pill-group">
                <button
                  type="button"
                  className={`noise-btn ${photoResolution === 8 ? 'active' : ''}`}
                  onClick={() => setPhotoResolution(8)}
                  title="8x8 Matrix (64 numerical cells)"
                >
                  8 × 8
                </button>
                <button
                  type="button"
                  className={`noise-btn ${photoResolution === 16 ? 'active' : ''}`}
                  onClick={() => setPhotoResolution(16)}
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
              onClick={() => loadDemoPhoto('hand')}
              title="Hand Anatomy Radiograph"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>Hand Radiograph</span>
            </button>
            <button
              type="button"
              className="preset-btn mini-btn"
              onClick={() => loadDemoPhoto('leaf')}
              title="Botanical Leaf Veins"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>Botanical Leaf</span>
            </button>

            {/* Webcam Button */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Upload size={13} />
                <span>Upload Image</span>
              </button>

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
                  Snap photo to invert
                </div>
              </div>
              <button
                type="button"
                className="preset-btn mini-btn"
                onClick={snapCameraPhoto}
                style={{ padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
              >
                <Camera size={15} />
                <span>Capture &amp; Invert Photo</span>
              </button>
            </div>
          )}

          {/* RESULTS COMPARISON DISPLAY */}
          {customMatrixA && customMatrixInverted ? (
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Photo Inversion Pipeline: Source ➔ Grayscale Matrix A ➔ Inverted Matrix A′ ➔ Negative Visual
              </div>

              {/* 4 Canvases for Custom Photo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
                {/* 1. Original Uploaded Photo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>1. Source Photo</span>
                  <div style={{ width: '110px', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={customPhotoUrl} alt="Original source" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>➔</div>

                {/* 2. Grayscale Matrix A */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>2. Grayscale Matrix A</span>
                  <PipelineCanvas
                    matrix={customMatrixA}
                    pixelSize={photoResolution === 8 ? 14 : 7}
                    title="Grayscale Matrix A"
                  />
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>➔</div>

                {/* 3. Inverted Matrix A' */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>3. Inverted Matrix A′</span>
                  <PipelineCanvas
                    matrix={customMatrixInverted}
                    pixelSize={photoResolution === 8 ? 14 : 7}
                    title="Inverted Matrix A′"
                  />
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>➔</div>

                {/* 4. Inverted Negative Output */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>4. Inverted Negative</span>
                  <PipelineCanvas
                    matrix={customMatrixInverted}
                    pixelSize={photoResolution === 8 ? 14 : 7}
                    title="Inverted Negative Visual Output"
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.65rem 0.95rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                      Inversion Processing Complete!
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      All {customMatrixA.length * customMatrixA[0].length} pixels inverted: A′ = 255 − A. Dark shadows are now luminous highlights.
                    </div>
                  </div>
                </div>
                <span className="badge-tag-mini" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>
                  100% Inverted
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Choose a demo subject above or upload a photo to inspect custom matrix inversion!
            </div>
          )}
        </div>
      )}

      {/* STANDARDIZED EDUCATIONAL DOCUMENTATION */}
      <div style={{ marginTop: '1.25rem' }}>
        <ModuleDocumentation stepNumber={11} />
      </div>

      <StepFooter stepNumber={11} onSelectStep={onSelectStep} />
    </motion.div>
  );
}
