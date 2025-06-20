import React from 'react';
import { UserProfile, VirtualPortfolio, TutorialProgress, Achievement } from '../types';

interface MESUserDashboardProps {
  userProfile: UserProfile;
  virtualPortfolio: VirtualPortfolio;
  learningProgress: TutorialProgress;
  achievements: Achievement[];
  onTabChange: (tab: 'dashboard' | 'learn' | 'practice' | 'community' | 'settings' | 'analysis') => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

const MESUserDashboard: React.FC<MESUserDashboardProps> = ({
  userProfile,
  virtualPortfolio,
  learningProgress,
  achievements,
  onTabChange,
  onUpdateProfile
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {userProfile.name}! 👋</h1>
            <p className="text-blue-100">Continue your MES futures trading journey</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Progress</div>
            <div className="text-2xl font-bold">{learningProgress.overallProgress}%</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm text-blue-100 mb-1">
            <span>Current Path: {learningProgress.currentPath}</span>
            <span>Next Milestone: {learningProgress.nextMilestone}</span>
          </div>
          <div className="w-full bg-blue-500 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${learningProgress.overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="grid md:grid-cols-4 gap-4">
        <button
          onClick={() => onTabChange('learn')}
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left"
        >
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-semibold text-gray-800">Continue Learning</h3>
          <p className="text-sm text-gray-600">Resume your current lesson</p>
        </button>

        <button
          onClick={() => onTabChange('practice')}
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left"
        >
          <div className="text-2xl mb-2">💹</div>
          <h3 className="font-semibold text-gray-800">Practice Trading</h3>
          <p className="text-sm text-gray-600">Test your skills safely</p>
        </button>

        <button
          onClick={() => onTabChange('analysis')}
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left"
        >
          <div className="text-2xl mb-2">📈</div>
          <h3 className="font-semibold text-gray-800">View Analytics</h3>
          <p className="text-sm text-gray-600">Review your performance</p>
        </button>

        <button
          onClick={() => onTabChange('community')}
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-semibold text-gray-800">Join Community</h3>
          <p className="text-sm text-gray-600">Connect with other traders</p>
        </button>
      </div>

      {/* Virtual Portfolio Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">📊 Virtual Portfolio</h2>
          <button
            onClick={() => onTabChange('practice')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Details →
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {formatCurrency(virtualPortfolio.balance)}
            </div>
            <div className="text-sm text-gray-600">Current Balance</div>
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold ${
              virtualPortfolio.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(virtualPortfolio.totalReturn)}
            </div>
            <div className="text-sm text-gray-600">Total Return</div>
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold ${
              virtualPortfolio.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(virtualPortfolio.totalReturnPercent)}
            </div>
            <div className="text-sm text-gray-600">Return %</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {virtualPortfolio.performance.totalTrades}
            </div>
            <div className="text-sm text-gray-600">Total Trades</div>
          </div>
        </div>

        {virtualPortfolio.performance.totalTrades > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Win Rate:</span>
                <span className="font-semibold">{virtualPortfolio.performance.winRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profit Factor:</span>
                <span className="font-semibold">{virtualPortfolio.performance.profitFactor.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Achievements Panel */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">🏆 Recent Achievements</h2>
          <span className="text-sm text-gray-600">{achievements.length} earned</span>
        </div>

        {achievements.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.slice(-6).map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <h4 className="font-medium text-gray-800">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎯</div>
            <p>Complete lessons and practice trading to earn achievements!</p>
          </div>
        )}
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📱 Recent Activity</h2>
        
        <div className="space-y-3">
          {/* Placeholder activity items */}
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Started learning module: {learningProgress.currentPath}</span>
            <span className="text-gray-400">2 hours ago</span>
          </div>
          
          {virtualPortfolio.tradeHistory.length > 0 && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">
                Completed practice trade: {virtualPortfolio.tradeHistory[virtualPortfolio.tradeHistory.length - 1]?.realizedPL >= 0 ? 'Profit' : 'Loss'}
              </span>
              <span className="text-gray-400">Yesterday</span>
            </div>
          )}
          
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">Joined MES futures tutorial</span>
            <span className="text-gray-400">{new Date(userProfile.joinDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MESUserDashboard; 