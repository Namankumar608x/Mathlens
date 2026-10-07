import React from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Compass,
  ArrowLeft,
  ArrowRight,
  Search,
  Layers,
  Sun,
  Moon
} from 'lucide-react';

export default function MobileBottomNav({
  currentStep,
  onSelectStep,
  currentView,
  onSelectView,
  onOpenFeatureSheet,
  onOpenCommandPalette,
  theme,
  onToggleTheme
}) {
  const handlePrev = () => {
    if (currentStep > 1) {
      onSelectStep(currentStep - 1);
      onSelectView('module');
    }
  };

  const handleNext = () => {
    if (currentStep < 14) {
      onSelectStep(currentStep + 1);
      onSelectView('module');
    }
  };

  return (
    <nav className="mobile-bottom-dock glass-level-3" aria-label="Mobile Navigation">
      {/* Home */}
      <button
        className={`mobile-dock-btn ${currentView === 'home' ? 'active' : ''}`}
        onClick={() => onSelectView('home')}
        title="Home"
      >
        <Home size={19} />
        <span className="mobile-dock-lbl">Home</span>
      </button>

      {/* Explore Modules Sheet */}
      <button
        className={`mobile-dock-btn ${currentView === 'module' ? 'active' : ''}`}
        onClick={onOpenFeatureSheet}
        title="Explore Modules"
      >
        <Layers size={19} />
        <span className="mobile-dock-lbl">Modules</span>
      </button>

      {/* Prev Step */}
      <button
        className="mobile-dock-btn"
        onClick={handlePrev}
        disabled={currentStep <= 1 && currentView === 'module'}
        title="Previous Step"
      >
        <ArrowLeft size={19} />
        <span className="mobile-dock-lbl">Prev</span>
      </button>

      {/* Next Step */}
      <button
        className="mobile-dock-btn accent-dock-btn"
        onClick={handleNext}
        disabled={currentStep >= 14 && currentView === 'module'}
        title="Next Step"
      >
        <ArrowRight size={19} />
        <span className="mobile-dock-lbl">Next</span>
      </button>

      {/* Search */}
      <button
        className="mobile-dock-btn"
        onClick={onOpenCommandPalette}
        title="Search"
      >
        <Search size={19} />
        <span className="mobile-dock-lbl">Search</span>
      </button>

      {/* Theme */}
      <button
        className="mobile-dock-btn"
        onClick={onToggleTheme}
        title="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        <span className="mobile-dock-lbl">Theme</span>
      </button>
    </nav>
  );
}
