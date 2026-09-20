import React, { useRef, useEffect } from 'react';
import { transformPoint } from '../../core/transformEngine';

export default function CoordinateTransformCanvas({ matrix2x2 }) {
  const canvasRef = useRef(null);

  // Extract entries safely whether matrix2x2 is object {a,b,c,d} or 2D array [[a,b],[c,d]]
  const a = matrix2x2 && typeof matrix2x2.a === 'number' && !isNaN(matrix2x2.a) 
    ? matrix2x2.a 
    : (Array.isArray(matrix2x2) && matrix2x2[0] ? matrix2x2[0][0] : 1);
  const b = matrix2x2 && typeof matrix2x2.b === 'number' && !isNaN(matrix2x2.b) 
    ? matrix2x2.b 
    : (Array.isArray(matrix2x2) && matrix2x2[0] ? matrix2x2[0][1] : 0);
  const c = matrix2x2 && typeof matrix2x2.c === 'number' && !isNaN(matrix2x2.c) 
    ? matrix2x2.c 
    : (Array.isArray(matrix2x2) && matrix2x2[1] ? matrix2x2[1][0] : 0);
  const d = matrix2x2 && typeof matrix2x2.d === 'number' && !isNaN(matrix2x2.d) 
    ? matrix2x2.d 
    : (Array.isArray(matrix2x2) && matrix2x2[1] ? matrix2x2[1][1] : 1);

  const safeMatrix = { a, b, c, d };

  const drawArrow = (ctx, fromX, fromY, toX, toY, color, width = 3, label = '') => {
    const headlen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.fill();

    if (label) {
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText(label, toX + Math.cos(angle) * 14, toY + Math.sin(angle) * 14);
    }
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    // Set higher canvas resolution for sharp rendering
    const width = canvas.width = 720;
    const height = canvas.height = 520;

    const centerX = width / 2;
    const centerY = height / 2;
    const unitStep = 45; // 45px per 1 mathematical grid unit

    const toScreen = (p) => ({
      x: centerX + p.x * unitStep,
      y: centerY - p.y * unitStep
    });

    // Clear background
    ctx.fillStyle = isLight ? '#F8FAFC' : '#06080E';
    ctx.fillRect(0, 0, width, height);

    const gridUnitsX = Math.floor((width / 2) / unitStep);
    const gridUnitsY = Math.floor((height / 2) / unitStep);

    // 1. Standard static Cartesian grid lines
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -gridUnitsX; i <= gridUnitsX; i++) {
      if (i === 0) continue;
      const x = centerX + i * unitStep;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let j = -gridUnitsY; j <= gridUnitsY; j++) {
      if (j === 0) continue;
      const y = centerY + j * unitStep;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // 2. Main Cartesian Axes X & Y with Glow
    ctx.save();
    ctx.shadowColor = '#2563EB';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, centerY);
    ctx.lineTo(width - 15, centerY);
    ctx.moveTo(centerX, 15);
    ctx.lineTo(centerX, height - 15);
    ctx.stroke();
    ctx.restore();

    // Axis Arrow Tips
    ctx.fillStyle = '#2563EB';
    ctx.beginPath();
    ctx.moveTo(width - 12, centerY - 5);
    ctx.lineTo(width - 2, centerY);
    ctx.lineTo(width - 12, centerY + 5);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX - 5, 12);
    ctx.lineTo(centerX, 2);
    ctx.lineTo(centerX + 5, 12);
    ctx.fill();

    // 3. Simple Basis Vector Transformation
    const origin = toScreen({ x: 0, y: 0 });
    const iHatTransformed = toScreen(transformPoint(safeMatrix, { x: 1, y: 0 }));
    const jHatTransformed = toScreen(transformPoint(safeMatrix, { x: 0, y: 1 }));
    const cornerTransformed = toScreen(transformPoint(safeMatrix, { x: 1, y: 1 }));

    // Translucent Parallelogram for det(A) Area
    ctx.save();
    ctx.fillStyle = isLight ? 'rgba(59, 130, 246, 0.15)' : 'rgba(56, 189, 248, 0.18)';
    ctx.strokeStyle = isLight ? 'rgba(59, 130, 246, 0.4)' : 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(iHatTransformed.x, iHatTransformed.y);
    ctx.lineTo(cornerTransformed.x, cornerTransformed.y);
    ctx.lineTo(jHatTransformed.x, jHatTransformed.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Original Basis Ghosts
    const origIHat = toScreen({ x: 1, y: 0 });
    const origJHat = toScreen({ x: 0, y: 1 });
    drawArrow(ctx, origin.x, origin.y, origIHat.x, origIHat.y, 'rgba(236, 72, 153, 0.35)', 2, 'i');
    drawArrow(ctx, origin.x, origin.y, origJHat.x, origJHat.y, 'rgba(16, 185, 129, 0.35)', 2, 'j');

    // Transformed i-hat Vector
    drawArrow(ctx, origin.x, origin.y, iHatTransformed.x, iHatTransformed.y, '#EC4899', 3.5, "i'");

    // Transformed j-hat Vector
    drawArrow(ctx, origin.x, origin.y, jHatTransformed.x, jHatTransformed.y, '#10B981', 3.5, "j'");

    // 4. Axis Tick Labels with Pill Backdrops
    ctx.font = '600 11px "JetBrains Mono", monospace';
    for (let i = -gridUnitsX + 1; i <= gridUnitsX - 1; i++) {
      if (i === 0) continue;
      const posX = centerX + i * unitStep;
      const posY = centerY + 18;
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(6, 8, 14, 0.85)';
      ctx.fillRect(posX - 10, posY - 7, 20, 14);
      ctx.fillStyle = isLight ? '#334155' : '#94A3B8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i}`, posX, posY);
    }

    for (let j = -gridUnitsY + 1; j <= gridUnitsY - 1; j++) {
      if (j === 0) continue;
      const posX = centerX - 18;
      const posY = centerY - j * unitStep;
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(6, 8, 14, 0.85)';
      ctx.fillRect(posX - 12, posY - 7, 22, 14);
      ctx.fillStyle = isLight ? '#334155' : '#94A3B8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${j}`, posX, posY);
    }

    // Origin (0,0) Badge
    ctx.fillStyle = isLight ? '#E2E8F0' : 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(centerX - 36, centerY + 8, 30, 16);
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(centerX - 36, centerY + 8, 30, 16);

    ctx.fillStyle = isLight ? '#0284C7' : '#38BDF8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('(0,0)', centerX - 21, centerY + 16);

  }, [safeMatrix.a, safeMatrix.b, safeMatrix.c, safeMatrix.d]);

  const det = (a * d - b * c).toFixed(2);

  return (
    <div className="transform-canvas-card" style={{ width: '100%', position: 'relative' }}>
      <div className="card-title">
        <span>Vector Transformation Plot (X' = AX)</span>
        <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Grid: 1 unit = 45px</span>
      </div>

      <div style={{ position: 'relative', width: '100%', marginTop: '0.75rem' }}>
        <canvas 
          ref={canvasRef} 
          style={{ 
            width: '100%', 
            height: 'auto', 
            maxHeight: '520px', 
            borderRadius: '14px', 
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)'
          }} 
        />

        {/* Live Transformation Inspector Overlay */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'var(--bg-secondary)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--border-cyan)',
          borderRadius: '10px',
          padding: '0.5rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>det(A) = <strong style={{ color: 'var(--accent-cyan)' }}>{det}</strong></span>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', background: 'rgba(16, 185, 129, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
            {parseFloat(det) === 1 ? 'Area Preserved' : parseFloat(det) === 0 ? 'Collapsed (Singular)' : parseFloat(det) < 0 ? 'Orient. Inverted' : 'Area Scaled'}
          </span>
        </div>
      </div>
    </div>
  );
}
