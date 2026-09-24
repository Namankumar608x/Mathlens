import React from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Grid, 
  Sun, 
  Box, 
  Layers, 
  Sliders, 
  Compass,
  Blend
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Small Grayscale', icon: Eye },
  { id: 2, name: 'Cell Editing', icon: Grid },
  { id: 3, name: 'Scalar Brightness', icon: Sun },
  { id: 4, name: 'RGB Pixel', icon: Box },
  { id: 5, name: 'RGB Channels', icon: Layers },
  { id: 6, name: 'RGB Brightness', icon: Sliders },
  { id: 7, name: '2D Transformations', icon: Compass },
  { id: 8, name: 'Matrix Addition', icon: Blend },
];

export default function StepperNavigation({ currentStep, onSelectStep }) {
  return (
    <nav className="stepper-nav">
      <div className="steps-container">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const Icon = step.icon;

          return (
            <motion.button
              key={step.id}
              className={`step-tab ${isActive ? 'active' : ''}`}
              onClick={() => onSelectStep(step.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeStepTabPill"
                  className="step-tab-active-bg"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="step-num-pill">0{idx + 1}</span>
              <span className="step-icon-badge">
                <Icon size={13} />
              </span>
              <span className="step-tab-title">{step.name}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
