import React from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Sparkles,
  Layers,
  Compass
} from 'lucide-react';
import { getFeatureByStep, FEATURES } from '../../config/features';

export default function Header({
  theme,
  onToggleTheme,
  currentStep,
  onSelectStep,
  currentView,
  onSelectView,
  onOpenCommandPalette,
  onOpenMobileSheet
}) {
  const [copied, setCopied] = React.useState(false);
  const activeFeature = getFeatureByStep(currentStep);

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('step', currentStep);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrevStep = () => {
    if (onSelectStep && currentStep > 1) {
      onSelectStep(currentStep - 1);
    }
  };

  const handleNextStep = () => {
    if (onSelectStep && currentStep < FEATURES.length) {
      onSelectStep(currentStep + 1);
    }
  };

  return (
    <header className="floating-glass-header" aria-label="Main application header">
      {/* LEFT: Minimal Logo & Quick Links */}
      <div className="header-brand-wrap">
        <button
          className="header-mobile-menu-btn"
          onClick={onOpenMobileSheet}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <button
          className="header-logo-btn"
          onClick={() => onSelectView('home')}
          title="MathLens Home"
        >
          <span className="header-logo-gem">◈</span>
          <span className="header-logo-text">MathLens</span>
          <span className="header-version-badge">2.0</span>
        </button>

        <nav className="header-nav-links" aria-label="Primary sections">
          <button
            className={`header-nav-link-btn ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => onSelectView('home')}
          >
            Home
          </button>
          <button
            className={`header-nav-link-btn ${currentView === 'learn' ? 'active' : ''}`}
            onClick={() => onSelectView('learn')}
          >
            Curriculum
          </button>
          <button
            className={`header-nav-link-btn ${currentView === 'module' && currentStep >= 8 ? 'active' : ''}`}
            onClick={() => {
              if (onSelectStep) onSelectStep(8);
            }}
          >
            Visual Labs
          </button>
          <button
            className={`header-nav-link-btn ${currentView === 'roadmap' ? 'active' : ''}`}
            onClick={() => onSelectView('roadmap')}
          >
            Roadmap
          </button>
          <button
            className={`header-nav-link-btn ${currentView === 'about' ? 'active' : ''}`}
            onClick={() => onSelectView('about')}
          >
            About
          </button>
        </nav>
      </div>

      {/* CENTER: Contextual Stepper / Breadcrumb */}
      <div className="header-context-breadcrumb">
        {currentView === 'module' ? (
          <div className="header-stepper-island">
            <button
              className="header-step-nav-btn"
              onClick={handlePrevStep}
              disabled={currentStep <= 1}
              title="Previous Module (Left Arrow)"
              aria-label="Previous Module"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              className="header-step-select-btn"
              onClick={onOpenCommandPalette}
              title="Jump to module (⌘K)"
            >
              <span className="header-step-pill-tag">
                {currentStep < 10 ? `0${currentStep}` : currentStep}
              </span>
              <span>{activeFeature.shortTitle}</span>
            </button>

            <button
              className="header-step-nav-btn"
              onClick={handleNextStep}
              disabled={currentStep >= FEATURES.length}
              title="Next Module (Right Arrow)"
              aria-label="Next Module"
            >
              <ChevronRight size={16} />
            </button>

            <span className="header-step-counter-tag">
              {currentStep < 10 ? `0${currentStep}` : currentStep}/{FEATURES.length < 10 ? `0${FEATURES.length}` : FEATURES.length}
            </span>
          </div>
        ) : (
          <div className="breadcrumb-path-row">
            <span className="breadcrumb-leaf">
              {currentView === 'home' && 'Interactive Mathematics & Computer Vision'}
              {currentView === 'learn' && 'Curriculum Roadmap'}
              {currentView === 'about' && 'Architecture & Pedagogy'}
              {currentView === 'roadmap' && 'Advanced Mathematics (Coming Soon)'}
            </span>
          </div>
        )}
      </div>

      {/* RIGHT: Search, Share, Theme Controls */}
      <div className="header-actions-wrap">
        <button
          className="header-action-search"
          onClick={onOpenCommandPalette}
          title="Search all modules (⌘K)"
          aria-label="Search"
        >
          <Search size={14} className="text-cyan-400" />
          <span className="search-text-label">Search</span>
          <kbd className="header-kbd-tag">⌘K</kbd>
        </button>

        {currentView === 'module' && (
          <button
            className="header-icon-btn"
            onClick={handleCopyLink}
            title={copied ? "Link Copied!" : "Share Link"}
            aria-label="Share"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
          </button>
        )}

        <motion.button
          className="header-icon-btn"
          onClick={onToggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun size={16} className="text-amber-300" />
          ) : (
            <Moon size={16} className="text-indigo-400" />
          )}
        </motion.button>
      </div>
    </header>
  );
}
