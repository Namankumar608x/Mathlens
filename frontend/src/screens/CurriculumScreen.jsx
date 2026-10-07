import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, ArrowRight, Sparkles, Layers, Compass, Blend } from 'lucide-react';
import { CATEGORIES, FEATURES } from '../config/features';

export default function CurriculumScreen({ onSelectStep }) {
  return (
    <div className="curriculum-page-container">
      {/* Header */}
      <div className="curriculum-masthead">
        <span className="curriculum-badge">Interactive Roadmap</span>
        <h1 className="curriculum-title">Curriculum & Pedagogical Journey</h1>
        <p className="curriculum-subtitle">
          From elementary discrete pixel arrays to multilinear algebra and singular geometry. Follow this 14-step roadmap to master visual linear algebra.
        </p>
      </div>

      {/* Chapters */}
      <div className="curriculum-chapters-list">
        {CATEGORIES.map((cat, idx) => {
          const catFeatures = FEATURES.filter(f => f.category === cat.id);
          const CatIcon = cat.icon;

          return (
            <div key={cat.id} className="curriculum-chapter-card glass-level-2">
              <div className="chapter-header-row">
                <div className="chapter-num-box" style={{ borderColor: cat.color }}>
                  <span>0{idx + 1}</span>
                </div>
                <div className="chapter-meta">
                  <div className="chapter-tag-row">
                    <span className="chapter-cat-label" style={{ color: cat.color }}>{cat.label}</span>
                    <span className="chapter-count-label">{catFeatures.length} Modules</span>
                  </div>
                  <h2 className="chapter-headline">{cat.description}</h2>
                </div>
              </div>

              <div className="chapter-steps-grid">
                {catFeatures.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <motion.div
                      key={feat.id}
                      className="chapter-step-item glass-level-1"
                      whileHover={{ y: -3, borderColor: 'rgba(34, 211, 238, 0.35)' }}
                      onClick={() => onSelectStep(feat.stepNumber)}
                    >
                      <div className="step-item-top">
                        <div className="step-icon-bubble">
                          <Icon size={16} />
                        </div>
                        <span className="step-item-number">Step {feat.stepNumber}</span>
                      </div>

                      <h3 className="step-item-title">{feat.title}</h3>
                      <p className="step-item-summary">{feat.summary}</p>

                      <div className="step-item-formula-box">
                        <code>{feat.formula}</code>
                      </div>

                      <div className="step-item-footer">
                        <span>Launch Lab</span>
                        <ArrowRight size={14} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
