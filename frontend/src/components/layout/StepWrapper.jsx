import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Maximize2
} from 'lucide-react';
import { getFeatureByStep } from '../../config/features';

export default function StepWrapper({
  stepNumber,
  title,
  subtitle,
  formula,
  basicHint,
  advancedFormula,
  currentLevel = 'basic',
  controls,
  children,
  insightTitle = "What is Happening Here?",
  insightBody,
  onPrev,
  onNext,
  onReset
}) {
  const [copied, setCopied] = useState(false);
  const [isInsightOpen, setIsInsightOpen] = useState(true);
  const feature = getFeatureByStep(stepNumber);

  const handleCopyFormula = () => {
    const textToCopy = formula || advancedFormula || feature?.formula || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="step-wrapper-container">
      {/* 1. Header Card (Glass Level 2) */}
      <div className="step-header-card glass-level-2">
        <div className="step-header-top-row">
          <div className="step-badge-group">
            <span className="step-number-pill">0{stepNumber}</span>
            <span className="step-category-pill">{feature?.categoryLabel || 'Interactive Lab'}</span>
          </div>

          <div className="step-actions-group">
            {onReset && (
              <button
                className="step-action-btn"
                onClick={onReset}
                title="Reset to default preset"
                type="button"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}

            {(formula || advancedFormula) && (
              <button
                className="step-action-btn"
                onClick={handleCopyFormula}
                title="Copy LaTeX mathematical formula"
                type="button"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy Formula'}</span>
              </button>
            )}
          </div>
        </div>

        <h1 className="step-main-title">{title || feature?.title}</h1>
        <p className="step-main-description">{subtitle || feature?.summary}</p>

        {/* Dynamic Formula / Intuition Ribbon */}
        <div className="step-formula-ribbon">
          <div className="ribbon-tag">
            <Sparkles size={12} className="text-cyan-400" />
            <span>{currentLevel === 'advanced' ? 'Formal Linear Algebra' : 'Core Intuition'}</span>
          </div>
          <div className="ribbon-formula">
            <code>
              {currentLevel === 'advanced' 
                ? (advancedFormula || formula || feature?.formula)
                : (basicHint || formula || feature?.formula)
              }
            </code>
          </div>
        </div>
      </div>

      {/* 2. Interactive Control Bar (if provided) */}
      {controls && (
        <div className="step-controls-bar glass-level-2">
          {controls}
        </div>
      )}

      {/* 3. Central Interactive Stage */}
      <div className="step-stage-workspace">
        {children}
      </div>

      {/* 4. Insight Card: "What is happening?" */}
      {insightBody && (
        <div className="step-insight-card glass-level-2">
          <button
            className="insight-toggle-header"
            onClick={() => setIsInsightOpen(!isInsightOpen)}
            type="button"
          >
            <div className="insight-title-wrap">
              <Lightbulb size={17} className="text-amber-400" />
              <h3 className="insight-title">{insightTitle}</h3>
            </div>
            <span className="insight-toggle-hint">
              {isInsightOpen ? 'Collapse' : 'Expand'}
            </span>
          </button>

          {isInsightOpen && (
            <motion.div
              className="insight-body-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {typeof insightBody === 'string' ? (
                <p className="insight-text">{insightBody}</p>
              ) : (
                insightBody
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* 5. Pedagogical Stepper Footer */}
      <div className="step-navigation-footer glass-level-2">
        <button
          className="step-footer-nav-btn prev"
          onClick={onPrev}
          disabled={stepNumber <= 1}
          type="button"
        >
          <ChevronLeft size={16} />
          <span>Previous Experiment</span>
        </button>

        <div className="step-footer-middle-indicator">
          <span className="indicator-curr">0{stepNumber}</span>
          <span className="indicator-sep">/</span>
          <span className="indicator-tot">14</span>
        </div>

        <button
          className="step-footer-nav-btn next"
          onClick={onNext}
          disabled={stepNumber >= 14}
          type="button"
        >
          <span>Next Experiment</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
