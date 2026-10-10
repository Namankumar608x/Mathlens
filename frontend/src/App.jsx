import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import LevelSelectorModal from './components/common/LevelSelectorModal';
import Sidebar from './components/layout/Sidebar';
import FloatingDock from './components/layout/FloatingDock';
import MobileBottomNav from './components/layout/MobileBottomNav';
import FeatureSheet from './components/navigation/FeatureSheet';
import CommandPalette from './components/navigation/CommandPalette';
import MathBackground from './components/background/MathBackground';


import HeroSection from './components/home/HeroSection';
import CurriculumScreen from './screens/CurriculumScreen';
import AboutScreen from './screens/AboutScreen';
import RoadmapScreen from './screens/RoadmapScreen';

import Step1Grayscale from './steps/Step1Grayscale';
import Step2CellEditing from './steps/Step2CellEditing';
import Step3ScalarBrightness from './steps/Step3ScalarBrightness';
import Step4SingleRGBPixel from './steps/Step4SingleRGBPixel';
import Step5RGBMatrices from './steps/Step5RGBMatrices';
import Step6RGBScalarMult from './steps/Step6RGBScalarMult';
import Step7ImageTransforms from './steps/Step7ImageTransforms';
import Step8MatrixAddition from './steps/Step8MatrixAddition';
import Step9MatrixSubtraction from './steps/Step9MatrixSubtraction';
import Step10FindWhatChanged from './steps/Step10FindWhatChanged';
import Step11ImageInversionXRay from './steps/Step11ImageInversionXRay';
import Step12DeterminantVisualizer from './steps/Step12DeterminantVisualizer';
import Step13MatrixInverse from './steps/Step13MatrixInverse';
import Step14MatrixInverseZoom from './steps/Step14MatrixInverseZoom';
import Step15MatrixMultiplicationShadows from './steps/Step15MatrixMultiplicationShadows';
import Step16MyImageMyMatrix from './steps/Step16MyImageMyMatrix';
import Step17RayOptics from './steps/Step17RayOptics';

import { getFeatureByStep, FEATURES } from './config/features';
import './index.css';
import './App.css';

