import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * Reusable BackButton component for MathLens.
 * Provides consistent, accessible, and theme-aware navigation back to parent/previous pages.
 *
 * @param {Object} props
 * @param {Function} props.onBack - Callback invoked when clicking the back button
 * @param {string} [props.label="Back"] - Label text to display beside the arrow
 * @param {string} [props.contextText] - Optional breadcrumb or destination descriptor (e.g. "Overview" or "All Experiments")
 * @param {string} [props.className=""] - Additional CSS class names
 */
export default function BackButton({
  onBack,
  contextText,
  className = ''
}) {
  return (
    <div className={`mathlens-back-bar ${className}`}>
      <button
        type="button"
        onClick={onBack}
        className="mathlens-back-btn"
        aria-label={contextText ? `Go back to ${contextText}` : 'Go back'}
        title="Go back"
      >
        <ArrowLeft size={16} className="mathlens-back-icon" aria-hidden="true" />
      </button>

      {contextText && (
        <div className="mathlens-back-breadcrumb" aria-hidden="true">
          <span className="mathlens-back-context">{contextText}</span>
        </div>
      )}
    </div>
  );
}
