import { Modal } from '../../components/common/Modal.jsx';
import { useUserLevel, USER_LEVELS } from '../../context/UserLevelContext.jsx';

export function LevelSelectorModal() {
  const { showLevelModal, setShowLevelModal, setUserLevel, userLevel } = useUserLevel();

  const handleSelect = (level) => {
    setUserLevel(level);
  };

  return (
    <Modal
      isOpen={showLevelModal}
      onClose={userLevel ? () => setShowLevelModal(false) : null}
      title="Welcome to MathLens"
      maxWidth="max-w-lg"
    >
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          How would you like to explore linear algebra and digital image processing?
          You can change this anytime from the top bar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Basic Mode */}
          <button
            onClick={() => handleSelect(USER_LEVELS.BASIC)}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              userLevel === USER_LEVELS.BASIC
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                : 'border-gray-200 dark:border-gray-800 hover:border-indigo-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-900 dark:text-gray-100">🌱 Basic Mode</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Intuitive visuals, simple lightbulb analogies, zero prerequisite math jargon, step-by-step guidance.
              </p>
            </div>
            <span className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Select Basic →
            </span>
          </button>

          {/* Advanced Mode */}
          <button
            onClick={() => handleSelect(USER_LEVELS.ADVANCED)}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              userLevel === USER_LEVELS.ADVANCED
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                : 'border-gray-200 dark:border-gray-800 hover:border-indigo-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-900 dark:text-gray-100">⚡ Advanced Mode</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Formal vector notation, matrix algebra formulas, coordinate transformations (X&apos;=AX), and tensor depth.
              </p>
            </div>
            <span className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Select Advanced →
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
