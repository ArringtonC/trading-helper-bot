import React, { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import CommonMistakesEducation from './CommonMistakesEducation';

interface SellingCallsTutorialProps {
  onComplete?: () => void;
  onNext?: () => void;
}

interface TutorialState {
  currentStep: number;
  currentWeek: number;
  accountBalance: number;
  cashBalance: number;
  maintainedMargin: number;
  activePositions: NakedCallPosition[];
  totalPremiumsCollected: number;
  hasCompletedMistakesEducation: boolean;
  weeklyData: WeeklyNakedData[];
}

interface NakedCallPosition {
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
  marginRequired: number;
}

interface WeeklyNakedData {
  week: number;
  date: string;
  stockPrice: number;
  activeContracts: number;
  weeklyPremium: number;
  totalPremiums: number;
  accountValue: number;
  marginUsed: number;
  events: string[];
  riskLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
}

interface NakedCallStrategy {
  name: string;
  description: string;
  marginRequirement: number;
  maxRisk: string;
  targetPremium: number;
  riskLevel: 'Medium' | 'High' | 'Extreme';
  suitableFor: string[];
  advantages: string[];
  risks: string[];
}

const SellingCallsTutorial: React.FC<SellingCallsTutorialProps> = ({
  onComplete,
  onNext
}) => {
  // Generate weekly progression data for naked call strategy
  const generateWeeklyData = useCallback((): WeeklyNakedData[] => {
    const data: WeeklyNakedData[] = [];
    const startDate = new Date('2024-01-08');
    let stockPrice = 145.50;
    let totalPremiums = 0;
    let accountValue = 100000; // Higher requirement for naked calls
    
    for (let week = 1; week <= 16; week++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week - 1) * 7);
      
      // More volatile movement simulation for naked calls
      const weeklyChange = (Math.random() - 0.4) * 0.08; // Slight upward bias
      stockPrice = stockPrice * (1 + weeklyChange);
      
      const activeContracts = Math.min(week, 5); // Up to 5 contracts
      const weeklyPremium = activeContracts * 380; // Higher premiums
      totalPremiums += weeklyPremium;
      
      // Calculate margin usage (20% of underlying value)
      const marginUsed = activeContracts * stockPrice * 100 * 0.20;
      accountValue = 100000 + totalPremiums - (stockPrice > 155 ? (stockPrice - 155) * 100 * activeContracts : 0);
      
      // Determine risk level based on stock price vs strikes
      let riskLevel: 'Low' | 'Medium' | 'High' | 'Extreme' = 'Low';
      if (stockPrice > 150) riskLevel = 'Medium';
      if (stockPrice > 155) riskLevel = 'High';
      if (stockPrice > 160) riskLevel = 'Extreme';
      
      const events = [];
      if (week === 1) events.push('Sell first naked call - $155 strike');
      if (week === 2) events.push('Add second contract - monitor margin');
      if (week === 4) events.push('Stock approaching strike - risk increasing');
      if (week === 6) events.push('Roll position to avoid assignment');
      if (week === 8) events.push('Earnings volatility - close positions');
      if (week === 10) events.push('Stock pullback - reenter positions');
      if (week === 12) events.push('Margin call triggered - manage risk');
      if (week === 14) events.push('Close losing position - cut losses');
      
      data.push({
        week,
        date: currentDate.toLocaleDateString(),
        stockPrice: Math.round(stockPrice * 100) / 100,
        activeContracts,
        weeklyPremium,
        totalPremiums,
        accountValue: Math.round(accountValue),
        marginUsed: Math.round(marginUsed),
        events,
        riskLevel
      });
    }
    
    return data;
  }, []);

  const [state, setState] = useState<TutorialState>(() => {
    const weeklyData = generateWeeklyData();
    
    return {
      currentStep: -1,
      currentWeek: 1,
      accountBalance: 100000,
      cashBalance: 100000,
      maintainedMargin: 0,
      activePositions: [],
      totalPremiumsCollected: 0,
      hasCompletedMistakesEducation: false,
      weeklyData
    };
  });

  const nakedCallStrategies: NakedCallStrategy[] = [
    {
      name: 'Conservative Naked Calls',
      description: 'Sell far OTM calls with 30+ days to expiration',
      marginRequirement: 20000,
      maxRisk: 'Unlimited (theoretically)',
      targetPremium: 200,
      riskLevel: 'Medium',
      suitableFor: ['Experienced traders', 'Bearish/neutral outlook', 'Risk-tolerant investors'],
      advantages: [
        'No stock ownership required',
        'Profit from time decay',
        'High probability of success',
        'Leverage buying power'
      ],
      risks: [
        'Unlimited loss potential',
        'Margin requirements',
        'Early assignment risk',
        'Volatile P&L swings'
      ]
    },
    {
      name: 'Aggressive Income Generation',
      description: 'Sell closer-to-money calls for higher premiums',
      marginRequirement: 25000,
      maxRisk: 'Unlimited (higher probability)',
      targetPremium: 500,
      riskLevel: 'High',
      suitableFor: ['Professional traders', 'Strong bearish view', 'Advanced risk management'],
      advantages: [
        'Much higher premium income',
        'Faster profit realization',
        'Better risk-adjusted returns',
        'Active portfolio management'
      ],
      risks: [
        'Higher assignment probability',
        'Larger margin requirements',
        'More frequent adjustments',
        'Emotional stress from losses'
      ]
    },
    {
      name: 'Short-Term Scalping',
      description: 'Weekly naked calls with quick profit taking',
      marginRequirement: 30000,
      maxRisk: 'Unlimited (frequent exposure)',
      targetPremium: 150,
      riskLevel: 'Extreme',
      suitableFor: ['Day traders', 'Market makers', 'Professional volatility traders'],
      advantages: [
        'Rapid profit cycles',
        'Maximum time decay capture',
        'High frequency income',
        'Professional-level strategy'
      ],
      risks: [
        'Constant monitoring required',
        'High transaction costs',
        'Extreme loss potential',
        'Psychological pressure'
      ]
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

  const renderRiskWarning = () => {
    return (
      <div className="bg-red-50 border-2 border-red-300 p-6 rounded-lg mb-6">
        <h3 className="text-xl font-semibold text-red-800 mb-4">⚠️ EXTREME RISK WARNING</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-red-700">Unlimited Loss Potential</h4>
            <ul className="text-sm text-red-600 space-y-1">
              <li>• Stock can rise infinitely - losses unlimited</li>
              <li>• $10 stock move = $1,000 loss per contract</li>
              <li>• Margin calls can force liquidation</li>
              <li>• Account can go negative</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-red-700">Margin Requirements</h4>
            <ul className="text-sm text-red-600 space-y-1">
              <li>• Minimum $100,000 account recommended</li>
              <li>• 20% of stock value per contract</li>
              <li>• Daily margin calculations</li>
              <li>• Forced position closure possible</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-red-100 rounded border border-red-300">
          <p className="text-sm text-red-800 font-semibold">
            🚨 This strategy is suitable ONLY for experienced traders with significant capital and 
            advanced risk management skills. Beginners should start with covered calls.
          </p>
        </div>
      </div>
    );
  };

  const renderWeeklyProgressChart = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">📈 16-Week Naked Call Journey</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={state.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
              <YAxis yAxisId="value" orientation="left" />
              <YAxis yAxisId="margin" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'accountValue' || name === 'totalPremiums' || name === 'marginUsed' ? 
                    `$${value.toLocaleString()}` : value,
                  name === 'accountValue' ? 'Account Value' : 
                  name === 'totalPremiums' ? 'Total Premiums' : 
                  name === 'marginUsed' ? 'Margin Used' :
                  name === 'activeContracts' ? 'Active Contracts' :
                  'Stock Price'
                ]}
              />
              <Line yAxisId="value" type="monotone" dataKey="accountValue" stroke="#8884d8" strokeWidth={3} />
              <Line yAxisId="value" type="monotone" dataKey="totalPremiums" stroke="#82ca9d" strokeWidth={2} />
              <Line yAxisId="margin" type="monotone" dataKey="marginUsed" stroke="#ff7300" strokeWidth={2} />
              <Line yAxisId="value" type="monotone" dataKey="stockPrice" stroke="#ffc658" strokeWidth={1} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Blue: Account Value | Green: Cumulative Premiums | Orange: Margin Used | Yellow: NVDA Price
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
            <div className="text-xs text-blue-600 mt-1">Current Level</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">Contracts Sold</h4>
            <div className="text-2xl font-bold text-purple-600">{currentData.activeContracts}</div>
            <div className="text-xs text-purple-600 mt-1">Naked Call Positions</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Weekly Premium</h4>
            <div className="text-2xl font-bold text-green-600">${currentData.weeklyPremium}</div>
            <div className="text-xs text-green-600 mt-1">Income Collected</div>
          </div>
          
          <div className={`p-4 rounded-lg ${
            currentData.riskLevel === 'Low' ? 'bg-green-50' :
            currentData.riskLevel === 'Medium' ? 'bg-yellow-50' :
            currentData.riskLevel === 'High' ? 'bg-orange-50' :
            'bg-red-50'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              currentData.riskLevel === 'Low' ? 'text-green-800' :
              currentData.riskLevel === 'Medium' ? 'text-yellow-800' :
              currentData.riskLevel === 'High' ? 'text-orange-800' :
              'text-red-800'
            }`}>Risk Level</h4>
            <div className={`text-2xl font-bold ${
              currentData.riskLevel === 'Low' ? 'text-green-600' :
              currentData.riskLevel === 'Medium' ? 'text-yellow-600' :
              currentData.riskLevel === 'High' ? 'text-orange-600' :
              'text-red-600'
            }`}>{currentData.riskLevel}</div>
            <div className={`text-xs mt-1 ${
              currentData.riskLevel === 'Low' ? 'text-green-600' :
              currentData.riskLevel === 'Medium' ? 'text-yellow-600' :
              currentData.riskLevel === 'High' ? 'text-orange-600' :
              'text-red-600'
            }`}>Current Exposure</div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Account Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Account Value:</span>
                <span className="font-semibold">${currentData.accountValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Margin Used:</span>
                <span className="font-semibold">${currentData.marginUsed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Premiums:</span>
                <span className="font-semibold text-green-600">${currentData.totalPremiums.toLocaleString()}</span>
              </div>
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
      </div>
    );
  };

  const renderNakedCallStrategies = () => {
    return (
      <div className="space-y-6">
        {nakedCallStrategies.map((strategy, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{strategy.name}</h3>
                <p className="text-gray-700">{strategy.description}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                strategy.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                strategy.riskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {strategy.riskLevel} Risk
              </div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-800 text-sm mb-1">Margin Required</h4>
                <div className="text-lg font-bold text-blue-600">${strategy.marginRequirement.toLocaleString()}</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-semibold text-green-800 text-sm mb-1">Target Premium</h4>
                <div className="text-lg font-bold text-green-600">${strategy.targetPremium}</div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg">
                <h4 className="font-semibold text-red-800 text-sm mb-1">Max Risk</h4>
                <div className="text-sm font-bold text-red-600">{strategy.maxRisk}</div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <h4 className="font-semibold text-purple-800 text-sm mb-1">Annual Yield</h4>
                <div className="text-lg font-bold text-purple-600">
                  {((strategy.targetPremium * 12) / strategy.marginRequirement * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Suitable For</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {strategy.suitableFor.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
              
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
          </div>
        ))}
      </div>
    );
  };

  const renderManagementRules = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">🎯 Naked Call Management Rules</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">Risk Management (CRITICAL)</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Never sell more than 5% of account per position</li>
                <li>• Set stop-loss at 200% of premium received</li>
                <li>• Close positions at 25-50% profit</li>
                <li>• Monitor margin requirements daily</li>
                <li>• Have cash ready for margin calls</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Position Entry</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Sell 15-20% OTM calls minimum</li>
                <li>• Target 30-45 days to expiration</li>
                <li>• Avoid earnings announcements</li>
                <li>• Check implied volatility rank</li>
                <li>• Verify margin requirements first</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Position Management</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Roll up and out when profitable</li>
                <li>• Close at 21 DTE if near strike</li>
                <li>• Buy back at 25% profit minimum</li>
                <li>• Never let positions expire ITM</li>
                <li>• Adjust strikes with volatility changes</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Emergency Procedures</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Close all positions if margin &gt; 80%</li>
                <li>• Buy back calls before assignment</li>
                <li>• Have exit plan before entering</li>
                <li>• Know broker's margin policies</li>
                <li>• Keep emergency cash fund</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-2">🎓 Professional Tips</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• <strong>Margin Calculation:</strong> 20% of stock value + option value</li>
              <li>• <strong>Best Markets:</strong> High IV, sideways/down trending</li>
              <li>• <strong>Timing:</strong> Sell after volatility spikes</li>
            </ul>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• <strong>Psychology:</strong> Accept small losses quickly</li>
              <li>• <strong>Portfolio:</strong> Max 10-15% allocation to naked calls</li>
              <li>• <strong>Experience:</strong> Paper trade for 6+ months first</li>
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
                🚨 NVDA Naked Call Trading Master Class
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                Advanced high-risk, high-reward options strategy
              </p>
              <p className="text-sm text-gray-500">
                Professional-level trading with unlimited risk potential
              </p>
            </div>

            {renderRiskWarning()}

            <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">$100,000</div>
                  <div className="text-red-100 text-sm">Minimum Capital</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">Unlimited</div>
                  <div className="text-red-100 text-sm">Maximum Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">$1,900</div>
                  <div className="text-red-100 text-sm">Weekly Income Target</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">99%</div>
                  <div className="text-red-100 text-sm">Annual Yield Goal</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">🎯 What You'll Master</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">Week 1-4: Foundation</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Understand unlimited risk concept</li>
                      <li>• Learn margin requirements</li>
                      <li>• Start with conservative strikes</li>
                      <li>• Master position sizing</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Week 5-8: Risk Management</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Handle first margin calls</li>
                      <li>• Learn rolling techniques</li>
                      <li>• Navigate earnings volatility</li>
                      <li>• Emergency position closure</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Week 9-12: Advanced</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Volatility timing strategies</li>
                      <li>• Multiple contract management</li>
                      <li>• Professional risk controls</li>
                      <li>• Portfolio-level thinking</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Week 13-16: Mastery</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Market maker strategies</li>
                      <li>• Systematic approach</li>
                      <li>• Psychology of unlimited risk</li>
                      <li>• Professional scaling</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-2 border-red-300 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">🛑 Before You Continue</h4>
              <p className="text-sm text-red-700">
                This tutorial is for educational purposes only. Naked call options involve unlimited risk and can result in 
                substantial losses. Only trade with money you can afford to lose. Consider consulting a financial advisor.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={nextStep}
                className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold"
              >
                I Understand the Risks - Continue →
              </button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 1: Naked Call Strategies
              </h2>
              <p className="text-gray-600 mb-6">
                Learn the three approaches to selling naked calls
              </p>
            </div>

            {renderNakedCallStrategies()}

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
              >
                Continue to Live Trading →
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 2: 16-Week Live Trading
              </h2>
              <p className="text-gray-600 mb-6">
                Real-time naked call management with risk scenarios
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
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
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
                Step 3: Risk Management Mastery
              </h2>
              <p className="text-gray-600 mb-6">
                Critical rules for surviving unlimited risk scenarios
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
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
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
                Step 4: Naked Call Mastery Complete
              </h2>
              <p className="text-gray-600 mb-6">
                You've learned professional naked call trading
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">🎉 Your Achievement</h3>
              
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">$30,400</div>
                  <div className="text-sm text-green-700">Quarterly Income (16 weeks)</div>
                  <div className="text-xs text-green-600 mt-1">99% annualized return</div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-600">Unlimited</div>
                  <div className="text-sm text-red-700">Risk Managed</div>
                  <div className="text-xs text-red-600 mt-1">Professional controls</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-600">80</div>
                  <div className="text-sm text-purple-700">Contracts Sold</div>
                  <div className="text-xs text-purple-600 mt-1">5 per week average</div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-yellow-800 mb-2">🎓 Skills Mastered</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>✅ Unlimited risk psychology</li>
                    <li>✅ Margin management</li>
                    <li>✅ Professional entry/exit rules</li>
                    <li>✅ Emergency procedures</li>
                  </ul>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>✅ Volatility timing</li>
                    <li>✅ Position sizing discipline</li>
                    <li>✅ Rolling and adjustment</li>
                    <li>✅ Portfolio risk management</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">🚨 Final Warning</h4>
                <p className="text-sm text-red-700">
                  You now understand naked call strategies, but remember: this is a high-risk, 
                  professional-level approach. Start small, use strict risk management, and never 
                  risk more than you can afford to lose. Consider this education, not advice.
                </p>
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
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
                >
                  Complete Training →
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🎉 Naked Call Master Class Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              You now understand professional naked call strategies
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
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
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
          <span>Naked Call Master Class Progress</span>
          <span>Step {Math.max(0, state.currentStep + 1)} of 5</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-red-500 to-orange-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(0, ((state.currentStep + 1) / 5) * 100)}%` }}
          />
        </div>
      </div>

      {renderCurrentStep()}
    </div>
  );
};

export default SellingCallsTutorial; 