import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  ArrowLeftRight,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Info,
  Maximize2,
  Eye,
  Shuffle,
  Equal,
  Divide,
  X,
  Upload,
  Camera,
  Image as ImageIcon
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

// Presets for 4x4 Matrices
const MULTIPLICATION_PRESETS = {
  gradients: {
    name: 'Gradients (H vs V)',
    desc: 'Horizontal gradient in A against vertical gradient in B',
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
    desc: 'Center plus sign in A with outer border frame in B',
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
    name: 'Checkerboard & Stripes',
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
    name: 'Identity Matrix I (Commuting)',
    desc: 'Special case: B is the Identity Matrix I. AI = IA = A!',
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
    name: 'Scalar Diagonal 2·I (Commuting)',
    desc: 'Special case: B is 2·I. Both AB and BA equal 2·A!',
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
function CanvasMatrix4x4({ matrix, size = 120, highlightRow = -1, highlightCol = -1, title = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix || matrix.length === 0) return;
    const ctx = canvas.getContext('2d');
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cellSize = size / cols;

    ctx.clearRect(0, 0, size, size);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = clampPixel(matrix[r][c]);
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);

        // Highlight
        if (r === highlightRow && c === highlightCol) {
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 3;
          ctx.strokeRect(c * cellSize + 1.5, r * cellSize + 1.5, cellSize - 3, cellSize - 3);
        } else if (r === highlightRow) {
          ctx.fillStyle = 'rgba(34, 211, 238, 0.25)';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        } else if (c === highlightCol) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [matrix, size, highlightRow, highlightCol]);

  return (
    <div className="canvas-matrix-box flex flex-col items-center gap-1.5">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-xl border border-white/10 shadow-lg"
        style={{ width: `${size}px`, height: `${size}px`, imageRendering: 'pixelated' }}
      />
      {title && <span className="text-xs font-mono text-gray-400 font-semibold">{title}</span>}
    </div>
  );
}

