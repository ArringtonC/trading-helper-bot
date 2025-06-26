import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import AffordableStockFinder from './AffordableStockFinder';

// Import the StockOption type from AffordableStockFinder
import CommonMistakesEducation from './CommonMistakesEducation';

interface AffordableStockOption {
  symbol: string;
  price: number;
  name: string;
  sector: string;
  optionVolume: 'High' | 'Medium' | 'Low';
  volatility: number;
  weeklyOptions: boolean;
  reasonForRecommendation: string;
  estimatedPremium: number;
}

interface NVDAOptionsTutorialProps {
  onComplete?: () => void;
  onNext?: () => void;
}

interface TutorialState {
  currentStep: number;
  startingBalance: number;
  currentBalance: number;
  currentMonth: number;
  nvdaShares: number;
  nvdaPrice: number;
  totalPremiumsCollected: number;
  totalProfitLoss: number;
  hasCompletedMistakesEducation: boolean;
  yearlyData: MonthlyData[];
  showAlternatives: boolean;
  selectedAlternative: NVDAStockOption | null;
}

interface MonthlyData {
  month: number;
  monthName: string;
  stockPrice: number;
  strikePrice: number;
  premiumCollected: number;
  totalBalance: number;
  totalReturn: number;
  wasAssigned: boolean;
  action: string;
  lessons: string[];
}

interface NVDAStockOption {
  symbol: string;
  price: number;
  name: string;
  sector: string;
  optionVolume: 'High' | 'Medium' | 'Low';
  volatility: number;
  weeklyOptions: boolean;
  reasonForRecommendation: string;
  estimatedPremium: number;
  minInvestment: number;
}

interface RiskScenario {
  name: string;
  description: string;
  stockPriceChange: number;
  impact: string;
  action: string;
  probability: string;
}

