import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowRight, Layers, Cpu, Variable, Activity } from 'lucide-react';
import { COMING_SOON_TOPICS } from '../config/features';

export default function RoadmapScreen() {
  return (
    <div className="roadmap-page-container">
      {/* Header */}
      <div className="roadmap-masthead">
        <div className="roadmap-badge-pill">
          <Lock size={12} className="text-amber-400" />
          <span>Product Roadmap</span>
        </div>
        <h1 className="roadmap-title">Advanced Mathematics</h1>
        <p className="roadmap-subtitle">
          "Go beyond visual intuition." These deeper multilinear algebra and numerical computing modules are currently in active research & development.
        </p>
      </div>

      {/* Grid of Coming Soon Modules */}
      <div className="roadmap-cards-grid">
        {COMING_SOON_TOPICS.map((topic, idx) => {
          const Icon = topic.icon;
          return (
            <motion.div
              key={topic.id}
              className="roadmap-card glass-level-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              whileHover={{ y: -3, borderColor: 'rgba(245, 158, 11, 0.3)' }}
            >
              <div className="roadmap-card-top">
                <div className="roadmap-icon-box">
                  <Icon size={18} className="text-amber-400" />
                </div>
                <span className="roadmap-status-tag">
                  <Lock size={10} />
                  <span>Coming Soon</span>
                </span>
              </div>

              <div className="roadmap-category-label">{topic.category}</div>
              <h3 className="roadmap-topic-title">{topic.title}</h3>
              <p className="roadmap-topic-desc">{topic.description}</p>

              <div className="roadmap-formula-preview">
                <div className="formula-blur-overlay" />
                <code>{topic.formula}</code>
              </div>

              <div className="roadmap-card-footer">
                <span className="text-xs text-muted">Module in Laboratory R&D</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