// Procedural Flower Generator on HTML5 Canvas
function drawFlowerOnCanvas(ctx, width, height) {
  // Deep background
  const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width);
  bgGrad.addColorStop(0, '#1a3320');
  bgGrad.addColorStop(1, '#08140c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Stems and soft leaves
  ctx.save();
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#2d6a4f';
  ctx.beginPath();
  ctx.moveTo(width / 2, height);
  ctx.quadraticCurveTo(width / 2 - 15, height * 0.7, width / 2, height * 0.55);
  ctx.stroke();

  // Leaf left
  ctx.fillStyle = '#40916c';
  ctx.beginPath();
  ctx.ellipse(width * 0.35, height * 0.72, 28, 12, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  // Leaf right
  ctx.fillStyle = '#52b788';
  ctx.beginPath();
  ctx.ellipse(width * 0.65, height * 0.78, 26, 11, Math.PI / 5, 0, Math.PI * 2);
  ctx.fill();

  // Flower petals (radiating daisy / rose pattern)
  const cx = width / 2;
  const cy = height * 0.45;
  const numPetals = 8;
  const petalLength = width * 0.28;
  const petalWidth = width * 0.12;

  for (let i = 0; i < numPetals; i++) {
    const angle = (i * 2 * Math.PI) / numPetals;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, 0, -petalLength);
    grad.addColorStop(0, '#f72585');
    grad.addColorStop(0.5, '#b5179e');
    grad.addColorStop(1, '#7209b7');
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

    const grad = ctx.createLinearGradient(0, 0, 0, -petalLength * 0.7);
    grad.addColorStop(0, '#ff70a6');
    grad.addColorStop(1, '#f72585');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.ellipse(0, -petalLength * 0.35, petalWidth * 0.4, petalLength * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Flower center glowing pistil
  const centerGrad = ctx.createRadialGradient(cx, cy, 3, cx, cy, width * 0.1);
  centerGrad.addColorStop(0, '#ffea00');
  centerGrad.addColorStop(0.6, '#ffaa00');
  centerGrad.addColorStop(1, '#ff6000');
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, width * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // Fine textured dots in flower center
  ctx.fillStyle = '#7a3b00';
  for (let d = 0; d < 18; d++) {
    const r = (d % 3 + 1) * 5;
    const a = d * 1.3;
    ctx.fillRect(cx + r * Math.cos(a), cy + r * Math.sin(a), 2, 2);
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

  // Normalization mode for matrix multiplication image display: 'minmax' | 'theoretical' | 'clamp'
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
  // Shadow position: 'right' | 'left' | 'top' | 'bottom' | 'vignette' | 'diagonal'
  const [shadowPosition, setShadowPosition] = useState('right');
  const [shadowStrength, setShadowStrength] = useState(0.5); // 0.5 = half brightness (as in prompt S = 0.5)
  const [isShadowRemoved, setIsShadowRemoved] = useState(false);

  // 4x4 Shadow Matrix S
  const shadowMatrixS = useMemo(() => {
    const s = createEmptyMatrix(4, 4, 1.0);
    const factor = shadowStrength; // e.g. 0.5

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
  const [flowerShadowRegion, setFlowerShadowRegion] = useState('right'); // 'right', 'left', 'diagonal', 'vignette'
  const fileInputRef = useRef(null);

  // Render flower canvases
  useEffect(() => {
    const canvasOrig = flowerOriginalRef.current;
    const canvasShaded = flowerShadedRef.current;
    if (!canvasOrig || !canvasShaded) return;

    const w = 240;
    const h = 240;
    canvasOrig.width = w;
    canvasOrig.height = h;
    canvasShaded.width = w;
    canvasShaded.height = h;

    const ctxOrig = canvasOrig.getContext('2d');
    drawFlowerOnCanvas(ctxOrig, w, h);

    // Copy to shaded canvas and apply Hadamard shadow channel-by-channel
    const ctxShaded = canvasShaded.getContext('2d');
    const imgData = ctxOrig.getImageData(0, 0, w, h);
    const data = imgData.data;

    const factor = flowerShadowStrength; // e.g. 0.5

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
          // If recovered: B ⊘ S recovers original (approximate rounding)
          // Shaded then divided back
          const rShaded = Math.round(data[idx] * currentFactor);
          const gShaded = Math.round(data[idx + 1] * currentFactor);
          const bShaded = Math.round(data[idx + 2] * currentFactor);

          data[idx] = clampPixel(currentFactor > 0 ? rShaded / currentFactor : rShaded);
          data[idx + 1] = clampPixel(currentFactor > 0 ? gShaded / currentFactor : gShaded);
          data[idx + 2] = clampPixel(currentFactor > 0 ? bShaded / currentFactor : bShaded);
        } else {
          // Shaded: R' = R ⊙ S, G' = G ⊙ S, B' = B ⊙ S
          data[idx] = clampPixel(data[idx] * currentFactor);
          data[idx + 1] = clampPixel(data[idx + 1] * currentFactor);
          data[idx + 2] = clampPixel(data[idx + 2] * currentFactor);
        }
      }
    }

    ctxShaded.putImageData(imgData, 0, 0);
  }, [flowerShadowStrength, flowerShadowRegion, flowerShadowRemoved]);

  // Handle custom image upload for flower
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
        ctx.drawImage(img, 0, 0, 240, 240);
        setFlowerShadowRemoved(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      className="step-module visual-lens-mult-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* STEP HEADER */}
      <div className="step-header-box mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className="modal-badge-tag"
              style={{
                background: 'rgba(34, 211, 238, 0.15)',
                color: 'var(--accent-cyan)',
                borderColor: 'rgba(34, 211, 238, 0.35)'
              }}
            >
              Visual Lab 15
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              C = A · B &nbsp;•&nbsp; Non-Commutative Geometry &amp; Hadamard Shadows
            </span>
          </div>
        </div>

        <h2 className="step-heading">
          Matrix Multiplication: What Happens When We Multiply Two Images?
        </h2>
        <p className="step-description">
          Unlike ordinary number multiplication where <code>a × b = b × a</code>, matrix multiplication mixes rows and columns directionally:
          <strong> AB ≠ BA</strong>! Explore how pixel matrices interact under matrix multiplication, and contrast it with
          the <strong>Hadamard element-wise product (A ⊙ S)</strong> used to cast and mathematically recover optical shadows.
        </p>

        {/* TOP TAB SWITCHER */}
        <div className="flex items-center gap-2 mt-3 p-1.5 rounded-xl bg-white/5 border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('multiplication')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'multiplication'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 font-bold'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Grid size={16} />
            <span>1. Matrix Multiplication (AB vs BA)</span>
          </button>
          <button
            onClick={() => setActiveTab('shadows')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'shadows'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20 font-bold'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sun size={16} />
            <span>2. Creating &amp; Removing Shadows (A ⊙ S)</span>
          </button>
        </div>
      </div>

      {activeTab === 'multiplication' ? (
        /* ==============================================================
           PART 1: 4x4 MATRIX MULTIPLICATION (A * B vs B * A)
           ============================================================== */
        <div className="space-y-6">
          {/* Controls & Preset Selector */}
          <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders size={18} className="text-cyan-400" />
                  Preset Matrices &amp; Special Cases
                </h3>
                <p className="text-xs text-gray-400">
                  Select predefined 4×4 images or edit individual pixel intensity values below.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSwapAandB}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center gap-1.5 transition-all"
                  title="Swap A and B"
                >
                  <ArrowLeftRight size={14} />
                  <span>Swap A ⇄ B</span>
                </button>
                <button
                  onClick={handleSetIdentityB}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all"
                  title="Test Commuting Case: B = Identity Matrix"
                >
                  <Equal size={14} />
                  <span>Test AI = IA = A (Identity B)</span>
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
              {Object.entries(MULTIPLICATION_PRESETS).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => handleSelectPreset(key)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    currentPresetKey === key
                      ? 'bg-cyan-500/15 border-cyan-400/60 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="font-semibold text-xs text-cyan-300">{item.name}</div>
                  <div className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* DUAL INPUT MATRICES: IMAGE A & IMAGE B */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* MATRIX A */}
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center border border-cyan-500/30">
                    A
                  </span>
                  <span className="font-bold text-sm text-white">Image A (4 × 4 Matrix)</span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400/80">Click cell to edit</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-around">
                <CanvasMatrix4x4
                  matrix={matrixA}
                  size={120}
                  highlightRow={selectedCell.row}
                  title="Canvas View A"
                />

                {/* 4x4 Numerical Matrix Grid */}
                <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-black/40 border border-white/10">
                  {matrixA.map((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`a-${r}-${c}`}
                        className={`flex flex-col items-center justify-center w-11 h-11 rounded-lg border transition-all ${
                          selectedCell.row === r
                            ? 'bg-cyan-500/25 border-cyan-400 shadow-sm shadow-cyan-500/30'
                            : 'bg-white/5 border-white/10 hover:border-cyan-400/50'
                        }`}
                      >
                        <input
                          type="number"
                          min="0"
                          max="255"
                          value={val}
                          onChange={(e) => handleCellChange('A', r, c, e.target.value)}
                          className="w-full text-center bg-transparent text-xs font-mono font-bold text-white outline-none"
                        />
                        <span className="text-[8px] font-mono text-gray-400">({r},{c})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* MATRIX B */}
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold text-xs flex items-center justify-center border border-purple-500/30">
                    B
                  </span>
                  <span className="font-bold text-sm text-white">Image B (4 × 4 Matrix)</span>
                </div>
                <span className="text-[11px] font-mono text-purple-400/80">Click cell to edit</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-around">
                <CanvasMatrix4x4
                  matrix={matrixB}
                  size={120}
                  highlightCol={selectedCell.col}
                  title="Canvas View B"
                />

                {/* 4x4 Numerical Matrix Grid */}
                <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-black/40 border border-white/10">
                  {matrixB.map((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`b-${r}-${c}`}
                        className={`flex flex-col items-center justify-center w-11 h-11 rounded-lg border transition-all ${
                          selectedCell.col === c
                            ? 'bg-purple-500/25 border-purple-400 shadow-sm shadow-purple-500/30'
                            : 'bg-white/5 border-white/10 hover:border-purple-400/50'
                        }`}
                      >
                        <input
                          type="number"
                          min="0"
                          max="255"
                          value={val}
                          onChange={(e) => handleCellChange('B', r, c, e.target.value)}
                          className="w-full text-center bg-transparent text-xs font-mono font-bold text-white outline-none"
                        />
                        <span className="text-[8px] font-mono text-gray-400">({r},{c})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE ROW × COLUMN DOT-PRODUCT BREAKDOWN */}
          <div className="glass-level-3 p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-black/40 to-purple-950/20 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-cyan-400" />
                <span className="font-bold text-sm text-white">
                  Dot-Product Calculation for Element C[{dotProductBreakdown.row},{dotProductBreakdown.col}]
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                <span>Select Target Cell:</span>
                <select
                  value={`${selectedCell.row}-${selectedCell.col}`}
                  onChange={(e) => {
                    const [r, c] = e.target.value.split('-').map(Number);
                    setSelectedCell({ row: r, col: c });
                  }}
                  className="bg-black/60 border border-white/20 rounded px-2 py-1 text-cyan-300 font-mono text-xs outline-none"
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

            {/* Formula display */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-gray-300 space-y-2">
              <div className="text-gray-400 text-[11px]">
                Each element <span className="text-cyan-400">C[i,j]</span> = ∑<sub>k=0</sub><sup>3</sup> (Row i of A) × (Col j of B):
              </div>
              <div className="flex items-center gap-1.5 flex-wrap font-bold">
                <span className="text-cyan-400">C[{dotProductBreakdown.row},{dotProductBreakdown.col}]</span>
                <span>=</span>
                {dotProductBreakdown.terms.map((t, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    <span className="text-cyan-300">({t.aVal}</span>
                    <span className="text-gray-400">×</span>
                    <span className="text-purple-300">{t.bVal})</span>
                    {idx < 3 && <span className="text-gray-400">+</span>}
                  </span>
                ))}
                <span>=</span>
                {dotProductBreakdown.terms.map((t, idx) => (
                  <span key={`val-${idx}`} className="flex items-center gap-1">
                    <span className="text-emerald-400">{t.prod}</span>
                    {idx < 3 && <span className="text-gray-400">+</span>}
                  </span>
                ))}
                <span>=</span>
                <span className="text-yellow-400 font-extrabold text-sm bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30">
                  {dotProductBreakdown.sum}
                </span>
                <span className="text-gray-400 text-[11px]">
                  (Normalized Display: {dotProductBreakdown.normVal})
                </span>
              </div>
            </div>
          </div>

          {/* DUAL RESULTS: AB vs BA */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Equal size={18} className="text-yellow-400" />
                Multiplication Results: AB vs Reverse BA
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Display Normalization:</span>
                <select
                  value={normMode}
                  onChange={(e) => setNormMode(e.target.value)}
                  className="bg-black/60 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none"
                >
                  <option value="minmax">Min-Max Scale [0, 255]</option>
                  <option value="clamp">Clamp to [0, 255]</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* RESULT AB */}
              <div className="glass-level-2 p-5 rounded-2xl border border-cyan-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs border border-cyan-500/40">
                      Product A × B
                    </span>
                    <span className="text-xs text-gray-400">Order: A first, then B</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Min: {minAB} | Max: {maxAB}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-around">
                  <CanvasMatrix4x4
                    matrix={normAB}
                    size={120}
                    highlightRow={selectedCell.row}
                    highlightCol={selectedCell.col}
                    title="Image AB"
                  />

                  {/* 4x4 Matrix Table */}
                  <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-black/50 border border-white/10">
                    {productAB.map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`ab-${r}-${c}`}
                          onClick={() => setSelectedCell({ row: r, col: c })}
                          className={`cursor-pointer flex flex-col items-center justify-center w-12 h-11 rounded-lg border transition-all ${
                            selectedCell.row === r && selectedCell.col === c
                              ? 'bg-cyan-500/30 border-cyan-400 shadow-md shadow-cyan-500/20'
                              : 'bg-white/5 border-white/10 hover:border-cyan-400/50'
                          }`}
                        >
                          <span className="text-[11px] font-mono font-bold text-white truncate max-w-[44px]">
                            {val}
                          </span>
                          <span className="text-[8px] font-mono text-gray-400">
                            norm:{normAB[r]?.[c]}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* RESULT BA */}
              <div className="glass-level-2 p-5 rounded-2xl border border-purple-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-xs border border-purple-500/40">
                      Product B × A
                    </span>
                    <span className="text-xs text-gray-400">Reversed Order: B first, then A</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400">
                    Min: {minBA} | Max: {maxBA}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-around">
                  <CanvasMatrix4x4
                    matrix={normBA}
                    size={120}
                    highlightRow={selectedCell.row}
                    highlightCol={selectedCell.col}
                    title="Image BA"
                  />

                  {/* 4x4 Matrix Table */}
                  <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-black/50 border border-white/10">
                    {productBA.map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`ba-${r}-${c}`}
                          onClick={() => setSelectedCell({ row: r, col: c })}
                          className={`cursor-pointer flex flex-col items-center justify-center w-12 h-11 rounded-lg border transition-all ${
                            selectedCell.row === r && selectedCell.col === c
                              ? 'bg-purple-500/30 border-purple-400 shadow-md shadow-purple-500/20'
                              : 'bg-white/5 border-white/10 hover:border-purple-400/50'
                          }`}
                        >
                          <span className="text-[11px] font-mono font-bold text-white truncate max-w-[44px]">
                            {val}
                          </span>
                          <span className="text-[8px] font-mono text-gray-400">
                            norm:{normBA[r]?.[c]}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIDE-BY-SIDE QUAD GALLERY: Image A | Image B | Image AB | Image BA */}
          <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Compare All 4 Images Side-by-Side</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                  diffMatrix.isIdentical
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {diffMatrix.isIdentical ? 'AB = BA (Commuting!)' : 'AB ≠ BA (Non-Commutative)'}
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center gap-2">
                <CanvasMatrix4x4 matrix={matrixA} size={90} title="" />
                <span className="text-xs font-mono font-bold text-cyan-300">Image A</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center gap-2">
                <CanvasMatrix4x4 matrix={matrixB} size={90} title="" />
                <span className="text-xs font-mono font-bold text-purple-300">Image B</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/30 flex flex-col items-center gap-2">
                <CanvasMatrix4x4 matrix={normAB} size={90} title="" />
                <span className="text-xs font-mono font-bold text-cyan-400">Image AB</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-purple-500/30 flex flex-col items-center gap-2">
                <CanvasMatrix4x4 matrix={normBA} size={90} title="" />
                <span className="text-xs font-mono font-bold text-purple-400">Image BA</span>
              </div>
            </div>

            {/* Difference Heatmap Matrix |AB - BA| */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300">
                  Numerical Difference Matrix Δ = |AB − BA|
                </span>
                <span className="font-mono text-gray-400">
                  Total Disparity Index: <strong className="text-rose-400">{diffMatrix.totalDiff}</strong>
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 max-w-sm mx-auto">
                {diffMatrix.diff.map((row, r) =>
                  row.map((val, c) => (
                    <div
                      key={`delta-${r}-${c}`}
                      className={`h-9 rounded flex items-center justify-center font-mono text-xs font-bold ${
                        val === 0
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {val}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* GUIDED PEDAGOGICAL QUESTIONS */}
          <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle size={18} className="text-amber-400" />
              Guided Inquiry: Understanding Matrix Multiplication
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="font-bold text-amber-300">1. Do AB and BA have the same dimensions?</span>
                <p className="text-gray-300">
                  <strong>Yes!</strong> Since A is 4×4 and B is 4×4, both AB and BA yield 4×4 matrices.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="font-bold text-amber-300">2. Are their numerical values identical?</span>
                <p className="text-gray-300">
                  <strong>Generally No!</strong> Unless A and B are specially designed (such as when B is the Identity Matrix I),
                  AB and BA have entirely different numerical entries.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="font-bold text-amber-300">3. Do their resulting images look identical?</span>
                <p className="text-gray-300">
                  <strong>No!</strong> Notice how visual gradients, stripe orientations, and high-frequency textures
                  flow horizontally in AB and vertically in BA.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="font-bold text-amber-300">4. Does matrix multiplication behave like numbers?</span>
                <p className="text-gray-300">
                  <strong>No!</strong> Real numbers commute (<code>3 × 5 = 5 × 3</code>). Matrices are
                  <strong> non-commutative</strong> (<code>AB ≠ BA</code>), because rows and columns are paired in opposite order!
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==============================================================
           PART 2: CREATING AND REMOVING SHADOWS (HADAMARD PRODUCT A ⊙ S)
           ============================================================== */
        <div className="space-y-6">
          {/* Theoretical Concept Card */}
          <div className="glass-level-2 p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/20 to-black/40 space-y-3">
            <div className="flex items-center gap-2">
              <Sun size={20} className="text-yellow-400" />
              <h3 className="text-base font-bold text-white">
                Optical Shadows via Hadamard Product (Element-Wise Multiplication)
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              When a physical shadow falls across an image, pixels in that region receive reduced illumination.
              Instead of ordinary matrix multiplication, this is an <strong>element-wise Hadamard product (A ⊙ S)</strong>:
              every pixel <code>A[i,j]</code> is multiplied by a local transmission factor <code>S[i,j]</code>.
              Here, <strong>1.0</strong> means full light, <strong>0.5</strong> means half brightness, and <strong>0.0</strong> represents total darkness.
            </p>
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-cyan-300 flex items-center justify-between flex-wrap gap-2">
              <span>Creating Shadow: <strong>B = A ⊙ S</strong></span>
              <span>Reversing Shadow: <strong>A = B ⊘ S</strong> (provided S &gt; 0)</span>
            </div>
          </div>

          {/* 4x4 SHADOW CREATION & REVERSAL */}
          <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="font-bold text-sm text-white">4×4 Grayscale Image Shadow Experiment</h4>
                <p className="text-xs text-gray-400">
                  Observe how shadow factor S modulates pixel intensity and how element-wise division recovers the original.
                </p>
              </div>

              {/* Shadow Region & Strength Controls */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-gray-400">Shadow Region:</span>
                <select
                  value={shadowPosition}
                  onChange={(e) => {
                    setShadowPosition(e.target.value);
                    setIsShadowRemoved(false);
                  }}
                  className="bg-black/60 border border-white/20 rounded px-2.5 py-1 text-white font-mono text-xs outline-none"
                >
                  <option value="right">Right Half (c ≥ 2)</option>
                  <option value="left">Left Half (c &lt; 2)</option>
                  <option value="top">Top Half (r &lt; 2)</option>
                  <option value="bottom">Bottom Half (r ≥ 2)</option>
                  <option value="vignette">Outer Border (Vignette)</option>
                  <option value="diagonal">Diagonal Corner</option>
                </select>

                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-gray-400">Strength (S):</span>
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
                    className="w-20 accent-purple-400 cursor-pointer"
                  />
                  <span className="font-mono text-purple-300 font-bold">{shadowStrength.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* 3 Panels: A -> S -> Shaded B (or Recovered A) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ORIGINAL A */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center gap-3">
                <span className="text-xs font-mono font-bold text-cyan-300">1. Original Image A</span>
                <CanvasMatrix4x4 matrix={matrixA} size={110} title="" />
                <div className="grid grid-cols-4 gap-1">
                  {matrixA.map((row, r) =>
                    row.map((val, c) => (
                      <span key={`oa-${r}-${c}`} className="w-8 h-6 flex items-center justify-center font-mono text-[10px] text-gray-300 bg-white/5 rounded">
                        {val}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* SHADOW MATRIX S */}
              <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20 flex flex-col items-center gap-3">
                <span className="text-xs font-mono font-bold text-purple-300">2. Shadow Matrix S (Factor)</span>
                {/* Visual Representation of S */}
                <div className="w-[110px] h-[110px] grid grid-cols-4 gap-0.5 rounded-xl overflow-hidden border border-white/10">
                  {shadowMatrixS.map((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`sm-${r}-${c}`}
                        className="flex items-center justify-center text-[10px] font-mono font-bold text-white"
                        style={{
                          backgroundColor: val === 1.0 ? '#ffffff' : `rgba(255, 255, 255, ${val})`,
                          color: val > 0.4 ? '#000' : '#fff'
                        }}
                      >
                        {val}
                      </div>
                    ))
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {shadowMatrixS.map((row, r) =>
                    row.map((val, c) => (
                      <span key={`os-${r}-${c}`} className="w-8 h-6 flex items-center justify-center font-mono text-[10px] text-purple-300 bg-purple-500/10 rounded">
                        {val}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* SHADED B OR RECOVERED A */}
              <div className="p-4 rounded-xl bg-black/40 border border-yellow-500/20 flex flex-col items-center gap-3">
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-mono font-bold text-yellow-300">
                    {isShadowRemoved ? '3. Recovered Image (B ⊘ S)' : '3. Shaded Image B = A ⊙ S'}
                  </span>
                  <button
                    onClick={() => setIsShadowRemoved(!isShadowRemoved)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
                      isShadowRemoved
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30'
                    }`}
                  >
                    {isShadowRemoved ? 'Show Shaded' : 'Remove Shadow'}
                  </button>
                </div>

                <CanvasMatrix4x4 matrix={isShadowRemoved ? recoveredMatrixA : shadedMatrixB} size={110} title="" />

                <div className="grid grid-cols-4 gap-1">
                  {(isShadowRemoved ? recoveredMatrixA : shadedMatrixB).map((row, r) =>
                    row.map((val, c) => (
                      <span
                        key={`res-${r}-${c}`}
                        className={`w-8 h-6 flex items-center justify-center font-mono text-[10px] font-bold rounded ${
                          isShadowRemoved
                            ? 'text-emerald-300 bg-emerald-500/15'
                            : shadowMatrixS[r][c] < 1.0
                            ? 'text-yellow-300 bg-yellow-500/15'
                            : 'text-gray-300 bg-white/5'
                        }`}
                      >
                        {val}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Arithmetic Recovery Note */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>
                  Exact Recovery Law: If original pixel is <code>100</code> and shadow factor is <code>0.5</code>,
                  shaded pixel is <code>50</code>. Reversing via division: <code>50 / 0.5 = 100</code>!
                </span>
              </div>
              <span className="font-mono text-emerald-400 font-bold">100% Mathematical Recovery</span>
            </div>
          </div>

          {/* REAL PHOTOGRAPH: THE FLOWER EXPERIMENT */}
          <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <ImageIcon size={18} className="text-pink-400" />
                  Real Photograph Experiment: Casting &amp; Removing Shadows on a Flower
                </h4>
                <p className="text-xs text-gray-400">
                  For a color photograph, the shadow matrix applies independently to Red, Green, and Blue channels:
                  <code className="text-cyan-300 ml-1">R′ = R ⊙ S, &nbsp; G′ = G ⊙ S, &nbsp; B′ = B ⊙ S</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadFlower}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center gap-1.5 transition-all"
                >
                  <Upload size={14} />
                  <span>Upload Your Flower</span>
                </button>
              </div>
            </div>

            {/* Interactive Controls Bar */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-400">Shadow Region:</span>
                {['right', 'left', 'diagonal', 'vignette'].map((reg) => (
                  <button
                    key={reg}
                    onClick={() => {
                      setFlowerShadowRegion(reg);
                      setFlowerShadowRemoved(false);
                    }}
                    className={`px-2.5 py-1 rounded text-xs capitalize transition-all ${
                      flowerShadowRegion === reg
                        ? 'bg-purple-500 text-white font-bold'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400">Shadow Strength (S):</span>
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
                  className="w-24 accent-purple-400 cursor-pointer"
                />
                <span className="font-mono text-purple-300 font-bold">{flowerShadowStrength.toFixed(2)}</span>
              </div>

              <button
                onClick={() => setFlowerShadowRemoved(!flowerShadowRemoved)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                  flowerShadowRemoved
                    ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/20 hover:scale-105'
                }`}
              >
                {flowerShadowRemoved ? 'Shadow Removed (Click to Reapply)' : 'Click to Remove Shadow (B ⊘ S)'}
              </button>
            </div>

            {/* Visual Canvases Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 justify-items-center pt-2">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-mono font-bold text-gray-300">Original Photograph</span>
                <canvas
                  ref={flowerOriginalRef}
                  className="rounded-2xl border-2 border-white/10 shadow-xl"
                  style={{ width: '220px', height: '220px' }}
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-mono font-bold text-yellow-300">
                  {flowerShadowRemoved ? 'Restored Photograph (Approximate Division)' : 'Modified Photograph with Shadow (A ⊙ S)'}
                </span>
                <canvas
                  ref={flowerShadedRef}
                  className={`rounded-2xl border-2 shadow-xl transition-all ${
                    flowerShadowRemoved ? 'border-emerald-500/60 shadow-emerald-500/20' : 'border-yellow-500/50 shadow-yellow-500/20'
                  }`}
                  style={{ width: '220px', height: '220px' }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-gray-400 leading-relaxed">
              <strong>Why is real photographic recovery approximate?</strong> In digital cameras, pixel intensities
              are stored as discrete 8-bit integers (0 to 255). Dividing by <code>S</code> recovers the true brightness, but
              subtle sensor noise and rounding (quantization error) mean the restoration is an extremely close approximation rather than bit-for-bit identical!
            </div>
          </div>
        </div>
      )}

      {/* FOOTER NAVIGATION */}
      <StepFooter stepNumber={15} onSelectStep={onSelectStep} />
    </motion.div>
  );
}
