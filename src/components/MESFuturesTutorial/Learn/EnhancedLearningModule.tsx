import React, { useState } from 'react';
import { LearningPath, TutorialProgress, MESFeatureFlags } from '../types';

interface EnhancedLearningModuleProps {
  userLevel: 'learning' | 'import' | 'broker';
  learningPath: LearningPath;
  progress: TutorialProgress;
  onModuleComplete: (moduleId: string) => void;
  onProgressUpdate: (progress: Partial<TutorialProgress>) => void;
  onAchievementEarned: (achievement: any) => void;
  featureFlags: MESFeatureFlags;
}

const EnhancedLearningModule: React.FC<EnhancedLearningModuleProps> = ({
  userLevel,
  learningPath,
  progress,
  onModuleComplete,
  onProgressUpdate,
  onAchievementEarned,
  featureFlags
}) => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState(0);

  const modules = [
    {
      id: 'fundamentals',
      title: '🏗️ MES Futures Fundamentals',
      description: 'Understanding contract specifications, margin requirements, and basic mechanics',
      lessons: 8,
      estimatedTime: 45,
      status: 'available',
      content: {
        overview: 'MES futures contracts represent $5 times the S&P 500 index value, with minimum price increments of 0.25 index points equal to $1.25 per contract.',
        keyPoints: [
          'Contract size: $5 × S&P 500 Index',
          'Tick size: 0.25 points ($1.25 per tick)',
          'Day trading margin: $40-50 per contract',
          'Overnight margin: $2,455 per contract',
          'Trading hours: Nearly 24/5 (Sunday 5PM - Friday 4PM CT)'
        ]
      }
    },
    {
      id: 'ema-strategy',
      title: '📈 20/50 EMA Strategy Deep Dive',
      description: 'Master the exponential moving average crossover strategy with proven performance metrics',
      lessons: 12,
      estimatedTime: 60,
      status: progress.completedModules.includes('fundamentals') ? 'available' : 'locked',
      content: {
        overview: 'The 20/50 EMA crossover strategy demonstrates a win rate of approximately 52% with annual return potential of 12.3%, though this comes with an 18.5% maximum drawdown.',
        keyPoints: [
          'Buy signal: 20 EMA crosses above 50 EMA',
          'Sell signal: 20 EMA crosses below 50 EMA',
          'Win rate: ~52% with 12.3% annual returns',
          'Sharpe ratios: 0.78-0.82 (favorable risk-adjusted returns)',
          'Volume-weighted EMA reduces lag during high-volume sessions'
        ]
      }
    },
    {
      id: 'risk-management',
      title: '🛡️ Professional Risk Management',
      description: 'Learn professional position sizing, stop-loss placement, and drawdown management',
      lessons: 10,
      estimatedTime: 50,
      status: progress.completedModules.includes('ema-strategy') ? 'available' : 'locked',
      content: {
        overview: 'Professional MES traders employ a 2% risk rule per trade. For a $10,000 account, this translates to maximum risk of $200 per trade, accommodating ~8 MES contracts.',
        keyPoints: [
          '2% risk rule per trade (industry standard)',
          'Position sizing based on account equity and stop distance',
          'Maximum drawdowns: 15-25% for trend-following strategies',
          'Maintain 3-6 months margin requirements in reserve',
          'Overnight exposure limited to 25-50% of day position'
        ]
      }
    },
    {
      id: 'trading-sessions',
      title: '⏰ Market Timing and Sessions',
      description: 'Optimize trading timing across global sessions and market events',
      lessons: 6,
      estimatedTime: 35,
      status: progress.completedModules.includes('risk-management') ? 'available' : 'locked',
      content: {
        overview: 'Regular trading hours (8:30 AM - 3:15 PM CT) capture 45% of daily volume with peak liquidity and optimal EMA signal execution.',
        keyPoints: [
          'Regular hours: 45% of daily volume (optimal for EMA)',
          'Asian session: 15% volume, lower volatility',
          'European session: 25% volume, medium volatility',
          'FOMC announcements create major EMA signals',
          'Pre-market establishes directional bias'
        ]
      }
    },
    {
      id: 'costs-taxes',
      title: '💰 Costs, Taxes & Regulatory Framework',
      description: 'Section 1256 tax advantages, commission structures, and platform selection',
      lessons: 8,
      estimatedTime: 40,
      status: progress.completedModules.includes('trading-sessions') ? 'available' : 'locked',
      content: {
        overview: 'MES futures qualify for favorable Section 1256 tax treatment: 60% long-term, 40% short-term rates regardless of holding period. Max effective rate ~26.8% vs 37% for stocks.',
        keyPoints: [
          'Section 1256: 60/40 tax treatment saves ~$5,400 on $100k gains',
          'Commissions: $0.09 (NinjaTrader) to $2.25 (Schwab) per contract',
          'No PDT rules (unlike stocks)',
          'Mark-to-market accounting benefits',
          'Exemption from wash-sale rules'
        ]
      }
    },
    {
      id: 'platform-selection',
      title: '🖥️ Platform Selection & Technology',
      description: 'Choose optimal trading platforms and implement automation tools',
      lessons: 7,
      estimatedTime: 45,
      status: progress.completedModules.includes('costs-taxes') ? 'available' : 'locked',
      content: {
        overview: 'NinjaTrader leads with $0.09 commissions and excellent automation. TradeStation offers professional tools at $0.35. Interactive Brokers requires $2,000 minimum but provides comprehensive access.',
        keyPoints: [
          'NinjaTrader: Best commissions + automation ($0.09)',
          'TradeStation: Professional tools ($0.35)',
          'Interactive Brokers: $2,000 minimum, comprehensive access',
          'Pine Script, Python backtesting frameworks available',
          'Real-time data critical for 5/8 EMA strategies'
        ]
      }
    },
    {
      id: 'psychology-discipline',
      title: '🧠 Trading Psychology & Discipline',
      description: 'Master the mental game of futures trading and emotional control',
      lessons: 9,
      estimatedTime: 55,
      status: progress.completedModules.includes('platform-selection') ? 'available' : 'locked',
      content: {
        overview: 'Futures psychology differs from stocks due to leverage and 24-hour trading. Overnight positions create additional stress. Professional protocols for risk management and emotional control are essential.',
        keyPoints: [
          'Leverage psychology leads to overconfidence',
          'Overnight positions increase decision stress',
          'Patience required during sideways markets',
          'Discipline to follow signals after losses',
          'Professional protocols for emotional control'
        ]
      }
    },
    {
      id: 'advanced-analysis',
      title: '📊 Advanced Market Analysis',
      description: 'Correlation analysis, seasonality patterns, and performance benchmarks',
      lessons: 11,
      estimatedTime: 65,
      status: progress.completedModules.includes('psychology-discipline') ? 'available' : 'locked',
      content: {
        overview: 'VIX correlation with S&P 500 futures provides context for EMA signals. Professional CTAs achieve 0.8-1.2 Sharpe ratios. Trend-following outperforms in directional markets but underperforms in ranging conditions.',
        keyPoints: [
          'VIX correlation helps time EMA signals',
          'Dollar strength impacts via international exposure',
          'Seasonal patterns enhance strategy timing',
          'Professional CTA benchmarks: 0.8-1.2 Sharpe ratios',
          'Cyclical performance requires long-term perspective'
        ]
      }
    }
  ];

  const handleModuleSelect = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module && module.status !== 'locked') {
      setSelectedModule(moduleId);
      setCurrentLesson(0);
    }
  };

  const handleModuleComplete = (moduleId: string) => {
    onModuleComplete(moduleId);
    setSelectedModule(null);
    
    // Award achievement for module completion
    const moduleTitle = modules.find(m => m.id === moduleId)?.title || 'Module';
    onAchievementEarned({
      id: `${moduleId}-completed`,
      title: `${moduleTitle} Master`,
      description: `Successfully completed ${moduleTitle}`,
      icon: '🎓',
      unlockedAt: new Date(),
      category: 'learning'
    });
  };

  if (selectedModule) {
    const module = modules.find(m => m.id === selectedModule);
    if (!module) return null;

    return (
      <div className="space-y-6">
        {/* Module Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedModule(null)}
              className="text-blue-600 hover:text-blue-700 flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back to Modules</span>
            </button>
            <div className="text-sm text-gray-500">
              Lesson {currentLesson + 1} of {module.lessons}
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{module.title}</h1>
          <p className="text-gray-600 mb-4">{module.description}</p>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentLesson + 1) / module.lessons) * 100}%` }}
            />
          </div>
        </div>

        {/* Module Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-4">Overview</h3>
            <p className="text-gray-700 mb-6">{module.content.overview}</p>
            
            <h3 className="text-xl font-semibold mb-4">Key Learning Points</h3>
            <ul className="space-y-2 mb-6">
              {module.content.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            {/* Interactive Elements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">Interactive Exercise</h4>
              <p className="text-blue-700 text-sm">
                Hands-on practice and real-world examples will be available here once the enhanced tutorial features are fully implemented.
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))}
              disabled={currentLesson === 0}
              className="px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous Lesson
            </button>
            
            <span className="text-sm text-gray-500">
              {currentLesson + 1} / {module.lessons}
            </span>
            
            {currentLesson + 1 === module.lessons ? (
              <button
                onClick={() => handleModuleComplete(selectedModule)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Module
              </button>
            ) : (
              <button
                onClick={() => setCurrentLesson(Math.min(module.lessons - 1, currentLesson + 1))}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next Lesson
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Learning Path Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{learningPath.name}</h1>
            <p className="text-gray-600 mt-1">{learningPath.description}</p>
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              <span>⏱️ {learningPath.estimatedDuration} hours total</span>
              <span>📊 {userLevel} level</span>
              <span>🎯 {progress.completedModules.length}/{learningPath.modules.length} modules completed</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{progress.overallProgress}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {modules.map((module, index) => {
          const isCompleted = progress.completedModules.includes(module.id);
          const isAvailable = module.status === 'available';
          const isLocked = module.status === 'locked';

          return (
            <div
              key={module.id}
              className={`bg-white rounded-lg shadow p-6 border-2 transition-all cursor-pointer ${
                isCompleted
                  ? 'border-green-500 bg-green-50'
                  : isAvailable
                  ? 'border-blue-500 bg-blue-50 hover:shadow-md'
                  : 'border-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
              onClick={() => handleModuleSelect(module.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{module.title}</h3>
                <div className="flex items-center space-x-2">
                  {isCompleted && <span className="text-green-600">✅</span>}
                  {isAvailable && !isCompleted && <span className="text-blue-600">▶️</span>}
                  {isLocked && <span className="text-gray-400">🔒</span>}
                </div>
              </div>

              <p className="text-gray-600 mb-4">{module.description}</p>

              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>📚 {module.lessons} lessons</span>
                <span>⏱️ ~{module.estimatedTime} min</span>
              </div>

              <div className={`text-sm p-3 rounded-lg ${
                isCompleted ? 'bg-green-100 text-green-800' :
                isAvailable ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {module.content.overview.substring(0, 120)}...
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Features Coming Soon */}
      {featureFlags.psychologyAssessment && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">
            🧠 Trading Psychology Assessment
          </h3>
          <p className="text-purple-600">
            Advanced psychological profiling to identify cognitive biases, risk tolerance patterns, and personalized discipline strategies based on your trading behavior.
          </p>
        </div>
      )}

      {featureFlags.monteCarloSimulation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            🎲 Monte Carlo Risk Analysis
          </h3>
          <p className="text-green-600">
            Run thousands of simulations to understand probability distributions of returns, maximum drawdowns, and optimal position sizing for your risk tolerance.
          </p>
        </div>
      )}

      {/* Study Materials */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📖 Additional Resources</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <a
            href="#"
            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">📊</span>
            <div>
              <h4 className="font-medium text-gray-800">Complete MES Specifications</h4>
              <p className="text-sm text-gray-600">Margin requirements, commission comparisons, tax benefits</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">📈</span>
            <div>
              <h4 className="font-medium text-gray-800">Performance Analytics</h4>
              <p className="text-sm text-gray-600">Sharpe ratios, drawdown analysis, benchmark comparisons</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">🎥</span>
            <div>
              <h4 className="font-medium text-gray-800">Platform Tutorials</h4>
              <p className="text-sm text-gray-600">NinjaTrader, TradeStation, Pine Script automation</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">🧠</span>
            <div>
              <h4 className="font-medium text-gray-800">Psychology Guide</h4>
              <p className="text-sm text-gray-600">Emotional control, discipline protocols, bias recognition</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLearningModule; 