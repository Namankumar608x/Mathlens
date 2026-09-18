import { Routes, Route } from 'react-router-dom';
import { UserLevelProvider } from './context/UserLevelContext.jsx';
import { ProgressProvider } from './context/ProgressContext.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { LevelSelectorModal } from './modules/onboarding/LevelSelectorModal.jsx';

import { HomeScreen } from './screens/HomeScreen.jsx';
import { ModuleViewScreen } from './screens/ModuleViewScreen.jsx';
import { SandboxScreen } from './screens/SandboxScreen.jsx';
import { NotFoundScreen } from './screens/NotFoundScreen.jsx';

function App() {
  return (
    <UserLevelProvider>
      <ProgressProvider>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
          {/* Main App Navigation */}
          <Navbar />

          {/* Onboarding Level Selector Modal */}
          <LevelSelectorModal />

          {/* Page Routing */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/learn/pixels-to-matrices" element={<ModuleViewScreen />} />
              <Route path="/sandbox" element={<SandboxScreen />} />
              <Route path="*" element={<NotFoundScreen />} />
            </Routes>
          </main>

          <footer className="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
            MathLens &bull; Visual & Interactive Linear Algebra for Digital Images
          </footer>
        </div>
      </ProgressProvider>
    </UserLevelProvider>
  );
}

export default App;
