import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import MatrixGrid from '../components/matrix/MatrixGrid';
import StepWrapper from '../components/layout/StepWrapper';
import MathInspectorHUD from '../components/ui/MathInspectorHUD';
import { createEmptyMatrix } from '../core/mathEngine';

export default function Step2CellEditing({ onSelectStep }) {
  const [matrix, setMatrix] = useState([
    [0, 50, 100, 150],
    [50, 100, 150, 200],
    [100, 150, 200, 220],
    [150, 200, 220, 255]
  ]);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleCellChange = (r, c, val) => {
    if (isAnimating && animRef.current) {
      cancelAnimationFrame(animRef.current);
      setIsAnimating(false);
    }
    const next = matrix.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrix(next);
  };

  const handleAnimateTransition = () => {
    if (isAnimating) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    let currentVal = 0;
    let lastTime = performance.now();

    const animate = (now) => {
      if (now - lastTime >= 12) {
        currentVal += 1;
        lastTime = now;
        
        if (currentVal > 255) {
          currentVal = 255;
          setMatrix(prev => prev.map(row => row.map(() => 255)));
          setIsAnimating(false);
          return;
        }
        setMatrix(prev => prev.map(row => row.map(() => currentVal)));
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  };

  const handleReset = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsAnimating(false);
    setMatrix(createEmptyMatrix(4, 4, 128));
  };

  const controls = (
    <div className="control-bar-inner">
      <span className="control-bar-label">Interactive Actions:</span>
      <div className="preset-pills-row">
        <button
          className={`preset-pill-btn ${isAnimating ? 'active' : ''}`}
          onClick={handleAnimateTransition}
          type="button"
        >
          {isAnimating ? <Pause size={14} /> : <Play size={14} />}
          <span>{isAnimating ? 'Pause Animation' : 'Auto Ramp (0 → 255)'}</span>
        </button>

        <button
          className="preset-pill-btn"
          onClick={handleReset}
          type="button"
        >
          <RotateCcw size={14} />
          <span>Reset to Mid-Gray (128)</span>
        </button>
      </div>
    </div>
  );

  const hoveredVal = hoveredCell ? matrix[hoveredCell.row]?.[hoveredCell.col] : null;

  return (
    <StepWrapper
      stepNumber={2}
      title="Change Individual Matrix Elements"
      subtitle="Directly modify matrix values to observe instant real-time changes in the image."
      formula="A[i, j] ← v,  v ∈ [0, 255]"
      basicHint="Try changing a single cell using your keyboard or the stepper arrows and watch only that specific pixel change shade."
      advancedFormula="ΔI(x₀, y₀) = v_new - v_old,  supp(ΔI) = {(x₀, y₀)}"
      controls={controls}
      onPrev={() => onSelectStep && onSelectStep(1)}
      onNext={() => onSelectStep && onSelectStep(3)}
    >
      <div className="workspace-duo-stage">
        <PixelCanvas
          matrix={matrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          title="Live Image Pixel Canvas"
        />
        <MatrixGrid
          matrix={matrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          editable={true}
          onChangeCell={handleCellChange}
          title="Editable Numerical Matrix A"
        />
      </div>

      {hoveredCell && (
        <MathInspectorHUD
          cell={hoveredCell}
          formula={`A[${hoveredCell.row}, ${hoveredCell.col}]`}
          result={`${hoveredVal} / 255`}
          note="Click and type a new integer or use the stepper arrows to modify"
        />
      )}
    </StepWrapper>
  );
}
