import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Options from './pages/Options';
import Futures from './pages/Futures';
import Settings from './pages/Settings';
import Import from './pages/Import';

const App: React.FC = () => {
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
            <Route path="/options" element={<Options />} />
            <Route path="/futures" element={<Futures />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/import" element={<Import />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-100 border-t border-gray-200 p-4 text-center text-gray-500 text-sm">
          <p>Trading Helper Bot - Demo Version</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
