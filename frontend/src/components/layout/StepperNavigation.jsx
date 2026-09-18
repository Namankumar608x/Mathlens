import React from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Grid, 
  Sun, 
  Box, 
  Layers, 
  Sliders, 
  Compass 
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Small Grayscale', icon: Eye },
  { id: 2, name: 'Cell Editing', icon: Grid },
  { id: 3, name: 'Scalar Brightness', icon: Sun },
  { id: 4, name: 'RGB Pixel', icon: Box },
  { id: 5, name: 'RGB Channels', icon: Layers },
  { id: 6, name: 'RGB Brightness', icon: Sliders },
  { id: 7, name: '2D Transformations', icon: Compass },
];

export default function StepperNavigation({ currentStep, onSelectStep }) {
  return (
    <nav className="stepper-nav">
      <div className="steps-container">
        {STEPS.map(step => {
          const isActive = currentStep === step.id;
          const Icon = step.icon;

          return (
            <motion.button
              key={step.id}
              className={`step-tab ${isActive ? 'active' : ''}`}
              onClick={() => onSelectStep(step.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="step-icon-badge">
                <Icon size={15} />
              </span>
              <span>{step.name}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
