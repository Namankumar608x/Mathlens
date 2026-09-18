import React from 'react';

export default function MatrixGrid({
  matrix,
  hoveredCell,
  onHoverCell,
  editable = false,
  onChangeCell,
  accentColor = '#3B82F6',
  title = "Matrix Representation A"
}) {
  if (!matrix || !matrix.length) return null;

  return (
    <div className="matrix-grid-card">
      <div className="matrix-header">
        <h3>{title}</h3>
        <span className="matrix-dims" style={{ borderColor: `${accentColor}60`, color: accentColor, background: `${accentColor}15` }}>
          {matrix.length} × {matrix[0].length}
        </span>
      </div>

      <div className="matrix-bracket-container" style={{ flex: 1, margin: 'auto 0' }}>
        <div 
          className="matrix-grid"
          style={{ gridTemplateColumns: `repeat(${matrix[0].length}, 1fr)`, maxWidth: '420px' }}
          onMouseLeave={() => onHoverCell && onHoverCell(null)}
        >
          {matrix.map((row, i) =>
            row.map((val, j) => {
              const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
              return (
                <div
                  key={`${i}-${j}`}
                  className={`matrix-cell ${isHovered ? 'hovered' : ''} ${editable ? 'editable-cell' : ''}`}
                  style={{
                    '--cell-accent': accentColor,
                    borderColor: isHovered ? accentColor : undefined
                  }}
                  onMouseEnter={(e) => onHoverCell && onHoverCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                  onMouseMove={(e) => onHoverCell && onHoverCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                >
                  {editable ? (
                    <div className="editable-cell-inner">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={val}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value);
                          const valid = isNaN(parsed) ? 0 : Math.min(255, Math.max(0, parsed));
                          onChangeCell && onChangeCell(i, j, valid);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                            e.preventDefault();
                            onChangeCell && onChangeCell(i, j, Math.min(255, val + 5));
                          } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                            e.preventDefault();
                            onChangeCell && onChangeCell(i, j, Math.max(0, val - 5));
                          }
                        }}
                        className="matrix-cell-input"
                        style={{ color: accentColor }}
                      />
                      <div className="stepper-arrow-buttons">
                        <button 
                          className="stepper-arrow-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeCell && onChangeCell(i, j, Math.min(255, val + 10));
                          }}
                          title="Increase value (+10)"
                          type="button"
                        >
                          ▲
                        </button>
                        <button 
                          className="stepper-arrow-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeCell && onChangeCell(i, j, Math.max(0, val - 10));
                          }}
                          title="Decrease value (-10)"
                          type="button"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="matrix-cell-val" style={{ color: isHovered ? undefined : accentColor }}>
                      {val}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
