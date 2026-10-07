import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function StepFooter({ stepNumber, onSelectStep }) {
  const currentNumStr = stepNumber < 10 ? `0${stepNumber}` : `${stepNumber}`;

  return (
    <footer className="step-navigation-footer glass-level-2" style={{ marginTop: '2.5rem' }}>
      <button
        className="step-footer-nav-btn prev"
        onClick={() => onSelectStep && onSelectStep(stepNumber - 1)}
        disabled={stepNumber <= 1}
        type="button"
      >
        <ChevronLeft size={16} />
        <span>Previous Experiment</span>
      </button>

      <div className="step-footer-middle-indicator">
        <span className="indicator-curr">{currentNumStr}</span>
        <span className="indicator-sep">/</span>
        <span className="indicator-tot">14</span>
      </div>

      <button
        className="step-footer-nav-btn next"
        onClick={() => onSelectStep && onSelectStep(stepNumber + 1)}
        disabled={stepNumber >= 14}
        type="button"
      >
        <span>Next Experiment</span>
        <ChevronRight size={16} />
      </button>
    </footer>
  );
}
