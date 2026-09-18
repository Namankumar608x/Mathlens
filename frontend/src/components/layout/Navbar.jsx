import { Link, useLocation } from 'react-router-dom';
import { useUserLevel } from '../../context/UserLevelContext.jsx';

export function Navbar() {
  const location = useLocation();
  const { userLevel, setShowLevelModal } = useUserLevel();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-indigo-700 transition-colors">
            M
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              MathLens
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs text-gray-500 dark:text-gray-400">
              Interactive Linear Algebra for Images
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            to="/learn/pixels-to-matrices"
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              location.pathname.startsWith('/learn')
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            Modules
          </Link>
          <Link
            to="/sandbox"
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              location.pathname === '/sandbox'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            Sandbox
          </Link>

          {/* User Level Mode Selector */}
          <button
            onClick={() => setShowLevelModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
            title="Switch between Basic and Advanced learning modes"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Mode: <span className="capitalize">{userLevel || 'Select'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
