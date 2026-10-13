import React, { useState } from 'react';
import RGBExplodedView from '../components/visualizers/RGBExplodedView';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import StepWrapper from '../components/layout/StepWrapper';
import MathInspectorHUD from '../components/ui/MathInspectorHUD';

const PRESETS = {
  mosaic: {
    name: 'Vibrant Mosaic',
    grid: [
      [{ r: 239, g: 68, b: 68 }, { r: 245, g: 158, b: 11 }, { r: 234, g: 179, b: 8 }, { r: 34, g: 197, b: 94 }],
      [{ r: 6, g: 182, b: 212 }, { r: 59, g: 130, b: 246 }, { r: 217, g: 70, b: 239 }, { r: 244, g: 63, b: 94 }],
      [{ r: 168, g: 85, b: 247 }, { r: 249, g: 115, b: 22 }, { r: 132, g: 204, b: 22 }, { r: 20, g: 184, b: 166 }],
      [{ r: 30, g: 41, b: 89 }, { r: 15, g: 82, b: 40 }, { r: 112, g: 26, b: 47 }, { r: 255, g: 255, b: 255 }]
    ]
  },
  primary: {
    name: 'Primary Trio',
    grid: [
      [{ r: 255, g: 0, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }],
      [{ r: 255, g: 0, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 0 }],
      [{ r: 0, g: 0, b: 255 }, { r: 0, g: 0, b: 255 }, { r: 255, g: 255, b: 255 }, { r: 255, g: 255, b: 255 }],
      [{ r: 0, g: 0, b: 255 }, { r: 0, g: 0, b: 255 }, { r: 255, g: 255, b: 255 }, { r: 255, g: 255, b: 255 }]
    ]
  },
  sunset: {
    name: 'Sunset Sky',
    grid: [
      [{ r: 255, g: 90, b: 50 }, { r: 255, g: 130, b: 60 }, { r: 255, g: 180, b: 80 }, { r: 255, g: 220, b: 120 }],
      [{ r: 235, g: 70, b: 90 }, { r: 245, g: 105, b: 95 }, { r: 250, g: 145, b: 110 }, { r: 255, g: 180, b: 140 }],
      [{ r: 180, g: 40, b: 120 }, { r: 200, g: 60, b: 130 }, { r: 220, g: 85, b: 140 }, { r: 235, g: 120, b: 160 }],
      [{ r: 40, g: 25, b: 80 }, { r: 70, g: 35, b: 100 }, { r: 110, g: 45, b: 120 }, { r: 150, g: 55, b: 140 }]
    ]
  }
};

export default function Step5RGBMatrices({ onSelectStep }) {
  const [selectedPreset, setSelectedPreset] = useState('mosaic');
  const [colorGrid, setColorGrid] = useState(PRESETS.mosaic.grid);
  const [activeTab, setActiveTab] = useState('r');
  const [hoveredCell, setHoveredCell] = useState(null);

  const handleSelectPreset = (key) => {
    setSelectedPreset(key);
    setColorGrid(PRESETS[key].grid);
  };

  const handleReset = () => {
    setColorGrid(PRESETS[selectedPreset].grid);
  };

  const handleCellChange = ({ row, col, channel, value }) => {
    setColorGrid((prevGrid) =>
      prevGrid.map((rArr, i) =>
        rArr.map((cell, j) => {
          if (i === row && j === col) {
            return { ...cell, [channel]: value };
          }
          return cell;
        })
      )
    );
  };

  const getFilteredColorGrid = () => {
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
  };

  const getCanvasTitle = () => {
    if (activeTab === 'r') return 'Red Channel Image (M_R Plane)';
    if (activeTab === 'g') return 'Green Channel Image (M_G Plane)';
    if (activeTab === 'b') return 'Blue Channel Image (M_B Plane)';
    return 'Composite Color Image (Recombined)';
  };

  const controls = (
    <div className="control-bar-inner" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
      {/* Row 1: Channel plane selection */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="control-bar-label" style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Channel Plane:
          </span>
          <div className="preset-pills-row" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              className={`preset-pill-btn ${activeTab === 'r' ? 'active' : ''}`}
              onClick={() => setActiveTab('r')}
              type="button"
            >
              <span className="color-dot" style={{ background: '#EF4444' }} />
              <span>Red (M_R)</span>
            </button>
            <button
              className={`preset-pill-btn ${activeTab === 'g' ? 'active' : ''}`}
              onClick={() => setActiveTab('g')}
              type="button"
            >
              <span className="color-dot" style={{ background: '#10B981' }} />
              <span>Green (M_G)</span>
            </button>
            <button
              className={`preset-pill-btn ${activeTab === 'b' ? 'active' : ''}`}
              onClick={() => setActiveTab('b')}
              type="button"
            >
              <span className="color-dot" style={{ background: '#3B82F6' }} />
              <span>Blue (M_B)</span>
            </button>
            <button
              className={`preset-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
              type="button"
            >
              <span className="color-dot" style={{ background: 'var(--text-primary)' }} />
              <span>All 3 Channels</span>
            </button>
          </div>
        </div>

        {/* Row 2: Presets & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="control-bar-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Preset:
          </span>
          <div className="preset-pills-row" style={{ display: 'flex', gap: '0.3rem' }}>
            {Object.entries(PRESETS).map(([key, item]) => (
              <button
                key={key}
                className={`preset-pill-btn ${selectedPreset === key ? 'active' : ''}`}
                onClick={() => handleSelectPreset(key)}
                type="button"
                style={{ fontSize: '0.74rem' }}
              >
                <span>{item.name}</span>
              </button>
            ))}
            <button
              className="preset-pill-btn"
              onClick={handleReset}
              type="button"
              title="Reset current palette to initial values"
              style={{ fontSize: '0.74rem', opacity: 0.8 }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
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
      <div className="workspace-duo-stage">
        <PixelCanvas
          colorGrid={getFilteredColorGrid()}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          title={getCanvasTitle()}
        />
        <RGBExplodedView
          colorGrid={colorGrid}
          activeTab={activeTab}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          onChangeCell={handleCellChange}
        />
      </div>

      {hoveredCell && hoveredPixel && (
        <MathInspectorHUD
          cell={hoveredCell}
          formula={`Tensor slice at [${hoveredCell.row}, ${hoveredCell.col}]: R=${hoveredPixel.r}, G=${hoveredPixel.g}, B=${hoveredPixel.b}`}
          result={`Active plane value: ${
            activeTab === 'r'
              ? hoveredPixel.r
              : activeTab === 'g'
              ? hoveredPixel.g
              : activeTab === 'b'
              ? hoveredPixel.b
              : `[${hoveredPixel.r}, ${hoveredPixel.g}, ${hoveredPixel.b}]`
          }`}
          note="Click any cell in the matrix to adjust channel intensity live"
        />
      )}
    </StepWrapper>
  );
}
