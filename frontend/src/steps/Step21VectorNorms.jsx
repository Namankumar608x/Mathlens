import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Maximize2,
  Layers,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Info,
  AlertTriangle,
  Sliders,
  Grid,
  Compass,
  Check,
  X,
  Activity,
  ArrowRight,
  Eye,
  HelpCircle,
  ShieldCheck,
  Zap,
  Target
} from 'lucide-react';
import StepFooter from '../components/layout/StepFooter';
import ModuleDocumentation from '../components/experiment/ModuleDocumentation';
import {
  CANDIDATE_FUNCTIONS,
  IMAGE_ERROR_PRESETS,
  computeImageDiff,
  l1Norm,
  l2Norm,
  lInfNorm,
  lpNorm
} from '../core/math/vectorNorms';

export default function Step21VectorNorms({ onSelectStep }) {
  // Navigation Tabs:
  // 1: 'vector-length'      (Module 1: What is length? Vector dragging & doubling)
  // 2: 'candidate-axioms'   (Step 2: 3 Norm Axioms, 6 Candidates, Contours & Counterexamples)
  // 3: 'unit-balls'         (Step 3: L1 Diamond, L2 Circle, Linf Square derivations & probe)
  // 4: 'image-difference'   (Activity: 3x3 Image changes, Concentrated vs Distributed errors)
  // 5: 'applications'       (Real-world applications: LASSO, JPEG PSNR, Adversarial Linf)
  const [activeTab, setActiveTab] = useState('vector-length');

  // Detect Theme (Light vs Dark)
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme') || 'dark'
      : 'dark'
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
  // TAB 1: VECTOR LENGTH & DRAGGING (MODULE 1)
  // Vector v = [vx, vy], default [3, 4] -> ||v||2 = 5
  // =========================================================================
  const [vx, setVx] = useState(3);
  const [vy, setVy] = useState(4);
  const [isDouble, setIsDouble] = useState(false);
  const [isDraggingT1, setIsDraggingT1] = useState(false);
  const canvasT1Ref = useRef(null);

  const currentVector = useMemo(() => {
    const mult = isDouble ? 2 : 1;
    return [vx * mult, vy * mult];
  }, [vx, vy, isDouble]);

  const lengthL2 = useMemo(() => l2Norm(currentVector), [currentVector]);
  const lengthL1 = useMemo(() => l1Norm(currentVector), [currentVector]);
  const lengthLInf = useMemo(() => lInfNorm(currentVector), [currentVector]);

  // Canvas drawing for Tab 1
  useEffect(() => {
    const canvas = canvasT1Ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Coordinate system: range from -10 to 10
    const scale = width / 20;
    const originX = width / 2;
    const originY = height / 2;

    const toCanvasX = (x) => originX + x * scale;
    const toCanvasY = (y) => originY - y * scale;

    // Grid lines
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(i), 0);
      ctx.lineTo(toCanvasX(i), height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(i));
      ctx.lineTo(width, toCanvasY(i));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Axis labels & numbers
    ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.45)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let i = -8; i <= 8; i += 2) {
      if (i !== 0) {
        ctx.fillText(i.toString(), toCanvasX(i), originY + 14);
        ctx.fillText(i.toString(), originX - 12, toCanvasY(i) + 4);
      }
    }

    const curX = currentVector[0];
    const curY = currentVector[1];
    const ptX = toCanvasX(curX);
    const ptY = toCanvasY(curY);

    // Right-angle triangle projections (Pythagoras helper)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = isLight ? 'rgba(197, 155, 103, 0.55)' : 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1.2;

    // Projection along x-axis to (curX, 0)
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(ptX, originY);
    ctx.stroke();

    // Projection from (curX, 0) up to (curX, curY)
    ctx.beginPath();
    ctx.moveTo(ptX, originY);
    ctx.lineTo(ptX, ptY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Right angle symbol
    if (Math.abs(curX) > 0.5 && Math.abs(curY) > 0.5) {
      const signX = curX >= 0 ? -1 : 1;
      const signY = curY >= 0 ? 1 : -1;
      const boxSize = 8;
      ctx.beginPath();
      ctx.moveTo(ptX + signX * boxSize, originY);
      ctx.lineTo(ptX + signX * boxSize, originY + signY * boxSize);
      ctx.lineTo(ptX, originY + signY * boxSize);
      ctx.stroke();
    }

    // Main Vector Arrow
    ctx.strokeStyle = '#3B82F6';
    ctx.fillStyle = '#3B82F6';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(ptX, ptY);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(originY - ptY, ptX - originX);
    const headLen = 10;
    ctx.beginPath();
    ctx.moveTo(ptX, ptY);
    ctx.lineTo(
      ptX - headLen * Math.cos(angle - Math.PI / 7),
      ptY + headLen * Math.sin(angle - Math.PI / 7)
    );
    ctx.lineTo(
      ptX - headLen * Math.cos(angle + Math.PI / 7),
      ptY + headLen * Math.sin(angle + Math.PI / 7)
    );
    ctx.closePath();
    ctx.fill();

    // Endpoint Draggable Handle
    ctx.beginPath();
    ctx.arc(ptX, ptY, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--accent-primary, #C59B67)';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vector coordinate label
    ctx.fillStyle = isLight ? '#1F2937' : '#F9FAFB';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = curX >= 0 ? 'left' : 'right';
    const offsetX = curX >= 0 ? 12 : -12;
    ctx.fillText(`v = [${curX.toFixed(1)}, ${curY.toFixed(1)}]ᵀ`, ptX + offsetX, ptY - 8);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#3B82F6';
    ctx.fillText(`‖v‖₂ = ${lengthL2.toFixed(2)}`, ptX + offsetX, ptY + 8);
  }, [currentVector, lengthL2, isLight]);

  // Tab 1 Canvas Mouse/Touch Drag Handlers
  const handleCanvasT1Down = (e) => {
    setIsDraggingT1(true);
    handleCanvasT1Move(e);
  };

  const handleCanvasT1Move = (e) => {
    if (!isDraggingT1 && e.type !== 'mousedown') return;
    const canvas = canvasT1Ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;

    const xPos = clientX - rect.left;
    const yPos = clientY - rect.top;

    const scale = canvas.width / 20;
    const originX = canvas.width / 2;
    const originY = canvas.height / 2;

    let newX = (xPos - originX) / scale;
    let newY = (originY - yPos) / scale;

    // Clamp between -9.5 and 9.5
    newX = Math.max(-9.5, Math.min(9.5, newX));
    newY = Math.max(-9.5, Math.min(9.5, newY));

    // Snap to 0.5 increments if close
    if (Math.abs(newX - Math.round(newX)) < 0.2) newX = Math.round(newX);
    if (Math.abs(newY - Math.round(newY)) < 0.2) newY = Math.round(newY);

    if (isDouble) {
      setVx(parseFloat((newX / 2).toFixed(1)));
      setVy(parseFloat((newY / 2).toFixed(1)));
    } else {
      setVx(parseFloat(newX.toFixed(1)));
      setVy(parseFloat(newY.toFixed(1)));
    }
  };

  const handleCanvasT1Up = () => {
    setIsDraggingT1(false);
  };

  // =========================================================================
  // TAB 2: 3 NORM PROPERTIES & 6 CANDIDATE FUNCTIONS
  // =========================================================================
  const [selectedCandidateId, setSelectedCandidateId] = useState('l2');
  const [showCounterExample, setShowCounterExample] = useState(true);
  const canvasT2Ref = useRef(null);

  const currentCandidate = useMemo(() => {
    return (
      CANDIDATE_FUNCTIONS.find((c) => c.id === selectedCandidateId) ||
      CANDIDATE_FUNCTIONS[0]
    );
  }, [selectedCandidateId]);

  // Draw contour N(x, y) = 1 for the selected candidate function
  useEffect(() => {
    const canvas = canvasT2Ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const scale = width / 6; // range -3 to 3
    const originX = width / 2;
    const originY = height / 2;

    const toX = (x) => originX + x * scale;
    const toY = (y) => originY - y * scale;

    // Grid
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(toX(i), 0);
      ctx.lineTo(toX(i), height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, toY(i));
      ctx.lineTo(width, toY(i));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Axis tick numbers
    ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.45)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let i = -2; i <= 2; i++) {
      if (i !== 0) {
        ctx.fillText(i.toString(), toX(i), originY + 13);
        ctx.fillText(i.toString(), originX - 10, toY(i) + 4);
      }
    }

    // Render Level Curve N(x, y) = 1
    const candId = currentCandidate.id;
    ctx.lineWidth = 2.5;

    if (currentCandidate.isValidNorm) {
      ctx.strokeStyle = '#10B981';
      ctx.fillStyle = isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.18)';
    } else {
      ctx.strokeStyle = '#EF4444';
      ctx.fillStyle = isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.14)';
    }

    ctx.beginPath();

    if (candId === 'l2') {
      // Circle radius 1
      ctx.arc(originX, originY, 1 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (candId === 'l1') {
      // Diamond with vertices (1,0), (0,1), (-1,0), (0,-1)
      ctx.moveTo(toX(1), toY(0));
      ctx.lineTo(toX(0), toY(1));
      ctx.lineTo(toX(-1), toY(0));
      ctx.lineTo(toX(0), toY(-1));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (candId === 'linf') {
      // Square with vertices (1,1), (-1,1), (-1,-1), (1,-1)
      ctx.rect(toX(-1), toY(1), 2 * scale, 2 * scale);
      ctx.fill();
      ctx.stroke();
    } else if (candId === 'sumSq') {
      // x^2 + y^2 = 1 (identical curve to circle, but not a norm!)
      ctx.arc(originX, originY, 1 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (candId === 'absSum') {
      // |x + y| = 1 -> two parallel lines: x + y = 1 and x + y = -1
      // Line 1: y = 1 - x
      ctx.moveTo(toX(-3), toY(4));
      ctx.lineTo(toX(4), toY(-3));
      ctx.stroke();

      // Line 2: y = -1 - x
      ctx.beginPath();
      ctx.moveTo(toX(-4), toY(3));
      ctx.lineTo(toX(3), toY(-4));
      ctx.stroke();

      // Shaded stripe between lines |x + y| <= 1
      ctx.beginPath();
      ctx.moveTo(toX(-3), toY(4));
      ctx.lineTo(toX(4), toY(-3));
      ctx.lineTo(toX(3), toY(-4));
      ctx.lineTo(toX(-4), toY(3));
      ctx.closePath();
      ctx.fill();
    } else if (candId === 'prod') {
      // |xy| = 1 -> four hyperbola branches: y = 1/x and y = -1/x
      const drawHyperbola = (sign) => {
        ctx.beginPath();
        let started = false;
        for (let x = -3; x <= 3; x += 0.05) {
          if (Math.abs(x) < 0.25) continue;
          const y = (sign * 1) / x;
          if (Math.abs(y) > 3.2) continue;
          if (!started) {
            ctx.moveTo(toX(x), toY(y));
            started = true;
          } else {
            ctx.lineTo(toX(x), toY(y));
          }
        }
        ctx.stroke();
      };
      drawHyperbola(1);
      drawHyperbola(-1);
    }

    // Label on curve
    ctx.fillStyle = currentCandidate.isValidNorm ? '#10B981' : '#EF4444';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Level Curve: N(x, y) = 1`, 12, 20);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
    ctx.fillText(`Shape: ${currentCandidate.shape}`, 12, 36);
  }, [currentCandidate, isLight]);

  // =========================================================================
  // TAB 3: UNIT BALLS (L1 DIAMOND, L2 CIRCLE, L_INF SQUARE)
  // =========================================================================
  const [ballMode, setBallMode] = useState('all'); // 'all' | 'l1' | 'l2' | 'linf'
  const [probeX, setProbeX] = useState(0.8);
  const [probeY, setProbeY] = useState(0.6);
  const [pSlider, setPSlider] = useState(2); // Generalized Lp slider
  const canvasT3Ref = useRef(null);

  const probeVec = useMemo(() => [probeX, probeY], [probeX, probeY]);
  const probeL1 = useMemo(() => l1Norm(probeVec), [probeVec]);
  const probeL2 = useMemo(() => l2Norm(probeVec), [probeVec]);
  const probeLInf = useMemo(() => lInfNorm(probeVec), [probeVec]);
  const probeLp = useMemo(() => lpNorm(probeVec, pSlider), [probeVec, pSlider]);

  // Canvas drawing for Tab 3 Unit Balls
  useEffect(() => {
    const canvas = canvasT3Ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const scale = width / 4.4; // Range -2.2 to 2.2
    const originX = width / 2;
    const originY = height / 2;

    const toX = (x) => originX + x * scale;
    const toY = (y) => originY - y * scale;

    // Grid
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(toX(i), 0);
      ctx.lineTo(toX(i), height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, toY(i));
      ctx.lineTo(width, toY(i));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Axis ticks
    ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.45)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let i = -2; i <= 2; i++) {
      if (i !== 0) {
        ctx.fillText(i.toString(), toX(i), originY + 13);
        ctx.fillText(i.toString(), originX - 10, toY(i) + 4);
      }
    }

    // Helper: Draw Unit Ball Shapes
    // 1. Linf Square: [-1, 1] x [-1, 1]
    if (ballMode === 'all' || ballMode === 'linf') {
      ctx.fillStyle = isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.16)';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = ballMode === 'linf' ? 2.5 : 1.8;
      ctx.beginPath();
      ctx.rect(toX(-1), toY(1), 2 * scale, 2 * scale);
      ctx.fill();
      ctx.stroke();
    }

    // 2. L2 Circle: x^2 + y^2 <= 1
    if (ballMode === 'all' || ballMode === 'l2') {
      ctx.fillStyle = isLight ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.22)';
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = ballMode === 'l2' ? 2.5 : 1.8;
      ctx.beginPath();
      ctx.arc(originX, originY, 1 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 3. L1 Diamond: |x| + |y| <= 1
    if (ballMode === 'all' || ballMode === 'l1') {
      ctx.fillStyle = isLight ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.26)';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = ballMode === 'l1' ? 2.5 : 2;
      ctx.beginPath();
      ctx.moveTo(toX(1), toY(0));
      ctx.lineTo(toX(0), toY(1));
      ctx.lineTo(toX(-1), toY(0));
      ctx.lineTo(toX(0), toY(-1));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4. Generalized Lp contour if in single mode
    if (ballMode === 'lp') {
      ctx.fillStyle = 'rgba(197, 155, 103, 0.2)';
      ctx.strokeStyle = 'var(--accent-primary, #C59B67)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const numSteps = 180;
      for (let s = 0; s <= numSteps; s++) {
        const theta = (s / numSteps) * 2 * Math.PI;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        // r(theta) = ( |cos|^p + |sin|^p )^(-1/p)
        const denom = Math.pow(Math.abs(cosT), pSlider) + Math.pow(Math.abs(sinT), pSlider);
        const r = Math.pow(denom, -1 / pSlider);
        const px = r * cosT;
        const py = r * sinT;
        if (s === 0) ctx.moveTo(toX(px), toY(py));
        else ctx.lineTo(toX(px), toY(py));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Draggable Probe Point
    const pCanvasX = toX(probeX);
    const pCanvasY = toY(probeY);

    // Vector line from origin to probe
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(pCanvasX, pCanvasY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Probe point circle
    ctx.beginPath();
    ctx.arc(pCanvasX, pCanvasY, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--accent-primary, #C59B67)';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Probe text
    ctx.fillStyle = isLight ? '#111827' : '#F9FAFB';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = probeX >= 0 ? 'left' : 'right';
    const offsetPX = probeX >= 0 ? 10 : -10;
    ctx.fillText(`P(${probeX.toFixed(2)}, ${probeY.toFixed(2)})`, pCanvasX + offsetPX, pCanvasY - 6);
  }, [ballMode, probeX, probeY, pSlider, isLight]);

  // Tab 3 canvas dragging handler for probe
  const [isDraggingProbe, setIsDraggingProbe] = useState(false);
  const handleProbeCanvasMove = (e) => {
    if (!isDraggingProbe && e.type !== 'mousedown') return;
    const canvas = canvasT3Ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;

    const scale = canvas.width / 4.4;
    const originX = canvas.width / 2;
    const originY = canvas.height / 2;

    let nx = (clientX - rect.left - originX) / scale;
    let ny = (originY - (clientY - rect.top)) / scale;

    nx = Math.max(-2, Math.min(2, nx));
    ny = Math.max(-2, Math.min(2, ny));

    setProbeX(parseFloat(nx.toFixed(2)));
    setProbeY(parseFloat(ny.toFixed(2)));
  };

  // =========================================================================
  // TAB 4: 3X3 IMAGE DIFFERENCE ACTIVITY
  // Baseline original image: 3x3 with all 40s
  // =========================================================================
  const originalImage = useMemo(() => [
    [40, 40, 40],
    [40, 40, 40],
    [40, 40, 40]
  ], []);

  const [activePresetId, setActivePresetId] = useState('large');
  const [modifiedImage, setModifiedImage] = useState(() => {
    return IMAGE_ERROR_PRESETS[0].apply();
  });

  const handleSelectPreset = (preset) => {
    setActivePresetId(preset.id);
    setModifiedImage(preset.apply());
  };

  // Modify individual cell manually
  const handleCellChange = (r, c, val) => {
    const num = Math.max(0, Math.min(255, parseInt(val, 10) || 0));
    setModifiedImage((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = num;
      return next;
    });
    setActivePresetId('custom');
  };

  const imageDiffResults = useMemo(() => {
    return computeImageDiff(originalImage, modifiedImage);
  }, [originalImage, modifiedImage]);

  const currentPresetMeta = useMemo(() => {
    return IMAGE_ERROR_PRESETS.find((p) => p.id === activePresetId) || {
      id: 'custom',
      label: 'Custom User Edits',
      badge: 'Interactive Sandbox',
      description: 'You modified pixels directly. Observe real-time changes across L1, L2, and Linf norms below.',
      expected: null
    };
  }, [activePresetId]);

  return (
    <div className="math-step-view" style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.25rem 1rem' }}>
      {/* 1. STANDARDIZED HEADER */}
      <div className="step-header-box" style={{ marginBottom: '1rem', padding: '0.95rem 1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <h2 className="step-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Maximize2 size={22} style={{ color: 'var(--accent-primary, #C59B67)' }} />
            <span>Vector Norms — What is Length &amp; Measuring Image Distance</span>
          </h2>
          <span className="badge-tag-mini" style={{ fontSize: '0.74rem', padding: '0.18rem 0.55rem' }}>
            Module: Vector Norms
          </span>
        </div>

        <p className="step-description" style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
          <strong>Central Question:</strong> How do we measure the size of a vector or the difference between two images?
          Explore Euclidean length, the 3 foundational norm axioms, geometric unit balls (diamond $L_1$, circle $L_2$, square $L_\infty$),
          and discover why different norms distinguish between concentrated and distributed image defects.
        </p>

        {/* 5 SUB-CHAPTER NAVIGATION TABS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('vector-length')}
            className={`sub-chapter-pill ${activeTab === 'vector-length' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Compass size={14} />
            <span>1. What is Length?</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('candidate-axioms')}
            className={`sub-chapter-pill ${activeTab === 'candidate-axioms' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ShieldCheck size={14} />
            <span>2. The 3 Norm Axioms</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unit-balls')}
            className={`sub-chapter-pill ${activeTab === 'unit-balls' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Grid size={14} />
            <span>3. Unit Balls (L₁, L₂, L_∞)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image-difference')}
            className={`sub-chapter-pill ${activeTab === 'image-difference' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Activity size={14} />
            <span>4. Image Difference Lab</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`sub-chapter-pill ${activeTab === 'applications' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.32rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Zap size={14} />
            <span>5. Applications &amp; Insights</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: WHAT IS THE LENGTH OF A VECTOR? (MODULE 1) */}
      {/* ========================================================================= */}
      {activeTab === 'vector-length' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.15fr) minmax(320px, 1fr)', gap: '1rem', alignItems: 'start' }}>
          {/* Left Column: Interactive Vector Canvas */}
          <div className="card-glass" style={{ padding: '1rem', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={17} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Interactive Coordinate Plane</span>
              </div>
              <span className="badge-tag-mini" style={{ fontSize: '0.72rem' }}>Drag Vector Head</span>
            </div>

            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <canvas
                ref={canvasT1Ref}
                width={380}
                height={380}
                onMouseDown={handleCanvasT1Down}
                onMouseMove={handleCanvasT1Move}
                onMouseUp={handleCanvasT1Up}
                onTouchStart={handleCanvasT1Down}
                onTouchMove={handleCanvasT1Move}
                onTouchEnd={handleCanvasT1Up}
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  aspectRatio: '1/1',
                  background: isLight ? '#F8FAFC' : '#0B0F17',
                  borderRadius: 10,
                  border: '1px solid var(--border-color)',
                  cursor: isDraggingT1 ? 'grabbing' : 'grab',
                  touchAction: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={() => { setVx(3); setVy(4); setIsDouble(false); }}
                style={{ fontSize: '0.74rem', padding: '0.22rem 0.55rem' }}
              >
                Default [3, 4]ᵀ
              </button>
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={() => { setVx(1); setVy(1); setIsDouble(false); }}
                style={{ fontSize: '0.74rem', padding: '0.22rem 0.55rem' }}
              >
                Diagonal [1, 1]ᵀ
              </button>
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={() => { setVx(-4); setVy(3); setIsDouble(false); }}
                style={{ fontSize: '0.74rem', padding: '0.22rem 0.55rem' }}
              >
                Quadrant II [-4, 3]ᵀ
              </button>
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={() => { setVx(0); setVy(5); setIsDouble(false); }}
                style={{ fontSize: '0.74rem', padding: '0.22rem 0.55rem' }}
              >
                Axis [0, 5]ᵀ
              </button>
            </div>
          </div>

          {/* Right Column: Mathematical Readout & Inquiry */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Vector Component Card */}
            <div className="card-glass" style={{ padding: '1rem', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>Vector Definition &amp; Components</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#3B82F6', fontWeight: 600 }}>
                  v = [{currentVector[0].toFixed(1)}, {currentVector[1].toFixed(1)}]ᵀ
                </span>
              </div>

              {/* Sliders for Direct Vector Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                    <span>Horizontal Component (x)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{vx.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="0.5"
                    value={vx}
                    onChange={(e) => setVx(parseFloat(e.target.value))}
                    className="step-range-input"
                    style={{ width: '100%', '--slider-pct': `${((vx + 8) / 16) * 100}%` }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                    <span>Vertical Component (y)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{vy.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="0.5"
                    value={vy}
                    onChange={(e) => setVy(parseFloat(e.target.value))}
                    className="step-range-input"
                    style={{ width: '100%', '--slider-pct': `${((vy + 8) / 16) * 100}%` }}
                  />
                </div>
              </div>

              {/* Euclidean Formula Calculation */}
              <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-primary, #C59B67)', marginBottom: '0.3rem' }}>
                  Euclidean Length Formula (L₂):
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  ‖v‖₂ = √(x² + y²) = √({currentVector[0].toFixed(1)}² + {currentVector[1].toFixed(1)}²)
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: '#3B82F6', marginTop: '0.35rem' }}>
                  ‖v‖₂ = {lengthL2.toFixed(3)}
                </div>
              </div>
            </div>

            {/* The Curricular Doubling Inquiry Card */}
            <div className="card-glass" style={{ padding: '1rem', borderRadius: 12, borderLeft: '4px solid #3B82F6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#3B82F6' }}>
                  Core Inquiry: What Happens if We Double Both Components?
                </span>
                <button
                  type="button"
                  onClick={() => setIsDouble(!isDouble)}
                  className={`btn-secondary-sm ${isDouble ? 'active' : ''}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.28rem 0.7rem',
                    background: isDouble ? '#3B82F6' : undefined,
                    color: isDouble ? '#FFFFFF' : undefined,
                    borderColor: '#3B82F6'
                  }}
                >
                  {isDouble ? 'Reset to 1× v' : 'Test Double: 2× v'}
                </button>
              </div>

              <p style={{ fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
                {isDouble ? (
                  <span>
                    When components double from <strong>[{vx}, {vy}]ᵀ</strong> to <strong>[{vx * 2}, {vy * 2}]ᵀ</strong>,
                    the Euclidean length scales from <strong>{l2Norm([vx, vy]).toFixed(2)}</strong> to exactly <strong>{(l2Norm([vx, vy]) * 2).toFixed(2)}</strong>.
                    Length doubles linearly: ‖2v‖ = 2·‖v‖. This reflects the fundamental axiom of <strong>Homogeneity</strong>!
                  </span>
                ) : (
                  <span>
                    Click <strong>Test Double (2× v)</strong> to observe how scaling coordinates directly affects vector length.
                    Notice that doubling coordinates doubles the hypotenuse: √( (2x)² + (2y)² ) = √(4(x²+y²)) = 2·√(x²+y²).
                  </span>
                )}
              </p>
            </div>

            {/* Motivation Callout Card */}
            <div className="card-glass" style={{ padding: '0.9rem', borderRadius: 12, background: isLight ? 'rgba(197, 155, 103, 0.08)' : 'rgba(197, 155, 103, 0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                <HelpCircle size={16} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                  Is Euclidean Distance the Only Way to Measure Vector Size?
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', margin: 0, lineHeight: 1.5 }}>
                In everyday geometry, Euclidean distance is our natural instinct. But in image analysis, high-dimensional data science,
                and machine learning, other metrics like <strong>L₁ (Manhattan)</strong> and <strong>L_∞ (Chebyshev)</strong> provide
                vital advantages. This question motivates the mathematical definition of a <strong>Norm</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: 3 NORM AXIOMS & 6 CANDIDATE FUNCTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'candidate-axioms' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.15fr) minmax(320px, 1fr)', gap: '1rem', alignItems: 'start' }}>
          {/* Left Column: Candidate Selector & Level Curve Canvas */}
          <div className="card-glass" style={{ padding: '1rem', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Candidate Function Level Curve: N(x, y) = 1</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '0.18rem 0.55rem',
                  borderRadius: 12,
                  fontWeight: 600,
                  background: currentCandidate.isValidNorm ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: currentCandidate.isValidNorm ? '#10B981' : '#EF4444'
                }}
              >
                {currentCandidate.isValidNorm ? 'Valid Norm' : 'Fails Axioms'}
              </span>
            </div>

            {/* Candidate Function Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem', marginBottom: '0.85rem' }}>
              {CANDIDATE_FUNCTIONS.map((c) => {
                const isSelected = selectedCandidateId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCandidateId(c.id)}
                    style={{
                      padding: '0.45rem 0.5rem',
                      borderRadius: 8,
                      border: isSelected ? '1.5px solid var(--accent-primary, #C59B67)' : '1px solid var(--border-color)',
                      background: isSelected
                        ? isLight ? 'rgba(197, 155, 103, 0.15)' : 'rgba(197, 155, 103, 0.22)'
                        : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: c.isValidNorm ? '#10B981' : '#EF4444' }}>
                      {c.isValidNorm ? '✓ Norm' : '✗ Fails'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.formulaDisplay}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Canvas for Level Curve */}
            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <canvas
                ref={canvasT2Ref}
                width={360}
                height={360}
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  aspectRatio: '1/1',
                  background: isLight ? '#F8FAFC' : '#0B0F17',
                  borderRadius: 10,
                  border: '1px solid var(--border-color)'
                }}
              />
            </div>
          </div>

          {/* Right Column: 3 Axioms Checklist & Counterexample Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* The 3 Axioms Checklist */}
            <div className="card-glass" style={{ padding: '1rem', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>The 3 Axiomatic Norm Properties</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Rigorous Mathematical Test</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* Axiom 1: Positive Definiteness */}
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                    borderLeft: `4px solid ${currentCandidate.axioms.posDef.satisfied ? '#10B981' : '#EF4444'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.82rem' }}>
                      {currentCandidate.axioms.posDef.satisfied ? (
                        <Check size={15} style={{ color: '#10B981' }} />
                      ) : (
                        <X size={15} style={{ color: '#EF4444' }} />
                      )}
                      <span>1. Positive Definiteness</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>‖X‖ ≥ 0 &amp; ‖X‖ = 0 ⟺ X = 0</span>
                  </div>
                  <p style={{ fontSize: '0.77rem', margin: 0, lineHeight: 1.45 }}>
                    {currentCandidate.axioms.posDef.summary}
                  </p>
                </div>

                {/* Axiom 2: Homogeneity */}
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                    borderLeft: `4px solid ${currentCandidate.axioms.homogeneity.satisfied ? '#10B981' : '#EF4444'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.82rem' }}>
                      {currentCandidate.axioms.homogeneity.satisfied ? (
                        <Check size={15} style={{ color: '#10B981' }} />
                      ) : (
                        <X size={15} style={{ color: '#EF4444' }} />
                      )}
                      <span>2. Absolute Homogeneity</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>‖c·X‖ = |c|·‖X‖</span>
                  </div>
                  <p style={{ fontSize: '0.77rem', margin: 0, lineHeight: 1.45 }}>
                    {currentCandidate.axioms.homogeneity.summary}
                  </p>
                </div>

                {/* Axiom 3: Triangle Inequality */}
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                    borderLeft: `4px solid ${currentCandidate.axioms.triangle.satisfied ? '#10B981' : '#EF4444'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.82rem' }}>
                      {currentCandidate.axioms.triangle.satisfied ? (
                        <Check size={15} style={{ color: '#10B981' }} />
                      ) : (
                        <X size={15} style={{ color: '#EF4444' }} />
                      )}
                      <span>3. Triangle Inequality</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>‖X + Y‖ ≤ ‖X‖ + ‖Y‖</span>
                  </div>
                  <p style={{ fontSize: '0.77rem', margin: 0, lineHeight: 1.45 }}>
                    {currentCandidate.axioms.triangle.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Why Does it Fail? Toggle & Explanations */}
            {!currentCandidate.isValidNorm && (
              <div className="card-glass" style={{ padding: '1rem', borderRadius: 12, border: '1.5px solid #EF4444' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#EF4444', fontWeight: 700, fontSize: '0.86rem' }}>
                    <AlertTriangle size={17} />
                    <span>Why Does {currentCandidate.name} Fail to Qualify?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCounterExample(!showCounterExample)}
                    className="btn-secondary-sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                  >
                    {showCounterExample ? 'Hide Details' : 'Show Counterexamples'}
                  </button>
                </div>

                {showCounterExample && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    {!currentCandidate.axioms.posDef.satisfied && (
                      <div style={{ background: isLight ? 'rgba(239, 68, 68, 0.06)' : 'rgba(239, 68, 68, 0.12)', padding: '0.6rem', borderRadius: 6 }}>
                        <strong>Positive Definiteness Violation:</strong> {currentCandidate.axioms.posDef.explanation}
                      </div>
                    )}
                    {!currentCandidate.axioms.homogeneity.satisfied && (
                      <div style={{ background: isLight ? 'rgba(239, 68, 68, 0.06)' : 'rgba(239, 68, 68, 0.12)', padding: '0.6rem', borderRadius: 6 }}>
                        <strong>Homogeneity Violation:</strong> {currentCandidate.axioms.homogeneity.explanation}
                      </div>
                    )}
                    {!currentCandidate.axioms.triangle.satisfied && (
                      <div style={{ background: isLight ? 'rgba(239, 68, 68, 0.06)' : 'rgba(239, 68, 68, 0.12)', padding: '0.6rem', borderRadius: 6 }}>
                        <strong>Triangle Inequality Violation:</strong> {currentCandidate.axioms.triangle.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: UNIT BALLS (L1 DIAMOND, L2 CIRCLE, L_INF SQUARE) */}
      {/* ========================================================================= */}
      {activeTab === 'unit-balls' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.15fr) minmax(320px, 1fr)', gap: '1rem', alignItems: 'start' }}>
          {/* Left Column: Unit Ball Visualizer Canvas */}
          <div className="card-glass" style={{ padding: '1rem', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Closed Unit Ball: &#123; v ∈ ℝ² | ‖v‖ ≤ 1 &#125;</span>
              <span className="badge-tag-mini" style={{ fontSize: '0.72rem' }}>Drag Point P</span>
            </div>

            {/* Mode Buttons */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setBallMode('all')}
                className={`btn-secondary-sm ${ballMode === 'all' ? 'active' : ''}`}
                style={{ fontSize: '0.74rem', padding: '0.24rem 0.6rem' }}
              >
                Overlay All 3
              </button>
              <button
                type="button"
                onClick={() => setBallMode('l1')}
                className={`btn-secondary-sm ${ballMode === 'l1' ? 'active' : ''}`}
                style={{ fontSize: '0.74rem', padding: '0.24rem 0.6rem', color: '#EF4444' }}
              >
                L₁ Diamond
              </button>
              <button
                type="button"
                onClick={() => setBallMode('l2')}
                className={`btn-secondary-sm ${ballMode === 'l2' ? 'active' : ''}`}
                style={{ fontSize: '0.74rem', padding: '0.24rem 0.6rem', color: '#3B82F6' }}
              >
                L₂ Circle
              </button>
              <button
                type="button"
                onClick={() => setBallMode('linf')}
                className={`btn-secondary-sm ${ballMode === 'linf' ? 'active' : ''}`}
                style={{ fontSize: '0.74rem', padding: '0.24rem 0.6rem', color: '#10B981' }}
              >
                L_∞ Square
              </button>
              <button
                type="button"
                onClick={() => setBallMode('lp')}
                className={`btn-secondary-sm ${ballMode === 'lp' ? 'active' : ''}`}
                style={{ fontSize: '0.74rem', padding: '0.24rem 0.6rem', color: 'var(--accent-primary, #C59B67)' }}
              >
                L_p Slider
              </button>
            </div>

            {ballMode === 'lp' && (
              <div style={{ marginBottom: '0.65rem', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span>L_p Exponent (p = {pSlider.toFixed(1)})</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {pSlider === 1 ? 'Diamond' : pSlider === 2 ? 'Circle' : pSlider >= 6 ? 'Approaching Square' : 'Super-ellipse'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.2"
                  value={pSlider}
                  onChange={(e) => setPSlider(parseFloat(e.target.value))}
                  className="step-range-input"
                  style={{ width: '100%', '--slider-pct': `${((pSlider - 1) / 7) * 100}%` }}
                />
              </div>
            )}

            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <canvas
                ref={canvasT3Ref}
                width={360}
                height={360}
                onMouseDown={() => setIsDraggingProbe(true)}
                onMouseMove={handleProbeCanvasMove}
                onMouseUp={() => setIsDraggingProbe(false)}
                onTouchStart={() => setIsDraggingProbe(true)}
                onTouchMove={handleProbeCanvasMove}
                onTouchEnd={() => setIsDraggingProbe(false)}
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  aspectRatio: '1/1',
                  background: isLight ? '#F8FAFC' : '#0B0F17',
                  borderRadius: 10,
                  border: '1px solid var(--border-color)',
                  cursor: isDraggingProbe ? 'grabbing' : 'grab',
                  touchAction: 'none'
                }}
              />
            </div>
          </div>

          {/* Right Column: Shape Derivations & Probe Point Evaluation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Real-Time Probe Evaluation */}
            <div className="card-glass" style={{ padding: '1rem', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Probe Point Evaluation</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-primary, #C59B67)' }}>
                  P = [{probeX.toFixed(2)}, {probeY.toFixed(2)}]ᵀ
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                {/* L1 Evaluation */}
                <div style={{ padding: '0.6rem', borderRadius: 8, background: 'var(--bg-secondary)', borderLeft: '3px solid #EF4444' }}>
                  <div style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 600 }}>L₁ Norm</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700 }}>{probeL1.toFixed(2)}</div>
                  <div style={{ fontSize: '0.68rem', color: probeL1 <= 1 ? '#10B981' : '#EF4444' }}>
                    {probeL1 < 0.98 ? 'Inside' : probeL1 <= 1.02 ? 'On Boundary' : 'Outside'}
                  </div>
                </div>

                {/* L2 Evaluation */}
                <div style={{ padding: '0.6rem', borderRadius: 8, background: 'var(--bg-secondary)', borderLeft: '3px solid #3B82F6' }}>
                  <div style={{ fontSize: '0.72rem', color: '#3B82F6', fontWeight: 600 }}>L₂ Norm</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700 }}>{probeL2.toFixed(2)}</div>
                  <div style={{ fontSize: '0.68rem', color: probeL2 <= 1 ? '#10B981' : '#EF4444' }}>
                    {probeL2 < 0.98 ? 'Inside' : probeL2 <= 1.02 ? 'On Boundary' : 'Outside'}
                  </div>
                </div>

                {/* Linf Evaluation */}
                <div style={{ padding: '0.6rem', borderRadius: 8, background: 'var(--bg-secondary)', borderLeft: '3px solid #10B981' }}>
                  <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>L_∞ Norm</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700 }}>{probeLInf.toFixed(2)}</div>
                  <div style={{ fontSize: '0.68rem', color: probeLInf <= 1 ? '#10B981' : '#EF4444' }}>
                    {probeLInf < 0.98 ? 'Inside' : probeLInf <= 1.02 ? 'On Boundary' : 'Outside'}
                  </div>
                </div>
              </div>
            </div>

            {/* Derivation 1: L1 Diamond */}
            <div className="card-glass" style={{ padding: '0.85rem', borderRadius: 10, borderLeft: '4px solid #EF4444' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#EF4444', marginBottom: '0.2rem' }}>
                L₁ Norm: Why is it a Diamond?
              </div>
              <p style={{ fontSize: '0.77rem', margin: 0, lineHeight: 1.45 }}>
                At boundary ‖v‖₁ = |x| + |y| = 1. In quadrant 1 (x, y ≥ 0), this simplifies to the line <strong>x + y = 1</strong>.
                Valid points include (1, 0), (0, 1), and (0.5, 0.5). Reflecting across all 4 quadrants creates the 4 straight edges of a <strong>Diamond</strong>!
              </p>
            </div>

            {/* Derivation 2: L2 Circle */}
            <div className="card-glass" style={{ padding: '0.85rem', borderRadius: 10, borderLeft: '4px solid #3B82F6' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#3B82F6', marginBottom: '0.2rem' }}>
                L₂ Norm: Why is it a Circle?
              </div>
              <p style={{ fontSize: '0.77rem', margin: 0, lineHeight: 1.45 }}>
                At boundary ‖v‖₂ = √(x² + y²) = 1 ⟹ <strong>x² + y² = 1</strong>.
                This is the classic Cartesian equation of a circle of radius 1 centered at the origin.
              </p>
            </div>

            {/* Derivation 3: Linf Square */}
            <div className="card-glass" style={{ padding: '0.85rem', borderRadius: 10, borderLeft: '4px solid #10B981' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#10B981', marginBottom: '0.2rem' }}>
                L_∞ Norm: Why is it a Square?
              </div>
              <p style={{ fontSize: '0.77rem', margin: 0, lineHeight: 1.45 }}>
                For max(|x|, |y|) ≤ 1, both |x| ≤ 1 and |y| ≤ 1 must hold simultaneously.
                The allowed coordinates fill the solid box bounded by x = ±1 and y = ±1.
                For example, point (1, 0.5) has max(1, 0.5) = 1, placing it exactly on the square boundary!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: 3X3 IMAGE DIFFERENCE ACTIVITY */}
      {/* ========================================================================= */}
      {activeTab === 'image-difference' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Preset Buttons */}
          <div className="card-glass" style={{ padding: '0.9rem', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem', flexWrap: 'wrap', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Activity size={17} style={{ color: 'var(--accent-primary, #C59B67)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Interactive Exercise: One Large Pixel Error or Many Small Errors?</span>
              </div>
              <span className="badge-tag-mini" style={{ fontSize: '0.72rem' }}>Curricular Experiment</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem' }}>
              {IMAGE_ERROR_PRESETS.map((p) => {
                const isSelected = activePresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    style={{
                      padding: '0.55rem',
                      borderRadius: 8,
                      border: isSelected ? '1.5px solid var(--accent-primary, #C59B67)' : '1px solid var(--border-color)',
                      background: isSelected
                        ? isLight ? 'rgba(197, 155, 103, 0.15)' : 'rgba(197, 155, 103, 0.22)'
                        : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-primary, #C59B67)' }}>
                      {p.badge}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', marginTop: '0.15rem' }}>
                      {p.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Three Grids Side-by-Side: Original, Modified, Difference */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {/* 1. Original Image Grid */}
            <div className="card-glass" style={{ padding: '0.9rem', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>Original Image (3×3)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>Baseline = 40</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', maxWidth: '210px', margin: '0 auto' }}>
                {originalImage.map((row, r) =>
                  row.map((val, c) => (
                    <div
                      key={`orig-${r}-${c}`}
                      style={{
                        aspectRatio: '1/1',
                        borderRadius: 6,
                        background: `rgb(${val}, ${val}, ${val})`,
                        color: val > 128 ? '#000000' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      {val}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Modified Image Grid (Editable) */}
            <div className="card-glass" style={{ padding: '0.9rem', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>Modified Image (3×3)</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Editable Cells</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', maxWidth: '210px', margin: '0 auto' }}>
                {modifiedImage.map((row, r) =>
                  row.map((val, c) => {
                    const isChanged = val !== originalImage[r][c];
                    return (
                      <input
                        key={`mod-${r}-${c}`}
                        type="number"
                        min="0"
                        max="255"
                        value={val}
                        onChange={(e) => handleCellChange(r, c, e.target.value)}
                        style={{
                          aspectRatio: '1/1',
                          borderRadius: 6,
                          background: `rgb(${val}, ${val}, ${val})`,
                          color: val > 128 ? '#000000' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textAlign: 'center',
                          border: isChanged ? '2px solid var(--accent-primary, #C59B67)' : '1px solid rgba(255,255,255,0.1)',
                          outline: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Pixel Difference Matrix Grid */}
            <div className="card-glass" style={{ padding: '0.9rem', borderRadius: 12, border: '1.5px solid var(--accent-primary, #C59B67)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--accent-primary, #C59B67)' }}>
                  Difference Matrix: D = |I_mod − I_orig|
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>Error Grid</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', maxWidth: '210px', margin: '0 auto' }}>
                {imageDiffResults.diff.map((row, r) =>
                  row.map((d, c) => {
                    const isNonZero = d > 0;
                    return (
                      <div
                        key={`diff-${r}-${c}`}
                        style={{
                          aspectRatio: '1/1',
                          borderRadius: 6,
                          background: isNonZero
                            ? isLight ? `rgba(239, 68, 68, ${Math.min(0.9, 0.15 + (d / 80) * 0.75)})` : `rgba(239, 68, 68, ${Math.min(0.9, 0.25 + (d / 80) * 0.7)})`
                            : 'var(--bg-secondary)',
                          color: isNonZero ? '#FFFFFF' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          border: isNonZero ? '1.5px solid #EF4444' : '1px solid var(--border-color)'
                        }}
                      >
                        {d}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Norm Metrics Comparison Card */}
          <div className="card-glass" style={{ padding: '1rem', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Calculated Norms of Difference Matrix (Vector D ∈ ℝ⁹)</span>
              {currentPresetMeta.expected && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#3B82F6', fontWeight: 600 }}>
                  Hierarchy: {currentPresetMeta.expected.relation}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.85rem' }}>
              {/* L1 Card */}
              <div style={{ padding: '0.85rem', borderRadius: 10, background: 'var(--bg-secondary)', borderLeft: '4px solid #EF4444' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#EF4444' }}>L₁ Norm (Sum of Absolute Errors)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, margin: '0.2rem 0' }}>
                  ‖D‖₁ = {imageDiffResults.norm1.toFixed(1)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Total cumulative pixel change across all 9 cells.
                </div>
              </div>

              {/* L2 Card */}
              <div style={{ padding: '0.85rem', borderRadius: 10, background: 'var(--bg-secondary)', borderLeft: '4px solid #3B82F6' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3B82F6' }}>L₂ Norm (Euclidean Distance / RMS)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, margin: '0.2rem 0' }}>
                  ‖D‖₂ = {imageDiffResults.norm2.toFixed(1)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Root-sum-square magnitude of error vector: √(∑ dᵢ²).
                </div>
              </div>

              {/* Linf Card */}
              <div style={{ padding: '0.85rem', borderRadius: 10, background: 'var(--bg-secondary)', borderLeft: '4px solid #10B981' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10B981' }}>L_∞ Norm (Chebyshev / Peak Error)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, margin: '0.2rem 0' }}>
                  ‖D‖_∞ = {imageDiffResults.normInf.toFixed(1)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Worst-case single pixel distortion: max(dᵢ).
                </div>
              </div>
            </div>

            {/* Central Curricular Insight Banner */}
            <div
              style={{
                padding: '0.95rem',
                borderRadius: 10,
                background: isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#3B82F6', marginBottom: '0.35rem' }}>
                Central Insight: In cases 1 &amp; 2, the L₁ norm is identical (80). Does this mean the images changed in the same way?
              </div>
              <p style={{ fontSize: '0.8rem', margin: 0, lineHeight: 1.55 }}>
                The answer is <strong>NO</strong>! Case 1 has a severe, concentrated spike in a single pixel (like a dead camera sensor pixel),
                giving a massive peak distortion <strong>‖D‖_∞ = 80</strong> and <strong>‖D‖₂ = 80</strong>.
                Case 2 distributes the same total error of 80 across four pixels (+20 each), cutting the Euclidean error in half to <strong>‖D‖₂ = 40</strong>,
                and slashing the peak distortion to <strong>‖D‖_∞ = 20</strong>!
                <br />
                <strong>Takeaway:</strong> Different norms reveal whether image corruption is concentrated in sharp spikes or smoothly distributed across pixels.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: REAL-WORLD APPLICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {/* 1. LASSO & Compressed Sensing */}
          <div className="card-glass" style={{ padding: '1rem', borderRadius: 12, borderLeft: '4px solid #EF4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
              <Target size={18} style={{ color: '#EF4444' }} />
              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>LASSO Regression &amp; Sparse Image Recovery</span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.55, margin: 0 }}>
              Why do data scientists use the <strong>L₁ norm</strong> for feature selection instead of L₂?
              Because the L₁ unit ball is a diamond with sharp pointy corners along the coordinate axes.
              When optimization contours touch the L₁ ball, they hit the corner at exact zero: (1, 0) or (0, 1).
              This sets irrelevant features to exactly zero, creating sparse models and reconstructing images from 80% fewer sensor measurements (Compressed Sensing)!
            </p>
          </div>

          {/* 2. JPEG PSNR & L2 Norm */}
          <div className="card-glass" style={{ padding: '1rem', borderRadius: 12, borderLeft: '4px solid #3B82F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
              <Activity size={18} style={{ color: '#3B82F6' }} />
              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>JPEG Compression &amp; Peak Signal-to-Noise Ratio (PSNR)</span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.55, margin: 0 }}>
              The international standard metric for digital image and video quality is <strong>PSNR</strong>:
              PSNR = 10 · log₁₀(255² / MSE). Mean Squared Error (MSE) is simply the squared <strong>L₂ Euclidean norm</strong> of the difference matrix divided by the total pixel count.
              Higher PSNR corresponds to lower Euclidean error energy, ensuring human eyes perceive clean textures.
            </p>
          </div>

          {/* 3. Adversarial AI Attacks & Linf Perturbations */}
          <div className="card-glass" style={{ padding: '1rem', borderRadius: 12, borderLeft: '4px solid #10B981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
              <ShieldCheck size={18} style={{ color: '#10B981' }} />
              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Adversarial AI Attacks (L_∞ Perturbations)</span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.55, margin: 0 }}>
              In autonomous driving and facial recognition security, hackers craft adversarial noise to fool deep neural networks.
              These attacks are constrained by the <strong>L_∞ norm</strong> (‖η‖_∞ ≤ ε).
              By limiting the maximum change of any single pixel to a tiny value (e.g., ε = 4 out of 255), the perturbation is completely invisible to human eyes, yet catastrophic for the AI classifier!
            </p>
          </div>

          {/* 4. Robot Motion Planning & Navigation */}
          <div className="card-glass" style={{ padding: '1rem', borderRadius: 12, borderLeft: '4px solid var(--accent-primary, #C59B67)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
              <Compass size={18} style={{ color: 'var(--accent-primary, #C59B67)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Robot Path Planning: Manhattan vs Euclidean Grid</span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.55, margin: 0 }}>
              In robotics, distance metrics dictate path planning:
              • <strong>L₁ (Manhattan)</strong>: Taxi cabs on Manhattan city street grids that can only turn 90°.
              • <strong>L₂ (Euclidean)</strong>: Flying delivery drones that move in direct straight lines.
              • <strong>L_∞ (Chebyshev)</strong>: Multi-axis CNC milling machines or robotic arms where X and Y stepper motors move simultaneously at the same speed.
            </p>
          </div>
        </div>
      )}

      {/* MODULE DOCUMENTATION (COLLAPSED ACCORDION) */}
      <div style={{ marginTop: '1.5rem' }}>
        <ModuleDocumentation stepNumber={21} defaultOpen={false} />
      </div>

      {/* STANDARDIZED FOOTER WITH PREVIOUS / NEXT NAVIGATION */}
      <StepFooter
        stepNumber={21}
        onSelectStep={onSelectStep}
      />
    </div>
  );
}
