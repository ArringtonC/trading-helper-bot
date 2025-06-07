import React from 'react';
import { useNavigate } from 'react-router-dom';
import SellingCallsTutorial from '../../components/SellingCallsTutorial';

const SellingCallsTutorialPage: React.FC = () => {
  const navigate = useNavigate();

  const handleTutorialComplete = () => {
    // Navigate to options trading after completing the advanced tutorial series
    navigate('/options');
  };

  const handleNext = () => {
    // Could navigate to live trading or analysis tools
    navigate('/analysis');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      {/* Tutorial Header */}
      <div className="bg-white shadow-sm border-b border-red-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🚨 NVDA Naked Call Trading Master Class
              </h1>
              <p className="text-gray-600 mt-1">
                <span className="text-red-600 font-semibold">HIGH RISK:</span> Professional-level naked call strategies with unlimited loss potential
              </p>
            </div>
            <button
              onClick={() => navigate('/stacking-tutorial')}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              ← Back to Stacking Tutorial
            </button>
          </div>
        </div>
      </div>

      {/* Risk Warning Banner */}
      <div className="bg-red-600 text-white py-3">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-yellow-300">⚠️</span>
            <p className="font-semibold">
              EXTREME RISK: This tutorial covers naked call options with unlimited loss potential. 
              Suitable only for experienced traders with $100,000+ accounts.
            </p>
            <span className="text-yellow-300">⚠️</span>
          </div>
        </div>
      </div>

      {/* Tutorial Content */}
      <div className="py-8">
        <SellingCallsTutorial
          onComplete={handleTutorialComplete}
          onNext={handleNext}
        />
      </div>

      {/* Tutorial Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🎓 Advanced Options Training Complete
            </h3>
            <p className="text-gray-600 mb-4">
              You've completed the full NVDA options tutorial series: Basic → Stacking → Naked Calls
            </p>
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800">✅ Covered Calls</h4>
                <p className="text-sm text-green-700">Safe income generation</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800">✅ Stacking</h4>
                <p className="text-sm text-purple-700">Multiple positions</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800">✅ Naked Calls</h4>
                <p className="text-sm text-red-700">Professional risk management</p>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/options')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Start Live Options Trading →
              </button>
              <button
                onClick={() => navigate('/analysis')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
              >
                Use AI Analysis Tools →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer Footer */}
      <div className="bg-gray-800 text-white py-4">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm text-center text-gray-300">
            <strong>Disclaimer:</strong> This tutorial is for educational purposes only. Options trading involves substantial risk. 
            Naked call options have unlimited loss potential. Only trade with money you can afford to lose. 
            Consider consulting a financial advisor before implementing these strategies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellingCallsTutorialPage; 