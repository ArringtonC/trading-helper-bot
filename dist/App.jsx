import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import { PLDashboard } from './pages/PLDashboard';
import DashboardPage from './pages/DashboardPage';
import OptionsDB from './pages/OptionsDB';
import Settings from './pages/Settings';
import ImportToDatabase from './pages/ImportToDatabase';
import { ImportDirect } from './pages/ImportDirect';
import AITradeAnalysis from './pages/AITradeAnalysis';
import StrategyVisualizer from './pages/StrategyVisualizer';
import { ToastContainer } from 'react-toastify';
import { loadSetting, initializeSettings } from './services/SettingsService';
import 'react-toastify/dist/ReactToastify.css';
import 'highlight.js/styles/github.css';
import { WinRateProvider } from './context/WinRateContext';
import RuleEngineDemo from './pages/RuleEngineDemo';
import { TradesProvider } from './context/TradesContext';
import ImportAnalyze from './pages/ImportAnalyze';
import { TutorialProvider } from './context/TutorialContext';
import { TutorialDisplay } from './components/Wizards/TutorialDisplay';
var App = function () {
    // Initialize settings on app start
    useEffect(function () {
        initializeSettings();
    }, []);
    // Check feature flags
    var showImport = loadSetting('showImport') === 'true';
    var showDirectImport = loadSetting('showDirectImport') === 'true';
    return (<WinRateProvider>
      <TradesProvider>
        <TutorialProvider>
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
                    <Route path="/" element={<DashboardPage />}/>
                    <Route path="/pldashboard" element={<PLDashboard />}/>
                    <Route path="/options" element={<OptionsDB />}/>
                    <Route path="/analysis" element={<AITradeAnalysis />}/>
                    <Route path="/visualizer" element={<StrategyVisualizer />}/>
                        <Route path="/rule-engine-demo" element={<RuleEngineDemo />}/>
                        <Route path="/import-analyze" element={<ImportAnalyze />}/>
                  <Route path="/settings" element={<Settings />}/>
                    {showImport && (<Route path="/import" element={<ImportToDatabase />}/>)}
                    {showDirectImport && (<Route path="/import/direct" element={<ImportDirect />}/>)}
                </Routes>
              </main>
              
              {/* Footer */}
              <footer className="bg-gray-100 border-t border-gray-200 p-4 text-center text-gray-500 text-sm">
                <p>Trading Helper Bot - Demo Version</p>
              </footer>
                <ToastContainer />
                <TutorialDisplay />
            </div>
          </Router>
        </TutorialProvider>
      </TradesProvider>
    </WinRateProvider>);
};
export default App;
