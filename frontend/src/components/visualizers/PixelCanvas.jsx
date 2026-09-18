import React, { useRef, useEffect } from 'react';

export default function PixelCanvas({
  matrix,
  colorGrid,
  hoveredCell,
  onHoverCell,
  onClickCell,
  highlightColor = '#3B82F6',
  pixelSize = 72,
  title = "Digital Image Canvas"
}) {
  const canvasRef = useRef(null);

  const rows = matrix ? matrix.length : colorGrid ? colorGrid.length : 0;
  const cols = matrix ? matrix[0].length : colorGrid ? colorGrid[0].length : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rows || !cols) return;
    const ctx = canvas.getContext('2d');

    canvas.width = cols * pixelSize;
    canvas.height = rows * pixelSize;

    // Draw grid
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
        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);

        // Highlight hovered or selected cell
        if (hoveredCell && hoveredCell.row === r && hoveredCell.col === c) {
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = highlightColor;
          ctx.strokeRect(c * pixelSize + 1.75, r * pixelSize + 1.75, pixelSize - 3.5, pixelSize - 3.5);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
          ctx.lineWidth = 1;
        }
      }
    }
  }, [matrix, colorGrid, hoveredCell, rows, cols, pixelSize, highlightColor]);

  const getCellFromEvent = (e) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / pixelSize);
    const row = Math.floor(y / pixelSize);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      return { row, col, x: e.clientX, y: e.clientY };
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

  const handleMouseLeave = () => {
    if (onHoverCell) onHoverCell(null);
  };

  return (
    <div className="canvas-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        <div className="canvas-header" style={{ marginBottom: '1rem' }}>
          <h3>{title}</h3>
        </div>
        <div 
          className="canvas-wrapper" 
          style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justify: 'center', 
            width: '100%', 
            margin: 'auto 0', 
            padding: 0,
            cursor: 'pointer' 
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={handleMouseLeave}
            className="pixel-canvas"
          />
        </div>
      </div>
    </div>
  );
}
