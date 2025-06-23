import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeftIcon, HomeIcon } from '@heroicons/react/24/outline';
import { GoalSizingConfig } from '../../../features/goal-setting/types/goalSizing';

// Add slider styles
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #2563eb;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #2563eb;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider::-webkit-slider-track {
    height: 8px;
    border-radius: 4px;
    background: #e5e7eb;
  }
  
  .slider::-moz-range-track {
    height: 8px;
    border-radius: 4px;
    background: #e5e7eb;
  }
`;

interface WizardData {
  config?: GoalSizingConfig;
  goalType?: string;
  currentBalance?: number;
  targetBalance?: number;
  timeHorizonMonths?: number;
  riskTolerance?: string;
  winRate?: number;
  avgRewardRisk?: number;
  tradingExperience?: string;
  riskPerTrade?: number;
  rewardRiskRatio?: number;
}

interface CustomParams {
  winRate: number;
  riskPerTrade: number;
  rewardRiskRatio: number;
}

interface CalculationResults {
  expectedReturnPerTrade: string;
  requiredTradesPerMonth: number;
  kellyOptimalSize: string;
  monthlyGrowthNeeded: string;
  startingPositionSize: number;
  isAchievable: boolean;
  riskAssessment: string;
}

interface ChartDataPoint {
  month: number;
  balance: number;
  target: number;
}

const PositionSizingResults: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for data in location.state first, then sessionStorage
  let wizardData = location.state as WizardData;
  if (!wizardData) {
    const sessionData = sessionStorage.getItem('goalSizingResults');
    if (sessionData) {
      try {
        wizardData = JSON.parse(sessionData);
        // Clear the session data after using it
        sessionStorage.removeItem('goalSizingResults');
      } catch (error) {
        console.error('Failed to parse session data:', error);
      }
    }
  }

  // Convert GoalSizingConfig data to the format expected by this component
  const extractWizardData = (data: WizardData): WizardData => {
    if (!data) return {};
    
    // If it's already in the right format, use it
    if (data.currentBalance && data.targetBalance && data.timeHorizonMonths) {
      return data;
    }
    
    // Convert from GoalSizingConfig format
    return {
      goalType: data.config?.goalType || 'capitalObjective',
      currentBalance: data.config?.capitalObjectiveParameters?.currentBalance || data.currentBalance || 5000,
      targetBalance: data.config?.capitalObjectiveParameters?.targetBalance || data.targetBalance || 20000,
      timeHorizonMonths: data.config?.capitalObjectiveParameters?.timeHorizonMonths || data.timeHorizonMonths || 24,
      riskTolerance: data.riskTolerance || 'moderate',
      winRate: data.winRate || data.config?.tradeStatistics?.winRate || 60,
      avgRewardRisk: data.avgRewardRisk || data.config?.tradeStatistics?.payoffRatio || 2.0,
      riskPerTrade: data.riskPerTrade || data.config?.sizingRules?.baseSizePercentage || 2.5,
      rewardRiskRatio: data.rewardRiskRatio || data.config?.tradeStatistics?.payoffRatio || 2.0,
      tradingExperience: data.tradingExperience || 'import'
    };
  };

  const processedWizardData = extractWizardData(wizardData);

  const [customParams, setCustomParams] = useState<CustomParams>({
    winRate: processedWizardData.winRate || 60,
    riskPerTrade: processedWizardData.riskTolerance === 'conservative' ? 1.5 : 
                   processedWizardData.riskTolerance === 'moderate' ? 2.5 : 3.5,
    rewardRiskRatio: processedWizardData.avgRewardRisk || 2.0
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Error handling for missing wizard data
  useEffect(() => {
    if (!processedWizardData?.currentBalance && !location.state) {
      console.warn('No wizard data found, redirecting to dashboard');
      window.location.assign('/unified-dashboard');
    }
  }, [processedWizardData, location.state]);

  useEffect(() => {
    if (processedWizardData?.currentBalance && processedWizardData?.targetBalance && processedWizardData?.timeHorizonMonths) {
      calculateStrategy();
    }
  }, [customParams, processedWizardData]);

  const calculateStrategy = () => {
    if (!processedWizardData?.currentBalance || !processedWizardData?.targetBalance || !processedWizardData?.timeHorizonMonths) {
      return;
    }

    const { currentBalance, targetBalance, timeHorizonMonths } = processedWizardData;
    const { winRate, riskPerTrade, rewardRiskRatio } = customParams;
    
    const winRateDecimal = winRate / 100;
    const riskPerTradeDecimal = riskPerTrade / 100;
    const expectedReturn = (winRateDecimal * rewardRiskRatio * riskPerTradeDecimal) - ((1 - winRateDecimal) * riskPerTradeDecimal);
    
    // Calculate required monthly return to reach goal
    const growthMultiplier = targetBalance / currentBalance;
    const requiredMonthlyReturn = Math.pow(growthMultiplier, 1/timeHorizonMonths) - 1;
    const requiredTradesPerMonth = expectedReturn > 0 ? requiredMonthlyReturn / expectedReturn : 0;
    
    // Kelly Criterion
    const kellyFraction = ((winRateDecimal * rewardRiskRatio) - (1 - winRateDecimal)) / rewardRiskRatio;
    const kellyPercentage = Math.max(0, kellyFraction * 100);
    
    // Simulate growth over time
    const monthlyData: ChartDataPoint[] = [];
    let currentBal = currentBalance;
    
    for (let month = 0; month <= timeHorizonMonths; month++) {
      monthlyData.push({
        month,
        balance: Math.round(currentBal),
        target: Math.round(currentBalance * Math.pow(growthMultiplier, month/timeHorizonMonths))
      });
      
      if (month < timeHorizonMonths) {
        // Simulate monthly growth
        const monthlyGrowth = currentBal * expectedReturn * Math.min(requiredTradesPerMonth, 100);
        currentBal += monthlyGrowth;
      }
    }

    setResults({
      expectedReturnPerTrade: (expectedReturn * 100).toFixed(2),
      requiredTradesPerMonth: Math.ceil(Math.max(0, requiredTradesPerMonth)),
      kellyOptimalSize: kellyPercentage.toFixed(1),
      monthlyGrowthNeeded: (requiredMonthlyReturn * 100).toFixed(2),
      startingPositionSize: Math.round(currentBalance * riskPerTradeDecimal),
      isAchievable: expectedReturn > 0 && requiredTradesPerMonth < 100 && requiredTradesPerMonth > 0,
      riskAssessment: riskPerTrade > kellyPercentage ? 'High' : riskPerTrade < kellyPercentage * 0.5 ? 'Conservative' : 'Optimal'
    });
    
    setChartData(monthlyData);
  };

  const handleStartOver = () => {
    window.location.assign('/unified-dashboard');
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Show loading if no data yet
  if (!processedWizardData?.currentBalance && !location.state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{sliderStyles}</style>
      {/* Header with Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Back
              </button>
              
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-2 text-sm">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.assign('/');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Go to Home"
                >
                  <HomeIcon className="h-4 w-4" />
                </button>
                <span className="text-gray-400">/</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.assign('/unified-dashboard');
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Dashboard
                </button>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">Goal Setup</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium">Position Sizing Results</span>
              </nav>
            </div>
            
            <button
              onClick={handleStartOver}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Your Position Sizing Strategy</h1>
              <p className="text-gray-600 mt-1">
                Grow ${processedWizardData.currentBalance?.toLocaleString()} → ${processedWizardData.targetBalance?.toLocaleString()} 
                in {processedWizardData.timeHorizonMonths} months
              </p>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Save Strategy
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <div className="lg:col-span-2 space-y-6">
            {results && (
              <>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Strategy Overview</h2>
                  
                  {!results.isAchievable && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                      <p className="text-red-800 font-medium">⚠️ Goal may not be achievable with current parameters</p>
                      <p className="text-red-600 text-sm">Consider adjusting your timeline, win rate, or risk tolerance.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Position Size</p>
                      <p className="text-xl font-bold text-blue-600">${results.startingPositionSize?.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Trades/Month</p>
                      <p className="text-xl font-bold text-green-600">{results.requiredTradesPerMonth}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Monthly Growth</p>
                      <p className="text-xl font-bold text-purple-600">{results.monthlyGrowthNeeded}%</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Risk Level</p>
                      <p className={`text-xl font-bold ${
                        results.riskAssessment === 'High' ? 'text-red-600' : 
                        results.riskAssessment === 'Conservative' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {results.riskAssessment}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Growth Projection</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                        <Line type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={2} name="Projected Balance" />
                        <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Target Path" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Fine-tune Strategy</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Win Rate ({customParams.winRate}%)
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="80"
                    value={customParams.winRate}
                    onChange={(e) => setCustomParams(prev => ({...prev, winRate: Number(e.target.value)}))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>30%</span>
                    <span>80%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Risk Per Trade ({customParams.riskPerTrade}%)
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={customParams.riskPerTrade}
                    onChange={(e) => setCustomParams(prev => ({...prev, riskPerTrade: Number(e.target.value)}))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5%</span>
                    <span>5%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reward:Risk ({customParams.rewardRiskRatio}:1)
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={customParams.rewardRiskRatio}
                    onChange={(e) => setCustomParams(prev => ({...prev, rewardRiskRatio: Number(e.target.value)}))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5:1</span>
                    <span>5:1</span>
                  </div>
                </div>
              </div>
            </div>

            {results && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Expected return/trade:</span>
                    <span className="font-medium">{results.expectedReturnPerTrade}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kelly optimal size:</span>
                    <span className="font-medium">{results.kellyOptimalSize}%</span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-600">
                      Your strategy requires {results.requiredTradesPerMonth} profitable trades per month 
                      with consistent {customParams.riskPerTrade}% risk per trade.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Strategy Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">💡 Strategy Tips</h4>
              <div className="space-y-2 text-sm text-yellow-700">
                <p>• Start with smaller position sizes until you validate your win rate</p>
                <p>• Monitor your actual performance vs. projections monthly</p>
                <p>• Adjust risk per trade based on market conditions</p>
                <p>• Consider correlation between positions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionSizingResults; 