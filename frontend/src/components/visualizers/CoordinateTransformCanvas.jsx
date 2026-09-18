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

    // Clear background
    ctx.fillStyle = isLight ? '#F8FAFC' : '#06080E';
    ctx.fillRect(0, 0, width, height);

    const gridUnitsX = Math.floor((width / 2) / unitStep);
    const gridUnitsY = Math.floor((height / 2) / unitStep);

    // 1. Draw Subtle Subgrid Lines
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
    
    // X-Axis
    ctx.moveTo(15, centerY);
    ctx.lineTo(width - 15, centerY);
    // Y-Axis
    ctx.moveTo(centerX, 15);
    ctx.lineTo(centerX, height - 15);
    ctx.stroke();
    ctx.restore();

    // Draw Axis Arrow Tips
    ctx.fillStyle = '#2563EB';
    // X-Axis Arrow Tip (Right)
    ctx.beginPath();
    ctx.moveTo(width - 12, centerY - 5);
    ctx.lineTo(width - 2, centerY);
    ctx.lineTo(width - 12, centerY + 5);
    ctx.fill();

    // Y-Axis Arrow Tip (Top)
    ctx.beginPath();
    ctx.moveTo(centerX - 5, 12);
    ctx.lineTo(centerX, 2);
    ctx.lineTo(centerX + 5, 12);
    ctx.fill();

    // Base Arrow Shape (Original Unit Coordinates)
    const baseUnitPoints = [
      { x: 0, y: 0 },
      { x: 0.8, y: 0 },
      { x: 0.8, y: 1.8 },
      { x: 1.4, y: 1.8 },
      { x: 0, y: 3.0 },
      { x: -1.4, y: 1.8 },
      { x: -0.8, y: 1.8 },
      { x: -0.8, y: 0 }
    ];

    // Transformed points in unit coordinates
    const transformedUnitPoints = baseUnitPoints.map(p => transformPoint(safeMatrix, p));

    const toScreen = (p) => ({
      x: centerX + p.x * unitStep,
      y: centerY - p.y * unitStep
    });

    const originalScreenPoints = baseUnitPoints.map(toScreen);
    const transformedScreenPoints = transformedUnitPoints.map(toScreen);

    // 3. Draw Original Ghost Reference Shape (Dashed)
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.25)';
    ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    originalScreenPoints.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. Draw Transformed Shape (Glowing Gradient Fill & Stroke)
    ctx.save();
    const grad = ctx.createLinearGradient(centerX, centerY - 150, centerX, centerY + 150);
    grad.addColorStop(0, 'rgba(2, 132, 199, 0.35)');
    grad.addColorStop(1, 'rgba(37, 99, 235, 0.2)');

    ctx.fillStyle = grad;
    ctx.shadowColor = '#0284C7';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    transformedScreenPoints.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 5. Draw Vertex Points on Transformed Shape
    transformedScreenPoints.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#1E293B' : '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // 6. Draw Clean Axis Tick Labels with Pill Backdrops
    ctx.font = '600 11px "JetBrains Mono", monospace';

    // X-axis number ticks
    for (let i = -gridUnitsX + 1; i <= gridUnitsX - 1; i++) {
      if (i === 0) continue;
      const posX = centerX + i * unitStep;
      const posY = centerY + 18;
      const label = `${i}`;

      // Draw background pill badge to prevent overlapping lines/shapes
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(6, 8, 14, 0.85)';
      ctx.fillRect(posX - 10, posY - 7, 20, 14);

      ctx.fillStyle = isLight ? '#334155' : '#94A3B8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, posX, posY);
    }

    // Y-axis number ticks
    for (let j = -gridUnitsY + 1; j <= gridUnitsY - 1; j++) {
      if (j === 0) continue;
      const posX = centerX - 18;
      const posY = centerY - j * unitStep;
      const label = `${j}`;

      // Draw background pill badge
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(6, 8, 14, 0.85)';
      ctx.fillRect(posX - 12, posY - 7, 22, 14);

      ctx.fillStyle = isLight ? '#334155' : '#94A3B8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, posX, posY);
    }

    // Origin (0,0) Badge (Quad 3 - Bottom Left Offset)
    ctx.fillStyle = isLight ? '#E2E8F0' : 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(centerX - 36, centerY + 8, 30, 16);
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(centerX - 36, centerY + 8, 30, 16);

    ctx.fillStyle = isLight ? '#0284C7' : '#38BDF8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('(0,0)', centerX - 21, centerY + 16);

  }, [safeMatrix.a, safeMatrix.b, safeMatrix.c, safeMatrix.d]);

  // Calculate Determinant det(A) = ad - bc
  const det = (a * d - b * c).toFixed(2);

  return (
    <div className="transform-canvas-card" style={{ width: '100%', position: 'relative' }}>
      <div className="card-title">
        <span>Vector Transformation Plot (X' = AX)</span>
        <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Grid: 1 unit = 45px</span>
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
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
