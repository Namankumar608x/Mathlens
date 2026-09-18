import { Link } from 'react-router-dom';
import { CURRICULUM } from '../config/curriculum.js';
import { useUserLevel, USER_LEVELS } from '../context/UserLevelContext.jsx';
import { Button } from '../components/common/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';

export function HomeScreen() {
  const { userLevel, setUserLevel } = useUserLevel();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          <span>✨ Interactive Matrix & Computer Vision Lab</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          See Linear Algebra Through the Lens of{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
            Digital Pixels
          </span>
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          Demystify matrices, vectors, scalar multiplication, and coordinate transformations
          by manipulating images cell-by-cell in real-time.
        </p>

        {/* Level Choice Prompt */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
          <Link to="/learn/pixels-to-matrices">
            <Button size="lg" variant="primary">
              Start Learning: Module 1 →
            </Button>
          </Link>
          <Link to="/sandbox">
            <Button size="lg" variant="outline">
              Open Interactive Sandbox 🧪
            </Button>
          </Link>
        </div>

        {/* Mode Selector Pill */}
        <div className="pt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>Current Level:</span>
          <button
            onClick={() => setUserLevel(USER_LEVELS.BASIC)}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
              userLevel === USER_LEVELS.BASIC
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            🌱 Basic
          </button>
          <button
            onClick={() => setUserLevel(USER_LEVELS.ADVANCED)}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
              userLevel === USER_LEVELS.ADVANCED
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            ⚡ Advanced
          </button>
        </div>
      </div>

      {/* Featured Primary Module */}
      <div className="bg-white dark:bg-gray-900 border-2 border-indigo-500/30 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <Badge variant="indigo" className="mb-2">Core Curriculum</Badge>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {CURRICULUM.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {CURRICULUM.subtitle}
            </p>
          </div>
          <Link to="/learn/pixels-to-matrices">
            <Button variant="primary">Begin 7-Step Journey →</Button>
          </Link>
        </div>

        {/* 7 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CURRICULUM.steps.map((step) => (
            <div
              key={step.id}
              className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
                  {step.id}
                </span>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {step.shortTitle}
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                {step.summary}
              </p>
              <div className="flex flex-wrap gap-1">
                {step.concepts.slice(0, 2).map((c) => (
                  <span key={c} className="text-[10px] bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Extensible Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Roadmap & Upcoming Modules
          </h3>
          <span className="text-xs text-gray-500">Modular Architecture</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CURRICULUM.upcomingModules.map((mod) => (
            <div
              key={mod.id}
              className="p-5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  {mod.title}
                </span>
                <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                  {mod.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {mod.summary}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
