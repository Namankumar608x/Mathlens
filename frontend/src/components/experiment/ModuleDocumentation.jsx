import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calculator,
  Compass,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  Layers,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { MODULE_DOCUMENTATION } from '../../data/moduleDocumentation';

export function formatMathText(str) {
  if (!str) return '';
  return str
    .replace(/\\mathbb\{Z\}/g, 'ℤ')
    .replace(/\\mathbb\{R\}\^?\+?/g, 'ℝ')
    .replace(/\\mathbb\{R\}/g, 'ℝ')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\mathcal\{I\}/g, 'I')
    .replace(/\\mathcal\{M\}/g, 'M')
    .replace(/\\sum/g, '∑')
    .replace(/\\in/g, '∈')
    .replace(/\\subset/g, '⊂')
    .replace(/\\to/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\implies/g, '⟹')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\dots/g, '…')
    .replace(/\\quad/g, '   ')
    .replace(/\\qquad/g, '     ')
    .replace(/\\vec\{([^}]+)\}/g, '$1⃗')
    .replace(/\\hat\{([^}]+)\}/g, '$1̂')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\det/g, 'det')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\\\/g, '\n')
    .replace(/\\;/g, ' ')
    .replace(/\\,/g, ' ');
}

export default function ModuleDocumentation({ stepNumber = 1 }) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('concept'); // 'concept' | 'math' | 'applications'
  const [copiedFormula, setCopiedFormula] = useState(false);

  const doc = MODULE_DOCUMENTATION[stepNumber] || MODULE_DOCUMENTATION[1];

  const handleCopyFormula = () => {
    if (!doc.formula) return;
    navigator.clipboard.writeText(doc.formula);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  return (
    <section className="module-docs-section glass-level-2" aria-label="Module Educational Documentation">
      {/* 1. Header Ribbon & Toggle */}
      <div className="module-docs-header">
        <div className="module-docs-header-left">
          <div className="module-docs-icon-bubble">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="module-docs-eyebrow">
              <span className="docs-code-pill">Module {doc.code}</span>
              <span className="docs-cat-label">{doc.category}</span>
            </div>
            <h2 className="module-docs-title">Learn This Concept: {doc.title}</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="docs-toggle-btn"
          aria-expanded={isOpen}
        >
          <span>{isOpen ? 'Collapse Documentation' : 'Expand Documentation'}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 2. Expandable Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="docs-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="module-docs-body"
          >
            {/* Segmented Tab Navigation */}
            <div className="module-docs-tabs-bar" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'concept'}
                onClick={() => setActiveTab('concept')}
                className={`docs-tab-btn ${activeTab === 'concept' ? 'active' : ''}`}
              >
                <Compass size={15} />
                <span>Concept &amp; Theory</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'math'}
                onClick={() => setActiveTab('math')}
                className={`docs-tab-btn ${activeTab === 'math' ? 'active' : ''}`}
              >
                <Calculator size={15} />
                <span>Formulas &amp; Worked Example</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'applications'}
                onClick={() => setActiveTab('applications')}
                className={`docs-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
              >
                <Layers size={15} />
                <span>Observations &amp; Applications</span>
              </button>
            </div>

            {/* TAB 1: CONCEPT & THEORY */}
            {activeTab === 'concept' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="docs-tab-pane"
              >
                <div className="docs-two-col-grid">
                  {/* Left: What Is This? */}
                  <div className="docs-subcard">
                    <div className="docs-subcard-header">
                      <HelpCircle size={16} className="docs-subcard-icon" />
                      <h3 className="docs-subcard-title">What Is This?</h3>
                    </div>
                    <p className="docs-prose">{doc.whatIsThis}</p>
                  </div>

                  {/* Right: Why Do We Need It? */}
                  <div className="docs-subcard">
                    <div className="docs-subcard-header">
                      <Sparkles size={16} className="docs-subcard-icon" />
                      <h3 className="docs-subcard-title">Why Do We Need It?</h3>
                    </div>
                    <p className="docs-prose">{doc.whyNeedIt}</p>
                  </div>
                </div>

                {/* Full Width: How Does It Work? */}
                <div className="docs-steps-card">
                  <h3 className="docs-steps-heading">How Does It Work?</h3>
                  <div className="docs-steps-grid">
                    {doc.howItWorks.map((st) => (
                      <div key={st.step} className="docs-step-card">
                        <div className="docs-step-badge">0{st.step}</div>
                        <h4 className="docs-step-title">{st.title}</h4>
                        <p className="docs-step-text">{st.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: FORMULAS & WORKED EXAMPLE */}
            {activeTab === 'math' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="docs-tab-pane"
              >
                {/* Formal Formula Banner */}
                <div className="docs-formula-banner">
                  <div className="formula-banner-top">
                    <span className="formula-banner-label">Mathematical Formulation</span>
                    <button
                      type="button"
                      onClick={handleCopyFormula}
                      className="docs-copy-formula-btn"
                      title="Copy LaTeX formula to clipboard"
                    >
                      {copiedFormula ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedFormula ? 'Copied LaTeX' : 'Copy LaTeX'}</span>
                    </button>
                  </div>
                  <div className="formula-banner-code-box">
                    <code>{formatMathText(doc.formulaDisplay || doc.formula)}</code>
                  </div>
                </div>

                {/* Symbol Definitions Glossary Table */}
                <div className="docs-symbols-table-wrap">
                  <h3 className="docs-subcard-title" style={{ marginBottom: '0.75rem' }}>
                    Symbol Definitions &amp; Variables
                  </h3>
                  <div className="docs-table-responsive">
                    <table className="docs-symbols-table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Variable Name</th>
                          <th>Mathematical Definition</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doc.symbols.map((sym, idx) => (
                          <tr key={idx}>
                            <td className="symbol-cell">
                              <code>{sym.symbol}</code>
                            </td>
                            <td className="name-cell">{sym.name}</td>
                            <td className="meaning-cell">{sym.meaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Worked Numerical Example Card */}
                {doc.workedExample && (
                  <div className="docs-worked-example-card">
                    <div className="worked-example-header">
                      <Calculator size={16} className="docs-subcard-icon" />
                      <h3 className="docs-subcard-title">Worked Numerical Example</h3>
                    </div>

                    <div className="worked-example-content">
                      <p className="worked-example-intro">{doc.workedExample.input}</p>

                      {doc.workedExample.matrixDisplay && (
                        <div className="worked-example-matrix-box">
                          <div className="matrix-bracket-left" />
                          <div className="matrix-cells-table">
                            {doc.workedExample.matrixDisplay.map((row, rIdx) => (
                              <div key={rIdx} className="matrix-cells-row">
                                {row.map((cell, cIdx) => (
                                  <span key={cIdx} className="matrix-number-cell">
                                    {String(cell)}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                          <div className="matrix-bracket-right" />
                        </div>
                      )}

                      <div className="worked-example-calc-block">
                        <span className="calc-block-label">Step-by-Step Arithmetic:</span>
                        <pre className="calc-block-text">{doc.workedExample.calculation}</pre>
                      </div>

                      <div className="worked-example-output-block">
                        <span className="output-block-label">Resulting Visual Output:</span>
                        <p className="output-block-text">{doc.workedExample.output}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: OBSERVATIONS & APPLICATIONS */}
            {activeTab === 'applications' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="docs-tab-pane"
              >
                {/* What Should I Observe? */}
                <div className="docs-observations-card">
                  <div className="docs-subcard-header">
                    <Eye size={16} className="docs-subcard-icon" />
                    <h3 className="docs-subcard-title">What Should I Observe in This Lab?</h3>
                  </div>
                  <ul className="docs-bullets-list">
                    {doc.observations.map((obs, idx) => (
                      <li key={idx} className="docs-bullet-item">
                        <CheckCircle2 size={15} className="bullet-check-icon" />
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Real-World Applications Grid */}
                <div className="docs-applications-card">
                  <h3 className="docs-subcard-title" style={{ marginBottom: '0.85rem' }}>
                    Practical Engineering Applications
                  </h3>
                  <div className="docs-applications-grid">
                    {doc.applications.map((app, idx) => (
                      <div key={idx} className="docs-app-item">
                        <div className="app-item-number">0{idx + 1}</div>
                        <h4 className="app-item-name">{app.name}</h4>
                        <p className="app-item-desc">{app.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Takeaways */}
                <div className="docs-takeaways-card">
                  <h3 className="docs-subcard-title" style={{ marginBottom: '0.75rem' }}>
                    Key Takeaways
                  </h3>
                  <div className="takeaways-list">
                    {doc.keyTakeaways.map((takeaway, idx) => (
                      <div key={idx} className="takeaway-item">
                        <span className="takeaway-bullet-num">{idx + 1}.</span>
                        <p className="takeaway-text">{takeaway}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
