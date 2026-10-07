import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, Grid, Eye } from 'lucide-react';

export default function PixelCanvas({
  matrix,
  colorGrid,
  hoveredCell,
  onHoverCell,
  onClickCell,
  highlightColor = '#22D3EE',
  pixelSize = 72,
  title = "Digital Image Canvas"
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);

  const rows = matrix ? matrix.length : colorGrid ? colorGrid.length : 0;
  const cols = matrix ? matrix[0].length : colorGrid ? colorGrid[0].length : 0;

  // Responsive pixel sizing based on available space
  const effectivePixelSize = Math.max(24, Math.round(pixelSize * zoomScale));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rows || !cols) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const width = cols * effectivePixelSize;
    const height = rows * effectivePixelSize;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    // 1. Draw solid pixel fill boxes
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let fillStyle = '#000000';
        if (matrix) {
          const v = matrix[r][c];
          fillStyle = `rgb(${v}, ${v}, ${v})`;
        } else if (colorGrid) {
          const pixel = colorGrid[r][c];
          fillStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
        }

        ctx.fillStyle = fillStyle;
        ctx.fillRect(c * effectivePixelSize, r * effectivePixelSize, effectivePixelSize, effectivePixelSize);
      }
    }

    // 2. Draw adaptive grid lines on top of pixels
    if (showGrid) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let brightness = 0;
          if (matrix) {
            brightness = matrix[r][c];
          } else if (colorGrid) {
            const pixel = colorGrid[r][c];
            brightness = 0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b;
          }

          if (brightness < 75) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          } else if (brightness > 180) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
          } else {
            ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.30)';
          }

          ctx.lineWidth = 1;
          ctx.strokeRect(c * effectivePixelSize + 0.5, r * effectivePixelSize + 0.5, effectivePixelSize - 1, effectivePixelSize - 1);
        }
      }
    }

    // 3. Highlight hovered or selected cell
    if (hoveredCell && hoveredCell.row >= 0 && hoveredCell.row < rows && hoveredCell.col >= 0 && hoveredCell.col < cols) {
      const r = hoveredCell.row;
      const c = hoveredCell.col;
      ctx.lineWidth = 3;
      ctx.strokeStyle = highlightColor;
      ctx.strokeRect(c * effectivePixelSize + 1.5, r * effectivePixelSize + 1.5, effectivePixelSize - 3, effectivePixelSize - 3);
      ctx.fillStyle = 'rgba(34, 211, 238, 0.22)';
      ctx.fillRect(c * effectivePixelSize, r * effectivePixelSize, effectivePixelSize, effectivePixelSize);
    }

    ctx.restore();
  }, [matrix, colorGrid, hoveredCell, rows, cols, effectivePixelSize, highlightColor, showGrid]);

  const getCellFromEvent = (e) => {
    if (!canvasRef.current) return null;
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / effectivePixelSize);
    const row = Math.floor(y / effectivePixelSize);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      return { row, col, x: clientX, y: clientY };
    }
    return null;
  };

  const handleMouseMove = (e) => {
    if (!onHoverCell) return;
    const cell = getCellFromEvent(e);
    onHoverCell(cell);
  };

  const handleClick = (e) => {
    const cell = getCellFromEvent(e);
    if (cell && onClickCell) {
      onClickCell(cell);
    }
  };

  const handleTouch = (e) => {
    const cell = getCellFromEvent(e);
    if (cell) {
      if (onHoverCell) onHoverCell(cell);
      if (onClickCell) onClickCell(cell);
    }
  };

  const handleMouseLeave = () => {
    if (onHoverCell) onHoverCell(null);
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `mathlens-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="canvas-card glass-level-2" ref={containerRef}>
      {/* Header with Title and Viewport Controls */}
      <div className="canvas-header-bar">
        <div className="canvas-title-group">
          <Eye size={15} className="text-cyan-400" />
          <h3 className="canvas-title-text">{title}</h3>
          <span className="canvas-dims-tag">{cols} × {rows} px</span>
        </div>

        <div className="canvas-tools-group">
          <button
            className={`canvas-tool-btn ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle pixel grid lines"
            type="button"
          >
            <Grid size={13} />
          </button>

          <button
            className="canvas-tool-btn"
            onClick={() => setZoomScale(prev => Math.min(1.75, prev + 0.15))}
            title="Zoom in (+)"
            type="button"
          >
            <ZoomIn size={13} />
          </button>

          <button
            className="canvas-tool-btn"
            onClick={() => setZoomScale(prev => Math.max(0.65, prev - 0.15))}
            title="Zoom out (-)"
            type="button"
          >
            <ZoomOut size={13} />
          </button>

          {zoomScale !== 1 && (
            <button
              className="canvas-tool-btn"
              onClick={() => setZoomScale(1)}
              title="Reset Zoom"
              type="button"
            >
              <RotateCcw size={13} />
            </button>
          )}

          <button
            className="canvas-tool-btn"
            onClick={handleExportPNG}
            title="Export canvas as PNG"
            type="button"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Canvas Viewport Stage */}
      <div className="canvas-viewport-stage">
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
            onMouseLeave={handleMouseLeave}
            className="pixel-canvas"
          />
        </div>
      </div>

      {/* Coordinate & Value Inspector Footer */}
      <div className="canvas-footer-hud">
        {hoveredCell ? (
          <div className="canvas-hud-active">
            <span className="hud-coord-pill">Coord: ({hoveredCell.col}, {hoveredCell.row})</span>
            {matrix && (
              <span className="hud-val-pill">
                Intensity: <strong>{matrix[hoveredCell.row]?.[hoveredCell.col] ?? '—'}</strong> / 255
              </span>
            )}
            {colorGrid && colorGrid[hoveredCell.row]?.[hoveredCell.col] && (
              <span className="hud-rgb-pill">
                RGB: [{colorGrid[hoveredCell.row][hoveredCell.col].r}, {colorGrid[hoveredCell.row][hoveredCell.col].g}, {colorGrid[hoveredCell.row][hoveredCell.col].b}]
              </span>
            )}
          </div>
        ) : (
          <div className="canvas-hud-idle">
            <span>Hover pixel to inspect numerical array coordinates</span>
          </div>
        )}
      </div>
    </div>
  );
}
