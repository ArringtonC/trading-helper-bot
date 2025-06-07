import React, { useState } from 'react';

interface CommonMistakesEducationProps {
  stockSymbol: string;
  onComplete: () => void;
}

interface MistakeCategory {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  examples: string[];
  solutions: string[];
  icon: string;
}

const CommonMistakesEducation: React.FC<CommonMistakesEducationProps> = ({
  stockSymbol,
  onComplete
}) => {
  const [selectedMistake, setSelectedMistake] = useState<string | null>(null);
  const [completedCategories, setCompletedCategories] = useState<string[]>([]);

  const mistakeCategories: MistakeCategory[] = [
    {
      id: 'inadequate-education',
      title: 'Inadequate Education',
      description: 'Starting without mastering the three critical skillsets: stock selection, option selection, and position management',
      impact: 'High',
      icon: '📚',
      examples: [
        'Jumping into covered calls after reading one article',
        'Not understanding how Greeks affect option pricing',
        'Ignoring earnings calendars and volatility events',
        'Not knowing when to roll, close, or hold positions'
      ],
      solutions: [
        'Complete all three skillset modules (3-4 months typical)',
        'Practice with paper trading for at least 30 trades',
        'Study options Greeks until you can explain them simply',
        'Create checklists for entry, management, and exit criteria'
      ]
    },
    {
      id: 'strike-selection',
      title: 'Strike Price Selection Errors',
      description: 'Choosing strikes too far OTM for maximum profit, missing downside protection opportunities',
      impact: 'High',
      icon: '🎯',
      examples: [
        `Selling ${stockSymbol} calls 15%+ out-of-the-money for tiny premiums`,
        'Ignoring in-the-money strikes that provide better protection',
        'Using same strike distance regardless of volatility environment',
        'Not considering delta as probability indicator'
      ],
      solutions: [
        'Focus on 0.30-0.40 delta calls (60-70% OTM probability)',
        'Consider ITM strikes when seeking maximum protection',
        'Adjust strike selection based on implied volatility levels',
        'Calculate expected trading ranges using IV before selecting strikes'
      ]
    },
    {
      id: 'position-management',
      title: 'Position Management Failures',
      description: 'No exit strategies, "set and forget" mentality, ignoring position throughout contract period',
      impact: 'High',
      icon: '⚡',
      examples: [
        'Selling options and ignoring them until expiration',
        'No predetermined profit-taking levels (25%, 50% decay)',
        'Not rolling positions when beneficial',
        'Missing opportunities to close early for quick profits'
      ],
      solutions: [
        'Set alerts for 25% and 50% profit levels',
        'Create rolling criteria based on time and price movement',
        'Monitor positions daily, especially near earnings',
        'Have predetermined responses for various scenarios'
      ]
    },
    {
      id: 'psychological-errors',
      title: 'Psychological and Emotional Mistakes',
      description: 'Fear, greed, overconfidence leading to poor timing and risk management decisions',
      impact: 'Medium',
      icon: '🧠',
      examples: [
        'Closing profitable positions too early due to fear',
        'Taking excessive risks after a few winning trades',
        'Emotional decision-making during volatile periods',
        'Ignoring stop-loss rules when losing money'
      ],
      solutions: [
        'Use predetermined trading rules as "emotional anchors"',
        'Implement stress management techniques',
        'Keep detailed trading journals to identify patterns',
        'Practice position sizing to manage fear and greed'
      ]
    },
    {
      id: 'earnings-timing',
      title: 'Earnings and Volatility Timing Errors',
      description: 'Selling calls before earnings or during high volatility events without proper preparation',
      impact: 'Medium',
      icon: '📊',
      examples: [
        `Selling ${stockSymbol} calls 1-2 weeks before earnings`,
        'Not understanding implied volatility crush post-earnings',
        'Ignoring sector-wide volatility events',
        'Missing AI conference and product announcement impacts'
      ],
      solutions: [
        'Avoid selling calls 2 weeks before earnings',
        'Monitor earnings calendar religiously',
        'Understand IV rank and percentile concepts',
        'Track technology sector events and conferences'
      ]
    },
    {
      id: 'risk-management',
      title: 'Risk Management and Position Sizing',
      description: 'Taking positions too large for account size, inadequate diversification, no stop-loss plans',
      impact: 'High',
      icon: '🛡️',
      examples: [
        'Putting 50%+ of account in one covered call position',
        'No stop-loss plan if stock drops significantly',
        'Not considering correlation with other tech holdings',
        'Using Kelly Criterion incorrectly for position sizing'
      ],
      solutions: [
        'Limit single positions to 5-10% of total account',
        'Set stop-loss at 7-10% below entry price',
        'Diversify across sectors, not just different tech stocks',
        'Use conservative Kelly Criterion implementation'
      ]
    }
  ];

  const handleMistakeSelect = (mistakeId: string) => {
    setSelectedMistake(mistakeId);
  };

  const handleCategoryComplete = (categoryId: string) => {
    if (!completedCategories.includes(categoryId)) {
      setCompletedCategories([...completedCategories, categoryId]);
    }
    setSelectedMistake(null);
  };

  const allCategoriesCompleted = completedCategories.length === mistakeCategories.length;

  const selectedMistakeData = selectedMistake ? 
    mistakeCategories.find(cat => cat.id === selectedMistake) : null;

  if (selectedMistakeData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <span className="text-3xl mr-3">{selectedMistakeData.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedMistakeData.title}
                </h2>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                  selectedMistakeData.impact === 'High' ? 'bg-red-100 text-red-800' :
                  selectedMistakeData.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedMistakeData.impact} Impact
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedMistake(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Overview
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 text-lg leading-relaxed">
              {selectedMistakeData.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Common Examples */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                ❌ Common Examples
              </h3>
              <ul className="space-y-3">
                {selectedMistakeData.examples.map((example, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2 mt-1">•</span>
                    <span className="text-red-700 text-sm">{example}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                ✅ Evidence-Based Solutions
              </h3>
              <ul className="space-y-3">
                {selectedMistakeData.solutions.map((solution, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span className="text-green-700 text-sm">{solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Plan */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              💡 Your Action Plan for {stockSymbol}
            </h3>
            <div className="text-sm text-blue-700">
              {selectedMistakeData.id === 'inadequate-education' && (
                <p>Before trading {stockSymbol} covered calls, complete our three-module curriculum and practice with at least 10 paper trades. Technology stocks require extra preparation due to their volatility.</p>
              )}
              {selectedMistakeData.id === 'strike-selection' && (
                <p>For {stockSymbol}, focus on calls with 0.30-0.40 delta. With the stock's high volatility, this typically means strikes 5-8% out-of-the-money for monthly options.</p>
              )}
              {selectedMistakeData.id === 'position-management' && (
                <p>Set alerts for when your {stockSymbol} call option loses 25% of its value (profit-taking opportunity) and create a rolling plan if the stock approaches your strike price.</p>
              )}
              {selectedMistakeData.id === 'psychological-errors' && (
                <p>{stockSymbol}'s volatility can trigger strong emotional responses. Write down your entry and exit rules before placing trades, and stick to them regardless of daily price movements.</p>
              )}
              {selectedMistakeData.id === 'earnings-timing' && (
                <p>{stockSymbol} reports earnings quarterly. Never sell calls within 2 weeks of earnings announcements. Monitor AI conferences and product launches that can create volatility.</p>
              )}
              {selectedMistakeData.id === 'risk-management' && (
                <p>Due to {stockSymbol}'s high price and volatility, limit your position to 5-10% of your total account. Set a stop-loss if the stock drops 7-10% below your entry price.</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => handleCategoryComplete(selectedMistakeData.id)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              I Understand This Mistake ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          📚 Avoid These Critical Covered Call Mistakes
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Research shows beginners need 3-4 months to master the three critical skillsets
        </p>
        <p className="text-sm text-gray-500">
          Based on analysis of retail trader patterns and professional methodologies
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8 bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Learning Progress
          </span>
          <span className="text-sm text-gray-500">
            {completedCategories.length}/{mistakeCategories.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCategories.length / mistakeCategories.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Mistake Categories Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {mistakeCategories.map((mistake) => {
          const isCompleted = completedCategories.includes(mistake.id);
          
          return (
            <div
              key={mistake.id}
              onClick={() => handleMistakeSelect(mistake.id)}
              className={`bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl border-2 ${
                isCompleted ? 'border-green-500' : 'border-transparent'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{mistake.icon}</span>
                {isCompleted && (
                  <span className="text-green-500 text-xl">✓</span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {mistake.title}
              </h3>
              
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-3 ${
                mistake.impact === 'High' ? 'bg-red-100 text-red-800' :
                mistake.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {mistake.impact} Impact
              </span>
              
              <p className="text-gray-600 text-sm leading-relaxed">
                {mistake.description}
              </p>
              
              <div className="mt-4 text-blue-600 text-sm font-medium">
                Click to learn more →
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Action */}
      {allCategoriesCompleted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-green-800 mb-3">
            🎉 Excellent! You've learned about all critical mistakes
          </h3>
          <p className="text-green-700 mb-4">
            You're now prepared to implement covered call strategies with much lower risk of common errors.
          </p>
          <button
            onClick={onComplete}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            Continue to Strategy Implementation →
          </button>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            📖 Continue Learning
          </h3>
          <p className="text-blue-700 text-sm">
            Complete all categories to build comprehensive covered call competency.
            Each mistake category contains research-backed solutions and specific guidance for {stockSymbol}.
          </p>
        </div>
      )}
    </div>
  );
};

export default CommonMistakesEducation; 