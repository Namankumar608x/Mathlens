import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Grid,
  Compass,
  Blend,
  BookOpen,
  ChevronUp,
  Search,
  Check,
  Lock
} from 'lucide-react';
import { CATEGORIES, FEATURES } from '../../config/features';

export default function FloatingDock({
  currentStep,
  onSelectStep,
  currentView,
  onSelectView,
  onOpenCommandPalette
}) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const dockRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        setExpandedCategory(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFeature = FEATURES.find(f => f.stepNumber === currentStep);
  const currentCategory = currentView === 'module' ? activeFeature?.category : null;

  const handleCategoryClick = (catId) => {
    if (expandedCategory === catId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(catId);
    }
  };

  const getSubFeatures = (catId) => {
    return FEATURES.filter(f => f.category === catId);
  };

  return (
    <div className="floating-dock-container" ref={dockRef} aria-label="Floating feature dock">
      {/* Upward Expanding Secondary Glass Panel */}
      <AnimatePresence>
        {expandedCategory && (
          <motion.div
            className="dock-subnav-panel glass-level-3"
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          >
            <div className="dock-subnav-header">
              <span className="dock-subnav-title">
                {CATEGORIES.find(c => c.id === expandedCategory)?.label}
              </span>
              <span className="dock-subnav-hint">
                {expandedCategory === 'visual-labs' ? 'Select Visual Lab' : 'Select Foundation'}
              </span>
            </div>

            <div className="dock-subnav-grid">
              {getSubFeatures(expandedCategory).map((feat) => {
                const isSelected = currentView === 'module' && currentStep === feat.stepNumber;
                const Icon = feat.icon;
                return (
                  <motion.button
                    key={feat.id}
                    className={`dock-subnav-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      onSelectStep(feat.stepNumber);
                      onSelectView('module');
                      setExpandedCategory(null);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="dock-subnav-icon-wrap">
                      <Icon size={14} />
                    </div>
                    <div className="dock-subnav-text">
                      <span className="dock-subnav-name">{feat.shortTitle}</span>
                      <span className="dock-subnav-step">
                        {feat.stepNumber < 10 ? `0${feat.stepNumber}` : feat.stepNumber} • {feat.categoryLabel}
                      </span>
                    </div>
                    {isSelected && <Check size={14} className="dock-subnav-check" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Glass Feature Dock Bar */}
      <nav className="dock-glass-bar glass-level-2">
        {/* Home */}
        <motion.button
          className={`dock-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => {
            onSelectView('home');
            setExpandedCategory(null);
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          title="Home Overview"
        >
          {currentView === 'home' && (
            <motion.div
              layoutId="activeDockIndicator"
              className="dock-active-glow"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <Sparkles size={17} className="dock-icon text-cyan-400" />
          <span className="dock-label">Home</span>
        </motion.button>

        <div className="dock-separator" />

        {/* Pixel & Matrix */}
        <motion.button
          className={`dock-item ${currentCategory === 'pixel-matrix' ? 'active' : ''} ${expandedCategory === 'pixel-matrix' ? 'open' : ''}`}
          onClick={() => handleCategoryClick('pixel-matrix')}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          title="Pixel & Matrix (01–06)"
        >
          {currentCategory === 'pixel-matrix' && (
            <motion.div
              layoutId="activeDockIndicator"
              className="dock-active-glow"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <Grid size={17} className="dock-icon" />
          <span className="dock-label">Pixels</span>
          <ChevronUp size={11} className={`dock-arrow ${expandedCategory === 'pixel-matrix' ? 'rotated' : ''}`} />
        </motion.button>

        {/* Transformations */}
        <motion.button
          className={`dock-item ${currentCategory === 'transformations' ? 'active' : ''}`}
          onClick={() => {
            onSelectStep(7);
            onSelectView('module');
            setExpandedCategory(null);
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          title="2D Transformations (07)"
        >
          {currentCategory === 'transformations' && (
            <motion.div
              layoutId="activeDockIndicator"
              className="dock-active-glow"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <Compass size={17} className="dock-icon" />
          <span className="dock-label">Transforms</span>
        </motion.button>

        {/* Visual Labs (CRITICAL: Renamed from Advanced Ops) */}
        <motion.button
          className={`dock-item ${currentCategory === 'visual-labs' ? 'active' : ''} ${expandedCategory === 'visual-labs' ? 'open' : ''}`}
          onClick={() => handleCategoryClick('visual-labs')}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          title="Visual Labs (08–14)"
        >
          {currentCategory === 'visual-labs' && (
            <motion.div
              layoutId="activeDockIndicator"
              className="dock-active-glow"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <Blend size={17} className="dock-icon text-cyan-400" />
          <span className="dock-label">Visual Labs</span>
          <ChevronUp size={11} className={`dock-arrow ${expandedCategory === 'visual-labs' ? 'rotated' : ''}`} />
        </motion.button>

        <div className="dock-separator" />

        {/* Roadmap: Advanced Mathematics (Coming Soon) */}
        <motion.button
          className={`dock-item ${currentView === 'roadmap' ? 'active' : ''}`}
          onClick={() => {
            onSelectView('roadmap');
            setExpandedCategory(null);
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          title="Coming Soon: Advanced Mathematics"
        >
          {currentView === 'roadmap' && (
            <motion.div
              layoutId="activeDockIndicator"
              className="dock-active-glow"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <Lock size={15} className="dock-icon text-amber-400" />
          <span className="dock-label">Roadmap</span>
        </motion.button>

        {/* Search */}
        <motion.button
          className="dock-item"
          onClick={onOpenCommandPalette}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          title="Search (⌘K)"
        >
          <Search size={17} className="dock-icon" />
          <span className="dock-label">Search</span>
        </motion.button>
      </nav>
    </div>
  );
}
