import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Layers,
  RotateCcw,
  Repeat,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  CheckCircle2,
  Info
} from 'lucide-react';
import StepFooter from '../components/layout/StepFooter';
import ModuleDocumentation from '../components/experiment/ModuleDocumentation';

/**
 * Renders an optical light ray in animated dotted form with an optional directional arrow.
 * Instead of a separate running dot on top of the arrow, the ray itself is rendered as
 * an animated stream of dotted light pulses propagating in the ray's travel direction.
 */
function drawDottedRay(ctx, x1, y1, x2, y2, color, isPlaying, animTime, isLight, options = {}) {
  const {
    showArrow = true,
    arrowPos = 'tip', // 'tip' | 'mid'
    arrowLen = 11,
    lineWidth = 2.8,
    dash = [3, 7],
    glow = true,
    timeOffset = 0
  } = options;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;

  const angle = Math.atan2(dy, dx);

  // 1. Faint continuous base line to maintain visual continuity of the ray's trajectory
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = isLight ? 'rgba(105, 121, 81, 0.22)' : 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // 2. Animated dotted beam moving forward in direction of ray
  if (glow) {
    ctx.shadowColor = isLight ? color : 'rgba(255, 255, 255, 0.55)';
    ctx.shadowBlur = isLight ? 2 : 6;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.setLineDash(dash);
  const period = dash[0] + dash[1];
  const effectiveTime = (animTime + timeOffset) % 1;
  ctx.lineDashOffset = isPlaying ? -effectiveTime * (period * 2) : 0;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();

  // 3. Directional arrow
  if (showArrow) {
    const ax = arrowPos === 'mid' ? (x1 + x2) / 2 : x2;
    const ay = arrowPos === 'mid' ? (y1 + y2) / 2 : y2;
    const arrowAngle = Math.PI / 7;

    ctx.save();
    if (!isLight) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 5;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(
      ax - arrowLen * Math.cos(angle - arrowAngle),
      ay - arrowLen * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      ax - arrowLen * Math.cos(angle + arrowAngle),
      ay - arrowLen * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export default function Step17RayOptics({ onSelectStep }) {
  // Active Tab: 'vector' | 'reflection' | 'rotation' | 'successive'
  const [activeTab, setActiveTab] = useState('vector');

  // Animation Play/Pause & Reduced-Motion state
  const [isPlaying, setIsPlaying] = useState(true);
  const [animTime, setAnimTime] = useState(0);

  // Theme tracking for canvas renderers
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'dark' : 'dark'
  );

  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(currentTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const isLight = theme === 'light';

  // Animation loop for optical ray dotted propagation
  useEffect(() => {
    if (!isPlaying) return;
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animId;
    const animate = () => {
      setAnimTime((t) => (t + 0.012) % 1);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // --- TAB 1: RAY AS A VECTOR ---
  const [vecDx, setVecDx] = useState(2);
  const [vecDy, setVecDy] = useState(1);

  // --- TAB 2: PLANE MIRROR REFLECTION ---
  const [incDx, setIncDx] = useState(2);
  const [incDy, setIncDy] = useState(-1.5);
  const [isDoubleReflected, setIsDoubleReflected] = useState(false);
  const [openQuestion, setOpenQuestion] = useState(null);

  // --- TAB 3: ROTATION OF A LIGHT RAY ---
  const [rotAngle, setRotAngle] = useState(30); // in degrees: -180 to 180
  const [baseDx, setBaseDx] = useState(2);
  const [baseDy, setBaseDy] = useState(1);

  // --- TAB 4: TWO SUCCESSIVE REFLECTIONS ---
  const [retroVx, setRetroVx] = useState(2);
  const [retroVy, setRetroVy] = useState(1);
  const [reflectionOrder, setReflectionOrder] = useState('xThenY'); // 'xThenY' | 'yThenX' | 'compare'
  const [mirrorAngle, setMirrorAngle] = useState(90); // 90° for perpendicular

  // Canvas Refs
  const vectorCanvasRef = useRef(null);
  const reflectionCanvasRef = useRef(null);
  const rotationCanvasRef = useRef(null);
  const successiveCanvasRef = useRef(null);

  // Helper for slider fill percentage
  const getSliderPct = (val, min, max) => {
    const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
    return `${pct}%`;
  };

  // ----------------------------------------------------------------------
  // CANVAS RENDERER 1: RAY AS A VECTOR (10.1)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'vector') return;
    const canvas = vectorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Coordinate origin & scale
    const originX = width / 2;
    const originY = height / 2;
    const scale = Math.min(width, height) / 11;

    // 1. Subtle Grid
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.06)' : 'rgba(255, 255, 255, 0.08)';
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

    // 2. Clear Axes
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.22)' : 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = isLight ? 'rgba(41, 47, 37, 0.55)' : 'rgba(255, 255, 255, 0.65)';
    ctx.font = '11px var(--font-mono, monospace)';
    ctx.fillText('+x', width - 24, originY - 7);
    ctx.fillText('+y', originX + 7, 18);

    const tipX = originX + vecDx * scale;
    const tipY = originY - vecDy * scale;

    // 3. Component projection dashed lines
    ctx.strokeStyle = isLight ? 'rgba(105, 121, 81, 0.45)' : 'rgba(255, 255, 255, 0.42)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.4;
    // dx horizontal projection
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(tipX, originY);
    ctx.stroke();
    // dy vertical projection
    ctx.beginPath();
    ctx.moveTo(tipX, originY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels for projections
    ctx.fillStyle = isLight ? '#55683E' : '#FFFFFF';
    ctx.font = 'bold 11px var(--font-mono, monospace)';
    ctx.fillText(`dx = ${vecDx.toFixed(1)}`, originX + (vecDx * scale) / 2 - 22, originY + (vecDy >= 0 ? 15 : -8));
    ctx.fillText(`dy = ${vecDy.toFixed(1)}`, tipX + (vecDx >= 0 ? 8 : -50), originY - (vecDy * scale) / 2 + 4);

    // 4. Angle Arc
    const angleRad = Math.atan2(vecDy, vecDx);
    ctx.beginPath();
    ctx.arc(originX, originY, 28, 0, -angleRad, vecDy < 0);
    ctx.strokeStyle = isLight ? 'rgba(105, 121, 81, 0.65)' : 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 5. Animated Light Ray in Dotted Form with Directional Arrowhead
    const rayColor = isLight ? '#697951' : '#FFFFFF';
    drawDottedRay(ctx, originX, originY, tipX, tipY, rayColor, isPlaying, animTime, isLight, {
      showArrow: true,
      arrowPos: 'tip',
      arrowLen: 13,
      lineWidth: 3
    });

    // Vector label d
    ctx.save();
    ctx.font = 'bold 12px var(--font-mono, monospace)';
    if (!isLight) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 4;
    }
    ctx.fillStyle = isLight ? '#455432' : '#FFFFFF';
    ctx.fillText('d', tipX + (vecDx >= 0 ? 8 : -16), tipY + (vecDy >= 0 ? -6 : 14));
    ctx.restore();

    // Origin dot
    ctx.fillStyle = rayColor;
    ctx.beginPath();
    ctx.arc(originX, originY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }, [activeTab, vecDx, vecDy, animTime, isPlaying, isLight]);

  // ----------------------------------------------------------------------
  // CANVAS RENDERER 2: PLANE MIRROR REFLECTION (10.2)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'reflection') return;
    const canvas = reflectionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const mirrorY = height * 0.65;
    const mirrorXCenter = width / 2;
    const scale = 50;
    const isNormalIncidence = Math.abs(incDx) < 0.05;

    // 1. Draw Plane Mirror Surface
    const mirrorLeft = width * 0.10;
    const mirrorRight = width * 0.90;

    // Glass/Mirror gradient bar
    const mirrorGrad = ctx.createLinearGradient(mirrorLeft, mirrorY, mirrorRight, mirrorY);
    if (isLight) {
      mirrorGrad.addColorStop(0, 'rgba(105, 121, 81, 0.25)');
      mirrorGrad.addColorStop(0.5, '#697951');
      mirrorGrad.addColorStop(1, 'rgba(105, 121, 81, 0.25)');
    } else {
      mirrorGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      mirrorGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
      mirrorGrad.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
    }

    ctx.strokeStyle = mirrorGrad;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(mirrorLeft, mirrorY);
    ctx.lineTo(mirrorRight, mirrorY);
    ctx.stroke();

    // Mirror Hatching Marks (//////)
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.2)' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.2;
    for (let x = mirrorLeft + 8; x <= mirrorRight - 8; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, mirrorY + 2);
      ctx.lineTo(x - 8, mirrorY + 12);
      ctx.stroke();
    }

    // Mirror Label
    ctx.fillStyle = isLight ? 'rgba(41, 47, 37, 0.65)' : 'rgba(255, 255, 255, 0.6)';
    ctx.font = '11px var(--font-sans, sans-serif)';
    ctx.fillText('Horizontal Plane Mirror (x-axis, y = 0)', mirrorLeft + 8, mirrorY + 24);

    // 2. Normal Line (Dashed perpendicular at reflection point)
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.35)' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(mirrorXCenter, mirrorY - 170);
    ctx.lineTo(mirrorXCenter, mirrorY + 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Right-angle marker
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.3)' : 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mirrorXCenter, mirrorY - 12, 12, 12);

    ctx.fillStyle = isLight ? '#55683E' : '#FFFFFF';
    ctx.font = 'bold 11px var(--font-mono, monospace)';
    ctx.fillText('Normal (n̂)', mirrorXCenter + 8, mirrorY - 155);

    const incColor = isLight ? '#8BA871' : '#FFFFFF';
    const refColor = isDoubleReflected
      ? incColor
      : isLight
      ? '#455432'
      : '#B8D0EB';

    if (isNormalIncidence) {
      // ------------------------------------------------------------------
      // NORMAL INCIDENCE (i = 0° => r = 0°)
      // ------------------------------------------------------------------
      const rayTopY = mirrorY + incDy * scale;
      const offset = 4;

      // Incident Ray (Downward) in dotted form
      drawDottedRay(
        ctx,
        mirrorXCenter - offset,
        rayTopY,
        mirrorXCenter - offset,
        mirrorY,
        incColor,
        isPlaying,
        animTime,
        isLight,
        { showArrow: true, arrowPos: 'mid', arrowLen: 10, timeOffset: 0 }
      );

      // Reflected Ray (Upward) in dotted form
      drawDottedRay(
        ctx,
        mirrorXCenter + offset,
        mirrorY,
        mirrorXCenter + offset,
        rayTopY,
        refColor,
        isPlaying,
        animTime,
        isLight,
        { showArrow: true, arrowPos: 'mid', arrowLen: 10, timeOffset: 0.5 }
      );

      // Bottom turnaround bounce arc
      ctx.strokeStyle = isLight ? 'rgba(105, 121, 81, 0.6)' : 'rgba(163, 189, 139, 0.6)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(mirrorXCenter, mirrorY, offset, 0, Math.PI);
      ctx.stroke();

      // Normal Incidence Annotation Badge
      ctx.save();
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(13, 18, 14, 0.92)';
      ctx.strokeStyle = isLight ? '#DCE2D2' : 'rgba(105, 121, 81, 0.35)';
      ctx.lineWidth = 1;
      const badgeW = 270;
      const badgeH = 30;
      const badgeX = mirrorXCenter - badgeW / 2;
      const badgeY = mirrorY - 90;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isLight ? '#55683E' : '#A3BD8B';
      ctx.font = 'bold 11px var(--font-sans, sans-serif)';
      ctx.textAlign = 'center';
      ctx.fillText('Normal Incidence: i = 0°, r = 0° (Retraces Path)', mirrorXCenter, badgeY + 13);
      ctx.fillStyle = isLight ? '#738065' : 'rgba(255, 255, 255, 0.65)';
      ctx.font = '10px var(--font-mono, monospace)';
      ctx.fillText('Deviation δ = 180° − 2(0°) = 180°', mirrorXCenter, badgeY + 24);
      ctx.restore();
    } else {
      // ------------------------------------------------------------------
      // ANGLED INCIDENCE
      // ------------------------------------------------------------------
      const incSourceX = mirrorXCenter - incDx * scale;
      const incSourceY = mirrorY + incDy * scale;

      // Incident Ray in dotted form
      drawDottedRay(
        ctx,
        incSourceX,
        incSourceY,
        mirrorXCenter,
        mirrorY,
        incColor,
        isPlaying,
        animTime,
        isLight,
        { showArrow: true, arrowPos: 'mid', arrowLen: 10, timeOffset: 0 }
      );

      // Reflected Ray in dotted form
      const effectiveDy = isDoubleReflected ? incDy : -incDy;
      const refTargetX = mirrorXCenter + incDx * scale;
      const refTargetY = mirrorY - effectiveDy * scale;

      drawDottedRay(
        ctx,
        mirrorXCenter,
        mirrorY,
        refTargetX,
        refTargetY,
        refColor,
        isPlaying,
        animTime,
        isLight,
        { showArrow: true, arrowPos: 'mid', arrowLen: 10, timeOffset: 0.5 }
      );

      // Incidence & Reflection Angle Arcs
      const thetaIncidentDeg = Math.abs(Math.round(Math.atan2(Math.abs(incDx), Math.abs(incDy)) * (180 / Math.PI)));

      // Arc for incident ray
      ctx.strokeStyle = isLight ? 'rgba(105, 121, 81, 0.7)' : 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(mirrorXCenter, mirrorY, 36, -Math.PI / 2 - (thetaIncidentDeg * Math.PI) / 180, -Math.PI / 2);
      ctx.stroke();
      ctx.fillStyle = incColor;
      ctx.font = '11px var(--font-mono, monospace)';
      ctx.fillText(`${thetaIncidentDeg}°`, mirrorXCenter - 28, mirrorY - 42);

      // Arc for reflected ray
      if (!isDoubleReflected) {
        ctx.strokeStyle = isLight ? 'rgba(69, 84, 50, 0.7)' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(mirrorXCenter, mirrorY, 36, -Math.PI / 2, -Math.PI / 2 + (thetaIncidentDeg * Math.PI) / 180);
        ctx.stroke();
        ctx.fillStyle = refColor;
        ctx.font = '11px var(--font-mono, monospace)';
        ctx.fillText(`${thetaIncidentDeg}°`, mirrorXCenter + 12, mirrorY - 42);
      }
    }

    // Impact point dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(mirrorXCenter, mirrorY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }, [activeTab, incDx, incDy, isDoubleReflected, animTime, isPlaying, isLight]);

  // ----------------------------------------------------------------------
  // CANVAS RENDERER 3: ROTATION OF A LIGHT RAY (10.3)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'rotation') return;
    const canvas = rotationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    const originX = width / 2;
    const originY = height / 2;
    const scale = Math.min(width, height) / 9.5;

    // Grid circles for angular polar perspective
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.06)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    [1, 2, 3, 4].forEach((r) => {
      ctx.beginPath();
      ctx.arc(originX, originY, r * scale, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Axes
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.2)' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(originX - 4.2 * scale, originY);
    ctx.lineTo(originX + 4.2 * scale, originY);
    ctx.moveTo(originX, originY - 4.2 * scale);
    ctx.lineTo(originX + 4.2 * scale, originY);
    ctx.stroke();

    // 1. Base Ray (Original d)
    const baseTipX = originX + baseDx * scale;
    const baseTipY = originY - baseDy * scale;
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.4)' : 'rgba(255, 255, 255, 0.45)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(baseTipX, baseTipY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Rotated Ray d' = R(theta) d
    const thetaRad = (rotAngle * Math.PI) / 180;
    const rotDx = Math.cos(thetaRad) * baseDx - Math.sin(thetaRad) * baseDy;
    const rotDy = Math.sin(thetaRad) * baseDx + Math.cos(thetaRad) * baseDy;
    const rotTipX = originX + rotDx * scale;
    const rotTipY = originY - rotDy * scale;

    // Rotation Arc between Base Ray and Rotated Ray
    const baseAngle = Math.atan2(baseDy, baseDx);
    const rotTargetAngle = Math.atan2(rotDy, rotDx);
    ctx.strokeStyle = isLight ? 'rgba(105, 121, 81, 0.7)' : 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(originX, originY, 42, -baseAngle, -rotTargetAngle, rotAngle < 0);
    ctx.stroke();

    // Label on rotation arc
    ctx.fillStyle = isLight ? '#55683E' : '#FFFFFF';
    ctx.font = 'bold 11px var(--font-mono, monospace)';
    ctx.fillText(
      `${rotAngle > 0 ? '+' : ''}${rotAngle}°`,
      originX + 48 * Math.cos(-baseAngle - thetaRad / 2),
      originY + 48 * Math.sin(-baseAngle - thetaRad / 2)
    );

    // Draw Rotated Ray in Dotted Form with Directional Arrowhead
    const rotColor = isLight ? '#697951' : '#FFFFFF';
    drawDottedRay(
      ctx,
      originX,
      originY,
      rotTipX,
      rotTipY,
      rotColor,
      isPlaying,
      animTime,
      isLight,
      { showArrow: true, arrowPos: 'tip', arrowLen: 12, lineWidth: 3 }
    );

    // Center pivot
    ctx.fillStyle = rotColor;
    ctx.beginPath();
    ctx.arc(originX, originY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }, [activeTab, rotAngle, baseDx, baseDy, animTime, isPlaying, isLight]);

  // ----------------------------------------------------------------------
  // CANVAS RENDERER 4: SUCCESSIVE REFLECTIONS & COMMUTATIVITY (10.4)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'successive') return;
    const canvas = successiveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Corner vertex placement
    const cornerX = mirrorAngle > 95 ? width * 0.44 : mirrorAngle < 45 ? width * 0.22 : width * 0.32;
    const cornerY = height * 0.72;
    const arm1Length = Math.min(width, height) * 0.58;
    const arm2Length = Math.min(width, height) * 0.52;
    const alphaRad = (mirrorAngle * Math.PI) / 180;

    // 1. Draw Mirror 1 (Horizontal along x-axis)
    ctx.strokeStyle = isLight ? '#697951' : 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cornerX - 30, cornerY);
    ctx.lineTo(cornerX + arm1Length, cornerY);
    ctx.stroke();

    // Hatching under Horizontal Mirror 1
    ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.2)' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.2;
    for (let x = cornerX - 20; x <= cornerX + arm1Length - 10; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, cornerY + 1);
      ctx.lineTo(x - 7, cornerY + 10);
      ctx.stroke();
    }
    ctx.fillStyle = isLight ? '#55683E' : '#FFFFFF';
    ctx.font = '11px var(--font-sans, sans-serif)';
    ctx.fillText('Mirror 1 (Rx, 0°)', cornerX + arm1Length - 90, cornerY + 20);

    // 2. Draw Mirror 2 (Inclined at mirrorAngle α)
    const m2EndX = cornerX + arm2Length * Math.cos(alphaRad);
    const m2EndY = cornerY - arm2Length * Math.sin(alphaRad);

    ctx.strokeStyle = isLight ? '#526640' : 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cornerX, cornerY);
    ctx.lineTo(m2EndX, m2EndY);
    ctx.stroke();

    // Hatching behind Mirror 2
    const nOutX = -Math.sin(alphaRad);
    const nOutY = -Math.cos(alphaRad);
    const tX = Math.cos(alphaRad);
    const tY = -Math.sin(alphaRad);
    for (let s = 14; s <= arm2Length - 10; s += 14) {
      const px = cornerX + s * tX;
      const py = cornerY + s * tY;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + 9 * nOutX - 4 * tX, py + 9 * nOutY - 4 * tY);
      ctx.stroke();
    }

    ctx.fillStyle = isLight ? '#526640' : '#FFFFFF';
    ctx.font = '11px var(--font-sans, sans-serif)';
    const m2LabelDist = arm2Length * 0.72;
    ctx.fillText(
      mirrorAngle === 90 ? 'Mirror 2 (Ry, 90°)' : `Mirror 2 (Rα, ${mirrorAngle}°)`,
      cornerX + m2LabelDist * tX + 14 * nOutX,
      cornerY + m2LabelDist * tY + 14 * nOutY
    );

    // 3. Corner Angle Marker / Arc
    if (mirrorAngle === 90) {
      ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.4)' : 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cornerX, cornerY - 12, 12, 12);
    } else {
      ctx.strokeStyle = isLight ? 'rgba(105, 121, 81, 0.7)' : 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cornerX, cornerY, 30, 0, -alphaRad, true);
      ctx.stroke();
      ctx.fillStyle = isLight ? '#55683E' : '#FFFFFF';
      ctx.font = 'bold 11px var(--font-mono, monospace)';
      ctx.fillText(
        `α=${mirrorAngle}°`,
        cornerX + 40 * Math.cos(-alphaRad / 2) - 8,
        cornerY + 40 * Math.sin(-alphaRad / 2) + 3
      );
    }

    // Inward normal for Mirror 2
    const nInX = Math.sin(alphaRad);
    const nInY = Math.cos(alphaRad);

    // Path calculations
    const s1A = 125;
    const s2A = 120;
    const p1A = { x: cornerX + s1A, y: cornerY };
    const p2A = { x: cornerX + s2A * tX, y: cornerY + s2A * tY };
    const wAx = p2A.x - p1A.x;
    const wAy = p2A.y - p1A.y;

    const vInAx = wAx;
    const vInAy = -wAy;
    const lenInA = Math.hypot(vInAx, vInAy) || 1;
    const pStartA = { x: p1A.x - (vInAx / lenInA) * 75, y: p1A.y - (vInAy / lenInA) * 75 };

    const dotA = wAx * nInX + wAy * nInY;
    const vExitAx = wAx - 2 * dotA * nInX;
    const vExitAy = wAy - 2 * dotA * nInY;
    const lenExitA = Math.hypot(vExitAx, vExitAy) || 1;
    const pFinalA = { x: p2A.x + (vExitAx / lenExitA) * 85, y: p2A.y + (vExitAy / lenExitA) * 85 };

    // Path B calculations
    const s2B = 135;
    const s1B = 75;
    const p1B = { x: cornerX + s2B * tX, y: cornerY + s2B * tY };
    const p2B = { x: cornerX + s1B, y: cornerY };
    const wBx = p2B.x - p1B.x;
    const wBy = p2B.y - p1B.y;

    const dotB = wBx * nInX + wBy * nInY;
    const vInBx = wBx - 2 * dotB * nInX;
    const vInBy = wBy - 2 * dotB * nInY;
    const lenInB = Math.hypot(vInBx, vInBy) || 1;
    const pStartB = { x: p1B.x - (vInBx / lenInB) * 75, y: p1B.y - (vInBy / lenInB) * 75 };

    const vExitBx = wBx;
    const vExitBy = -wBy;
    const lenExitB = Math.hypot(vExitBx, vExitBy) || 1;
    const pFinalB = { x: p2B.x + (vExitBx / lenExitB) * 85, y: p2B.y + (vExitBy / lenExitB) * 85 };

    const showPathA = reflectionOrder === 'xThenY' || reflectionOrder === 'compare';
    const showPathB = reflectionOrder === 'yThenX' || reflectionOrder === 'compare';

    // RENDER PATH A: M1 -> M2
    if (showPathA) {
      const aColor = isLight ? '#55683E' : '#FFFFFF';

      // Incident segment
      drawDottedRay(ctx, pStartA.x, pStartA.y, p1A.x, p1A.y, aColor, isPlaying, animTime, isLight, {
        showArrow: true,
        arrowPos: 'mid',
        arrowLen: 9,
        lineWidth: 2.6,
        timeOffset: 0
      });

      // Intermediate segment
      drawDottedRay(ctx, p1A.x, p1A.y, p2A.x, p2A.y, aColor, isPlaying, animTime, isLight, {
        showArrow: true,
        arrowPos: 'mid',
        arrowLen: 9,
        lineWidth: 2.6,
        timeOffset: 0.33
      });

      // Exiting segment
      drawDottedRay(ctx, p2A.x, p2A.y, pFinalA.x, pFinalA.y, aColor, isPlaying, animTime, isLight, {
        showArrow: true,
        arrowPos: 'mid',
        arrowLen: 9,
        lineWidth: 2.6,
        timeOffset: 0.66
      });

      // Exit Label
      ctx.fillStyle = aColor;
      ctx.font = 'bold 11px var(--font-mono, monospace)';
      ctx.fillText(`Exit A (+${2 * mirrorAngle}°)`, pFinalA.x + 6, pFinalA.y + 4);

      // Hit dots
      [p1A, p2A].forEach((p) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // RENDER PATH B: M2 -> M1
    if (showPathB) {
      const bColor = isLight ? '#7C6F5A' : '#A8BDD9';

      // Incident segment
      drawDottedRay(ctx, pStartB.x, pStartB.y, p1B.x, p1B.y, bColor, isPlaying, animTime, isLight, {
        showArrow: true,
        arrowPos: 'mid',
        arrowLen: 9,
        lineWidth: 2.6,
        timeOffset: 0.16
      });

      // Intermediate segment
      drawDottedRay(ctx, p1B.x, p1B.y, p2B.x, p2B.y, bColor, isPlaying, animTime, isLight, {
        showArrow: true,
        arrowPos: 'mid',
        arrowLen: 9,
        lineWidth: 2.6,
        timeOffset: 0.5
      });

      // Exiting segment
      drawDottedRay(ctx, p2B.x, p2B.y, pFinalB.x, pFinalB.y, bColor, isPlaying, animTime, isLight, {
        showArrow: true,
        arrowPos: 'mid',
        arrowLen: 9,
        lineWidth: 2.6,
        timeOffset: 0.83
      });

      // Exit Label
      ctx.fillStyle = bColor;
      ctx.font = 'bold 11px var(--font-mono, monospace)';
      ctx.fillText(`Exit B (−${2 * mirrorAngle}°)`, pFinalB.x + 6, pFinalB.y + 12);

      // Hit dots
      [p1B, p2B].forEach((p) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Top Canvas Diagnostic Badge
    ctx.save();
    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(13, 18, 14, 0.92)';
    ctx.strokeStyle = mirrorAngle === 90
      ? isLight ? 'rgba(105, 121, 81, 0.4)' : 'rgba(139, 168, 113, 0.4)'
      : isLight ? 'rgba(225, 29, 72, 0.35)' : 'rgba(244, 63, 94, 0.35)';
    ctx.lineWidth = 1;
    const topBadgeW = 370;
    const topBadgeH = 26;
    const topBadgeX = width / 2 - topBadgeW / 2;
    const topBadgeY = 10;
    ctx.beginPath();
    ctx.roundRect(topBadgeX, topBadgeY, topBadgeW, topBadgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px var(--font-sans, sans-serif)';
    ctx.textAlign = 'center';
    if (mirrorAngle === 90) {
      ctx.fillStyle = isLight ? '#55683E' : '#A3BD8B';
      ctx.fillText('α = 90°: Commutative! Rx·Ry = Ry·Rx = −I (Retroreflection v₂ = −v)', width / 2, topBadgeY + 17);
    } else {
      ctx.fillStyle = isLight ? '#BE123C' : '#FDA4AF';
      ctx.fillText(`α = ${mirrorAngle}°: Non-Commutative! Rα·Rx ≠ Rx·Rα (Diverge by ${Math.abs(4 * mirrorAngle) % 360}°)`, width / 2, topBadgeY + 17);
    }
    ctx.restore();
  }, [activeTab, retroVx, retroVy, reflectionOrder, mirrorAngle, animTime, isPlaying, isLight]);

  // Derived mathematical metrics
  const vecAngleDeg = (Math.atan2(vecDy, vecDx) * (180 / Math.PI)).toFixed(1);
  const vecMagnitude = Math.hypot(vecDx, vecDy).toFixed(2);

  // Rotation Matrix values (Tab 3)
  const thetaRad = (rotAngle * Math.PI) / 180;
  const cosT = Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);
  const rotDxVal = cosT * baseDx - sinT * baseDy;
  const rotDyVal = sinT * baseDx + cosT * baseDy;

  // Successive Reflections Matrix Calculations (Tab 4)
  const alphaRadVal = (mirrorAngle * Math.PI) / 180;
  const twoAlphaRadVal = 2 * alphaRadVal;
  const cos2A = Math.cos(twoAlphaRadVal);
  const sin2A = Math.sin(twoAlphaRadVal);
  const vOutAx = cos2A * retroVx - sin2A * retroVy;
  const vOutAy = sin2A * retroVx + cos2A * retroVy;
  const vOutBx = cos2A * retroVx + sin2A * retroVy;
  const vOutBy = -sin2A * retroVx + cos2A * retroVy;

  return (
    <div className="math-step-view" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.25rem 1rem' }}>
      {/* HEADER SECTION */}
      <div className="step-header-box" style={{ marginBottom: '1rem', padding: '1rem 1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.3rem' }}>
          <h2 className="step-heading" style={{ margin: 0 }}>
            Ray Optics &amp; Optical Matrices
          </h2>
          <span className="badge-tag-mini" style={{ fontSize: '0.74rem', padding: '0.15rem 0.5rem' }}>
            Linear Transformations in Optics
          </span>
        </div>

        <p className="step-description" style={{ fontSize: '0.80rem', margin: 0 }}>
          Connect linear algebra with geometric optics: represent light rays as 2D spatial vectors,
          formalize specular mirror reflection (<code>R² = I</code>), explore normal incidence (<code>i = 0° ⟹ r = 0°</code>),
          rotate beams via <code>R(θ)</code>, and analyze successive reflections (90° retroreflection: <code>R_y · R_x = R_x · R_y = −I</code>).
        </p>

        {/* NAVIGATION TABS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('vector')}
            className={`sub-chapter-pill ${activeTab === 'vector' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Compass size={14} />
            <span>1. Rays as Vectors</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reflection')}
            className={`sub-chapter-pill ${activeTab === 'reflection' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Layers size={14} />
            <span>2. Plane Mirror Reflection</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rotation')}
            className={`sub-chapter-pill ${activeTab === 'rotation' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RotateCcw size={14} />
            <span>3. Ray Rotation Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('successive')}
            className={`sub-chapter-pill ${activeTab === 'successive' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Repeat size={14} />
            <span>4. Successive Reflections</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: LIGHT RAYS AS VECTORS */}
      {/* ========================================================================= */}
      {activeTab === 'vector' && (
        <div className="step17-layout-grid">
          {/* Controls Column */}
          <div className="step17-controls-col">
            <div className="step17-card">
              <div className="step17-card-header">
                <h3 className="step17-card-title">
                  <Compass size={15} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Ray Direction Vector d</span>
                </h3>
                <span className="step17-badge">
                  d = [{vecDx.toFixed(1)}, {vecDy.toFixed(1)}]^T
                </span>
              </div>

              <p className="step17-desc">
                A light ray in the xy-plane is represented by its direction vector d:
                horizontal step dx and vertical step dy.
              </p>

              {/* Sliders */}
              <div className="step17-params-box">
                {/* dx */}
                <div className="step17-slider-row">
                  <div className="step17-slider-header">
                    <span>Horizontal Component (dx):</span>
                    <span className="step17-slider-val">{vecDx.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="0.1"
                    value={vecDx}
                    onChange={(e) => setVecDx(parseFloat(e.target.value))}
                    className="step17-range-input"
                    style={{ '--slider-pct': getSliderPct(vecDx, -4, 4) }}
                  />
                  <div className="step17-slider-ticks">
                    <span>-4.0</span>
                    <span>0.0</span>
                    <span>+4.0</span>
                  </div>
                </div>

                {/* dy */}
                <div className="step17-slider-row">
                  <div className="step17-slider-header">
                    <span>Vertical Component (dy):</span>
                    <span className="step17-slider-val">{vecDy.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="0.1"
                    value={vecDy}
                    onChange={(e) => setVecDy(parseFloat(e.target.value))}
                    className="step17-range-input"
                    style={{ '--slider-pct': getSliderPct(vecDy, -4, 4) }}
                  />
                  <div className="step17-slider-ticks">
                    <span>-4.0</span>
                    <span>0.0</span>
                    <span>+4.0</span>
                  </div>
                </div>
              </div>

              {/* Direction Presets */}
              <div className="step17-presets-wrap">
                <span className="step17-presets-label">Preset Directions:</span>
                <div className="step17-pill-grid">
                  {[
                    { label: '[2, 1] Example', dx: 2, dy: 1 },
                    { label: '[3, 0] Horizontal', dx: 3, dy: 0 },
                    { label: '[0, 3] Vertical', dx: 0, dy: 3 },
                    { label: '[2, 2] 45°', dx: 2, dy: 2 },
                    { label: '[-2, 1] Left-Up', dx: -2, dy: 1 },
                    { label: '[2, -1] Right-Down', dx: 2, dy: -1 }
                  ].map((p) => {
                    const isActive = Math.abs(vecDx - p.dx) < 0.05 && Math.abs(vecDy - p.dy) < 0.05;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setVecDx(p.dx);
                          setVecDy(p.dy);
                        }}
                        className={`step17-pill-btn ${isActive ? 'active' : ''}`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Vector Mathematical Specifications */}
            <div className="step17-card">
              <div className="step17-card-header">
                <h4 className="step17-card-title">Mathematical Specification</h4>
                <span className="step17-badge">2D Vector</span>
              </div>

              <div className="step17-spec-grid">
                <div className="step17-spec-cell">
                  <span className="step17-spec-lbl">Angle to x-axis</span>
                  <span className="step17-spec-val">{vecAngleDeg}°</span>
                </div>
                <div className="step17-spec-cell">
                  <span className="step17-spec-lbl">Magnitude ‖d‖</span>
                  <span className="step17-spec-val">{vecMagnitude}</span>
                </div>
              </div>

              <div className="step17-formula-box">
                <div>Vector: <span className="step17-formula-accent">d = [{vecDx.toFixed(2)}, {vecDy.toFixed(2)}]^T</span></div>
                <div>Slope: <span className="step17-formula-accent">m = dy/dx = {(vecDy / (vecDx || 0.001)).toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          {/* Interactive Canvas Column */}
          <div className="step17-canvas-col">
            <div className="step17-canvas-card">
              <div className="step17-card-header">
                <span className="step17-card-title">Interactive xy-Plane Ray Simulation</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="step17-play-btn"
                    title={isPlaying ? 'Pause ray propagation' : 'Play ray propagation'}
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  <span className="step17-badge">Origin (0, 0)</span>
                </div>
              </div>

              <div className="step17-canvas-frame">
                <canvas
                  ref={vectorCanvasRef}
                  width={560}
                  height={400}
                />
              </div>

              <div className="step17-legend-bar">
                <div className="step17-legend-item">
                  <svg width="22" height="10" viewBox="0 0 22 10" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
                    <line x1="1" y1="5" x2="16" y2="5" stroke={isLight ? '#697951' : '#FFFFFF'} strokeWidth="2.4" strokeDasharray="2 3" strokeLinecap="round" />
                    <polygon points="15,2 21,5 15,8" fill={isLight ? '#697951' : '#FFFFFF'} />
                  </svg>
                  <span>Light Ray Vector d: [{vecDx.toFixed(1)}, {vecDy.toFixed(1)}]ᵀ</span>
                </div>
                <div className="step17-legend-item">
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: isLight ? 'rgba(105, 121, 81, 0.12)' : 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${isLight ? 'rgba(105, 121, 81, 0.25)' : 'rgba(255, 255, 255, 0.18)'}`,
                      fontSize: '0.66rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      color: isLight ? '#55683E' : '#FFFFFF'
                    }}
                  >
                    {isPlaying ? '● ● ● Dotted Propagation' : '❚❚ Paused'}
                  </span>
                </div>
                <div className="step17-legend-item">
                  <svg width="18" height="10" viewBox="0 0 18 10" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
                    <line x1="1" y1="5" x2="17" y2="5" stroke={isLight ? '#55683E' : 'rgba(255, 255, 255, 0.45)'} strokeWidth="1.6" strokeDasharray="3 3" />
                  </svg>
                  <span>Cartesian Projections (dx, dy)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PLANE MIRROR REFLECTION */}
      {/* ========================================================================= */}
      {activeTab === 'reflection' && (
        <div className="step17-layout-grid">
          {/* Controls Column */}
          <div className="step17-controls-col">
            <div className="step17-card">
              <div className="step17-card-header">
                <h3 className="step17-card-title">
                  <Layers size={15} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Reflection Matrix Rx</span>
                </h3>
                <span className="step17-badge">
                  Law: θi = θr
                </span>
              </div>

              <p className="step17-desc">
                For a horizontal mirror along the x-axis, the horizontal component remains unchanged,
                while the vertical component reverses: dx' = dx, dy' = −dy.
              </p>

              {/* Sliders */}
              <div className="step17-params-box">
                <div className="step17-slider-row">
                  <div className="step17-slider-header">
                    <span>Incident dx:</span>
                    <span className="step17-slider-val">
                      {incDx.toFixed(1)} {incDx === 0 ? '(Normal i=0°)' : ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="0.1"
                    value={incDx}
                    onChange={(e) => setIncDx(parseFloat(e.target.value))}
                    className="step17-range-input"
                    style={{ '--slider-pct': getSliderPct(incDx, 0, 4) }}
                  />
                  <div className="step17-slider-ticks">
                    <span>0.0 (Normal)</span>
                    <span>2.0</span>
                    <span>4.0</span>
                  </div>
                </div>

                <div className="step17-slider-row">
                  <div className="step17-slider-header">
                    <span>Incident dy (Downward toward mirror):</span>
                    <span className="step17-slider-val">{incDy.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-4"
                    max="-0.5"
                    step="0.1"
                    value={incDy}
                    onChange={(e) => setIncDy(parseFloat(e.target.value))}
                    className="step17-range-input"
                    style={{ '--slider-pct': getSliderPct(incDy, -4, -0.5) }}
                  />
                  <div className="step17-slider-ticks">
                    <span>-4.0 (Steep)</span>
                    <span>-2.0</span>
                    <span>-0.5 (Shallow)</span>
                  </div>
                </div>
              </div>

              {/* Angle Presets */}
              <div className="step17-presets-wrap">
                <span className="step17-presets-label">Preset Incident Angles:</span>
                <div className="step17-pill-grid">
                  {[
                    { label: 'Normal: i = 0°', dx: 0, dy: -2 },
                    { label: '30° Incidence', dx: 1.15, dy: -2 },
                    { label: '45° Incidence', dx: 2, dy: -2 },
                    { label: '60° Incidence', dx: 3.46, dy: -2 },
                    { label: 'Grazing ~70°', dx: 4, dy: -1.5 }
                  ].map((p) => {
                    const isActive = Math.abs(incDx - p.dx) < 0.05 && Math.abs(incDy - p.dy) < 0.05;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setIncDx(p.dx);
                          setIncDy(p.dy);
                        }}
                        className={`step17-pill-btn ${isActive ? 'active' : ''}`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Matrix Formulation Display */}
              <div className="step17-formula-box">
                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Matrix Transformation:</div>
                <div style={{ textAlign: 'center', fontWeight: 600 }}>
                  [dx', dy']^T = [1, 0; 0, −1] · [{incDx.toFixed(1)}, {incDy.toFixed(1)}]^T
                </div>
                <div style={{ textAlign: 'center' }}>
                  Result: <strong className="step17-formula-accent">[{incDx.toFixed(1)}, {(-incDy).toFixed(1)}]^T {incDx === 0 ? '= −d (Retraces Path)' : ''}</strong>
                </div>

                {incDx === 0 && (
                  <div style={{ fontSize: '0.70rem', padding: '0.35rem 0.5rem', borderRadius: '6px', background: 'rgba(105, 121, 81, 0.12)', border: '1px solid rgba(105, 121, 81, 0.25)', marginTop: '0.2rem' }}>
                    <strong style={{ color: 'var(--accent-primary, #697951)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.15rem' }}>
                      <Sparkles size={12} /> Normal Incidence (i = 0°):
                    </strong>
                    The ray strikes perpendicular to the surface along n̂. Reflection yields [0, {-incDy}]^T = −d, directly reversing direction with deviation δ = 180°.
                  </div>
                )}
              </div>

              {/* Involution Toggle Button */}
              <button
                type="button"
                onClick={() => setIsDoubleReflected((prev) => !prev)}
                className={`step17-pill-btn ${isDoubleReflected ? 'active' : ''}`}
                style={{ padding: '0.45rem 0.8rem', width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem' }}
              >
                <Repeat size={14} />
                <span>{isDoubleReflected ? 'Double Reflected: R² = I Restores Ray' : 'Test Involution: Apply Reflection Twice (R² = I)'}</span>
              </button>
            </div>

            {/* Questions for Learners Accordion */}
            <div className="step17-card">
              <div className="step17-card-header">
                <h4 className="step17-card-title">
                  <HelpCircle size={14} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Curriculum Questions</span>
                </h4>
              </div>

              {[
                {
                  id: 1,
                  q: '1. What happens when the incident angle is zero?',
                  a: 'At i = 0°, the ray strikes perpendicular along the surface normal (dx = 0, dy = -2). Multiplying by Rx gives [0, 2]^T = -d: the reflected ray retraces its exact path with deviation δ = 180°.'
                },
                {
                  id: 2,
                  q: '2. Why does the vertical component change sign?',
                  a: 'The specular mirror lies along the horizontal x-axis. Reflection inverts the normal velocity component (y-axis), while preserving the tangential component (x-axis).'
                },
                {
                  id: 3,
                  q: '3. What happens if the reflection matrix is applied twice?',
                  a: 'Applying the matrix twice gives R² = [1, 0; 0, -1]² = [1, 0; 0, 1] = I (the identity). Reflecting a reflected ray restores the initial direction (involution property).'
                }
              ].map((item) => (
                <div key={item.id} className="step17-accordion-item">
                  <button
                    type="button"
                    onClick={() => setOpenQuestion(openQuestion === item.id ? null : item.id)}
                    className="step17-accordion-trigger"
                  >
                    <span>{item.q}</span>
                    {openQuestion === item.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {openQuestion === item.id && (
                    <div className="step17-accordion-body">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Canvas Column */}
          <div className="step17-canvas-col">
            <div className="step17-canvas-card">
              <div className="step17-card-header">
                <span className="step17-card-title">Law of Reflection Diagram</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="step17-play-btn"
                    title={isPlaying ? 'Pause ray propagation' : 'Play ray propagation'}
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  <span className="step17-badge">
                    {isDoubleReflected ? 'Double Reflection (R² = I)' : 'Single Reflection (Rx)'}
                  </span>
                </div>
              </div>

              <div className="step17-canvas-frame">
                <canvas
                  ref={reflectionCanvasRef}
                  width={560}
                  height={400}
                />
              </div>

              <div className="step17-legend-bar">
                <div className="step17-legend-item">
                  <svg width="22" height="10" viewBox="0 0 22 10" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
                    <line x1="1" y1="5" x2="16" y2="5" stroke={isLight ? '#8BA871' : '#FFFFFF'} strokeWidth="2.4" strokeDasharray="2 3" strokeLinecap="round" />
                    <polygon points="15,2 21,5 15,8" fill={isLight ? '#8BA871' : '#FFFFFF'} />
                  </svg>
                  <span>Incident Ray: [{incDx.toFixed(1)}, {incDy.toFixed(1)}]ᵀ</span>
                </div>
                <div className="step17-legend-item">
                  <svg width="22" height="10" viewBox="0 0 22 10" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
                    <line x1="1" y1="5" x2="16" y2="5" stroke={isDoubleReflected ? (isLight ? '#8BA871' : '#FFFFFF') : (isLight ? '#455432' : '#CBD5E1')} strokeWidth="2.4" strokeDasharray="2 3" strokeLinecap="round" />
                    <polygon points="15,2 21,5 15,8" fill={isDoubleReflected ? (isLight ? '#8BA871' : '#FFFFFF') : (isLight ? '#455432' : '#CBD5E1')} />
                  </svg>
                  <span>Reflected Ray: [{incDx.toFixed(1)}, {(-incDy).toFixed(1)}]ᵀ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ROTATION OF A LIGHT RAY */}
      {/* ========================================================================= */}
      {activeTab === 'rotation' && (
        <div className="step17-layout-grid">
          {/* Controls Column */}
          <div className="step17-controls-col">
            <div className="step17-card">
              <div className="step17-card-header">
                <h3 className="step17-card-title">
                  <RotateCcw size={15} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Rotation Matrix R(θ)</span>
                </h3>
                <span className="step17-badge">
                  θ = {rotAngle}°
                </span>
              </div>

              <p className="step17-desc">
                Rotate the ray direction by angle θ: d' = R(θ)d, where
                R(θ) = [cosθ, −sinθ; sinθ, cosθ].
              </p>

              {/* Rotation Slider (-180° to +180°) */}
              <div className="step17-params-box">
                <div className="step17-slider-row">
                  <div className="step17-slider-header">
                    <span>Rotation Angle (θ):</span>
                    <span className="step17-slider-val">{rotAngle}° ({((rotAngle * Math.PI) / 180).toFixed(2)} rad)</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={rotAngle}
                    onChange={(e) => setRotAngle(parseInt(e.target.value, 10))}
                    className="step17-range-input"
                    style={{ '--slider-pct': getSliderPct(rotAngle, -180, 180) }}
                  />
                  <div className="step17-slider-ticks">
                    <span>-180°</span>
                    <span>-90°</span>
                    <span>0°</span>
                    <span>+90°</span>
                    <span>+180°</span>
                  </div>
                </div>
              </div>

              {/* Quick Angle Presets */}
              <div className="step17-presets-wrap">
                <span className="step17-presets-label">Angle Presets:</span>
                <div className="step17-pill-grid">
                  {[0, 30, 45, 60, 90, 180, -45, -90].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setRotAngle(deg)}
                      className={`step17-pill-btn ${rotAngle === deg ? 'active' : ''}`}
                    >
                      {deg > 0 ? `+${deg}°` : `${deg}°`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2x2 Matrix Display */}
              <div className="step17-formula-box">
                <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Evaluated 2×2 Rotation Matrix:</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>R({rotAngle}°) =</span>
                  <div style={{ display: 'inline-flex', flexDirection: 'column', padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', gap: '0.15rem' }}>
                    <div style={{ display: 'flex', gap: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.15rem' }}>
                      <span className="step17-formula-accent">{cosT.toFixed(3)}</span>
                      <span className="step17-formula-accent">{(-sinT).toFixed(3)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.85rem', paddingTop: '0.15rem' }}>
                      <span className="step17-formula-accent">{sinT.toFixed(3)}</span>
                      <span className="step17-formula-accent">{cosT.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', paddingTop: '0.2rem', borderTop: '1px solid var(--border-color)' }}>
                  Original: [{baseDx}, {baseDy}]^T &nbsp;→&nbsp; <strong className="step17-formula-accent">Rotated: [{rotDxVal.toFixed(2)}, {rotDyVal.toFixed(2)}]^T</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Column */}
          <div className="step17-canvas-col">
            <div className="step17-canvas-card">
              <div className="step17-card-header">
                <span className="step17-card-title">Angular Ray Rotation Visualizer</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="step17-play-btn"
                    title={isPlaying ? 'Pause ray propagation' : 'Play ray propagation'}
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  <span className="step17-badge">R(θ) Transformation</span>
                </div>
              </div>

              <div className="step17-canvas-frame">
                <canvas
                  ref={rotationCanvasRef}
                  width={560}
                  height={400}
                />
              </div>

              <div className="step17-legend-bar">
                <div className="step17-legend-item">
                  <svg width="20" height="10" viewBox="0 0 20 10" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
                    <line x1="1" y1="5" x2="19" y2="5" stroke={isLight ? 'rgba(41,47,37,0.45)' : 'rgba(255,255,255,0.4)'} strokeWidth="1.6" strokeDasharray="3 3" />
                  </svg>
                  <span>Initial Ray Vector d</span>
                </div>
                <div className="step17-legend-item">
                  <svg width="22" height="10" viewBox="0 0 22 10" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
                    <line x1="1" y1="5" x2="16" y2="5" stroke={isLight ? '#697951' : '#FFFFFF'} strokeWidth="2.4" strokeDasharray="2 3" strokeLinecap="round" />
                    <polygon points="15,2 21,5 15,8" fill={isLight ? '#697951' : '#FFFFFF'} />
                  </svg>
                  <span>Rotated Ray d' = R(θ)d</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: TWO SUCCESSIVE REFLECTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'successive' && (
        <div className="step17-layout-grid">
          {/* Controls Column */}
          <div className="step17-controls-col">
            <div className="step17-card">
              <div className="step17-card-header">
                <h3 className="step17-card-title">
                  <Repeat size={15} style={{ color: 'var(--accent-primary, #697951)' }} />
                  <span>Successive Reflections &amp; Order</span>
                </h3>
                <span className={mirrorAngle === 90 ? 'step17-badge' : 'step17-badge-rose'}>
                  {mirrorAngle === 90 ? 'Rx · Ry = Ry · Rx = −I' : 'Rx · Rα ≠ Rα · Rx'}
                </span>
              </div>

              <p className="step17-desc">
                Successive reflections from two mirrors inclined at angle α produce a net rotation of 2α.
                At α = 90°, reflections commute (retroreflection v₂ = −v). For other angles α, order matters!
              </p>

              {/* Mirror Angle Slider */}
              <div className="step17-params-box">
                <div className="step17-slider-row">
                  <div className="step17-slider-header">
                    <span>Angle Between Mirrors (α):</span>
                    <span className="step17-slider-val" style={{ color: mirrorAngle === 90 ? undefined : (isLight ? '#BE123C' : '#FDA4AF') }}>
                      {mirrorAngle}° {mirrorAngle === 90 ? '(Perpendicular: Commutative)' : '(Non-Commutative)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="120"
                    step="1"
                    value={mirrorAngle}
                    onChange={(e) => setMirrorAngle(parseInt(e.target.value, 10))}
                    className="step17-range-input"
                    style={{ '--slider-pct': getSliderPct(mirrorAngle, 30, 120) }}
                  />
                  <div className="step17-slider-ticks">
                    <span>30°</span>
                    <span>45°</span>
                    <span>60°</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary, #697951)' }}>90° (Retro)</span>
                    <span>120°</span>
                  </div>
                </div>
              </div>

              {/* Angle Presets */}
              <div className="step17-presets-wrap">
                <span className="step17-presets-label">Mirror Angle Presets:</span>
                <div className="step17-pill-grid">
                  {[
                    { label: '90° (Retroreflector)', deg: 90 },
                    { label: '60° (Kaleidoscope)', deg: 60 },
                    { label: '45° (Octant)', deg: 45 },
                    { label: '30° (Narrow Wedge)', deg: 30 },
                    { label: '75° (Oblique)', deg: 75 },
                    { label: '120° (Obtuse)', deg: 120 }
                  ].map((p) => (
                    <button
                      key={p.deg}
                      type="button"
                      onClick={() => setMirrorAngle(p.deg)}
                      className={`step17-pill-btn ${mirrorAngle === p.deg ? 'active' : ''}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order of Operations Switcher */}
              <div className="step17-presets-wrap">
                <span className="step17-presets-label">Reflection Order:</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setReflectionOrder('xThenY')}
                    className={`step17-pill-btn ${reflectionOrder === 'xThenY' ? 'active' : ''}`}
                    style={{ textAlign: 'center', padding: '0.35rem 0.2rem' }}
                  >
                    1st: M1 (Rx)<br />2nd: M2 (Rα)<br />
                    <span style={{ fontSize: '0.62rem', opacity: 0.85 }}>Rot(+{2 * mirrorAngle}°)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReflectionOrder('yThenX')}
                    className={`step17-pill-btn ${reflectionOrder === 'yThenX' ? 'active' : ''}`}
                    style={{ textAlign: 'center', padding: '0.35rem 0.2rem' }}
                  >
                    1st: M2 (Rα)<br />2nd: M1 (Rx)<br />
                    <span style={{ fontSize: '0.62rem', opacity: 0.85 }}>Rot(−{2 * mirrorAngle}°)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReflectionOrder('compare')}
                    className={`step17-pill-btn ${reflectionOrder === 'compare' ? 'active' : ''}`}
                    style={{ textAlign: 'center', padding: '0.35rem 0.2rem' }}
                  >
                    Compare Both<br />Simultaneously<br />
                    <span style={{ fontSize: '0.62rem', opacity: 0.85 }}>Rx·Rα vs Rα·Rx</span>
                  </button>
                </div>
              </div>

              {/* Evaluated Composite Matrix Products */}
              <div className="step17-formula-box">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.68rem' }}>
                  <div style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Mirror 1 (0°):</span>
                    <strong className="step17-formula-accent">Rx = [1, 0; 0, −1]</strong>
                  </div>
                  <div style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Mirror 2 ({mirrorAngle}°):</span>
                    <strong className="step17-formula-accent">Rα = [{cos2A.toFixed(2)}, {sin2A.toFixed(2)}; {sin2A.toFixed(2)}, {(-cos2A).toFixed(2)}]</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Order A (Rα · Rx): Rot(+{2 * mirrorAngle}°)</span>
                    <strong className="step17-formula-accent">[{vOutAx.toFixed(1)}, {vOutAy.toFixed(1)}]^T</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Order B (Rx · Rα): Rot(−{2 * mirrorAngle}°)</span>
                    <strong className="step17-formula-accent">[{vOutBx.toFixed(1)}, {vOutBy.toFixed(1)}]^T</strong>
                  </div>
                </div>

                {/* Commutator Verdict */}
                {mirrorAngle === 90 ? (
                  <div style={{ fontSize: '0.70rem', padding: '0.35rem 0.5rem', borderRadius: '6px', background: 'rgba(105, 121, 81, 0.12)', border: '1px solid rgba(105, 121, 81, 0.25)', marginTop: '0.15rem' }}>
                    <strong style={{ color: 'var(--accent-primary, #697951)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.1rem' }}>
                      <CheckCircle2 size={12} /> Commutative Case: Rx · Ry = Ry · Rx = −I
                    </strong>
                    Since +180° ≡ −180°, both orders produce the exact same retroreflected vector −v.
                  </div>
                ) : (
                  <div style={{ fontSize: '0.70rem', padding: '0.35rem 0.5rem', borderRadius: '6px', background: 'rgba(225, 29, 72, 0.10)', border: '1px solid rgba(225, 29, 72, 0.25)', marginTop: '0.15rem' }}>
                    <strong style={{ color: isLight ? '#BE123C' : '#FDA4AF', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.1rem' }}>
                      <Info size={12} /> Non-Commutative: Rx · Rα ≠ Rα · Rx
                    </strong>
                    Off-diagonal signs differ: Order A rotates +{2 * mirrorAngle}°, while Order B rotates −{2 * mirrorAngle}°. Exits diverge by {Math.abs(4 * mirrorAngle) % 360}°.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Canvas Column */}
          <div className="step17-canvas-col">
            <div className="step17-canvas-card">
              <div className="step17-card-header">
                <span className="step17-card-title">
                  {mirrorAngle === 90
                    ? 'Perpendicular 90° Corner Reflector (Retroreflector)'
                    : `Inclined Two-Mirror System (α = ${mirrorAngle}°)`}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="step17-play-btn"
                    title={isPlaying ? 'Pause ray propagation' : 'Play ray propagation'}
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  <span className={mirrorAngle === 90 ? 'step17-badge' : 'step17-badge-rose'}>
                    {mirrorAngle === 90 ? 'Commutative: v₂ = −v' : 'Non-Commutative: R₁R₂ ≠ R₂R₁'}
                  </span>
                </div>
              </div>

              <div className="step17-canvas-frame">
                <canvas
                  ref={successiveCanvasRef}
                  width={560}
                  height={400}
                />
              </div>

              <div className="step17-legend-bar">
                {reflectionOrder === 'compare' ? (
                  <>
                    <div className="step17-legend-item">
                      <svg width="22" height="10" viewBox="0 0 22 10" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
                        <line x1="1" y1="5" x2="16" y2="5" stroke={isLight ? '#55683E' : '#FFFFFF'} strokeWidth="2.4" strokeDasharray="2 3" strokeLinecap="round" />
                        <polygon points="15,2 21,5 15,8" fill={isLight ? '#55683E' : '#FFFFFF'} />
                      </svg>
                      <span>Order A (M1 then M2): Rot(+{2 * mirrorAngle}°)</span>
                    </div>
                    <div className="step17-legend-item">
                      <svg width="22" height="10" viewBox="0 0 22 10" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
                        <line x1="1" y1="5" x2="16" y2="5" stroke={isLight ? '#7C6F5A' : '#A8BDD9'} strokeWidth="2.4" strokeDasharray="2 3" strokeLinecap="round" />
                        <polygon points="15,2 21,5 15,8" fill={isLight ? '#7C6F5A' : '#A8BDD9'} />
                      </svg>
                      <span>Order B (M2 then M1): Rot(−{2 * mirrorAngle}°)</span>
                    </div>
                  </>
                ) : reflectionOrder === 'xThenY' ? (
                  <>
                    <div className="step17-legend-item">
                      <svg width="22" height="10" viewBox="0 0 22 10" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
                        <line x1="1" y1="5" x2="16" y2="5" stroke={isLight ? '#55683E' : '#FFFFFF'} strokeWidth="2.4" strokeDasharray="2 3" strokeLinecap="round" />
                        <polygon points="15,2 21,5 15,8" fill={isLight ? '#55683E' : '#FFFFFF'} />
                      </svg>
                      <span>Order A: M1 (Rx) then M2 (Rα)</span>
                    </div>
                    <div className="step17-legend-item">
                      <span className="step17-badge" style={{ fontSize: '0.64rem', padding: '0.1rem 0.4rem' }}>Exit A: +{2 * mirrorAngle}°</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="step17-legend-item">
                      <svg width="22" height="10" viewBox="0 0 22 10" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
                        <line x1="1" y1="5" x2="16" y2="5" stroke={isLight ? '#7C6F5A' : '#A8BDD9'} strokeWidth="2.4" strokeDasharray="2 3" strokeLinecap="round" />
                        <polygon points="15,2 21,5 15,8" fill={isLight ? '#7C6F5A' : '#A8BDD9'} />
                      </svg>
                      <span>Order B: M2 (Rα) then M1 (Rx)</span>
                    </div>
                    <div className="step17-legend-item">
                      <span className="step17-badge" style={{ fontSize: '0.64rem', padding: '0.1rem 0.4rem' }}>Exit B: −{2 * mirrorAngle}°</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STANDARDIZED EDUCATIONAL DOCUMENTATION */}
      <div style={{ marginTop: '1.25rem' }}>
        <ModuleDocumentation stepNumber={17} defaultOpen={false} />
      </div>

      {/* STEP NAVIGATION FOOTER */}
      <StepFooter stepNumber={17} onSelectStep={onSelectStep} />
    </div>
  );
}
