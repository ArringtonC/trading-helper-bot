import React from 'react';
import { useNavigate } from 'react-router-dom';
import StackingCoveredCallsTutorial from '../../../features/learning/components/StackingCoveredCallsTutorial';

const StackingCoveredCallsTutorialPage: React.FC = () => {
  const navigate = useNavigate();

  const handleTutorialComplete = () => {
    // Navigate to naked calls tutorial after stacking tutorial completion
    navigate('/selling-calls-tutorial');
  };

  const handleNext = () => {
    // Could navigate to another related tutorial or analysis
    navigate('/options');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      {/* Tutorial Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🔄 NVDA Stacking Covered Calls Master Class
              </h1>
              <p className="text-gray-600 mt-1">
                Advanced income generation with multiple overlapping positions - transform single covered calls into professional income
              </p>
            </div>
            <button
              onClick={() => navigate('/nvda-tutorial')}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              ← Back to Basic Tutorial
            </button>
          </div>
        </div>
      </div>

      {/* Tutorial Content */}
      <div className="py-8">
        <StackingCoveredCallsTutorial
          onComplete={handleTutorialComplete}
          onNext={handleNext}
        />
      </div>

      {/* Tutorial Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready for More Advanced Strategies?
            </h3>
            <p className="text-gray-600 mb-4">
              Continue with more advanced options strategies or explore futures trading with technical analysis.
            </p>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800">🚨 Naked Calls</h4>
                <p className="text-sm text-red-700">Maximum income, unlimited risk</p>
                <button
                  onClick={() => navigate('/selling-calls-tutorial')}
                  className="text-red-600 text-sm font-medium mt-2 hover:underline"
                >
                  Expert Level →
                </button>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">📊 Futures Trading</h4>
                <p className="text-sm text-blue-700">MES 20/50 EMA strategy</p>
                <button
                  onClick={() => navigate('/mes-futures-tutorial')}
                  className="text-blue-600 text-sm font-medium mt-2 hover:underline"
                >
                  Learn Futures →
                </button>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/selling-calls-tutorial')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium"
              >
                Advanced: Naked Calls →
              </button>
              <button
                onClick={() => navigate('/options')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Practice Options Trading →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StackingCoveredCallsTutorialPage; 