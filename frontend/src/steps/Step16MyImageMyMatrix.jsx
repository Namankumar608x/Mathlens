import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Camera,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sun,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Sliders,
  Eye,
  Download,
  Info,
  Layers,
  FlipHorizontal,
  FlipVertical,
  Scissors,
  CheckCircle2,
  HelpCircle,
  Grid,
  Maximize2,
  ChevronRight,
  RefreshCw,
  Undo2,
  X,
  FileText
} from 'lucide-react';
import { clampPixel, createEmptyMatrix } from '../core/mathEngine';
import StepFooter from '../components/layout/StepFooter';

// Sample Presets for User Image
const SAMPLE_PRESETS = [
  { id: 'flower', name: 'Vibrant Flower', color: '#ec4899' },
  { id: 'portrait', name: 'Geometric Icon', color: '#3b82f6' },
  { id: 'city', name: 'Cyberpunk Grid', color: '#8b5cf6' },
  { id: 'spiral', name: 'Mathematical Spiral', color: '#10b981' }
];

// Draw procedural preset graphics onto an offscreen canvas
function drawPresetGraphic(ctx, presetId, size) {
  ctx.clearRect(0, 0, size, size);

  if (presetId === 'flower') {
    // Radial gradient background
    const bg = ctx.createRadialGradient(size / 2, size / 2, 5, size / 2, size / 2, size * 0.7);
    bg.addColorStop(0, '#134e4a');
    bg.addColorStop(1, '#022c22');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const petals = 6;
    for (let i = 0; i < petals; i++) {
      const a = (i * 2 * Math.PI) / petals;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.fillStyle = i % 2 === 0 ? '#f43f5e' : '#fb7185';
      ctx.beginPath();
      ctx.ellipse(0, size * 0.25, size * 0.12, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (presetId === 'portrait') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(1, '#6366f1');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.42, size * 0.24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#818cf8';
    ctx.beginPath();
    ctx.ellipse(size / 2, size * 0.88, size * 0.38, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (presetId === 'city') {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, size, size);

    // Neon grid lines
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= size; x += size / 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += size / 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    // Luminous glowing box
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(size * 0.25, size * 0.25, size * 0.5, size * 0.5);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(size * 0.38, size * 0.38, size * 0.24, size * 0.24);
  } else {
    // Spiral
    ctx.fillStyle = '#052e16';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = Math.max(2, size / 20);
    ctx.beginPath();
    for (let theta = 0; theta < 6 * Math.PI; theta += 0.1) {
      const r = (theta / (6 * Math.PI)) * (size * 0.45);
      const x = size / 2 + r * Math.cos(theta);
      const y = size / 2 + r * Math.sin(theta);
      if (theta === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

export default function Step16MyImageMyMatrix({ onSelectStep }) {
  // Resolution choices: 10, 20, 50, 100
  const [resolution, setResolution] = useState(50);

  // Active Image Preset or Custom Upload
  const [activePreset, setActivePreset] = useState('flower');
  const [customImageDataUrl, setCustomImageDataUrl] = useState(null);

  // Second image for addition/subtraction
  const [secondPreset, setSecondPreset] = useState('city');
  const [customSecondImageUrl, setCustomSecondImageUrl] = useState(null);

  // Active operation:
  // 'scalar' (brightness) | 'addition' | 'subtraction' | 'rotation' | 'scaling' | 'reflection' | 'shearing' | 'inverse'
  const [operation, setOperation] = useState('scalar');

  // Parameters
  const [scalarK, setScalarK] = useState(1.4); // Brightness factor k
  const [addWeight, setAddWeight] = useState(0.5); // α for addition
  const [rotAngle, setRotAngle] = useState(45); // Degrees for rotation
  const [scaleK, setScaleK] = useState(1.5); // Zoom factor k
  const [shearX, setShearX] = useState(0.3); // Shear X
  const [shearY, setShearY] = useState(0.0); // Shear Y
  const [reflectionAxis, setReflectionAxis] = useState('horizontal'); // 'horizontal' | 'vertical'

  // Inverse stage for Scaling / Rotation roundtrip
  // 'none' | 'transformed' | 'inversed'
  const [inverseStage, setInverseStage] = useState('none');

  // ROI (Region of Interest) inspection: e.g. 5x5 or 10x10 at (roiRow, roiCol)
  const [roiSize, setRoiSize] = useState(5);
  const [roiPos, setRoiPos] = useState({ r: 0, c: 0 });
  const [inspectPixel, setInspectPixel] = useState({ r: 25, c: 25 });
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  // Prediction-based learning state
  const [userPrediction, setUserPrediction] = useState('');
  const [predictionSubmitted, setPredictionSubmitted] = useState(false);

  // Camera capture modal state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // File upload input ref
  const fileInputRef = useRef(null);
  const secondFileInputRef = useRef(null);

  // Canvases
  const origCanvasRef = useRef(null);
  const transCanvasRef = useRef(null);
  const secondCanvasRef = useRef(null);

  // Raw pixel arrays for matrix inspection
  const [origPixelData, setOrigPixelData] = useState(null);
  const [transPixelData, setTransPixelData] = useState(null);

  // Start Camera
  const handleStartCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Camera access denied or unavailable. Using sample photos instead.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const handleStopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Snap Photo from Camera
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 200;
    snapCanvas.height = 200;
    const ctx = snapCanvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 200, 200);
    setCustomImageDataUrl(snapCanvas.toDataURL('image/png'));
    setActivePreset('custom');
    handleStopCamera();
  };

  // Handle Upload Image 1
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomImageDataUrl(event.target.result);
      setActivePreset('custom');
    };
    reader.readAsDataURL(file);
  };

  // Handle Upload Image 2 (for Addition/Subtraction)
  const handleSecondFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomSecondImageUrl(event.target.result);
      setSecondPreset('custom');
    };
    reader.readAsDataURL(file);
  };

  // Render Base Original Canvas whenever preset/custom/resolution changes
  useEffect(() => {
    const canvas = origCanvasRef.current;
    if (!canvas) return;
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (activePreset === 'custom' && customImageDataUrl) {
      const img = new Image();
      img.onload = () => {
        // Crop & center to square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, resolution, resolution);
        applyTransformation();
      };
      img.src = customImageDataUrl;
    } else {
      drawPresetGraphic(ctx, activePreset, resolution);
      applyTransformation();
    }
  }, [resolution, activePreset, customImageDataUrl]);

  // Render Second Canvas (for matrix addition / subtraction)
  useEffect(() => {
    if (operation !== 'addition' && operation !== 'subtraction') return;
    const canvas = secondCanvasRef.current;
    if (!canvas) return;
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (secondPreset === 'custom' && customSecondImageUrl) {
      const img = new Image();
      img.onload = () => {
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, resolution, resolution);
        applyTransformation();
      };
      img.src = customSecondImageUrl;
    } else {
      drawPresetGraphic(ctx, secondPreset, resolution);
      applyTransformation();
    }
  }, [resolution, secondPreset, customSecondImageUrl, operation]);

  // Compute Transformation & Draw on Transformed Canvas
  const applyTransformation = useCallback(() => {
    const origCanvas = origCanvasRef.current;
    const transCanvas = transCanvasRef.current;
    if (!origCanvas || !transCanvas) return;

    transCanvas.width = resolution;
    transCanvas.height = resolution;

    const origCtx = origCanvas.getContext('2d', { willReadFrequently: true });
    const transCtx = transCanvas.getContext('2d', { willReadFrequently: true });

    const origImgData = origCtx.getImageData(0, 0, resolution, resolution);
    const transImgData = transCtx.createImageData(resolution, resolution);

    const src = origImgData.data;
    const dst = transImgData.data;

    // Cache original pixel data for matrix views
    setOrigPixelData(new Uint8ClampedArray(src));

    if (operation === 'scalar') {
      // 1. Scalar multiplication: A' = clamp(k * A)
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = clampPixel(src[i] * scalarK);
        dst[i + 1] = clampPixel(src[i + 1] * scalarK);
        dst[i + 2] = clampPixel(src[i + 2] * scalarK);
        dst[i + 3] = src[i + 3];
      }
      transCtx.putImageData(transImgData, 0, 0);
    } else if (operation === 'addition' || operation === 'subtraction') {
      // 2. Addition (blend) / Subtraction (|A - B|)
      const secondCanvas = secondCanvasRef.current;
      if (!secondCanvas) return;
      const secondCtx = secondCanvas.getContext('2d', { willReadFrequently: true });
      const secondImgData = secondCtx.getImageData(0, 0, resolution, resolution);
      const src2 = secondImgData.data;

      for (let i = 0; i < src.length; i += 4) {
        if (operation === 'addition') {
          // Blended or direct addition C = αA + (1-α)B
          dst[i] = clampPixel(addWeight * src[i] + (1 - addWeight) * src2[i]);
          dst[i + 1] = clampPixel(addWeight * src[i + 1] + (1 - addWeight) * src2[i + 1]);
          dst[i + 2] = clampPixel(addWeight * src[i + 2] + (1 - addWeight) * src2[i + 2]);
        } else {
          // Subtraction difference D = |A - B|
          dst[i] = clampPixel(Math.abs(src[i] - src2[i]));
          dst[i + 1] = clampPixel(Math.abs(src[i + 1] - src2[i + 1]));
          dst[i + 2] = clampPixel(Math.abs(src[i + 2] - src2[i + 2]));
        }
        dst[i + 3] = 255;
      }
      transCtx.putImageData(transImgData, 0, 0);
    } else {
      // 3. Spatial Geometric 2D Coordinate Transformations (Rotation, Scaling, Reflection, Shear, Inverse)
      transCtx.save();
      transCtx.clearRect(0, 0, resolution, resolution);

      // Center transform at middle of image
      const cx = resolution / 2;
      const cy = resolution / 2;
      transCtx.translate(cx, cy);

      if (operation === 'rotation') {
        const rad = (rotAngle * Math.PI) / 180;
        transCtx.rotate(rad);
      } else if (operation === 'scaling') {
        const s = inverseStage === 'inversed' ? 1.0 : scaleK;
        transCtx.scale(s, s);
      } else if (operation === 'reflection') {
        if (reflectionAxis === 'horizontal') transCtx.scale(-1, 1);
        else transCtx.scale(1, -1);
      } else if (operation === 'shearing') {
        transCtx.transform(1, shearY, shearX, 1, 0, 0);
      } else if (operation === 'inverse') {
        // Inverse roundtrip demo
        if (inverseStage === 'transformed') {
          transCtx.scale(scaleK, scaleK);
          transCtx.rotate((rotAngle * Math.PI) / 180);
        } else if (inverseStage === 'inversed') {
          // Reapply forward then exact inverse
          transCtx.scale(scaleK, scaleK);
          transCtx.rotate((rotAngle * Math.PI) / 180);
          transCtx.rotate((-rotAngle * Math.PI) / 180);
          transCtx.scale(1 / scaleK, 1 / scaleK);
        }
      }

      transCtx.translate(-cx, -cy);
      transCtx.drawImage(origCanvas, 0, 0);
      transCtx.restore();
    }

    // Capture transformed pixel buffer for inspector
    const updatedTrans = transCtx.getImageData(0, 0, resolution, resolution);
    setTransPixelData(new Uint8ClampedArray(updatedTrans.data));
  }, [
    resolution,
    operation,
    scalarK,
    addWeight,
    rotAngle,
    scaleK,
    shearX,
    shearY,
    reflectionAxis,
    inverseStage
  ]);

  // Recalculate whenever params change
  useEffect(() => {
    applyTransformation();
  }, [applyTransformation]);

  // Pixel Inspector Info
  const inspectedData = useMemo(() => {
    if (!origPixelData || !transPixelData) return null;
    const { r, c } = inspectPixel;
    if (r >= resolution || c >= resolution) return null;

    const idx = (r * resolution + c) * 4;
    const origR = origPixelData[idx] ?? 0;
    const origG = origPixelData[idx + 1] ?? 0;
    const origB = origPixelData[idx + 2] ?? 0;
    const origGray = Math.round(0.299 * origR + 0.587 * origG + 0.114 * origB);

    const transR = transPixelData[idx] ?? 0;
    const transG = transPixelData[idx + 1] ?? 0;
    const transB = transPixelData[idx + 2] ?? 0;
    const transGray = Math.round(0.299 * transR + 0.587 * transG + 0.114 * transB);

    // Coordinate mapping representation (x, y) relative to center
    const x0 = c - resolution / 2;
    const y0 = r - resolution / 2;

    let x1 = x0;
    let y1 = y0;
    let matrix2x2 = [[1, 0], [0, 1]];

    if (operation === 'rotation') {
      const rad = (rotAngle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      matrix2x2 = [[cos.toFixed(2), (-sin).toFixed(2)], [sin.toFixed(2), cos.toFixed(2)]];
      x1 = (cos * x0 - sin * y0).toFixed(1);
      y1 = (sin * x0 + cos * y0).toFixed(1);
    } else if (operation === 'scaling') {
      matrix2x2 = [[scaleK.toFixed(2), 0], [0, scaleK.toFixed(2)]];
      x1 = (x0 * scaleK).toFixed(1);
      y1 = (y0 * scaleK).toFixed(1);
    } else if (operation === 'reflection') {
      if (reflectionAxis === 'horizontal') matrix2x2 = [[-1, 0], [0, 1]];
      else matrix2x2 = [[1, 0], [0, -1]];
      x1 = reflectionAxis === 'horizontal' ? -x0 : x0;
      y1 = reflectionAxis === 'vertical' ? -y0 : y0;
    } else if (operation === 'shearing') {
      matrix2x2 = [[1, shearX.toFixed(2)], [shearY.toFixed(2), 1]];
      x1 = (x0 + shearX * y0).toFixed(1);
      y1 = (shearY * x0 + y0).toFixed(1);
    }

    return {
      r,
      c,
      origR,
      origG,
      origB,
      origGray,
      transR,
      transG,
      transB,
      transGray,
      x0,
      y0,
      x1,
      y1,
      matrix2x2
    };
  }, [inspectPixel, origPixelData, transPixelData, resolution, operation, rotAngle, scaleK, reflectionAxis, shearX, shearY]);

  // Mathematical details of the active operation
  const operationDetails = useMemo(() => {
    switch (operation) {
      case 'scalar':
        return {
          title: 'Scalar Multiplication',
          formula: "A' = \\min(255, \\max(0, k \\cdot A))",
          formulaDisplay: `A' = clamp(${scalarK.toFixed(1)} · A, 0, 255)`,
          type: 'intensity',
          desc: 'Scalar k scales every pixel intensity simultaneously. k > 1 brightens, k < 1 darkens.'
        };
      case 'addition':
        return {
          title: 'Matrix Addition & Blending',
          formula: 'C = \\alpha A + (1 - \\alpha) B',
          formulaDisplay: `C = ${addWeight.toFixed(2)}·A + ${(1 - addWeight).toFixed(2)}·B`,
          type: 'intensity',
          desc: 'Element-wise linear convex combination of two image matrices.'
        };
      case 'subtraction':
        return {
          title: 'Matrix Subtraction',
          formula: 'D = |A - B|',
          formulaDisplay: 'D = |A - B| (Absolute Difference Heatmap)',
          type: 'intensity',
          desc: 'Reveals spatial differences and motion anomalies between two matrices.'
        };
      case 'rotation':
        return {
          title: 'Rotation Transformation',
          formula: 'R(\\theta) = \\begin{bmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{bmatrix}',
          formulaDisplay: `R(${rotAngle}°) around image center`,
          type: 'spatial',
          desc: 'Orthonormal 2×2 rotation mapping spatial coordinates while preserving lengths and angles.'
        };
      case 'scaling':
        return {
          title: 'Scaling (Zoom In / Out)',
          formula: 'S(k) = \\begin{bmatrix} k & 0 \\\\ 0 & k \\end{bmatrix}',
          formulaDisplay: `S(${scaleK.toFixed(1)}) = diag(${scaleK.toFixed(1)}, ${scaleK.toFixed(1)})`,
          type: 'spatial',
          desc: 'Stretches or compresses spatial coordinate grid, scaling area by factor k².'
        };
      case 'reflection':
        return {
          title: 'Mirror Reflection',
          formula: reflectionAxis === 'horizontal' ? 'M_x = \\begin{bmatrix} -1 & 0 \\\\ 0 & 1 \\end{bmatrix}' : 'M_y = \\begin{bmatrix} 1 & 0 \\\\ 0 & -1 \\end{bmatrix}',
          formulaDisplay: reflectionAxis === 'horizontal' ? 'Horizontal Flip (x → -x)' : 'Vertical Flip (y → -y)',
          type: 'spatial',
          desc: 'Isometry with determinant -1, inverting coordinate orientation across symmetry axis.'
        };
      case 'shearing':
        return {
          title: 'Shear Distortion',
          formula: 'Sh = \\begin{bmatrix} 1 & s_x \\\\ s_y & 1 \\end{bmatrix}',
          formulaDisplay: `Shear(s_x=${shearX.toFixed(2)}, s_y=${shearY.toFixed(2)})`,
          type: 'spatial',
          desc: 'Displaces coordinates proportionally to perpendicular distance, creating diagonal tilt.'
        };
      case 'inverse':
        return {
          title: 'Matrix Inverse & Reconstruction',
          formula: 'T^{-1} T = I \\implies X = T^{-1} X\'',
          formulaDisplay: 'Original → Transformed → T⁻¹ → Reconstructed',
          type: 'spatial',
          desc: 'Reverses invertible geometric operations; slight interpolation differences illustrate practical loss.'
        };
      default:
        return { title: '', formula: '', formulaDisplay: '', type: '', desc: '' };
    }
  }, [operation, scalarK, addWeight, rotAngle, scaleK, shearX, shearY, reflectionAxis]);

  // Questions for Prediction-Based Learning
  const predictionQuestions = {
    scalar: [
      'The entire image will become brighter and clipped toward white (255)',
      'The image will flip upside down',
      'The image will shift toward cyan hue only'
    ],
    addition: [
      'Both images will visually blend like a double exposure',
      'The background will turn pure black',
      'Only high-frequency edges will be preserved'
    ],
    subtraction: [
      'Identical regions will become pitch black (0 delta) and differences will glow',
      'The image will zoom into the center',
      'Both images will invert into color negatives'
    ],
    rotation: [
      'Pixels will rotate about the center coordinates maintaining circular arcs',
      'Pixels will randomly scramble in place',
      'Brightness will increase by 50%'
    ],
    scaling: [
      'The subject will expand outward (zoom in) or shrink inward (zoom out)',
      'Color channels will separate into RGB planes',
      'The image will shear diagonally'
    ],
    reflection: [
      'The image will flip across the chosen mirror axis',
      'The image will double in width',
      'Pixels will negate (255 - v)'
    ],
    shearing: [
      'Rectangular shapes will tilt into parallelograms',
      'Image area will collapse to zero',
      'Image will invert colors'
    ],
    inverse: [
      'Applying the inverse matrix will restore the original image (with minor interpolation blurring)',
      'The image will be permanently distorted beyond recovery',
      'All pixels will turn white'
    ]
  };

  // Download Transformed Image as PNG
  const handleDownloadImage = () => {
    const canvas = transCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `mathlens-${operation}-res${resolution}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Download HTML Laboratory Experiment Summary Report
  const handleDownloadReport = () => {
    const origCanvas = origCanvasRef.current;
    const transCanvas = transCanvasRef.current;
    if (!origCanvas || !transCanvas) return;

    const origData = origCanvas.toDataURL('image/png');
    const transData = transCanvas.toDataURL('image/png');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>MathLens Experiment Report - My Image, My Matrix</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    h1 { color: #38bdf8; margin-top: 0; }
    h2 { color: #818cf8; font-size: 1.25rem; }
    .grid { display: flex; gap: 2rem; align-items: center; justify-content: center; margin: 1.5rem 0; }
    .img-box { text-align: center; }
    img { border-radius: 8px; border: 2px solid #475569; width: 180px; height: 180px; image-rendering: pixelated; }
    code { background: #0f172a; padding: 0.2rem 0.5rem; border-radius: 4px; color: #38bdf8; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <h1>MathLens Laboratory Experiment Summary</h1>
    <p>Module 16: My Image, My Matrix • Matrix Operations on Real Images</p>
    <p><strong>Resolution:</strong> ${resolution} × ${resolution} pixels (${resolution * resolution} total pixel entries)</p>
    <p><strong>Operation:</strong> ${operationDetails.title} (<code>${operationDetails.formulaDisplay}</code>)</p>
  </div>
  <div class="card">
    <h2>Experimental Transformation</h2>
    <div class="grid">
      <div class="img-box">
        <p><strong>Original Image</strong></p>
        <img src="${origData}" alt="Original"/>
      </div>
      <div style="font-size: 2rem; color: #38bdf8;">→</div>
      <div class="img-box">
        <p><strong>Transformed Image</strong></p>
        <img src="${transData}" alt="Transformed"/>
      </div>
    </div>
    <p><strong>Mathematical Description:</strong> ${operationDetails.desc}</p>
    <p><strong>Generated by MathLens Interactive Laboratory</strong> on ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.download = `mathlens-experiment-report-${operation}.html`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <motion.div
      className="step-module visual-lens-my-image-module"
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
                background: 'rgba(168, 85, 247, 0.15)',
                color: 'var(--accent-purple)',
                borderColor: 'rgba(168, 85, 247, 0.35)'
              }}
            >
              Visual Lab 16
            </span>
            <span className="text-xs font-mono font-bold text-purple-400">
              My Image, My Matrix • Digital Images as 2D Arrays &amp; Spatial Tensors
            </span>
          </div>
        </div>

        <h2 className="step-heading">
          My Image, My Matrix: Explore Matrix Operations Using Your Own Image
        </h2>
        <p className="step-description">
          Upload any photograph or snap a picture with your camera! Discover how real-world images are stored as numerical
          matrices, explore how resolution impacts pixelation, and apply scalar, additive, subtractive, and 2D geometric linear maps interactively.
        </p>
      </div>

      {/* STEP 1: UPLOAD & RESOLUTION CONTROLS */}
      <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload size={18} className="text-purple-400" />
              Step 1: Choose Your Image &amp; Resolution
            </h3>
            <p className="text-xs text-gray-400">
              Upload from your device, capture with camera, or select from curated mathematical presets.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition-all"
            >
              <Upload size={14} />
              <span>Upload Image</span>
            </button>

            <button
              onClick={handleStartCamera}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center gap-1.5 transition-all"
            >
              <Camera size={14} />
              <span>Use Camera</span>
            </button>
          </div>
        </div>

        {/* Presets and Resolution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Preset Selector */}
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-gray-400">Sample Image Presets:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePreset(p.id);
                    setCustomImageDataUrl(null);
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                    activePreset === p.id && !customImageDataUrl
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Selector: 10x10, 20x20, 50x50, 100x100 */}
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-gray-400">
              Interactive Image Resolution (Grid Dimensions):
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 50, 100].map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`p-2 rounded-xl text-xs font-mono font-bold border text-center transition-all ${
                    resolution === res
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {res} × {res}
                  <span className="block text-[9px] font-sans text-gray-500 font-normal">
                    {res === 10 ? 'Individual' : res === 50 ? 'Default' : res === 100 ? 'Fine' : 'Coarse'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: MATRIX OPERATION SELECTOR BAR */}
      <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders size={18} className="text-cyan-400" />
            Step 2: Select Matrix Operation to Apply
          </h3>
          <span className="text-xs font-mono text-cyan-400">
            {operationDetails.type === 'intensity' ? 'Pixel Intensity Arithmetic' : '2D Spatial Coordinate Mapping'}
          </span>
        </div>

        {/* Operation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { id: 'scalar', label: 'Scalar Mult (Brightness)', icon: Sun },
            { id: 'addition', label: 'Matrix Addition', icon: Plus },
            { id: 'subtraction', label: 'Subtraction (Delta)', icon: Minus },
            { id: 'rotation', label: 'Rotation', icon: RotateCw },
            { id: 'scaling', label: 'Scaling (Zoom)', icon: ZoomIn },
            { id: 'reflection', label: 'Mirror Reflection', icon: FlipHorizontal },
            { id: 'shearing', label: 'Shearing', icon: Scissors },
            { id: 'inverse', label: 'Matrix Inverse', icon: Undo2 }
          ].map((op) => {
            const Icon = op.icon;
            const isActive = operation === op.id;
            return (
              <button
                key={op.id}
                onClick={() => {
                  setOperation(op.id);
                  setPredictionSubmitted(false);
                  setUserPrediction('');
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  isActive
                    ? 'bg-gradient-to-b from-cyan-500/20 to-purple-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-cyan-300' : 'text-gray-400'} />
                <span className="text-[11px] font-semibold leading-tight">{op.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PREDICTION-BASED LEARNING BANNER */}
      <div className="glass-level-3 p-4 rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-950/20 to-black/40 mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-yellow-400" />
          <span className="font-bold text-sm text-yellow-300">
            Prediction Hypothesis: What do you expect will happen when this matrix is applied?
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {predictionQuestions[operation]?.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => {
                setUserPrediction(choice);
                setPredictionSubmitted(true);
              }}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                userPrediction === choice
                  ? 'bg-yellow-500/20 border-yellow-400 text-white font-semibold'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {choice}
            </button>
          ))}
        </div>

        {predictionSubmitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs text-gray-300 flex items-center justify-between flex-wrap gap-2"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>
                <strong>Mathematical Intuition:</strong> {operationDetails.desc}
              </span>
            </div>
            <span className="font-mono text-cyan-400">{operationDetails.formulaDisplay}</span>
          </motion.div>
        )}
      </div>

      {/* 3-PANEL INTERACTIVE DISPLAY: ORIGINAL -> MATHEMATICAL OPERATION -> TRANSFORMED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* PANEL 1: ORIGINAL IMAGE */}
        <div className="lg:col-span-4 glass-level-2 p-5 rounded-2xl border border-white/10 flex flex-col items-center justify-between text-center space-y-4">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-300">1. Original Image A</span>
            <span className="text-[11px] font-mono text-gray-400">{resolution}×{resolution}</span>
          </div>

          <div className="relative p-2 rounded-2xl bg-black/50 border border-white/10 shadow-lg">
            <canvas
              ref={origCanvasRef}
              className="rounded-xl cursor-crosshair shadow-md"
              style={{
                width: '200px',
                height: '200px',
                imageRendering: resolution <= 20 ? 'pixelated' : 'auto'
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.floor(((e.clientX - rect.left) / rect.width) * resolution);
                const y = Math.floor(((e.clientY - rect.top) / rect.height) * resolution);
                setInspectPixel({ r: Math.min(resolution - 1, y), c: Math.min(resolution - 1, x) });
              }}
            />
          </div>

          <div className="text-xs text-gray-400">
            Click any pixel on canvas to inspect numerical values below.
          </div>
        </div>

        {/* PANEL 2: MATHEMATICAL OPERATION & PARAMETER SLIDERS */}
        <div className="lg:col-span-4 glass-level-3 p-5 rounded-2xl border border-cyan-500/20 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-yellow-300">2. Mathematical Transformation</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">Active</span>
            </div>
            <h4 className="font-bold text-base text-white">{operationDetails.title}</h4>
            <div className="p-3 my-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-cyan-300 text-center font-bold">
              {operationDetails.formulaDisplay}
            </div>
          </div>

          {/* DYNAMIC PARAMETER CONTROLS ACCORDING TO ACTIVE OPERATION */}
          <div className="space-y-3.5 p-3 rounded-xl bg-black/40 border border-white/5">
            {operation === 'scalar' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-gray-300">
                  <span>Scalar Multiplier (k):</span>
                  <span className="font-mono text-cyan-400">{scalarK.toFixed(1)}×</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={scalarK}
                  onChange={(e) => setScalarK(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>0.1 (Darken)</span>
                  <span>1.0 (Normal)</span>
                  <span>3.0 (Brighten/Clip)</span>
                </div>
              </div>
            )}

            {operation === 'addition' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-300">
                  <span>Blending Ratio (α):</span>
                  <span className="font-mono text-cyan-400">{(addWeight * 100).toFixed(0)}% A</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={addWeight}
                  onChange={(e) => setAddWeight(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-gray-400">Image B Preset:</span>
                  <select
                    value={secondPreset}
                    onChange={(e) => setSecondPreset(e.target.value)}
                    className="bg-black/60 border border-white/20 rounded px-2 py-0.5 text-xs text-white"
                  >
                    {SAMPLE_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <canvas ref={secondCanvasRef} className="hidden" />
              </div>
            )}

            {operation === 'subtraction' && (
              <div className="space-y-2">
                <span className="text-xs text-gray-300">Difference Target Image B:</span>
                <div className="flex items-center justify-between text-[11px]">
                  <select
                    value={secondPreset}
                    onChange={(e) => setSecondPreset(e.target.value)}
                    className="bg-black/60 border border-white/20 rounded px-2.5 py-1 text-xs text-white w-full"
                  >
                    {SAMPLE_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <canvas ref={secondCanvasRef} className="hidden" />
              </div>
            )}

            {operation === 'rotation' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-300">
                  <span>Angle (θ):</span>
                  <span className="font-mono text-cyan-400">{rotAngle}°</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[30, 45, 90, 180].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => setRotAngle(deg)}
                      className={`p-1.5 rounded text-xs font-mono border ${
                        rotAngle === deg ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={rotAngle}
                  onChange={(e) => setRotAngle(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 cursor-pointer mt-1"
                />
              </div>
            )}

            {operation === 'scaling' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-300">
                  <span>Scale Factor (k):</span>
                  <span className="font-mono text-cyan-400">{scaleK.toFixed(1)}×</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.1"
                  value={scaleK}
                  onChange={(e) => setScaleK(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}

            {operation === 'reflection' && (
              <div className="space-y-2">
                <span className="text-xs text-gray-300">Reflection Axis:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setReflectionAxis('horizontal')}
                    className={`p-2 rounded text-xs font-semibold border ${
                      reflectionAxis === 'horizontal' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    Horizontal (x → -x)
                  </button>
                  <button
                    onClick={() => setReflectionAxis('vertical')}
                    className={`p-2 rounded text-xs font-semibold border ${
                      reflectionAxis === 'vertical' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    Vertical (y → -y)
                  </button>
                </div>
              </div>
            )}

            {operation === 'shearing' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-300">
                  <span>Shear X (s_x):</span>
                  <span className="font-mono text-cyan-400">{shearX.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-0.8"
                  max="0.8"
                  step="0.05"
                  value={shearX}
                  onChange={(e) => setShearX(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}

            {operation === 'inverse' && (
              <div className="space-y-2">
                <span className="text-xs text-gray-300">Round-Trip Recovery Stages:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setInverseStage('none')}
                    className={`p-1.5 rounded text-xs font-semibold border ${
                      inverseStage === 'none' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    1. Original
                  </button>
                  <button
                    onClick={() => setInverseStage('transformed')}
                    className={`p-1.5 rounded text-xs font-semibold border ${
                      inverseStage === 'transformed' ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    2. Zoom/Rot
                  </button>
                  <button
                    onClick={() => setInverseStage('inversed')}
                    className={`p-1.5 rounded text-xs font-semibold border ${
                      inverseStage === 'inversed' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    3. Apply T⁻¹
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              onClick={() => {
                setScalarK(1.0);
                setRotAngle(0);
                setScaleK(1.0);
                setShearX(0);
                setShearY(0);
                setInverseStage('none');
              }}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center gap-1 transition-all"
            >
              <RotateCcw size={12} />
              <span>Reset Values</span>
            </button>
            <button
              onClick={() => setShowMatrixModal(true)}
              className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 flex items-center gap-1 transition-all font-semibold"
            >
              <Grid size={12} />
              <span>Show Matrix Table</span>
            </button>
          </div>
        </div>

        {/* PANEL 3: TRANSFORMED IMAGE */}
        <div className="lg:col-span-4 glass-level-2 p-5 rounded-2xl border border-purple-500/20 flex flex-col items-center justify-between text-center space-y-4">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-300">3. Transformed Image A′</span>
            <span className="text-[11px] font-mono text-purple-400">{resolution}×{resolution}</span>
          </div>

          <div className="relative p-2 rounded-2xl bg-black/50 border border-white/10 shadow-lg">
            <canvas
              ref={transCanvasRef}
              className="rounded-xl shadow-md"
              style={{
                width: '200px',
                height: '200px',
                imageRendering: resolution <= 20 ? 'pixelated' : 'auto'
              }}
            />
          </div>

          <div className="flex items-center gap-2 w-full">
            <button
              onClick={handleDownloadImage}
              className="flex-1 py-1.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Download size={14} />
              <span>Save PNG</span>
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <FileText size={14} />
              <span>Download Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* PIXEL INSPECTOR & COORDINATE MAPPING HUD */}
      {inspectedData && (
        <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-3 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye size={18} className="text-cyan-400" />
              Mathematical Inspector: Pixel ({inspectedData.r}, {inspectedData.c})
            </h4>
            <span className="text-xs font-mono text-gray-400">
              Center Origin Coordinates: ({inspectedData.x0}, {inspectedData.y0})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* 1. Original RGB / Gray */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-gray-400 font-mono">Original Intensities:</span>
              <div className="font-bold font-mono text-cyan-300">
                RGB({inspectedData.origR}, {inspectedData.origG}, {inspectedData.origB})
              </div>
              <div className="text-[11px] text-gray-400">
                Grayscale: <strong>{inspectedData.origGray}</strong>
              </div>
            </div>

            {/* 2. Transformed RGB / Gray */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-gray-400 font-mono">Transformed Intensities:</span>
              <div className="font-bold font-mono text-purple-300">
                RGB({inspectedData.transR}, {inspectedData.transG}, {inspectedData.transB})
              </div>
              <div className="text-[11px] text-gray-400">
                Grayscale: <strong>{inspectedData.transGray}</strong>
              </div>
            </div>

            {/* 3. Coordinate Transformation (for spatial operations) */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-gray-400 font-mono">2D Coordinate Mapping:</span>
              <div className="font-bold font-mono text-yellow-300">
                [{inspectedData.x0}, {inspectedData.y0}]ᵀ → [{inspectedData.x1}, {inspectedData.y1}]ᵀ
              </div>
              <div className="text-[10px] text-gray-400">
                Matrix: [{inspectedData.matrix2x2[0].join(', ')} ; {inspectedData.matrix2x2[1].join(', ')}]
              </div>
            </div>

            {/* 4. Operation Type Difference */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-gray-400 font-mono">Governing Principle:</span>
              <div className="font-bold text-white">
                {operationDetails.type === 'intensity' ? 'Value Modulation' : 'Spatial Coordinate Transform'}
              </div>
              <div className="text-[10px] text-gray-400 line-clamp-2">
                {operationDetails.desc}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FULL NUMERICAL MATRIX VIEW */}
      <AnimatePresence>
        {showMatrixModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowMatrixModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-white/20 rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Digital Image as a Numerical Matrix</h3>
                  <p className="text-xs text-gray-400">
                    Inspecting {roiSize}×{roiSize} Region of Interest at resolution {resolution}×{resolution}
                  </p>
                </div>
                <button
                  onClick={() => setShowMatrixModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Matrix Grid */}
              {origPixelData && (
                <div className="overflow-x-auto p-2 bg-black/50 rounded-xl border border-white/10">
                  <div
                    className="grid gap-1 min-w-[300px]"
                    style={{ gridTemplateColumns: `repeat(${roiSize}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: roiSize }).map((_, r) =>
                      Array.from({ length: roiSize }).map((_, c) => {
                        const targetR = Math.min(resolution - 1, roiPos.r + r);
                        const targetC = Math.min(resolution - 1, roiPos.c + c);
                        const idx = (targetR * resolution + targetC) * 4;
                        const gray = Math.round(
                          0.299 * (origPixelData[idx] ?? 0) +
                          0.587 * (origPixelData[idx + 1] ?? 0) +
                          0.114 * (origPixelData[idx + 2] ?? 0)
                        );
                        return (
                          <div
                            key={`roi-${r}-${c}`}
                            className="p-2 rounded bg-white/5 border border-white/10 text-center font-mono text-xs"
                          >
                            <span className="font-bold text-cyan-300">{gray}</span>
                            <span className="block text-[8px] text-gray-500">
                              ({targetR},{targetC})
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Select ROI Size:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRoiSize(5)}
                    className={`px-2.5 py-1 rounded font-mono ${
                      roiSize === 5 ? 'bg-cyan-500 text-black font-bold' : 'bg-white/10 text-white'
                    }`}
                  >
                    5 × 5
                  </button>
                  <button
                    onClick={() => setRoiSize(10)}
                    className={`px-2.5 py-1 rounded font-mono ${
                      roiSize === 10 ? 'bg-cyan-500 text-black font-bold' : 'bg-white/10 text-white'
                    }`}
                  >
                    10 × 10
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CAMERA CAPTURE MODAL */}
      <AnimatePresence>
        {isCameraActive && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={handleStopCamera}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-white/20 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Camera size={18} className="text-purple-400" />
                  Capture Photo for Matrix Lab
                </h3>
                <button onClick={handleStopCamera} className="p-1 rounded text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border-2 border-white/15 bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover"
                />
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleCapturePhoto}
                  className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2"
                >
                  <Camera size={16} />
                  <span>Snap Photo</span>
                </button>
                <button
                  onClick={handleStopCamera}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STEP NAVIGATION FOOTER */}
      <StepFooter stepNumber={16} onSelectStep={onSelectStep} />
    </motion.div>
  );
}
