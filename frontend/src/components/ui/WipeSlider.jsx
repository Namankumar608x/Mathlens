import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeftRight } from 'lucide-react';

export default function WipeSlider({
  originalContent,
  modifiedContent,
  originalLabel = "Original",
  modifiedLabel = "Transformed",
  initialPosition = 50
}) {
  const [position, setPosition] = useState(initialPosition); // 0 to 100%
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(clamped);
  }, []);

  const handleMouseDown = () => {
    isDragging.current = true;
    const onMouseMove = (e) => {
      if (isDragging.current) updatePosition(e.clientX);
    };
    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      updatePosition(e.touches[0].clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      className="wipe-slider-container glass-level-2"
      onTouchMove={handleTouchMove}
    >
      {/* Background (Modified) Layer */}
      <div className="wipe-layer wipe-modified">
        {modifiedContent}
        <span className="wipe-badge badge-right">{modifiedLabel}</span>
      </div>

      {/* Foreground (Original) Clipped Layer */}
      <div
        className="wipe-layer wipe-original"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {originalContent}
        <span className="wipe-badge badge-left">{originalLabel}</span>
      </div>

      {/* Draggable Divider Line */}
      <div
        className="wipe-divider"
        style={{ left: `${position}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={() => { isDragging.current = true; }}
      >
        <div className="wipe-handle-pill">
          <ArrowLeftRight size={13} className="wipe-handle-icon" />
          <span className="wipe-percent-readout">{Math.round(position)}%</span>
        </div>
      </div>
    </div>
  );
}
