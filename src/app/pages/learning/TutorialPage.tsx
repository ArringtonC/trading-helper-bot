import React from 'react';
import { useNavigate } from 'react-router-dom';
import PositionSizingTutorial from '../../../shared/components/ui/PositionSizingTutorial';
import '../../../shared/styles/tutorial.css';

const TutorialPage: React.FC = () => {
  const navigate = useNavigate();

  const handleTutorialComplete = () => {
    // Navigate to strategy visualizer after tutorial completion
    navigate('/visualizer');
  };

  const handleExpertMode = () => {
    // Navigate to the main position sizing page
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Tutorial Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🎮 Interactive Position Sizing Tutorial
              </h1>
              <p className="text-gray-600 mt-1">
                Learn position sizing through hands-on practice and gamified lessons
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              ← Back to Position Sizing
            </button>
          </div>
        </div>
      </div>

      {/* Tutorial Content */}
      <div className="py-8">
        <PositionSizingTutorial
          onComplete={handleTutorialComplete}
          onExpertMode={handleExpertMode}
        />
      </div>

      {/* Tutorial Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              🎯 <strong>Goal:</strong> Master position sizing to protect your trading capital
            </p>
            <p className="text-sm">
              This tutorial teaches the mathematical foundations used by professional traders
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage; 