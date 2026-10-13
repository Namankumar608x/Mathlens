import React from 'react';

export default function MathBackground() {
  return (
    <div className="math-bg-layer" aria-hidden="true">
      {/* 1. Subtle Radial Ambient Lighting (Simple & Elegant, perfectly calibrated for both themes) */}
      <div className="math-ambient-light" />

      {/* 2. Precision Mathematical Grid Overlay (Ultra-faint, notebook/workspace feel, zero overlap) */}
      <svg className="math-grid-svg" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="math-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="math-grid-line"
            />
            <circle cx="0" cy="0" r="0.8" fill="currentColor" className="math-grid-cross" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#math-grid-pattern)" />
      </svg>

      {/* 3. Soft Bottom & Corner Vignette to naturally ground the viewport */}
      <div className="math-vignette-mask" />
    </div>
  );
}
