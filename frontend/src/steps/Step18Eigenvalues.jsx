import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Variable,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Compass,
  Repeat,
  CheckCircle2,
  Info,
  Maximize2,
  Upload,
  Sliders,
  Eye,
  FlipHorizontal,
  RefreshCw,
  Check,
  X,
  Zap
} from 'lucide-react';
import StepFooter from '../components/layout/StepFooter';

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
    const petals = 8;
    for (let i = 0; i < petals; i++) {
      const a = (i * 2 * Math.PI) / petals;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.fillStyle = i % 2 === 0 ? '#f43f5e' : '#fb7185';
      ctx.beginPath();
      ctx.ellipse(0, size * 0.26, size * 0.11, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#be123c';
      ctx.lineWidth = Math.max(1, size / 120);
      ctx.stroke();
      ctx.restore();
    }
    // Flower Center
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = Math.max(1, size / 100);
    ctx.stroke();
    // Inner dots
    ctx.fillStyle = '#78350f';
    for (let d = 0; d < 6; d++) {
      const da = (d * 2 * Math.PI) / 6;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(da) * size * 0.06, cy + Math.sin(da) * size * 0.06, size * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (presetId === 'portrait') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(1, '#6366f1');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.4, size * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#818cf8';
    ctx.beginPath();
    ctx.ellipse(size / 2, size * 0.85, size * 0.36, size * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Geometric Grid
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
    ctx.lineWidth = 1.5;
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
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function Step18Eigenvalues({ onSelectStep }) {
  // Navigation Tabs: 'explore' | 'eigenvalues' | 'image-scaling' | 'reflection-challenge'
  const [activeTab, setActiveTab] = useState('explore');

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

  // Offscreen canvas for preset generation
  const offscreenCanvasRef = useRef(null);
  const [presetCanvasKey, setPresetCanvasKey] = useState(0);

  // Pulse animation for eigenvector alignment
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    let frameId;
    const animate = () => {
      setPulse(p => (p + 0.04) % (Math.PI * 2));
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

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
  // inVx * (1 * inVy) - inVy * (2 * inVx) = -inVx * inVy
  const crossProduct = Math.abs(inVx * outVy - inVy * outVx);
  const isCollinear = crossProduct < 0.06;

  const isHorizontalEigen = isCollinear && Math.abs(inVy) < 0.08 && Math.abs(inVx) > 0.1;
  const isVerticalEigen = isCollinear && Math.abs(inVx) < 0.08 && Math.abs(inVy) > 0.1;

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
    const scale = Math.min(width, height) / 14; // coordinate scale

    // 1. Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '11px monospace';
    ctx.fillText('+x', width - 24, originY - 8);
    ctx.fillText('+y', originX + 8, 20);

    // 3. Highlight Special Eigen-axes (Span lines for X1 and X2)
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    // Horizontal axis line
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();
    // Vertical axis line
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Line of Span of Vector X (Dashed guideline to easily see collinearity!)
    ctx.save();
    const spanLength = 12;
    const dirX = Math.cos(angleRad);
    const dirY = Math.sin(angleRad);
    ctx.strokeStyle = isCollinear ? 'rgba(236, 72, 153, 0.5)' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = isCollinear ? 2.5 : 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(originX - dirX * spanLength * scale, originY + dirY * spanLength * scale);
    ctx.lineTo(originX + dirX * spanLength * scale, originY - dirY * spanLength * scale);
    ctx.stroke();
    ctx.restore();

    // 5. Draw Transformed Vector AX (Emerald or Rose if collinear)
    const axTipX = originX + outVx * scale;
    const axTipY = originY - outVy * scale;

    ctx.save();
    if (isCollinear) {
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 14 + Math.sin(pulse) * 4;
      ctx.strokeStyle = '#ec4899';
    } else {
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#10b981';
    }
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(axTipX, axTipY);
    ctx.stroke();

    // Transformed Vector Arrowhead
    const axAngle = Math.atan2(-outVy, outVx);
    ctx.fillStyle = isCollinear ? '#ec4899' : '#10b981';
    ctx.beginPath();
    ctx.moveTo(axTipX, axTipY);
    ctx.lineTo(axTipX - 12 * Math.cos(axAngle - Math.PI / 7), axTipY - 12 * Math.sin(axAngle - Math.PI / 7));
    ctx.lineTo(axTipX - 12 * Math.cos(axAngle + Math.PI / 7), axTipY - 12 * Math.sin(axAngle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Draw Input Vector X (Electric Cyan)
    const xTipX = originX + inVx * scale;
    const xTipY = originY - inVy * scale;

    ctx.save();
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(xTipX, xTipY);
    ctx.stroke();

    // Input Vector Arrowhead
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(xTipX, xTipY);
    ctx.lineTo(xTipX - 10 * Math.cos(angleRad - Math.PI / 7), xTipY + 10 * Math.sin(angleRad - Math.PI / 7));
    ctx.lineTo(xTipX - 10 * Math.cos(angleRad + Math.PI / 7), xTipY + 10 * Math.sin(angleRad + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 7. Labels
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#22d3ee';
    ctx.fillText(`X [${inVx.toFixed(1)}, ${inVy.toFixed(1)}]`, xTipX + 8, xTipY - 6);

    ctx.fillStyle = isCollinear ? '#f472b6' : '#34d399';
    ctx.fillText(`AX [${outVx.toFixed(1)}, ${outVy.toFixed(1)}]`, axTipX + 8, axTipY + 16);

    // 8. Collinearity Status Floating Banner
    ctx.save();
    const bannerW = 340;
    const bannerH = 34;
    const bannerX = width / 2 - bannerW / 2;
    const bannerY = 16;
    ctx.fillStyle = isCollinear ? 'rgba(236, 72, 153, 0.2)' : 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = isCollinear ? '#ec4899' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    if (isCollinear) {
      ctx.fillStyle = '#f472b6';
      ctx.fillText(`✨ EIGENVECTOR FOUND! Lies on same line (λ = ${measuredLambda?.toFixed(1)})`, width / 2, bannerY + 21);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`Rotates off span line (Not an Eigenvector)`, width / 2, bannerY + 21);
    }
    ctx.restore();
  }, [activeTab, inVx, inVy, outVx, outVy, isCollinear, measuredLambda, angleRad, pulse]);

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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // 1. Transformed Ellipse from Unit Circle
    if (showGridMesh) {
      // Draw transformed unit circle
      ctx.save();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = 2;
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
      ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 2. Vector X1 (Horizontal Eigenvector: [1, 0]^T -> [lambdaX, 0]^T)
    const origX1TipX = originX + 1.0 * scale;
    const origX1TipY = originY;
    const transX1TipX = originX + lambdaX * scale;
    const transX1TipY = originY;

    // Original X1 ghost
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(origX1TipX, origX1TipY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Transformed X1 (Scaled by lambdaX)
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(transX1TipX, transX1TipY);
    ctx.stroke();

    // Arrowhead for transX1
    const x1Angle = lambdaX >= 0 ? 0 : Math.PI;
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(transX1TipX, transX1TipY);
    ctx.lineTo(transX1TipX - 10 * Math.cos(x1Angle - Math.PI / 7), transX1TipY - 10 * Math.sin(x1Angle - Math.PI / 7));
    ctx.lineTo(transX1TipX - 10 * Math.cos(x1Angle + Math.PI / 7), transX1TipY - 10 * Math.sin(x1Angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Vector X2 (Vertical Eigenvector: [0, 1]^T -> [0, lambdaY]^T)
    const origX2TipX = originX;
    const origX2TipY = originY - 1.0 * scale;
    const transX2TipX = originX;
    const transX2TipY = originY - lambdaY * scale;

    // Original X2 ghost
    ctx.save();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(origX2TipX, origX2TipY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Transformed X2 (Scaled by lambdaY)
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(transX2TipX, transX2TipY);
    ctx.stroke();

    // Arrowhead for transX2
    const x2Angle = lambdaY >= 0 ? -Math.PI / 2 : Math.PI / 2;
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.moveTo(transX2TipX, transX2TipY);
    ctx.lineTo(transX2TipX - 10 * Math.cos(x2Angle - Math.PI / 7), transX2TipY - 10 * Math.sin(x2Angle - Math.PI / 7));
    ctx.lineTo(transX2TipX - 10 * Math.cos(x2Angle + Math.PI / 7), transX2TipY - 10 * Math.sin(x2Angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Probe Vector X_probe (demonstrates off-axis skew)
    const pRad = (probeAngle * Math.PI) / 180;
    const pInX = 1.4 * Math.cos(pRad);
    const pInY = 1.4 * Math.sin(pRad);
    const pOutX = lambdaX * pInX;
    const pOutY = lambdaY * pInY;

    // Probe transformed
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + pOutX * scale, originY - pOutY * scale);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('Probe AX', originX + pOutX * scale + 6, originY - pOutY * scale);
    ctx.restore();

    // Labels
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#22d3ee';
    ctx.fillText(`AX₁ = [${lambdaX.toFixed(1)}, 0]ᵀ (${lambdaX.toFixed(1)}·X₁)`, transX1TipX + (lambdaX >= 0 ? 8 : -110), originY + 18);

    ctx.fillStyle = '#34d399';
    ctx.fillText(`AX₂ = [0, ${lambdaY.toFixed(1)}]ᵀ (${lambdaY.toFixed(1)}·X₂)`, originX + 8, transX2TipY + (lambdaY >= 0 ? -8 : 16));
  }, [activeTab, lambdaX, lambdaY, probeAngle, showGridMesh]);

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

    // Source image / offscreen preset
    const source = customImageSrc
      ? new Image()
      : offscreenCanvasRef.current;

    const renderImageStretch = (imgSource) => {
      ctx.clearRect(0, 0, width, height);
      const originX = width / 2;
      const originY = height / 2;

      // Base dimensions for displayed image
      const baseW = 160;
      const baseH = 160;

      // Scaled dimensions under A = [imageLambdaX 0; 0 imageLambdaY]
      const scaledW = baseW * imageLambdaX;
      const scaledH = baseH * imageLambdaY;

      // Background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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

      // Draw dashed reference box for original unscaled dimensions
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(originX - baseW / 2, originY - baseH / 2, baseW, baseH);
      ctx.restore();

      // Render Stretched Image using Canvas transform
      if (imgSource) {
        ctx.save();
        ctx.translate(originX, originY);
        // Note: handles negative scaling (reflection) smoothly!
        ctx.drawImage(imgSource, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
        ctx.restore();
      }

      // Draw Invariant Eigenvector Direction Overlays
      ctx.save();
      // Horizontal Eigenvector X1 (Cyan Arrow)
      const arrowLenX = (scaledW / 2) + 25;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX + arrowLenX, originY);
      ctx.stroke();
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(originX + arrowLenX, originY);
      ctx.lineTo(originX + arrowLenX - 10, originY - 6);
      ctx.lineTo(originX + arrowLenX - 10, originY + 6);
      ctx.closePath();
      ctx.fill();

      // Vertical Eigenvector X2 (Emerald Arrow)
      const arrowLenY = (scaledH / 2) + 25;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX, originY - arrowLenY);
      ctx.stroke();
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.moveTo(originX, originY - arrowLenY);
      ctx.lineTo(originX - 6, originY - arrowLenY + 10);
      ctx.lineTo(originX + 6, originY - arrowLenY + 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Text Labels
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(`Eigenvector X₁ (Horizontal) · Stretch × ${imageLambdaX.toFixed(1)}`, originX + 12, originY + 18);

      ctx.fillStyle = '#34d399';
      ctx.fillText(`Eigenvector X₂ (Vertical) · Stretch × ${imageLambdaY.toFixed(1)}`, originX + 12, originY - arrowLenY + 12);
    };

    if (customImageSrc) {
      const img = new Image();
      img.onload = () => renderImageStretch(img);
      img.src = customImageSrc;
    } else {
      renderImageStretch(source);
    }
  }, [activeTab, customImageSrc, selectedPreset, imageLambdaX, imageLambdaY, presetCanvasKey]);

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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Mirror line (y-axis)
    ctx.save();
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(originX, 10);
    ctx.lineTo(originX, height - 10);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('Reflection Plane (x = 0)', originX + 8, 25);

    // Render flower image reflected
    const source = customImageSrc ? new Image() : offscreenCanvasRef.current;
    const imgW = 120;
    const imgH = 120;

    const drawReflectedScene = (img) => {
      if (img) {
        ctx.save();
        ctx.translate(originX, originY);
        ctx.scale(reflectionAnim, 1);
        ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
        ctx.restore();
      }

      // Vector X1 under reflection A = [-1 0; 0 1]
      // Original X1 = [1, 0]^T
      // Reflected X1 = [-1, 0]^T
      const vOriginalTipX = originX + 2.0 * scale;
      const vReflectedTipX = originX - 2.0 * scale;

      // Guideline (The horizontal 1D line)
      ctx.save();
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.stroke();
      ctx.restore();

      // Original vector X1 (Cyan)
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(vOriginalTipX, originY);
      ctx.stroke();
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(vOriginalTipX, originY);
      ctx.lineTo(vOriginalTipX - 10, originY - 6);
      ctx.lineTo(vOriginalTipX - 10, originY + 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Reflected vector AX1 (Rose)
      if (reflectionAnim === -1) {
        ctx.save();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(vReflectedTipX, originY);
        ctx.stroke();
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(vReflectedTipX, originY);
        ctx.lineTo(vReflectedTipX + 10, originY - 6);
        ctx.lineTo(vReflectedTipX + 10, originY + 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('AX₁ = [-1, 0]ᵀ = (-1)·X₁', vReflectedTipX - 140, originY - 12);
      }

      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = '#22d3ee';
      ctx.fillText('Original X₁ = [1, 0]ᵀ', vOriginalTipX + 12, originY - 12);
    };

    if (customImageSrc) {
      const img = new Image();
      img.onload = () => drawReflectedScene(img);
      img.src = customImageSrc;
    } else {
      drawReflectedScene(source);
    }
  }, [activeTab, customImageSrc, reflectionAnim, presetCanvasKey]);

  return (
    <div className="math-step-view" style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* HEADER SECTION */}
      <div className="step-header-box" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              className="modal-badge-tag"
              style={{
                margin: 0,
                background: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
                borderColor: 'rgba(236, 72, 153, 0.35)'
              }}
            >
              Advanced Track · Module 1
            </span>
            <span style={{ fontSize: '0.85rem', color: '#ec4899', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Special Directions &amp; Invariant Subspaces
            </span>
          </div>
        </div>

        <h2 className="step-heading">
          Eigenvalues and Eigenvectors: Finding Special Directions
        </h2>
        <p className="step-description">
          <strong>Learning Objective:</strong> Understand that some vectors retain their direction when a matrix transforms them,
          although their length or orientation may change. Uncover invariant axes, test horizontal stretch on photographs (A = [2 0; 0 1]),
          and discover why negative eigenvalues (λ = -1) preserve directional lines during reflection (A = [-1 0; 0 1]).
        </p>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 mb-6 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('explore')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'explore'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-lg shadow-pink-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Compass size={16} />
          <span>1. Rotate &amp; Find Eigenvectors</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('eigenvalues')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'eigenvalues'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Sliders size={16} />
          <span>2. Eigenvalue Scaling Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('image-scaling')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'image-scaling'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Layers size={16} />
          <span>3. Try Your Own Image (Flower Lab)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reflection-challenge')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'reflection-challenge'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <HelpCircle size={16} />
          <span>4. Reflection &amp; Negative λ Challenge</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ROTATE / SCALE & FIND EIGENVECTORS */}
      {/* ========================================================================= */}
      {activeTab === 'explore' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass size={17} className="text-pink-400" />
                  Transformation Matrix A
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30 font-mono">
                  A = [2 0; 0 1]
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                For a vector X = [x, y]ᵀ, the matrix gives
                AX = [2x, y]ᵀ.
                Rotate and scale X. When X and AX <strong>lie on the exact same line</strong>,
                it is an <strong>eigenvector</strong>!
              </p>

              {/* Slider Rotation Angle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">Rotate Input Vector ($θ$):</span>
                  <span className="text-cyan-400 font-bold">{vectorAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={vectorAngle}
                  onChange={e => setVectorAngle(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Slider Magnitude */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">Magnitude ‖X‖:</span>
                  <span className="text-cyan-400 font-bold">{vectorMag.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={vectorMag}
                  onChange={e => setVectorMag(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Presets & Jump Targets */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-zinc-400 block mb-2">Test Candidate Directions:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setVectorAngle(0); setVectorMag(2); }}
                    className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all text-left flex items-center justify-between cursor-pointer ${
                      vectorAngle === 0
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    <span>Horizontal X₁ [1, 0]</span>
                    <span className="text-[10px] text-cyan-400">0°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setVectorAngle(90); setVectorMag(2); }}
                    className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all text-left flex items-center justify-between cursor-pointer ${
                      vectorAngle === 90
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    <span>Vertical X₂ [0, 1]</span>
                    <span className="text-[10px] text-emerald-400">90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setVectorAngle(45); setVectorMag(2); }}
                    className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all text-left flex items-center justify-between cursor-pointer ${
                      vectorAngle === 45
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    <span>Diagonal [1, 1]</span>
                    <span className="text-[10px] text-zinc-400">45° (Off)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setVectorAngle(180); setVectorMag(2); }}
                    className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all text-left flex items-center justify-between cursor-pointer ${
                      vectorAngle === 180
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    <span>Negative X₁ [-1, 0]</span>
                    <span className="text-[10px] text-cyan-400">180°</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Checklist of Special Directions */}
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Special Eigenvectors Checklist</span>
                <span className="text-pink-400 font-mono text-[11px] font-semibold">
                  {(foundX1 ? 1 : 0) + (foundX2 ? 1 : 0)} / 2 Found
                </span>
              </h4>

              <div className="space-y-2">
                <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  foundX1 ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200' : 'bg-black/20 border-white/5 text-zinc-400'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {foundX1 ? <CheckCircle2 size={16} className="text-cyan-400" /> : <div className="w-4 h-4 rounded-full border border-zinc-600" />}
                    <div>
                      <div className="text-xs font-bold font-mono">Horizontal Eigenvector X₁ = [1, 0]ᵀ</div>
                      <div className="text-[11px] text-zinc-400">AX₁ = [2, 0]ᵀ = 2 · X₁ (Stretched by 2)</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">λ₁ = 2</span>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  foundX2 ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200' : 'bg-black/20 border-white/5 text-zinc-400'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {foundX2 ? <CheckCircle2 size={16} className="text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-zinc-600" />}
                    <div>
                      <div className="text-xs font-bold font-mono">Vertical Eigenvector X₂ = [0, 1]ᵀ</div>
                      <div className="text-[11px] text-zinc-400">AX₂ = [0, 1]ᵀ = 1 · X₂ (Unchanged)</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">λ₂ = 1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Canvas Column */}
          <div className="lg:col-span-7">
            <div className="glass-level-2 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-semibold text-zinc-400">Interactive Span Line &amp; Vector Invariance</span>
                <span className="text-xs font-mono text-cyan-400">Dashed = 1D Span Line</span>
              </div>
              <canvas
                ref={exploreCanvasRef}
                width={560}
                height={420}
                className="w-full max-w-[560px] h-auto rounded-xl bg-slate-950/80 border border-white/5 shadow-inner"
              />
              <div className="w-full mt-3 px-2 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                  Input X
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  Transformed AX
                </span>
                <span className="flex items-center gap-1.5 text-pink-400 font-semibold">
                  <Sparkles size={13} />
                  Coincides = Eigenvector!
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders size={17} className="text-cyan-400" />
                  Matrix A = [λx 0; 0 λy]
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                  AX = λX
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                The numbers λx and λy are <strong>eigenvalues</strong>: they represent the
                scaling factors along their respective eigenvector directions! Use the sliders to change them in real-time.
              </p>

              {/* Slider Lambda X */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">Horizontal Eigenvalue (λx):</span>
                  <span className="text-cyan-400 font-bold">{lambdaX.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.1"
                  value={lambdaX}
                  onChange={e => setLambdaX(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Slider Lambda Y */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">Vertical Eigenvalue (λy):</span>
                  <span className="text-emerald-400 font-bold">{lambdaY.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.1"
                  value={lambdaY}
                  onChange={e => setLambdaY(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Slider Probe Vector */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-300">Arbitrary Probe Vector Angle:</span>
                  <span className="text-amber-400 font-bold">{probeAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={probeAngle}
                  onChange={e => setProbeAngle(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Presets from PDF */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-zinc-400 block mb-2">Preset Matrix Configurations:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'PDF Initial: [2 0; 0 1]', lx: 2.0, ly: 1.0 },
                    { label: 'Identity: [1 0; 0 1]', lx: 1.0, ly: 1.0 },
                    { label: 'Horizontal Flip: [-1 0; 0 1]', lx: -1.0, ly: 1.0 },
                    { label: 'Uniform Zoom: [2 0; 0 2]', lx: 2.0, ly: 2.0 },
                    { label: 'Flatten X: [0 0; 0 1]', lx: 0.0, ly: 1.0 }
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => { setLambdaX(p.lx); setLambdaY(p.ly); }}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-zinc-300 hover:text-cyan-300 transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Matrix Form Visual Display */}
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-3 font-mono">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Current Linear System</h4>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center text-sm space-y-2">
                <div className="text-zinc-200">
                  A = <span className="text-cyan-400">[{lambdaX.toFixed(1)} &nbsp; 0]</span> / <span className="text-emerald-400">[0 &nbsp; {lambdaY.toFixed(1)}]</span>
                </div>
                <div className="text-xs text-zinc-400">
                  A · X₁ = {lambdaX.toFixed(1)} · [1, 0]ᵀ &nbsp; | &nbsp; A · X₂ = {lambdaY.toFixed(1)} · [0, 1]ᵀ
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="glass-level-2 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-semibold text-zinc-400">Deformation Ellipse &amp; Eigenvector Scaling</span>
                <label className="text-xs font-mono text-zinc-400 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGridMesh}
                    onChange={e => setShowGridMesh(e.target.checked)}
                    className="rounded accent-purple-500"
                  />
                  Show Unit Circle
                </label>
              </div>
              <canvas
                ref={eigenCanvasRef}
                width={560}
                height={420}
                className="w-full max-w-[560px] h-auto rounded-xl bg-slate-950/80 border border-white/5 shadow-inner"
              />
              <p className="text-xs text-zinc-400 mt-3 text-center">
                Observe: While the arbitrary probe vector skews off its line, X₁ and X₂ stay strictly on the axes,
                scaling exactly by λx and λy!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: TRY YOUR OWN IMAGE / FLOWER LAB */}
      {/* ========================================================================= */}
      {activeTab === 'image-scaling' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={17} className="text-emerald-400" />
                  Image Transformation
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                  A = [2 0; 0 1]
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                As detailed in the curriculum: Apply scaling operation A = [2 0; 0 1] to
                a flower or uploaded image. It stretches the image horizontally by factor 2 while vertical dimensions remain unchanged.
                The eigenvalues are <strong>2</strong> and <strong>1</strong>.
              </p>

              {/* Image Source Selection */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-400 block">Choose Image:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setCustomImageSrc(null); setSelectedPreset('flower'); }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      !customImageSrc && selectedPreset === 'flower'
                        ? 'bg-pink-500/20 border-pink-500 text-pink-200'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    🌸 Flower (PDF)
                  </button>

                  <button
                    type="button"
                    onClick={() => { setCustomImageSrc(null); setSelectedPreset('portrait'); }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      !customImageSrc && selectedPreset === 'portrait'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-200'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    👤 Icon
                  </button>

                  <button
                    type="button"
                    onClick={() => { setCustomImageSrc(null); setSelectedPreset('grid'); }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      !customImageSrc && selectedPreset === 'grid'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    🌐 Grid
                  </button>
                </div>

                {/* Upload Custom File Button */}
                <div className="pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Upload size={14} className="text-emerald-400" />
                    <span>Upload Your Own Image File</span>
                  </button>
                </div>
              </div>

              {/* Sliders for Image Matrix */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-cyan-300">Stretch in x-direction (λₓ):</span>
                    <span className="text-cyan-400 font-bold">{imageLambdaX.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={imageLambdaX}
                    onChange={e => setImageLambdaX(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-emerald-300">Stretch in y-direction (λᵧ):</span>
                    <span className="text-emerald-400 font-bold">{imageLambdaY.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={imageLambdaY}
                    onChange={e => setImageLambdaY(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Fast Reset to PDF defaults */}
              <button
                type="button"
                onClick={() => { setImageLambdaX(2.0); setImageLambdaY(1.0); }}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Reset to PDF Lab: A = [2 0; 0 1]</span>
              </button>
            </div>

            {/* Analysis Box */}
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 text-xs text-zinc-300 space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Why are eigenvalues 2 and 1?</h4>
              <p className="leading-relaxed">
                Horizontal pixels stretch by <strong>{imageLambdaX.toFixed(1)}</strong> while vertical coordinates remain multiplied by <strong>{imageLambdaY.toFixed(1)}</strong>.
                Because the transformation matrix is diagonal, the Cartesian coordinate axes coincide exactly with the eigenvectors!
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="glass-level-2 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-semibold text-zinc-400">Real-time Image Eigen-Stretch</span>
                <span className="text-xs font-mono text-emerald-400">λₓ = {imageLambdaX.toFixed(1)}, λᵧ = {imageLambdaY.toFixed(1)}</span>
              </div>
              <canvas
                ref={imageCanvasRef}
                width={560}
                height={420}
                className="w-full max-w-[560px] h-auto rounded-xl bg-slate-950/80 border border-white/5 shadow-inner"
              />
              <p className="text-xs text-zinc-400 mt-3 text-center">
                Dashed box represents original dimensions. The cyan and emerald arrows highlight the two invariant eigenvector axes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: REFLECTION & NEGATIVE EIGENVALUE CHALLENGE */}
      {/* ========================================================================= */}
      {activeTab === 'reflection-challenge' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FlipHorizontal size={17} className="text-amber-400" />
                  Horizontal Reflection Matrix
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                  A = [-1 0; 0 1]
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReflectionAnim(1)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    reflectionAnim === 1
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  Original Orientation
                </button>
                <button
                  type="button"
                  onClick={() => setReflectionAnim(-1)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    reflectionAnim === -1
                      ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  Reflected (A = [-1 0; 0 1])
                </button>
              </div>

              {/* PDF Pedagogical Prompt */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <HelpCircle size={15} />
                  <span>Curriculum Conceptual Question:</span>
                </div>
                <p className="text-zinc-200 leading-relaxed italic">
                  "If the image is reflected horizontally, does the horizontal eigenvector cease to be an eigenvector? Why or why not?"
                </p>
              </div>

              {/* Quiz Options */}
              <div className="space-y-2">
                {[
                  {
                    id: 'ceases',
                    text: 'Yes: It flipped 180°, so its direction changed and it ceases to be an eigenvector.',
                    isCorrect: false
                  },
                  {
                    id: 'stays',
                    text: 'No: It is STILL an eigenvector! It still lies along the same horizontal line, with negative eigenvalue λ = -1.',
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
                    className={`w-full p-3 rounded-xl text-xs text-left border transition-all flex items-start gap-2.5 cursor-pointer ${
                      selectedAnswer === opt.id
                        ? opt.isCorrect
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                          : 'bg-rose-500/20 border-rose-400 text-rose-200'
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="mt-0.5">
                      {selectedAnswer === opt.id ? (
                        opt.isCorrect ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-rose-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-zinc-500" />
                      )}
                    </div>
                    <span className="leading-snug">{opt.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* In-depth Pedagogical Clarification */}
            <AnimatePresence>
              {isAnswerSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-3"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={15} />
                    <span>Line Subspace vs. Arrow Orientation</span>
                  </h4>
                  <div className="text-xs text-zinc-300 space-y-2 leading-relaxed">
                    <p>
                      <strong>Crucial Distinction:</strong> In linear algebra, an eigenvector only requires that
                      AX lies in the <em>1-dimensional subspace</em> (the infinite straight line) spanned by X:
                    </p>
                    <div className="p-2.5 rounded-lg bg-black/40 font-mono text-center text-amber-300">
                      A · X₁ = [-1 &nbsp; 0; 0 &nbsp; 1] · [1, 0]ᵀ = [-1, 0]ᵀ = (-1) · X₁
                    </div>
                    <p>
                      The scalar factor λ = -1 reverses the arrow's orientation, but <strong>preserves its direction as a line</strong>!
                      Therefore, X₁ = [1, 0]ᵀ remains a true eigenvector with eigenvalue λ₁ = -1.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-7">
            <div className="glass-level-2 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-semibold text-zinc-400">Horizontal Reflection Visualizer</span>
                <span className="text-xs font-mono text-pink-400">λ₁ = -1, λ₂ = +1</span>
              </div>
              <canvas
                ref={reflectionCanvasRef}
                width={560}
                height={420}
                className="w-full max-w-[560px] h-auto rounded-xl bg-slate-950/80 border border-white/5 shadow-inner"
              />
              <p className="text-xs text-zinc-400 mt-3 text-center">
                Toggle between Original and Reflected above to witness how X₁ flips 180° along the exact same horizontal line!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER NAVIGATION */}
      <StepFooter stepNumber={18} onSelectStep={onSelectStep} />
    </div>
  );
}
