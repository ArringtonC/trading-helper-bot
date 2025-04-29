import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { PLDashboard } from './pages/PLDashboard';
import OptionsDB from './pages/OptionsDB';
import Futures from './pages/Futures';
import Settings from './pages/Settings';
import Import from './pages/Import';
import ImportToDatabase from './pages/ImportToDatabase';
import DirectIBKRTester from './components/DirectIBKRTester';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
  // Initialize sample data when the app starts
  // useEffect(() => {
  //   initializeSampleData();
  // }, []);

  return (
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/pl-dashboard" element={<PLDashboard />} />
            <Route path="/options" element={<OptionsDB />} />
            <Route path="/options-db" element={<OptionsDB />} />
            <Route path="/futures" element={<Futures />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/import" element={<Import />} />
            <Route path="/import/fixed-import" element={<ImportToDatabase />} />
            <Route path="/import/direct" element={<DirectIBKRTester />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-100 border-t border-gray-200 p-4 text-center text-gray-500 text-sm">
          <p>Trading Helper Bot - Demo Version</p>
        </footer>
        <ToastContainer />
      </div>
    </Router>
  );
};

export default App;
