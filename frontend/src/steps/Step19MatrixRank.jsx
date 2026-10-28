import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Binary,
  Layers,
  Sparkles,
  Compass,
  Activity,
  CheckCircle2,
  RotateCcw,
  Upload,
  Eye,
  EyeOff,
  Info,
  Lock
} from 'lucide-react';
import StepFooter from '../components/layout/StepFooter';
import ModuleDocumentation from '../components/experiment/ModuleDocumentation';
import {
  computeRREFAndRank,
  computeSVD3Columns,
  check2DCollinearity
} from '../core/math/rank';

const getSliderPct = (val, min, max) => `${Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100))}%`;

export default function Step19MatrixRank({ onSelectStep }) {
  // Navigation Tabs: 'same-info' | 'reconstruct' | 'real-photos' | 'forces' | 'sensors'
  const [activeTab, setActiveTab] = useState('same-info');

  // Detect Theme (Light vs Dark)
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'dark' : 'dark'
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  const isLight = theme === 'light';

  // =========================================================================
  // TAB 1: THREE IMAGES CONTAINING THE SAME INFORMATION
  // =========================================================================
  // Initial 2x2 image A = [[40, 80], [120, 160]]
  const [matA, setMatA] = useState([
    [40, 80],
    [120, 160]
  ]);
  const [scaleB, setScaleB] = useState(2.0); // B = 2A
  const [scaleC, setScaleC] = useState(3.0); // C = 3A

  // Derived matrices B & C
  const matB = useMemo(() => {
    return matA.map(row => row.map(val => Math.min(255, Math.round(val * scaleB))));
  }, [matA, scaleB]);

  const matC = useMemo(() => {
    return matA.map(row => row.map(val => Math.min(255, Math.round(val * scaleC))));
  }, [matA, scaleC]);

  // Column vectors: flattened 4x1
  const vecA = useMemo(() => [matA[0][0], matA[0][1], matA[1][0], matA[1][1]], [matA]);
  const vecB = useMemo(() => [matB[0][0], matB[0][1], matB[1][0], matB[1][1]], [matB]);
  const vecC = useMemo(() => [matC[0][0], matC[0][1], matC[1][0], matC[1][1]], [matC]);

  // Image collection matrix M (4 x 3)
  const matrixM4x3 = useMemo(() => {
    return [
      [vecA[0], vecB[0], vecC[0]],
      [vecA[1], vecB[1], vecC[1]],
      [vecA[2], vecB[2], vecC[2]],
      [vecA[3], vecB[3], vecC[3]]
    ];
  }, [vecA, vecB, vecC]);

  const tab1RankResult = useMemo(() => {
    return computeRREFAndRank(matrixM4x3);
  }, [matrixM4x3]);

  // =========================================================================
  // TAB 2: RECONSTRUCT THE MISSING IMAGE (C = 2A + B)
  // =========================================================================
  const baseImgA = useMemo(() => [
    [40, 80],
    [120, 160]
  ], []);

  const baseImgB = useMemo(() => [
    [60, 30],
    [40, 90]
  ], []);

  // Target image C = 2A + B
  const targetImgC = useMemo(() => [
    [2 * baseImgA[0][0] + baseImgB[0][0], 2 * baseImgA[0][1] + baseImgB[0][1]],
    [2 * baseImgA[1][0] + baseImgB[1][0], 2 * baseImgA[1][1] + baseImgB[1][1]]
  ], [baseImgA, baseImgB]); // [[140, 190], [280, 410]] clamped or raw

  const [coeffA, setCoeffA] = useState(1.0);
  const [coeffB, setCoeffB] = useState(1.0);
  const [tab2Revealed, setTab2Revealed] = useState(false);
  const [tab2Perturbation, setTab2Perturbation] = useState(0); // Add noise/independent pixel

  // Candidate image C_cand = c1*A + c2*B
  const candImgC = useMemo(() => {
    return [
      [
        Math.round(coeffA * baseImgA[0][0] + coeffB * baseImgB[0][0]),
        Math.round(coeffA * baseImgA[0][1] + coeffB * baseImgB[0][1])
      ],
      [
        Math.round(coeffA * baseImgA[1][0] + coeffB * baseImgB[1][0]),
        Math.round(coeffA * baseImgA[1][1] + coeffB * baseImgB[1][1] + tab2Perturbation)
      ]
    ];
  }, [coeffA, coeffB, baseImgA, baseImgB, tab2Perturbation]);

  // Fidelity / Error computation
  const tab2Fidelity = useMemo(() => {
    let diffSum = 0;
    let targetSum = 0;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        diffSum += Math.abs(candImgC[r][c] - targetImgC[r][c]);
        targetSum += Math.abs(targetImgC[r][c]);
      }
    }
    const relErr = targetSum > 0 ? diffSum / targetSum : 0;
    return Math.max(0, Math.min(100, Math.round((1 - relErr) * 100)));
  }, [candImgC, targetImgC]);

  const isTab2Matched = Math.abs(coeffA - 2.0) < 0.05 && Math.abs(coeffB - 1.0) < 0.05 && tab2Perturbation === 0;

  // Rank of [A | B] vs [A | B | C]
  const tab2RankResult = useMemo(() => {
    const colA = [baseImgA[0][0], baseImgA[0][1], baseImgA[1][0], baseImgA[1][1]];
    const colB = [baseImgB[0][0], baseImgB[0][1], baseImgB[1][0], baseImgB[1][1]];
    const colC = [candImgC[0][0], candImgC[0][1], candImgC[1][0], candImgC[1][1]];

    const m2Cols = [
      [colA[0], colB[0]],
      [colA[1], colB[1]],
      [colA[2], colB[2]],
      [colA[3], colB[3]]
    ];
    const m3Cols = [
      [colA[0], colB[0], colC[0]],
      [colA[1], colB[1], colC[1]],
      [colA[2], colB[2], colC[2]],
      [colA[3], colB[3], colC[3]]
    ];

    const r2 = computeRREFAndRank(m2Cols);
    const r3 = computeRREFAndRank(m3Cols);
    return { rank2: r2.rank, rank3: r3.rank, rref3: r3.rref };
  }, [baseImgA, baseImgB, candImgC]);

  // =========================================================================
  // TAB 3: REAL PHOTOS & LIGHTING (EXACT VS APPROXIMATE DEPENDENCE)
  // =========================================================================
  const [photoPreset, setPhotoPreset] = useState('flower'); // 'flower' | 'tree' | 'independent' | 'custom'
  const [photoResolution, setPhotoResolution] = useState(8); // 8x8 = 64 dimensions
  const [customPhotos, setCustomPhotos] = useState([null, null, null]);

  // Generate synthetic procedural photos or sample user photos
  const photoVectors = useMemo(() => {
    const size = photoResolution;
    const N = size * size;

    if (photoPreset === 'flower') {
      // Flower under 3 lighting conditions:
      // Base pattern + gain multiplier + minor shadow angle variation
      const v1 = new Array(N);
      const v2 = new Array(N);
      const v3 = new Array(N);

      const cx = (size - 1) / 2;
      const cy = (size - 1) / 2;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = y * size + x;
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          // 8 petals
          const petalShape = Math.cos(angle * 8) * 0.35 + 0.65;
          const basePattern = dist < size * 0.42 * petalShape ? 190 - dist * 15 : 40;

          // Lighting condition 1: Morning soft light (0.6x gain)
          v1[idx] = Math.round(basePattern * 0.6 + (x * 2));
          // Lighting condition 2: Noon ambient overhead light (1.0x gain)
          v2[idx] = Math.round(basePattern * 1.0 + 10);
          // Lighting condition 3: Afternoon warm sunlight (1.5x gain with horizontal gradient)
          v3[idx] = Math.round(basePattern * 1.45 + (size - x) * 3);
        }
      }
      return [v1, v2, v3];
    } else if (photoPreset === 'tree') {
      // Tree canopy with sunlight exposure
      const v1 = new Array(N);
      const v2 = new Array(N);
      const v3 = new Array(N);
      for (let i = 0; i < N; i++) {
        const x = i % size;
        const y = Math.floor(i / size);
        const texture = Math.sin(x * 1.2) * Math.cos(y * 1.4) * 45 + 110;
        v1[i] = Math.round(texture * 0.55);
        v2[i] = Math.round(texture * 1.15 + (y * 2));
        v3[i] = Math.round(texture * 1.7 - (x * 1.5));
      }
      return [v1, v2, v3];
    } else if (photoPreset === 'independent') {
      // 3 totally distinct images: Circle, Cross, Gradient
      const v1 = new Array(N);
      const v2 = new Array(N);
      const v3 = new Array(N);
      const cx = size / 2;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = y * size + x;
          // Image 1: Centered Circle
          const d = Math.hypot(x - cx, y - cx);
          v1[i] = d < size * 0.35 ? 220 : 30;
          // Image 2: Cross / Plus
          v2[i] = Math.abs(x - cx) < 1.5 || Math.abs(y - cx) < 1.5 ? 230 : 25;
          // Image 3: Diagonal Gradient
          v3[i] = Math.round(((x + y) / (2 * size)) * 240 + 10);
        }
      }
      return [v1, v2, v3];
    } else {
      // Fallback or custom
      const v1 = customPhotos[0] || new Array(N).fill(100);
      const v2 = customPhotos[1] || new Array(N).fill(150);
      const v3 = customPhotos[2] || new Array(N).fill(200);
      return [v1, v2, v3];
    }
  }, [photoPreset, photoResolution, customPhotos]);

  // Construct N x 3 Matrix M
  const photoMatrixNx3 = useMemo(() => {
    const N = photoVectors[0].length;
    const M = [];
    for (let i = 0; i < N; i++) {
      M.push([photoVectors[0][i], photoVectors[1][i], photoVectors[2][i]]);
    }
    return M;
  }, [photoVectors]);

  // SVD & Rank analysis
  const photoSvdResult = useMemo(() => {
    return computeSVD3Columns(photoMatrixNx3);
  }, [photoMatrixNx3]);

  // File upload handler
  const handlePhotoUpload = (e, slotIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();
    reader.onload = (event) => {
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        const size = photoResolution;
        offCanvas.width = size;
        offCanvas.height = size;
        const ctx = offCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size).data;

        const vec = new Array(size * size);
        for (let i = 0; i < size * size; i++) {
          const r = imgData[i * 4];
          const g = imgData[i * 4 + 1];
          const b = imgData[i * 4 + 2];
          // Grayscale luminance
          vec[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        }

        setCustomPhotos(prev => {
          const next = [...prev];
          next[slotIndex] = vec;
          return next;
        });
        setPhotoPreset('custom');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // =========================================================================
  // TAB 4: PHYSICS 1 — MULTIPLE FORCES AND INDEPENDENT DIRECTIONS
  // =========================================================================
  // F1 = [2; 1], F2 = [4; 2], F3 = [1; 3] as in PDF
  const [f1, setF1] = useState([2.0, 1.0]);
  const [f2, setF2] = useState([4.0, 2.0]);
  const [f3, setF3] = useState([1.0, 3.0]);

  const forceMatrix2x3 = useMemo(() => {
    return [
      [f1[0], f2[0], f3[0]],
      [f1[1], f2[1], f3[1]]
    ];
  }, [f1, f2, f3]);

  const forceRankResult = useMemo(() => {
    return computeRREFAndRank(forceMatrix2x3);
  }, [forceMatrix2x3]);

  const collinearF1F2 = useMemo(() => {
    return check2DCollinearity(f1, f2);
  }, [f1, f2]);

  const forceCanvasRef = useRef(null);

  // Canvas drawing for Tab 4: Forces
  useEffect(() => {
    if (activeTab !== 'forces') return;
    const canvas = forceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const originX = width * 0.22;
    const originY = height * 0.78;
    const scale = Math.min(width, height) / 8.5;

    // Grid lines
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = -2; x <= 8; x++) {
      ctx.beginPath();
      ctx.moveTo(originX + x * scale, 0);
      ctx.lineTo(originX + x * scale, height);
      ctx.stroke();
    }
    for (let y = -2; y <= 7; y++) {
      ctx.beginPath();
      ctx.moveTo(0, originY - y * scale);
      ctx.lineTo(width, originY - y * scale);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = isLight ? '#4B5563' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    ctx.fillStyle = isLight ? '#4B5563' : 'rgba(255, 255, 255, 0.65)';
    ctx.font = '11px monospace';
    ctx.fillText('x (Force X)', width - 65, originY - 8);
    ctx.fillText('y (Force Y)', originX + 8, 16);

    // 1D Collinear Ray Guideline if F1 & F2 are collinear
    if (collinearF1F2.isCollinear) {
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(217, 119, 6, 0.4)' : 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX + f1[0] * 3.5 * scale, originY - f1[1] * 3.5 * scale);
      ctx.stroke();
      ctx.restore();
    }

    // Helper: Draw Vector Arrow
    const drawArrow = (fromX, fromY, toX, toY, color, label, isDashed = false) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3.2;
      if (isDashed) ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const headLen = 12;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      // Label
      ctx.font = 'bold 12px var(--font-mono), monospace';
      ctx.fillText(label, toX + 8, toY - 6);
      ctx.restore();
    };

    // Draw F2 first (if longer) so F1 overlays cleanly
    const f2TipX = originX + f2[0] * scale;
    const f2TipY = originY - f2[1] * scale;
    drawArrow(originX, originY, f2TipX, f2TipY, '#D97706', `F₂ [${f2[0]}, ${f2[1]}]ᵀ`);

    // Draw F1
    const f1TipX = originX + f1[0] * scale;
    const f1TipY = originY - f1[1] * scale;
    drawArrow(originX, originY, f1TipX, f1TipY, '#F59E0B', `F₁ [${f1[0]}, ${f1[1]}]ᵀ`);

    // Draw F3 (Independent direction)
    const f3TipX = originX + f3[0] * scale;
    const f3TipY = originY - f3[1] * scale;
    drawArrow(originX, originY, f3TipX, f3TipY, '#3B82F6', `F₃ [${f3[0]}, ${f3[1]}]ᵀ`);

    // Origin point dot
    ctx.fillStyle = isLight ? '#1F2937' : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(originX, originY, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [activeTab, f1, f2, f3, collinearF1F2, isLight]);

  // =========================================================================
  // TAB 5: PHYSICS 2 — MULTIPLE SENSORS MEASURING SAME SIGNAL
  // =========================================================================
  // Time instants: t1, t2, t3, t4
  // S1 = [1, 2, 3, 4], S2 = [2, 4, 6, 8], S3 = [3, 6, 9, 12] as in PDF
  const s1Readings = useMemo(() => [1.0, 2.0, 3.0, 4.0], []);
  const s2Readings = useMemo(() => [2.0, 4.0, 6.0, 8.0], []);
  const [s3Readings, setS3Readings] = useState([3.0, 6.0, 9.0, 12.0]);
  const [sensorPreset, setSensorPreset] = useState('redundant'); // 'redundant' | 'phase-shift' | 'drift' | 'noise'
  const [isOscillating, setIsOscillating] = useState(true);
  const [oscillationTime, setOscillationTime] = useState(0);

  // Apply sensor presets
  const handleSensorPresetChange = (preset) => {
    setSensorPreset(preset);
    if (preset === 'redundant') {
      setS3Readings([3.0, 6.0, 9.0, 12.0]);
    } else if (preset === 'phase-shift') {
      // Phase-shifted signal (measures 2nd physical frequency/harmonic)
      setS3Readings([4.0, 1.0, 6.0, 2.0]);
    } else if (preset === 'drift') {
      // Sensor with thermal drift / constant bias
      setS3Readings([5.0, 5.0, 6.0, 6.0]);
    } else if (preset === 'noise') {
      // Small variation to simulate sensor measurement jitter
      setS3Readings([3.7, 5.3, 9.8, 11.2]);
    }
  };

  // Matrix S (4 x 3)
  const matrixS4x3 = useMemo(() => {
    return [
      [s1Readings[0], s2Readings[0], s3Readings[0]],
      [s1Readings[1], s2Readings[1], s3Readings[1]],
      [s1Readings[2], s2Readings[2], s3Readings[2]],
      [s1Readings[3], s2Readings[3], s3Readings[3]]
    ];
  }, [s1Readings, s2Readings, s3Readings]);

  const sensorRankResult = useMemo(() => {
    return computeRREFAndRank(matrixS4x3);
  }, [matrixS4x3]);

  // Oscillation animation timer for physical vibration widget
  useEffect(() => {
    if (!isOscillating) return;
    const interval = setInterval(() => {
      setOscillationTime(prev => (prev + 0.05) % (Math.PI * 2));
    }, 30);
    return () => clearInterval(interval);
  }, [isOscillating]);

  const sensorChartCanvasRef = useRef(null);

  // Draw Time-Series Line Graph for Tab 5
  useEffect(() => {
    if (activeTab !== 'sensors') return;
    const canvas = sensorChartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const padL = 45;
    const padR = 25;
    const padT = 35;
    const padB = 40;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const maxVal = 16;
    const timeInstants = [1, 2, 3, 4];

    // Grid lines horizontal
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let v = 0; v <= maxVal; v += 4) {
      const y = padT + plotH - (v / maxVal) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();

      ctx.fillStyle = isLight ? '#6B7280' : 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px monospace';
      ctx.fillText(String(v), padL - 24, y + 3);
    }

    // Grid lines vertical (t1, t2, t3, t4)
    timeInstants.forEach((t, i) => {
      const x = padL + (i / 3) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = isLight ? '#374151' : 'rgba(255, 255, 255, 0.75)';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`t${t}`, x - 7, padT + plotH + 18);
    });

    // Axis label
    ctx.fillStyle = isLight ? '#6B7280' : 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px sans-serif';
    ctx.fillText('Displacement Amplitude (mm)', padL, padT - 12);

    // Helper: Draw Sensor Line
    const drawTrace = (readings, color, label) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.8;

      ctx.beginPath();
      readings.forEach((val, i) => {
        const x = padL + (i / 3) * plotW;
        const y = padT + plotH - (val / maxVal) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Points
      readings.forEach((val, i) => {
        const x = padL + (i / 3) * plotW;
        const y = padT + plotH - (val / maxVal) * plotH;
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Label at last point
      const lastX = padL + plotW;
      const lastY = padT + plotH - (readings[3] / maxVal) * plotH;
      ctx.font = 'bold 11px var(--font-mono), monospace';
      ctx.fillText(label, lastX - 52, lastY - 8);
      ctx.restore();
    };

    // Draw Sensor 1 (Blue)
    drawTrace(s1Readings, '#3B82F6', 'S₁');
    // Draw Sensor 2 (Emerald)
    drawTrace(s2Readings, '#10B981', 'S₂ = 2S₁');
    // Draw Sensor 3 (Coral/Orange)
    drawTrace(s3Readings, '#F59E0B', 'S₃');
  }, [activeTab, s1Readings, s2Readings, s3Readings, isLight]);

  // =========================================================================
  // RENDER INTERACTION
  // =========================================================================
  return (
    <div className="math-step-view" style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.25rem 1rem' }}>
      {/* 1. STANDARDIZED HEADER */}
      <div className="step-header-box" style={{ marginBottom: '1rem', padding: '0.95rem 1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <h2 className="step-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Binary size={22} style={{ color: 'var(--accent-primary, #C59B67)' }} />
            <span>Rank of a Matrix — Information Redundancy in Images &amp; Physics</span>
          </h2>
          <span className="badge-tag-mini" style={{ fontSize: '0.74rem', padding: '0.18rem 0.55rem' }}>
            Module II: Intermediate
          </span>
        </div>

        <p className="step-description" style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
          <strong>Central Idea:</strong> Three images or sensors do not necessarily contain three independent pieces of information.
          If some images can be constructed from others via linear combinations, they are <em>redundant</em>.
          Discover matrix rank geometrically through pixel arrays, missing image reconstruction, realistic photograph lighting, 2D force vectors, and multi-sensor signal processing.
        </p>

        {/* 5 SUB-CHAPTER NAVIGATION TABS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('same-info')}
            className={`sub-chapter-pill ${activeTab === 'same-info' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Layers size={14} />
            <span>1. 3 Scaled Images (Rank = 1)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reconstruct')}
            className={`sub-chapter-pill ${activeTab === 'reconstruct' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sparkles size={14} />
            <span>2. Reconstruct Missing Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('real-photos')}
            className={`sub-chapter-pill ${activeTab === 'real-photos' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Upload size={14} />
            <span>3. Real Photos &amp; Lighting</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('forces')}
            className={`sub-chapter-pill ${activeTab === 'forces' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Compass size={14} />
            <span>4. Physics 1: Force Vectors</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sensors')}
            className={`sub-chapter-pill ${activeTab === 'sensors' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Activity size={14} />
            <span>5. Physics 2: Sensor Signals</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: THREE IMAGES CONTAINING THE SAME INFORMATION */}
      {/* ========================================================================= */}
      {activeTab === 'same-info' && (
        <div className="step19-workbench">
          {/* Left Column: Interactive Image Controls & Mathematical Deduction */}
          <div className="step19-left-col">
            <div className="step19-card">
              <div className="step19-card-header">
                <h3 className="step19-card-title">
                  <Layers size={16} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>Activity 1: Redundancy in 2×2 Grayscale Images</span>
                </h3>
                <span className="step19-badge">A = [40 80; 120 160]</span>
              </div>

              <p className="step19-desc">
                Consider image <strong>A</strong> represented by a 2×2 pixel intensity matrix.
                Image <strong>B = 2A</strong> and <strong>C = 3A</strong> are simple scalar multiples.
                Because knowing image A is completely enough to construct B and C, they share the exact same underlying pattern!
              </p>

              {/* Sliders for Scalers kB and kC */}
              <div className="step19-params-box">
                <div className="step19-slider-row">
                  <div className="step19-slider-header">
                    <span className="step19-slider-label">Scalar Multiplier for B (B = k_B · A)</span>
                    <span className="step19-slider-val">{scaleB.toFixed(1)}×</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4.0"
                    step="0.1"
                    value={scaleB}
                    onChange={(e) => setScaleB(parseFloat(e.target.value))}
                    className="step19-range-input"
                    style={{ '--slider-pct': getSliderPct(scaleB, 0.5, 4.0) }}
                  />
                </div>

                <div className="step19-slider-row">
                  <div className="step19-slider-header">
                    <span className="step19-slider-label">Scalar Multiplier for C (C = k_C · A)</span>
                    <span className="step19-slider-val">{scaleC.toFixed(1)}×</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={scaleC}
                    onChange={(e) => setScaleC(parseFloat(e.target.value))}
                    className="step19-range-input"
                    style={{ '--slider-pct': getSliderPct(scaleC, 0.5, 5.0) }}
                  />
                </div>
              </div>

              {/* Cell Value Tweaker for Matrix A */}
              <div style={{ marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Interactive Matrix A Elements:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.35rem' }}>
                  {[
                    { r: 0, c: 0, label: 'A₁₁' },
                    { r: 0, c: 1, label: 'A₁₂' },
                    { r: 1, c: 0, label: 'A₂₁' },
                    { r: 1, c: 1, label: 'A₂₂' }
                  ].map(({ r, c, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '0.35rem 0.55rem', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{label}:</span>
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={matA[r][c]}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0));
                          setMatA(prev => {
                            const next = prev.map(row => [...row]);
                            next[r][c] = val;
                            return next;
                          });
                        }}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset to textbook values */}
              <button
                type="button"
                onClick={() => {
                  setMatA([[40, 80], [120, 160]]);
                  setScaleB(2.0);
                  setScaleC(3.0);
                  setTab1IsFreeMode(false);
                }}
                className="step19-btn-secondary"
                style={{ alignSelf: 'flex-start', marginTop: '0.2rem' }}
              >
                <RotateCcw size={12} />
                <span>Reset to Textbook Spec (A, 2A, 3A)</span>
              </button>
            </div>

            {/* Rank Deduction Card */}
            <div className="step19-card">
              <div className="step19-card-header">
                <h4 className="step19-card-title">
                  <Binary size={15} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>Mathematical Rank Determination</span>
                </h4>
                <span className={`step19-status-pill ${tab1RankResult.rank === 1 ? 'redundant' : 'independent'}`}>
                  Rank(M) = {tab1RankResult.rank} {tab1RankResult.rank === 1 ? '(Linearly Dependent)' : '(Full Rank)'}
                </span>
              </div>

              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 0.4rem 0' }}>
                  Convert each 2×2 image matrix into a 4×1 column vector:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '0.6rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                    vec(A) = [{vecA.join(', ')}]ᵀ
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                    vec(B) = [{vecB.join(', ')}]ᵀ
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                    vec(C) = [{vecC.join(', ')}]ᵀ
                  </div>
                </div>

                <p style={{ margin: '0 0 0.4rem 0' }}>
                  Construct the 4×3 image collection matrix <strong>M = [ A | B | C ]</strong>:
                </p>

                <div style={{ background: 'var(--bg-secondary)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', overflowX: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                    <span>M = </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 48px)', gap: '0.2rem', textAlign: 'right', borderLeft: '2px solid var(--text-primary)', borderRight: '2px solid var(--text-primary)', padding: '0.2rem 0.4rem' }}>
                      {matrixM4x3.map((row, rIdx) => (
                        <React.Fragment key={rIdx}>
                          {row.map((val, cIdx) => (
                            <span key={cIdx} style={{ color: cIdx === 0 ? 'var(--accent-primary, #C59B67)' : 'var(--text-primary)' }}>
                              {val}
                            </span>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.7rem', borderRadius: 6, background: tab1RankResult.rank === 1 ? 'rgba(217, 119, 6, 0.08)' : 'rgba(59, 130, 246, 0.08)', border: `1px solid ${tab1RankResult.rank === 1 ? 'rgba(217, 119, 6, 0.25)' : 'rgba(59, 130, 246, 0.25)'}` }}>
                  <div style={{ fontWeight: 600, color: tab1RankResult.rank === 1 ? '#D97706' : '#3B82F6', marginBottom: '0.2rem' }}>
                    {tab1RankResult.rank === 1
                      ? '⚡ Redundant Information Confirmed (Rank = 1)'
                      : `Independent Information Detected (Rank = ${tab1RankResult.rank})`}
                  </div>
                  <span>
                    {tab1RankResult.rank === 1
                      ? 'Columns 2 and 3 are exact scalar multiples of Column 1. Row reduction leaves exactly 1 non-zero pivot column. The 3 images contain only 1 independent piece of visual information!'
                      : 'The columns cannot be reduced to a single vector; the images contain multiple independent spatial modes.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Render of the 3 Images Side-by-Side */}
          <div className="step19-right-col">
            <div className="step19-card">
              <div className="step19-card-header">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Visualizing the Three 2×2 Grayscale Images
                </span>
                <span className="step19-badge">Order: 2×2 Pixels</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', margin: '0.4rem 0' }}>
                {/* Image A */}
                <div className="step19-image-card">
                  <div className="step19-image-card-title">
                    <span>Image A (Base)</span>
                    <span className="step19-mini-tag">Reference</span>
                  </div>
                  <div className="step19-pixel-grid-2x2">
                    {matA.map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`a-${r}-${c}`}
                          className="step19-pixel-cell"
                          style={{ backgroundColor: `rgb(${val}, ${val}, ${val})`, color: val > 128 ? '#000' : '#fff' }}
                        >
                          <span className="step19-pixel-num">{val}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="step19-image-card-footer">
                    <span>vec(A) = [{vecA.join(', ')}]ᵀ</span>
                  </div>
                </div>

                {/* Image B = 2A */}
                <div className="step19-image-card">
                  <div className="step19-image-card-title">
                    <span>Image B ({scaleB.toFixed(1)}× A)</span>
                    <span className="step19-mini-tag" style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#D97706' }}>
                      Redundant
                    </span>
                  </div>
                  <div className="step19-pixel-grid-2x2">
                    {matB.map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`b-${r}-${c}`}
                          className="step19-pixel-cell"
                          style={{ backgroundColor: `rgb(${Math.min(255, val)}, ${Math.min(255, val)}, ${Math.min(255, val)})`, color: val > 128 ? '#000' : '#fff' }}
                        >
                          <span className="step19-pixel-num">{val}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="step19-image-card-footer">
                    <span>vec(B) = {scaleB.toFixed(1)} × vec(A)</span>
                  </div>
                </div>

                {/* Image C = 3A */}
                <div className="step19-image-card">
                  <div className="step19-image-card-title">
                    <span>Image C ({scaleC.toFixed(1)}× A)</span>
                    <span className="step19-mini-tag" style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#D97706' }}>
                      Redundant
                    </span>
                  </div>
                  <div className="step19-pixel-grid-2x2">
                    {matC.map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`c-${r}-${c}`}
                          className="step19-pixel-cell"
                          style={{ backgroundColor: `rgb(${Math.min(255, val)}, ${Math.min(255, val)}, ${Math.min(255, val)})`, color: val > 128 ? '#000' : '#fff' }}
                        >
                          <span className="step19-pixel-num">{val}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="step19-image-card-footer">
                    <span>vec(C) = {scaleC.toFixed(1)} × vec(A)</span>
                  </div>
                </div>
              </div>

              {/* Intuitive Message Banner */}
              <div className="step19-message-box">
                <Info size={18} style={{ flexShrink: 0, color: 'var(--accent-primary, #C59B67)' }} />
                <div style={{ fontSize: '0.78rem', lineHeight: 1.45 }}>
                  <strong>Key Takeaway:</strong> Even though we have 3 distinct images and a total of 12 numbers in the 4×3 matrix,
                  every pixel in B and C is just a multiplied version of A.
                  <strong> The rank of this image collection is 1.</strong>
                  Knowing Image A alone allows complete reconstruction of B and C without any loss of information!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: RECONSTRUCT THE MISSING IMAGE (C = 2A + B) */}
      {/* ========================================================================= */}
      {activeTab === 'reconstruct' && (
        <div className="step19-workbench">
          {/* Left Column: Challenge & Reconstructor Controls */}
          <div className="step19-left-col">
            <div className="step19-card">
              <div className="step19-card-header">
                <h3 className="step19-card-title">
                  <Sparkles size={16} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>Activity 2: Reconstruct the Missing Image C</span>
                </h3>
                <span className="step19-badge">Given: C = 2A + B</span>
              </div>

              <p className="step19-desc">
                Images <strong>A</strong> and <strong>B</strong> are shown on the right, but Image <strong>C</strong> is hidden.
                Use matrix addition and scalar multiplication to reconstruct C. Adjust the coefficients <strong>c₁</strong> and <strong>c₂</strong> until your reconstructed image matches the target.
              </p>

              {/* Interactive Reconstruction Sliders */}
              <div className="step19-params-box">
                <div className="step19-slider-row">
                  <div className="step19-slider-header">
                    <span className="step19-slider-label">Weight for Image A (c₁)</span>
                    <span className="step19-slider-val">{coeffA.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4.0"
                    step="0.05"
                    value={coeffA}
                    onChange={(e) => setCoeffA(parseFloat(e.target.value))}
                    className="step19-range-input"
                    style={{ '--slider-pct': getSliderPct(coeffA, 0, 4.0) }}
                  />
                </div>

                <div className="step19-slider-row">
                  <div className="step19-slider-header">
                    <span className="step19-slider-label">Weight for Image B (c₂)</span>
                    <span className="step19-slider-val">{coeffB.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3.0"
                    step="0.05"
                    value={coeffB}
                    onChange={(e) => setCoeffB(parseFloat(e.target.value))}
                    className="step19-range-input"
                    style={{ '--slider-pct': getSliderPct(coeffB, 0, 3.0) }}
                  />
                </div>

                {/* Match Meter */}
                <div style={{ marginTop: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Reconstruction Match Fidelity:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isTab2Matched ? '#10B981' : '#F59E0B' }}>
                      {tab2Fidelity}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 7, borderRadius: 9999, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${tab2Fidelity}%`,
                        height: '100%',
                        background: isTab2Matched ? '#10B981' : 'linear-gradient(90deg, #F59E0B, #10B981)',
                        transition: 'width 0.15s ease'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Match Banner */}
              {isTab2Matched ? (
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.78rem', color: '#10B981', lineHeight: 1.4 }}>
                    <strong>Target Image C Successfully Reconstructed!</strong><br />
                    Formula validated: C = 2A + 1B. Image C lies fully in the linear span of A and B!
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCoeffA(2.0);
                      setCoeffB(1.0);
                      setTab2Perturbation(0);
                    }}
                    className="step19-btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    Auto-Solve (c₁ = 2, c₂ = 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab2Revealed(prev => !prev)}
                    className="step19-btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    {tab2Revealed ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{tab2Revealed ? 'Hide Target C' : 'Peek at Target C'}</span>
                  </button>
                </div>
              )}

              {/* Central Message Panel from Page 2 */}
              <div style={{ marginTop: '0.4rem', padding: '0.75rem 0.9rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary, #C59B67)', fontWeight: 700 }}>
                  Central Linear Algebra Message:
                </span>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.80rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                  "If a new image can be generated from existing images through linear combinations, it does NOT increase the rank of the image collection."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.45rem', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  <span>Rank([A | B]) = <strong>{tab2RankResult.rank2}</strong></span>
                  <span>→</span>
                  <span>Rank([A | B | C = 2A+B]) = <strong>{tab2RankResult.rank3}</strong> (Rank unchanged!)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Comparison of A, B, Reconstructed C, and Hidden Target C */}
          <div className="step19-right-col">
            <div className="step19-card">
              <div className="step19-card-header">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Linear Combination Assembly
                </span>
                <span className="step19-badge">
                  C = {coeffA.toFixed(1)}·A + {coeffB.toFixed(1)}·B
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', margin: '0.4rem 0' }}>
                {/* Image A */}
                <div className="step19-image-card">
                  <div className="step19-image-card-title">
                    <span>Image A</span>
                    <span className="step19-mini-tag">{coeffA.toFixed(1)}×</span>
                  </div>
                  <div className="step19-pixel-grid-2x2">
                    {baseImgA.map((row, r) =>
                      row.map((val, c) => (
                        <div key={`ta-${r}-${c}`} className="step19-pixel-cell" style={{ backgroundColor: `rgb(${val}, ${val}, ${val})`, color: val > 128 ? '#000' : '#fff' }}>
                          <span className="step19-pixel-num">{val}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Image B */}
                <div className="step19-image-card">
                  <div className="step19-image-card-title">
                    <span>Image B</span>
                    <span className="step19-mini-tag">{coeffB.toFixed(1)}×</span>
                  </div>
                  <div className="step19-pixel-grid-2x2">
                    {baseImgB.map((row, r) =>
                      row.map((val, c) => (
                        <div key={`tb-${r}-${c}`} className="step19-pixel-cell" style={{ backgroundColor: `rgb(${val}, ${val}, ${val})`, color: val > 128 ? '#000' : '#fff' }}>
                          <span className="step19-pixel-num">{val}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Candidate Image C */}
                <div className="step19-image-card" style={{ border: isTab2Matched ? '2px solid #10B981' : '1px solid var(--border-color)' }}>
                  <div className="step19-image-card-title">
                    <span>Reconstructed C</span>
                    <span className="step19-mini-tag" style={{ background: isTab2Matched ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isTab2Matched ? '#10B981' : '#F59E0B' }}>
                      {tab2Fidelity}% Match
                    </span>
                  </div>
                  <div className="step19-pixel-grid-2x2">
                    {candImgC.map((row, r) =>
                      row.map((val, c) => (
                        <div key={`tc-${r}-${c}`} className="step19-pixel-cell" style={{ backgroundColor: `rgb(${Math.min(255, val)}, ${Math.min(255, val)}, ${Math.min(255, val)})`, color: val > 128 ? '#000' : '#fff' }}>
                          <span className="step19-pixel-num">{val}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Mystery Target C */}
                <div className="step19-image-card" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div className="step19-image-card-title">
                    <span>Target C (Hidden)</span>
                    <span className="step19-mini-tag">Goal</span>
                  </div>
                  <div className="step19-pixel-grid-2x2">
                    {targetImgC.map((row, r) =>
                      row.map((val, c) => (
                        <div key={`tt-${r}-${c}`} className="step19-pixel-cell" style={{ backgroundColor: `rgb(${Math.min(255, val)}, ${Math.min(255, val)}, ${Math.min(255, val)})`, color: val > 128 ? '#000' : '#fff' }}>
                          <span className="step19-pixel-num">{val}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Frosted glass cover if not matched and not peeked */}
                  {!isTab2Matched && !tab2Revealed && (
                    <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(8px)', background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(20, 24, 30, 0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', zIndex: 5 }}>
                      <Lock size={20} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Hidden Target C
                      </span>
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                        Match c₁=2, c₂=1 to reveal
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Experiment: Break linear dependence */}
              <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Experiment: What if C contains non-linear information?
                    </span>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Add a unique independent perturbation to pixel C₂₂:
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setTab2Perturbation(prev => prev === 0 ? 50 : 0)}
                      className={`step19-btn-secondary ${tab2Perturbation !== 0 ? 'active' : ''}`}
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                    >
                      {tab2Perturbation === 0 ? 'Inject +50 Noise to C' : 'Remove Noise'}
                    </button>
                  </div>
                </div>
                {tab2Perturbation !== 0 && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#3B82F6', fontWeight: 600 }}>
                    ⚡ C now contains unique information not constructible from A &amp; B!
                    Rank increases from 2 to <strong>{tab2RankResult.rank3}</strong>!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: REAL PHOTOS & LIGHTING (EXACT VS APPROXIMATE DEPENDENCE) */}
      {/* ========================================================================= */}
      {activeTab === 'real-photos' && (
        <div className="step19-workbench">
          {/* Left Column: Preset controls & SVD Analysis */}
          <div className="step19-left-col">
            <div className="step19-card">
              <div className="step19-card-header">
                <h3 className="step19-card-title">
                  <Upload size={16} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>Activity 3: Lighting Conditions &amp; SVD Rank</span>
                </h3>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={() => setPhotoResolution(8)}
                    className={`step19-btn-secondary ${photoResolution === 8 ? 'active' : ''}`}
                    style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                  >
                    8×8 (64 Dims)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoResolution(16)}
                    className={`step19-btn-secondary ${photoResolution === 16 ? 'active' : ''}`}
                    style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                  >
                    16×16 (256 Dims)
                  </button>
                </div>
              </div>

              <p className="step19-desc">
                Investigate three photographs taken under different lighting conditions (e.g. morning, ambient noon, afternoon sun).
                Are images taken under different lighting <strong>exactly dependent</strong> or <strong>approximately dependent</strong>?
              </p>

              {/* Preset Selector */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'flower', label: '🌸 Flower (3 Lighting Presets)' },
                  { id: 'tree', label: '🌲 Tree Foliage (Shade Variations)' },
                  { id: 'independent', label: '💠 3 Distinct Objects (Rank = 3)' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPhotoPreset(p.id);
                    }}
                    className={`step19-pill-btn ${photoPreset === p.id ? 'active' : ''}`}
                    style={{ fontSize: '0.74rem' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Upload Option */}
              <div style={{ marginTop: '0.45rem', padding: '0.55rem 0.75rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Upload Your Own 3 Photographs:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.35rem' }}>
                  {[0, 1, 2].map((slot) => (
                    <label key={slot} className="step19-upload-label">
                      <Upload size={12} />
                      <span>Photo {slot + 1}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, slot)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* SVD Singular Values Spectrum */}
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Singular Value Spectrum (σ₁, σ₂, σ₃) &amp; Energy Distribution:
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                  {photoSvdResult.singularValues.map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.74rem' }}>
                      <span style={{ width: 28, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>σ_{idx + 1}:</span>
                      <div style={{ flex: 1, height: 8, background: 'var(--bg-secondary)', borderRadius: 9999, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${photoSvdResult.energyPercentages[idx].toFixed(1)}%`,
                            height: '100%',
                            background: idx === 0 ? 'var(--accent-primary, #C59B67)' : idx === 1 ? '#3B82F6' : '#10B981'
                          }}
                        />
                      </div>
                      <span style={{ width: 85, fontFamily: 'var(--font-mono)', textAlign: 'right', color: 'var(--text-primary)' }}>
                        {s.toFixed(1)} ({photoSvdResult.energyPercentages[idx].toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pairwise Cosine Similarity */}
              <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.74rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Pairwise Image Cosine Similarities:
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                  <span>Sim(1, 2): <strong>{photoSvdResult.cosineSimilarity[0][1].toFixed(3)}</strong></span>
                  <span>Sim(1, 3): <strong>{photoSvdResult.cosineSimilarity[0][2].toFixed(3)}</strong></span>
                  <span>Sim(2, 3): <strong>{photoSvdResult.cosineSimilarity[1][2].toFixed(3)}</strong></span>
                </div>
              </div>
            </div>

            {/* Scientific Conclusion Card */}
            <div className="step19-card">
              <div className="step19-card-header">
                <h4 className="step19-card-title">
                  <Info size={15} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>Investigation Outcome</span>
                </h4>
                <span className={`step19-status-pill ${photoSvdResult.energyPercentages[0] > 85 ? 'approx' : 'independent'}`}>
                  {photoSvdResult.energyPercentages[0] > 85 ? 'Approximately Dependent (Low Rank)' : 'Linearly Independent (Rank = 3)'}
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {photoSvdResult.energyPercentages[0] > 85 ? (
                  <p style={{ margin: 0 }}>
                    <strong>Conclusion:</strong> Real photographs taken under varied lighting are <strong>approximately dependent (effective rank ≈ 1)</strong>, not mathematically exact duplicates.
                    The first singular value σ₁ captures <strong>{photoSvdResult.energyPercentages[0].toFixed(1)}% of total image variance</strong>.
                    Lighting changes primarily act as scalar illumination shifts across the fixed physical geometry!
                  </p>
                ) : (
                  <p style={{ margin: 0 }}>
                    <strong>Conclusion:</strong> These images depict independent objects/textures.
                    The singular values remain spread across all dimensions, giving a <strong>full rank of 3</strong> with no redundancy.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Visual Render of the 3 Photographs & Pixel Grids */}
          <div className="step19-right-col">
            <div className="step19-card">
              <div className="step19-card-header">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Image Previews &amp; Downsampled Numerical Vectors
                </span>
                <span className="step19-badge">{photoPreset.toUpperCase()}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', margin: '0.4rem 0' }}>
                {[
                  { title: 'Photograph 1 (Lighting A)', vec: photoVectors[0] },
                  { title: 'Photograph 2 (Lighting B)', vec: photoVectors[1] },
                  { title: 'Photograph 3 (Lighting C)', vec: photoVectors[2] }
                ].map(({ title, vec }, idx) => (
                  <div key={idx} className="step19-image-card">
                    <div className="step19-image-card-title">
                      <span>{title}</span>
                      <span className="step19-mini-tag">Photo {idx + 1}</span>
                    </div>

                    {/* Canvas render of downsampled photo */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '0.4rem 0' }}>
                      <canvas
                        ref={(node) => {
                          if (!node) return;
                          const size = photoResolution;
                          node.width = size;
                          node.height = size;
                          const ctx = node.getContext('2d');
                          const imgData = ctx.createImageData(size, size);
                          for (let i = 0; i < size * size; i++) {
                            const val = vec[i] || 0;
                            imgData.data[i * 4] = val;
                            imgData.data[i * 4 + 1] = val;
                            imgData.data[i * 4 + 2] = val;
                            imgData.data[i * 4 + 3] = 255;
                          }
                          ctx.putImageData(imgData, 0, 0);
                        }}
                        style={{
                          width: '120px',
                          height: '120px',
                          imageRendering: 'pixelated',
                          borderRadius: 8,
                          border: '1px solid var(--border-color)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      />
                    </div>

                    <div className="step19-image-card-footer">
                      <span>Norm ‖v_{idx + 1}‖ = {Math.round(Math.hypot(...vec))}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Matrix M Explanation */}
              <div className="step19-message-box">
                <Binary size={18} style={{ flexShrink: 0, color: 'var(--accent-primary, #C59B67)' }} />
                <div style={{ fontSize: '0.76rem', lineHeight: 1.45 }}>
                  The 3 photos are unrolled into a <strong>{photoResolution * photoResolution} × 3 matrix M</strong>.
                  Because the ratio between σ₁ and σ₂ is high, this image collection can be compressed with minimal loss via rank-1 approximation.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: PHYSICS 1 — MULTIPLE FORCES AND INDEPENDENT DIRECTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'forces' && (
        <div className="step19-workbench">
          {/* Left Column: Force Controls & Minors */}
          <div className="step19-left-col">
            <div className="step19-card">
              <div className="step19-card-header">
                <h3 className="step19-card-title">
                  <Compass size={16} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>Physics Example 1: Forces in a 2D Plane</span>
                </h3>
                <span className="step19-badge">F = [F₁ F₂ F₃] (2×3)</span>
              </div>

              <p className="step19-desc">
                Consider three forces acting on an object in a plane.
                As given in the textbook: <strong>F₁ = [2; 1]</strong>, <strong>F₂ = [4; 2]</strong>, and <strong>F₃ = [1; 3]</strong>.
                Here, <strong>F₂ = 2F₁</strong>, so the first two forces lie along the exact same line. The third force points in an independent direction.
              </p>

              {/* Force Value Controls */}
              <div className="step19-params-box">
                {/* Force 1 */}
                <div style={{ marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 600, color: '#F59E0B' }}>
                    <span>Force F₁ Vector (Amber)</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>[{f1[0].toFixed(1)}, {f1[1].toFixed(1)}]ᵀ</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <div className="step19-subslider">
                      <span className="step19-subslider-lbl">F₁x:</span>
                      <input
                        type="range"
                        min="-2"
                        max="6"
                        step="0.5"
                        value={f1[0]}
                        onChange={(e) => setF1([parseFloat(e.target.value), f1[1]])}
                        className="step19-range-input"
                        style={{ '--slider-pct': getSliderPct(f1[0], -2, 6) }}
                      />
                    </div>
                    <div className="step19-subslider">
                      <span className="step19-subslider-lbl">F₁y:</span>
                      <input
                        type="range"
                        min="-2"
                        max="6"
                        step="0.5"
                        value={f1[1]}
                        onChange={(e) => setF1([f1[0], parseFloat(e.target.value)])}
                        className="step19-range-input"
                        style={{ '--slider-pct': getSliderPct(f1[1], -2, 6) }}
                      />
                    </div>
                  </div>
                </div>

                {/* Force 2 */}
                <div style={{ marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 600, color: '#D97706' }}>
                    <span>Force F₂ Vector (Orange)</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>[{f2[0].toFixed(1)}, {f2[1].toFixed(1)}]ᵀ</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <div className="step19-subslider">
                      <span className="step19-subslider-lbl">F₂x:</span>
                      <input
                        type="range"
                        min="-2"
                        max="8"
                        step="0.5"
                        value={f2[0]}
                        onChange={(e) => setF2([parseFloat(e.target.value), f2[1]])}
                        className="step19-range-input"
                        style={{ '--slider-pct': getSliderPct(f2[0], -2, 8) }}
                      />
                    </div>
                    <div className="step19-subslider">
                      <span className="step19-subslider-lbl">F₂y:</span>
                      <input
                        type="range"
                        min="-2"
                        max="8"
                        step="0.5"
                        value={f2[1]}
                        onChange={(e) => setF2([f2[0], parseFloat(e.target.value)])}
                        className="step19-range-input"
                        style={{ '--slider-pct': getSliderPct(f2[1], -2, 8) }}
                      />
                    </div>
                  </div>
                </div>

                {/* Force 3 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 600, color: '#3B82F6' }}>
                    <span>Force F₃ Vector (Blue)</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>[{f3[0].toFixed(1)}, {f3[1].toFixed(1)}]ᵀ</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <div className="step19-subslider">
                      <span className="step19-subslider-lbl">F₃x:</span>
                      <input
                        type="range"
                        min="-2"
                        max="6"
                        step="0.5"
                        value={f3[0]}
                        onChange={(e) => setF3([parseFloat(e.target.value), f3[1]])}
                        className="step19-range-input"
                        style={{ '--slider-pct': getSliderPct(f3[0], -2, 6) }}
                      />
                    </div>
                    <div className="step19-subslider">
                      <span className="step19-subslider-lbl">F₃y:</span>
                      <input
                        type="range"
                        min="-2"
                        max="6"
                        step="0.5"
                        value={f3[1]}
                        onChange={(e) => setF3([f3[0], parseFloat(e.target.value)])}
                        className="step19-range-input"
                        style={{ '--slider-pct': getSliderPct(f3[1], -2, 6) }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Force Presets */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setF1([2.0, 1.0]);
                    setF2([4.0, 2.0]);
                    setF3([1.0, 3.0]);
                  }}
                  className="step19-btn-secondary"
                  style={{ fontSize: '0.72rem' }}
                >
                  Textbook Spec: F₂ = 2F₁ (Rank 2)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setF1([2.0, 1.0]);
                    setF2([4.0, 2.0]);
                    setF3([-2.0, -1.0]);
                  }}
                  className="step19-btn-secondary"
                  style={{ fontSize: '0.72rem' }}
                >
                  All 3 Collinear (Rank 1)
                </button>
              </div>
            </div>

            {/* Matrix & Rank Analysis Card */}
            <div className="step19-card">
              <div className="step19-card-header">
                <h4 className="step19-card-title">
                  <Binary size={15} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>Matrix Representation &amp; Rank</span>
                </h4>
                <span className={`step19-status-pill ${forceRankResult.rank === 1 ? 'redundant' : 'independent'}`}>
                  Rank(F) = {forceRankResult.rank} / 2
                </span>
              </div>

              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>
                  <span>F = </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: '0.2rem', textAlign: 'center', borderLeft: '2px solid var(--text-primary)', borderRight: '2px solid var(--text-primary)', padding: '0.2rem 0.3rem' }}>
                    <span>{f1[0]}</span><span>{f2[0]}</span><span>{f3[0]}</span>
                    <span>{f1[1]}</span><span>{f2[1]}</span><span>{f3[1]}</span>
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0.5rem', borderRadius: 4, background: collinearF1F2.isCollinear ? 'rgba(217, 119, 6, 0.12)' : 'var(--bg-secondary)' }}>
                    <span>Collinearity Check (F₁ &amp; F₂):</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: collinearF1F2.isCollinear ? '#D97706' : 'var(--text-primary)' }}>
                      det([F₁, F₂]) = {collinearF1F2.det.toFixed(2)} {collinearF1F2.isCollinear ? '→ Collinear (Same Line!)' : '→ Independent'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0.5rem', borderRadius: 4, background: 'var(--bg-secondary)' }}>
                    <span>Max Possible Rank in 2D Space:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      dim(ℝ²) = 2
                    </span>
                  </div>
                </div>

                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.74rem' }}>
                  <strong>Key Physical Insight:</strong> In a 2D plane, any set of 3 or more vectors is guaranteed to be linearly dependent.
                  Even though three forces act on the object, they can only span at most 2 independent directions!
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 2D Coordinate Plane Canvas */}
          <div className="step19-right-col">
            <div className="step19-card">
              <div className="step19-card-header">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  2D Vector Plane Visualization
                </span>
                <span className="step19-badge">
                  {collinearF1F2.isCollinear ? 'F₁ & F₂ Collinear along ray' : 'F₁, F₂, F₃ span ℝ²'}
                </span>
              </div>

              <div className="step19-canvas-frame">
                <canvas ref={forceCanvasRef} width={560} height={380} />
              </div>

              <div className="step19-legend-bar">
                <span className="step19-legend-item">
                  <span className="step19-legend-dot" style={{ background: '#F59E0B' }} />
                  <span>Force F₁</span>
                </span>
                <span className="step19-legend-item">
                  <span className="step19-legend-dot" style={{ background: '#D97706' }} />
                  <span>Force F₂ {collinearF1F2.isCollinear ? '(Collinear)' : ''}</span>
                </span>
                <span className="step19-legend-item">
                  <span className="step19-legend-dot" style={{ background: '#3B82F6' }} />
                  <span>Force F₃ (Independent)</span>
                </span>
                {collinearF1F2.isCollinear && (
                  <span className="step19-legend-item">
                    <span style={{ width: 14, height: 2, borderTop: '2px dashed #D97706' }} />
                    <span>Collinear 1D Line</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: PHYSICS 2 — SENSORS MEASURING THE SAME PHYSICAL SIGNAL */}
      {/* ========================================================================= */}
      {activeTab === 'sensors' && (
        <div className="step19-workbench">
          {/* Left Column: Sensor Signal Controls & Matrix S */}
          <div className="step19-left-col">
            <div className="step19-card">
              <div className="step19-card-header">
                <h3 className="step19-card-title">
                  <Activity size={16} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>Physics Example 2: Multi-Sensor Signal Processing</span>
                </h3>
                <span className="step19-badge">Matrix S (4×3)</span>
              </div>

              <p className="step19-desc">
                Imagine three sensors measuring the displacement of an oscillating object at four time instants:
                <strong> S₁ = [1, 2, 3, 4]ᵀ</strong>, <strong> S₂ = [2, 4, 6, 8]ᵀ</strong>, and <strong> S₃ = [3, 6, 9, 12]ᵀ</strong>.
                Because <strong>S₂ = 2S₁</strong> and <strong>S₃ = 3S₁</strong>, <strong>rank(S) = 1</strong>: all three sensors measure the exact same physical displacement!
              </p>

              {/* Sensor Presets */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'redundant', label: '1. Redundant Sensors (S₃ = 3S₁, Rank 1)' },
                  { id: 'phase-shift', label: '2. Out-of-Phase Signal (Rank 2)' },
                  { id: 'drift', label: '3. Sensor Thermal Drift (Rank 2)' },
                  { id: 'noise', label: '4. Sensor Noise (Rank 3)' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSensorPresetChange(p.id)}
                    className={`step19-pill-btn ${sensorPreset === p.id ? 'active' : ''}`}
                    style={{ fontSize: '0.72rem' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Sliders for Sensor 3 readings */}
              <div className="step19-params-box" style={{ marginTop: '0.45rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#F59E0B' }}>
                  Interactive Sensor 3 Readings S₃(t) — Does Rank Increase?
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', marginTop: '0.35rem' }}>
                  {[0, 1, 2, 3].map((tIdx) => (
                    <div key={tIdx} className="step19-subslider">
                      <span className="step19-subslider-lbl">t{tIdx + 1}:</span>
                      <input
                        type="range"
                        min="0"
                        max="16"
                        step="0.5"
                        value={s3Readings[tIdx]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setS3Readings(prev => {
                            const next = [...prev];
                            next[tIdx] = val;
                            return next;
                          });
                          setSensorPreset('custom');
                        }}
                        className="step19-range-input"
                        style={{ '--slider-pct': getSliderPct(s3Readings[tIdx], 0, 16) }}
                      />
                      <span style={{ width: 28, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                        {s3Readings[tIdx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical Vibration Animation Widget */}
              <div style={{ marginTop: '0.4rem', padding: '0.55rem 0.8rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {/* Vibrating Mass Graphic */}
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.72rem', transform: `translateY(${Math.sin(oscillationTime) * 6}px)`, transition: 'transform 0.05s linear' }}>
                    m
                  </div>
                  <div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Physical Oscillator Simulator
                    </span>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {isOscillating ? 'Harmonic vibration active' : 'Paused'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOscillating(prev => !prev)}
                  className="step19-btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                >
                  {isOscillating ? 'Pause' : 'Resume'}
                </button>
              </div>
            </div>

            {/* Matrix S & Signal Diagnosis */}
            <div className="step19-card">
              <div className="step19-card-header">
                <h4 className="step19-card-title">
                  <Binary size={15} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                  <span>Sensor Matrix S &amp; Signal Dimensionality</span>
                </h4>
                <span className={`step19-status-pill ${sensorRankResult.rank === 1 ? 'redundant' : sensorRankResult.rank === 2 ? 'independent' : 'approx'}`}>
                  Rank(S) = {sensorRankResult.rank} / 3
                </span>
              </div>

              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {/* 4x3 Matrix S */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>
                  <span>S = </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: '0.2rem', textAlign: 'center', borderLeft: '2px solid var(--text-primary)', borderRight: '2px solid var(--text-primary)', padding: '0.2rem 0.3rem' }}>
                    {matrixS4x3.map((row, r) => (
                      <React.Fragment key={r}>
                        <span style={{ color: '#3B82F6' }}>{row[0]}</span>
                        <span style={{ color: '#10B981' }}>{row[1]}</span>
                        <span style={{ color: '#F59E0B' }}>{row[2]}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Diagnostics Banner */}
                <div style={{ marginTop: '0.5rem', padding: '0.55rem 0.75rem', borderRadius: 6, background: sensorRankResult.rank === 1 ? 'rgba(217, 119, 6, 0.08)' : 'rgba(16, 185, 129, 0.08)', border: `1px solid ${sensorRankResult.rank === 1 ? 'rgba(217, 119, 6, 0.25)' : 'rgba(16, 185, 129, 0.25)'}` }}>
                  <div style={{ fontWeight: 600, color: sensorRankResult.rank === 1 ? '#D97706' : '#10B981', marginBottom: '0.2rem' }}>
                    {sensorRankResult.rank === 1 && '⚠️ 100% Sensor Redundancy (Rank = 1)'}
                    {sensorRankResult.rank === 2 && '✨ 2 Independent Physical Signals Detected (Rank = 2)'}
                    {sensorRankResult.rank === 3 && '📡 3 Independent Physical Signals / Noise (Rank = 3)'}
                  </div>
                  <span>
                    {sensorRankResult.rank === 1 && 'Sensors 2 and 3 merely amplify Sensor 1. No new physical information is gained by installing sensors 2 and 3!'}
                    {sensorRankResult.rank === 2 && 'Sensor 3 measures a distinct signal component (e.g. independent harmonic or temperature drift). The signal space has 2 degrees of freedom.'}
                    {sensorRankResult.rank === 3 && 'All three sensors are recording distinct physical modes or independent sensor noise.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Time-Series Multi-Line Chart Canvas */}
          <div className="step19-right-col">
            <div className="step19-card">
              <div className="step19-card-header">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Multi-Sensor Time-Series Traces (t₁, t₂, t₃, t₄)
                </span>
                <span className="step19-badge">Displacement vs Time</span>
              </div>

              <div className="step19-canvas-frame">
                <canvas ref={sensorChartCanvasRef} width={560} height={380} />
              </div>

              <div className="step19-legend-bar">
                <span className="step19-legend-item">
                  <span className="step19-legend-dot" style={{ background: '#3B82F6' }} />
                  <span>Sensor 1 (Base Signal)</span>
                </span>
                <span className="step19-legend-item">
                  <span className="step19-legend-dot" style={{ background: '#10B981' }} />
                  <span>Sensor 2 (2 × S₁)</span>
                </span>
                <span className="step19-legend-item">
                  <span className="step19-legend-dot" style={{ background: '#F59E0B' }} />
                  <span>Sensor 3 (Modified Signal)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STANDARDIZED EDUCATIONAL DOCUMENTATION */}
      <div style={{ marginTop: '1.25rem' }}>
        <ModuleDocumentation stepNumber={19} defaultOpen={false} />
      </div>

      {/* FOOTER NAVIGATION */}
      <StepFooter stepNumber={19} onSelectStep={onSelectStep} />
    </div>
  );
}
