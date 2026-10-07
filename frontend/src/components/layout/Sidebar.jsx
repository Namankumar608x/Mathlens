import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
  Home,
  Lock,
  Layers
} from 'lucide-react';
import { CATEGORIES, FEATURES } from '../../config/features';

export default function Sidebar({
  currentStep,
  onSelectStep,
  currentView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
  onOpenCommandPalette
}) {
  const pixelMatrixFeatures = FEATURES.filter(f => f.category === 'pixel-matrix');
  const transformFeatures = FEATURES.filter(f => f.category === 'transformations');
  const visualLabFeatures = FEATURES.filter(f => f.category === 'visual-labs');

  return (
    <aside className={`math-sidebar glass-level-1 ${isCollapsed ? 'collapsed' : ''}`} aria-label="Main sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-row">
        <button 
          className="sidebar-brand-btn"
          onClick={() => onSelectView('home')}
          title="Return to MathLens Home"
        >
          <div className="sidebar-brand-icon-box">
            <span className="brand-lambda">◈</span>
          </div>
          {!isCollapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">MathLens</span>
              <span className="sidebar-brand-badge">Visual Labs</span>
            </div>
          )}
        </button>

        <button
          className="sidebar-collapse-toggle"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar ( [ )" : "Collapse sidebar ( [ )"}
          aria-label="Toggle sidebar collapse"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Quick Search Action */}
      <div className="sidebar-search-wrap">
        <button 
          className="sidebar-quick-search-btn"
          onClick={onOpenCommandPalette}
          title="Search all modules (⌘K)"
        >
          <Search size={14} className="text-cyan-400" />
          {!isCollapsed && <span className="sidebar-search-label">Quick Search...</span>}
          {!isCollapsed && <kbd className="sidebar-kbd">⌘K</kbd>}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav-scroll custom-scrollbar">
        {/* Home */}
        <div className="sidebar-nav-group">
          <button
            className={`sidebar-nav-item ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => onSelectView('home')}
            title="Overview & Home"
          >
            {currentView === 'home' && (
              <motion.div
                layoutId="activeSidebarPill"
                className="sidebar-active-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <Home size={16} className="sidebar-item-icon" />
            {!isCollapsed && <span className="sidebar-item-text">Overview</span>}
          </button>
        </div>

        {/* Category 1: Pixel & Matrix (01 - 06) */}
        <div className="sidebar-nav-group">
          {!isCollapsed && <div className="sidebar-group-heading">Pixel &amp; Matrix</div>}
          {pixelMatrixFeatures.map(feat => {
            const isActive = currentView === 'module' && currentStep === feat.stepNumber;
            const Icon = feat.icon;
            return (
              <button
                key={feat.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectStep(feat.stepNumber);
                  onSelectView('module');
                }}
                title={`${feat.stepNumber < 10 ? `0${feat.stepNumber}` : feat.stepNumber} ${feat.title}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="sidebar-active-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon size={16} className="sidebar-item-icon" />
                {!isCollapsed && (
                  <div className="sidebar-item-label-wrap">
                    <span className="sidebar-item-text">{feat.shortTitle}</span>
                    <span className="sidebar-item-num">{feat.stepNumber < 10 ? `0${feat.stepNumber}` : feat.stepNumber}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Category 2: Transformations (07) */}
        <div className="sidebar-nav-group">
          {!isCollapsed && <div className="sidebar-group-heading">Transformations</div>}
          {transformFeatures.map(feat => {
            const isActive = currentView === 'module' && currentStep === feat.stepNumber;
            const Icon = feat.icon;
            return (
              <button
                key={feat.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectStep(feat.stepNumber);
                  onSelectView('module');
                }}
                title={`${feat.stepNumber < 10 ? `0${feat.stepNumber}` : feat.stepNumber} ${feat.title}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="sidebar-active-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon size={16} className="sidebar-item-icon" />
                {!isCollapsed && (
                  <div className="sidebar-item-label-wrap">
                    <span className="sidebar-item-text">{feat.shortTitle}</span>
                    <span className="sidebar-item-num">0{feat.stepNumber}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Category 3: Visual Labs (08 - 14) */}
        <div className="sidebar-nav-group">
          {!isCollapsed && (
            <div className="sidebar-group-heading visual-labs-heading">
              <span>Visual Labs</span>
              <span className="visual-labs-tag">08–14</span>
            </div>
          )}
          {visualLabFeatures.map(feat => {
            const isActive = currentView === 'module' && currentStep === feat.stepNumber;
            const Icon = feat.icon;
            return (
              <button
                key={feat.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectStep(feat.stepNumber);
                  onSelectView('module');
                }}
                title={`${feat.stepNumber < 10 ? `0${feat.stepNumber}` : feat.stepNumber} ${feat.title}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="sidebar-active-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon size={16} className="sidebar-item-icon" />
                {!isCollapsed && (
                  <div className="sidebar-item-label-wrap">
                    <span className="sidebar-item-text">{feat.shortTitle}</span>
                    <span className="sidebar-item-num">{feat.stepNumber < 10 ? `0${feat.stepNumber}` : feat.stepNumber}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Coming Soon: Advanced Mathematics */}
        <div className="sidebar-nav-group">
          {!isCollapsed && <div className="sidebar-group-heading">Roadmap</div>}
          <button
            className={`sidebar-nav-item ${currentView === 'roadmap' ? 'active' : ''}`}
            onClick={() => onSelectView('roadmap')}
            title="Coming Soon: Advanced Mathematics"
          >
            {currentView === 'roadmap' && (
              <motion.div
                layoutId="activeSidebarPill"
                className="sidebar-active-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <Lock size={15} className="sidebar-item-icon text-amber-400" />
            {!isCollapsed && (
              <div className="sidebar-item-label-wrap">
                <span className="sidebar-item-text">Advanced Math</span>
                <span className="sidebar-coming-tag">Soon</span>
              </div>
            )}
          </button>
        </div>

        {/* Explore Links: Learn & About */}
        <div className="sidebar-nav-group sidebar-bottom-links">
          {!isCollapsed && <div className="sidebar-group-heading">Explore</div>}
          <button
            className={`sidebar-nav-item ${currentView === 'learn' ? 'active' : ''}`}
            onClick={() => onSelectView('learn')}
            title="Curriculum Roadmap"
          >
            {currentView === 'learn' && (
              <motion.div
                layoutId="activeSidebarPill"
                className="sidebar-active-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <BookOpen size={16} className="sidebar-item-icon" />
            {!isCollapsed && <span className="sidebar-item-text">Curriculum</span>}
          </button>

          <button
            className={`sidebar-nav-item ${currentView === 'about' ? 'active' : ''}`}
            onClick={() => onSelectView('about')}
            title="About Platform"
          >
            {currentView === 'about' && (
              <motion.div
                layoutId="activeSidebarPill"
                className="sidebar-active-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <Info size={16} className="sidebar-item-icon" />
            {!isCollapsed && <span className="sidebar-item-text">About</span>}
          </button>
        </div>
      </nav>

      {/* Footer Status Box */}
      {!isCollapsed && (
        <div className="sidebar-status-box">
          <div className="status-indicator-dot pulse" />
          <span className="status-text">14 Visual Labs Active</span>
        </div>
      )}
    </aside>
  );
}