export default function App() {
  const [currentLevel, setCurrentLevel] = useState('basic');
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // View state: 'home' | 'module' | 'learn' | 'about' | 'roadmap'
  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam && ['home', 'module', 'learn', 'about', 'roadmap'].includes(viewParam)) {
      return viewParam;
    }
    if (params.get('step')) return 'module';
    return 'home';
  });

  // Current interactive step (1 to 14)
  const [currentStep, setCurrentStep] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    if (stepParam) {
      const parsed = parseInt(stepParam, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 16) return parsed;
    }
    const saved = localStorage.getItem('mathlens_step');
    return saved ? parseInt(saved, 10) : 1;
  });

  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme');
    if (themeParam === 'light' || themeParam === 'dark') return themeParam;
    return localStorage.getItem('mathlens_theme') || 'dark';
  });

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('mathlens_theme', nextTheme);
  }, [theme]);

  const handleSelectStep = useCallback((step) => {
    setCurrentStep(step);
    setCurrentView('module');
    localStorage.setItem('mathlens_step', step);
    const url = new URL(window.location.href);
    url.searchParams.set('step', step);
    url.searchParams.delete('view');
    window.history.replaceState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectView = useCallback((view) => {
    setCurrentView(view);
    const url = new URL(window.location.href);
    if (view === 'module') {
      url.searchParams.set('step', currentStep);
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', view);
      url.searchParams.delete('step');
    }
    window.history.replaceState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      // ⌘K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // [ -> Toggle Sidebar Collapse
      if (e.key === '[') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
        return;
      }

      // T / t -> Toggle Theme
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTheme();
        return;
      }

      // Left / Right arrows for step navigation in module view
      if (currentView === 'module') {
        if (e.key === 'ArrowLeft' && currentStep > 1) {
          e.preventDefault();
          handleSelectStep(currentStep - 1);
        } else if (e.key === 'ArrowRight' && currentStep < FEATURES.length) {
          e.preventDefault();
          handleSelectStep(currentStep + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, currentStep, handleSelectStep, toggleTheme]);

  const renderModuleStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Grayscale onSelectStep={handleSelectStep} />;
      case 2:
        return <Step2CellEditing onSelectStep={handleSelectStep} />;
      case 3:
        return <Step3ScalarBrightness onSelectStep={handleSelectStep} />;
      case 4:
        return <Step4SingleRGBPixel onSelectStep={handleSelectStep} />;
      case 5:
        return <Step5RGBMatrices onSelectStep={handleSelectStep} />;
      case 6:
        return <Step6RGBScalarMult onSelectStep={handleSelectStep} />;
      case 7:
        return <Step7ImageTransforms onSelectStep={handleSelectStep} />;
      case 8:
        return <Step8MatrixAddition onSelectStep={handleSelectStep} />;
      case 9:
        return <Step9MatrixSubtraction onSelectStep={handleSelectStep} />;
      case 10:
        return <Step10FindWhatChanged onSelectStep={handleSelectStep} />;
      case 11:
        return <Step11ImageInversionXRay onSelectStep={handleSelectStep} />;
      case 12:
        return <Step12DeterminantVisualizer onSelectStep={handleSelectStep} />;
      case 13:
        return <Step13MatrixInverse onSelectStep={handleSelectStep} />;
      case 14:
        return <Step14MatrixInverseZoom onSelectStep={handleSelectStep} />;
      case 15:
        return <Step15MatrixMultiplicationShadows onSelectStep={handleSelectStep} />;
      case 16:
        return <Step16MyImageMyMatrix onSelectStep={handleSelectStep} />;
      case 17:
        return <Step17RayOptics onSelectStep={handleSelectStep} />;
      default:
        return <Step1Grayscale onSelectStep={handleSelectStep} />;
    }
  };

  const renderMainContent = () => {
    if (currentView === 'home') {
      return (
        <HeroSection
          onStartExploring={() => handleSelectStep(1)}
          onSelectStep={handleSelectStep}
          onSelectView={handleSelectView}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
      );
    }
    if (currentView === 'learn') {
      return <CurriculumScreen onSelectStep={handleSelectStep} />;
    }
    if (currentView === 'about') {
      return <AboutScreen />;
    }
    if (currentView === 'roadmap') {
      return <RoadmapScreen onSelectStep={handleSelectStep} />;
    }
    return renderModuleStepContent();
  };

  return (
    <div className={`app-shell-root ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* 1. Global Layered Atmospheric Background */}
      <MathBackground />

      {/* 2. Desktop Floating Glass Sidebar */}
      <Sidebar
        currentStep={currentStep}
        onSelectStep={handleSelectStep}
        currentView={currentView}
        onSelectView={handleSelectView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* 3. Main Application Body */}
      <div className="app-main-viewport">
        <Header
          currentLevel={currentLevel}
          onSelectLevel={setCurrentLevel}
          onOpenLevelModal={() => setIsLevelModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          currentStep={currentStep}
          onSelectStep={handleSelectStep}
          currentView={currentView}
          onSelectView={handleSelectView}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenMobileSheet={() => setIsMobileSheetOpen(true)}
        />

        <main className="main-content-area" id="main-content">
          {renderMainContent()}
        </main>

        <Footer
          onSelectStep={handleSelectStep}
          onSelectView={handleSelectView}
        />
      </div>

      {/* 4. Desktop Floating Feature Dock (Center-Bottom) */}
      <FloatingDock
        currentStep={currentStep}
        onSelectStep={handleSelectStep}
        currentView={currentView}
        onSelectView={handleSelectView}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* 5. Mobile Floating Bottom Navigation (Mobile Only) */}
      <MobileBottomNav
        currentStep={currentStep}
        onSelectStep={handleSelectStep}
        currentView={currentView}
        onSelectView={handleSelectView}
        onOpenFeatureSheet={() => setIsMobileSheetOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* 6. Mobile Slide-Up Feature Sheet */}
      <FeatureSheet
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        currentStep={currentStep}
        onSelectStep={handleSelectStep}
        onSelectView={handleSelectView}
      />

      {/* 7. Global ⌘K Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectFeature={(feat) => handleSelectStep(feat.stepNumber)}
      />

      {/* 8. Level Selector Modal (Basic vs Advanced Math) */}
      <LevelSelectorModal
        isOpen={isLevelModalOpen}
        currentLevel={currentLevel}
        onSelectLevel={setCurrentLevel}
        onClose={() => setIsLevelModalOpen(false)}
      />

      {/* <DeveloperCreditsModal
        isOpen={isCreditsOpen}
        onClose={() => setIsCreditsOpen(false)}
      /> */}
    </div>
  );
}
