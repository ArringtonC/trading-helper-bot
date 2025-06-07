import React, { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import CommonMistakesEducation from './CommonMistakesEducation';

interface StackingCoveredCallsTutorialProps {
  onComplete?: () => void;
  onNext?: () => void;
}

interface TutorialState {
  currentStep: number;
  currentWeek: number;
  accountBalance: number;
  nvdaShares: number;
  nvdaPrice: number;
  activePositions: CallPosition[];
  totalPremiumsCollected: number;
  hasCompletedMistakesEducation: boolean;
  weeklyData: WeeklyData[];
}

interface CallPosition {
  id: string;
  openDate: string;
  expirationDate: string;
  strikePrice: number;
  premiumReceived: number;
  contracts: number;
  status: 'active' | 'assigned' | 'expired' | 'closed';
  daysToExpiry: number;
  currentValue: number;
  profitLoss: number;
}

interface WeeklyData {
  week: number;
  date: string;
  stockPrice: number;
  activePositions: number;
  weeklyPremium: number;
  totalPremiums: number;
  accountValue: number;
  events: string[];
}

interface StackingStrategy {
  name: string;
  description: string;
  positions: CallPosition[];
  advantages: string[];
  risks: string[];
  weeklyIncome: number;
}

const StackingCoveredCallsTutorial: React.FC<StackingCoveredCallsTutorialProps> = ({
  onComplete,
  onNext
}) => {
  // Generate weekly progression data for stacking strategy
  const generateWeeklyData = useCallback((): WeeklyData[] => {
    const data: WeeklyData[] = [];
    const startDate = new Date('2024-01-08'); // Start on a Monday
    let stockPrice = 145.50;
    let totalPremiums = 0;
    let accountValue = 50000; // Higher starting balance for stacking
    
    for (let week = 1; week <= 16; week++) { // 4 months of weekly data
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week - 1) * 7);
      
      // Simulate realistic weekly price movement (smaller than monthly)
      const weeklyChange = (Math.random() - 0.5) * 0.05; // ±5% weekly volatility
      stockPrice = stockPrice * (1 + weeklyChange);
      
      // Calculate positions and premiums based on stacking strategy
      const activePositions = Math.min(week, 4); // Build up to 4 overlapping positions
      const weeklyPremium = activePositions * 280; // ~$280 per position per week
      totalPremiums += weeklyPremium;
      accountValue += weeklyPremium;
      
      // Generate events based on week
      const events = [];
      if (week === 1) events.push('Open first weekly position');
      if (week === 2) events.push('Add second position, different expiry');
      if (week === 3) events.push('Add third position, creating ladder');
      if (week === 4) events.push('Full stack active - 4 positions');
      if (week % 4 === 0 && week > 4) events.push('Roll expired position');
      if (week === 8) events.push('Earnings week - higher premiums');
      if (week === 12) events.push('Market volatility - adjust strikes');
      
      data.push({
        week,
        date: currentDate.toLocaleDateString(),
        stockPrice: Math.round(stockPrice * 100) / 100,
        activePositions,
        weeklyPremium,
        totalPremiums,
        accountValue: Math.round(accountValue),
        events
      });
    }
    
    return data;
  }, []);

  const [state, setState] = useState<TutorialState>(() => {
    const weeklyData = generateWeeklyData();
    
    return {
      currentStep: -1, // Start with mistakes education
      currentWeek: 1,
      accountBalance: 50000,
      nvdaShares: 300, // 3x more shares for stacking
      nvdaPrice: 145.50,
      activePositions: [],
      totalPremiumsCollected: 0,
      hasCompletedMistakesEducation: false,
      weeklyData
    };
  });

  const stackingStrategies: StackingStrategy[] = [
    {
      name: 'Weekly Ladder',
      description: 'Open new position every week with different expiration dates',
      positions: [
        {
          id: 'pos1',
          openDate: '2024-01-08',
          expirationDate: '2024-01-12',
          strikePrice: 150,
          premiumReceived: 280,
          contracts: 1,
          status: 'active',
          daysToExpiry: 4,
          currentValue: 180,
          profitLoss: 100
        },
        {
          id: 'pos2',
          openDate: '2024-01-08',
          expirationDate: '2024-01-19',
          strikePrice: 152,
          premiumReceived: 420,
          contracts: 1,
          status: 'active',
          daysToExpiry: 11,
          currentValue: 320,
          profitLoss: 100
        },
        {
          id: 'pos3',
          openDate: '2024-01-08',
          expirationDate: '2024-01-26',
          strikePrice: 155,
          premiumReceived: 580,
          contracts: 1,
          status: 'active',
          daysToExpiry: 18,
          currentValue: 480,
          profitLoss: 100
        }
      ],
      advantages: [
        'Consistent weekly income stream',
        'Reduces timing risk through diversification',
        'Easier to manage than monthly positions',
        'More opportunities to adjust strategy'
      ],
      risks: [
        'Higher transaction costs',
        'More time-intensive management',
        'Potential for over-trading',
        'Multiple assignment risks'
      ],
      weeklyIncome: 840
    },
    {
      name: 'Strike Ladder',
      description: 'Multiple positions at different strike prices same expiration',
      positions: [
        {
          id: 'pos1',
          openDate: '2024-01-08',
          expirationDate: '2024-01-19',
          strikePrice: 150,
          premiumReceived: 420,
          contracts: 1,
          status: 'active',
          daysToExpiry: 11,
          currentValue: 320,
          profitLoss: 100
        },
        {
          id: 'pos2',
          openDate: '2024-01-08',
          expirationDate: '2024-01-19',
          strikePrice: 155,
          premiumReceived: 280,
          contracts: 1,
          status: 'active',
          daysToExpiry: 11,
          currentValue: 180,
          profitLoss: 100
        },
        {
          id: 'pos3',
          openDate: '2024-01-08',
          expirationDate: '2024-01-19',
          strikePrice: 160,
          premiumReceived: 150,
          contracts: 1,
          status: 'active',
          daysToExpiry: 11,
          currentValue: 80,
          profitLoss: 70
        }
      ],
      advantages: [
        'Capture upside at multiple levels',
        'Higher total premium collection',
        'Partial assignment flexibility',
        'Simplified expiration management'
      ],
      risks: [
        'Complex assignment scenarios',
        'May limit upside participation',
        'Requires more shares (300+)',
        'Harder to roll positions'
      ],
      weeklyIncome: 850
    },
    {
      name: 'Rolling Stack',
      description: 'Continuously roll positions to maintain 4-week coverage',
      positions: [
        {
          id: 'pos1',
          openDate: '2024-01-08',
          expirationDate: '2024-01-12',
          strikePrice: 150,
          premiumReceived: 280,
          contracts: 1,
          status: 'active',
          daysToExpiry: 4,
          currentValue: 180,
          profitLoss: 100
        },
        {
          id: 'pos2',
          openDate: '2024-01-01',
          expirationDate: '2024-01-19',
          strikePrice: 152,
          premiumReceived: 420,
          contracts: 1,
          status: 'active',
          daysToExpiry: 11,
          currentValue: 320,
          profitLoss: 100
        },
        {
          id: 'pos3',
          openDate: '2023-12-25',
          expirationDate: '2024-01-26',
          strikePrice: 155,
          premiumReceived: 580,
          contracts: 1,
          status: 'active',
          daysToExpiry: 18,
          currentValue: 480,
          profitLoss: 100
        },
        {
          id: 'pos4',
          openDate: '2023-12-18',
          expirationDate: '2024-02-02',
          strikePrice: 158,
          premiumReceived: 720,
          contracts: 1,
          status: 'active',
          daysToExpiry: 25,
          currentValue: 620,
          profitLoss: 100
        }
      ],
      advantages: [
        'Maximum premium extraction',
        'Continuous income generation',
        'Optimal time decay capture',
        'Professional-level strategy'
      ],
      risks: [
        'Most complex to manage',
        'Highest transaction costs',
        'Requires significant capital',
        'Multiple decision points weekly'
      ],
      weeklyIncome: 1200
    }
  ];

  const getCurrentWeekData = () => {
    return state.weeklyData[state.currentWeek - 1] || state.weeklyData[0];
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

  const nextWeek = () => {
    setState(prev => ({
      ...prev,
      currentWeek: Math.min(16, prev.currentWeek + 1)
    }));
  };

  const prevWeek = () => {
    setState(prev => ({
      ...prev,
      currentWeek: Math.max(1, prev.currentWeek - 1)
    }));
  };

  const renderStackingOverview = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">🔄 Stacking vs Single Position</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3">Single Covered Call</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• 100 shares, 1 call option</li>
              <li>• ~$280-400 premium monthly</li>
              <li>• Simple management</li>
              <li>• 1-2% monthly income</li>
              <li>• All-or-nothing assignment</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-3">Stacked Covered Calls</h4>
            <ul className="text-sm text-green-700 space-y-2">
              <li>• 300+ shares, multiple calls</li>
              <li>• $800-1200 premium weekly</li>
              <li>• Advanced management</li>
              <li>• 3-5% monthly income</li>
              <li>• Partial assignment flexibility</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Capital Requirements</h4>
          <p className="text-sm text-yellow-700">
            <strong>Minimum for stacking:</strong> $50,000+ account with 300+ NVDA shares. 
            This is an advanced strategy requiring significant capital and experience.
          </p>
        </div>
      </div>
    );
  };

  const renderWeeklyProgressChart = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">📈 16-Week Stacking Journey</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={state.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
              <YAxis yAxisId="value" orientation="left" />
              <YAxis yAxisId="positions" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'accountValue' ? `$${value.toLocaleString()}` : 
                  name === 'totalPremiums' ? `$${value.toLocaleString()}` : 
                  value,
                  name === 'accountValue' ? 'Account Value' : 
                  name === 'totalPremiums' ? 'Total Premiums' : 
                  name === 'activePositions' ? 'Active Positions' :
                  'Stock Price'
                ]}
              />
              <Line yAxisId="value" type="monotone" dataKey="accountValue" stroke="#8884d8" strokeWidth={3} />
              <Line yAxisId="value" type="monotone" dataKey="totalPremiums" stroke="#82ca9d" strokeWidth={2} />
              <Line yAxisId="positions" type="monotone" dataKey="activePositions" stroke="#ffc658" strokeWidth={2} />
              <Line yAxisId="value" type="monotone" dataKey="stockPrice" stroke="#ff7300" strokeWidth={1} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Blue: Account Value | Green: Cumulative Premiums | Yellow: Active Positions | Orange: NVDA Price
        </div>
      </div>
    );
  };

  const renderWeeklyBreakdown = () => {
    const currentData = getCurrentWeekData();
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">📅 Week {state.currentWeek}: {currentData.date}</h3>
          <div className="space-x-2">
            <button 
              onClick={prevWeek}
              disabled={state.currentWeek === 1}
              className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
            >
              ← Prev
            </button>
            <button 
              onClick={nextWeek}
              disabled={state.currentWeek === 16}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">NVDA Price</h4>
            <div className="text-2xl font-bold text-blue-600">${currentData.stockPrice}</div>
            <div className="text-xs text-blue-600 mt-1">Stock Performance</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Active Positions</h4>
            <div className="text-2xl font-bold text-green-600">{currentData.activePositions}</div>
            <div className="text-xs text-green-600 mt-1">Call Options Sold</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">Weekly Income</h4>
            <div className="text-2xl font-bold text-purple-600">${currentData.weeklyPremium}</div>
            <div className="text-xs text-purple-600 mt-1">Premium Collected</div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-800 mb-2">Total Premiums</h4>
            <div className="text-2xl font-bold text-orange-600">${currentData.totalPremiums}</div>
            <div className="text-xs text-orange-600 mt-1">Cumulative Income</div>
          </div>
        </div>
        
        {currentData.events.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">📌 This Week's Events</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {currentData.events.map((event, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {event}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderStackingStrategies = () => {
    return (
      <div className="space-y-6">
        {stackingStrategies.map((strategy, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">{strategy.name}</h3>
            <p className="text-gray-700 mb-4">{strategy.description}</p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Weekly Income</h4>
                <div className="text-2xl font-bold text-green-600">${strategy.weeklyIncome}</div>
                <div className="text-xs text-green-600">~{((strategy.weeklyIncome * 52) / 50000 * 100).toFixed(1)}% annual yield</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Active Positions</h4>
                <div className="text-2xl font-bold text-blue-600">{strategy.positions.length}</div>
                <div className="text-xs text-blue-600">Simultaneous calls</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Complexity</h4>
                <div className="text-lg font-bold text-purple-600">
                  {index === 0 ? 'Moderate' : index === 1 ? 'Advanced' : 'Expert'}
                </div>
                <div className="text-xs text-purple-600">Management level</div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">✅ Advantages</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {strategy.advantages.map((advantage, idx) => (
                    <li key={idx}>• {advantage}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">⚠️ Risks</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {strategy.risks.map((risk, idx) => (
                    <li key={idx}>• {risk}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Current Positions</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-50 rounded">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 text-xs">Strike</th>
                      <th className="text-left p-2 text-xs">Expiry</th>
                      <th className="text-left p-2 text-xs">Premium</th>
                      <th className="text-left p-2 text-xs">Current</th>
                      <th className="text-left p-2 text-xs">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategy.positions.map((position, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 text-sm">${position.strikePrice}</td>
                        <td className="p-2 text-sm">{position.expirationDate}</td>
                        <td className="p-2 text-sm text-green-600">${position.premiumReceived}</td>
                        <td className="p-2 text-sm">${position.currentValue}</td>
                        <td className={`p-2 text-sm ${position.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${position.profitLoss}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderManagementRules = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">🎯 Stacking Management Rules</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Opening Positions</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Maintain 3-4 active positions</li>
                <li>• Stagger expiration dates weekly</li>
                <li>• Use 5-10% OTM strikes</li>
                <li>• Target 0.20-0.30 delta</li>
                <li>• Avoid earnings weeks initially</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Profit Taking</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Close at 25% profit (recommended)</li>
                <li>• Close at 50% profit (conservative)</li>
                <li>• Roll up and out if profitable</li>
                <li>• Take assignment if beneficial</li>
                <li>• Don't get greedy with last $20-30</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Risk Management</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Never risk more than 60% of account</li>
                <li>• Keep 20% cash for opportunities</li>
                <li>• Set stop-loss at position level</li>
                <li>• Monitor correlation between positions</li>
                <li>• Scale back during high volatility</li>
              </ul>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Assignment Management</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Plan for partial assignments</li>
                <li>• Have cash ready for rebuying</li>
                <li>• Consider tax implications</li>
                <li>• Don't fight profitable assignments</li>
                <li>• Restart stack after assignment</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-2">🎓 Advanced Tips</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• <strong>Calendar Management:</strong> Track all expiration dates carefully</li>
                               <li>• <strong>IV Timing:</strong> Sell when IV rank &gt; 50th percentile</li>
              <li>• <strong>Earnings Strategy:</strong> Close positions before earnings</li>
            </ul>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• <strong>Tax Efficiency:</strong> Consider wash sale rules</li>
              <li>• <strong>Commission Impact:</strong> Factor in $1-2 per contract</li>
              <li>• <strong>Scaling:</strong> Start with 2 positions, build up gradually</li>
            </ul>
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
                🔄 NVDA Stacking Covered Calls Master Class
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                Advanced income generation: Multiple overlapping positions
              </p>
              <p className="text-sm text-gray-500">
                Transform single covered calls into a professional income machine
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">$50,000</div>
                  <div className="text-purple-100 text-sm">Starting Capital</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">300</div>
                  <div className="text-purple-100 text-sm">NVDA Shares</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">$1,200</div>
                  <div className="text-purple-100 text-sm">Weekly Income Target</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">52%</div>
                  <div className="text-purple-100 text-sm">Annual Yield Goal</div>
                </div>
              </div>
            </div>

            {renderStackingOverview()}

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">🎯 What You'll Master</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Week 1-4: Foundation</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Open first stacked position</li>
                      <li>• Add overlapping expirations</li>
                      <li>• Build 4-position ladder</li>
                      <li>• Learn position correlation</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Week 5-8: Optimization</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Master rolling techniques</li>
                      <li>• Handle first assignments</li>
                      <li>• Navigate earnings volatility</li>
                      <li>• Maximize income extraction</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Week 9-12: Mastery</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Advanced strike selection</li>
                      <li>• Market volatility adaptation</li>
                      <li>• Professional-level management</li>
                      <li>• Risk-adjusted optimization</li>
                    </ul>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">Week 13-16: Expert</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Custom stacking strategies</li>
                      <li>• Tax-efficient management</li>
                      <li>• Scaling to larger positions</li>
                      <li>• Performance analysis</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={nextStep}
                className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-semibold"
              >
                Begin Stacking Journey →
              </button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 1: Understanding Stacking Strategies
              </h2>
              <p className="text-gray-600 mb-6">
                Learn the three main approaches to stacking covered calls
              </p>
            </div>

            {renderStackingStrategies()}

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Continue to Weekly Journey →
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 2: 16-Week Stacking Journey
              </h2>
              <p className="text-gray-600 mb-6">
                Week-by-week progression showing real stacking implementation
              </p>
            </div>

            {renderWeeklyProgressChart()}
            {renderWeeklyBreakdown()}

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Learn Management Rules →
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 3: Professional Management
              </h2>
              <p className="text-gray-600 mb-6">
                Master the rules for managing multiple overlapping positions
              </p>
            </div>

            {renderManagementRules()}

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
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
                Step 4: Stacking Mastery Complete
              </h2>
              <p className="text-gray-600 mb-6">
                You've learned professional-level covered call stacking
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">🎉 Your Stacking Achievement</h3>
              
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">$19,200</div>
                  <div className="text-sm text-green-700">Quarterly Income (16 weeks)</div>
                  <div className="text-xs text-green-600 mt-1">vs $4,480 single position</div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">52%</div>
                  <div className="text-sm text-blue-700">Annualized Return</div>
                  <div className="text-xs text-blue-600 mt-1">vs 14% single position</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-600">16</div>
                  <div className="text-sm text-purple-700">Positions Managed</div>
                  <div className="text-xs text-purple-600 mt-1">4 overlapping weekly</div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-yellow-800 mb-2">🎓 Skills Mastered</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>✅ Multiple position coordination</li>
                    <li>✅ Weekly income optimization</li>
                    <li>✅ Rolling and assignment management</li>
                    <li>✅ Risk correlation understanding</li>
                  </ul>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>✅ Calendar spread techniques</li>
                    <li>✅ Professional position sizing</li>
                    <li>✅ Volatility timing strategies</li>
                    <li>✅ Tax-efficient execution</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🚀 Next Level Recommendations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Scale to 500+ shares for even higher income</li>
                  <li>• Add other high-premium stocks to diversify</li>
                  <li>• Consider covered call ETFs for passive exposure</li>
                  <li>• Explore cash-secured puts for additional income</li>
                  <li>• Learn naked call strategies for advanced income</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <div className="space-x-4">
                <button
                  onClick={() => setState(prev => ({ ...prev, currentStep: 0, currentWeek: 1 }))}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
                >
                  Review Tutorial
                </button>
                <button
                  onClick={onComplete}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
                >
                  Continue to Naked Calls →
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🎉 Stacking Master Class Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              You now understand professional covered call stacking strategies
            </p>
            <div className="space-x-4">
              <button
                onClick={() => setState(prev => ({ ...prev, currentStep: 0, currentWeek: 1 }))}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
              >
                Review Tutorial
              </button>
              <button
                onClick={onComplete}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
              >
                Finish Tutorial →
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
          <span>Stacking Master Class Progress</span>
          <span>Step {Math.max(0, state.currentStep + 1)} of 5</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(0, ((state.currentStep + 1) / 5) * 100)}%` }}
          />
        </div>
      </div>

      {renderCurrentStep()}
    </div>
  );
};

export default StackingCoveredCallsTutorial; 