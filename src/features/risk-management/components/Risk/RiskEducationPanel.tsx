import React, { useState } from 'react';
import {
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  Shield,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const RiskEducationPanel: React.FC = () => {
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);

  const riskConcepts = [
    {
      id: 'alpha',
      title: 'Alpha (α)',
      icon: TrendingUp,
      summary: 'Measures excess return versus benchmark',
      description: 'Alpha represents the value that a portfolio manager adds to or subtracts from a fund\'s return. A positive alpha indicates the investment has outperformed the market index, while negative alpha shows underperformance.',
      keyPoints: [
        'Alpha of 1.0 means the investment outperformed the market by 1%',
        'Considered a measure of active management skill',
        'Alpha is calculated using the Capital Asset Pricing Model (CAPM)',
        'High alpha is desirable but difficult to achieve consistently'
      ],
      example: 'If the S&P 500 returns 8% and your portfolio returns 10% with a beta of 1.0, your alpha would be approximately 2%.'
    },
    {
      id: 'beta',
      title: 'Beta (β)',
      icon: BarChart3,
      summary: 'Measures sensitivity to market movements',
      description: 'Beta measures how much a security or portfolio moves relative to the overall market. It helps investors understand the level of systematic risk they are taking.',
      keyPoints: [
        'Beta of 1.0 means the investment moves with the market',
        'Beta > 1.0 indicates higher volatility than the market',
        'Beta < 1.0 suggests lower volatility than the market',
        'Negative beta means the investment moves opposite to the market'
      ],
      example: 'A stock with beta of 1.5 is expected to move 15% when the market moves 10%. If the market falls 10%, the stock would typically fall 15%.'
    },
    {
      id: 'rsquared',
      title: 'R-Squared (R²)',
      icon: Target,
      summary: 'Shows correlation with market benchmark',
      description: 'R-squared measures how closely an investment\'s performance correlates with a benchmark index. It ranges from 0 to 1, with higher values indicating stronger correlation.',
      keyPoints: [
        'R² of 1.0 means perfect correlation with the benchmark',
        'R² of 0.85+ indicates high correlation',
        'Low R² suggests the investment follows its own pattern',
        'Helps determine if beta is meaningful'
      ],
      example: 'An S&P 500 index fund would have R² close to 1.0, while a commodity fund might have R² of 0.3 relative to the S&P 500.'
    },
    {
      id: 'sharpe',
      title: 'Sharpe Ratio',
      icon: Zap,
      summary: 'Risk-adjusted return measurement',
      description: 'The Sharpe ratio measures the performance of an investment compared to a risk-free asset, after adjusting for its risk. It helps determine whether returns are due to smart investment decisions or excess risk.',
      keyPoints: [
        'Higher Sharpe ratio indicates better risk-adjusted performance',
        'Sharpe ratio > 1.0 is considered good',
        'Sharpe ratio > 2.0 is considered excellent',
        'Calculated as (Return - Risk-free Rate) / Standard Deviation'
      ],
      example: 'If your portfolio returns 12% with 15% volatility, and the risk-free rate is 3%, your Sharpe ratio would be (12% - 3%) / 15% = 0.6.'
    },
    {
      id: 'volatility',
      title: 'Standard Deviation (Volatility)',
      icon: Shield,
      summary: 'Measures price fluctuation consistency',
      description: 'Standard deviation measures the amount of variation in an investment\'s returns. Higher standard deviation indicates greater volatility and potential for both gains and losses.',
      keyPoints: [
        'Low volatility (5-10%) indicates stable returns',
        'Moderate volatility (10-20%) is typical for diversified portfolios',
        'High volatility (20%+) suggests significant price swings',
        'Used to calculate other risk metrics like Sharpe ratio'
      ],
      example: 'A stock with 20% annual volatility might typically range from -20% to +20% in any given year, with about 68% probability.'
    },
    {
      id: 'vix',
      title: 'VIX (Fear Index)',
      icon: AlertTriangle,
      summary: 'Market volatility and fear gauge',
      description: 'The VIX measures expected volatility in the S&P 500 index based on options prices. It\'s often called the "fear index" as it tends to spike during market uncertainty.',
      keyPoints: [
        'VIX below 20 typically indicates calm markets',
        'VIX 20-30 suggests moderate uncertainty',
        'VIX above 30 indicates high fear and volatility',
        'VIX above 40 suggests extreme market stress'
      ],
      example: 'During the 2008 financial crisis, VIX peaked above 80. During calm bull markets, it often stays below 15.'
    }
  ];

  const toggleConcept = (conceptId: string) => {
    setExpandedConcept(expandedConcept === conceptId ? null : conceptId);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-green-500" />
          Risk Education Center
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Learn about key risk metrics and their implications for your portfolio
        </p>
      </div>

      <div className="p-6">
        {/* Quick Tips */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-2">Risk Management Best Practices</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Diversify across sectors and asset classes to reduce concentration risk</li>
                <li>• Monitor portfolio beta to understand market sensitivity</li>
                <li>• Use Sharpe ratio to evaluate risk-adjusted performance</li>
                <li>• Adjust risk tolerance based on market volatility (VIX levels)</li>
                <li>• Regular rebalancing helps maintain target risk profile</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Risk Concept Cards */}
        <div className="space-y-3">
          {riskConcepts.map((concept) => {
            const Icon = concept.icon;
            const isExpanded = expandedConcept === concept.id;

            return (
              <div key={concept.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleConcept(concept.id)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{concept.title}</h4>
                      <p className="text-sm text-gray-600">{concept.summary}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="pt-4">
                      <p className="text-gray-700 mb-4">{concept.description}</p>
                      
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Key Points:</h5>
                        <ul className="space-y-1">
                          {concept.keyPoints.map((point, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h6 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Example
                        </h6>
                        <p className="text-sm text-blue-800">{concept.example}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Risk Tolerance Guide */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Understanding Your Risk Profile
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-green-100 rounded-lg p-3">
              <h5 className="font-medium text-green-900 mb-2">Conservative</h5>
              <ul className="text-green-800 space-y-1">
                <li>• Beta: 0.5 - 0.8</li>
                <li>• Volatility: &lt; 10%</li>
                <li>• Focus on capital preservation</li>
                <li>• Lower expected returns</li>
              </ul>
            </div>
            <div className="bg-yellow-100 rounded-lg p-3">
              <h5 className="font-medium text-yellow-900 mb-2">Moderate</h5>
              <ul className="text-yellow-800 space-y-1">
                <li>• Beta: 0.8 - 1.2</li>
                <li>• Volatility: 10% - 15%</li>
                <li>• Balanced approach</li>
                <li>• Market-level returns</li>
              </ul>
            </div>
            <div className="bg-red-100 rounded-lg p-3">
              <h5 className="font-medium text-red-900 mb-2">Aggressive</h5>
              <ul className="text-red-800 space-y-1">
                <li>• Beta: 1.2+</li>
                <li>• Volatility: &gt; 15%</li>
                <li>• Growth-focused</li>
                <li>• Higher potential returns</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskEducationPanel; 