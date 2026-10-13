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
    const isNormalIncidence = Math.abs(incDx) < 0.05;

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
    ctx.strokeStyle = isNormalIncidence ? 'rgba(56, 189, 248, 0.8)' : 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = isNormalIncidence ? 2 : 1.5;
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

    ctx.fillStyle = isNormalIncidence ? '#38bdf8' : 'rgba(148, 163, 184, 0.8)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('Normal (n̂)', mirrorXCenter + 8, mirrorY - 165);

    if (isNormalIncidence) {
      // ------------------------------------------------------------------
      // SPECIAL CASE: NORMAL INCIDENCE (i = 0° => r = 0°)
      // Ray travels straight down along normal, then reflects straight UP
      // ------------------------------------------------------------------
      const rayTopY = mirrorY + incDy * scale; // incDy is negative, so rayTopY is above mirror
      const offset = 4; // visual offset so both down & up rays and photons are distinct

      // Incident Ray (Downward, amber)
      ctx.save();
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mirrorXCenter - offset, rayTopY);
      ctx.lineTo(mirrorXCenter - offset, mirrorY);
      ctx.stroke();

      // Incident Arrow (pointing DOWN)
      const midDownY = (rayTopY + mirrorY) / 2;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(mirrorXCenter - offset, midDownY + 8);
      ctx.lineTo(mirrorXCenter - offset - 6, midDownY - 4);
      ctx.lineTo(mirrorXCenter - offset + 6, midDownY - 4);
      ctx.closePath();
      ctx.fill();

      // Reflected Ray (Upward, emerald - or amber if double reflected)
      const refColor = isDoubleReflected ? '#f59e0b' : '#10b981';
      ctx.shadowColor = refColor;
      ctx.strokeStyle = refColor;
      ctx.beginPath();
      ctx.moveTo(mirrorXCenter + offset, mirrorY);
      ctx.lineTo(mirrorXCenter + offset, rayTopY);
      ctx.stroke();

      // Reflected Arrow (pointing UP)
      ctx.fillStyle = refColor;
      ctx.beginPath();
      ctx.moveTo(mirrorXCenter + offset, midDownY - 8);
      ctx.lineTo(mirrorXCenter + offset - 6, midDownY + 4);
      ctx.lineTo(mirrorXCenter + offset + 6, midDownY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Animated photons: down on left, up on right
      const pFrac = animTime;
      // Downward photon
      const pDownY = rayTopY + (mirrorY - rayTopY) * pFrac;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mirrorXCenter - offset, pDownY, 2.8, 0, Math.PI * 2);
      ctx.fill();
      // Upward photon
      const pUpY = mirrorY - (mirrorY - rayTopY) * pFrac;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mirrorXCenter + offset, pUpY, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Bottom turnaround bounce arc
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mirrorXCenter, mirrorY, offset, 0, Math.PI);
      ctx.stroke();

      // Normal Incidence Annotation Badge
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1;
      const badgeW = 280;
      const badgeH = 32;
      const badgeX = mirrorXCenter - badgeW / 2;
      const badgeY = mirrorY - 95;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Normal Incidence: i = 0°, r = 0° (Ray Retraces Path)', mirrorXCenter, badgeY + 14);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px monospace';
      ctx.fillText('Deviation δ = 180° - 2(0°) = 180°', mirrorXCenter, badgeY + 26);
      ctx.restore();
    } else {
      // ------------------------------------------------------------------
      // STANDARD ANGLED INCIDENCE
      // ------------------------------------------------------------------
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
  // CANVAS RENDERER 4: SUCCESSIVE REFLECTIONS & NON-COMMUTATIVE MIRRORS (10.4)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'successive') return;
    const canvas = successiveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Corner vertex adaptive placement depending on angle
    const cornerX = mirrorAngle > 95 ? width * 0.44 : (mirrorAngle < 45 ? width * 0.22 : width * 0.32);
    const cornerY = height * 0.72;
    const arm1Length = Math.min(width, height) * 0.58;
    const arm2Length = Math.min(width, height) * 0.52;
    const alphaRad = (mirrorAngle * Math.PI) / 180;

    // 1. Draw Mirror 1 (Horizontal along x-axis)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cornerX - 35, cornerY);
    ctx.lineTo(cornerX + arm1Length, cornerY);
    ctx.stroke();

    // Hatching under Horizontal Mirror 1
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.2;
    for (let x = cornerX - 25; x <= cornerX + arm1Length - 10; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, cornerY + 1);
      ctx.lineTo(x - 8, cornerY + 11);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Mirror 1 (Rx, 0°)', cornerX + arm1Length - 95, cornerY + 22);

    // 2. Draw Mirror 2 (Inclined at mirrorAngle α)
    const m2EndX = cornerX + arm2Length * Math.cos(alphaRad);
    const m2EndY = cornerY - arm2Length * Math.sin(alphaRad);

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.9)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cornerX, cornerY);
    ctx.lineTo(m2EndX, m2EndY);
    ctx.stroke();

    // Hatching behind Mirror 2 (outer side of wedge)
    // Tangent along mirror: (cos α, -sin α)
    // Outward normal: (-sin α, -cos α)
    const nOutX = -Math.sin(alphaRad);
    const nOutY = -Math.cos(alphaRad);
    const tX = Math.cos(alphaRad);
    const tY = -Math.sin(alphaRad);
    for (let s = 14; s <= arm2Length - 10; s += 14) {
      const px = cornerX + s * tX;
      const py = cornerY + s * tY;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + 10 * nOutX - 5 * tX, py + 10 * nOutY - 5 * tY);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(168, 85, 247, 0.9)';
    ctx.font = '11px Inter, sans-serif';
    const m2LabelDist = arm2Length * 0.75;
    ctx.fillText(
      mirrorAngle === 90 ? 'Mirror 2 (Ry, 90°)' : `Mirror 2 (Rα, ${mirrorAngle}°)`,
      cornerX + m2LabelDist * tX + 16 * nOutX,
      cornerY + m2LabelDist * tY + 16 * nOutY
    );

    // 3. Corner Angle Marker / Arc
    if (mirrorAngle === 90) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cornerX, cornerY - 14, 14, 14);
    } else {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cornerX, cornerY, 34, 0, -alphaRad, true);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `α=${mirrorAngle}°`,
        cornerX + 44 * Math.cos(-alphaRad / 2) - 10,
        cornerY + 44 * Math.sin(-alphaRad / 2) + 4
      );
    }

    // Inward normal for Mirror 2 (facing inside wedge)
    const nInX = Math.sin(alphaRad);
    const nInY = Math.cos(alphaRad);

    // Helper: Draw Arrowhead
    const drawArrow = (x, y, angle, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 9 * Math.cos(angle - Math.PI / 7), y - 9 * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(x - 9 * Math.cos(angle + Math.PI / 7), y - 9 * Math.sin(angle + Math.PI / 7));
      ctx.closePath();
      ctx.fill();
    };

    // Helper: Draw animated photon along segment
    const drawPhoton = (x1, y1, x2, y2, tVal, color) => {
      const px = x1 + (x2 - x1) * tVal;
      const py = y1 + (y2 - y1) * tVal;
      ctx.fillStyle = color || '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 2.8, 0, Math.PI * 2);
      ctx.fill();
    };

    // ------------------------------------------------------------------
    // PATH CALCULATIONS
    // ------------------------------------------------------------------
    // Order A: Strike M1 at P1A, then M2 at P2A, exit as Exit A
    const s1A = 125;
    const s2A = 120;
    const p1A = { x: cornerX + s1A, y: cornerY };
    const p2A = { x: cornerX + s2A * tX, y: cornerY + s2A * tY };
    const wAx = p2A.x - p1A.x;
    const wAy = p2A.y - p1A.y;

    // Incoming vector to hit M1 and reflect into wA
    const vInAx = wAx;
    const vInAy = -wAy;
    const lenInA = Math.hypot(vInAx, vInAy) || 1;
    const pStartA = { x: p1A.x - (vInAx / lenInA) * 80, y: p1A.y - (vInAy / lenInA) * 80 };

    // Exit vector from M2
    const dotA = wAx * nInX + wAy * nInY;
    const vExitAx = wAx - 2 * dotA * nInX;
    const vExitAy = wAy - 2 * dotA * nInY;
    const lenExitA = Math.hypot(vExitAx, vExitAy) || 1;
    const pFinalA = { x: p2A.x + (vExitAx / lenExitA) * 90, y: p2A.y + (vExitAy / lenExitA) * 90 };

    // Order B: Strike M2 at P1B, then M1 at P2B, exit as Exit B
    const s2B = 135;
    const s1B = 75;
    const p1B = { x: cornerX + s2B * tX, y: cornerY + s2B * tY };
    const p2B = { x: cornerX + s1B, y: cornerY };
    const wBx = p2B.x - p1B.x;
    const wBy = p2B.y - p1B.y;

    // Incoming vector to hit M2 and reflect into wB
    const dotB = wBx * nInX + wBy * nInY;
    const vInBx = wBx - 2 * dotB * nInX;
    const vInBy = wBy - 2 * dotB * nInY;
    const lenInB = Math.hypot(vInBx, vInBy) || 1;
    const pStartB = { x: p1B.x - (vInBx / lenInB) * 80, y: p1B.y - (vInBy / lenInB) * 80 };

    // Exit vector from M1
    const vExitBx = wBx;
    const vExitBy = -wBy;
    const lenExitB = Math.hypot(vExitBx, vExitBy) || 1;
    const pFinalB = { x: p2B.x + (vExitBx / lenExitB) * 90, y: p2B.y + (vExitBy / lenExitB) * 90 };

    const showPathA = reflectionOrder === 'xThenY' || reflectionOrder === 'compare';
    const showPathB = reflectionOrder === 'yThenX' || reflectionOrder === 'compare';

    // ------------------------------------------------------------------
    // RENDER PATH A: M1 -> M2 (Rx then Rα)
    // ------------------------------------------------------------------
    if (showPathA) {
      const aColor = reflectionOrder === 'compare' ? '#38bdf8' : '#f59e0b';
      const aMidColor = '#38bdf8';
      const aExitColor = '#10b981';

      ctx.save();
      ctx.shadowBlur = 8;

      // Incident segment
      ctx.strokeStyle = aColor;
      ctx.shadowColor = aColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pStartA.x, pStartA.y);
      ctx.lineTo(p1A.x, p1A.y);
      ctx.stroke();
      drawArrow((pStartA.x + p1A.x) / 2, (pStartA.y + p1A.y) / 2, Math.atan2(p1A.y - pStartA.y, p1A.x - pStartA.x), aColor);
      drawPhoton(pStartA.x, pStartA.y, p1A.x, p1A.y, animTime, '#ffffff');

      // Intermediate segment
      ctx.strokeStyle = aMidColor;
      ctx.shadowColor = aMidColor;
      ctx.beginPath();
      ctx.moveTo(p1A.x, p1A.y);
      ctx.lineTo(p2A.x, p2A.y);
      ctx.stroke();
      drawArrow((p1A.x + p2A.x) / 2, (p1A.y + p2A.y) / 2, Math.atan2(p2A.y - p1A.y, p2A.x - p1A.x), aMidColor);
      drawPhoton(p1A.x, p1A.y, p2A.x, p2A.y, (animTime + 0.33) % 1, '#ffffff');

      // Exiting segment
      ctx.strokeStyle = aExitColor;
      ctx.shadowColor = aExitColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p2A.x, p2A.y);
      ctx.lineTo(pFinalA.x, pFinalA.y);
      ctx.stroke();
      drawArrow((p2A.x + pFinalA.x) / 2, (p2A.y + pFinalA.y) / 2, Math.atan2(pFinalA.y - p2A.y, pFinalA.x - p2A.x), aExitColor);
      drawPhoton(p2A.x, p2A.y, pFinalA.x, pFinalA.y, (animTime + 0.66) % 1, '#ffffff');

      // Exit Label
      ctx.fillStyle = aExitColor;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`Exit A (+${2 * mirrorAngle}°)`, pFinalA.x + 8, pFinalA.y + 4);

      // Hit sparks
      [p1A, p2A].forEach(p => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // ------------------------------------------------------------------
    // RENDER PATH B: M2 -> M1 (Rα then Rx)
    // ------------------------------------------------------------------
    if (showPathB) {
      const bColor = reflectionOrder === 'compare' ? '#e879f9' : '#f59e0b';
      const bMidColor = '#c084fc';
      const bExitColor = '#f43f5e';

      ctx.save();
      ctx.shadowBlur = 8;

      // Incident segment
      ctx.strokeStyle = bColor;
      ctx.shadowColor = bColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pStartB.x, pStartB.y);
      ctx.lineTo(p1B.x, p1B.y);
      ctx.stroke();
      drawArrow((pStartB.x + p1B.x) / 2, (pStartB.y + p1B.y) / 2, Math.atan2(p1B.y - pStartB.y, p1B.x - pStartB.x), bColor);
      drawPhoton(pStartB.x, pStartB.y, p1B.x, p1B.y, (animTime + 0.5) % 1, '#ffffff');

      // Intermediate segment
      ctx.strokeStyle = bMidColor;
      ctx.shadowColor = bMidColor;
      ctx.beginPath();
      ctx.moveTo(p1B.x, p1B.y);
      ctx.lineTo(p2B.x, p2B.y);
      ctx.stroke();
      drawArrow((p1B.x + p2B.x) / 2, (p1B.y + p2B.y) / 2, Math.atan2(p2B.y - p1B.y, p2B.x - p1B.x), bMidColor);
      drawPhoton(p1B.x, p1B.y, p2B.x, p2B.y, (animTime + 0.83) % 1, '#ffffff');

      // Exiting segment
      ctx.strokeStyle = bExitColor;
      ctx.shadowColor = bExitColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p2B.x, p2B.y);
      ctx.lineTo(pFinalB.x, pFinalB.y);
      ctx.stroke();
      drawArrow((p2B.x + pFinalB.x) / 2, (p2B.y + pFinalB.y) / 2, Math.atan2(pFinalB.y - p2B.y, pFinalB.x - p2B.x), bExitColor);
      drawPhoton(p2B.x, p2B.y, pFinalB.x, pFinalB.y, (animTime + 0.16) % 1, '#ffffff');

      // Exit Label
      ctx.fillStyle = bExitColor;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`Exit B (-${2 * mirrorAngle}°)`, pFinalB.x + 8, pFinalB.y + 12);

      // Hit sparks
      [p1B, p2B].forEach(p => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // Top Canvas Diagnostic Badge
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = mirrorAngle === 90 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)';
    ctx.lineWidth = 1;
    const topBadgeW = 380;
    const topBadgeH = 28;
    const topBadgeX = width / 2 - topBadgeW / 2;
    const topBadgeY = 12;
    ctx.beginPath();
    ctx.roundRect(topBadgeX, topBadgeY, topBadgeW, topBadgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    if (mirrorAngle === 90) {
      ctx.fillStyle = '#10b981';
      ctx.fillText('α = 90°: Commutative! Rx·Ry = Ry·Rx = -I (Retroreflection v₂ = -v)', width / 2, topBadgeY + 18);
    } else {
      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`α = ${mirrorAngle}°: Non-Commutative! Rα·Rx ≠ Rx·Rα (Exits Diverge by ${Math.abs(4 * mirrorAngle) % 360}°)`, width / 2, topBadgeY + 18);
    }
    ctx.restore();
  }, [activeTab, retroVx, retroVy, reflectionOrder, mirrorAngle, animTime]);

  // Calculations for display
  const vecAngleDeg = (Math.atan2(vecDy, vecDx) * (180 / Math.PI)).toFixed(1);
  const vecMagnitude = Math.hypot(vecDx, vecDy).toFixed(2);

  // Rotation Matrix values (Tab 3)
  const thetaRad = (rotAngle * Math.PI) / 180;
  const cosT = Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);
  const rotDx = cosT * baseDx - sinT * baseDy;
  const rotDy = sinT * baseDx + cosT * baseDy;

  // Successive Reflections Matrix Calculations (Tab 4)
  const alphaRadVal = (mirrorAngle * Math.PI) / 180;
  const twoAlphaRadVal = 2 * alphaRadVal;
  const cos2A = Math.cos(twoAlphaRadVal);
  const sin2A = Math.sin(twoAlphaRadVal);
  // Order A (M1 then M2): R_alpha * R_x = Rot(+2alpha)
  const vOutAx = cos2A * retroVx - sin2A * retroVy;
  const vOutAy = sin2A * retroVx + cos2A * retroVy;
  // Order B (M2 then M1): R_x * R_alpha = Rot(-2alpha)
  const vOutBx = cos2A * retroVx + sin2A * retroVy;
  const vOutBy = -sin2A * retroVx + cos2A * retroVy;

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
          formalize specular mirror reflection ($R^2 = I$), explore normal incidence ($i = 0^\circ \implies r = 0^\circ$, path retracing),
          rotate light beams via $R(\theta)$, and uncover when successive reflections commute ($90^\circ$ retroreflection: $R_y R_x = R_x R_y = -I$)
          versus when they do not ($R_x R_\alpha \neq R_\alpha R_x$ for other angles $\alpha$).
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
                    <span className="text-amber-400 font-bold">
                      {incDx.toFixed(1)} {incDx === 0 ? '(Normal Incidence: i = 0°)' : ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="0.1"
                    value={incDx}
                    onChange={e => setIncDx(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>0.0 (Normal i=0°)</span>
                    <span>1.0</span>
                    <span>2.0</span>
                    <span>3.0</span>
                    <span>4.0</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">Incident dy (Downward toward mirror):</span>
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

              {/* Angle Presets including Normal Incidence (i = 0) */}
              <div className="pt-1">
                <span className="text-xs font-semibold text-zinc-400 block mb-2">Preset Angles of Incidence:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Normal: i = 0° (Retraces Path)', dx: 0, dy: -2 },
                    { label: '30° Incidence', dx: 1.15, dy: -2 },
                    { label: '45° Incidence', dx: 2, dy: -2 },
                    { label: '60° Incidence', dx: 3.46, dy: -2 },
                    { label: 'Grazing: ~70°', dx: 4, dy: -1.5 }
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setIncDx(p.dx);
                        setIncDy(p.dy);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                        Math.abs(incDx - p.dx) < 0.05 && Math.abs(incDy - p.dy) < 0.05
                          ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300 font-bold shadow-sm'
                          : 'bg-white/5 border-white/10 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matrix Formulation Display */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-xs text-zinc-400">Matrix Transformation:</div>
                <div className="font-mono text-xs sm:text-sm text-cyan-300 text-center py-1">
                  [dx', dy']^T = [1, 0; 0, -1] · [{incDx.toFixed(1)}, {incDy.toFixed(1)}]^T
                </div>
                <div className="font-mono text-xs sm:text-sm text-emerald-400 font-bold text-center">
                  Result: [{incDx.toFixed(1)}, {(-incDy).toFixed(1)}]^T {incDx === 0 ? '= -d (Path Reversal)' : ''}
                </div>

                {incDx === 0 ? (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                    <strong className="text-amber-300 flex items-center gap-1.5 mb-1">
                      <Sparkles size={13} />
                      Normal Incidence Special Case (i = 0°):
                    </strong>
                    The incident ray travels directly along the surface normal n̂.
                    Multiplying by R_x gives [0, {-incDy}]^T = -d. The reflected ray reflects directly back along the same path (r = 0°).
                    The angle of deviation is δ = 180° - 2(0°) = 180° (complete path retracing).
                  </div>
                ) : null}
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
                  a: (
                    <div>
                      <p>
                        When incident angle is zero ($i = 0^\circ$), the ray strikes perpendicular to the mirror along the normal line ($dx = 0, dy = -2$).
                        Multiplying by $R_x$:
                      </p>
                      <div className="font-mono text-[11px] my-1.5 p-1.5 rounded bg-black/40 text-cyan-300">
                        [1, 0; 0, -1] · [0, -2]^T = [0, 2]^T = -d
                      </div>
                      <p>
                        The ray reflects straight back along the normal line ($r = 0^\circ$, angle of deviation $\delta = 180^\circ$), retracing its exact trajectory!
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIncDx(0);
                          setIncDy(-2);
                        }}
                        className="mt-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Zap size={12} />
                        Simulate i = 0° (Normal Incidence)
                      </button>
                    </div>
                  )
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
      {/* SECTION 4: TWO SUCCESSIVE REFLECTIONS & NON-COMMUTATIVITY */}
      {/* ========================================================================= */}
      {activeTab === 'successive' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Non-Commutativity Breakdown */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-level-2 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Repeat size={17} className="text-cyan-400" />
                  Successive Reflections &amp; Order
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono border ${
                    mirrorAngle === 90
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {mirrorAngle === 90 ? 'Rx · Ry = Ry · Rx = -I' : 'Rx · Rα ≠ Rα · Rx'}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                When light reflects successively from two mirrors inclined at angle α, the combined operation
                is a <strong>pure rotation of 2α</strong>.
                At α = 90°, reflections commute (v₂ = -v, retroreflection).
                For any other angle α, <strong>order matters</strong>: R_x · R_α ≠ R_α · R_x!
              </p>

              {/* Mirror Angle α Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">Angle Between Mirrors (α):</span>
                  <span
                    className={`font-bold ${
                      mirrorAngle === 90 ? 'text-emerald-400' : 'text-cyan-400'
                    }`}
                  >
                    {mirrorAngle}° {mirrorAngle === 90 ? '(Perpendicular: Commutative)' : '(Non-Commutative)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="120"
                  step="1"
                  value={mirrorAngle}
                  onChange={e => setMirrorAngle(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>30°</span>
                  <span>45°</span>
                  <span>60°</span>
                  <span className="text-emerald-400 font-bold">90° (Retro)</span>
                  <span>120°</span>
                </div>
              </div>

              {/* Angle Presets */}
              <div>
                <span className="text-xs font-semibold text-zinc-400 block mb-2">Mirror Angle Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '90° (Perpendicular / Retroreflector)', deg: 90, note: 'Commutative' },
                    { label: '60° (Kaleidoscope Angle)', deg: 60, note: 'Non-Commutative' },
                    { label: '45° (Octant Reflector)', deg: 45, note: 'Non-Commutative' },
                    { label: '30° (Narrow Wedge)', deg: 30, note: 'Non-Commutative' },
                    { label: '75° (Oblique Angle)', deg: 75, note: 'Non-Commutative' },
                    { label: '120° (Obtuse Angle)', deg: 120, note: 'Non-Commutative' }
                  ].map(p => (
                    <button
                      key={p.deg}
                      type="button"
                      onClick={() => setMirrorAngle(p.deg)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                        mirrorAngle === p.deg
                          ? p.deg === 90
                            ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300 font-bold'
                            : 'bg-cyan-500/25 border-cyan-500/50 text-cyan-300 font-bold'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order of Operations Switcher */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-zinc-300 block">Reflection Order:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReflectionOrder('xThenY')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-medium border transition-all cursor-pointer text-center ${
                      reflectionOrder === 'xThenY'
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    1st: M1 (Rx)<br />2nd: M2 (Rα)<br />
                    <span className="text-[10px] text-cyan-400/80">Rot(+{2 * mirrorAngle}°)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReflectionOrder('yThenX')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-medium border transition-all cursor-pointer text-center ${
                      reflectionOrder === 'yThenX'
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-semibold'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    1st: M2 (Rα)<br />2nd: M1 (Rx)<br />
                    <span className="text-[10px] text-purple-400/80">Rot(-{2 * mirrorAngle}°)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReflectionOrder('compare')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-medium border transition-all cursor-pointer text-center ${
                      reflectionOrder === 'compare'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold shadow-sm'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Compare Both<br />Simultaneously<br />
                    <span className="text-[10px] text-amber-400/80">Rx·Rα vs Rα·Rx</span>
                  </button>
                </div>
              </div>

              {/* Matrix Product Derivation & Non-Commutativity Proof */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 font-mono text-xs">
                <span className="text-zinc-400 font-sans block text-xs font-semibold">
                  Matrix Algebra: R_α and R_x
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="text-zinc-400 font-sans block text-[10px]">Mirror 1 (x-axis, 0°):</span>
                    <strong className="text-amber-300">R_x = [1, 0; 0, -1]</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="text-zinc-400 font-sans block text-[10px]">
                      Mirror 2 ({mirrorAngle}°):
                    </span>
                    <strong className="text-purple-300">
                      R_α = [{cos2A.toFixed(2)}, {sin2A.toFixed(2)}; {sin2A.toFixed(2)}, {(-cos2A).toFixed(2)}]
                    </strong>
                  </div>
                </div>

                {/* Evaluated Composite Matrix Products */}
                <div className="space-y-1.5 pt-1 border-t border-white/10">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-200">
                    <div>
                      <span className="font-bold">Order A (R_α · R_x):</span>
                      <div className="text-[10px] text-cyan-300/80">
                        = [{cos2A.toFixed(2)}, {(-sin2A).toFixed(2)}; {sin2A.toFixed(2)}, {cos2A.toFixed(2)}] = Rot(+{2 * mirrorAngle}°)
                      </div>
                    </div>
                    <span className="text-xs font-bold text-cyan-300">
                      v_out = [{vOutAx.toFixed(1)}, {vOutAy.toFixed(1)}]^T
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-950/30 border border-purple-500/30 text-purple-200">
                    <div>
                      <span className="font-bold">Order B (R_x · R_α):</span>
                      <div className="text-[10px] text-purple-300/80">
                        = [{cos2A.toFixed(2)}, {sin2A.toFixed(2)}; {(-sin2A).toFixed(2)}, {cos2A.toFixed(2)}] = Rot(-{2 * mirrorAngle}°)
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-300">
                      v_out = [{vOutBx.toFixed(1)}, {vOutBy.toFixed(1)}]^T
                    </span>
                  </div>
                </div>

                {/* Commutator Verdict */}
                {mirrorAngle === 90 ? (
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 font-sans leading-relaxed">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono text-xs">
                      <CheckCircle2 size={14} />
                      Commutative Case: R_x · R_y = R_y · R_x = -I
                    </div>
                    <p className="text-[11px] text-emerald-300/90 mt-1">
                      Because +180° ≡ -180°, both orders yield the exact same inverted vector -v.
                      The two reflection matrices commute at 90°!
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 font-sans leading-relaxed">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5 font-mono text-xs">
                      <Info size={14} />
                      Non-Commutative: R_x · R_α ≠ R_α · R_x !
                    </div>
                    <div className="font-mono text-[11px] text-rose-200 mt-1">
                      Commutator [R_x, R_α] = [0, {(2 * sin2A).toFixed(3)}; {(-2 * sin2A).toFixed(3)}, 0] ≠ 0
                    </div>
                    <p className="text-[11px] text-rose-300/90 mt-1">
                      Notice the off-diagonal signs flip! Order A rotates the ray by +{2 * mirrorAngle}°,
                      while Order B rotates the ray by -{2 * mirrorAngle}°.
                      Matrix multiplication is <strong>not commutative</strong>: reflection order directly changes where the ray exits!
                    </p>
                  </div>
                )}
              </div>

              {/* Physical Insight Card */}
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-2 text-xs text-zinc-300 leading-relaxed">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Why does order matter for angles other than 90°?
                </div>
                <p>
                  Successive reflections across two plane mirrors separated by angle α create a net rotation
                  of 2α.
                  In 2D planar geometry, rotation by +2α is equal to rotation by -2α if and only if
                  2α ≡ -2α (mod 360°) ⇔ 4α = 360° ⇔ α = 90°.
                  For all other angles α (such as 30°, 45°, 60°), R_x · R_α ≠ R_α · R_x!
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Multi-Angle Canvas Column */}
          <div className="lg:col-span-7">
            <div className="glass-level-2 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-semibold text-zinc-400">
                  {mirrorAngle === 90
                    ? 'Perpendicular 90° Corner Reflector (Retroreflector)'
                    : `Inclined Two-Mirror System (α = ${mirrorAngle}°)`}
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    mirrorAngle === 90 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {mirrorAngle === 90 ? 'Commutative: v₂ = -v' : 'Non-Commutative: R₁R₂ ≠ R₂R₁'}
                </span>
              </div>
              <canvas
                ref={successiveCanvasRef}
                width={560}
                height={400}
                className="w-full max-w-[560px] h-auto rounded-xl bg-slate-950/80 border border-white/5 shadow-inner"
              />

              {/* Dynamic Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
                {reflectionOrder === 'compare' ? (
                  <>
                    <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                      Order A (M1 then M2): Rot(+{2 * mirrorAngle}°)
                    </span>
                    <span className="flex items-center gap-1.5 text-fuchsia-300 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 inline-block" />
                      Order B (M2 then M1): Rot(-{2 * mirrorAngle}°)
                    </span>
                    <span className="text-zinc-400 text-[11px] block w-full text-center mt-1">
                      {mirrorAngle === 90
                        ? 'At 90°, both exit rays are parallel (-v)!'
                        : `At ${mirrorAngle}°, both exit rays diverge by ${Math.abs(4 * mirrorAngle) % 360}°!`}
                    </span>
                  </>
                ) : reflectionOrder === 'xThenY' ? (
                  <>
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      Incident Beam (v)
                    </span>
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                      Inter-Mirror Bounce
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                      Exit A (Rot +{2 * mirrorAngle}°)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      Incident Beam (v)
                    </span>
                    <span className="flex items-center gap-1.5 text-purple-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
                      Inter-Mirror Bounce
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                      Exit B (Rot -{2 * mirrorAngle}°)
                    </span>
                  </>
                )}
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
