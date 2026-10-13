import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES, FEATURES } from '../config/features';

export default function CurriculumScreen({ onSelectStep }) {
  return (
    <div className="curriculum-page-container">
      {/* Header with clear, simple, inviting title and subtitle */}
      <div className="curriculum-masthead">
        <h1 className="curriculum-title">Learning Path</h1>
        <p className="curriculum-subtitle">
          A clear, step-by-step journey through visual linear algebra. Discover how numbers become pixels, colors, shapes, and optical reflections through {FEATURES.length} interactive experiments.
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
                <div className="chapter-num-box">
                  <span>0{idx + 1}</span>
                </div>
                <div className="chapter-meta">
                  <div className="chapter-tag-row">
                    <span className="chapter-cat-label">{cat.label}</span>
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
                      whileHover={{ y: -3, borderColor: 'var(--border-hover)' }}
                      onClick={() => onSelectStep(feat.stepNumber)}
                    >
                      <div className="step-item-top">
                        <div className="step-icon-bubble">
                          <Icon size={16} />
                        </div>
                        <span className="step-item-number">Module {feat.code}</span>
                      </div>

                      <h3 className="step-item-title">{feat.title}</h3>

                      <div className="step-item-formula-box">
                        <code>{feat.formula}</code>
                      </div>

                      <div className="step-item-footer">
                        <span>Open Experiment</span>
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
