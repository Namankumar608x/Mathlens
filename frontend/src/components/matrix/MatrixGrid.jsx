import React from 'react';

export default function MatrixGrid({
  matrix,
  hoveredCell,
  onHoverCell,
  editable = false,
  onChangeCell,
  accentColor = 'var(--accent-cyan, #22D3EE)',
  title = "Matrix Representation A"
}) {
  if (!matrix || !matrix.length) return null;
  const rows = matrix.length;
  const cols = matrix[0].length;

  return (
    <div className="matrix-grid-card glass-level-2">
      <div className="matrix-header">
        <div className="matrix-header-title-row">
          <span className="matrix-bracket-symbol">[</span>
          <h3 className="matrix-title-text">{title}</h3>
          <span className="matrix-bracket-symbol">]</span>
        </div>
        <span 
          className="matrix-dims-badge"
          style={{ 
            borderColor: `${accentColor}40`, 
            color: accentColor, 
            background: `${accentColor}12` 
          }}
        >
          {rows} × {cols}
        </span>
      </div>

      <div className="matrix-bracket-container">
        <div className="matrix-left-bracket" />
        <div 
          className="matrix-grid-layout"
          style={{ 
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
          }}
          onMouseLeave={() => onHoverCell && onHoverCell(null)}
        >
          {matrix.map((row, i) =>
            row.map((val, j) => {
              const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
              const isSameRow = hoveredCell && hoveredCell.row === i;
              const isSameCol = hoveredCell && hoveredCell.col === j;

              return (
                <div
                  key={`${i}-${j}`}
                  className={`matrix-cell ${isHovered ? 'hovered' : ''} ${isSameRow ? 'same-row' : ''} ${isSameCol ? 'same-col' : ''} ${editable ? 'editable-cell' : ''}`}
                  style={{
                    '--cell-accent': accentColor,
                    borderColor: isHovered ? accentColor : undefined
                  }}
                  onMouseEnter={(e) => onHoverCell && onHoverCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                  onMouseMove={(e) => onHoverCell && onHoverCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                  onTouchStart={(e) => {
                    if (e.touches && e.touches[0]) {
                      onHoverCell && onHoverCell({ row: i, col: j, x: e.touches[0].clientX, y: e.touches[0].clientY });
                    }
                  }}
                >
                  {editable ? (
                    <div className="editable-cell-inner">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={val}
                        aria-label={`Cell ${i}, ${j}`}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10);
                          const valid = isNaN(parsed) ? 0 : Math.min(255, Math.max(0, parsed));
                          onChangeCell && onChangeCell(i, j, valid);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            onChangeCell && onChangeCell(i, j, Math.min(255, val + 5));
                          } else if (e.key === 'ArrowDown') {
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
                          aria-label="Increase value"
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
                          aria-label="Decrease value"
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
                  {isHovered && (
                    <span className="matrix-cell-coord-indicator">
                      [{i},{j}]
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="matrix-right-bracket" />
      </div>

      <div className="matrix-footer-hint">
        {editable ? (
          <span>Click to edit • Use <kbd>▲</kbd> <kbd>▼</kbd> keys or steppers (0–255)</span>
        ) : (
          <span>Hover cell to highlight matching pixel on canvas</span>
        )}
      </div>
    </div>
  );
}
