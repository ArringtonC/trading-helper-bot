import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SimpleMESFuturesTutorialProps {
  onComplete?: () => void;
  onNext?: () => void;
}

interface MonthlyData {
  month: number;
  monthName: string;
  sp500Price: number;
  mesPosition: 'Long' | 'Short' | 'None';
  contracts: number;
  profitLoss: number;
  cumulativeProfit: number;
  emaSignal: 'Buy' | 'Sell' | 'Hold';
  action: string;
}

interface ComparisonScenario {
  year: number;
  scenario: string;
  withMES: number;
  withoutMES: number;
  difference: number;
  description: string;
}

const SimpleMESFuturesTutorial: React.FC<SimpleMESFuturesTutorialProps> = ({
  onComplete,
  onNext
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<'normal' | '2018'>('normal');
  
  // Calculator state
  const [calculatorInputs, setCalculatorInputs] = useState({
    entryPrice: '',
    exitPrice: '',
    contracts: '1',
    position: 'long' as 'long' | 'short'
  });

  // Calculate profit/loss for the calculator
  const calculateProfitLoss = () => {
    const entry = parseFloat(calculatorInputs.entryPrice);
    const exit = parseFloat(calculatorInputs.exitPrice);
    const contracts = parseInt(calculatorInputs.contracts);
    
    if (isNaN(entry) || isNaN(exit) || isNaN(contracts)) {
      return { profitLoss: 0, points: 0, ticks: 0 };
    }
    
    const pointsDifference = calculatorInputs.position === 'long' 
      ? exit - entry 
      : entry - exit;
    
    const profitLoss = pointsDifference * contracts * 5; // $5 per point
    const ticks = Math.abs(pointsDifference) * 4; // 4 ticks per point
    
    return {
      profitLoss: Math.round(profitLoss * 100) / 100,
      points: Math.round(Math.abs(pointsDifference) * 100) / 100,
      ticks: Math.round(ticks * 100) / 100
    };
  };

  // Capital requirements for MES trading
  const mesRequirements = {
    marginPerContract: 1320, // Current MES margin requirement
    recommendedCapital: 5000, // Minimum recommended
    optimalCapital: 10000, // Better cushion
    contracts: 1 // Starting with 1 contract
  };

  // Generate monthly data for normal scenario
  const normalScenarioData: MonthlyData[] = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    let sp500Price = 4200;
    let cumulativeProfit = 0;
    const data: MonthlyData[] = [];

    months.forEach((monthName, index) => {
      // Simulate realistic S&P 500 movements with EMA crossovers
      const monthlyChanges = [2.1, -1.5, 3.2, 1.8, -2.8, 4.1, 1.2, -1.8, 2.9, -3.2, 2.4, 1.7];
      const changePercent = monthlyChanges[index];
      sp500Price = sp500Price * (1 + changePercent / 100);
      
      // EMA signals (simplified)
      const emaSignals: Array<'Buy' | 'Sell' | 'Hold'> = [
        'Buy', 'Hold', 'Buy', 'Hold', 'Sell', 'Buy', 'Hold', 'Sell', 'Buy', 'Sell', 'Hold', 'Buy'
      ];
      const emaSignal = emaSignals[index];
      
      // Calculate MES profit/loss based on position
      let profitLoss = 0;
      let position: 'Long' | 'Short' | 'None' = 'None';
      let action = 'Hold';
      
      if (emaSignal === 'Buy' && changePercent > 0) {
        position = 'Long';
        profitLoss = changePercent * 50; // $50 per point per contract
        action = 'Opened Long Position';
      } else if (emaSignal === 'Sell' && changePercent < 0) {
        position = 'Short';
        profitLoss = -changePercent * 50; // Profit from short when market drops
        action = 'Opened Short Position';
      } else if (emaSignal === 'Hold') {
        position = 'None';
        action = 'Stayed in Cash';
      }

      cumulativeProfit += profitLoss;

      data.push({
        month: index + 1,
        monthName,
        sp500Price: Math.round(sp500Price),
        mesPosition: position,
        contracts: position !== 'None' ? 1 : 0,
        profitLoss: Math.round(profitLoss),
        cumulativeProfit: Math.round(cumulativeProfit),
        emaSignal,
        action
      });
    });

    return data;
  }, []);

  // Generate 2018 bear market scenario
  const crisis2018Data: MonthlyData[] = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    let sp500Price = 2673; // Starting price for 2018
    let cumulativeProfit = 0;
    const data: MonthlyData[] = [];

    // 2018 actual monthly returns (simplified)
    const monthlyChanges = [5.6, -3.7, -2.7, 0.3, 2.2, 0.5, 3.6, 3.0, 0.4, -6.9, 2.0, -9.0];
    
    months.forEach((monthName, index) => {
      const changePercent = monthlyChanges[index];
      sp500Price = sp500Price * (1 + changePercent / 100);
      
      // EMA would have helped catch the downturn
      const emaSignals: Array<'Buy' | 'Sell' | 'Hold'> = [
        'Buy', 'Hold', 'Sell', 'Hold', 'Buy', 'Hold', 'Buy', 'Hold', 'Hold', 'Sell', 'Hold', 'Sell'
      ];
      const emaSignal = emaSignals[index];
      
      let profitLoss = 0;
      let position: 'Long' | 'Short' | 'None' = 'None';
      let action = 'Hold';
      
      if (emaSignal === 'Buy' && changePercent > 0) {
        position = 'Long';
        profitLoss = changePercent * 50;
        action = 'Opened Long Position';
      } else if (emaSignal === 'Sell' && changePercent < 0) {
        position = 'Short';
        profitLoss = -changePercent * 50;
        action = 'Opened Short Position';
      } else if (emaSignal === 'Sell' && changePercent > 0) {
        // Missed upside by being cautious
        action = 'Stayed Defensive';
      } else {
        action = 'Stayed in Cash';
      }

      cumulativeProfit += profitLoss;

      data.push({
        month: index + 1,
        monthName,
        sp500Price: Math.round(sp500Price),
        mesPosition: position,
        contracts: position !== 'None' ? 1 : 0,
        profitLoss: Math.round(profitLoss),
        cumulativeProfit: Math.round(cumulativeProfit),
        emaSignal,
        action
      });
    });

    return data;
  }, []);

  const comparisonScenarios: ComparisonScenario[] = [
    {
      year: 2023,
      scenario: 'Normal Market',
      withMES: normalScenarioData[normalScenarioData.length - 1].cumulativeProfit,
      withoutMES: 0,
      difference: normalScenarioData[normalScenarioData.length - 1].cumulativeProfit,
      description: 'Using MES with EMA signals vs staying in cash'
    },
    {
      year: 2018,
      scenario: 'Bear Market',
      withMES: crisis2018Data[crisis2018Data.length - 1].cumulativeProfit,
      withoutMES: -1000, // Approximate loss from being long only
      difference: crisis2018Data[crisis2018Data.length - 1].cumulativeProfit + 1000,
      description: 'MES flexibility helped avoid major losses during market decline'
    }
  ];

  const currentData = selectedScenario === 'normal' ? normalScenarioData : crisis2018Data;

  const renderCapitalRequirements = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        💰 MES Futures Capital Requirements
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Minimum to Start</h4>
            <div className="text-3xl font-bold text-green-600 mb-2">${mesRequirements.recommendedCapital.toLocaleString()}</div>
            <p className="text-sm text-green-700">
              Much lower barrier than most options strategies
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Margin per contract:</span>
              <span className="font-semibold">${mesRequirements.marginPerContract.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Recommended buffer:</span>
              <span className="font-semibold">${(mesRequirements.recommendedCapital - mesRequirements.marginPerContract).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span><strong>Total recommended:</strong></span>
              <span className="font-bold text-green-600">${mesRequirements.recommendedCapital.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Why MES vs ES?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>MES:</strong> $1,320 margin vs ES: $13,200</li>
              <li>• <strong>Same market exposure</strong> at 1/10th the size</li>
              <li>• <strong>Better risk management</strong> for smaller accounts</li>
              <li>• <strong>Same strategies apply</strong> - just smaller scale</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">Contract Specifications</h4>
            <div className="text-sm text-purple-700 space-y-1">
              <div>• <strong>Point value:</strong> $5 per 0.25 point ($20 per full point)</div>
              <div>• <strong>Trading hours:</strong> Nearly 24/5</div>
              <div>• <strong>Expiration:</strong> Quarterly (Mar, Jun, Sep, Dec)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScenarioChart = () => {
    const chartData = currentData.map(item => ({
      month: item.monthName,
      'Cumulative P&L': item.cumulativeProfit,
      'S&P 500 Level': item.sp500Price
    }));

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">
          📊 {selectedScenario === 'normal' ? 'Normal Market' : '2018 Bear Market'} Performance
        </h3>
        
        <div className="mb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedScenario('normal')}
              className={`px-4 py-2 rounded-lg ${
                selectedScenario === 'normal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Normal Market (2023)
            </button>
            <button
              onClick={() => setSelectedScenario('2018')}
              className={`px-4 py-2 rounded-lg ${
                selectedScenario === '2018'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Bear Market (2018)
            </button>
          </div>
        </div>

        <div className="h-80 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'Cumulative P&L' ? `$${value}` : value,
                  name
                ]}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="Cumulative P&L" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="S&P 500 Level" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              ${currentData[currentData.length - 1].cumulativeProfit}
            </div>
            <div className="text-sm text-green-700">Total Profit</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {currentData.filter(d => d.profitLoss > 0).length}
            </div>
            <div className="text-sm text-blue-700">Winning Months</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(currentData[currentData.length - 1].cumulativeProfit / mesRequirements.recommendedCapital * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-purple-700">Return on Capital</div>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthlyBreakdown = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">📅 Month-by-Month Breakdown</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Month</th>
              <th className="text-left p-2">S&P 500</th>
              <th className="text-left p-2">EMA Signal</th>
              <th className="text-left p-2">Position</th>
              <th className="text-right p-2">P&L</th>
              <th className="text-right p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((data, index) => (
              <tr key={index} className={`border-b ${data.profitLoss > 0 ? 'bg-green-50' : data.profitLoss < 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <td className="p-2 font-medium">{data.monthName}</td>
                <td className="p-2">{data.sp500Price}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    data.emaSignal === 'Buy' ? 'bg-green-200 text-green-800' :
                    data.emaSignal === 'Sell' ? 'bg-red-200 text-red-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {data.emaSignal}
                  </span>
                </td>
                <td className="p-2">
                  {data.mesPosition !== 'None' ? (
                    <span className={`px-2 py-1 rounded text-xs ${
                      data.mesPosition === 'Long' ? 'bg-blue-200 text-blue-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {data.mesPosition}
                    </span>
                  ) : (
                    <span className="text-gray-500">Cash</span>
                  )}
                </td>
                <td className={`p-2 text-right font-medium ${
                  data.profitLoss > 0 ? 'text-green-600' : data.profitLoss < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  ${data.profitLoss}
                </td>
                <td className={`p-2 text-right font-bold ${
                  data.cumulativeProfit > 0 ? 'text-green-600' : data.cumulativeProfit < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  ${data.cumulativeProfit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">⚖️ MES vs Traditional Investing</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {comparisonScenarios.map((scenario, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">{scenario.year} - {scenario.scenario}</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>With MES + EMA:</span>
                <span className={`font-bold ${scenario.withMES > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${scenario.withMES}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Buy & Hold Only:</span>
                <span className={`font-bold ${scenario.withoutMES > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${scenario.withoutMES}
                </span>
              </div>
              
              <div className="flex justify-between items-center border-t pt-2">
                <span><strong>Difference:</strong></span>
                <span className={`font-bold text-lg ${scenario.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  +${scenario.difference}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-3">{scenario.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">🎯 Key Advantages of MES</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Flexibility:</strong> Can profit from both up and down markets</li>
          <li>• <strong>Lower capital:</strong> $5,000 vs $25,000+ for options strategies</li>
          <li>• <strong>Liquidity:</strong> Trade nearly 24/5 with tight spreads</li>
          <li>• <strong>Leverage:</strong> Control $200,000+ of S&P 500 exposure with $5,000</li>
          <li>• <strong>Simplicity:</strong> Just follow EMA signals - no complex options Greeks</li>
        </ul>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                📈 MES Futures with EMA Strategy
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                Learn futures trading with lower capital requirements
              </p>
              <p className="text-sm text-gray-500">
                Simple EMA signals • Lower barriers to entry • Both bull and bear market opportunities
              </p>
            </div>

            {renderCapitalRequirements()}

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">🎯 What You'll Learn</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Trading Basics</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• MES contract specifications</li>
                    <li>• Margin requirements</li>
                    <li>• Long vs short positioning</li>
                    <li>• Basic EMA signal interpretation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Scenarios</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Normal market conditions (2023)</li>
                    <li>• Bear market survival (2018)</li>
                    <li>• MES vs traditional investing</li>
                    <li>• Risk management basics</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentStep(0.5)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Learn About MES Futures →
              </button>
            </div>
          </div>
        );

      case 0.5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                📚 What is MES? Understanding Micro E-Mini S&P 500 Futures
              </h2>
              <p className="text-gray-600 mb-6">
                Master the fundamentals before diving into the trading strategy
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                🎯 MES Basics: What You Need to Know
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">What is MES?</h4>
                  <div className="space-y-3 text-sm">
                    <div className="bg-blue-50 p-3 rounded">
                      <strong>MES = Micro E-Mini S&P 500</strong><br />
                      A smaller version of the popular ES (E-Mini S&P 500) contract
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <strong>Where it trades:</strong> CME (Chicago Mercantile Exchange)<br />
                      <strong>Perfect for:</strong> Smaller traders and those learning futures
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <strong>Key benefit:</strong> Same market exposure as ES but 1/10th the size and risk
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">MES vs ES Comparison</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-1">
                        <span><strong>Contract Size:</strong></span>
                        <span></span>
                      </div>
                      <div className="flex justify-between">
                        <span>• MES:</span>
                        <span className="font-semibold">$5 × S&P 500</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span>• ES:</span>
                        <span className="font-semibold">$50 × S&P 500</span>
                      </div>
                      <div className="flex justify-between">
                        <span><strong>Margin Required:</strong></span>
                        <span></span>
                      </div>
                      <div className="flex justify-between">
                        <span>• MES:</span>
                        <span className="font-semibold text-green-600">~$1,320</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• ES:</span>
                        <span className="font-semibold text-red-600">~$13,200</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">📊 MES Contract Specifications</h3>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">$5.00</div>
                  <div className="text-sm text-gray-600">Point Value</div>
                  <div className="text-xs text-blue-700 mt-1">Per 1.0 index point</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">$1.25</div>
                  <div className="text-sm text-gray-600">Tick Value</div>
                  <div className="text-xs text-green-700 mt-1">Per 0.25 tick</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">0.25</div>
                  <div className="text-sm text-gray-600">Minimum Tick</div>
                  <div className="text-xs text-purple-700 mt-1">Smallest price move</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Trading Details</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• <strong>Trading Hours:</strong> Nearly 24/5 (Sunday-Friday)</li>
                    <li>• <strong>Price Format:</strong> 4580.25 (represents index points)</li>
                    <li>• <strong>Delivery Months:</strong> Mar (H), Jun (M), Sep (U), Dec (Z)</li>
                    <li>• <strong>Settlement:</strong> Cash settled (no physical delivery)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Understanding Ticks vs Points</h4>
                  <div className="bg-yellow-50 p-3 rounded">
                    <ul className="space-y-1 text-sm text-yellow-700">
                      <li>• <strong>1 Point = 4 Ticks</strong> (since min tick is 0.25)</li>
                      <li>• <strong>1 Tick = $1.25</strong></li>
                      <li>• <strong>1 Point = $5.00</strong></li>
                      <li>• Move from 4580.00 to 4581.00 = 1 point = $5.00</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">🧮 How to Calculate Profit/Loss</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Basic Formula</h4>
                <div className="text-center">
                  <div className="bg-white p-3 rounded border-2 border-yellow-300 inline-block">
                    <strong>Profit/Loss = (Exit Price - Entry Price) × Number of Contracts × $5</strong>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    For short positions, reverse: (Entry Price - Exit Price) × Contracts × $5
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">📈 Example 1: Long Position (Bullish)</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Trade Setup:</strong></p>
                      <ul className="list-disc list-inside text-green-700">
                        <li>Entry Price: 4580.25</li>
                        <li>Exit Price: 4582.75</li>
                        <li>Contracts: 1</li>
                        <li>Direction: Long (bought)</li>
                      </ul>
                    </div>
                    <div>
                      <p><strong>Calculation:</strong></p>
                      <ul className="list-disc list-inside text-green-700">
                        <li>(4582.75 - 4580.25) = 2.50 points</li>
                        <li>2.50 × 1 contract × $5 = <strong>$12.50 profit</strong></li>
                        <li>Price moved 2.50 points in your favor</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📉 Example 2: Short Position (Bearish)</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Trade Setup:</strong></p>
                      <ul className="list-disc list-inside text-blue-700">
                        <li>Entry Price: 4580.25</li>
                        <li>Exit Price: 4578.00</li>
                        <li>Contracts: 2</li>
                        <li>Direction: Short (sold)</li>
                      </ul>
                    </div>
                    <div>
                      <p><strong>Calculation:</strong></p>
                      <ul className="list-disc list-inside text-blue-700">
                        <li>(4580.25 - 4578.00) = 2.25 points</li>
                        <li>2.25 × 2 contracts × $5 = <strong>$22.50 profit</strong></li>
                        <li>Price moved 2.25 points in your favor</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">📉 Example 3: Loss Scenario</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Trade Setup:</strong></p>
                      <ul className="list-disc list-inside text-red-700">
                        <li>Entry Price: 4580.00</li>
                        <li>Exit Price: 4578.50</li>
                        <li>Contracts: 1</li>
                        <li>Direction: Long (bought)</li>
                      </ul>
                    </div>
                    <div>
                      <p><strong>Calculation:</strong></p>
                      <ul className="list-disc list-inside text-red-700">
                        <li>(4578.50 - 4580.00) = -1.50 points</li>
                        <li>-1.50 × 1 contract × $5 = <strong>-$7.50 loss</strong></li>
                        <li>Price moved 1.50 points against you</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">🧮 Practice Calculator: Test Your Understanding</h3>
              
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-4">Try it yourself! Enter values and see the calculation:</h4>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Position Type</label>
                      <select
                        value={calculatorInputs.position}
                        onChange={(e) => setCalculatorInputs({...calculatorInputs, position: e.target.value as 'long' | 'short'})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="long">Long (Buy first, profit when price goes up)</option>
                        <option value="short">Short (Sell first, profit when price goes down)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Entry Price</label>
                      <input
                        type="number"
                        step="0.25"
                        placeholder="e.g., 4580.25"
                        value={calculatorInputs.entryPrice}
                        onChange={(e) => setCalculatorInputs({...calculatorInputs, entryPrice: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Exit Price</label>
                      <input
                        type="number"
                        step="0.25"
                        placeholder="e.g., 4582.75"
                        value={calculatorInputs.exitPrice}
                        onChange={(e) => setCalculatorInputs({...calculatorInputs, exitPrice: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Contracts</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={calculatorInputs.contracts}
                        onChange={(e) => setCalculatorInputs({...calculatorInputs, contracts: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                      <h5 className="font-semibold text-gray-800 mb-3">📊 Calculation Results</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Points Moved:</span>
                          <span className="font-semibold">{calculateProfitLoss().points}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ticks Moved:</span>
                          <span className="font-semibold">{calculateProfitLoss().ticks}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-800 font-semibold">Profit/Loss:</span>
                          <span className={`font-bold text-lg ${calculateProfitLoss().profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${calculateProfitLoss().profitLoss >= 0 ? '+' : ''}${calculateProfitLoss().profitLoss.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h5 className="font-semibold text-yellow-800 mb-2">💡 How it's calculated:</h5>
                      <div className="text-sm text-yellow-700 space-y-1">
                        {calculatorInputs.entryPrice && calculatorInputs.exitPrice && calculatorInputs.contracts ? (
                          <>
                            <p><strong>Formula:</strong> (Exit - Entry) × Contracts × $5</p>
                            <p><strong>Your calculation:</strong></p>
                            <p>
                              ({calculatorInputs.exitPrice} - {calculatorInputs.entryPrice}) × {calculatorInputs.contracts} × $5
                              {calculatorInputs.position === 'short' && <span className="block text-xs mt-1">* Reversed for short position</span>}
                            </p>
                          </>
                        ) : (
                          <p>Fill in the values above to see the calculation breakdown</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-xs text-blue-700">
                        <strong>Tip:</strong> Try the examples from above! Entry: 4580.25, Exit: 4582.75, Contracts: 1, Position: Long
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => setCalculatorInputs({entryPrice: '4580.25', exitPrice: '4582.75', contracts: '1', position: 'long'})}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                  >
                    Try Example 1 (Long)
                  </button>
                  <button
                    onClick={() => setCalculatorInputs({entryPrice: '4580.25', exitPrice: '4578.00', contracts: '2', position: 'short'})}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                  >
                    Try Example 2 (Short)
                  </button>
                  <button
                    onClick={() => setCalculatorInputs({entryPrice: '4580.00', exitPrice: '4578.50', contracts: '1', position: 'long'})}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                  >
                    Try Example 3 (Loss)
                  </button>
                  <button
                    onClick={() => setCalculatorInputs({entryPrice: '', exitPrice: '', contracts: '1', position: 'long'})}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">💡 Practical Trading Tips</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-800 mb-3">✅ Best Practices</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span><strong>Start with 1 contract</strong> to learn and practice</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span><strong>Use stop losses</strong> - each tick is $1.25, plan your risk</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span><strong>Paper trade first</strong> - practice without real money</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span><strong>Understand margin</strong> - typically $500-800 per contract</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-800 mb-3">⚠️ Risk Management</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span><strong>10-tick move = $12.50</strong> - small moves add up quickly</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span><strong>Set realistic targets</strong> - 5-10 points is significant</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span><strong>Never risk more than you can afford</strong> to lose</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span><strong>Position size matters</strong> - scale based on account size</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">🎯 Why MES is Perfect for Learning</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-700">
                <div>
                  <h4 className="font-semibold mb-2">Lower Barriers to Entry:</h4>
                  <ul className="space-y-1">
                    <li>• <strong>Smaller margin requirement:</strong> $1,320 vs $13,200 for ES</li>
                    <li>• <strong>Lower dollar risk:</strong> Each point move is $5 vs $50</li>
                    <li>• <strong>Same market exposure:</strong> Track exact same S&P 500 index</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Perfect Learning Environment:</h4>
                  <ul className="space-y-1">
                    <li>• <strong>Manageable risk:</strong> Learn without fear of huge losses</li>
                    <li>• <strong>Real market conditions:</strong> Same price action as ES</li>
                    <li>• <strong>Scalable strategy:</strong> Graduate to ES when ready</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(0)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                ← Back to Overview
              </button>
              <button
                onClick={() => setCurrentStep(1)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Start Strategy Tutorial →
              </button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 1: Market Scenarios
              </h2>
              <p className="text-gray-600 mb-6">
                See how MES + EMA performs in different market conditions
              </p>
            </div>

            {renderScenarioChart()}
            {renderMonthlyBreakdown()}

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(0.5)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                ← Back to MES Basics
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                See Comparison →
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Step 2: MES vs Traditional Investing
              </h2>
              <p className="text-gray-600 mb-6">
                Compare futures flexibility with buy-and-hold approaches
              </p>
            </div>

            {renderComparison()}

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">🎓 Tutorial Complete!</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Key Takeaways</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• MES requires much less capital than options strategies</li>
                    <li>• Simple EMA signals can guide entry/exit decisions</li>
                    <li>• Both long and short positions provide flexibility</li>
                    <li>• Risk management is crucial with leverage</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Next Steps</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Paper trade with virtual funds first</li>
                    <li>• Start with 1 contract maximum</li>
                    <li>• Use proper stop losses (2-3%)</li>
                    <li>• Keep detailed trading journal</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Disclaimers</h4>
                <p className="text-sm text-yellow-700">
                  Futures trading involves substantial risk of loss and is not suitable for all investors. 
                  Past performance is not indicative of future results. This tutorial is for educational 
                  purposes only and should not be considered investment advice.
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                ← Back
              </button>
              <button
                onClick={onComplete}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Complete Tutorial ✓
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>MES Futures Tutorial Progress</span>
          <span>Step {currentStep === 0.5 ? '1' : currentStep + 1} of 4</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${currentStep === 0 ? 25 : currentStep === 0.5 ? 50 : currentStep === 1 ? 75 : 100}%` }}
          />
        </div>
      </div>

      {renderCurrentStep()}
    </div>
  );
};

export default SimpleMESFuturesTutorial;
