import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Grid,
  Sun,
  ArrowLeftRight,
  Equal,
  Upload,
  CheckCircle2,
  Sparkles,
  Sliders,
  HelpCircle,
  ImageIcon
} from 'lucide-react';
import {
  createEmptyMatrix,
  clampPixel,
  multiplyMatrices,
  hadamardProduct,
  hadamardDivision,
  normalizeMatrixForDisplay
} from '../core/mathEngine';
import StepFooter from '../components/layout/StepFooter';
import ModuleDocumentation from '../components/experiment/ModuleDocumentation';

// Presets for 4x4 Matrices
const MULTIPLICATION_PRESETS = {
  gradients: {
    name: 'Gradients (H vs V)',
    desc: 'Horizontal gradient in A against vertical in B',
    matrixA: [
      [30, 80, 140, 200],
      [30, 80, 140, 200],
      [30, 80, 140, 200],
      [30, 80, 140, 200]
    ],
    matrixB: [
      [30, 30, 30, 30],
      [80, 80, 80, 80],
      [140, 140, 140, 140],
      [200, 200, 200, 200]
    ]
  },
  crossAndFrame: {
    name: 'Cross & Frame',
    desc: 'Center plus sign in A with outer frame in B',
    matrixA: [
      [20, 220, 220, 20],
      [220, 220, 220, 220],
      [220, 220, 220, 220],
      [20, 220, 220, 20]
    ],
    matrixB: [
      [240, 240, 240, 240],
      [240, 20, 20, 240],
      [240, 20, 20, 240],
      [240, 240, 240, 240]
    ]
  },
  checkerboard: {
    name: 'Checker & Stripes',
    desc: 'Alternating tiles in A and column stripes in B',
    matrixA: [
      [230, 25, 230, 25],
      [25, 230, 25, 230],
      [230, 25, 230, 25],
      [25, 230, 25, 230]
    ],
    matrixB: [
      [220, 220, 30, 30],
      [220, 220, 30, 30],
      [220, 220, 30, 30],
      [220, 220, 30, 30]
    ]
  },
  identityB: {
    name: 'Identity Matrix I',
    desc: 'Commuting test case: AI = IA = A',
    matrixA: [
      [45, 120, 190, 80],
      [200, 50, 110, 220],
      [90, 175, 40, 160],
      [130, 60, 240, 100]
    ],
    matrixB: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]
  },
  scalarMultiple: {
    name: 'Scalar Diagonal 2·I',
    desc: 'Commuting test case: AB = BA = 2·A',
    matrixA: [
      [30, 60, 90, 120],
      [40, 80, 120, 160],
      [50, 100, 150, 200],
      [60, 120, 180, 240]
    ],
    matrixB: [
      [2, 0, 0, 0],
      [0, 2, 0, 0],
      [0, 0, 2, 0],
      [0, 0, 0, 2]
    ]
  }
};

// Canvas renderer for a 4x4 matrix
function CanvasMatrix4x4({ matrix, size = 110, highlightRow = -1, highlightCol = -1, highlightCell = null, title = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix || matrix.length === 0) return;
    const ctx = canvas.getContext('2d');
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cellSize = size / cols;

    ctx.clearRect(0, 0, size, size);

    const isLight = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = clampPixel(matrix[r][c]);
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);

        // Grid borders
        ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);

        // Highlight active cell or row/col
        const isTargetCell = highlightCell && highlightCell.row === r && highlightCell.col === c;
        if (isTargetCell) {
          ctx.strokeStyle = isLight ? '#424F34' : '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(c * cellSize + 1.5, r * cellSize + 1.5, cellSize - 3, cellSize - 3);
          ctx.fillStyle = isLight ? 'rgba(105, 121, 81, 0.35)' : 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        } else if (r === highlightRow) {
          ctx.fillStyle = isLight ? 'rgba(105, 121, 81, 0.22)' : 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        } else if (c === highlightCol) {
          ctx.fillStyle = isLight ? 'rgba(105, 121, 81, 0.22)' : 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [matrix, size, highlightRow, highlightCol, highlightCell]);

  return (
    <div className="step15-canvas-wrap">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="step15-canvas"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
      {title && <span className="step15-canvas-label">{title}</span>}
    </div>
  );
}

