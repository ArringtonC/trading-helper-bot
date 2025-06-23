import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TutorialOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  duration: string;
  route: string;
  requirements: string;
  highlights: string[];
  riskLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const TutorialsPage: React.FC = () => {
  const navigate = useNavigate();

  const tutorials: TutorialOption[] = [
    {
      id: 'nvda-basic',
      title: 'NVDA Covered Calls',
      subtitle: 'Basic Options Income Strategy',
      description: 'Learn the fundamentals of covered call writing with NVDA. Perfect introduction to options income generation with limited risk.',
      icon: '📈',
      difficulty: 'Beginner',
      duration: '45 minutes',
      route: '/nvda-tutorial',
      requirements: '$25,000 minimum capital',
      highlights: [
        'Safe income generation',
        'Learn options basics',
        'Risk-limited strategy',
        'Year-long simulation',
        'Real market scenarios'
      ],
      riskLevel: 'Low',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200'
    },
    {
      id: 'stacking-calls',
      title: 'Stacking Covered Calls',
      subtitle: 'Multiple Overlapping Positions',
      description: 'Advanced income generation with multiple overlapping covered call positions. Transform single calls into professional income streams.',
      icon: '🔄',
      difficulty: 'Intermediate',
      duration: '60 minutes',
      route: '/stacking-tutorial',
      requirements: '$50,000 minimum capital',
      highlights: [
        'Weekly income strategy',
        '4 overlapping positions',
        'Professional management',
        '52% annual yield potential',
        'Position coordination'
      ],
      riskLevel: 'Medium',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200'
    },
    {
      id: 'naked-calls',
      title: 'Selling Naked Calls',
      subtitle: 'Maximum Income, Unlimited Risk',
      description: 'Professional-level naked call strategies with unlimited loss potential. Only for experienced traders with substantial capital.',
      icon: '🚨',
      difficulty: 'Expert',
      duration: '75 minutes',
      route: '/selling-calls-tutorial',
      requirements: '$100,000 minimum account',
      highlights: [
        'Maximum income potential',
        'Professional risk management',
        'Margin strategies',
        '99% annual yield target',
        'Crisis management'
      ],
      riskLevel: 'Extreme',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200'
    },
    {
      id: 'mes-futures',
      title: 'MES Futures Trading',
      subtitle: '20/50 EMA Trend Following',
      description: 'Learn profitable futures trading with the 20/50 EMA strategy. Technical analysis with leveraged Micro E-mini S&P 500 contracts.',
      icon: '📊',
      difficulty: 'Advanced',
      duration: '50 minutes',
      route: '/mes-futures-tutorial',
      requirements: '$10,000 minimum capital',
      highlights: [
        'Trend following strategy',
        'Technical analysis focus',
        'Leverage management',
        '15-25% annual returns',
        'Professional risk control'
      ],
      riskLevel: 'High',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200'
    },
    {
      id: 'sp500-demo',
      title: 'S&P 500 Demo Lab',
      subtitle: 'Template Matching & Account Classification',
      description: 'Interactive S&P 500 demo with real market data from 2025. Match your profile with proven investor templates and experience authentic market scenarios.',
      icon: '📈',
      difficulty: 'Beginner',
      duration: '30 minutes',
      route: '/sp500-demo',
      requirements: 'No minimum capital',
      highlights: [
        'Real market data from 2025',
        'Account profile matching',
        'Historic market events',
        'Multiple difficulty levels',
        'Goal-first approach'
      ],
      riskLevel: 'Low',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-200'
    }
  ];

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Extreme': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Advanced': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Expert': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleTutorialSelect = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🎓 Trading Tutorials Master Class
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Choose your learning path: Options strategies, futures trading, and professional techniques
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

      {/* Learning Path Overview */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Complete Trading Education Journey
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            From beginner-friendly covered calls to professional futures trading. 
            Each tutorial includes realistic simulations, risk management, and year-long performance analysis.
          </p>
        </div>

        {/* Tutorial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {tutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              className={`${tutorial.bgColor} ${tutorial.borderColor} border-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer`}
              onClick={() => handleTutorialSelect(tutorial.route)}
            >
              <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{tutorial.icon}</div>
                    <div>
                      <h3 className={`text-2xl font-bold ${tutorial.textColor}`}>
                        {tutorial.title}
                      </h3>
                      <p className="text-gray-600 font-medium">
                        {tutorial.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyBadgeColor(tutorial.difficulty)}`}>
                      {tutorial.difficulty}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskBadgeColor(tutorial.riskLevel)}`}>
                      {tutorial.riskLevel} Risk
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {tutorial.description}
                </p>

                {/* Requirements & Duration */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                      Requirements
                    </div>
                    <div className={`font-semibold ${tutorial.textColor}`}>
                      {tutorial.requirements}
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                      Duration
                    </div>
                    <div className={`font-semibold ${tutorial.textColor}`}>
                      {tutorial.duration}
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="mb-6">
                  <h4 className={`font-semibold ${tutorial.textColor} mb-3`}>
                    What You'll Learn:
                  </h4>
                  <ul className="space-y-2">
                    {tutorial.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <span className={`w-1.5 h-1.5 rounded-full ${tutorial.textColor.replace('text-', 'bg-')} mr-3`}></span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTutorialSelect(tutorial.route);
                  }}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${tutorial.textColor.replace('text-', 'bg-').replace('-800', '-600')} text-white hover:${tutorial.textColor.replace('text-', 'bg-').replace('-800', '-700')} shadow-md hover:shadow-lg`}
                >
                  Start {tutorial.title} Tutorial →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Learning Path Progression */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            📚 Recommended Learning Path
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                1
              </div>
              <h4 className="font-semibold text-green-800 mb-2">Start Here</h4>
              <p className="text-sm text-gray-600">NVDA Covered Calls</p>
              <p className="text-xs text-gray-500">Learn options basics</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                2
              </div>
              <h4 className="font-semibold text-purple-800 mb-2">Build Skills</h4>
              <p className="text-sm text-gray-600">Stacking Calls</p>
              <p className="text-xs text-gray-500">Multiple positions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                3
              </div>
              <h4 className="font-semibold text-blue-800 mb-2">Diversify</h4>
              <p className="text-sm text-gray-600">MES Futures</p>
              <p className="text-xs text-gray-500">Technical analysis</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                4
              </div>
              <h4 className="font-semibold text-red-800 mb-2">Master</h4>
              <p className="text-sm text-gray-600">Naked Calls</p>
              <p className="text-xs text-gray-500">Expert level</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ready to Trade Live?
          </h3>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate('/options')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Practice Options Trading
            </button>
            <button
              onClick={() => navigate('/analysis')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Use AI Analysis Tools
            </button>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="bg-gray-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sm text-center text-gray-300">
            <strong>Educational Disclaimer:</strong> All tutorials are for educational purposes only. 
            Trading involves substantial risk of loss. Options and futures trading involves leverage which can amplify both gains and losses. 
            Only trade with money you can afford to lose. Consider consulting a financial advisor before implementing these strategies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorialsPage; 