import React, { useState, useMemo, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import RGBExplodedView from '../components/visualizers/RGBExplodedView';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import StepWrapper from '../components/layout/StepWrapper';
import MathInspectorHUD from '../components/ui/MathInspectorHUD';

const INITIAL_COLOR_GRID = [
  [{ r: 255, g: 90, b: 50 }, { r: 255, g: 130, b: 60 }, { r: 255, g: 180, b: 80 }, { r: 255, g: 220, b: 120 }],
  [{ r: 235, g: 70, b: 90 }, { r: 245, g: 105, b: 95 }, { r: 250, g: 145, b: 110 }, { r: 255, g: 180, b: 140 }],
  [{ r: 180, g: 40, b: 120 }, { r: 200, g: 60, b: 130 }, { r: 220, g: 85, b: 140 }, { r: 235, g: 120, b: 160 }],
  [{ r: 40, g: 25, b: 80 }, { r: 70, g: 35, b: 100 }, { r: 110, g: 45, b: 120 }, { r: 150, g: 55, b: 140 }]
];

export default function Step5RGBMatrices({ onSelectStep }) {
  const [colorGrid, setColorGrid] = useState(() =>
    INITIAL_COLOR_GRID.map(row => row.map(pixel => ({ ...pixel })))
  );
  const [activeTab, setActiveTab] = useState('all');
  const [hoveredCell, setHoveredCell] = useState(null);

  const handleReset = useCallback(() => {
    setColorGrid(INITIAL_COLOR_GRID.map(row => row.map(pixel => ({ ...pixel }))));
  }, []);

  const handleCellChange = useCallback(({ row, col, channel, value }) => {
    const clamped = Math.min(255, Math.max(0, Math.round(value)));
    setColorGrid((prevGrid) =>
      prevGrid.map((rArr, i) =>
        rArr.map((cell, j) => {
          if (i === row && j === col) {
            return { ...cell, [channel]: clamped };
          }
          return cell;
        })
      )
    );
  }, []);

  const handleHoverCell = useCallback((cell) => {
    setHoveredCell((prev) => {
      if (!prev && !cell) return prev;
      if (prev && cell && prev.row === cell.row && prev.col === cell.col) return prev;
      return cell;
    });
  }, []);

  const filteredColorGrid = useMemo(() => {
    if (activeTab === 'r') {
      return colorGrid.map((row) => row.map((p) => ({ r: p.r, g: 0, b: 0 })));
    }
    if (activeTab === 'g') {
      return colorGrid.map((row) => row.map((p) => ({ r: 0, g: p.g, b: 0 })));
    }
    if (activeTab === 'b') {
      return colorGrid.map((row) => row.map((p) => ({ r: 0, g: 0, b: p.b })));
    }
    return colorGrid;
  }, [colorGrid, activeTab]);

  const canvasTitle = useMemo(() => {
    if (activeTab === 'r') return 'Red Channel Image (M_R Plane)';
    if (activeTab === 'g') return 'Green Channel Image (M_G Plane)';
    if (activeTab === 'b') return 'Blue Channel Image (M_B Plane)';
    return 'Composite Color Image';
  }, [activeTab]);

  const controls = (
    <div className="control-bar-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem', width: '100%' }}>
      {/* Channel plane selection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span className="control-bar-label" style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Channel Plane:
        </span>
        <div className="preset-pills-row" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            className={`preset-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            type="button"
          >
            <span>All Channels</span>
          </button>
          <button
            className={`preset-pill-btn ${activeTab === 'r' ? 'active' : ''}`}
            onClick={() => setActiveTab('r')}
            type="button"
          >
            <span>Red (M_R)</span>
          </button>
          <button
            className={`preset-pill-btn ${activeTab === 'g' ? 'active' : ''}`}
            onClick={() => setActiveTab('g')}
            type="button"
          >
            <span>Green (M_G)</span>
          </button>
          <button
            className={`preset-pill-btn ${activeTab === 'b' ? 'active' : ''}`}
            onClick={() => setActiveTab('b')}
            type="button"
          >
            <span>Blue (M_B)</span>
          </button>
        </div>
      </div>

      {/* Reset Button (Presets removed as requested) */}
      <button
        className="preset-pill-btn"
        onClick={handleReset}
        type="button"
        title="Reset matrices and image to initial values"
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
      >
        <RotateCcw size={13} />
        <span>Reset</span>
      </button>
    </div>
  );

  const hoveredPixel = hoveredCell ? colorGrid[hoveredCell.row]?.[hoveredCell.col] : null;

  return (
    <StepWrapper
      stepNumber={5}
      title="RGB Channel Matrices Decomposition"
      subtitle="Decompose a color image into three independent 2D scalar matrices: Red, Green, and Blue."
      formula="I = (M_R, M_G, M_B) ∈ ℝ^(4 × 4 × 3)"
      basicHint="A color image is built from three 2D matrices: red intensity, green intensity, and blue intensity stacked together."
      advancedFormula="I[i, j] = M_R[i, j] · ê_R + M_G[i, j] · ê_G + M_B[i, j] · ê_B"
      controls={controls}
      onPrev={() => onSelectStep && onSelectStep(4)}
      onNext={() => onSelectStep && onSelectStep(6)}
    >
      <div className="rgb-matrices-stage">
        <PixelCanvas
          colorGrid={filteredColorGrid}
          hoveredCell={hoveredCell}
          onHoverCell={handleHoverCell}
          onClickCell={handleHoverCell}
          title={canvasTitle}
        />
        <RGBExplodedView
          colorGrid={colorGrid}
          activeTab={activeTab}
          hoveredCell={hoveredCell}
          onHoverCell={handleHoverCell}
          onChangeCell={handleCellChange}
        />
      </div>

      <MathInspectorHUD
        title="RGB Decomposition Inspector"
        cell={hoveredCell}
        formula={
          hoveredCell && hoveredPixel
            ? `Tensor slice at [${hoveredCell.row}, ${hoveredCell.col}]: R=${hoveredPixel.r}, G=${hoveredPixel.g}, B=${hoveredPixel.b}`
            : "Hover or click any cell to inspect its 3D color vector p = [R, G, B]ᵀ"
        }
        result={
          hoveredCell && hoveredPixel
            ? activeTab === 'r'
              ? `M_R = ${hoveredPixel.r}`
              : activeTab === 'g'
              ? `M_G = ${hoveredPixel.g}`
              : activeTab === 'b'
              ? `M_B = ${hoveredPixel.b}`
              : `[${hoveredPixel.r}, ${hoveredPixel.g}, ${hoveredPixel.b}]ᵀ`
            : "I = (M_R, M_G, M_B)"
        }
        note="Matrix cell edits (0–255) update both the channel matrix and recombined image live."
      />
    </StepWrapper>
  );
}
