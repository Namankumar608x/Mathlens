import { useState } from 'react';
import { CURRICULUM } from '../../config/curriculum.js';
import { useProgress } from '../../context/ProgressContext.jsx';
import { StepContainer } from '../../components/layout/StepContainer.jsx';

import { Step1GrayscaleIntro } from './steps/Step1GrayscaleIntro.jsx';
import { Step2ElementEditing } from './steps/Step2ElementEditing.jsx';
import { Step3ScalarBrightness } from './steps/Step3ScalarBrightness.jsx';
import { Step4ColorPixelRGB } from './steps/Step4ColorPixelRGB.jsx';
import { Step5RGBChannelMatrices } from './steps/Step5RGBChannelMatrices.jsx';
import { Step6ColorScalarOps } from './steps/Step6ColorScalarOps.jsx';
import { Step7Transformations } from './steps/Step7Transformations.jsx';

export function PixelsToMatricesModule() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { markStepComplete, isStepCompleted } = useProgress();

  const steps = CURRICULUM.steps;
  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    markStepComplete(currentStep.id);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 1:
        return <Step1GrayscaleIntro />;
      case 2:
        return <Step2ElementEditing />;
      case 3:
        return <Step3ScalarBrightness />;
      case 4:
        return <Step4ColorPixelRGB />;
      case 5:
        return <Step5RGBChannelMatrices />;
      case 6:
        return <Step6ColorScalarOps />;
      case 7:
        return <Step7Transformations />;
      default:
        return <div>Step coming soon</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Step Stepper Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {steps.map((s, idx) => {
            const isActive = idx === currentStepIndex;
            const completed = isStepCompleted(s.id);

            return (
              <button
                key={s.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : completed
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  isActive ? 'bg-white/20' : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {completed ? '✓' : s.id}
                </span>
                <span>{s.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Container */}
      <StepContainer
        step={currentStep}
        onPrevious={handlePrevious}
        onNext={handleNext}
        isFirst={currentStepIndex === 0}
        isLast={currentStepIndex === steps.length - 1}
      >
        {renderStepContent()}
      </StepContainer>
    </div>
  );
}
