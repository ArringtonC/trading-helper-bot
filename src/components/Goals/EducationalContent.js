/**
 * EducationalContent - Provides research-backed educational content for goal setting
 * 
 * Features:
 * - Expectation management based on market realities
 * - Benjamin Graham criteria for value investing goals
 * - Small-cap growth criteria for growth-seeking goals
 * - Defensive stock criteria for preservation goals
 * - Paper trading integration recommendations
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, TrendingUp, Shield, Target, Brain, Calculator, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { ProgressiveDisclosure } from '../StockScreening/ProgressiveDisclosure';
import { RiskIndicator } from '../StockScreening/RiskIndicator';

const EducationalContent = ({ 
  goalType, 
  userResponses = {},
  detectedBiases = [],
  unrealisticExpectations = [],
  className = '' 
}) => {
  const [activeSection, setActiveSection] = useState(null);
  const [expandedModules, setExpandedModules] = useState(new Set());

  const getEducationalModules = (goalType) => {
    const moduleMap = {
      income_generation: [
        {
          id: 'dividend_basics',
          title: 'Dividend Investing Fundamentals',
          icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
          difficulty: 'beginner',
          timeToRead: '5 min',
          content: {
            overview: 'Understanding how dividend investing works and realistic expectations.',
            keyPoints: [
              'Average S&P 500 dividend yield is around 2%',
              'High-quality dividend stocks typically yield 3-5%',
              'Dividend aristocrats have 25+ years of consecutive increases',
              'High yields (8%+) often signal company distress'
            ],
            realWorldExamples: [
              { company: 'Johnson & Johnson', yield: '2.8%', years: '59 years of increases' },
              { company: 'Coca-Cola', yield: '3.1%', years: '60 years of increases' },
              { company: 'Procter & Gamble', yield: '2.6%', years: '66 years of increases' }
            ],
            calculations: {
              title: 'Monthly Income Calculator',
              formula: 'Portfolio Size × Annual Yield ÷ 12 = Monthly Income',
              examples: [
                { portfolio: 50000, yield: 0.04, monthly: Math.round(50000 * 0.04 / 12) },
                { portfolio: 100000, yield: 0.04, monthly: Math.round(100000 * 0.04 / 12) },
                { portfolio: 250000, yield: 0.04, monthly: Math.round(250000 * 0.04 / 12) }
              ]
            }
          }
        },
        {
          id: 'dividend_strategies',
          title: 'Dividend Investment Strategies',
          icon: <Target className="w-5 h-5 text-green-500" />,
          difficulty: 'intermediate',
          timeToRead: '8 min',
          content: {
            strategies: [
              {
                name: 'Dividend Growth Investing',
                description: 'Focus on companies that consistently increase dividends',
                criteria: ['5+ years of dividend growth', 'Payout ratio under 60%', 'Strong balance sheet'],
                examples: ['Microsoft', 'Apple', 'Visa']
              },
              {
                name: 'High Dividend Yield',
                description: 'Target stocks with higher current yields',
                criteria: ['4-8% dividend yield', 'Sustainable payout', 'Stable business model'],
                examples: ['REITs', 'Utilities', 'Telecom']
              },
              {
                name: 'Covered Call Strategy',
                description: 'Generate additional income by selling call options',
                criteria: ['Own 100+ shares', 'Understand options', 'Moderate volatility stocks'],
                additionalIncome: '1-3% monthly (but caps upside)'
              }
            ]
          }
        }
      ],

      growth_seeking: [
        {
          id: 'growth_expectations',
          title: 'Realistic Growth Expectations',
          icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
          difficulty: 'beginner',
          timeToRead: '6 min',
          content: {
            overview: 'Understanding what growth rates are actually achievable in the stock market.',
            historicalReturns: {
              sp500: { period: '1957-2021', average: '10.5%', best: '47.4%', worst: '-37.0%' },
              smallCap: { period: '1979-2021', average: '11.9%', volatility: 'Higher' },
              international: { period: '1970-2021', average: '9.6%', volatility: 'High' }
            },
            realityCheck: [
              'Market averages include many down years',
              'Professional managers rarely beat the market consistently',
              'High returns often followed by periods of poor performance',
              'Diversification reduces risk but may limit extreme returns'
            ],
            compoundingExamples: [
              { years: 10, rate: 0.08, initial: 10000, final: 21589 },
              { years: 20, rate: 0.08, initial: 10000, final: 46610 },
              { years: 30, rate: 0.08, initial: 10000, final: 100627 }
            ]
          }
        },
        {
          id: 'growth_criteria',
          title: 'Identifying Growth Stocks',
          icon: <Target className="w-5 h-5 text-blue-500" />,
          difficulty: 'intermediate',
          timeToRead: '10 min',
          content: {
            overview: 'Research-backed criteria for identifying quality growth companies.',
            fundamentalCriteria: [
              'Revenue growth > 15% annually for 3+ years',
              'Earnings growth > 20% annually',
              'Return on Equity (ROE) > 15%',
              'Debt-to-Equity ratio < 0.5',
              'Price-to-Earnings-Growth (PEG) ratio < 2.0'
            ],
            qualitativeFactor: [
              'Strong competitive moat (brand, patents, network effects)',
              'Large addressable market with room for expansion',
              'Competent management with skin in the game',
              'Disruptive technology or business model'
            ],
            smallCapGrowth: {
              title: 'Small-Cap Growth Criteria (Research-Backed)',
              description: 'Studies show top 20% growth rate companies outperform',
              criteria: [
                'Market cap $300M - $2B',
                'Top 20% growth rates in sector',
                'Institutional ownership 20-60% (not too crowded)',
                'Strong balance sheet for funding growth'
              ]
            }
          }
        }
      ],

      capital_preservation: [
        {
          id: 'defensive_investing',
          title: 'Defensive Investment Strategies',
          icon: <Shield className="w-5 h-5 text-green-500" />,
          difficulty: 'beginner',
          timeToRead: '7 min',
          content: {
            overview: 'Strategies to protect capital while beating inflation.',
            defensiveCriteria: [
              'Low beta (< 1.0) - less volatile than market',
              'Consistent earnings for 10+ years',
              'Strong credit rating (A or better)',
              'Essential products/services (utilities, healthcare, consumer staples)'
            ],
            inflationProtection: [
              'Treasury Inflation-Protected Securities (TIPS)',
              'Real Estate Investment Trusts (REITs)',
              'Commodities or commodity-focused funds',
              'Companies that can pass through inflation (pricing power)'
            ],
            graharmCriteria: {
              title: 'Benjamin Graham Defensive Investor Criteria',
              description: 'Time-tested criteria for defensive stock selection',
              criteria: [
                'Earnings growth of at least 3% annually over 10 years',
                'Price-to-Earnings ratio no more than 15',
                'Price-to-Book ratio no more than 1.5',
                'Debt-to-Equity ratio less than 0.5',
                'Current ratio greater than 2.0',
                'Dividend payments for at least 20 years'
              ]
            }
          }
        }
      ],

      learning_practice: [
        {
          id: 'paper_trading',
          title: 'Paper Trading Best Practices',
          icon: <Brain className="w-5 h-5 text-orange-500" />,
          difficulty: 'beginner',
          timeToRead: '5 min',
          content: {
            overview: 'How to effectively use paper trading to build skills without risk.',
            benefits: [
              'Test strategies without losing real money',
              'Learn platform functionality and order types',
              'Practice emotional discipline',
              'Track performance and identify patterns'
            ],
            bestPractices: [
              'Trade with realistic position sizes (as if using real money)',
              'Include transaction costs in calculations',
              'Keep detailed records of trades and reasoning',
              'Set specific learning goals for each practice period',
              'Graduate to real money only after consistent success'
            ],
            commonMistakes: [
              'Taking excessive risks because "it\'s not real"',
              'Not accounting for slippage and fees',
              'Switching strategies too quickly',
              'Not maintaining the same emotional discipline'
            ]
          }
        },
        {
          id: 'learning_progression',
          title: 'Investment Learning Path',
          icon: <BookOpen className="w-5 h-5 text-blue-500" />,
          difficulty: 'beginner',
          timeToRead: '8 min',
          content: {
            overview: 'Structured approach to building investment knowledge and skills.',
            phase1: {
              title: 'Foundation (Months 1-3)',
              focus: 'Basic concepts and index fund investing',
              topics: ['Asset allocation', 'Diversification', 'Index funds vs active funds', 'Tax-advantaged accounts'],
              practicalSteps: ['Open brokerage account', 'Start with target-date fund', 'Set up automatic investing']
            },
            phase2: {
              title: 'Expansion (Months 4-9)',
              focus: 'Individual stock analysis and sector knowledge',
              topics: ['Financial statement basics', 'Valuation methods', 'Sector analysis', 'Economic indicators'],
              practicalSteps: ['Paper trade individual stocks', 'Analyze 10 companies thoroughly', 'Track market cycles']
            },
            phase3: {
              title: 'Specialization (Months 10+)',
              focus: 'Advanced strategies and personal style development',
              topics: ['Options basics', 'International investing', 'Alternative investments', 'Tax optimization'],
              practicalSteps: ['Develop personal investment philosophy', 'Consider specialized strategies', 'Review and refine approach']
            }
          }
        }
      ],

      active_trading: [
        {
          id: 'trading_reality',
          title: 'The Reality of Active Trading',
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          difficulty: 'advanced',
          timeToRead: '10 min',
          content: {
            overview: 'Research-backed statistics on active trading success rates and requirements.',
            statistics: [
              '80% of day traders lose money over any 12-month period',
              '97% of day traders lose money over 3+ years',
              'Average day trader underperforms buy-and-hold by 7% annually',
              'Pattern Day Trading requires $25,000 minimum account'
            ],
            requirements: [
              'Significant time commitment (6+ hours daily)',
              'Advanced technical analysis skills',
              'Strict risk management discipline',
              'Substantial capital base ($25,000+)',
              'Low-cost trading platform and fast internet',
              'Emotional discipline under pressure'
            ],
            successFactors: [
              'Treat it as a business, not gambling',
              'Never risk more than 1-2% per trade',
              'Have a written trading plan',
              'Keep detailed records and analyze mistakes',
              'Start with paper trading until consistently profitable'
            ]
          }
        }
      ]
    };

    return moduleMap[goalType] || [];
  };

  const getBiasEducation = (biases) => {
    const biasEducation = {
      overconfidence: {
        title: 'Managing Overconfidence Bias',
        description: 'Research shows 80% of traders believe they\'re above average.',
        strategies: [
          'Start with smaller position sizes while learning',
          'Keep a trading journal to track actual vs expected results',
          'Use paper trading to test strategies before risking real money',
          'Set realistic benchmarks and measure performance objectively'
        ],
        studies: [
          'Barber & Odean (2000): Overconfident traders trade 45% more and earn 3.2% less annually',
          'Studies show men trade 45% more than women and earn 2.65% less per year'
        ]
      },
      loss_aversion: {
        title: 'Understanding Loss Aversion',
        description: 'People typically feel losses twice as strongly as equivalent gains.',
        strategies: [
          'Use predetermined exit strategies (stop-losses)',
          'Focus on overall portfolio performance, not individual positions',
          'Consider dollar-cost averaging to smooth volatility',
          'Reframe "losses" as tuition for learning'
        ],
        behavioralInsights: [
          'Loss aversion can lead to holding losing positions too long',
          'Can cause premature selling of winning positions',
          'Often results in poor market timing decisions'
        ]
      }
    };

    return biases.map(bias => biasEducation[bias.type]).filter(Boolean);
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const modules = getEducationalModules(goalType);
  const biasEducation = getBiasEducation(detectedBiases);

  return (
    <div className={`educational-content ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <BookOpen className="w-6 h-6 text-blue-500 mr-3" />
          Educational Content
        </h3>
        <p className="text-gray-600">
          Research-backed guidance tailored to your investment goals and experience level.
        </p>
      </div>

      {/* Bias Education (if applicable) */}
      {biasEducation.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Brain className="w-5 h-5 text-orange-500 mr-2" />
            Behavioral Insights
          </h4>
          <div className="space-y-4">
            {biasEducation.map((education, index) => (
              <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h5 className="font-medium text-orange-900 mb-2">{education.title}</h5>
                <p className="text-orange-800 text-sm mb-3">{education.description}</p>
                <div className="space-y-2">
                  <h6 className="font-medium text-orange-900 text-sm">Strategies to address:</h6>
                  <ul className="space-y-1">
                    {education.strategies.map((strategy, idx) => (
                      <li key={idx} className="text-orange-700 text-sm flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                        {strategy}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Educational Modules */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Learning Modules for {goalType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </h4>
        
        {modules.map((module) => (
          <EducationalModule
            key={module.id}
            module={module}
            isExpanded={expandedModules.has(module.id)}
            onToggle={() => toggleModule(module.id)}
          />
        ))}
      </div>

      {/* Quick Reference */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          Quick Reference
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-blue-800 mb-2">Key Metrics to Track</h5>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Total return (including dividends)</li>
              <li>• Risk-adjusted return (Sharpe ratio)</li>
              <li>• Maximum drawdown</li>
              <li>• Correlation with benchmarks</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-blue-800 mb-2">Red Flags to Avoid</h5>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Promises of guaranteed returns</li>
              <li>• Pressure to "act now"</li>
              <li>• Strategies you don't understand</li>
              <li>• Unusually high fees or commissions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual Educational Module Component
 */
const EducationalModule = ({ module, isExpanded, onToggle }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border border-gray-200 rounded-lg overflow-hidden"
    >
      {/* Module Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 bg-white hover:bg-gray-50 transition-colors text-left flex items-center justify-between"
      >
        <div className="flex items-center">
          {module.icon}
          <div className="ml-3">
            <h5 className="font-medium text-gray-900">{module.title}</h5>
            <div className="flex items-center mt-1 space-x-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                {module.difficulty}
              </span>
              <span className="text-xs text-gray-500">{module.timeToRead}</span>
            </div>
          </div>
        </div>
        
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Module Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <ModuleContent content={module.content} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Module Content Renderer
 */
const ModuleContent = ({ content }) => {
  return (
    <div className="space-y-6">
      {/* Overview */}
      {content.overview && (
        <div>
          <p className="text-gray-700">{content.overview}</p>
        </div>
      )}

      {/* Key Points */}
      {content.keyPoints && (
        <div>
          <h6 className="font-medium text-gray-900 mb-3">Key Points</h6>
          <ul className="space-y-2">
            {content.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Calculations */}
      {content.calculations && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h6 className="font-medium text-gray-900 mb-3">{content.calculations.title}</h6>
          <p className="text-sm text-gray-600 mb-4">{content.calculations.formula}</p>
          
          <div className="space-y-2">
            {content.calculations.examples?.map((example, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  ${example.portfolio.toLocaleString()} at {(example.yield * 100).toFixed(1)}%:
                </span>
                <span className="font-medium text-gray-900">
                  ${example.monthly}/month
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real World Examples */}
      {content.realWorldExamples && (
        <div>
          <h6 className="font-medium text-gray-900 mb-3">Real World Examples</h6>
          <div className="grid grid-cols-1 gap-3">
            {content.realWorldExamples.map((example, index) => (
              <div key={index} className="bg-white rounded p-3 border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{example.company}</span>
                  <span className="text-blue-600 font-medium">{example.yield}</span>
                </div>
                <span className="text-xs text-gray-500">{example.years}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graham Criteria */}
      {content.graharmCriteria && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h6 className="font-medium text-green-900 mb-2">{content.graharmCriteria.title}</h6>
          <p className="text-green-800 text-sm mb-3">{content.graharmCriteria.description}</p>
          <ul className="space-y-1">
            {content.graharmCriteria.criteria.map((criterion, index) => (
              <li key={index} className="text-green-700 text-sm flex items-start">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                {criterion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EducationalContent;
