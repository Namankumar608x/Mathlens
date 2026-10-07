import React, { useState } from 'react';
import { Square, CheckSquare, Grid, TrendingUp, Sparkles } from 'lucide-react';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import MatrixGrid from '../components/matrix/MatrixGrid';
import StepWrapper from '../components/layout/StepWrapper';
import MathInspectorHUD from '../components/ui/MathInspectorHUD';

const PRESETS = {
  black: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  white: [
    [255, 255, 255, 255],
    [255, 255, 255, 255],
    [255, 255, 255, 255],
    [255, 255, 255, 255]
  ],
  checkerboard: [
    [0, 255, 0, 255],
    [255, 0, 255, 0],
    [0, 255, 0, 255],
    [255, 0, 255, 0]
  ],
  gradient: [
    [0, 50, 100, 150],
    [50, 100, 150, 200],
    [100, 150, 200, 230],
    [150, 200, 230, 255]
  ]
};

export default function Step1Grayscale({ onSelectStep }) {
  const [matrix, setMatrix] = useState(PRESETS.black);
  const [activePreset, setActivePreset] = useState('black');
  const [hoveredCell, setHoveredCell] = useState(null);

  const handleSelectPreset = (key) => {
    setActivePreset(key);
    setMatrix(PRESETS[key]);
  };

  const controls = (
    <div className="control-bar-inner">
      <span className="control-bar-label">Matrix Presets:</span>
      <div className="preset-pills-row">
        <button
          className={`preset-pill-btn ${activePreset === 'black' ? 'active' : ''}`}
          onClick={() => handleSelectPreset('black')}
          type="button"
        >
          <Square size={14} />
          <span>Black (0)</span>
        </button>
        <button
          className={`preset-pill-btn ${activePreset === 'white' ? 'active' : ''}`}
          onClick={() => handleSelectPreset('white')}
          type="button"
        >
          <CheckSquare size={14} />
          <span>White (255)</span>
        </button>
        <button
          className={`preset-pill-btn ${activePreset === 'checkerboard' ? 'active' : ''}`}
          onClick={() => handleSelectPreset('checkerboard')}
          type="button"
        >
          <Grid size={14} />
          <span>Checkerboard</span>
        </button>
        <button
          className={`preset-pill-btn ${activePreset === 'gradient' ? 'active' : ''}`}
          onClick={() => handleSelectPreset('gradient')}
          type="button"
        >
          <TrendingUp size={14} />
          <span>Gradient</span>
        </button>
      </div>
    </div>
  );

  const hoveredVal = hoveredCell ? matrix[hoveredCell.row]?.[hoveredCell.col] : null;

  return (
    <StepWrapper
      stepNumber={1}
      title="From Pixels to Matrices"
      subtitle="Every digital image is stored as a 2D numerical array (a matrix). In an 8-bit grayscale image, each element represents a pixel intensity from 0 (Pure Black) to 255 (Pure White)."
      formula="I(x, y) \in [0, 255] \subset \mathbb{Z}"
      basicHint="Think of an image like a grid of tiny light bulbs: 0 means completely OFF, and 255 means fully ON."
      advancedFormula="I: \Omega \to \{0, 1, \dots, 255\}, \quad \Omega = \{0, \dots, H-1\} \times \{0, \dots, W-1\}"
      controls={controls}
      onPrev={() => onSelectStep && onSelectStep(1)}
      onNext={() => onSelectStep && onSelectStep(2)}
      onReset={() => handleSelectPreset('black')}
      insightTitle="The Discrete Image Representation"
      insightBody="When you zoom into any digital photo, curves disappear into square picture elements ('pixels'). Computer vision algorithms never 'see' pictures—they operate strictly on 2D mathematical arrays of integer numbers."
    >
      <div className="workspace-duo-stage">
        <PixelCanvas
          matrix={matrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          title="Digital Canvas (4×4 Pixels)"
        />
        <MatrixGrid
          matrix={matrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          title="Numerical Matrix A"
        />
      </div>

      {hoveredCell && (
        <MathInspectorHUD
          cell={hoveredCell}
          formula={`A[${hoveredCell.row}, ${hoveredCell.col}]`}
          result={`${hoveredVal} / 255 intensity`}
          note={hoveredVal === 0 ? "Completely unlit black pixel" : hoveredVal === 255 ? "Fully saturated white pixel" : "Intermediate shade of gray"}
        />
      )}
    </StepWrapper>
  );
}
