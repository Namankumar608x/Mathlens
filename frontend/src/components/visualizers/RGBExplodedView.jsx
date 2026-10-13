import React from 'react';
import { motion } from 'framer-motion';

export default function RGBExplodedView({
  colorGrid,
  activeTab = 'r',
  hoveredCell,
  onHoverCell,
  onChangeCell
}) {
  if (!colorGrid) return null;

  const rMatrix = colorGrid.map(row => row.map(p => p.r));
  const gMatrix = colorGrid.map(row => row.map(p => p.g));
  const bMatrix = colorGrid.map(row => row.map(p => p.b));

  const channelConfig = {
    r: {
      key: 'r',
      name: 'Red Plane',
      symbol: 'M_R',
      color: '#EF4444',
      bgTint: 'rgba(239, 68, 68, 0.12)',
      borderTint: 'rgba(239, 68, 68, 0.35)',
      matrix: rMatrix
    },
    g: {
      key: 'g',
      name: 'Green Plane',
      symbol: 'M_G',
      color: '#10B981',
      bgTint: 'rgba(16, 185, 129, 0.12)',
      borderTint: 'rgba(16, 185, 129, 0.35)',
      matrix: gMatrix
    },
    b: {
      key: 'b',
      name: 'Blue Plane',
      symbol: 'M_B',
      color: '#3B82F6',
      bgTint: 'rgba(59, 130, 246, 0.12)',
      borderTint: 'rgba(59, 130, 246, 0.35)',
      matrix: bMatrix
    }
  };

  const computeStats = (matrix) => {
    let min = 255;
    let max = 0;
    let sum = 0;
    let count = 0;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        const v = matrix[r][c];
        if (v < min) min = v;
        if (v > max) max = v;
        sum += v;
        count++;
      }
    }
    return { min, max, avg: Math.round(sum / (count || 1)) };
  };

  const renderMatrixGrid = (cfg, isCompact = false) => {
    const { key, color, borderTint, matrix } = cfg;
    const stats = computeStats(matrix);

    return (
      <div
        className="rgb-plane-matrix-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: isCompact ? '260px' : '380px',
          margin: '0 auto'
        }}
      >
        {/* Plane sub-header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginBottom: '0.45rem',
            padding: '0 0.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: color,
                display: 'inline-block'
              }}
            />
            <span
              className="font-serif"
              style={{
                fontSize: isCompact ? '0.92rem' : '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}
            >
              {cfg.name} <span style={{ color, fontFamily: 'var(--font-mono)' }}>({cfg.symbol})</span>
            </span>
          </div>
          <span
            className="matrix-dims"
            style={{
              borderColor: borderTint,
              color,
              background: cfg.bgTint,
              fontSize: isCompact ? '0.68rem' : '0.75rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '9999px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            4 × 4
          </span>
        </div>

        {/* Column indices */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: isCompact ? '200px' : '280px',
            marginBottom: '2px',
            paddingLeft: isCompact ? '16px' : '20px',
            paddingRight: isCompact ? '16px' : '20px'
          }}
        >
          {[0, 1, 2, 3].map((colIdx) => (
            <span
              key={`col-${key}-${colIdx}`}
              style={{
                fontSize: isCompact ? '0.65rem' : '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                width: isCompact ? '38px' : '52px',
                textAlign: 'center',
                opacity: 0.75
              }}
            >
              c{colIdx}
            </span>
          ))}
        </div>

        {/* Rows with left bracket, matrix grid, right bracket */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: isCompact ? '170px' : '230px',
              marginRight: '6px'
            }}
          >
            {[0, 1, 2, 3].map((rowIdx) => (
              <span
                key={`row-${key}-${rowIdx}`}
                style={{
                  fontSize: isCompact ? '0.65rem' : '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  height: isCompact ? '38px' : '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.75
                }}
              >
                r{rowIdx}
              </span>
            ))}
          </div>

          <div
            className="matrix-bracket-container"
            style={{
              width: 'fit-content',
              margin: 0,
              '--bracket-color': color
            }}
          >
            <div className="matrix-left-bracket" style={{ borderColor: color }} />
            <div
              className="matrix-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: isCompact ? '5px' : '8px',
                width: 'fit-content'
              }}
            >
              {matrix.map((rowArr, i) =>
                rowArr.map((val, j) => {
                  const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;

                  return (
                    <motion.div
                      key={`${key}-${i}-${j}`}
                      className={`matrix-cell ${isHovered ? 'hovered' : ''}`}
                      onMouseEnter={() => onHoverCell && onHoverCell({ row: i, col: j })}
                      onTouchStart={() => onHoverCell && onHoverCell({ row: i, col: j })}
                      style={{
                        borderColor: isHovered ? color : 'var(--border-color)',
                        borderRadius: isCompact ? '6px' : '8px',
                        width: isCompact ? '38px' : '52px',
                        height: isCompact ? '38px' : '52px',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isHovered ? cfg.bgTint : 'rgba(255, 255, 255, 0.03)',
                        boxShadow: isHovered ? '0 2px 6px rgba(0, 0, 0, 0.25)' : 'none',
                        transition: 'border-color 0.15s ease, background 0.15s ease'
                      }}
                    >
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={val}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value, 10);
                          const v = isNaN(raw) ? 0 : Math.min(255, Math.max(0, raw));
                          if (onChangeCell) onChangeCell({ row: i, col: j, channel: key, value: v });
                        }}
                        className="matrix-cell-input"
                        title={`Row ${i}, Col ${j}: ${val} (click to edit)`}
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: isHovered ? color : 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: isCompact ? '0.82rem' : '1.05rem',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer'
                        }}
                      />
                    </motion.div>
                  );
                })
              )}
            </div>
            <div className="matrix-right-bracket" style={{ borderColor: color }} />
          </div>
        </div>

        {/* Plane statistics footer pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: isCompact ? '230px' : '310px',
            marginTop: '0.45rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '6px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}
        >
          <span>Min: <strong style={{ color: 'var(--text-primary)' }}>{stats.min}</strong></span>
          <span>Avg: <strong style={{ color }}>{stats.avg}</strong></span>
          <span>Max: <strong style={{ color: 'var(--text-primary)' }}>{stats.max}</strong></span>
        </div>
      </div>
    );
  };

  const hoveredPixel = hoveredCell ? colorGrid[hoveredCell.row]?.[hoveredCell.col] : null;

  return (
    <div
      className="matrix-grid-card glass-level-2"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        {/* Card Header */}
        <div
          className="card-title"
          style={{
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            paddingBottom: '0.65rem',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {activeTab === 'all' ? 'Decomposed Image Tensor' : channelConfig[activeTab]?.name}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                background: 'var(--bg-tertiary)',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                border: '1px solid var(--border-color)'
              }}
            >
              {activeTab === 'all' ? 'ℝ^(4 × 4 × 3)' : 'ℝ^(4 × 4)'}
            </span>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            Click any cell to edit (0–255)
          </span>
        </div>

        {/* Single Plane View */}
        {activeTab !== 'all' && channelConfig[activeTab] && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              margin: 'auto 0'
            }}
          >
            {renderMatrixGrid(channelConfig[activeTab], false)}
          </div>
        )}

        {/* All 3 Planes Side-by-Side View */}
        {activeTab === 'all' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '1rem',
              width: '100%',
              margin: 'auto 0'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '1.1rem',
                width: '100%',
                alignItems: 'start'
              }}
            >
              {renderMatrixGrid(channelConfig.r, true)}
              {renderMatrixGrid(channelConfig.g, true)}
              {renderMatrixGrid(channelConfig.b, true)}
            </div>

            {/* Recombination synthesis strip */}
            {hoveredCell && hoveredPixel && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '0.45rem 1rem',
                  borderRadius: '10px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  marginTop: '0.5rem'
                }}
              >
                <span>
                  Pixel [{hoveredCell.row}, {hoveredCell.col}]:
                </span>
                <span style={{ color: '#EF4444', fontWeight: 700 }}>
                  R={hoveredPixel.r}
                </span>
                <span style={{ opacity: 0.5 }}>+</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>
                  G={hoveredPixel.g}
                </span>
                <span style={{ opacity: 0.5 }}>+</span>
                <span style={{ color: '#3B82F6', fontWeight: 700 }}>
                  B={hoveredPixel.b}
                </span>
                <span style={{ opacity: 0.5 }}>=</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '6px',
                    background: `rgb(${hoveredPixel.r}, ${hoveredPixel.g}, ${hoveredPixel.b})`,
                    color: (hoveredPixel.r * 0.299 + hoveredPixel.g * 0.587 + hoveredPixel.b * 0.114) > 130 ? '#000000' : '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    border: '1px solid rgba(0, 0, 0, 0.2)'
                  }}
                >
                  RGB ({hoveredPixel.r}, {hoveredPixel.g}, {hoveredPixel.b})
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
