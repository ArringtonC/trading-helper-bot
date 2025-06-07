import React from 'react';
import { UserProfile, MESFeatureFlags, UserPreferences, LearningPath } from '../types';

interface MESSettingsProps {
  userProfile: UserProfile;
  featureFlags: MESFeatureFlags;
  onUserProfileUpdate: (updates: Partial<UserProfile>) => void;
  onPreferencesUpdate: (preferences: Partial<UserPreferences>) => void;
  onLearningPathChange: (path: LearningPath) => void;
  onResetState: () => void;
}

const MESSettings: React.FC<MESSettingsProps> = ({
  userProfile,
  featureFlags,
  onUserProfileUpdate,
  onPreferencesUpdate,
  onLearningPathChange,
  onResetState
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          ⚙️ Tutorial Settings
        </h2>
        
        <div className="space-y-6">
          {/* User Profile Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">👤 Profile Settings</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => onUserProfileUpdate({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={userProfile.experienceLevel}
                  onChange={(e) => onUserProfileUpdate({ 
                    experienceLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced' 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Learning Preferences */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">🧠 Learning Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Style
                </label>
                <select
                  value={userProfile.preferences.learningStyle}
                  onChange={(e) => onPreferencesUpdate({ 
                    learningStyle: e.target.value as 'visual' | 'auditory' | 'kinesthetic' | 'mixed' 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="visual">Visual (Charts, Diagrams)</option>
                  <option value="auditory">Auditory (Videos, Audio)</option>
                  <option value="kinesthetic">Hands-on (Interactive)</option>
                  <option value="mixed">Mixed Approach</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={userProfile.preferences.difficultyAdaptation.autoAdjust}
                    onChange={(e) => onPreferencesUpdate({
                      difficultyAdaptation: {
                        ...userProfile.preferences.difficultyAdaptation,
                        autoAdjust: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Automatically adjust difficulty based on performance</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={userProfile.preferences.difficultyAdaptation.extraPractice}
                    onChange={(e) => onPreferencesUpdate({
                      difficultyAdaptation: {
                        ...userProfile.preferences.difficultyAdaptation,
                        extraPractice: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Provide extra practice for challenging concepts</span>
                </label>
              </div>
            </div>
          </div>

          {/* Risk Management Preferences */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">🛡️ Risk Management</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Tolerance Level
                </label>
                <select
                  value={userProfile.preferences.riskTolerance.level}
                  onChange={(e) => onPreferencesUpdate({
                    riskTolerance: {
                      ...userProfile.preferences.riskTolerance,
                      level: e.target.value as 'conservative' | 'moderate' | 'aggressive'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Position Size (%)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={userProfile.preferences.riskTolerance.maxPositionSize}
                  onChange={(e) => onPreferencesUpdate({
                    riskTolerance: {
                      ...userProfile.preferences.riskTolerance,
                      maxPositionSize: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">🔧 Feature Settings</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">Current feature status:</p>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Enhanced Tutorial:</span>
                  <span className={featureFlags.enhancedTutorial ? 'text-green-600' : 'text-red-600'}>
                    {featureFlags.enhancedTutorial ? '✅ Enabled' : '❌ Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Real-time Data:</span>
                  <span className={featureFlags.realTimeData ? 'text-green-600' : 'text-red-600'}>
                    {featureFlags.realTimeData ? '✅ Enabled' : '❌ Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Community Features:</span>
                  <span className={featureFlags.communityFeatures ? 'text-green-600' : 'text-red-600'}>
                    {featureFlags.communityFeatures ? '✅ Enabled' : '❌ Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Advanced Analytics:</span>
                  <span className={featureFlags.advancedAnalytics ? 'text-green-600' : 'text-red-600'}>
                    {featureFlags.advancedAnalytics ? '✅ Enabled' : '❌ Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Options */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">🔄 Reset Options</h3>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all tutorial progress? This cannot be undone.')) {
                  onResetState();
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reset All Progress
            </button>
            <p className="text-sm text-gray-500 mt-2">
              This will reset all learning progress, virtual portfolio, and achievements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MESSettings; 