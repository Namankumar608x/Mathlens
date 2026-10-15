import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Variable,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Layers,
  Compass,
  CheckCircle2,
  Sliders,
  Upload,
  FlipHorizontal,
  RefreshCw,
  Check,
  X,
  Zap,
  Info
} from 'lucide-react';
import StepFooter from '../components/layout/StepFooter';
import ModuleDocumentation from '../components/experiment/ModuleDocumentation';

// Procedural preset graphics rendered onto an offscreen canvas
function drawPresetGraphic(ctx, presetId, size) {
  ctx.clearRect(0, 0, size, size);

  if (presetId === 'flower') {
    // Elegant radial background
    const bg = ctx.createRadialGradient(size / 2, size / 2, 5, size / 2, size / 2, size * 0.7);
    bg.addColorStop(0, '#1E261B');
    bg.addColorStop(1, '#0F140D');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const petals = 8;
    for (let i = 0; i < petals; i++) {
      const a = (i * 2 * Math.PI) / petals;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.fillStyle = i % 2 === 0 ? '#C27373' : '#DB9292';
      ctx.beginPath();
      ctx.ellipse(0, size * 0.26, size * 0.11, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9E5555';
      ctx.lineWidth = Math.max(1, size / 120);
      ctx.stroke();
      ctx.restore();
    }
    // Flower Center
    ctx.fillStyle = '#D4A359';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B8863B';
    ctx.lineWidth = Math.max(1, size / 100);
    ctx.stroke();
    // Inner center dots
    ctx.fillStyle = '#6E4918';
    for (let d = 0; d < 6; d++) {
      const da = (d * 2 * Math.PI) / 6;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(da) * size * 0.06, cy + Math.sin(da) * size * 0.06, size * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (presetId === 'portrait') {
    ctx.fillStyle = '#14181F';
    ctx.fillRect(0, 0, size, size);

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#4A5B70');
    grad.addColorStop(1, '#2D3748');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.4, size * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.ellipse(size / 2, size * 0.85, size * 0.36, size * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Geometric Grid
    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.2;
    for (let x = 0; x <= size; x += size / 6) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += size / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#8BA871';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function Step18Eigenvalues({ onSelectStep }) {
  // Navigation Tabs: 'explore' | 'eigenvalues' | 'image-scaling' | 'reflection-challenge'
  const [activeTab, setActiveTab] = useState('explore');

  // Detect Light vs Dark Mode dynamically
  const [theme, setTheme] = useState(() => (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'dark' : 'dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  const isLight = theme === 'light';

  // --- TAB 1: FINDING SPECIAL DIRECTIONS (VECTOR ROTATE / SCALE) ---
  const [vectorAngle, setVectorAngle] = useState(30); // in degrees: 0 to 360
  const [vectorMag, setVectorMag] = useState(2.0); // magnitude: 0.5 to 3.0
  const [foundX1, setFoundX1] = useState(false);
  const [foundX2, setFoundX2] = useState(false);

  // --- TAB 2: INTRODUCING EIGENVALUES (LAMBDA_X & LAMBDA_Y SLIDERS) ---
  const [lambdaX, setLambdaX] = useState(2.0); // -3.0 to 3.0
  const [lambdaY, setLambdaY] = useState(1.0); // -3.0 to 3.0
  const [probeAngle, setProbeAngle] = useState(45); // probe vector angle
  const [showGridMesh, setShowGridMesh] = useState(true);

  // --- TAB 3: IMAGE SCALING & OWN IMAGE ---
  const [selectedPreset, setSelectedPreset] = useState('flower');
  const [customImageSrc, setCustomImageSrc] = useState(null);
  const [imageLambdaX, setImageLambdaX] = useState(2.0);
  const [imageLambdaY, setImageLambdaY] = useState(1.0);
  const fileInputRef = useRef(null);

  // --- TAB 4: CONCEPT CHALLENGE (REFLECTION & NEGATIVE LAMBDA) ---
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [reflectionAnim, setReflectionAnim] = useState(1); // 1 = original, -1 = reflected

  // Canvas Refs
  const exploreCanvasRef = useRef(null);
  const eigenCanvasRef = useRef(null);
  const imageCanvasRef = useRef(null);
  const reflectionCanvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const [presetCanvasKey, setPresetCanvasKey] = useState(0);

  // Preset Image preparation
  useEffect(() => {
    if (customImageSrc) return;
    const canvas = offscreenCanvasRef.current || document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    offscreenCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    drawPresetGraphic(ctx, selectedPreset, 300);
    setPresetCanvasKey(k => k + 1);
  }, [selectedPreset, customImageSrc]);

  // Handle custom image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setCustomImageSrc(event.target.result);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------------------------
  // TAB 1 MATHEMATICAL CALCULATIONS
  // ----------------------------------------------------------------------
  const angleRad = (vectorAngle * Math.PI) / 180;
  const inVx = vectorMag * Math.cos(angleRad);
  const inVy = vectorMag * Math.sin(angleRad);

  // Fixed matrix for Tab 1: A = [2 0; 0 1]
  const outVx = 2 * inVx;
  const outVy = 1 * inVy;

  // Check Collinearity between inV and outV:
  // inVx * outVy - inVy * outVx == 0
  const crossProduct = Math.abs(inVx * outVy - inVy * outVx);
  const isCollinear = crossProduct < 0.08;

  const isHorizontalEigen = isCollinear && Math.abs(inVy) < 0.1 && Math.abs(inVx) > 0.1;
  const isVerticalEigen = isCollinear && Math.abs(inVx) < 0.1 && Math.abs(inVy) > 0.1;

  useEffect(() => {
    if (isHorizontalEigen && !foundX1) setFoundX1(true);
    if (isVerticalEigen && !foundX2) setFoundX2(true);
  }, [isHorizontalEigen, isVerticalEigen, foundX1, foundX2]);

  // Scaling factor along the collinear line (Eigenvalue)
  const measuredLambda = isCollinear
    ? Math.abs(inVx) > 0.2
      ? outVx / inVx
      : outVy / inVy
    : null;

  // ----------------------------------------------------------------------
  // CANVAS 1: VECTOR EXPLORATION RENDERER
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'explore') return;
    const canvas = exploreCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const originX = width / 2;
    const originY = height / 2;
    const scale = Math.min(width, height) / 14;

    // 1. Grid Lines (Neutral, Never Green!)
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = -7; x <= 7; x++) {
      ctx.beginPath();
      ctx.moveTo(originX + x * scale, 0);
      ctx.lineTo(originX + x * scale, height);
      ctx.stroke();
    }
    for (let y = -7; y <= 7; y++) {
      ctx.beginPath();
      ctx.moveTo(0, originY - y * scale);
      ctx.lineTo(width, originY - y * scale);
      ctx.stroke();
    }

    // 2. Axes
    ctx.strokeStyle = isLight ? '#707568' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    ctx.fillStyle = isLight ? '#707568' : 'rgba(255, 255, 255, 0.65)';
    ctx.font = '10px monospace';
    ctx.fillText('+x', width - 22, originY - 6);
    ctx.fillText('+y', originX + 6, 16);

    // 3. 1D Span Line Guideline of Vector v
    ctx.save();
    const spanLength = 12;
    const dirX = Math.cos(angleRad);
    const dirY = Math.sin(angleRad);
    ctx.strokeStyle = isCollinear
      ? (isLight ? 'rgba(105, 121, 81, 0.85)' : 'rgba(168, 189, 217, 0.95)')
      : (isLight ? 'rgba(41, 47, 37, 0.22)' : 'rgba(255, 255, 255, 0.25)');
    ctx.lineWidth = isCollinear ? 2.0 : 1.2;
    if (!isLight && isCollinear) {
      ctx.shadowColor = 'rgba(168, 189, 217, 0.45)';
      ctx.shadowBlur = 6;
    }
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(originX - dirX * spanLength * scale, originY + dirY * spanLength * scale);
    ctx.lineTo(originX + dirX * spanLength * scale, originY - dirY * spanLength * scale);
    ctx.stroke();
    ctx.restore();

    // 4. Draw Transformed Vector Av
    const axTipX = originX + outVx * scale;
    const axTipY = originY - outVy * scale;
    const avColor = isCollinear
      ? (isLight ? '#697951' : '#A8BDD9')
      : (isLight ? '#707568' : '#CBD5E1');

    ctx.save();
    if (!isLight) {
      ctx.shadowColor = isCollinear ? 'rgba(168, 189, 217, 0.5)' : 'rgba(255, 255, 255, 0.35)';
      ctx.shadowBlur = 6;
    }
    ctx.strokeStyle = avColor;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(axTipX, axTipY);
    ctx.stroke();

    // Arrowhead for Av
    const axAngle = Math.atan2(-outVy, outVx);
    ctx.fillStyle = avColor;
    ctx.beginPath();
    ctx.moveTo(axTipX, axTipY);
    ctx.lineTo(axTipX - 11 * Math.cos(axAngle - Math.PI / 7), axTipY - 11 * Math.sin(axAngle - Math.PI / 7));
    ctx.lineTo(axTipX - 11 * Math.cos(axAngle + Math.PI / 7), axTipY - 11 * Math.sin(axAngle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 5. Draw Input Vector v
    const vTipX = originX + inVx * scale;
    const vTipY = originY - inVy * scale;
    const inVColor = isLight ? '#292F25' : '#FFFFFF';

    ctx.save();
    if (!isLight) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.52)';
      ctx.shadowBlur = 6;
    }
    ctx.strokeStyle = inVColor;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(vTipX, vTipY);
    ctx.stroke();

    // Arrowhead for v
    ctx.fillStyle = inVColor;
    ctx.beginPath();
    ctx.moveTo(vTipX, vTipY);
    ctx.lineTo(vTipX - 9 * Math.cos(angleRad - Math.PI / 7), vTipY + 9 * Math.sin(angleRad - Math.PI / 7));
    ctx.lineTo(vTipX - 9 * Math.cos(angleRad + Math.PI / 7), vTipY + 9 * Math.sin(angleRad + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Vector Labels
    ctx.save();
    ctx.font = 'bold 11px var(--font-mono), monospace';
    if (!isLight) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 4;
    }
    ctx.fillStyle = inVColor;
    ctx.fillText(`v [${inVx.toFixed(1)}, ${inVy.toFixed(1)}]`, vTipX + 8, vTipY - 6);

    ctx.fillStyle = avColor;
    ctx.fillText(`Av [${outVx.toFixed(1)}, ${outVy.toFixed(1)}]`, axTipX + 8, axTipY + 16);
    ctx.restore();

    // 7. Floating Collinearity Status Pill
    ctx.save();
    const bannerW = 320;
    const bannerH = 30;
    const bannerX = width / 2 - bannerW / 2;
    const bannerY = 14;

    ctx.fillStyle = isLight
      ? (isCollinear ? '#EFF4E7' : '#FAF9F2')
      : (isCollinear ? 'rgba(168, 189, 217, 0.15)' : 'rgba(19, 15, 13, 0.85)');
    ctx.strokeStyle = isLight
      ? (isCollinear ? '#697951' : '#DCE2D2')
      : (isCollinear ? '#A8BDD9' : 'rgba(255, 255, 255, 0.15)');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 9999);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px var(--font-sans), sans-serif';
    ctx.textAlign = 'center';
    if (isCollinear) {
      ctx.fillStyle = isLight ? '#424F34' : '#FFFFFF';
      ctx.fillText(`✓ Eigenvector Found! Lies on span line (λ = ${measuredLambda?.toFixed(1)})`, width / 2, bannerY + 19);
    } else {
      ctx.fillStyle = isLight ? '#707568' : 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`Rotates off span line (Not an Eigenvector)`, width / 2, bannerY + 19);
    }
    ctx.restore();
  }, [activeTab, inVx, inVy, outVx, outVy, isCollinear, measuredLambda, angleRad, isLight]);

  // ----------------------------------------------------------------------
  // CANVAS 2: DYNAMIC EIGENVALUE MATRIX RENDERER
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'eigenvalues') return;
    const canvas = eigenCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    const originX = width / 2;
    const originY = height / 2;
    const scale = Math.min(width, height) / 12;

    // Background Grid
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = -6; x <= 6; x++) {
      ctx.beginPath();
      ctx.moveTo(originX + x * scale, 0);
      ctx.lineTo(originX + x * scale, height);
      ctx.stroke();
    }
    for (let y = -6; y <= 6; y++) {
      ctx.beginPath();
      ctx.moveTo(0, originY - y * scale);
      ctx.lineTo(width, originY - y * scale);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = isLight ? '#707568' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // 1. Transformed Unit Circle (Deformation Ellipse)
    if (showGridMesh) {
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(105, 121, 81, 0.45)' : 'rgba(168, 189, 217, 0.65)';
      ctx.lineWidth = 2.0;
      if (!isLight) {
        ctx.shadowColor = 'rgba(168, 189, 217, 0.35)';
        ctx.shadowBlur = 5;
      }
      ctx.beginPath();
      const numPts = 72;
      for (let i = 0; i <= numPts; i++) {
        const theta = (i * 2 * Math.PI) / numPts;
        const uX = Math.cos(theta);
        const uY = Math.sin(theta);
        const tX = lambdaX * uX;
        const tY = lambdaY * uY;
        const pX = originX + tX * scale;
        const pY = originY - tY * scale;
        if (i === 0) ctx.moveTo(pX, pY);
        else ctx.lineTo(pX, pY);
      }
      ctx.closePath();
      ctx.fillStyle = isLight ? 'rgba(105, 121, 81, 0.06)' : 'rgba(168, 189, 217, 0.10)';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 2. Vector v1 (Horizontal Eigenvector: [1, 0]^T -> [lambdaX, 0]^T)
    const origX1TipX = originX + 1.0 * scale;
    const transX1TipX = originX + lambdaX * scale;
    const x1Color = isLight ? '#292F25' : '#FFFFFF';

    // Original v1 ghost
    ctx.save();
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.35)' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(origX1TipX, originY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Transformed v1
    if (!isLight) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.52)';
      ctx.shadowBlur = 6;
    }
    ctx.strokeStyle = x1Color;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(transX1TipX, originY);
    ctx.stroke();

    const x1Angle = lambdaX >= 0 ? 0 : Math.PI;
    ctx.fillStyle = x1Color;
    ctx.beginPath();
    ctx.moveTo(transX1TipX, originY);
    ctx.lineTo(transX1TipX - 9 * Math.cos(x1Angle - Math.PI / 7), originY - 9 * Math.sin(x1Angle - Math.PI / 7));
    ctx.lineTo(transX1TipX - 9 * Math.cos(x1Angle + Math.PI / 7), originY - 9 * Math.sin(x1Angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Vector v2 (Vertical Eigenvector: [0, 1]^T -> [0, lambdaY]^T)
    const origX2TipY = originY - 1.0 * scale;
    const transX2TipY = originY - lambdaY * scale;
    const x2Color = isLight ? '#697951' : '#A8BDD9';

    // Original v2 ghost
    ctx.save();
    ctx.strokeStyle = isLight ? 'rgba(105, 121, 81, 0.4)' : 'rgba(168, 189, 217, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX, origX2TipY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Transformed v2
    if (!isLight) {
      ctx.shadowColor = 'rgba(168, 189, 217, 0.5)';
      ctx.shadowBlur = 6;
    }
    ctx.strokeStyle = x2Color;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX, transX2TipY);
    ctx.stroke();

    const x2Angle = lambdaY >= 0 ? -Math.PI / 2 : Math.PI / 2;
    ctx.fillStyle = x2Color;
    ctx.beginPath();
    ctx.moveTo(originX, transX2TipY);
    ctx.lineTo(originX - 9 * Math.cos(x2Angle - Math.PI / 7), transX2TipY - 9 * Math.sin(x2Angle - Math.PI / 7));
    ctx.lineTo(originX - 9 * Math.cos(x2Angle + Math.PI / 7), transX2TipY - 9 * Math.sin(x2Angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Arbitrary Probe Vector (demonstrating off-axis rotation)
    const pRad = (probeAngle * Math.PI) / 180;
    const pInX = 1.4 * Math.cos(pRad);
    const pInY = 1.4 * Math.sin(pRad);
    const pOutX = lambdaX * pInX;
    const pOutY = lambdaY * pInY;

    ctx.save();
    const probeCol = isLight ? '#B45309' : '#FCD34D';
    if (!isLight) {
      ctx.shadowColor = 'rgba(252, 211, 77, 0.45)';
      ctx.shadowBlur = 5;
    }
    ctx.strokeStyle = probeCol;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + pOutX * scale, originY - pOutY * scale);
    ctx.stroke();
    ctx.fillStyle = probeCol;
    ctx.font = '10px var(--font-mono), monospace';
    ctx.fillText('Probe Av', originX + pOutX * scale + 6, originY - pOutY * scale);
    ctx.restore();

    // Labels
    ctx.save();
    ctx.font = 'bold 11px var(--font-mono), monospace';
    if (!isLight) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 4;
    }
    ctx.fillStyle = x1Color;
    ctx.fillText(`Av₁ = [${lambdaX.toFixed(1)}, 0]ᵀ`, transX1TipX + (lambdaX >= 0 ? 8 : -95), originY + 16);

    ctx.fillStyle = x2Color;
    ctx.fillText(`Av₂ = [0, ${lambdaY.toFixed(1)}]ᵀ`, originX + 8, transX2TipY + (lambdaY >= 0 ? -6 : 14));
    ctx.restore();
  }, [activeTab, lambdaX, lambdaY, probeAngle, showGridMesh, isLight]);

  // ----------------------------------------------------------------------
  // CANVAS 3: IMAGE SCALING & EIGENVECTOR OVERLAY
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'image-scaling') return;
    const canvas = imageCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const source = customImageSrc ? new Image() : offscreenCanvasRef.current;

    const renderImageStretch = (imgSource) => {
      ctx.clearRect(0, 0, width, height);
      const originX = width / 2;
      const originY = height / 2;

      const baseW = 150;
      const baseH = 150;
      const scaledW = baseW * imageLambdaX;
      const scaledH = baseH * imageLambdaY;

      // Background Grid
      ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.08)' : 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Dashed reference box for original unscaled dimensions
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.28)' : 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(originX - baseW / 2, originY - baseH / 2, baseW, baseH);
      ctx.restore();

      // Render Stretched Image using Canvas transform
      if (imgSource) {
        ctx.save();
        ctx.translate(originX, originY);
        ctx.drawImage(imgSource, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
        ctx.restore();
      }

      // Invariant Eigenvector Direction Overlays
      ctx.save();
      // Horizontal Eigenvector v1
      const arrowLenX = (scaledW / 2) + 24;
      const arrowXColor = isLight ? '#292F25' : '#FFFFFF';
      if (!isLight) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.55)';
        ctx.shadowBlur = 6;
      }
      ctx.strokeStyle = arrowXColor;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX + arrowLenX, originY);
      ctx.stroke();
      ctx.fillStyle = arrowXColor;
      ctx.beginPath();
      ctx.moveTo(originX + arrowLenX, originY);
      ctx.lineTo(originX + arrowLenX - 9, originY - 5);
      ctx.lineTo(originX + arrowLenX - 9, originY + 5);
      ctx.closePath();
      ctx.fill();

      // Vertical Eigenvector v2
      const arrowLenY = (scaledH / 2) + 24;
      const arrowYColor = isLight ? '#697951' : '#A8BDD9';
      if (!isLight) {
        ctx.shadowColor = 'rgba(168, 189, 217, 0.5)';
        ctx.shadowBlur = 6;
      }
      ctx.strokeStyle = arrowYColor;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX, originY - arrowLenY);
      ctx.stroke();
      ctx.fillStyle = arrowYColor;
      ctx.beginPath();
      ctx.moveTo(originX, originY - arrowLenY);
      ctx.lineTo(originX - 5, originY - arrowLenY + 9);
      ctx.lineTo(originX + 5, originY - arrowLenY + 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Labels
      ctx.save();
      ctx.font = 'bold 11px var(--font-mono), monospace';
      if (!isLight) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 4;
      }
      ctx.fillStyle = arrowXColor;
      ctx.fillText(`v₁ (Horizontal) · Factor ${imageLambdaX.toFixed(1)}`, originX + 12, originY + 16);

      ctx.fillStyle = arrowYColor;
      ctx.fillText(`v₂ (Vertical) · Factor ${imageLambdaY.toFixed(1)}`, originX + 12, originY - arrowLenY + 12);
      ctx.restore();
    };

    if (customImageSrc) {
      const img = new Image();
      img.onload = () => renderImageStretch(img);
      img.src = customImageSrc;
    } else {
      renderImageStretch(source);
    }
  }, [activeTab, customImageSrc, selectedPreset, imageLambdaX, imageLambdaY, presetCanvasKey, isLight]);

  // ----------------------------------------------------------------------
  // CANVAS 4: REFLECTION & NEGATIVE LAMBDA VISUALIZER
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'reflection-challenge') return;
    const canvas = reflectionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    const originX = width / 2;
    const originY = height / 2;
    const scale = Math.min(width, height) / 10;

    // Background Grid
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = -5; x <= 5; x++) {
      ctx.beginPath();
      ctx.moveTo(originX + x * scale, 0);
      ctx.lineTo(originX + x * scale, height);
      ctx.stroke();
    }
    for (let y = -5; y <= 5; y++) {
      ctx.beginPath();
      ctx.moveTo(0, originY - y * scale);
      ctx.lineTo(width, originY - y * scale);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = isLight ? '#707568' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Mirror plane line (y-axis)
    ctx.save();
    const mirrorLineCol = isLight ? '#697951' : '#9EC5AB';
    if (!isLight) {
      ctx.shadowColor = 'rgba(158, 197, 171, 0.45)';
      ctx.shadowBlur = 5;
    }
    ctx.strokeStyle = mirrorLineCol;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(originX, 10);
    ctx.lineTo(originX, height - 10);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = mirrorLineCol;
    ctx.font = 'bold 10px var(--font-sans), sans-serif';
    ctx.fillText('Reflection Plane (x = 0)', originX + 8, 22);

    // Render flower image reflected
    const source = customImageSrc ? new Image() : offscreenCanvasRef.current;
    const imgW = 110;
    const imgH = 110;

    const drawReflectedScene = (img) => {
      if (img) {
        ctx.save();
        ctx.translate(originX, originY);
        ctx.scale(reflectionAnim, 1);
        ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
        ctx.restore();
      }

      const vOriginalTipX = originX + 2.0 * scale;
      const vReflectedTipX = originX - 2.0 * scale;

      // Guideline (The horizontal 1D line)
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(105, 121, 81, 0.4)' : 'rgba(168, 189, 217, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.stroke();
      ctx.restore();

      // Original vector v1
      ctx.save();
      const origVCol = isLight ? '#292F25' : '#FFFFFF';
      if (!isLight) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.52)';
        ctx.shadowBlur = 6;
      }
      ctx.strokeStyle = origVCol;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(vOriginalTipX, originY);
      ctx.stroke();
      ctx.fillStyle = origVCol;
      ctx.beginPath();
      ctx.moveTo(vOriginalTipX, originY);
      ctx.lineTo(vOriginalTipX - 9, originY - 5);
      ctx.lineTo(vOriginalTipX - 9, originY + 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Reflected vector Av1
      if (reflectionAnim === -1) {
        ctx.save();
        const reflVCol = isLight ? '#697951' : '#A8BDD9';
        if (!isLight) {
          ctx.shadowColor = 'rgba(168, 189, 217, 0.5)';
          ctx.shadowBlur = 6;
        }
        ctx.strokeStyle = reflVCol;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(vReflectedTipX, originY);
        ctx.stroke();
        ctx.fillStyle = reflVCol;
        ctx.beginPath();
        ctx.moveTo(vReflectedTipX, originY);
        ctx.lineTo(vReflectedTipX + 9, originY - 5);
        ctx.lineTo(vReflectedTipX + 9, originY + 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.font = 'bold 11px var(--font-mono), monospace';
        if (!isLight) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
          ctx.shadowBlur = 4;
        }
        ctx.fillStyle = isLight ? '#697951' : '#A8BDD9';
        ctx.fillText('Av₁ = [-1, 0]ᵀ = (-1)·v₁', vReflectedTipX - 130, originY - 10);
        ctx.restore();
      }

      ctx.save();
      ctx.font = 'bold 11px var(--font-mono), monospace';
      if (!isLight) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 4;
      }
      ctx.fillStyle = isLight ? '#292F25' : '#FFFFFF';
      ctx.fillText('Original v₁ = [1, 0]ᵀ', vOriginalTipX + 10, originY - 10);
      ctx.restore();
    };

    if (customImageSrc) {
      const img = new Image();
      img.onload = () => drawReflectedScene(img);
      img.src = customImageSrc;
    } else {
      drawReflectedScene(source);
    }
  }, [activeTab, customImageSrc, reflectionAnim, presetCanvasKey, isLight]);

  return (
    <div className="math-step-view" style={{ maxWidth: '1220px', margin: '0 auto', padding: '1.25rem 1rem' }}>
      {/* 1. COMPACT STANDARDIZED HEADER */}
      <div className="step-header-box" style={{ marginBottom: '1rem', padding: '0.9rem 1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.3rem' }}>
          <h2 className="step-heading" style={{ margin: 0 }}>
            Eigenvalues &amp; Eigenvectors
          </h2>
          <span className="badge-tag-mini" style={{ fontSize: '0.74rem', padding: '0.15rem 0.5rem' }}>
            Invariant Directions: A·v = λ·v
          </span>
        </div>

        <p className="step-description" style={{ fontSize: '0.80rem', margin: 0 }}>
          Some vectors preserve their directional span when transformed by matrix A: <code>Av = λv</code>.
          Discover invariant coordinate axes, scale image dimensions under <code>A = [2 0; 0 1]</code>, and explore why negative eigenvalues
          (<code>λ = −1</code>) preserve straight-line subspaces during reflection.
        </p>

        {/* NAVIGATION TABS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`sub-chapter-pill ${activeTab === 'explore' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Compass size={14} />
            <span>1. Rotate &amp; Find Eigenvectors</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('eigenvalues')}
            className={`sub-chapter-pill ${activeTab === 'eigenvalues' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sliders size={14} />
            <span>2. Eigenvalue Scaling Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image-scaling')}
            className={`sub-chapter-pill ${activeTab === 'image-scaling' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Layers size={14} />
            <span>3. Image Scaling</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reflection-challenge')}
            className={`sub-chapter-pill ${activeTab === 'reflection-challenge' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <HelpCircle size={14} />
            <span>4. Reflection Challenge (λ = −1)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ROTATE / SCALE & FIND EIGENVECTORS */}
      {/* ========================================================================= */}
      {activeTab === 'explore' && (
        <div className="step18-workbench">
          {/* Left Column: Controls & Checklist */}
          <div className="step18-left-col">
            <div className="step18-card">
              <div className="step18-card-header">
                <h3 className="step18-card-title">
                  <Compass size={15} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Transformation Matrix A</span>
                </h3>
                <span className="step18-badge">A = [2 0; 0 1]</span>
              </div>

              <p className="step18-desc">
                For vector v = [x, y]ᵀ, matrix multiplication yields Av = [2x, y]ᵀ.
                Rotate and scale v. When v and Av <strong>lie on the exact same line</strong>, v is an <strong>eigenvector</strong>.
              </p>

              {/* Sliders in Params Box */}
              <div className="step18-params-box">
                {/* Angle Slider */}
                <div className="step18-slider-row">
                  <div className="step18-slider-header">
                    <span>Rotate Input Vector (θ):</span>
                    <span className="step18-slider-val">{vectorAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={vectorAngle}
                    onChange={e => setVectorAngle(parseInt(e.target.value, 10))}
                    className="step18-range-input"
                    style={{ '--slider-pct': `${(vectorAngle / 360) * 100}%` }}
                  />
                </div>

                {/* Magnitude Slider */}
                <div className="step18-slider-row">
                  <div className="step18-slider-header">
                    <span>Magnitude ‖v‖:</span>
                    <span className="step18-slider-val">{vectorMag.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={vectorMag}
                    onChange={e => setVectorMag(parseFloat(e.target.value))}
                    className="step18-range-input"
                    style={{ '--slider-pct': `${((vectorMag - 0.5) / 2.5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Candidate Direction Presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.70rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Test Candidate Directions:
                </span>
                <div className="step18-pill-grid">
                  <button
                    type="button"
                    onClick={() => { setVectorAngle(0); setVectorMag(2); }}
                    className={`step18-pill-btn ${vectorAngle === 0 ? 'active' : ''}`}
                  >
                    <span>Horizontal v₁ [1, 0]</span>
                    <span style={{ fontSize: '0.64rem', opacity: 0.8 }}>0°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setVectorAngle(90); setVectorMag(2); }}
                    className={`step18-pill-btn ${vectorAngle === 90 ? 'active' : ''}`}
                  >
                    <span>Vertical v₂ [0, 1]</span>
                    <span style={{ fontSize: '0.64rem', opacity: 0.8 }}>90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setVectorAngle(45); setVectorMag(2); }}
                    className={`step18-pill-btn ${vectorAngle === 45 ? 'active' : ''}`}
                  >
                    <span>Diagonal [1, 1]</span>
                    <span style={{ fontSize: '0.64rem', opacity: 0.8 }}>45° (Off)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setVectorAngle(180); setVectorMag(2); }}
                    className={`step18-pill-btn ${vectorAngle === 180 ? 'active' : ''}`}
                  >
                    <span>Negative v₁ [-1, 0]</span>
                    <span style={{ fontSize: '0.64rem', opacity: 0.8 }}>180°</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Checklist of Special Directions */}
            <div className="step18-card">
              <div className="step18-card-header">
                <h4 className="step18-card-title">
                  <CheckCircle2 size={15} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Eigenvector Checklist</span>
                </h4>
                <span className="step18-badge-accent">
                  {(foundX1 ? 1 : 0) + (foundX2 ? 1 : 0)} / 2 Detected
                </span>
              </div>

              <div className="step18-checklist">
                <div className={`step18-check-item ${foundX1 ? 'found' : ''}`}>
                  <div className="step18-check-left">
                    {foundX1 ? (
                      <CheckCircle2 size={15} style={{ color: isLight ? '#697951' : '#FFFFFF', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border-color)', flexShrink: 0 }} />
                    )}
                    <div>
                      <div className="step18-check-title">Horizontal Eigenvector v₁ = [1, 0]ᵀ</div>
                      <div className="step18-check-sub">Av₁ = [2, 0]ᵀ = 2 · v₁ (Stretched × 2)</div>
                    </div>
                  </div>
                  <span className="step18-check-badge">λ₁ = 2</span>
                </div>

                <div className={`step18-check-item ${foundX2 ? 'found' : ''}`}>
                  <div className="step18-check-left">
                    {foundX2 ? (
                      <CheckCircle2 size={15} style={{ color: isLight ? '#697951' : '#FFFFFF', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border-color)', flexShrink: 0 }} />
                    )}
                    <div>
                      <div className="step18-check-title">Vertical Eigenvector v₂ = [0, 1]ᵀ</div>
                      <div className="step18-check-sub">Av₂ = [0, 1]ᵀ = 1 · v₂ (Unchanged length)</div>
                    </div>
                  </div>
                  <span className="step18-check-badge">λ₂ = 1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Canvas */}
          <div className="step18-right-col">
            <div className="step18-canvas-card">
              <div className="step18-card-header">
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Interactive 2D Vector &amp; Span Line Simulation
                </span>
                <span className="step18-badge">
                  A = diag(2, 1)
                </span>
              </div>

              <div className="step18-canvas-frame">
                <canvas ref={exploreCanvasRef} width={560} height={400} />
              </div>

              {/* Clean Legend */}
              <div className="step18-legend-bar">
                <span className="step18-legend-item">
                  <span className="step17-legend-dot" style={{ background: isLight ? '#292F25' : '#FFFFFF' }} />
                  <span>Input Vector v</span>
                </span>
                <span className="step18-legend-item">
                  <span className="step17-legend-dot" style={{ background: isLight ? '#697951' : '#A8BDD9' }} />
                  <span>Transformed Av</span>
                </span>
                <span className="step18-legend-item">
                  <span style={{ width: 14, height: 2, borderTop: '2px dashed var(--text-muted)' }} />
                  <span>1D Span Line</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: INTRODUCE EIGENVALUES & DYNAMIC MATRIX A */}
      {/* ========================================================================= */}
      {activeTab === 'eigenvalues' && (
        <div className="step18-workbench">
          {/* Left Column: Sliders & Form */}
          <div className="step18-left-col">
            <div className="step18-card">
              <div className="step18-card-header">
                <h3 className="step18-card-title">
                  <Sliders size={15} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Matrix A = diag(λx, λy)</span>
                </h3>
                <span className="step18-badge">Av = λv</span>
              </div>

              <p className="step18-desc">
                The diagonal entries λx and λy are <strong>eigenvalues</strong>: they represent the exact scaling factors
                along their respective eigenvector axes.
              </p>

              {/* Sliders in Params Box */}
              <div className="step18-params-box">
                <div className="step18-slider-row">
                  <div className="step18-slider-header">
                    <span>Horizontal Eigenvalue (λx):</span>
                    <span className="step18-slider-val">{lambdaX.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.1"
                    value={lambdaX}
                    onChange={e => setLambdaX(parseFloat(e.target.value))}
                    className="step18-range-input"
                    style={{ '--slider-pct': `${((lambdaX + 3.0) / 6.0) * 100}%` }}
                  />
                </div>

                <div className="step18-slider-row">
                  <div className="step18-slider-header">
                    <span>Vertical Eigenvalue (λy):</span>
                    <span className="step18-slider-val">{lambdaY.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.1"
                    value={lambdaY}
                    onChange={e => setLambdaY(parseFloat(e.target.value))}
                    className="step18-range-input"
                    style={{ '--slider-pct': `${((lambdaY + 3.0) / 6.0) * 100}%` }}
                  />
                </div>

                <div className="step18-slider-row">
                  <div className="step18-slider-header">
                    <span>Arbitrary Probe Vector Angle:</span>
                    <span className="step18-slider-val">{probeAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={probeAngle}
                    onChange={e => setProbeAngle(parseInt(e.target.value, 10))}
                    className="step18-range-input"
                    style={{ '--slider-pct': `${(probeAngle / 360) * 100}%` }}
                  />
                </div>
              </div>

              {/* Preset Matrix Configurations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.70rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Preset Configurations:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {[
                    { label: 'Curriculum: [2 0; 0 1]', lx: 2.0, ly: 1.0 },
                    { label: 'Identity: [1 0; 0 1]', lx: 1.0, ly: 1.0 },
                    { label: 'Reflection: [-1 0; 0 1]', lx: -1.0, ly: 1.0 },
                    { label: 'Uniform Zoom: [2 0; 0 2]', lx: 2.0, ly: 2.0 },
                    { label: 'Singular: [0 0; 0 1]', lx: 0.0, ly: 1.0 }
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => { setLambdaX(p.lx); setLambdaY(p.ly); }}
                      className="step18-pill-btn"
                      style={{ width: 'auto', flexGrow: 1 }}
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Matrix Form Visual Display */}
            <div className="step18-card">
              <div className="step18-card-header">
                <h4 className="step18-card-title">
                  <Info size={14} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Current Linear System</span>
                </h4>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  A = [{lambdaX.toFixed(1)} &nbsp; 0; &nbsp; 0 &nbsp; {lambdaY.toFixed(1)}]
                </div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-secondary)' }}>
                  Av₁ = {lambdaX.toFixed(1)} · [1, 0]ᵀ &nbsp; | &nbsp; Av₂ = {lambdaY.toFixed(1)} · [0, 1]ᵀ
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Canvas */}
          <div className="step18-right-col">
            <div className="step18-canvas-card">
              <div className="step18-card-header">
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Deformation Ellipse &amp; Eigenvector Scaling
                </span>
                <label style={{ fontSize: '0.70rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showGridMesh}
                    onChange={e => setShowGridMesh(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Show Unit Circle</span>
                </label>
              </div>

              <div className="step18-canvas-frame">
                <canvas ref={eigenCanvasRef} width={560} height={400} />
              </div>

              <div className="step18-legend-bar">
                <span className="step18-legend-item">
                  <span className="step17-legend-dot" style={{ background: isLight ? '#292F25' : '#FFFFFF' }} />
                  <span>Av₁ (λx = {lambdaX.toFixed(1)})</span>
                </span>
                <span className="step18-legend-item">
                  <span className="step17-legend-dot" style={{ background: isLight ? '#697951' : '#A8BDD9' }} />
                  <span>Av₂ (λy = {lambdaY.toFixed(1)})</span>
                </span>
                <span className="step18-legend-item">
                  <span className="step17-legend-dot" style={{ background: isLight ? '#B45309' : '#FBBF24' }} />
                  <span>Off-axis Probe Av</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: TRY YOUR OWN IMAGE / FLOWER LAB */}
      {/* ========================================================================= */}
      {activeTab === 'image-scaling' && (
        <div className="step18-workbench">
          {/* Left Column: Image Controls */}
          <div className="step18-left-col">
            <div className="step18-card">
              <div className="step18-card-header">
                <h3 className="step18-card-title">
                  <Layers size={15} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Image Transformation</span>
                </h3>
                <span className="step18-badge">A = [{imageLambdaX.toFixed(1)} 0; 0 {imageLambdaY.toFixed(1)}]</span>
              </div>

              <p className="step18-desc">
                Apply diagonal scaling A = [2 0; 0 1] to a flower image. Horizontal dimensions stretch by factor 2 while vertical
                dimensions remain unchanged. The eigenvalues are <strong>2</strong> and <strong>1</strong>.
              </p>

              {/* Preset Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.70rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Choose Image Source:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => { setCustomImageSrc(null); setSelectedPreset('flower'); }}
                    className={`step18-pill-btn ${!customImageSrc && selectedPreset === 'flower' ? 'active' : ''}`}
                    style={{ justifyContent: 'center' }}
                  >
                    🌸 Flower
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCustomImageSrc(null); setSelectedPreset('portrait'); }}
                    className={`step18-pill-btn ${!customImageSrc && selectedPreset === 'portrait' ? 'active' : ''}`}
                    style={{ justifyContent: 'center' }}
                  >
                    👤 Icon
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCustomImageSrc(null); setSelectedPreset('grid'); }}
                    className={`step18-pill-btn ${!customImageSrc && selectedPreset === 'grid' ? 'active' : ''}`}
                    style={{ justifyContent: 'center' }}
                  >
                    🌐 Grid
                  </button>
                </div>

                {/* Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="step18-pill-btn"
                  style={{ justifyContent: 'center', marginTop: '0.2rem', gap: '0.4rem' }}
                >
                  <Upload size={13} />
                  <span>Upload Image File</span>
                </button>
              </div>

              {/* Stretch Sliders */}
              <div className="step18-params-box">
                <div className="step18-slider-row">
                  <div className="step18-slider-header">
                    <span>Stretch in x-direction (λx):</span>
                    <span className="step18-slider-val">{imageLambdaX.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={imageLambdaX}
                    onChange={e => setImageLambdaX(parseFloat(e.target.value))}
                    className="step18-range-input"
                    style={{ '--slider-pct': `${((imageLambdaX - 0.5) / 2.5) * 100}%` }}
                  />
                </div>

                <div className="step18-slider-row">
                  <div className="step18-slider-header">
                    <span>Stretch in y-direction (λy):</span>
                    <span className="step18-slider-val">{imageLambdaY.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={imageLambdaY}
                    onChange={e => setImageLambdaY(parseFloat(e.target.value))}
                    className="step18-range-input"
                    style={{ '--slider-pct': `${((imageLambdaY - 0.5) / 2.5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Reset Button */}
              <button
                type="button"
                onClick={() => { setImageLambdaX(2.0); setImageLambdaY(1.0); }}
                className="step18-pill-btn"
                style={{ justifyContent: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={13} />
                <span>Reset: A = [2 0; 0 1]</span>
              </button>
            </div>

            {/* Analysis Card */}
            <div className="step18-card">
              <div className="step18-card-header">
                <h4 className="step18-card-title">
                  <Info size={14} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Why are eigenvalues 2 and 1?</span>
                </h4>
              </div>
              <p className="step18-desc">
                Horizontal coordinates stretch by <strong>{imageLambdaX.toFixed(1)}</strong> while vertical coordinates scale by <strong>{imageLambdaY.toFixed(1)}</strong>.
                Because the matrix is diagonal, the Cartesian axes coincide with the eigenvectors.
              </p>
            </div>
          </div>

          {/* Right Column: Canvas */}
          <div className="step18-right-col">
            <div className="step18-canvas-card">
              <div className="step18-card-header">
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Real-time Image Eigen-Stretch
                </span>
                <span className="step18-badge">
                  λx = {imageLambdaX.toFixed(1)}, λy = {imageLambdaY.toFixed(1)}
                </span>
              </div>

              <div className="step18-canvas-frame">
                <canvas ref={imageCanvasRef} width={560} height={400} />
              </div>

              <div className="step18-legend-bar">
                <span className="step18-legend-item">
                  <span className="step17-legend-dot" style={{ background: isLight ? '#292F25' : '#FFFFFF' }} />
                  <span>Horizontal Axis (× {imageLambdaX.toFixed(1)})</span>
                </span>
                <span className="step18-legend-item">
                  <span className="step17-legend-dot" style={{ background: isLight ? '#697951' : '#A8BDD9' }} />
                  <span>Vertical Axis (× {imageLambdaY.toFixed(1)})</span>
                </span>
                <span className="step18-legend-item">
                  <span style={{ width: 14, height: 2, borderTop: '2px dashed var(--text-muted)' }} />
                  <span>Original Proportions</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: REFLECTION & NEGATIVE EIGENVALUE CHALLENGE */}
      {/* ========================================================================= */}
      {activeTab === 'reflection-challenge' && (
        <div className="step18-workbench">
          {/* Left Column: Quiz & Controls */}
          <div className="step18-left-col">
            <div className="step18-card">
              <div className="step18-card-header">
                <h3 className="step18-card-title">
                  <FlipHorizontal size={15} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Horizontal Reflection Matrix</span>
                </h3>
                <span className="step18-badge">A = [-1 0; 0 1]</span>
              </div>

              {/* Orientation Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setReflectionAnim(1)}
                  className={`step18-pill-btn ${reflectionAnim === 1 ? 'active' : ''}`}
                  style={{ justifyContent: 'center' }}
                >
                  Original Orientation
                </button>
                <button
                  type="button"
                  onClick={() => setReflectionAnim(-1)}
                  className={`step18-pill-btn ${reflectionAnim === -1 ? 'active' : ''}`}
                  style={{ justifyContent: 'center' }}
                >
                  Reflected (x → −x)
                </button>
              </div>

              {/* Conceptual Question */}
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <HelpCircle size={14} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Curriculum Conceptual Question:</span>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic', lineHeight: 1.45 }}>
                  "If the image is reflected horizontally, does the horizontal eigenvector cease to be an eigenvector? Why or why not?"
                </p>
              </div>

              {/* Quiz Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {[
                  {
                    id: 'ceases',
                    text: 'Yes: It flipped 180°, so its direction changed and it ceases to be an eigenvector.',
                    isCorrect: false
                  },
                  {
                    id: 'stays',
                    text: 'No: It is STILL an eigenvector! It still lies along the same horizontal 1D line, with negative eigenvalue λ = −1.',
                    isCorrect: true
                  },
                  {
                    id: 'depends',
                    text: 'Only if the vector has zero magnitude.',
                    isCorrect: false
                  }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedAnswer(opt.id);
                      setIsAnswerSubmitted(true);
                    }}
                    className={`step18-quiz-option ${
                      selectedAnswer === opt.id
                        ? opt.isCorrect
                          ? 'correct'
                          : 'incorrect'
                        : ''
                    }`}
                  >
                    <div style={{ marginTop: '0.1rem', flexShrink: 0 }}>
                      {selectedAnswer === opt.id ? (
                        opt.isCorrect ? <Check size={14} /> : <X size={14} />
                      ) : (
                        <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid var(--border-color)' }} />
                      )}
                    </div>
                    <span>{opt.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* In-depth Pedagogical Clarification */}
            <AnimatePresence>
              {isAnswerSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="step18-card"
                >
                  <div className="step18-card-header">
                    <h4 className="step18-card-title">
                      <CheckCircle2 size={15} style={{ color: 'var(--accent-primary, #697951)' }} />
                      <span>Line Subspace vs. Arrow Orientation</span>
                    </h4>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.45rem', lineHeight: 1.45 }}>
                    <p style={{ margin: 0 }}>
                      <strong>Subspace Invariance:</strong> An eigenvector only requires that Av lies within the <em>1-dimensional subspace</em> (the infinite straight line) spanned by v:
                    </p>
                    <div style={{ padding: '0.45rem 0.65rem', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-primary)' }}>
                      A · v₁ = [-1 &nbsp; 0; 0 &nbsp; 1] · [1, 0]ᵀ = [-1, 0]ᵀ = (-1) · v₁
                    </div>
                    <p style={{ margin: 0 }}>
                      The scalar factor λ = −1 reverses orientation along the axis, but <strong>preserves its direction as a line</strong>. Thus, v₁ = [1, 0]ᵀ remains a valid eigenvector.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Canvas */}
          <div className="step18-right-col">
            <div className="step18-canvas-card">
              <div className="step18-card-header">
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Horizontal Reflection Visualizer
                </span>
                <span className="step18-badge">
                  λ₁ = −1, λ₂ = +1
                </span>
              </div>

              <div className="step18-canvas-frame">
                <canvas ref={reflectionCanvasRef} width={560} height={400} />
              </div>

              <div className="step18-legend-bar">
                <span className="step18-legend-item">
                  <span className="step17-legend-dot" style={{ background: isLight ? '#292F25' : '#FFFFFF' }} />
                  <span>Original v₁ [1, 0]ᵀ</span>
                </span>
                <span className="step18-legend-item">
                  <span className="step17-legend-dot" style={{ background: isLight ? '#697951' : '#A8BDD9' }} />
                  <span>Reflected Av₁ [-1, 0]ᵀ</span>
                </span>
                <span className="step18-legend-item">
                  <span style={{ width: 14, height: 2, borderTop: '2px dashed var(--text-muted)' }} />
                  <span>Preserved 1D Span Line</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STANDARDIZED EDUCATIONAL DOCUMENTATION */}
      <div style={{ marginTop: '1.25rem' }}>
        <ModuleDocumentation stepNumber={18} defaultOpen={false} />
      </div>

      {/* FOOTER NAVIGATION */}
      <StepFooter stepNumber={18} onSelectStep={onSelectStep} />
    </div>
  );
}