// Procedural Botanical Flower Generator on HTML5 Canvas (Natural aesthetic, zero neon)
function drawFlowerOnCanvas(ctx, width, height) {
  // Rich botanical background
  const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width * 0.7);
  bgGrad.addColorStop(0, '#1E281F');
  bgGrad.addColorStop(1, '#0C130D');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Stems and leaves
  ctx.save();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#3E5C33';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(width / 2, height);
  ctx.quadraticCurveTo(width / 2 - 12, height * 0.72, width / 2, height * 0.52);
  ctx.stroke();

  // Leaf left
  ctx.fillStyle = '#4D733E';
  ctx.beginPath();
  ctx.ellipse(width * 0.34, height * 0.72, 28, 12, -Math.PI / 5, 0, Math.PI * 2);
  ctx.fill();

  // Leaf right
  ctx.fillStyle = '#5C854A';
  ctx.beginPath();
  ctx.ellipse(width * 0.66, height * 0.76, 26, 11, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // Flower petals (warm golden botanical tones)
  const cx = width / 2;
  const cy = height * 0.44;
  const numPetals = 12;
  const petalLength = width * 0.28;
  const petalWidth = width * 0.09;

  for (let i = 0; i < numPetals; i++) {
    const angle = (i * 2 * Math.PI) / numPetals;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, 0, -petalLength);
    grad.addColorStop(0, '#B37D22');
    grad.addColorStop(0.5, '#E2B23E');
    grad.addColorStop(1, '#F7D76B');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.ellipse(0, -petalLength / 2, petalWidth / 2, petalLength / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Inner petals layer
  for (let i = 0; i < numPetals; i++) {
    const angle = (i * 2 * Math.PI) / numPetals + Math.PI / numPetals;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, 0, -petalLength * 0.75);
    grad.addColorStop(0, '#946014');
    grad.addColorStop(0.6, '#D69E2E');
    grad.addColorStop(1, '#F9E282');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.ellipse(0, -petalLength * 0.38, petalWidth * 0.4, petalLength * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Textured seed center
  const centerGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, width * 0.1);
  centerGrad.addColorStop(0, '#5C3810');
  centerGrad.addColorStop(0.7, '#3A2006');
  centerGrad.addColorStop(1, '#241404');
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, width * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // Pollen specks
  ctx.fillStyle = '#D69E2E';
  for (let d = 0; d < 22; d++) {
    const r = (d % 4 + 1) * 4.5;
    const a = d * 1.37;
    ctx.fillRect(cx + r * Math.cos(a), cy + r * Math.sin(a), 1.5, 1.5);
  }

  ctx.restore();
}

export default function Step15MatrixMultiplicationShadows({ onSelectStep }) {
  // Main view tab: 'multiplication' | 'shadows'
  const [activeTab, setActiveTab] = useState('multiplication');

  // Multiplier state
  const [currentPresetKey, setCurrentPresetKey] = useState('gradients');
  const [matrixA, setMatrixA] = useState(MULTIPLICATION_PRESETS.gradients.matrixA);
  const [matrixB, setMatrixB] = useState(MULTIPLICATION_PRESETS.gradients.matrixB);

  // Selected cell for interactive dot-product breakdown: { row, col }
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });

  // Normalization mode for matrix multiplication image display: 'minmax' | 'clamp'
  const [normMode, setNormMode] = useState('minmax');

  // Multiplication calculated products
  const productAB = useMemo(() => {
    return multiplyMatrices(matrixA, matrixB);
  }, [matrixA, matrixB]);

  const productBA = useMemo(() => {
    return multiplyMatrices(matrixB, matrixA);
  }, [matrixA, matrixB]);

  // Display-normalized versions of AB and BA for canvas image representation
  const { normalizedMatrix: normAB, minVal: minAB, maxVal: maxAB } = useMemo(() => {
    return normalizeMatrixForDisplay(productAB, normMode);
  }, [productAB, normMode]);

  const { normalizedMatrix: normBA, minVal: minBA, maxVal: maxBA } = useMemo(() => {
    return normalizeMatrixForDisplay(productBA, normMode);
  }, [productBA, normMode]);

  // Difference Delta Matrix: |AB - BA|
  const diffMatrix = useMemo(() => {
    const rows = 4;
    const cols = 4;
    const diff = createEmptyMatrix(rows, cols);
    let totalDiff = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const delta = Math.abs(productAB[i][j] - productBA[i][j]);
        diff[i][j] = delta;
        totalDiff += delta;
      }
    }
    return { diff, totalDiff, isIdentical: totalDiff === 0 };
  }, [productAB, productBA]);

  // Detailed step-by-step dot product breakdown for selectedCell { row, col }
  const dotProductBreakdown = useMemo(() => {
    const { row, col } = selectedCell;
    const terms = [];
    let sum = 0;
    for (let k = 0; k < 4; k++) {
      const aVal = matrixA[row][k];
      const bVal = matrixB[k][col];
      const prod = aVal * bVal;
      sum += prod;
      terms.push({ k, aVal, bVal, prod });
    }
    return { row, col, terms, sum, normVal: normAB[row]?.[col] };
  }, [selectedCell, matrixA, matrixB, normAB]);

  // Handle Preset selection
  const handleSelectPreset = (key) => {
    setCurrentPresetKey(key);
    if (MULTIPLICATION_PRESETS[key]) {
      setMatrixA(MULTIPLICATION_PRESETS[key].matrixA.map(r => [...r]));
      setMatrixB(MULTIPLICATION_PRESETS[key].matrixB.map(r => [...r]));
    }
  };

  // Modify cell value in A or B
  const handleCellChange = (matrixKey, r, c, rawVal) => {
    const val = isNaN(rawVal) ? 0 : Math.max(0, Math.min(255, parseInt(rawVal, 10)));
    if (matrixKey === 'A') {
      setMatrixA(prev => {
        const next = prev.map(row => [...row]);
        next[r][c] = val;
        return next;
      });
    } else {
      setMatrixB(prev => {
        const next = prev.map(row => [...row]);
        next[r][c] = val;
        return next;
      });
    }
  };

  // Swap matrices A and B
  const handleSwapAandB = () => {
    const tempA = matrixA.map(r => [...r]);
    setMatrixA(matrixB.map(r => [...r]));
    setMatrixB(tempA);
  };

  // Load identity matrix into B
  const handleSetIdentityB = () => {
    handleSelectPreset('identityB');
  };

  // --- SHADOW MODULE STATE ---
  const [shadowPosition, setShadowPosition] = useState('right');
  const [shadowStrength, setShadowStrength] = useState(0.5);
  const [isShadowRemoved, setIsShadowRemoved] = useState(false);

  // 4x4 Shadow Matrix S
  const shadowMatrixS = useMemo(() => {
    const s = createEmptyMatrix(4, 4, 1.0);
    const factor = shadowStrength;

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (shadowPosition === 'right' && c >= 2) s[r][c] = factor;
        else if (shadowPosition === 'left' && c < 2) s[r][c] = factor;
        else if (shadowPosition === 'top' && r < 2) s[r][c] = factor;
        else if (shadowPosition === 'bottom' && r >= 2) s[r][c] = factor;
        else if (shadowPosition === 'vignette' && (r === 0 || r === 3 || c === 0 || c === 3)) s[r][c] = factor;
        else if (shadowPosition === 'diagonal' && r + c >= 3) s[r][c] = factor;
        else s[r][c] = 1.0;
      }
    }
    return s;
  }, [shadowPosition, shadowStrength]);

  // Shaded 4x4 image: B = A ⊙ S
  const shadedMatrixB = useMemo(() => {
    return hadamardProduct(matrixA, shadowMatrixS);
  }, [matrixA, shadowMatrixS]);

  // Recovered 4x4 image: A = B ⊘ S
  const recoveredMatrixA = useMemo(() => {
    return hadamardDivision(shadedMatrixB, shadowMatrixS);
  }, [shadedMatrixB, shadowMatrixS]);

  // --- REAL PHOTOGRAPH (FLOWER) STATE ---
  const flowerOriginalRef = useRef(null);
  const flowerShadedRef = useRef(null);
  const [flowerShadowRemoved, setFlowerShadowRemoved] = useState(false);
  const [flowerShadowStrength, setFlowerShadowStrength] = useState(0.5);
  const [flowerShadowRegion, setFlowerShadowRegion] = useState('right');
  const fileInputRef = useRef(null);

  // Render flower canvases
  useEffect(() => {
    const canvasOrig = flowerOriginalRef.current;
    const canvasShaded = flowerShadedRef.current;
    if (!canvasOrig || !canvasShaded) return;

    const w = 220;
    const h = 220;
    canvasOrig.width = w;
    canvasOrig.height = h;
    canvasShaded.width = w;
    canvasShaded.height = h;

    const ctxOrig = canvasOrig.getContext('2d');
    drawFlowerOnCanvas(ctxOrig, w, h);

    const ctxShaded = canvasShaded.getContext('2d');
    const imgData = ctxOrig.getImageData(0, 0, w, h);
    const data = imgData.data;

    const factor = flowerShadowStrength;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let inShadow = false;
        if (flowerShadowRegion === 'right' && x >= w / 2) inShadow = true;
        else if (flowerShadowRegion === 'left' && x < w / 2) inShadow = true;
        else if (flowerShadowRegion === 'diagonal' && x + y >= (w + h) / 2) inShadow = true;
        else if (flowerShadowRegion === 'vignette') {
          const dx = (x - w / 2) / (w / 2);
          const dy = (y - h / 2) / (h / 2);
          if (Math.sqrt(dx * dx + dy * dy) > 0.6) inShadow = true;
        }

        const idx = (y * w + x) * 4;
        const currentFactor = inShadow ? factor : 1.0;

        if (flowerShadowRemoved) {
          const rShaded = Math.round(data[idx] * currentFactor);
          const gShaded = Math.round(data[idx + 1] * currentFactor);
          const bShaded = Math.round(data[idx + 2] * currentFactor);

          data[idx] = clampPixel(currentFactor > 0 ? rShaded / currentFactor : rShaded);
          data[idx + 1] = clampPixel(currentFactor > 0 ? gShaded / currentFactor : gShaded);
          data[idx + 2] = clampPixel(currentFactor > 0 ? bShaded / currentFactor : bShaded);
        } else {
          data[idx] = clampPixel(data[idx] * currentFactor);
          data[idx + 1] = clampPixel(data[idx + 1] * currentFactor);
          data[idx + 2] = clampPixel(data[idx + 2] * currentFactor);
        }
      }
    }

    ctxShaded.putImageData(imgData, 0, 0);
  }, [flowerShadowStrength, flowerShadowRegion, flowerShadowRemoved]);

  const handleUploadFlower = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvasOrig = flowerOriginalRef.current;
        if (!canvasOrig) return;
        const ctx = canvasOrig.getContext('2d');
        ctx.drawImage(img, 0, 0, 220, 220);
        setFlowerShadowRemoved(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* 1. CLEAN COMPACT HEADER */}
      <div className="step-header-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <h2 className="step-heading" style={{ margin: 0 }}>
            Matrix Multiplication &amp; Optical Shadows
          </h2>
          <span className="badge-tag-mini" style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem' }}>
            Non-Commutative Product &amp; Optical Shadows
          </span>
        </div>

        <p className="step-description">
          Unlike scalar numbers where <code>a × b = b × a</code>, matrix multiplication combines rows and columns directionally:
          <strong> AB ≠ BA</strong>. Explore how pixel matrices interact under matrix multiplication, and contrast it with
          the element-wise <strong>Hadamard product (A ⊙ S)</strong> used to cast and mathematically recover optical shadows.
        </p>

        {/* TOP TAB SWITCHER */}
        <div className="step13-stage-nav" style={{ maxWidth: '480px', marginTop: '0.85rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('multiplication')}
            className={`step13-stage-btn ${activeTab === 'multiplication' ? 'active' : ''}`}
          >
            <Grid size={14} />
            <span>1. Matrix Multiplication (AB vs BA)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shadows')}
            className={`step13-stage-btn ${activeTab === 'shadows' ? 'active' : ''}`}
          >
            <Sun size={14} />
            <span>2. Optical Shadows (A ⊙ S)</span>
          </button>
        </div>
      </div>

      {activeTab === 'multiplication' ? (
        /* ==============================================================
           PART 1: 4x4 MATRIX MULTIPLICATION (A * B vs B * A)
           ============================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1.1rem' }}>
          {/* Card 1: Presets & Controls */}
          <div className="step15-card">
            <div className="step15-card-header">
              <div className="step15-card-title">
                <Sliders size={15} style={{ color: 'var(--text-secondary)' }} />
                <span>Preset Matrices</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button
                  type="button"
                  onClick={handleSwapAandB}
                  className="icon-action-btn"
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem' }}
                  title="Swap A and B"
                >
                  <ArrowLeftRight size={13} />
                  <span>Swap A ⇄ B</span>
                </button>
                <button
                  type="button"
                  onClick={handleSetIdentityB}
                  className="icon-action-btn"
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem' }}
                  title="Test Commuting Case: B = Identity Matrix"
                >
                  <Equal size={13} />
                  <span>Identity B (AI = IA = A)</span>
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="step15-presets-grid">
              {Object.entries(MULTIPLICATION_PRESETS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectPreset(key)}
                  className={`step15-preset-btn ${currentPresetKey === key ? 'active' : ''}`}
                >
                  <span className="step15-preset-title">{item.name}</span>
                  <span className="step15-preset-desc">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* DUAL INPUT MATRICES: IMAGE A & IMAGE B (SIDE BY SIDE) */}
          <div className="step15-grid-duo">
            {/* MATRIX A */}
            <div className="step15-card">
              <div className="step15-card-header">
                <div className="step15-card-title">
                  <span style={{ color: 'var(--accent-primary, #697951)' }}>Image A &amp; Matrix A</span>
                  <span className="badge-tag-mini" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                    4 × 4
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Row {selectedCell.row} active
                </span>
              </div>

              <div className="step15-body-row">
                <CanvasMatrix4x4
                  matrix={matrixA}
                  size={110}
                  highlightRow={selectedCell.row}
                  title="Canvas A"
                />

                <div className="step15-matrix-bracket-wrap">
                  <div className="step15-bracket-l" />
                  <div className="step15-matrix-grid-4x4">
                    {matrixA.map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`a-${r}-${c}`}
                          className={`step15-cell ${selectedCell.row === r ? 'active-row' : ''}`}
                        >
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={val}
                            onChange={(e) => handleCellChange('A', r, c, e.target.value)}
                            className="step15-cell-input"
                            aria-label={`A[${r},${c}]`}
                          />
                        </div>
                      ))
                    )}
                  </div>
                  <div className="step15-bracket-r" />
                </div>
              </div>
            </div>

            {/* MATRIX B */}
            <div className="step15-card">
              <div className="step15-card-header">
                <div className="step15-card-title">
                  <span style={{ color: 'var(--accent-primary, #697951)' }}>Image B &amp; Matrix B</span>
                  <span className="badge-tag-mini" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                    4 × 4
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Col {selectedCell.col} active
                </span>
              </div>

              <div className="step15-body-row">
                <CanvasMatrix4x4
                  matrix={matrixB}
                  size={110}
                  highlightCol={selectedCell.col}
                  title="Canvas B"
                />

                <div className="step15-matrix-bracket-wrap">
                  <div className="step15-bracket-l" />
                  <div className="step15-matrix-grid-4x4">
                    {matrixB.map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`b-${r}-${c}`}
                          className={`step15-cell ${selectedCell.col === c ? 'active-col' : ''}`}
                        >
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={val}
                            onChange={(e) => handleCellChange('B', r, c, e.target.value)}
                            className="step15-cell-input"
                            aria-label={`B[${r},${c}]`}
                          />
                        </div>
                      ))
                    )}
                  </div>
                  <div className="step15-bracket-r" />
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE ROW × COLUMN DOT-PRODUCT BREAKDOWN */}
          <div className="step15-dot-box">
            <div className="step15-dot-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} style={{ color: 'var(--accent-primary, #697951)' }} />
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                  Dot-Product Calculation for Element C[{dotProductBreakdown.row}, {dotProductBreakdown.col}]
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem' }}>Target Element:</span>
                <select
                  value={`${selectedCell.row}-${selectedCell.col}`}
                  onChange={(e) => {
                    const [r, c] = e.target.value.split('-').map(Number);
                    setSelectedCell({ row: r, col: c });
                  }}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '5px',
                    padding: '0.15rem 0.4rem',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                >
                  {[0, 1, 2, 3].map((r) =>
                    [0, 1, 2, 3].map((c) => (
                      <option key={`opt-${r}-${c}`} value={`${r}-${c}`}>
                        Row {r}, Col {c}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="step15-dot-formula">
              <span style={{ color: 'var(--text-muted)' }}>
                C[{dotProductBreakdown.row},{dotProductBreakdown.col}] = (Row {dotProductBreakdown.row} of A) · (Col {dotProductBreakdown.col} of B) =
              </span>
              {dotProductBreakdown.terms.map((t, idx) => (
                <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  <span>({t.aVal} × {t.bVal})</span>
                  {idx < 3 && <span style={{ color: 'var(--text-muted)' }}>+</span>}
                </span>
              ))}
              <span>=</span>
              {dotProductBreakdown.terms.map((t, idx) => (
                <span key={`val-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  <span>{t.prod}</span>
                  {idx < 3 && <span style={{ color: 'var(--text-muted)' }}>+</span>}
                </span>
              ))}
              <span>=</span>
              <span className="step15-dot-sum-badge">
                {dotProductBreakdown.sum}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>
                (Normalized display: {dotProductBreakdown.normVal})
              </span>
            </div>
          </div>

          {/* DUAL RESULTS: AB vs BA (SIDE BY SIDE) */}
          <div className="step15-card">
            <div className="step15-card-header">
              <div className="step15-card-title">
                <Equal size={15} style={{ color: 'var(--text-secondary)' }} />
                <span>Multiplication Results: AB vs Reverse BA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                <span>Display Scaling:</span>
                <select
                  value={normMode}
                  onChange={(e) => setNormMode(e.target.value)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '5px',
                    padding: '0.15rem 0.45rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.72rem',
                    outline: 'none'
                  }}
                >
                  <option value="minmax">Min-Max Scale [0, 255]</option>
                  <option value="clamp">Clamp to [0, 255]</option>
                </select>
              </div>
            </div>

            <div className="step15-grid-duo">
              {/* RESULT AB */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Product AB (Order: A · B)
                  </span>
                  <span style={{ fontSize: '0.70rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    Min: {minAB} | Max: {maxAB}
                  </span>
                </div>

                <div className="step15-body-row">
                  <CanvasMatrix4x4
                    matrix={normAB}
                    size={110}
                    highlightCell={selectedCell}
                    title="Image AB"
                  />

                  <div className="step15-matrix-bracket-wrap">
                    <div className="step15-bracket-l" />
                    <div className="step15-matrix-grid-product">
                      {productAB.map((row, r) =>
                        row.map((val, c) => {
                          const isTarget = selectedCell.row === r && selectedCell.col === c;
                          return (
                            <div
                              key={`ab-${r}-${c}`}
                              onClick={() => setSelectedCell({ row: r, col: c })}
                              className={`step15-cell-product step15-cell-clickable ${isTarget ? 'active-target' : ''}`}
                              title={`C[${r},${c}] = ${val} (Click to inspect dot product)`}
                            >
                              <span className="step15-cell-val" style={{ fontSize: '0.72rem' }}>
                                {val}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="step15-bracket-r" />
                  </div>
                </div>
              </div>

              {/* RESULT BA */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Product BA (Order: B · A)
                    </span>
                    <span style={{ fontSize: '0.70rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      Min: {minBA} | Max: {maxBA}
                    </span>
                  </div>

                  <div className="step15-body-row">
                    <CanvasMatrix4x4
                      matrix={normBA}
                      size={110}
                      highlightCell={selectedCell}
                      title="Image BA"
                    />

                    <div className="step15-matrix-bracket-wrap">
                      <div className="step15-bracket-l" />
                      <div className="step15-matrix-grid-product">
                        {productBA.map((row, r) =>
                          row.map((val, c) => {
                            const isTarget = selectedCell.row === r && selectedCell.col === c;
                            return (
                              <div
                                key={`ba-${r}-${c}`}
                                onClick={() => setSelectedCell({ row: r, col: c })}
                                className={`step15-cell-product step15-cell-clickable ${isTarget ? 'active-target' : ''}`}
                                title={`BA[${r},${c}] = ${val} (Click to inspect)`}
                              >
                                <span className="step15-cell-val" style={{ fontSize: '0.72rem' }}>
                                  {val}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="step15-bracket-r" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COMMUTATIVITY ANALYSIS & DIFFERENCE MATRIX */}
            <div className="step15-diff-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Numerical Disparity Matrix Δ = |AB − BA|
                  </span>
                  <span
                    className={`step15-status-badge ${diffMatrix.isIdentical ? 'is-commuting' : 'is-non-commuting'}`}
                  >
                    {diffMatrix.isIdentical ? 'AB = BA (Commuting)' : 'AB ≠ BA (Non-Commutative)'}
                  </span>
                </div>
                <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  Total Disparity Index: <strong className={`step15-disparity-val ${diffMatrix.isIdentical ? 'is-zero' : 'is-diff'}`}>{diffMatrix.totalDiff.toLocaleString()}</strong>
                </span>
              </div>

              <div className="step15-matrix-bracket-wrap" style={{ margin: '0.35rem 0' }}>
                <div className="step15-bracket-l" />
                <div className="step15-matrix-grid-diff">
                  {diffMatrix.diff.map((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`delta-${r}-${c}`}
                        className={`step15-diff-cell ${val === 0 ? 'is-zero' : 'is-diff'}`}
                        title={`|AB[${r},${c}] − BA[${r},${c}]| = ${val}`}
                      >
                        <span className="step15-diff-val">
                          {val}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="step15-bracket-r" />
              </div>
            </div>
          </div>
        ) : (
        /* ==============================================================
           PART 2: CREATING AND REMOVING SHADOWS (HADAMARD PRODUCT A ⊙ S)
           ============================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1.1rem' }}>
          {/* Concept Header Strip */}
          <div className="step15-card">
            <div className="step15-card-header">
              <div className="step15-card-title">
                <Sun size={15} style={{ color: 'var(--text-secondary)' }} />
                <span>Optical Shadows via Hadamard Product (A ⊙ S)</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
              <span>Casting Shadow: <strong style={{ color: 'var(--accent-primary, #697951)' }}>B = A ⊙ S</strong></span>
              <span>Inverting Shadow: <strong style={{ color: 'var(--accent-primary, #697951)' }}>A = B ⊘ S</strong></span>
            </div>
          </div>

          {/* 4x4 SHADOW CREATION & REVERSAL */}
          <div className="step15-card">
            <div className="step15-card-header">
              <div className="step15-card-title">
                <span>4×4 Grayscale Image Shadow Experiment</span>
              </div>

              {/* Controls Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', fontSize: '0.76rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Region:</span>
                <select
                  value={shadowPosition}
                  onChange={(e) => {
                    setShadowPosition(e.target.value);
                    setIsShadowRemoved(false);
                  }}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '5px',
                    padding: '0.2rem 0.45rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.74rem',
                    outline: 'none'
                  }}
                >
                  <option value="right">Right Half (c ≥ 2)</option>
                  <option value="left">Left Half (c &lt; 2)</option>
                  <option value="top">Top Half (r &lt; 2)</option>
                  <option value="bottom">Bottom Half (r ≥ 2)</option>
                  <option value="vignette">Outer Border (Vignette)</option>
                  <option value="diagonal">Diagonal Corner</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Strength (S):</span>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.1"
                    value={shadowStrength}
                    onChange={(e) => {
                      setShadowStrength(parseFloat(e.target.value));
                      setIsShadowRemoved(false);
                    }}
                    className="det-cell-slider"
                    style={{ width: '70px', '--slider-pct': `${((shadowStrength - 0.1) / 0.8) * 100}%` }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {shadowStrength.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Panels: Original A -> Shadow Mask S -> Result B/A */}
            <div className="step15-grid-trio">
              {/* ORIGINAL A */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  1. Original Image A
                </span>
                <CanvasMatrix4x4 matrix={matrixA} size={100} title="" />
                <div className="step15-matrix-bracket-wrap">
                  <div className="step15-bracket-l" />
                  <div className="step15-matrix-grid-4x4" style={{ gridTemplateColumns: 'repeat(4, 30px)', gridTemplateRows: 'repeat(4, 28px)' }}>
                    {matrixA.map((row, r) =>
                      row.map((val, c) => (
                        <div key={`oa-${r}-${c}`} className="step15-cell" style={{ width: '30px', height: '28px' }}>
                          <span className="step15-cell-val" style={{ fontSize: '0.72rem' }}>{val}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="step15-bracket-r" />
                </div>
              </div>

              {/* SHADOW MATRIX S */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  2. Shadow Mask S
                </span>
                {/* Visual Representation of S */}
                <div style={{ width: '100px', height: '100px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', gap: '1px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  {shadowMatrixS.map((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`sm-${r}-${c}`}
                        style={{
                          backgroundColor: `rgb(${Math.round(val * 255)}, ${Math.round(val * 255)}, ${Math.round(val * 255)})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.62rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: val > 0.4 ? '#000000' : '#FFFFFF'
                        }}
                      >
                        {val.toFixed(1)}
                      </div>
                    ))
                  )}
                </div>

                <div className="step15-matrix-bracket-wrap">
                  <div className="step15-bracket-l" />
                  <div className="step15-matrix-grid-4x4" style={{ gridTemplateColumns: 'repeat(4, 30px)', gridTemplateRows: 'repeat(4, 28px)' }}>
                    {shadowMatrixS.map((row, r) =>
                      row.map((val, c) => (
                        <div key={`os-${r}-${c}`} className="step15-cell" style={{ width: '30px', height: '28px' }}>
                          <span className="step15-cell-val" style={{ fontSize: '0.72rem', color: val < 1.0 ? 'var(--accent-primary, #697951)' : 'var(--text-muted)' }}>
                            {val}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="step15-bracket-r" />
                </div>
              </div>

              {/* RESULT B OR RECOVERED A */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isShadowRemoved ? '3. Recovered (B ⊘ S)' : '3. Shaded B = A ⊙ S'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsShadowRemoved(!isShadowRemoved)}
                    className="icon-action-btn"
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.18rem 0.45rem',
                      borderColor: isShadowRemoved ? 'var(--accent-primary, #697951)' : undefined
                    }}
                  >
                    {isShadowRemoved ? 'Show Shaded' : 'Remove Shadow'}
                  </button>
                </div>

                <CanvasMatrix4x4 matrix={isShadowRemoved ? recoveredMatrixA : shadedMatrixB} size={100} title="" />

                <div className="step15-matrix-bracket-wrap">
                  <div className="step15-bracket-l" />
                  <div className="step15-matrix-grid-4x4" style={{ gridTemplateColumns: 'repeat(4, 30px)', gridTemplateRows: 'repeat(4, 28px)' }}>
                    {(isShadowRemoved ? recoveredMatrixA : shadedMatrixB).map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`res-${r}-${c}`}
                          className="step15-cell"
                          style={{
                            width: '30px',
                            height: '28px',
                            background: isShadowRemoved
                              ? 'rgba(105, 121, 81, 0.12)'
                              : shadowMatrixS[r][c] < 1.0
                              ? 'rgba(105, 121, 81, 0.08)'
                              : undefined
                          }}
                        >
                          <span
                            className="step15-cell-val"
                            style={{
                              fontSize: '0.72rem',
                              color: isShadowRemoved ? 'var(--accent-primary, #697951)' : undefined
                            }}
                          >
                            {val}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="step15-bracket-r" />
                </div>
              </div>
            </div>

            {/* Recovery Summary */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-primary, #697951)' }} />
                <span>
                  Mathematical Inversion: If original pixel is <code>100</code> and shadow factor is <code>0.5</code>, shaded pixel is <code>50</code>. Inversion: <code>50 / 0.5 = 100</code>.
                </span>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--accent-primary, #697951)' }}>
                100% Exact Recovery
              </span>
            </div>
          </div>

          {/* REAL PHOTOGRAPH: BOTANICAL FLOWER EXPERIMENT */}
          <div className="step15-card">
            <div className="step15-card-header">
              <div>
                <div className="step15-card-title">
                  <ImageIcon size={15} style={{ color: 'var(--text-secondary)' }} />
                  <span>Real Photograph Experiment: Casting &amp; Inverting Shadows</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  For RGB photography, shadow factor applies across all 3 channels: R′ = R ⊙ S, G′ = G ⊙ S, B′ = B ⊙ S
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadFlower}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="icon-action-btn"
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem' }}
                >
                  <Upload size={13} />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem', background: 'var(--bg-secondary)', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Region:</span>
                {['right', 'left', 'diagonal', 'vignette'].map((reg) => (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => {
                      setFlowerShadowRegion(reg);
                      setFlowerShadowRemoved(false);
                    }}
                    className={`sub-chapter-pill ${flowerShadowRegion === reg ? 'active' : ''}`}
                    style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', textTransform: 'capitalize' }}
                  >
                    {reg}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Strength (S):</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={flowerShadowStrength}
                  onChange={(e) => {
                    setFlowerShadowStrength(parseFloat(e.target.value));
                    setFlowerShadowRemoved(false);
                  }}
                  className="det-cell-slider"
                  style={{ width: '80px', '--slider-pct': `${((flowerShadowStrength - 0.1) / 0.7) * 100}%` }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {flowerShadowStrength.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setFlowerShadowRemoved(!flowerShadowRemoved)}
                className="action-btn"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem', borderRadius: '6px' }}
              >
                {flowerShadowRemoved ? 'Shadow Inverted (Reapply Shadow)' : 'Invert Shadow (B ⊘ S)'}
              </button>
            </div>

            {/* Canvases Side by Side */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '0.5rem 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Original Photograph
                </span>
                <canvas
                  ref={flowerOriginalRef}
                  className="step15-canvas"
                  style={{ width: '200px', height: '200px', borderRadius: '10px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {flowerShadowRemoved ? 'Restored Photograph (B ⊘ S)' : 'Shaded Photograph (A ⊙ S)'}
                </span>
                <canvas
                  ref={flowerShadedRef}
                  className="step15-canvas"
                  style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '10px',
                    borderColor: flowerShadowRemoved ? 'var(--accent-primary, #697951)' : undefined
                  }}
                />
              </div>
            </div>

            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              <strong>Digital quantization note:</strong> Digital photography quantizes pixel intensities into discrete 8-bit integers (0 to 255).
              Division by <code>S</code> mathematically reverses the darkening, with subtle rounding error (sensor quantization) in deep shadows.
            </p>
          </div>
        </div>
      )}

      {/* STANDARDIZED EDUCATIONAL DOCUMENTATION */}
      <div style={{ marginTop: '1.25rem' }}>
        <ModuleDocumentation stepNumber={15} defaultOpen={false} />
      </div>

      {/* FOOTER NAVIGATION */}
      <StepFooter stepNumber={15} onSelectStep={onSelectStep} />
    </motion.div>
  );
}
