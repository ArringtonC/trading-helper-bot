import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import { PLDashboard } from './pages/PLDashboard';
import OptionsDB from './pages/OptionsDB';
import Settings from './pages/Settings';
import ImportToDatabase from './pages/ImportToDatabase';
import { ImportDirect } from './pages/ImportDirect';
import AITradeAnalysis from './pages/AITradeAnalysis';
import { ToastContainer } from 'react-toastify';
import { loadSetting, initializeSettings } from './services/SettingsService';
import 'react-toastify/dist/ReactToastify.css';
import { WinRateProvider } from './context/WinRateContext';

const App: React.FC = () => {
  // Initialize settings on app start
  useEffect(() => {
    initializeSettings();
  }, []);

  // Check feature flags
  const showImport = loadSetting('showImport') === 'true';
  const showDirectImport = loadSetting('showDirectImport') === 'true';

  return (
    <WinRateProvider>
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-800 text-white p-4">
          <h1 className="text-2xl font-bold">Trading Helper Bot</h1>
        </header>
      
        {/* Navigation */}
        <Navigation />
        
        {/* Main Content */}
        <main className="max-w-6xl mx-auto p-4">
          <Routes>
              <Route path="/" element={<PLDashboard />} />
              <Route path="/options" element={<OptionsDB />} />
              <Route path="/analysis" element={<AITradeAnalysis />} />
            <Route path="/settings" element={<Settings />} />
              {showImport && (
                <Route path="/import" element={<ImportToDatabase />} />
              )}
              {showDirectImport && (
                <Route path="/import/direct" element={<ImportDirect />} />
              )}
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-100 border-t border-gray-200 p-4 text-center text-gray-500 text-sm">
          <p>Trading Helper Bot - Demo Version</p>
        </footer>
          <ToastContainer />
      </div>
    </Router>
    </WinRateProvider>
  );
};

export default App;