const NVDAOptionsTutorial: React.FC<NVDAOptionsTutorialProps> = ({
  onComplete,
  onNext
}) => {
  // Define the function before using it in useState
  const getMonthlyLessons = (month: number, wasAssigned: boolean, totalReturn: number): string[] => {
    const lessons = [
      // Month 1
      ['Initial position setup', 'Understanding time decay', 'Monitoring stock movement'],
      // Month 2
      ['Strike selection refinement', 'Rolling strategies', 'Volatility impact'],
      // Month 3
      ['Earnings season preparation', 'IV crush effects', 'Position sizing'],
      // Month 4
      ['Assignment management', 'Tax implications', 'Reentry strategies'],
      // Month 5
      ['Market correlation', 'Sector rotation effects', 'Risk adjustment'],
      // Month 6
      ['Mid-year review', 'Performance analysis', 'Strategy optimization'],
      // Month 7
      ['Summer volatility patterns', 'Liquidity considerations', 'Option chain analysis'],
      // Month 8
      ['Tech earnings season', 'Conference impacts', 'News reaction management'],
      // Month 9
      ['Q3 positioning', 'Volatility term structure', 'Delta management'],
      // Month 10
      ['Market uncertainty preparation', 'Defensive positioning', 'Portfolio correlation'],
      // Month 11
      ['Year-end planning', 'Tax harvesting', 'Holiday effects'],
      // Month 12
      ['Annual review', 'Strategy refinement', 'Next year planning']
    ];
    
    const monthLessons = lessons[month - 1] || ['General options education', 'Risk management', 'Market analysis'];
    
    if (wasAssigned) {
      monthLessons.push('Assignment execution', 'Profit realization');
    }
    
    if (totalReturn < 0) {
      monthLessons.push('Loss management', 'Recovery strategies');
    }
    
    return monthLessons;
  };

  const [state, setState] = useState<TutorialState>(() => {
    // Generate realistic year-long data for NVDA covered calls
    const startingBalance = 25000;
    const startingNVDAPrice = 145.50;
    const monthlyData: MonthlyData[] = [];
    
    let currentBalance = startingBalance;
    let stockPrice = startingNVDAPrice;
    let totalPremiums = 0;
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    for (let month = 1; month <= 12; month++) {
      // Simulate realistic NVDA price movement
      const priceChange = (Math.random() - 0.5) * 0.15; // ±15% monthly volatility
      stockPrice = stockPrice * (1 + priceChange);
      
      // Calculate strike price (typically 5-10% OTM)
      const strikePrice = Math.round(stockPrice * 1.07);
      
      // Calculate premium (typically 1-3% of stock price)
      const premiumRate = 0.015 + (Math.random() * 0.015); // 1.5-3%
      const premium = Math.round(stockPrice * 100 * premiumRate);
      
      // Check if assigned (happens ~30% of the time)
      const wasAssigned = stockPrice > strikePrice;
      
      if (wasAssigned) {
        // Stock was called away, calculate profit
        currentBalance = currentBalance - (startingNVDAPrice * 100) + (strikePrice * 100) + premium;
        // Need to rebuy at current market price
      } else {
        // Keep stock, collect premium
        currentBalance += premium;
      }
      
      totalPremiums += premium;
      const totalReturn = ((currentBalance - startingBalance) / startingBalance) * 100;
      
      monthlyData.push({
        month,
        monthName: monthNames[month - 1],
        stockPrice: Math.round(stockPrice * 100) / 100,
        strikePrice,
        premiumCollected: premium,
        totalBalance: Math.round(currentBalance),
        totalReturn: Math.round(totalReturn * 100) / 100,
        wasAssigned,
        action: wasAssigned ? 'Assigned & Rebought' : 'Kept Stock',
        lessons: getMonthlyLessons(month, wasAssigned, totalReturn)
      });
    }
    
    return {
      currentStep: -1, // Start with mistakes education
      startingBalance,
      currentBalance: Math.round(currentBalance),
      currentMonth: 1,
      nvdaShares: 100,
      nvdaPrice: startingNVDAPrice,
      totalPremiumsCollected: totalPremiums,
      totalProfitLoss: Math.round(currentBalance - startingBalance),
      hasCompletedMistakesEducation: false,
      yearlyData: monthlyData,
      showAlternatives: false,
      selectedAlternative: null
    };
  });

  const canAffordNVDA = state.startingBalance >= 20000; // Realistic minimum for NVDA

  const nvdaAlternatives: NVDAStockOption[] = [
    {
      symbol: 'AAPL',
      price: 185.00,
      name: 'Apple Inc.',
      sector: 'Technology',
      optionVolume: 'High',
      volatility: 28,
      weeklyOptions: true,
      reasonForRecommendation: 'Stable tech giant with excellent option liquidity',
      estimatedPremium: 4.50,
      minInvestment: 18500
    },
    {
      symbol: 'MSFT',
      price: 365.00,
      name: 'Microsoft Corporation',
      sector: 'Technology',
      optionVolume: 'High',
      volatility: 25,
      weeklyOptions: true,
      reasonForRecommendation: 'Low volatility, steady growth, consistent premiums',
      estimatedPremium: 8.20,
      minInvestment: 36500
    },
    {
      symbol: 'AMD',
      price: 105.00,
      name: 'Advanced Micro Devices',
      sector: 'Technology',
      optionVolume: 'High',
      volatility: 45,
      weeklyOptions: true,
      reasonForRecommendation: 'Higher volatility means higher premiums, but more risk',
      estimatedPremium: 3.80,
      minInvestment: 10500
    }
  ];

  const riskScenarios: RiskScenario[] = [
    {
      name: 'Bull Market Scenario',
      description: 'NVDA rises 20% in one month',
      stockPriceChange: 20,
      impact: 'Stock likely called away, realize capped gains',
      action: 'Accept assignment, look for reentry opportunity',
      probability: '15%'
    },
    {
      name: 'Bear Market Scenario', 
      description: 'NVDA drops 25% due to market correction',
      stockPriceChange: -25,
      impact: 'Unrealized loss partially offset by premium',
      action: 'Hold position if fundamentals intact, may average down',
      probability: '10%'
    },
    {
      name: 'Earnings Volatility',
      description: 'Stock swings ±15% after earnings',
      stockPriceChange: 15,
      impact: 'High volatility creates opportunities and risks',
      action: 'Avoid selling calls before earnings, wait for volatility',
      probability: '25%'
    },
    {
      name: 'Steady Grind',
      description: 'Stock moves slowly upward 2-5%',
      stockPriceChange: 3,
      impact: 'Ideal scenario - collect premium, keep stock',
      action: 'Continue strategy, roll up strikes if needed',
      probability: '50%'
    }
  ];

  const getCurrentMonthData = () => {
    return state.yearlyData[state.currentMonth - 1] || state.yearlyData[0];
  };

  const handleAlternativeSelected = (stock: AffordableStockOption) => {
    // Convert AffordableStockOption to NVDAStockOption
    const nvdaStock: NVDAStockOption = {
      ...stock,
      minInvestment: stock.price * 100
    };
    
    setState(prev => ({
      ...prev,
      selectedAlternative: nvdaStock,
      showAlternatives: false,
      currentStep: 0
    }));
  };

  const nextStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1
    }));
  };

  const prevStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(-1, prev.currentStep - 1)
    }));
  };

  const nextMonth = () => {
    setState(prev => ({
      ...prev,
      currentMonth: Math.min(12, prev.currentMonth + 1)
    }));
  };

  const prevMonth = () => {
    setState(prev => ({
      ...prev,
      currentMonth: Math.max(1, prev.currentMonth - 1)
    }));
  };

  const renderBalanceDisplay = () => {
    const currentData = getCurrentMonthData();
    
    return (
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg shadow-lg mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">${state.startingBalance.toLocaleString()}</div>
            <div className="text-green-100 text-sm">Starting Balance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">${currentData.totalBalance.toLocaleString()}</div>
            <div className="text-green-100 text-sm">Current Balance</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${currentData.totalReturn >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {currentData.totalReturn >= 0 ? '+' : ''}{currentData.totalReturn}%
            </div>
            <div className="text-green-100 text-sm">Total Return</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">${state.totalPremiumsCollected.toLocaleString()}</div>
            <div className="text-green-100 text-sm">Premiums Collected</div>
          </div>
        </div>
      </div>
    );
  };

  const renderYearlyPerformanceChart = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">📈 Year-Long Performance Journey</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={state.yearlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthName" />
              <YAxis yAxisId="balance" orientation="left" />
              <YAxis yAxisId="return" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'totalBalance' ? `$${value.toLocaleString()}` : 
                  name === 'totalReturn' ? `${value}%` : 
                  `$${value}`,
                  name === 'totalBalance' ? 'Balance' : 
                  name === 'totalReturn' ? 'Return %' : 
                  'Premium'
                ]}
              />
              <Line yAxisId="balance" type="monotone" dataKey="totalBalance" stroke="#8884d8" strokeWidth={3} />
              <Line yAxisId="return" type="monotone" dataKey="totalReturn" stroke="#82ca9d" strokeWidth={2} />
              <Line yAxisId="balance" type="monotone" dataKey="premiumCollected" stroke="#ffc658" strokeWidth={1} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Blue: Account Balance | Green: Total Return % | Yellow: Monthly Premium
        </div>
      </div>
    );
  };

  const renderMonthlyBreakdown = () => {
    const currentData = getCurrentMonthData();
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">📅 Month {state.currentMonth}: {currentData.monthName}</h3>
          <div className="space-x-2">
            <button 
              onClick={prevMonth}
              disabled={state.currentMonth === 1}
              className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
            >
              ← Prev
            </button>
            <button 
              onClick={nextMonth}
              disabled={state.currentMonth === 12}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Stock Performance</h4>
            <div className="text-2xl font-bold text-blue-600 mb-1">${currentData.stockPrice}</div>
            <div className="text-sm text-blue-700">NVDA Price</div>
            <div className="text-xs text-blue-600 mt-1">
              Strike: ${currentData.strikePrice}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Premium Income</h4>
            <div className="text-2xl font-bold text-green-600 mb-1">${currentData.premiumCollected}</div>
            <div className="text-sm text-green-700">This Month</div>
            <div className="text-xs text-green-600 mt-1">
              {((currentData.premiumCollected / (state.nvdaPrice * 100)) * 100).toFixed(1)}% yield
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${currentData.wasAssigned ? 'bg-orange-50' : 'bg-purple-50'}`}>
            <h4 className={`font-semibold mb-2 ${currentData.wasAssigned ? 'text-orange-800' : 'text-purple-800'}`}>
              Outcome
            </h4>
            <div className={`text-lg font-bold mb-1 ${currentData.wasAssigned ? 'text-orange-600' : 'text-purple-600'}`}>
              {currentData.action}
            </div>
            <div className={`text-sm ${currentData.wasAssigned ? 'text-orange-700' : 'text-purple-700'}`}>
              {currentData.wasAssigned ? 'Stock Called Away' : 'Keep Stock + Premium'}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">🎓 Key Lessons This Month</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {currentData.lessons.map((lesson, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                {lesson}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderRiskScenarios = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">⚠️ Risk Scenarios & Management</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {riskScenarios.map((scenario, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{scenario.name}</h4>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">{scenario.probability}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
              <div className="text-xs space-y-1">
                <div><strong>Impact:</strong> {scenario.impact}</div>
                <div><strong>Action:</strong> {scenario.action}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFinalResults = () => {
    const finalData = state.yearlyData[11]; // December
    const successfulMonths = state.yearlyData.filter(m => m.premiumCollected > 0).length;
    const assignmentMonths = state.yearlyData.filter(m => m.wasAssigned).length;
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-2xl font-semibold mb-6 text-center">🎉 Your NVDA Covered Call Year Results</h3>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-green-800 mb-4">💰 Financial Results</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Starting Balance:</span>
                <span className="font-bold">${state.startingBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Final Balance:</span>
                <span className="font-bold text-green-600">${finalData.totalBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Total Profit:</span>
                <span className="font-bold text-green-600">${(finalData.totalBalance - state.startingBalance).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Annual Return:</span>
                <span className="font-bold text-green-600">{finalData.totalReturn}%</span>
              </div>
              <div className="flex justify-between">
                <span>Premium Income:</span>
                <span className="font-bold">${state.totalPremiumsCollected.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-800 mb-4">📊 Trading Statistics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Successful Months:</span>
                <span className="font-bold">{successfulMonths}/12</span>
              </div>
              <div className="flex justify-between">
                <span>Times Assigned:</span>
                <span className="font-bold">{assignmentMonths}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Monthly Premium:</span>
                <span className="font-bold">${Math.round(state.totalPremiumsCollected / 12).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Win Rate:</span>
                <span className="font-bold">{Math.round((successfulMonths / 12) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Strategy Effectiveness:</span>
                <span className="font-bold text-blue-600">
                  {finalData.totalReturn > 15 ? 'Excellent' : 
                   finalData.totalReturn > 10 ? 'Good' : 
                   finalData.totalReturn > 5 ? 'Moderate' : 'Needs Work'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <h4 className="font-semibold text-yellow-800 mb-2">🎓 What You've Learned</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Complete covered call strategy from entry to exit</li>
            <li>• Risk management across different market conditions</li>
            <li>• Assignment handling and reentry strategies</li>
            <li>• Portfolio allocation and position sizing</li>
            <li>• Monthly income generation techniques</li>
            <li>• Tax implications and timing strategies</li>
          </ul>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            This realistic simulation shows potential outcomes with NVDA covered calls. 
            Actual results will vary based on market conditions, timing, and execution.
          </p>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">🎓 Ready for Advanced Training?</h4>
            <p className="text-sm text-blue-700">
              You've mastered basic covered calls. Continue your journey with advanced strategies:
            </p>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => setState(prev => ({ ...prev, currentStep: 0, currentMonth: 1 }))}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
            >
              Review Tutorial
            </button>
            <button
              onClick={onComplete}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
              Advanced: Stacking Calls →
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case -1:
        return (
          <CommonMistakesEducation
            stockSymbol="NVDA"
            onComplete={() => {
              setState(prev => ({
                ...prev,
                hasCompletedMistakesEducation: true,
                currentStep: 0
              }));
            }}
          />
        );
        
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                🚀 NVDA Covered Call Master Class
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                A complete year-long journey: From $25,000 to mastery
              </p>
              <p className="text-sm text-gray-500">
                Learn through realistic market scenarios and month-by-month progression
              </p>
            </div>

            {renderBalanceDisplay()}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* NVDA Requirements */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  🎯 NVDA Investment Requirements
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Minimum Capital Needed</h4>
                    <div className="text-3xl font-bold text-blue-600 mb-2">$20,000+</div>
                    <p className="text-sm text-blue-700">
                      For 100 shares of NVDA plus cash buffer for assignment/volatility
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>NVDA (100 shares):</span>
                      <span className="font-semibold">${(state.nvdaPrice * 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash buffer (30%):</span>
                      <span className="font-semibold">${Math.round(state.nvdaPrice * 100 * 0.3).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span><strong>Recommended minimum:</strong></span>
                      <span className="font-bold text-blue-600">${Math.round(state.nvdaPrice * 130).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 ${canAffordNVDA ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`font-semibold ${canAffordNVDA ? 'text-green-700' : 'text-red-700'}`}>
                      {canAffordNVDA ? '✅ Perfect! You can start the NVDA journey' : '❌ Consider building more capital first'}
                    </div>
                    <div className={`text-sm mt-1 ${canAffordNVDA ? 'text-green-600' : 'text-red-600'}`}>
                      {canAffordNVDA 
                        ? 'Your $25,000 provides good cushion for volatility.'
                        : 'NVDA requires substantial capital due to its high price and volatility.'
                      }
                    </div>
                  </div>
                  
                  {canAffordNVDA && (
                    <button
                      onClick={() => setState(prev => ({ ...prev, currentStep: 0.5 }))}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                    >
                      Learn About Covered Calls →
                    </button>
                  )}
                </div>
              </div>

              {/* Alternative Path */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  💡 Alternative Learning Path
                </h3>
                
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Don't have $20,000+ yet? No problem! Learn the same principles with more affordable stocks.
                  </p>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Benefits of Starting Smaller:</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Same covered call principles</li>
                      <li>• Lower risk while learning</li>
                      <li>• Build confidence and capital</li>
                      <li>• Graduate to NVDA later</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    {nvdaAlternatives.map((stock, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold">{stock.symbol}</span>
                            <span className="text-sm text-gray-600 ml-2">${stock.price}</span>
                          </div>
                          <span className="text-sm font-semibold text-blue-600">
                            ${stock.minInvestment.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{stock.reasonForRecommendation}</p>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setState(prev => ({ ...prev, showAlternatives: true }))}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Explore Alternatives →
                  </button>
                </div>
              </div>
            </div>

            {state.showAlternatives && (
              <div className="mt-8">
                <AffordableStockFinder
                  maxBudget={15000}
                  onStockSelected={handleAlternativeSelected}
                />
              </div>
            )}
          </div>
        );

      case 0.5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                📚 What is a Covered Call?
              </h2>
              <p className="text-gray-600 mb-6">
                Master the fundamentals before we dive into the NVDA strategy
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                🎯 Covered Call Basics
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Definition & Structure</h4>
                  <div className="space-y-3 text-sm">
                    <div className="bg-blue-50 p-3 rounded">
                      <strong>What it is:</strong> A covered call is selling a call option while owning 100 shares of the underlying stock.
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <strong>Two components:</strong>
                      <br />1. Own 100 shares of stock (the "cover")
                      <br />2. Sell 1 call option contract
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <strong>Income source:</strong> You collect premium upfront for selling the call option.
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Visual Example</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-center mb-3">
                      <div className="text-lg font-bold">NVDA Example</div>
                      <div className="text-sm text-gray-600">Stock price: $145</div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-1">
                        <span>Own 100 shares:</span>
                        <span className="font-semibold">$14,500</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span>Sell $155 call:</span>
                        <span className="font-semibold text-green-600">+$450</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span>Strike price:</span>
                        <span className="font-semibold">$155</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Monthly income:</span>
                        <span className="text-green-600">$450 (3.1%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">🔄 How It Works: The Process</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl mb-2">1️⃣</div>
                  <h4 className="font-semibold text-blue-800 mb-2">Set Up Position</h4>
                  <p className="text-sm text-blue-700">
                    Buy 100 shares of NVDA at $145
                    <br />
                    <strong>Investment: $14,500</strong>
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl mb-2">2️⃣</div>
                  <h4 className="font-semibold text-green-800 mb-2">Sell Call Option</h4>
                  <p className="text-sm text-green-700">
                    Sell 1 call option, $155 strike
                    <br />
                    <strong>Premium: $450</strong>
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-3xl mb-2">3️⃣</div>
                  <h4 className="font-semibold text-purple-800 mb-2">Two Outcomes</h4>
                  <p className="text-sm text-purple-700">
                    Stock below $155: Keep premium
                    <br />
                    Stock above $155: Sell at $155
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">📊 Outcome Scenarios</h3>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Scenario 1: Stock Stays Below $155</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>What happens:</strong></p>
                      <ul className="list-disc list-inside text-green-700">
                        <li>Option expires worthless</li>
                        <li>You keep your 100 shares</li>
                        <li>You keep the $450 premium</li>
                        <li>You can sell another call next month</li>
                      </ul>
                    </div>
                    <div>
                      <p><strong>Your profit:</strong></p>
                      <ul className="list-disc list-inside text-green-700">
                        <li>Premium income: $450</li>
                        <li>Stock appreciation: varies</li>
                        <li>Monthly return: ~3.1%</li>
                        <li>Rinse and repeat!</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📈 Scenario 2: Stock Goes Above $155</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>What happens (Assignment):</strong></p>
                      <ul className="list-disc list-inside text-blue-700">
                        <li>You must sell shares at $155</li>
                        <li>You keep the $450 premium</li>
                        <li>You profit from stock appreciation</li>
                        <li>Position closes automatically</li>
                      </ul>
                    </div>
                    <div>
                      <p><strong>Your profit calculation:</strong></p>
                      <ul className="list-disc list-inside text-blue-700">
                        <li>Stock profit: ($155-$145) × 100 = $1,000</li>
                        <li>Premium profit: $450</li>
                        <li><strong>Total profit: $1,450</strong></li>
                        <li>Return: 10% in one month!</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">⚖️ Risk & Reward Profile</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-800 mb-3">🎯 Benefits</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✅</span>
                      <span><strong>Monthly Income:</strong> Generate 2-4% monthly returns</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✅</span>
                      <span><strong>Lower Risk:</strong> Premium provides downside protection</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✅</span>
                      <span><strong>Stock Ownership:</strong> Benefit from dividends and appreciation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✅</span>
                      <span><strong>Flexibility:</strong> Choose your strike prices and timeframes</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-800 mb-3">⚠️ Risks</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">⚠️</span>
                      <span><strong>Capped Upside:</strong> Limited profit if stock soars above strike</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">⚠️</span>
                      <span><strong>Stock Risk:</strong> You still own the stock and face downside risk</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">⚠️</span>
                      <span><strong>Opportunity Cost:</strong> May miss big rallies in volatile stocks</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">⚠️</span>
                      <span><strong>Assignment Risk:</strong> May be forced to sell when you don't want to</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">🧠 Key Concepts to Remember</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-700">
                <div>
                  <h4 className="font-semibold mb-2">Strike Price Selection:</h4>
                  <ul className="space-y-1">
                    <li>• <strong>Out-of-the-money (OTM):</strong> Higher than current stock price</li>
                    <li>• <strong>Typical range:</strong> 5-15% above current price</li>
                    <li>• <strong>Trade-off:</strong> Higher strikes = lower premium, lower assignment risk</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Timing & Expiration:</h4>
                  <ul className="space-y-1">
                    <li>• <strong>Monthly options:</strong> Third Friday of each month</li>
                    <li>• <strong>Weekly options:</strong> More frequent opportunities</li>
                    <li>• <strong>Time decay:</strong> Options lose value as expiration approaches</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setState(prev => ({ ...prev, currentStep: 0 }))}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                ← Back to Requirements
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, currentStep: 1 }))}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Start NVDA Journey →
              </button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 1: Your NVDA Foundation
              </h2>
              <p className="text-gray-600 mb-6">
                Understanding your starting position and what makes NVDA ideal for covered calls
              </p>
            </div>

            {renderBalanceDisplay()}
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">📊 NVDA: The Covered Call Champion</h3>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">${state.nvdaPrice}</div>
                  <div className="text-sm text-gray-600">Current Price</div>
                  <div className="text-xs text-blue-700 mt-1">High-value stock</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">42%</div>
                  <div className="text-sm text-gray-600">Implied Volatility</div>
                  <div className="text-xs text-green-700 mt-1">Rich premiums</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">1M+</div>
                  <div className="text-sm text-gray-600">Daily Volume</div>
                  <div className="text-xs text-purple-700 mt-1">Excellent liquidity</div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">🎯 Why NVDA is Perfect for Covered Calls</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• <strong>High Premium Income:</strong> Volatility generates 2-4% monthly premiums</li>
                  <li>• <strong>Strong Fundamentals:</strong> AI leadership provides long-term growth</li>
                  <li>• <strong>Excellent Liquidity:</strong> Tight bid-ask spreads, easy entry/exit</li>
                  <li>• <strong>Weekly Options:</strong> Flexible timing for income generation</li>
                  <li>• <strong>Institutional Interest:</strong> Steady demand supports price stability</li>
                </ul>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Your Advantages</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Own 100 shares ($14,550 investment)</li>
                    <li>• Can sell calls against your position</li>
                    <li>• Generate $400-800 monthly income</li>
                    <li>• Participate in stock appreciation</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">⚠️ Key Risks</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Stock price volatility (±15% monthly)</li>
                    <li>• Assignment risk if stock rises</li>
                    <li>• Capped upside from covered calls</li>
                    <li>• Sector rotation risks</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Continue to Year Journey →
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 2: Your Year-Long Journey
              </h2>
              <p className="text-gray-600 mb-6">
                Month-by-month progression showing realistic covered call outcomes
              </p>
            </div>

            {renderBalanceDisplay()}
            {renderYearlyPerformanceChart()}
            {renderMonthlyBreakdown()}

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Learn Risk Management →
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 3: Risk Management Mastery
              </h2>
              <p className="text-gray-600 mb-6">
                Understanding and preparing for different market scenarios
              </p>
            </div>

            {renderBalanceDisplay()}
            {renderRiskScenarios()}

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">🛡️ Your Risk Management Plan</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Position Sizing Rules</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <ul className="text-sm text-blue-700 space-y-2">
                      <li>• <strong>Max 60% in single stock:</strong> Your NVDA position is {((state.nvdaPrice * 100 / state.startingBalance) * 100).toFixed(1)}%</li>
                      <li>• <strong>Keep 30% cash buffer:</strong> For volatility and opportunities</li>
                      <li>• <strong>Stop loss at -15%:</strong> Exit if NVDA drops below $123</li>
                      <li>• <strong>Profit taking:</strong> Close calls at 25-50% profit</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Timing Rules</h4>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <ul className="text-sm text-green-700 space-y-2">
                      <li>• <strong>Avoid earnings weeks:</strong> Don't sell calls before earnings</li>
                      <li>• <strong>High IV periods:</strong> Sell when volatility is elevated</li>
                      <li>• <strong>Roll timing:</strong> Manage positions with 7-14 days to expiry</li>
                      <li>• <strong>Assignment readiness:</strong> Always be prepared to sell at strike</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">🎯 Mental Framework</h4>
                <p className="text-sm text-yellow-700">
                  <strong>Success isn't about avoiding all losses—it's about managing them.</strong> 
                  Your goal is consistent income generation while limiting downside. 
                  Some months you'll be assigned, some months you'll keep premiums. 
                  The key is following your rules consistently.
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                See Final Results →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 4: Your Complete Year Results
              </h2>
              <p className="text-gray-600 mb-6">
                Comprehensive analysis of your NVDA covered call journey
              </p>
            </div>

            {renderFinalResults()}
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🎉 NVDA Master Class Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              You now understand the complete covered call process with NVDA
            </p>
            <div className="space-x-4">
              <button
                onClick={() => setState(prev => ({ ...prev, currentStep: 0, currentMonth: 1 }))}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
              >
                Review Full Tutorial
              </button>
              <button
                onClick={onComplete}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                Start Real Trading →
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>NVDA Master Class Progress</span>
          <span>Step {Math.max(0, state.currentStep + 1)} of 5</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(0, ((state.currentStep + 1) / 5) * 100)}%` }}
          />
        </div>
      </div>

      {renderCurrentStep()}
    </div>
  );
};

export default NVDAOptionsTutorial; 