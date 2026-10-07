import React from 'react';
import { motion } from 'framer-motion';
import { Layers, CircleDot } from 'lucide-react';

export default function RGBExplodedView({
  colorGrid,
  activeTab = 'r',
  onSelectTab,
  hoveredCell,
  onHoverCell,
  onClickCell,
  onChangeCell
}) {
  if (!colorGrid) return null;

  const rMatrix = colorGrid.map(row => row.map(p => p.r));
  const gMatrix = colorGrid.map(row => row.map(p => p.g));
  const bMatrix = colorGrid.map(row => row.map(p => p.b));

  const handleTabClick = (tab) => {
    if (onSelectTab) onSelectTab(tab);
  };

  const renderSingleMatrix = (matrix, color, title, channelKey, isCompact = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', flex: isCompact ? 'none' : 1, margin: isCompact ? '0.4rem 0' : '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: isCompact ? '280px' : '420px', marginBottom: '0.4rem' }}>
        <span className="font-serif" style={{ fontSize: isCompact ? '0.95rem' : '1.15rem', fontWeight: 700, color }}>{title}</span>
        <span className="matrix-dims" style={{ borderColor: `${color}60`, color, background: `${color}15`, fontSize: isCompact ? '0.68rem' : '0.78rem' }}>4 × 4</span>
      </div>

      {/* Column indices */}
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: isCompact ? '240px' : '360px', marginBottom: '2px', paddingLeft: isCompact ? '18px' : '24px', paddingRight: isCompact ? '18px' : '24px' }}>
        {[0, 1, 2, 3].map(colIdx => (
          <span key={`col-${colIdx}`} style={{ fontSize: isCompact ? '0.65rem' : '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: isCompact ? '32px' : '48px', textAlign: 'center', opacity: 0.7 }}>
            c{colIdx}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        {/* Row indices */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: isCompact ? '140px' : '210px', marginRight: '4px' }}>
          {[0, 1, 2, 3].map(rowIdx => (
            <span key={`row-${rowIdx}`} style={{ fontSize: isCompact ? '0.65rem' : '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', height: isCompact ? '32px' : '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>
              r{rowIdx}
            </span>
          ))}
        </div>

        <div className="matrix-bracket-container" style={{ width: 'fit-content', margin: 0, '--bracket-color': color }}>
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
            {matrix.map((row, i) =>
              row.map((val, j) => {
                const isSelected = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;

                return (
                  <motion.div
                    key={`${channelKey}-${i}-${j}`}
                    className={`matrix-cell ${isSelected ? 'hovered' : ''}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => onHoverCell && onHoverCell({ row: i, col: j })}
                    onTouchStart={() => onHoverCell && onHoverCell({ row: i, col: j })}
                    style={{
                      '--cell-accent': color,
                      borderColor: isSelected ? color : 'var(--border-color)',
                      borderRadius: isCompact ? '6px' : '8px',
                      width: isCompact ? '34px' : '50px',
                      height: isCompact ? '34px' : '50px',
                      aspectRatio: '1 / 1',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? `${color}25` : `rgba(255, 255, 255, 0.04)`,
                      boxShadow: isSelected ? `0 0 14px ${color}50` : 'none'
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
                        if (onChangeCell) onChangeCell({ row: i, col: j, channel: channelKey, value: v });
                      }}
                      className="matrix-cell-input"
                      title="Click to edit intensity (0-255)"
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: color,
                        fontWeight: 700,
                        fontSize: isCompact ? '0.82rem' : '1.1rem',
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
    </div>
  );

  return (
    <div className="matrix-grid-card glass-level-2" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        <div className="card-title" style={{ marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Channel Decomposition Tensor</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Click any cell to edit (0–255)</span>
        </div>

        <div className="channel-tab-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem', marginBottom: '1.1rem', width: '100%' }}>
          <button
            className={`channel-tab-btn ${activeTab === 'r' ? 'active-r' : ''}`}
            onClick={() => handleTabClick('r')}
          >
            <CircleDot size={15} />
            <span>Red (M_R)</span>
          </button>
          <button
            className={`channel-tab-btn ${activeTab === 'g' ? 'active-g' : ''}`}
            onClick={() => handleTabClick('g')}
          >
            <CircleDot size={15} />
            <span>Green (M_G)</span>
          </button>
          <button
            className={`channel-tab-btn ${activeTab === 'b' ? 'active-b' : ''}`}
            onClick={() => handleTabClick('b')}
          >
            <CircleDot size={15} />
            <span>Blue (M_B)</span>
          </button>
          <button
            className={`channel-tab-btn ${activeTab === 'all' ? 'active-all' : ''}`}
            onClick={() => handleTabClick('all')}
          >
            <Layers size={15} />
            <span>All 3 Channels</span>
          </button>
        </div>

        {/* Centered Matrix Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', margin: 'auto 0' }}>
          {activeTab === 'r' && renderSingleMatrix(rMatrix, '#FB7185', 'Red Intensity Matrix (M_R)', 'r')}
          {activeTab === 'g' && renderSingleMatrix(gMatrix, '#34D399', 'Green Intensity Matrix (M_G)', 'g')}
          {activeTab === 'b' && renderSingleMatrix(bMatrix, '#38BDF8', 'Blue Intensity Matrix (M_B)', 'b')}

          {activeTab === 'all' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', width: '100%', justifyContent: 'center', alignItems: 'start', margin: 'auto' }}>
              {renderSingleMatrix(rMatrix, '#FB7185', 'M_R Matrix', 'r', true)}
              {renderSingleMatrix(gMatrix, '#34D399', 'M_G Matrix', 'g', true)}
              {renderSingleMatrix(bMatrix, '#38BDF8', 'M_B Matrix', 'b', true)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
