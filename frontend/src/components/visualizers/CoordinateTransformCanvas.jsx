import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, Grid, Crosshair } from 'lucide-react';
import { transformPoint, computeDeterminant, getDeterminantAnalysis } from '../../core/transformEngine';

function drawArrow(ctx, fromX, fromY, toX, toY, color, width = 2.5, isLight = false) {
  const headlen = 10;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.save();
  if (!isLight) {
    ctx.shadowColor = 'rgba(255, 255, 255, 0.42)';
    ctx.shadowBlur = 6;
  }
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
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const CANVAS_BASE_WIDTH = 800;
const CANVAS_BASE_HEIGHT = 480;

export default function CoordinateTransformCanvas({
  matrix2x2,
  title = "2D Transformation Plane",
  showParallelogram = true,
  showBasisVectors = true,
  showGhostOutline = true,
  onHoverCoords = null
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [showGrid, setShowGrid] = useState(true);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [hoverInfo, setHoverInfo] = useState(null);

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

  const safeMatrix = useMemo(() => ({ a, b, c, d }), [a, b, c, d]);
  const rawDet = useMemo(() => computeDeterminant(safeMatrix), [safeMatrix]);
  const detAnalysis = useMemo(() => getDeterminantAnalysis(rawDet), [rawDet]);
  const trace = useMemo(() => a + d, [a, d]);
  const isTransformActive = useMemo(() => {
    return Math.abs(a - 1) > 0.001 || Math.abs(b) > 0.001 || Math.abs(c) > 0.001 || Math.abs(d - 1) > 0.001;
  }, [a, b, c, d]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const dpr = window.devicePixelRatio || 1;

    const baseWidth = CANVAS_BASE_WIDTH;
    const baseHeight = CANVAS_BASE_HEIGHT;

    const targetW = Math.round(baseWidth * dpr);
    const targetH = Math.round(baseHeight * dpr);
    if (canvas.width !== targetW) canvas.width = targetW;
    if (canvas.height !== targetH) canvas.height = targetH;

    ctx.save();
    ctx.scale(dpr, dpr);

    const centerX = baseWidth / 2;
    const centerY = baseHeight / 2;
    const unitStep = Math.round(72 * zoomScale);

    const toScreen = (p) => ({
      x: centerX + p.x * unitStep,
      y: centerY - p.y * unitStep
    });

    // Clean background fill matching theme
    ctx.fillStyle = isLight ? '#FAF9F2' : '#0A0806';
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    const maxUnitsX = Math.ceil((baseWidth / 2) / unitStep) + 1;
    const maxUnitsY = Math.ceil((baseHeight / 2) / unitStep) + 1;

    // 1. Standard Cartesian Grid Lines
    if (showGrid) {
      ctx.strokeStyle = isLight ? 'rgba(41, 47, 37, 0.08)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = -maxUnitsX; i <= maxUnitsX; i++) {
        if (i === 0) continue;
        const x = centerX + i * unitStep;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, baseHeight);
      }
      for (let j = -maxUnitsY; j <= maxUnitsY; j++) {
        if (j === 0) continue;
        const y = centerY + j * unitStep;
        ctx.moveTo(0, y);
        ctx.lineTo(baseWidth, y);
      }
      ctx.stroke();
    }

    // 2. Main Cartesian Axes X and Y
    const axisColor = isLight ? '#424F34' : 'rgba(255, 255, 255, 0.78)';
    ctx.save();
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(10, centerY);
    ctx.lineTo(baseWidth - 10, centerY);
    ctx.moveTo(centerX, baseHeight - 10);
    ctx.lineTo(centerX, 10);
    ctx.stroke();

    // Axis Arrows
    const arrowLen = 9;
    ctx.fillStyle = axisColor;
    ctx.beginPath();
    ctx.moveTo(baseWidth - 6, centerY);
    ctx.lineTo(baseWidth - 6 - arrowLen, centerY - 4.5);
    ctx.lineTo(baseWidth - 6 - arrowLen, centerY + 4.5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX, 6);
    ctx.lineTo(centerX - 4.5, 6 + arrowLen);
    ctx.lineTo(centerX + 4.5, 6 + arrowLen);
    ctx.closePath();
    ctx.fill();

    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText('x', baseWidth - 18, centerY - 10);
    ctx.fillText('y', centerX + 12, 18);
    ctx.restore();

    // 4. Tick Marks and Numbers
    ctx.save();
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillStyle = isLight ? '#555D4E' : 'rgba(255, 255, 255, 0.75)';

    for (let i = -maxUnitsX; i <= maxUnitsX; i++) {
      if (i === 0) continue;
      const x = centerX + i * unitStep;
      if (x < 24 || x > baseWidth - 24) continue;

      ctx.strokeStyle = isLight ? '#D8DECE' : 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, centerY - 3.5);
      ctx.lineTo(x, centerY + 3.5);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${i}`, x, centerY + 6);
    }

    for (let j = -maxUnitsY; j <= maxUnitsY; j++) {
      if (j === 0) continue;
      const y = centerY - j * unitStep;
      if (y < 24 || y > baseHeight - 24) continue;

      ctx.strokeStyle = isLight ? '#D8DECE' : 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 3.5, y);
      ctx.lineTo(centerX + 3.5, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${j}`, centerX - 7, y);
    }

    // Clean Origin "0" label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('0', centerX - 6, centerY + 6);
    ctx.restore();

    // 5. Original Unit Square Ghost [0, 1]²
    const originScreen = toScreen({ x: 0, y: 0 });
    const uXScreen = toScreen({ x: 1, y: 0 });
    const uYScreen = toScreen({ x: 0, y: 1 });

    if (showGhostOutline && isTransformActive) {
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(112, 117, 104, 0.35)' : 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(originScreen.x, uYScreen.y, unitStep, unitStep);

      drawArrow(ctx, originScreen.x, originScreen.y, uXScreen.x, uXScreen.y, isLight ? 'rgba(185, 28, 28, 0.3)' : 'rgba(248, 113, 113, 0.45)', 1.5, isLight);
      drawArrow(ctx, originScreen.x, originScreen.y, uYScreen.x, uYScreen.y, isLight ? 'rgba(66, 79, 52, 0.3)' : 'rgba(255, 255, 255, 0.45)', 1.5, isLight);
      ctx.restore();
    }

    // 6. Transformed Unit Square / Parallelogram
    const v1 = toScreen(transformPoint(safeMatrix, { x: 1, y: 0 }));
    const v2 = toScreen(transformPoint(safeMatrix, { x: 1, y: 1 }));
    const v3 = toScreen(transformPoint(safeMatrix, { x: 0, y: 1 }));

    if (showParallelogram) {
      if (detAnalysis.type !== 'collapse') {
        ctx.save();
        let strokeCol = isLight ? '#55673E' : '#B4CCA0';

        // Rich, luminous gradient fill for proper block shading
        const grad = ctx.createLinearGradient(originScreen.x, originScreen.y, v2.x, v2.y);
        if (detAnalysis.orientationFlipped) {
          strokeCol = isLight ? '#B45309' : '#FCD34D';
          grad.addColorStop(0, isLight ? 'rgba(180, 83, 9, 0.36)' : 'rgba(251, 191, 36, 0.32)');
          grad.addColorStop(1, isLight ? 'rgba(180, 83, 9, 0.20)' : 'rgba(251, 191, 36, 0.16)');
        } else {
          strokeCol = isLight ? '#4D5D3B' : '#B4CCA0';
          grad.addColorStop(0, isLight ? 'rgba(105, 121, 81, 0.38)' : 'rgba(180, 204, 160, 0.28)');
          grad.addColorStop(1, isLight ? 'rgba(105, 121, 81, 0.22)' : 'rgba(180, 204, 160, 0.15)');
        }

        ctx.fillStyle = grad;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.2;
        if (!isLight) {
          ctx.shadowColor = detAnalysis.orientationFlipped ? 'rgba(252, 211, 77, 0.45)' : 'rgba(180, 204, 160, 0.45)';
          ctx.shadowBlur = 6;
        }
        ctx.beginPath();
        ctx.moveTo(originScreen.x, originScreen.y);
        ctx.lineTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.lineTo(v3.x, v3.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        [v1, v2, v3].forEach(v => {
          ctx.fillStyle = strokeCol;
          ctx.beginPath();
          ctx.arc(v.x, v.y, 4, 0, Math.PI * 2);
          ctx.fill();
          if (!isLight) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(v.x, v.y, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        ctx.restore();
      } else {
        // Dimension Collapse Line (Singular Matrix)
        ctx.save();
        const collapseCol = isLight ? '#DC2626' : '#FF6B6B';
        ctx.strokeStyle = collapseCol;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        if (!isLight) {
          ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
          ctx.shadowBlur = 6;
        }
        let dirX = a, dirY = c;
        if (Math.abs(dirX) < 1e-4 && Math.abs(dirY) < 1e-4) {
          dirX = b;
          dirY = d;
        }
        if (Math.abs(dirX) > 1e-4 || Math.abs(dirY) > 1e-4) {
          const len = Math.hypot(dirX, dirY);
          const uX = dirX / len;
          const uY = dirY / len;
          const span = 800;
          const p1 = toScreen({ x: -span * uX, y: -span * uY });
          const p2 = toScreen({ x: span * uX, y: span * uY });
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          ctx.font = '700 12px "JetBrains Mono", monospace';
          ctx.fillStyle = collapseCol;
          const labelPos = toScreen({ x: 2.5 * uX, y: 2.5 * uY });
          ctx.fillText('1D Collapse Subspace (Area = 0)', labelPos.x + 8, labelPos.y - 8);
        } else {
          ctx.fillStyle = collapseCol;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 7. Transformed Basis Vectors (Columns of Matrix A)
    if (showBasisVectors) {
      const iColor = isLight ? '#B91C1C' : '#FF7E7E';
      drawArrow(ctx, originScreen.x, originScreen.y, v1.x, v1.y, iColor, 2.75, isLight);

      const jColor = isLight ? '#292F25' : '#FFFFFF';
      drawArrow(ctx, originScreen.x, originScreen.y, v3.x, v3.y, jColor, 2.75, isLight);

      ctx.save();
      ctx.font = '700 12px "JetBrains Mono", monospace';

      const drawPill = (txt, posX, posY, col) => {
        const tw = ctx.measureText(txt).width;
        const th = 18;
        const px = Math.min(baseWidth - tw - 16, Math.max(8, posX));
        const py = Math.min(baseHeight - th - 8, Math.max(8, posY));
        ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(18, 22, 17, 0.94)';
        ctx.strokeStyle = isLight ? '#D8DECE' : 'rgba(255, 255, 255, 0.32)';
        ctx.lineWidth = 1;
        if (!isLight) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 4;
        }
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(px, py, tw + 10, th, 4);
        } else {
          ctx.rect(px, py, tw + 10, th);
        }
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = col;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, px + 5, py + th / 2);
      };

      const v1OffsetY = c >= 0 ? (Math.abs(c) < 0.2 ? -24 : -18) : 10;
      drawPill(`î' [${a.toFixed(2)}, ${c.toFixed(2)}]`, v1.x + 8, v1.y + v1OffsetY, iColor);

      const v3OffsetY = d >= 0 ? -18 : 10;
      const v3OffsetX = b <= 0 ? -95 : 8;
      drawPill(`ĵ' [${b.toFixed(2)}, ${d.toFixed(2)}]`, v3.x + v3OffsetX, v3.y + v3OffsetY, jColor);

      ctx.restore();
    }

    // 8. Transformed Area Badge (Rendered on top with clearance to eliminate text clipping)
    if (showParallelogram && detAnalysis.type !== 'collapse') {
      ctx.save();
      const strokeCol = isLight 
        ? (detAnalysis.orientationFlipped ? '#B45309' : '#55673E') 
        : (detAnalysis.orientationFlipped ? '#FBBF24' : '#A3B882');

      const areaText = `Area = ${Math.abs(rawDet).toFixed(2)}`;
      ctx.font = '700 12px "JetBrains Mono", monospace';
      const aMetrics = ctx.measureText(areaText);
      const aW = aMetrics.width;
      const badgeW = Math.max(94, aW + 26);
      const badgeH = 24;

      // Initial visual center of the parallelogram
      let badgeX = (originScreen.x + v2.x) / 2;
      let badgeY = (originScreen.y + v2.y) / 2;

      // Ensure proper clearance from the vertical j' basis vector arrow
      const jMinClearanceX = Math.max(originScreen.x, v3.x) + 10;
      if (v1.x >= originScreen.x && (badgeX - badgeW / 2) < jMinClearanceX) {
        badgeX = jMinClearanceX + badgeW / 2;
      }
      const jMaxClearanceX = Math.min(originScreen.x, v3.x) - 10;
      if (v1.x < originScreen.x && (badgeX + badgeW / 2) > jMaxClearanceX) {
        badgeX = jMaxClearanceX - badgeW / 2;
      }

      // Ensure proper clearance from horizontal i' basis vector arrow
      const iMinClearanceY = Math.min(originScreen.y, v1.y) - 10;
      if (v3.y <= originScreen.y && (badgeY + badgeH / 2) > iMinClearanceY) {
        badgeY = iMinClearanceY - badgeH / 2;
      }

      // Draw solid, crisp badge with soft shadow
      ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = isLight ? '#FFFFFF' : '#181C15';
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.25;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 6);
      } else {
        ctx.rect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH);
      }
      ctx.fill();
      ctx.stroke();

      // Draw sharp, centered text with zero clipping
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = strokeCol;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(areaText, badgeX, badgeY);

      ctx.restore();
    }

    ctx.restore();
  }, [safeMatrix, a, b, c, d, rawDet, isTransformActive, zoomScale, showGrid, showParallelogram, showBasisVectors, showGhostOutline, detAnalysis]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_BASE_WIDTH / rect.width;
    const scaleY = CANVAS_BASE_HEIGHT / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const centerX = CANVAS_BASE_WIDTH / 2;
    const centerY = CANVAS_BASE_HEIGHT / 2;
    const unitStep = Math.round(72 * zoomScale);

    const cartX = (canvasX - centerX) / unitStep;
    const cartY = (centerY - canvasY) / unitStep;

    const transformed = transformPoint(safeMatrix, { x: cartX, y: cartY });
    const probe = {
      x: Number(cartX.toFixed(2)),
      y: Number(cartY.toFixed(2)),
      tx: Number(transformed.x.toFixed(2)),
      ty: Number(transformed.y.toFixed(2))
    };
    setHoverInfo(probe);
    if (onHoverCoords) onHoverCoords(probe);
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
    if (onHoverCoords) onHoverCoords(null);
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `mathlens-determinant-transformation.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="canvas-card glass-level-2" ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '0.85rem 1rem' }}>
      {/* Header with Title, Invariant Pills, and Viewport Controls */}
      <div className="canvas-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <h3 className="canvas-title-text" style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {title}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.80rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px'
              }}
            >
              det(A) = {rawDet.toFixed(2)}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.80rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px'
              }}
            >
              Tr(A) = {trace.toFixed(2)}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.80rem',
                fontWeight: 700,
                color: detAnalysis.type === 'collapse' ? '#DC2626' : 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px'
              }}
            >
              {detAnalysis.shortBadge}
            </span>
          </div>
        </div>

        {/* Viewport Control Tools */}
        <div className="canvas-tools-group" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            className={`canvas-tool-btn ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid(prev => !prev)}
            title="Toggle Cartesian Grid"
            type="button"
          >
            <Grid size={14} />
          </button>

          <button
            className="canvas-tool-btn"
            onClick={() => setZoomScale(prev => Math.min(1.6, Math.round((prev + 0.15) * 100) / 100))}
            title="Zoom in (+)"
            type="button"
          >
            <ZoomIn size={14} />
          </button>

          <button
            className="canvas-tool-btn"
            onClick={() => setZoomScale(prev => Math.max(0.65, Math.round((prev - 0.15) * 100) / 100))}
            title="Zoom out (-)"
            type="button"
          >
            <ZoomOut size={14} />
          </button>

          {Math.abs(zoomScale - 1.0) > 0.01 && (
            <button
              className="canvas-tool-btn"
              onClick={() => setZoomScale(1.0)}
              title="Reset Zoom"
              type="button"
            >
              <RotateCcw size={14} />
            </button>
          )}

          <button
            className="canvas-tool-btn"
            onClick={handleExportPNG}
            title="Export Graph as PNG"
            type="button"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Viewport Stage */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            width: '100%',
            height: 'auto',
            aspectRatio: `${CANVAS_BASE_WIDTH} / ${CANVAS_BASE_HEIGHT}`,
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            touchAction: 'none',
            cursor: 'crosshair',
            display: 'block'
          }}
        />

        {/* Hover Coordinate Probe HUD */}
        {hoverInfo && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '7px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              pointerEvents: 'none',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
            }}
          >
            <Crosshair size={13} style={{ color: 'var(--text-muted)' }} />
            <span>({hoverInfo.x}, {hoverInfo.y})</span>
            <span style={{ color: 'var(--text-muted)' }}>➔</span>
            <strong>({hoverInfo.tx}, {hoverInfo.ty})</strong>
          </div>
        )}
      </div>
    </div>
  );
}
