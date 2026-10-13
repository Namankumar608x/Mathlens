import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Grid,
  Compass,
  Blend,
  BookOpen,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  Zap,
  Variable,
  Sun,
  Moon,
  PanelBottomClose,
  PanelBottomOpen,
  Layers,
  Info,
  Home
} from 'lucide-react';
import { CATEGORIES, FEATURES, getFeatureByStep } from '../../config/features';

export default function FloatingDock({
  currentStep,
  onSelectStep,
  currentView,
  onSelectView,
  currentLevel = 'basic',
  onOpenLevelModal,
  theme = 'dark',
  onToggleTheme,
  onOpenCommandPalette
}) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const dockRef = useRef(null);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);

  // Close subnav when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        setExpandedCategory(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll detection transition:
  // Scroll DOWN -> Open/show bottom navbar
  // Scroll UP -> Hide bottom navbar so it doesn't obstruct reading content
  // Top of page -> Keep visible
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY.current;

      // Only react if scrolled more than small jitter
      if (Math.abs(scrollDiff) > 6) {
        if (currentScrollY <= 40) {
          // At top of page: always open
          setIsNavVisible(true);
        } else if (scrollDiff > 0) {
          // Scrolling DOWN -> Reveal/open bottom navbar
          setIsNavVisible(true);
        } else if (scrollDiff < 0) {
          // Scrolling UP -> Hide navbar to preserve reading space
          setIsNavVisible(false);
          setExpandedCategory(null);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut: Press 'N' to toggle navbar visibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'n' || e.key === 'N') {
        setIsNavVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeFeature = getFeatureByStep(currentStep) || FEATURES[0];
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

  const handlePrevStep = (e) => {
    e.stopPropagation();
    if (onSelectStep && currentStep > 1) {
      onSelectStep(currentStep - 1);
      onSelectView('module');
      setExpandedCategory(null);
    }
  };

  const handleNextStep = (e) => {
    e.stopPropagation();
    if (onSelectStep && currentStep < FEATURES.length) {
      onSelectStep(currentStep + 1);
      onSelectView('module');
      setExpandedCategory(null);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MORPHING CIRCULAR / FULL-BAR BOTTOM NAVIGATION DOCK                    */}
      {/* ========================================================================= */}
      <div className="floating-dock-container" ref={dockRef} aria-label="Bottom Navigation">
        <AnimatePresence mode="wait">
          {!isNavVisible ? (
            /* COLLAPSED STATE: Contracted Circle Sliding to Left Side of Screen */
            <motion.button
              key="dock-collapsed-circle"
              type="button"
              className="dock-morph-circle-btn dock-circle-left glass-level-3"
              onClick={() => setIsNavVisible(true)}
              initial={{ scale: 0.4, opacity: 0, x: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                x: 'calc(-50vw + 3.25rem)',
                transition: {
                  type: 'spring',
                  stiffness: 380,
                  damping: 26,
                  mass: 0.9
                }
              }}
              exit={{ 
                scale: 0.6, 
                opacity: 0, 
                x: 0,
                transition: { duration: 0.2 }
              }}
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.92 }}
              title="Open Navigation Bar (or Scroll Down / Press N)"
              aria-label="Open Navigation Bar"
            >
              <div className="dock-circle-inner-glow" />
              <PanelBottomOpen size={18} className="text-cyan-400 z-10" />
              <span className="dock-circle-ripple" />
            </motion.button>
          ) : (
            /* EXPANDED STATE: Full Slender Glass Capsule Centered on Screen */
            <motion.div
              key="dock-expanded-bar"
              className="dock-wrapper-relative"
              initial={{ scale: 0.4, opacity: 0, x: 'calc(-50vw + 3.25rem)' }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                x: 0,
                transition: {
                  type: 'spring',
                  stiffness: 400,
                  damping: 30
                }
              }}
              exit={{ 
                scale: 0.4, 
                opacity: 0, 
                transition: { duration: 0.18 }
              }}
            >
              {/* Upward Expanding Secondary Glass Panel (Popovers strictly in one line) */}
              <AnimatePresence>
                {expandedCategory && (
                  <motion.div
                    className="dock-subnav-panel glass-level-3"
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  >
                    <div className="dock-subnav-header" style={{ paddingBottom: '0.4rem', marginBottom: '0.5rem' }}>
                      <span className="dock-subnav-title whitespace-nowrap text-xs font-bold text-white">
                        {CATEGORIES.find(c => c.id === expandedCategory)?.label}
                      </span>
                      <span className="dock-subnav-hint whitespace-nowrap text-[11px] text-zinc-400 font-mono">
                        {getSubFeatures(expandedCategory).length} Modules
                      </span>
                    </div>

                    <div className="dock-subnav-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.4rem' }}>
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
                            style={{ padding: '0.4rem 0.6rem', minHeight: 'auto' }}
                          >
                            <div className="dock-subnav-icon-wrap" style={{ width: '22px', height: '22px' }}>
                              <Icon size={12} />
                            </div>
                            <div className="dock-subnav-text min-w-0" style={{ overflow: 'hidden' }}>
                              {/* Strictly ONE line heading */}
                              <span className="dock-subnav-name whitespace-nowrap truncate block text-xs font-medium">
                                {feat.stepNumber < 10 ? `0${feat.stepNumber}` : feat.stepNumber} · {feat.shortTitle}
                              </span>
                            </div>
                            {isSelected && <Check size={13} className="dock-subnav-check text-cyan-400 shrink-0" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Sleek Thin Glass Bar (Capsule, Height ~40px, All in 1 Line) */}
              <nav className="dock-glass-bar glass-level-2 thin-bottom-nav">
                {/* Close to circle button */}
                <motion.button
                  type="button"
                  className="dock-item thin-item dock-close-minimize-btn"
                  onClick={() => {
                    setIsNavVisible(false);
                    setExpandedCategory(null);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Collapse navbar into circle (Press N or scroll up)"
                >
                  <PanelBottomClose size={14} className="text-zinc-400 hover:text-cyan-400 transition-colors" />
                </motion.button>

                <div className="dock-separator" />

                {/* Home Button */}
                <motion.button
                  type="button"
                  className={`dock-item thin-item ${currentView === 'home' ? 'active' : ''}`}
                  onClick={() => {
                    onSelectView('home');
                    setExpandedCategory(null);
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  title="Home Overview"
                >
                  {currentView === 'home' && (
                    <motion.div
                      layoutId="activeDockIndicator"
                      className="dock-active-glow"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Home size={13} className="dock-icon text-cyan-400" />
                  <span className="dock-label whitespace-nowrap">Home</span>
                </motion.button>

                <div className="dock-separator" />
          <motion.button
            type="button"
            className={`dock-item thin-item ${currentCategory === 'pixel-matrix' ? 'active' : ''} ${expandedCategory === 'pixel-matrix' ? 'open' : ''}`}
            onClick={() => handleCategoryClick('pixel-matrix')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            title="Pixels & Foundations (Steps 01-06)"
          >
            {currentCategory === 'pixel-matrix' && (
              <motion.div
                layoutId="activeDockIndicator"
                className="dock-active-glow"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <Grid size={13} className="dock-icon text-cyan-400" />
            <span className="dock-label whitespace-nowrap">Pixels</span>
            <ChevronUp size={10} className={`dock-arrow ${expandedCategory === 'pixel-matrix' ? 'rotated' : ''}`} />
          </motion.button>

          {/* Transforms (Step 07) */}
          <motion.button
            type="button"
            className={`dock-item thin-item ${currentCategory === 'transformations' ? 'active' : ''}`}
            onClick={() => {
              onSelectStep(7);
              onSelectView('module');
              setExpandedCategory(null);
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            title="2D Transforms (Step 07)"
          >
            {currentCategory === 'transformations' && (
              <motion.div
                layoutId="activeDockIndicator"
                className="dock-active-glow"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <Compass size={13} className="dock-icon text-purple-400" />
            <span className="dock-label whitespace-nowrap">Transforms</span>
          </motion.button>

          {/* Visual Labs (Steps 08-16) */}
          <motion.button
            type="button"
            className={`dock-item thin-item ${currentCategory === 'visual-labs' ? 'active' : ''} ${expandedCategory === 'visual-labs' ? 'open' : ''}`}
            onClick={() => handleCategoryClick('visual-labs')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            title="Visual Labs (Steps 08-16)"
          >
            {currentCategory === 'visual-labs' && (
              <motion.div
                layoutId="activeDockIndicator"
                className="dock-active-glow"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <Blend size={13} className="dock-icon text-teal-400" />
            <span className="dock-label whitespace-nowrap">Visual Labs</span>
            <ChevronUp size={10} className={`dock-arrow ${expandedCategory === 'visual-labs' ? 'rotated' : ''}`} />
          </motion.button>

          {/* Ray Optics (Step 17) */}
          <motion.button
            type="button"
            className={`dock-item thin-item ${currentCategory === 'ray-optics' ? 'active' : ''}`}
            onClick={() => {
              onSelectStep(17);
              onSelectView('module');
              setExpandedCategory(null);
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            title="Ray Optics (Step 17)"
          >
            {currentCategory === 'ray-optics' && (
              <motion.div
                layoutId="activeDockIndicator"
                className="dock-active-glow"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <Zap size={13} className="dock-icon text-amber-400" />
            <span className="dock-label whitespace-nowrap">Optics</span>
          </motion.button>

          {/* Advanced: Eigenvalues (Step 18) */}
          <motion.button
            type="button"
            className={`dock-item thin-item ${currentCategory === 'eigen-spaces' ? 'active' : ''}`}
            onClick={() => {
              onSelectStep(18);
              onSelectView('module');
              setExpandedCategory(null);
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            title="Advanced: Eigenvalues & Eigenvectors (Step 18)"
          >
            {currentCategory === 'eigen-spaces' && (
              <motion.div
                layoutId="activeDockIndicator"
                className="dock-active-glow"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <Variable size={13} className="dock-icon text-pink-400" />
            <span className="dock-label whitespace-nowrap">Advanced</span>
          </motion.button>



          <div className="dock-separator" />

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <motion.button
              type="button"
              className="dock-item thin-item"
              onClick={onToggleTheme}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? (
                <Sun size={13} className="text-amber-300" />
              ) : (
                <Moon size={13} className="text-indigo-400" />
              )}
            </motion.button>
          )}
        </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
