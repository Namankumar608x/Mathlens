import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
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
  Maximize2
} from 'lucide-react';
import StepFooter from '../components/layout/StepFooter';

export default function Step17RayOptics({ onSelectStep }) {
  // Active Tab: 'vector' | 'reflection' | 'rotation' | 'successive'
  const [activeTab, setActiveTab] = useState('vector');

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
  const [reflectionOrder, setReflectionOrder] = useState('xThenY'); // 'xThenY' | 'yThenX'
  const [mirrorAngle, setMirrorAngle] = useState(90); // 90° for perpendicular

  // Canvas Refs
  const vectorCanvasRef = useRef(null);
  const reflectionCanvasRef = useRef(null);
  const rotationCanvasRef = useRef(null);
  const successiveCanvasRef = useRef(null);

  // Particle animation state for laser beam photons
  const [animTime, setAnimTime] = useState(0);

  useEffect(() => {
    let animId;
    const animate = () => {
      setAnimTime(t => (t + 0.03) % 1);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

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

    // Center origin
    const originX = width / 2;
    const originY = height / 2;
    const scale = Math.min(width, height) / 12; // 12 units span

    // 1. Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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

    // 2. Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px monospace';
    ctx.fillText('+x', width - 20, originY - 8);
    ctx.fillText('+y', originX + 8, 20);

    const tipX = originX + vecDx * scale;
    const tipY = originY - vecDy * scale;

    // 3. Component projection dashed lines
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
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
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`dx = ${vecDx.toFixed(1)}`, originX + (vecDx * scale) / 2 - 20, originY + (vecDy >= 0 ? 16 : -8));
    ctx.fillText(`dy = ${vecDy.toFixed(1)}`, tipX + (vecDx >= 0 ? 8 : -55), originY - (vecDy * scale) / 2);

    // 4. Angle Arc
    const angleRad = Math.atan2(vecDy, vecDx);
    ctx.beginPath();
    ctx.arc(originX, originY, 32, 0, -angleRad, vecDy < 0);
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. Light Ray Beam (Outer glow + solid core)
    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Inner bright white laser core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.restore();

    // 6. Arrowhead at Ray tip
    const arrowLen = 14;
    const arrowAngle = Math.PI / 7;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - arrowLen * Math.cos(-angleRad - arrowAngle),
      tipY - arrowLen * Math.sin(-angleRad - arrowAngle)
    );
    ctx.lineTo(
      tipX - arrowLen * Math.cos(-angleRad + arrowAngle),
      tipY - arrowLen * Math.sin(-angleRad + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();

    // 7. Animated Photons along ray
    const mag = Math.hypot(vecDx, vecDy);
    if (mag > 0.1) {
      for (let i = 0; i < 3; i++) {
        const pFrac = (animTime + i / 3) % 1;
        const px = originX + vecDx * scale * pFrac;
        const py = originY - vecDy * scale * pFrac;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Origin dot
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(originX, originY, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [activeTab, vecDx, vecDy, animTime]);

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

    // 1. Draw Plane Mirror Surface
    const mirrorLeft = width * 0.12;
    const mirrorRight = width * 0.88;

    // Glass/Mirror gradient bar
    const mirrorGrad = ctx.createLinearGradient(mirrorLeft, mirrorY, mirrorRight, mirrorY);
    mirrorGrad.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
    mirrorGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
    mirrorGrad.addColorStop(1, 'rgba(56, 189, 248, 0.2)');
    ctx.strokeStyle = mirrorGrad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(mirrorLeft, mirrorY);
    ctx.lineTo(mirrorRight, mirrorY);
    ctx.stroke();

    // Mirror Hatching Marks (//////)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    for (let x = mirrorLeft + 8; x <= mirrorRight - 8; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, mirrorY + 2);
      ctx.lineTo(x - 9, mirrorY + 14);
      ctx.stroke();
    }

    // Mirror Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Horizontal Plane Mirror (x-axis, y = 0)', mirrorLeft + 10, mirrorY + 26);

    // 2. Normal Line (Dashed perpendicular at reflection point)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(mirrorXCenter, mirrorY - 180);
    ctx.lineTo(mirrorXCenter, mirrorY + 50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Right-angle marker
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mirrorXCenter, mirrorY - 14, 14, 14);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '11px monospace';
    ctx.fillText('Normal (n̂)', mirrorXCenter + 6, mirrorY - 165);

    // Incident Ray coordinates
    // Source point: incident ray travels DOWNWARD to mirrorXCenter, mirrorY
    const incSourceX = mirrorXCenter - incDx * scale;
    const incSourceY = mirrorY + incDy * scale; // incDy is negative (above mirror)

    // Incident Ray
    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(incSourceX, incSourceY);
    ctx.lineTo(mirrorXCenter, mirrorY);
    ctx.stroke();
    ctx.restore();

    // Incident Ray Arrow
    const incMidX = (incSourceX + mirrorXCenter) / 2;
    const incMidY = (incSourceY + mirrorY) / 2;
    const incAngle = Math.atan2(mirrorY - incSourceY, mirrorXCenter - incSourceX);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(incMidX, incMidY);
    ctx.lineTo(incMidX - 10 * Math.cos(incAngle - Math.PI / 7), incMidY - 10 * Math.sin(incAngle - Math.PI / 7));
    ctx.lineTo(incMidX - 10 * Math.cos(incAngle + Math.PI / 7), incMidY - 10 * Math.sin(incAngle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();

    // Reflected Ray: vertical component is reversed (-incDy)
    // If double reflected, it reverses again back to incDy!
    const effectiveDy = isDoubleReflected ? incDy : -incDy;
    const refTargetX = mirrorXCenter + incDx * scale;
    const refTargetY = mirrorY - effectiveDy * scale;

    ctx.save();
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = isDoubleReflected ? '#f59e0b' : '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mirrorXCenter, mirrorY);
    ctx.lineTo(refTargetX, refTargetY);
    ctx.stroke();
    ctx.restore();

    // Reflected Arrow
    const refMidX = (mirrorXCenter + refTargetX) / 2;
    const refMidY = (mirrorY + refTargetY) / 2;
    const refAngle = Math.atan2(refTargetY - mirrorY, refTargetX - mirrorXCenter);
    ctx.fillStyle = isDoubleReflected ? '#f59e0b' : '#10b981';
    ctx.beginPath();
    ctx.moveTo(refMidX, refMidY);
    ctx.lineTo(refMidX - 10 * Math.cos(refAngle - Math.PI / 7), refMidY - 10 * Math.sin(refAngle - Math.PI / 7));
    ctx.lineTo(refMidX - 10 * Math.cos(refAngle + Math.PI / 7), refMidY - 10 * Math.sin(refAngle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();

    // Incidence & Reflection Angle Arcs
    const thetaIncidentDeg = Math.abs(Math.round(Math.atan2(Math.abs(incDx), Math.abs(incDy)) * (180 / Math.PI)));
    
    // Draw angle arc for incident ray (from normal to incident ray)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(mirrorXCenter, mirrorY, 40, -Math.PI / 2 - (thetaIncidentDeg * Math.PI) / 180, -Math.PI / 2);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '11px monospace';
    ctx.fillText(`${thetaIncidentDeg}°`, mirrorXCenter - 32, mirrorY - 48);

    // Draw angle arc for reflected ray (from normal to reflected ray)
    if (!isDoubleReflected) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(mirrorXCenter, mirrorY, 40, -Math.PI / 2, -Math.PI / 2 + (thetaIncidentDeg * Math.PI) / 180);
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.font = '11px monospace';
      ctx.fillText(`${thetaIncidentDeg}°`, mirrorXCenter + 14, mirrorY - 48);
    }

    // Impact point glow
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(mirrorXCenter, mirrorY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [activeTab, incDx, incDy, isDoubleReflected, animTime]);

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
    const scale = Math.min(width, height) / 10;

    // Grid circles for angular polar perspective
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    [1, 2, 3, 4].forEach(r => {
      ctx.beginPath();
      ctx.arc(originX, originY, r * scale, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(originX - 4.5 * scale, originY);
    ctx.lineTo(originX + 4.5 * scale, originY);
    ctx.moveTo(originX, originY - 4.5 * scale);
    ctx.lineTo(originX, originY + 4.5 * scale);
    ctx.stroke();

    // 1. Base Ray (Original d)
    const baseTipX = originX + baseDx * scale;
    const baseTipY = originY - baseDy * scale;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
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
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(originX, originY, 48, -baseAngle, -rotTargetAngle, rotAngle < 0);
    ctx.stroke();

    // Label on rotation arc
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${rotAngle > 0 ? '+' : ''}${rotAngle}°`, originX + 54 * Math.cos(-baseAngle - thetaRad / 2), originY + 54 * Math.sin(-baseAngle - thetaRad / 2));

    // Draw Rotated Ray Beam
    ctx.save();
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(rotTipX, rotTipY);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(rotTipX, rotTipY);
    ctx.stroke();
    ctx.restore();

    // Rotated Arrow head
    const rAngle = Math.atan2(rotTipY - originY, rotTipX - originX);
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.moveTo(rotTipX, rotTipY);
    ctx.lineTo(rotTipX - 12 * Math.cos(rAngle - Math.PI / 7), rotTipY - 12 * Math.sin(rAngle - Math.PI / 7));
    ctx.lineTo(rotTipX - 12 * Math.cos(rAngle + Math.PI / 7), rotTipY - 12 * Math.sin(rAngle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();

    // Center pivot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(originX, originY, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [activeTab, rotAngle, baseDx, baseDy, animTime]);

  // ----------------------------------------------------------------------
  // CANVAS RENDERER 4: SUCCESSIVE REFLECTIONS & RETROREFLECTOR (10.4)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'successive') return;
    const canvas = successiveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Corner vertex at center or lower quadrant
    const cornerX = width * 0.42;
    const cornerY = height * 0.58;
    const armLength = Math.min(width, height) * 0.38;

    // 1. Draw Horizontal Mirror along cornerX -> cornerX + armLength
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cornerX - 40, cornerY);
    ctx.lineTo(cornerX + armLength, cornerY);
    ctx.stroke();

    // Hatching under Horizontal Mirror
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.2;
    for (let x = cornerX - 30; x <= cornerX + armLength - 10; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, cornerY);
      ctx.lineTo(x - 8, cornerY + 10);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Mirror 1 (Rx)', cornerX + armLength - 70, cornerY + 22);

    // 2. Draw Vertical Mirror along cornerY - armLength -> cornerY + 40
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.9)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cornerX, cornerY - armLength);
    ctx.lineTo(cornerX, cornerY + 40);
    ctx.stroke();

    // Hatching behind Vertical Mirror
    for (let y = cornerY - armLength + 10; y <= cornerY + 30; y += 12) {
      ctx.beginPath();
      ctx.moveTo(cornerX, y);
      ctx.lineTo(cornerX - 10, y + 8);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Mirror 2 (Ry)', cornerX - 78, cornerY - armLength + 20);

    // Perpendicular angle marker at corner
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cornerX, cornerY - 14, 14, 14);

    // Ray Paths:
    // Case A: Strike Horizontal mirror first at P1(cornerX + 80, cornerY), then Vertical mirror at P2(cornerX, cornerY - 60)
    // Case B: Strike Vertical mirror first at P1, then Horizontal mirror at P2
    const hStrikeDist = 80;
    const vStrikeDist = 60;

    let pStart, p1, p2, pFinal;

    if (reflectionOrder === 'xThenY') {
      // Incident hits Horizontal mirror at (cornerX + hStrikeDist, cornerY)
      p1 = { x: cornerX + hStrikeDist, y: cornerY };
      pStart = { x: p1.x + retroVx * 45, y: p1.y - retroVy * 45 };
      p2 = { x: cornerX, y: cornerY - vStrikeDist };
      // After hitting vertical mirror, ray exits travelling in opposite direction (-v)
      pFinal = { x: p2.x + retroVx * 45, y: p2.y - retroVy * 45 };
    } else {
      // Strike Vertical mirror first at (cornerX, cornerY - vStrikeDist)
      p1 = { x: cornerX, y: cornerY - vStrikeDist };
      pStart = { x: p1.x + retroVx * 45, y: p1.y - retroVy * 45 };
      p2 = { x: cornerX + hStrikeDist, y: cornerY };
      pFinal = { x: p2.x + retroVx * 45, y: p2.y - retroVy * 45 };
    }

    // 1. Incident Segment
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();

    // 2. Intermediate Segment (Between Mirror 1 and Mirror 2)
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // 3. Exiting Retroreflected Segment (Opposite direction: -v)
    ctx.strokeStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(pFinal.x, pFinal.y);
    ctx.stroke();
    ctx.restore();

    // Hit Point Sparks
    [p1, p2].forEach(p => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Arrow on Exit Segment showing anti-parallel direction
    const exitAngle = Math.atan2(pFinal.y - p2.y, pFinal.x - p2.x);
    const exitMidX = (p2.x + pFinal.x) / 2;
    const exitMidY = (p2.y + pFinal.y) / 2;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(exitMidX, exitMidY);
    ctx.lineTo(exitMidX - 10 * Math.cos(exitAngle - Math.PI / 7), exitMidY - 10 * Math.sin(exitAngle - Math.PI / 7));
    ctx.lineTo(exitMidX - 10 * Math.cos(exitAngle + Math.PI / 7), exitMidY - 10 * Math.sin(exitAngle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  }, [activeTab, retroVx, retroVy, reflectionOrder, mirrorAngle, animTime]);

  // Calculations for display
  const vecAngleDeg = (Math.atan2(vecDy, vecDx) * (180 / Math.PI)).toFixed(1);
  const vecMagnitude = Math.hypot(vecDx, vecDy).toFixed(2);

  // Rotation Matrix values
  const thetaRad = (rotAngle * Math.PI) / 180;
  const cosT = Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);
  const rotDx = cosT * baseDx - sinT * baseDy;
  const rotDy = sinT * baseDx + cosT * baseDy;

  return (
    <div className="math-step-view" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* HEADER SECTION */}
      <div className="step-header-box" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              className="modal-badge-tag"
              style={{
                margin: 0,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                borderColor: 'rgba(245, 158, 11, 0.35)'
              }}
            >
              Visual Lab 17
            </span>
            <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Ray Optics &amp; Transformation Matrices
            </span>
          </div>
        </div>

        <h2 className="step-heading">
          Exploring Ray Optics Through Matrices
        </h2>
        <p className="step-description">
          Connect linear algebra with familiar optical phenomena! Represent light rays as 2D spatial vectors,
          formalize specular mirror reflection as matrix transformations ($R^2 = I$), rotate light beams via $R(\theta)$,
          and uncover why perpendicular double-mirrors create retroreflection ($R_y R_x = -I$).
        </p>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 mb-6 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('vector')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'vector'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Compass size={16} />
          <span>1. Rays as Vectors</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reflection')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'reflection'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Layers size={16} />
          <span>2. Plane Mirror Reflection</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rotation')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'rotation'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <RotateCcw size={16} />
          <span>3. Ray Rotation Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('successive')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'successive'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Repeat size={16} />
          <span>4. Successive Reflections</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: LIGHT RAYS AS VECTORS */}
      {/* ========================================================================= */}
      {activeTab === 'vector' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass size={17} className="text-amber-400" />
                  Ray Direction Vector $d$
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                  d = [{vecDx.toFixed(1)}, {vecDy.toFixed(1)}]^T
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                A light ray propagating in the $xy$-plane is characterized by its direction vector:
                two units horizontally for every one unit vertically ($d = [2, 1]^T$).
              </p>

              {/* Slider dx */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">Horizontal Component ($dx$):</span>
                  <span className="text-amber-400 font-bold">{vecDx.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="0.1"
                  value={vecDx}
                  onChange={e => setVecDx(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Slider dy */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">Vertical Component ($dy$):</span>
                  <span className="text-amber-400 font-bold">{vecDy.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="0.1"
                  value={vecDy}
                  onChange={e => setVecDy(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Preset Buttons */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-zinc-400 block mb-2">Preset Directions:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '[2, 1] (PDF Example)', dx: 2, dy: 1 },
                    { label: '[3, 0] Horizontal', dx: 3, dy: 0 },
                    { label: '[0, 3] Vertical', dx: 0, dy: 3 },
                    { label: '[2, 2] 45°', dx: 2, dy: 2 },
                    { label: '[-2, 1] Left-Up', dx: -2, dy: 1 },
                    { label: '[2, -1] Right-Down', dx: 2, dy: -1 }
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setVecDx(p.dx);
                        setVecDy(p.dy);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/10 text-zinc-300 hover:text-amber-300 transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vector Math Card */}
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mathematical Specification</h4>
              
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-xs text-zinc-400 block">Angle to x-axis</span>
                  <span className="text-base font-bold font-mono text-cyan-400">{vecAngleDeg}°</span>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-xs text-zinc-400 block">Magnitude ‖d‖</span>
                  <span className="text-base font-bold font-mono text-amber-400">{vecMagnitude}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-zinc-300 space-y-1">
                <div>Vector Notation: <strong>d = [{vecDx.toFixed(2)}, {vecDy.toFixed(2)}]^T</strong></div>
                <div>Slope: <strong>m = dy/dx = {(vecDy / (vecDx || 0.001)).toFixed(2)}</strong></div>
              </div>
            </div>
          </div>

          {/* Interactive Canvas Column */}
          <div className="lg:col-span-7">
            <div className="glass-level-2 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-semibold text-zinc-400">Interactive xy-Plane Ray Simulation</span>
                <span className="text-xs font-mono text-amber-400">Origin (0, 0)</span>
              </div>
              <canvas
                ref={vectorCanvasRef}
                width={560}
                height={400}
                className="w-full max-w-[560px] h-auto rounded-xl bg-slate-950/80 border border-white/5 shadow-inner"
              />
              <p className="text-xs text-zinc-500 mt-3 text-center">
                Adjust sliders to see the light ray dynamically rotate and scale in real-time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PLANE MIRROR REFLECTION */}
      {/* ========================================================================= */}
      {activeTab === 'reflection' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Matrix Equation */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={17} className="text-emerald-400" />
                  Reflection Matrix $R_x$
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                  Law: θ_i = θ_r
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                For a horizontal mirror along the $x$-axis, the horizontal component remains unchanged,
                while the vertical component reverses its sign: $dx' = dx$, $dy' = -dy$.
              </p>

              {/* Incident Ray Direction Sliders */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">Incident dx:</span>
                    <span className="text-amber-400 font-bold">{incDx.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4"
                    step="0.1"
                    value={incDx}
                    onChange={e => setIncDx(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">Incident dy (Downward):</span>
                    <span className="text-amber-400 font-bold">{incDy.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-4"
                    max="-0.5"
                    step="0.1"
                    value={incDy}
                    onChange={e => setIncDy(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Matrix Formulation Display */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-xs text-zinc-400">Matrix Transformation:</div>
                <div className="font-mono text-xs sm:text-sm text-cyan-300 text-center py-1">
                  [dx', dy']^T = [1, 0; 0, -1] · [{incDx.toFixed(1)}, {incDy.toFixed(1)}]^T
                </div>
                <div className="font-mono text-xs sm:text-sm text-emerald-400 font-bold text-center">
                  Result: [{incDx.toFixed(1)}, {(-incDy).toFixed(1)}]^T
                </div>
              </div>

              {/* R^2 = I Involution Action */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsDoubleReflected(prev => !prev)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    isDoubleReflected
                      ? 'bg-purple-500/25 border-purple-500/40 text-purple-300 shadow-md'
                      : 'bg-white/5 border-white/10 hover:border-emerald-500/30 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Repeat size={15} />
                  <span>{isDoubleReflected ? 'Reflected Twice (R² = I Applied)' : 'Apply Reflection Twice (Test R² = I)'}</span>
                </button>
              </div>
            </div>

            {/* Questions for Learners Accordion */}
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <HelpCircle size={14} className="text-cyan-400" />
                Questions for Learners (from Curriculum)
              </h4>

              {[
                {
                  id: 1,
                  q: '1. What happens when the incident angle is zero?',
                  a: 'When incident angle is zero, the ray travels directly along the normal line (dx = 0, dy = -1). Multiplying by R yields [0, 1]^T: the ray reflects straight back on itself along the normal (180° reversal).'
                },
                {
                  id: 2,
                  q: '2. Why does the vertical component of the direction vector change sign?',
                  a: 'The specular mirror surface lies along the horizontal x-axis. Physical reflection reverses the component of velocity perpendicular to the mirror (the normal y-axis), while leaving the tangential horizontal component unchanged.'
                },
                {
                  id: 3,
                  q: '3. What happens if the reflection matrix is applied twice?',
                  a: 'Applying the reflection matrix twice gives R² = [1, 0; 0, -1] · [1, 0; 0, -1] = [1, 0; 0, 1] = I (the identity matrix). Reflecting a reflected ray restores its original direction! This is the involution property: R² = I.'
                }
              ].map(item => (
                <div key={item.id} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenQuestion(openQuestion === item.id ? null : item.id)}
                    className="w-full p-3 text-left text-xs font-medium text-zinc-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    {openQuestion === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {openQuestion === item.id && (
                    <div className="p-3 pt-0 text-xs text-zinc-400 border-t border-white/5 leading-relaxed bg-white/[0.02]">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Ray Diagram Column */}
          <div className="lg:col-span-7">
            <div className="glass-level-2 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-semibold text-zinc-400">Law of Reflection Diagram</span>
                <span className="text-xs font-mono text-emerald-400">
                  {isDoubleReflected ? 'Double Reflection (R² = I)' : 'Single Reflection (R)'}
                </span>
              </div>
              <canvas
                ref={reflectionCanvasRef}
                width={560}
                height={400}
                className="w-full max-w-[560px] h-auto rounded-xl bg-slate-950/80 border border-white/5 shadow-inner"
              />
              <div className="flex items-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="text-zinc-300">Incident Ray: [{incDx.toFixed(1)}, {incDy.toFixed(1)}]^T</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-zinc-300">Reflected Ray: [{incDx.toFixed(1)}, {(-incDy).toFixed(1)}]^T</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Rotation Matrix */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <RotateCcw size={17} className="text-purple-400" />
                  Rotation Matrix $R(\theta)$
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
                  θ = {rotAngle}°
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Suppose we want to rotate the direction of a light ray by an angle $\theta$:
                $d' = R(\theta)d$, where $R(\theta) = [\cos\theta, -\sin\theta; \sin\theta, \cos\theta]$.
              </p>

              {/* Slider -180 to 180 as requested in PDF */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">Rotation Angle ($\theta$):</span>
                  <span className="text-purple-400 font-bold">{rotAngle}° ({((rotAngle * Math.PI) / 180).toFixed(2)} rad)</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotAngle}
                  onChange={e => setRotAngle(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>-180°</span>
                  <span>-90°</span>
                  <span>0°</span>
                  <span>+90°</span>
                  <span>+180°</span>
                </div>
              </div>

              {/* Angle Quick Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[0, 30, 45, 60, 90, 180, -45, -90].map(deg => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setRotAngle(deg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                      rotAngle === deg
                        ? 'bg-purple-500/25 border-purple-500/50 text-purple-300'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {deg > 0 ? `+${deg}°` : `${deg}°`}
                  </button>
                ))}
              </div>

              {/* 2x2 Matrix Display */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                <span className="text-xs font-semibold text-zinc-400 block">Evaluated 2×2 Rotation Matrix:</span>
                <div className="flex items-center justify-center gap-3 font-mono text-sm">
                  <span className="text-zinc-400">R({rotAngle}°) =</span>
                  <div className="inline-block px-3 py-2 rounded-lg bg-purple-950/30 border border-purple-500/30 text-purple-300">
                    <div className="flex gap-4 border-b border-purple-500/20 pb-1">
                      <span>{cosT.toFixed(3)}</span>
                      <span>{(-sinT).toFixed(3)}</span>
                    </div>
                    <div className="flex gap-4 pt-1">
                      <span>{sinT.toFixed(3)}</span>
                      <span>{cosT.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center font-mono text-xs text-zinc-300 pt-2 border-t border-white/5">
                  Original Ray: [{baseDx}, {baseDy}]^T &nbsp;→&nbsp; <strong className="text-purple-300">Rotated: [{rotDx.toFixed(2)}, {rotDy.toFixed(2)}]^T</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Column */}
          <div className="lg:col-span-7">
            <div className="glass-level-2 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-semibold text-zinc-400">Angular Ray Rotation Visualizer</span>
                <span className="text-xs font-mono text-purple-400">R(θ) Transformation</span>
              </div>
              <canvas
                ref={rotationCanvasRef}
                width={560}
                height={400}
                className="w-full max-w-[560px] h-auto rounded-xl bg-slate-950/80 border border-white/5 shadow-inner"
              />
              <div className="flex items-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 border border-dashed border-zinc-400 inline-block" />
                  <span className="text-zinc-400">Initial Ray d</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
                  <span className="text-purple-300">Rotated Ray d' = R(θ)d</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Retroreflector Insights */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Repeat size={17} className="text-cyan-400" />
                  Two Successive Reflections
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                  v₂ = -v
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                A light ray travels toward two perpendicular plane mirrors. Reflecting first from one mirror
                and then from the second produces a <strong>retroreflection</strong> ($v_2 = -v$), reversing the ray back to its source!
              </p>

              {/* Order of Operations Switcher */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-300 block">Reflection Order:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReflectionOrder('xThenY')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      reflectionOrder === 'xThenY'
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    1st: Horizontal (Rx)<br />2nd: Vertical (Ry)
                  </button>

                  <button
                    type="button"
                    onClick={() => setReflectionOrder('yThenX')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      reflectionOrder === 'yThenX'
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    1st: Vertical (Ry)<br />2nd: Horizontal (Rx)
                  </button>
                </div>
              </div>

              {/* Matrix Product Derivation from PDF */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 font-mono text-xs">
                <span className="text-zinc-400 font-sans block text-xs font-semibold">Mathematical Derivation:</span>
                
                {reflectionOrder === 'xThenY' ? (
                  <>
                    <div className="text-amber-300">1. v₁ = R_x · v = [1, 0; 0, -1] · [2, 1]^T = [2, -1]^T</div>
                    <div className="text-cyan-300">2. v₂ = R_y · v₁ = [-1, 0; 0, 1] · [2, -1]^T = [-2, -1]^T = -v</div>
                    <div className="pt-2 text-emerald-400 font-bold border-t border-white/10">
                      R_y · R_x = [-1, 0; 0, -1] = -I
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-purple-300">1. v₁ = R_y · v = [-1, 0; 0, 1] · [2, 1]^T = [-2, 1]^T</div>
                    <div className="text-cyan-300">2. v₂ = R_x · v₁ = [1, 0; 0, -1] · [-2, 1]^T = [-2, -1]^T = -v</div>
                    <div className="pt-2 text-emerald-400 font-bold border-t border-white/10">
                      R_x · R_y = [-1, 0; 0, -1] = -I
                    </div>
                  </>
                )}
              </div>

              {/* Physical Insight Card */}
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1 text-xs text-zinc-300 leading-relaxed">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Does the order of reflection matter?
                </div>
                <p>
                  Because $R_y R_x = R_x R_y = -I$, the order does <strong>not</strong> matter for perpendicular ($90^\circ$) mirrors!
                  However, for mirrors intersecting at other angles $\alpha$, the combined operation is a rotation of $2\alpha$,
                  and the order <strong>does</strong> matter!
                </p>
              </div>
            </div>
          </div>

          {/* Retroreflector Canvas Column */}
          <div className="lg:col-span-7">
            <div className="glass-level-2 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-semibold text-zinc-400">Perpendicular 90° Corner Reflector (Retroreflector)</span>
                <span className="text-xs font-mono text-cyan-400">Order: {reflectionOrder === 'xThenY' ? 'Rx → Ry' : 'Ry → Rx'}</span>
              </div>
              <canvas
                ref={successiveCanvasRef}
                width={560}
                height={400}
                className="w-full max-w-[560px] h-auto rounded-xl bg-slate-950/80 border border-white/5 shadow-inner"
              />
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  Incident Ray v = [2, 1]^T
                </span>
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                  Intermediate v₁
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  Final Ray v₂ = -v (Anti-Parallel)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP NAVIGATION FOOTER */}
      <StepFooter stepNumber={17} onSelectStep={onSelectStep} />
    </div>
  );
}
