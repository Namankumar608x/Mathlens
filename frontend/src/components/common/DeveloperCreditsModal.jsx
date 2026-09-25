import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, Users } from 'lucide-react';

export default function DeveloperCreditsModal({ isOpen, onClose }) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const developers = [
    {
      name: 'Naman Kumar',
      institution: 'IIIT Vadodara'
    },
    {
      name: 'Mayank Soni',
      institution: 'IIIT Vadodara'
    },
    {
      name: 'Krishana Yadav',
      institution: 'IIIT Vadodara'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay credits-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="credits-title"
        >
          <motion.div
            className="modal-card credits-modal-card"
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className="credits-modal-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="credits-header text-center">
              <span className="credits-institute-tag">
                Indian Institute of Information Technology Vadodara
              </span>
              <h2 id="credits-title" className="credits-title">
                MathLens
              </h2>
              <p className="credits-subtitle">
                Visual &amp; Interactive Linear Algebra for Digital Images
              </p>
            </div>

            <div className="credits-body">
              {/* 1. Faculty Supervisor in Center */}
              <div className="faculty-supervisor-section text-center">
                <div className="role-badge">
                  <GraduationCap size={15} />
                  <span>Faculty Supervisor &amp; Mentor</span>
                </div>
                <h3 className="faculty-name">Prof. Payal Wadhwa</h3>
                <p className="faculty-affiliation">
                  Indian Institute of Information Technology Vadodara
                </p>
              </div>

              {/* 2. Developers Section - Just Names */}
              <div className="developers-section">
                <div className="developers-section-header text-center">
                  <div className="role-badge">
                    <Users size={15} />
                    <span>Developers</span>
                  </div>
                </div>

                <div className="developers-grid">
                  {developers.map((dev) => (
                    <div key={dev.name} className="simple-dev-card text-center">
                      <h4 className="dev-name">{dev.name}</h4>
                      <span className="dev-inst">{dev.institution}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Small Description About MathLens (3-4 lines) */}
              <div className="about-mathlens-section text-center">
                <p className="about-mathlens-text">
                  MathLens is an interactive mathematics and computing laboratory designed to make abstract linear algebra intuitive through digital image processing. By visualizing numerical matrices directly as pixels, color channels, and geometric transformations, it connects foundational linear algebra principles with hands-on computational experimentation.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="credits-footer">
              <span className="credits-copyright">© MathLens • IIIT Vadodara</span>
              <button className="credits-close-btn" onClick={onClose}>
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
