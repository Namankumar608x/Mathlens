import React from 'react';
import { motion } from 'framer-motion';
import { Layers, ChevronDown, Sun, Moon } from 'lucide-react';

export default function Header({ currentLevel, onOpenLevelModal, theme, onToggleTheme }) {
  return (
    <header className="header-bar">
      <div className="brand-section">
        <motion.div 
          className="brand-logo-container"
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          whileHover={{ scale: 1.05, rotate: 5 }}
        >
          {/* Custom Modern Mathematical Lens SVG Logo */}
          <svg className="brand-logo-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="12" fill={theme === 'light' ? '#E2E8F0' : '#111827'} />
            <rect x="1" y="1" width="46" height="46" rx="11" stroke="url(#logo_grad)" strokeWidth="1.5" strokeOpacity="0.5" />
            {/* Matrix brackets */}
            <path d="M12 14H10V34H12" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M36 14H38V34H36" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
            {/* Mathematical lens aperture / grid */}
            <circle cx="24" cy="24" r="8" stroke="#10B981" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="24" cy="24" r="3" fill="#2563EB" />
            <line x1="24" y1="12" x2="24" y2="36" stroke="#2563EB" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="12" y1="24" x2="36" y2="24" stroke="#2563EB" strokeWidth="1" strokeOpacity="0.4" />
            <defs>
              <linearGradient id="logo_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563EB" />
                <stop offset="1" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        
        <div>
          <h1 className="brand-title">MathLens</h1>
          <div className="brand-subtitle">Interactive Matrix Laboratory</div>
        </div>
      </div>
      
      <div className="header-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Theme Toggle Button */}
        <motion.button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun size={18} className="theme-icon sun-icon" />
          ) : (
            <Moon size={18} className="theme-icon moon-icon" />
          )}
        </motion.button>

        {/* Level Selector Dropdown Button */}
        <motion.button 
          className="level-selector-btn" 
          onClick={onOpenLevelModal}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Layers size={16} className="level-icon" />
          <span className="level-label">
            {currentLevel === 'basic' ? 'Basic Intuition' : 'Advanced Linear Algebra'}
          </span>
          <ChevronDown size={14} className="level-arrow" />
        </motion.button>
      </div>
    </header>
  );
}
