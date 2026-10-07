import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calculator } from 'lucide-react';

export default function MathInspectorHUD({
  title = "Calculation Inspector",
  cell,
  formula,
  result,
  note
}) {
  if (!cell && !formula) return null;

  return (
    <motion.div
      className="math-inspector-hud glass-level-3"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="inspector-top-row">
        <div className="inspector-badge">
          <Calculator size={13} className="text-cyan-400" />
          <span>{title}</span>
        </div>
        {cell && (
          <span className="inspector-coord-tag">
            Cell [{cell.row}, {cell.col}]
          </span>
        )}
      </div>

      <div className="inspector-calc-body">
        {formula && <div className="inspector-formula-text">{formula}</div>}
        {result !== undefined && (
          <div className="inspector-result-row">
            <span className="inspector-equals">=</span>
            <span className="inspector-result-val">{result}</span>
          </div>
        )}
      </div>

      {note && <div className="inspector-note-text">{note}</div>}
    </motion.div>
  );
}
