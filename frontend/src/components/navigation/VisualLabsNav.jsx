import React from 'react';
import { Blend, Scissors, Scan, Activity, Maximize2, Undo2, ZoomIn } from 'lucide-react';

export const VISUAL_LABS_ITEMS = [
  { step: 8, label: '08 Matrix Blending', shortLabel: '08 Blending', icon: Blend },
  { step: 9, label: '09 Background Detection', shortLabel: '09 Background', icon: Scissors },
  { step: 10, label: '10 Change Detection', shortLabel: '10 Changes', icon: Scan },
  { step: 11, label: '11 Image Inversion', shortLabel: '11 Inversion', icon: Activity },
  { step: 12, label: '12 Determinant Lab', shortLabel: '12 Determinant', icon: Maximize2 },
  { step: 13, label: '13 Matrix Inverse', shortLabel: '13 Inverse', icon: Undo2 },
  { step: 14, label: '14 Zoom & Scaling', shortLabel: '14 Scaling', icon: ZoomIn },
];

export default function VisualLabsNav({ activeStep, onSelectStep }) {
  return (
    <div className="sub-chapter-nav visual-labs-subnav">
      {VISUAL_LABS_ITEMS.map((lab) => {
        const Icon = lab.icon;
        const isActive = activeStep === lab.step;
        return (
          <button
            key={lab.step}
            className={`sub-chapter-pill ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (isActive) return;
              if (onSelectStep) onSelectStep(lab.step);
              else window.location.hash = `#step${lab.step}`;
            }}
            title={lab.label}
          >
            <Icon size={13} />
            <span>{lab.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
