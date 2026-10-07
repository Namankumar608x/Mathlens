import React, { useMemo } from 'react';

export default function MathBackground() {
  const symbols = useMemo(() => [
    { text: 'det(A) = ad - bc', top: '12%', left: '8%', size: '0.9rem', opacity: 0.06 },
    { text: "X' = A · X", top: '22%', right: '12%', size: '1rem', opacity: 0.07 },
    { text: 'p = [R, G, B]ᵀ', top: '48%', left: '5%', size: '0.85rem', opacity: 0.05 },
    { text: 'A⁻¹A = I', top: '68%', right: '8%', size: '1rem', opacity: 0.07 },
    { text: 'C = αA + (1-α)B', top: '82%', left: '15%', size: '0.9rem', opacity: 0.06 },
    { text: 'λv = Av', top: '35%', left: '85%', size: '0.85rem', opacity: 0.05 },
    { text: '||A - B||', top: '75%', right: '28%', size: '0.85rem', opacity: 0.05 },
    { text: 'I(x,y) ∈ [0, 255]', top: '15%', left: '42%', size: '0.95rem', opacity: 0.06 },
    { text: '∑ wᵢ xᵢ', top: '58%', left: '52%', size: '0.9rem', opacity: 0.04 },
    { text: '∇ · F', top: '90%', right: '45%', size: '0.85rem', opacity: 0.04 },
  ], []);

  return (
    <div className="math-bg-layer" aria-hidden="true">
      {/* 1. Deep Atmospheric Gradient Blobs */}
      <div className="math-glow-blob math-glow-cyan" />
      <div className="math-glow-blob math-glow-violet" />
      <div className="math-glow-blob math-glow-blue" />
      <div className="math-glow-blob math-glow-bottom" />

      {/* 2. Precision Mathematical Grid Overlay */}
      <svg className="math-grid-svg" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="math-grid-small" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" className="grid-subtle-line" />
          </pattern>
          <pattern id="math-grid-large" width="160" height="160" patternUnits="userSpaceOnUse">
            <rect width="160" height="160" fill="url(#math-grid-small)" />
            <path d="M 160 0 L 0 0 0 160" fill="none" stroke="currentColor" strokeWidth="1" className="grid-major-line" />
            <circle cx="0" cy="0" r="1.5" fill="currentColor" className="grid-point" />
            <circle cx="160" cy="0" r="1.5" fill="currentColor" className="grid-point" />
            <circle cx="0" cy="160" r="1.5" fill="currentColor" className="grid-point" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#math-grid-large)" />
      </svg>

      {/* 3. Subtle Floating Math Equations & Coordinate Elements */}
      <div className="math-symbols-container">
        {symbols.map((item, idx) => (
          <div
            key={idx}
            className="floating-math-symbol"
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              fontSize: item.size,
              opacity: item.opacity
            }}
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* 4. Radial Vignette for Depth */}
      <div className="math-vignette-mask" />
    </div>
  );
}
