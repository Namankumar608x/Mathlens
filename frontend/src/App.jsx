import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import LevelSelectorModal from './components/common/LevelSelectorModal';
import StepperNavigation from './components/layout/StepperNavigation';

import Step1Grayscale from './steps/Step1Grayscale';
import Step2CellEditing from './steps/Step2CellEditing';
import Step3ScalarBrightness from './steps/Step3ScalarBrightness';
import Step4SingleRGBPixel from './steps/Step4SingleRGBPixel';
import Step5RGBMatrices from './steps/Step5RGBMatrices';
import Step6RGBScalarMult from './steps/Step6RGBScalarMult';
import Step7ImageTransforms from './steps/Step7ImageTransforms';

import './App.css';

export default function App() {
  const [currentLevel, setCurrentLevel] = useState('basic');
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mathlens_theme') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('mathlens_theme', nextTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Grayscale />;
      case 2:
        return <Step2CellEditing />;
      case 3:
        return <Step3ScalarBrightness />;
      case 4:
        return <Step4SingleRGBPixel />;
      case 5:
        return <Step5RGBMatrices />;
      case 6:
        return <Step6RGBScalarMult />;
      case 7:
        return <Step7ImageTransforms />;
      default:
        return <Step1Grayscale />;
    }
  };

  return (
    <div className="app-container">
      <Header
        currentLevel={currentLevel}
        onSelectLevel={setCurrentLevel}
        onOpenLevelModal={() => setIsLevelModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <StepperNavigation
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
      />

      <main className="main-content">
        {renderStepContent()}
      </main>

      <LevelSelectorModal
        isOpen={isLevelModalOpen}
        currentLevel={currentLevel}
        onSelectLevel={setCurrentLevel}
        onClose={() => setIsLevelModalOpen(false)}
      />
    </div>
  );
}
