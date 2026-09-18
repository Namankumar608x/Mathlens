import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RGBExplodedView from '../components/visualizers/RGBExplodedView';
import PixelCanvas from '../components/visualizers/PixelCanvas';

const SAMPLE_COLOR_GRID = [
  [{ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 0, b: 255 }, { r: 128, g: 0, b: 128 }],
  [{ r: 255, g: 255, b: 0 }, { r: 0, g: 255, b: 255 }, { r: 255, g: 0, b: 255 }, { r: 128, g: 128, b: 128 }],
  [{ r: 200, g: 50, b: 50 }, { r: 50, g: 200, b: 50 }, { r: 50, g: 50, b: 200 }, { r: 255, g: 255, b: 255 }],
  [{ r: 0, g: 0, b: 0 }, { r: 100, g: 100, b: 100 }, { r: 180, g: 90, b: 40 }, { r: 90, g: 180, b: 240 }]
];

export default function Step5RGBMatrices() {
  const [activeTab, setActiveTab] = useState('r');
  const [hoveredCell, setHoveredCell] = useState(null);

  const getFilteredColorGrid = () => {
    if (activeTab === 'r') {
      return SAMPLE_COLOR_GRID.map(row => row.map(p => ({ r: p.r, g: 0, b: 0 })));
    }
    if (activeTab === 'g') {
      return SAMPLE_COLOR_GRID.map(row => row.map(p => ({ r: 0, g: p.g, b: 0 })));
    }
    if (activeTab === 'b') {
      return SAMPLE_COLOR_GRID.map(row => row.map(p => ({ r: 0, g: 0, b: p.b })));
    }
    return SAMPLE_COLOR_GRID;
  };

  const getCanvasTitle = () => {
    if (activeTab === 'r') return "Red Channel Image (R-Only)";
    if (activeTab === 'g') return "Green Channel Image (G-Only)";
    if (activeTab === 'b') return "Blue Channel Image (B-Only)";
    return "Recombined RGB Colour Image";
  };

  return (
    <motion.div 
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="step-header-box">
        <h2 className="step-heading">Step 5: RGB Channel Matrix Decomposition</h2>
        <p className="step-description">
          A full colour image is represented as a triple tensor <strong>(R, G, B)</strong> using three separate 2D matrices: <code>R_matrix</code>, <code>G_matrix</code>, and <code>B_matrix</code>.
        </p>
      </div>

      <div className="side-by-side-container" style={{ alignItems: 'stretch' }}>
        <PixelCanvas
          colorGrid={getFilteredColorGrid()}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          pixelSize={72}
          title={getCanvasTitle()}
        />
        <RGBExplodedView
          colorGrid={SAMPLE_COLOR_GRID}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
        />
      </div>
    </motion.div>
  );
}
