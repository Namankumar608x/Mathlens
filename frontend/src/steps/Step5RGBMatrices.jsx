import React, { useState } from 'react';
import RGBExplodedView from '../components/visualizers/RGBExplodedView';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import StepWrapper from '../components/layout/StepWrapper';
import MathInspectorHUD from '../components/ui/MathInspectorHUD';

const INITIAL_COLOR_GRID = [
  [{ r: 255, g: 250, b: 245 }, { r: 240, g: 235, b: 230 }, { r: 225, g: 220, b: 215 }, { r: 210, g: 205, b: 200 }],
  [{ r: 195, g: 190, b: 185 }, { r: 180, g: 175, b: 170 }, { r: 165, g: 160, b: 155 }, { r: 150, g: 145, b: 140 }],
  [{ r: 135, g: 130, b: 125 }, { r: 120, g: 115, b: 110 }, { r: 105, g: 100, b: 95 }, { r: 90, g: 85, b: 80 }],
  [{ r: 75, g: 70, b: 65 }, { r: 60, g: 55, b: 50 }, { r: 45, g: 40, b: 35 }, { r: 30, g: 25, b: 20 }]
];

export default function Step5RGBMatrices({ onSelectStep }) {
  const [colorGrid, setColorGrid] = useState(INITIAL_COLOR_GRID);
  const [activeTab, setActiveTab] = useState('r');
  const [hoveredCell, setHoveredCell] = useState(null);

  const handleCellChange = ({ row, col, channel, value }) => {
    setColorGrid(prevGrid => {
      return prevGrid.map((rArr, i) =>
        rArr.map((cell, j) => {
          if (i === row && j === col) {
            return { ...cell, [channel]: value };
          }
          return cell;
        })
      );
    });
  };

  const getFilteredColorGrid = () => {
    if (activeTab === 'r') {
      return colorGrid.map(row => row.map(p => ({ r: p.r, g: 0, b: 0 })));
    }
    if (activeTab === 'g') {
      return colorGrid.map(row => row.map(p => ({ r: 0, g: p.g, b: 0 })));
    }
    if (activeTab === 'b') {
      return colorGrid.map(row => row.map(p => ({ r: 0, g: 0, b: p.b })));
    }
    return colorGrid;
  };

  const getCanvasTitle = () => {
    if (activeTab === 'r') return "Red Channel Image (R-Only)";
    if (activeTab === 'g') return "Green Channel Image (G-Only)";
    if (activeTab === 'b') return "Blue Channel Image (B-Only)";
    return "Recombined Composite RGB Image";
  };

  const controls = (
    <div className="control-bar-inner">
      <span className="control-bar-label">View Channel Plane:</span>
      <div className="preset-pills-row">
        <button
          className={`preset-pill-btn ${activeTab === 'r' ? 'active' : ''}`}
          onClick={() => setActiveTab('r')}
          type="button"
        >
          <span className="color-dot bg-red-500" />
          <span>Red Plane (M_R)</span>
        </button>
        <button
          className={`preset-pill-btn ${activeTab === 'g' ? 'active' : ''}`}
          onClick={() => setActiveTab('g')}
          type="button"
        >
          <span className="color-dot bg-emerald-500" />
          <span>Green Plane (M_G)</span>
        </button>
        <button
          className={`preset-pill-btn ${activeTab === 'b' ? 'active' : ''}`}
          onClick={() => setActiveTab('b')}
          type="button"
        >
          <span className="color-dot bg-blue-500" />
          <span>Blue Plane (M_B)</span>
        </button>
        <button
          className={`preset-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
          type="button"
        >
          <span className="color-dot bg-cyan-400" />
          <span>Composite RGB</span>
        </button>
      </div>
    </div>
  );

  const hoveredPixel = hoveredCell ? colorGrid[hoveredCell.row]?.[hoveredCell.col] : null;

  return (
    <StepWrapper
      stepNumber={5}
      title="RGB Channel Matrix Decomposition"
      subtitle="A full colour image is represented as a 3D tensor composed of three stacked 2D matrices: M_R, M_G, and M_B. Switch tabs or edit any cell to inspect individual color planes."
      formula="\mathcal{I} = (M_R, M_G, M_B) \in \mathbb{R}^{H \times W \times 3}"
      basicHint="A color photo is like 3 transparent sheets stacked together: one purely red, one purely green, and one purely blue."
      advancedFormula="\mathcal{I}_{i,j} = \sum_{c \in \{R,G,B\}} M_c(i, j) \cdot \hat{e}_c, \quad M_c \in \mathcal{M}_{H \times W}([0, 255])"
      controls={controls}
      onPrev={() => onSelectStep && onSelectStep(4)}
      onNext={() => onSelectStep && onSelectStep(6)}
      onReset={() => setColorGrid(INITIAL_COLOR_GRID)}
      insightTitle="Tensor Slicing & Channel Stacking"
      insightBody="In convolutional neural networks (CNNs) and OpenCV, this 3-channel structure is stored as an H × W × C tensor (or C × H × W in PyTorch). Computer vision models can extract edges from single channels or process all three simultaneously."
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
          onSelectTab={setActiveTab}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          onChangeCell={handleCellChange}
        />
      </div>

      {hoveredCell && hoveredPixel && (
        <MathInspectorHUD
          cell={hoveredCell}
          formula={`Tensor at [${hoveredCell.row}, ${hoveredCell.col}]: R=${hoveredPixel.r}, G=${hoveredPixel.g}, B=${hoveredPixel.b}`}
          result={`Active plane: ${activeTab === 'r' ? hoveredPixel.r : activeTab === 'g' ? hoveredPixel.g : activeTab === 'b' ? hoveredPixel.b : `[${hoveredPixel.r}, ${hoveredPixel.g}, ${hoveredPixel.b}]`}`}
          note="Click any number in the active matrix plane to edit its value live"
        />
      )}
    </StepWrapper>
  );
}
