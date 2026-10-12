import { useRef, useEffect } from 'react';
import { renderGrayscaleMatrixToCanvas, renderRGBMatrixToCanvas } from '../../core/image/canvasUtils.js';

export function PixelCanvas({
  matrix,
  mode = 'grayscale', // 'grayscale' or 'rgb'
  pixelScale = 24, // CSS render size multiplier per pixel
  showGrid = true,
  className = '',
  onPixelClick
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !matrix) return;

    if (mode === 'grayscale') {
      renderGrayscaleMatrixToCanvas(canvasRef.current, matrix);
    } else {
      renderRGBMatrixToCanvas(canvasRef.current, matrix);
    }
  }, [matrix, mode]);

  if (!matrix || !matrix.length) return null;

  const rows = matrix.length;
  const cols = matrix[0].length;
  const renderWidth = cols * pixelScale;
  const renderHeight = rows * pixelScale;

  const handleCanvasClick = (e) => {
    if (!onPixelClick || !canvasRef.current) return;
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    const rect = canvasRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const scaleX = renderWidth / rect.width;
    const scaleY = renderHeight / rect.height;
    const x = Math.floor(((clientX - rect.left) * scaleX) / pixelScale);
    const y = Math.floor(((clientY - rect.top) * scaleY) / pixelScale);

    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      onPixelClick(y, x);
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center max-w-full ${className}`}>
      <div
        className={`relative border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm max-w-full ${
          onPixelClick ? 'cursor-pointer' : ''
        }`}
        style={{ width: renderWidth, height: renderHeight, maxWidth: '100%', touchAction: 'manipulation' }}
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full [image-rendering:pixelated]"
          style={{ imageRendering: 'pixelated' }}
        />
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`
            }}
          >
            {Array.from({ length: rows * cols }).map((_, idx) => (
              <div
                key={idx}
                className="border border-black/10 dark:border-white/10"
              />
            ))}
          </div>
        )}
      </div>
      <span className="mt-2 text-xs font-mono text-gray-400 dark:text-gray-500">
        {cols}×{rows} Canvas
      </span>
    </div>
  );
}
