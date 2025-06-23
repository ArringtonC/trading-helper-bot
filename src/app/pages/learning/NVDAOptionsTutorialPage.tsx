import React from 'react';
import { useNavigate } from 'react-router-dom';
import NVDAOptionsTutorial from '../../../features/learning/components/NVDAOptionsTutorial';

const NVDAOptionsTutorialPage: React.FC = () => {
  const navigate = useNavigate();

  const handleTutorialComplete = () => {
    // Navigate to stacking tutorial after basic tutorial completion
    navigate('/stacking-tutorial');
  };

  const handleNext = () => {
    // Could navigate to another related tutorial
    navigate('/visualizer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      {/* Tutorial Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📈 NVDA Options & Time Decay Tutorial
              </h1>
              <p className="text-gray-600 mt-1">
                Learn covered call strategies with real NVDA examples - understand time decay, risk management, and position sizing
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Tutorial Content */}
      <div className="py-8">
        <NVDAOptionsTutorial
          onComplete={handleTutorialComplete}
          onNext={handleNext}
        />
      </div>

      {/* Tutorial Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready for More Trading Strategies?
            </h3>
            <p className="text-gray-600 mb-4">
              Continue your trading education with advanced options strategies or explore futures trading.
            </p>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800">🔄 Advanced Options</h4>
                <p className="text-sm text-purple-700">Stacking & naked calls</p>
                <button
                  onClick={() => navigate('/stacking-tutorial')}
                  className="text-purple-600 text-sm font-medium mt-2 hover:underline"
                >
                  Advanced NVDA →
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
                onClick={() => navigate('/stacking-tutorial')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-medium"
              >
                Advanced: Stacking Calls →
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

export default NVDAOptionsTutorialPage; 