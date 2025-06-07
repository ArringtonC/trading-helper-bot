import React, { useState, useEffect } from 'react';
import StreamlinedDashboard from '../../components/ui/StreamlinedDashboard';
import { UserExperienceLevel } from '../../utils/ux/UXLayersController';
import { hasSampleData, populateSampleData } from '../../utils/testData';

const AnalyticsTestPage: React.FC = () => {
  const [userLevel, setUserLevel] = useState<UserExperienceLevel>('learning');
  const [hasData, setHasData] = useState<boolean>(false);
  const [isPopulating, setIsPopulating] = useState<boolean>(false);
  const [populationStatus, setPopulationStatus] = useState<string>('');

  // Check for existing data on component mount
  useEffect(() => {
    const checkData = async () => {
      try {
        const dataExists = await hasSampleData();
        setHasData(dataExists);
        if (dataExists) {
          setPopulationStatus('✅ Trading data found in database');
        } else {
          setPopulationStatus('⚠️ No trading data found - click "Generate Sample Data" to populate');
        }
      } catch (error) {
        console.error('Error checking for data:', error);
        setPopulationStatus('❌ Error checking for data');
      }
    };
    
    checkData();
  }, []);

  const handlePopulateSampleData = async () => {
    setIsPopulating(true);
    setPopulationStatus('🔄 Generating sample trading data...');
    
    try {
      await populateSampleData();
      setHasData(true);
      setPopulationStatus('✅ Sample data generated successfully! Refresh the analytics below.');
    } catch (error) {
      console.error('Error populating sample data:', error);
      setPopulationStatus('❌ Failed to generate sample data');
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 UnifiedAnalyticsEngine Test Page
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Test the progressive disclosure and analytics consolidation features of the UnifiedAnalyticsEngine.
          </p>
          
          {/* Data Status and Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Management</h2>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Database Status:</p>
                <p className={`text-sm font-medium ${
                  hasData ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {populationStatus}
                </p>
              </div>
              
              <button
                onClick={handlePopulateSampleData}
                disabled={isPopulating}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isPopulating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isPopulating ? 'Generating...' : 'Generate Sample Data'}
              </button>
            </div>
            
            {hasData && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  📊 Sample data includes 50 realistic trades (70% options, 30% stocks) across 8 symbols over the past year.
                  This provides comprehensive data for testing all analytics modules.
                </p>
              </div>
            )}
          </div>
          
          {/* User Level Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Controls</h2>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                User Experience Level:
              </label>
              <div className="flex space-x-2">
                {(['learning', 'import', 'broker'] as UserExperienceLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setUserLevel(level)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      userLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Expected Modules Info */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Expected Modules for {userLevel}:</h3>
              <div className="text-sm text-gray-600">
                {userLevel === 'learning' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Core (3 modules):</strong> Position Summary, Basic Risk Metrics, Trade Performance</li>
                    <li><strong>Progressive disclosure:</strong> Shows essential features only</li>
                  </ul>
                )}
                {userLevel === 'import' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Core (3 modules):</strong> Position Summary, Basic Risk Metrics, Trade Performance</li>
                    <li><strong>Intermediate (4 modules):</strong> Performance Charts, Strategy Heatmap, Correlation Analysis, Advanced Risk Analysis</li>
                    <li><strong>Total:</strong> 7 modules visible</li>
                  </ul>
                )}
                {userLevel === 'broker' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Core (3 modules):</strong> Position Summary, Basic Risk Metrics, Trade Performance</li>
                    <li><strong>Intermediate (4 modules):</strong> Performance Charts, Strategy Heatmap, Correlation Analysis, Advanced Risk Analysis</li>
                    <li><strong>Advanced (4 modules):</strong> Greeks Dashboard, Market Regime Analysis, Volatility Surface, Portfolio Optimization</li>
                    <li><strong>Total:</strong> 11 modules visible (full suite)</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800">
              Live Analytics Dashboard
            </h2>
            <p className="text-gray-600 mt-1">
              Real-time testing of the UnifiedAnalyticsEngine with progressive disclosure
            </p>
          </div>
          
          <StreamlinedDashboard
            userLevel={userLevel}
            onUserLevelChange={setUserLevel}
            className="p-0"
          />
        </div>

        {/* Testing Notes */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">🔍 Testing Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Progressive Disclosure:</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Beginner shows 3 core modules only</li>
                <li>Intermediate shows 7 modules (core + intermediate)</li>
                <li>Advanced shows all 11 modules</li>
                <li>Module categories are properly labeled</li>
                <li>Expandable content works for intermediate/advanced modules</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Data Integration:</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Real-time data loading from services</li>
                <li>Proper error handling and fallbacks</li>
                <li>Caching system working efficiently</li>
                <li>Data quality metrics displayed</li>
                <li>Last updated timestamp shows</li>
              </ul>
            </div>
          </div>
        </div>

        {userLevel === 'learning' && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800">Learning Level Analytics</h4>
            <p className="text-green-700">Basic analytics for new traders</p>
          </div>
        )}
        {userLevel === 'import' && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800">Import Level Analytics</h4>
            <p className="text-blue-700">Data analysis tools for experienced traders</p>
          </div>
        )}
        {userLevel === 'broker' && (
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-800">Broker Level Analytics</h4>
            <p className="text-purple-700">Advanced analytics with broker integration</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsTestPage; 