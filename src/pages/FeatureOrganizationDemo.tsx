import React, { useState } from 'react';
import { FeatureOrganizationDashboard } from '../components/ui/FeatureOrganizationDashboard';
import { UserExperienceLevel } from '../utils/ux/UXLayersController';
import { ArrowLeft, Users, TrendingUp, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FeatureOrganizationDemo: React.FC = () => {
  const navigate = useNavigate();
  const [selectedUserLevel, setSelectedUserLevel] = useState<UserExperienceLevel>('learning');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const mockUserLevels = {
    learning: {
      icon: <span>🌱</span>,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'New to trading, focused on learning fundamentals',
      initialProgress: {
        tradesCompleted: 5,
        accountSize: 5000,
        timeSpent: 120,
        featuresUsed: []
      }
    },
    import: {
      icon: <span>📊</span>,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Some trading experience, ready for data analysis tools',
      initialProgress: {
        tradesCompleted: 25,
        accountSize: 15000,
        timeSpent: 480,
        featuresUsed: ['position-sizing', 'basic-dashboard']
      }
    },
    broker: {
      icon: <span>🔗</span>,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Experienced trader, needs advanced integrations',
      initialProgress: {
        tradesCompleted: 100,
        accountSize: 50000,
        timeSpent: 1200,
        featuresUsed: ['position-sizing', 'analytics', 'rule-engine', 'api-integration']
      }
    }
  };

  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeature(featureId);
    console.log(`Feature selected: ${featureId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                FEATURE_ORGANIZATION Demo
              </h1>
              <p className="text-gray-600">
                Progressive disclosure system with research-backed unlock criteria
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* User Level Selector */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Select User Experience Level
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(mockUserLevels).map(([level, config]) => (
              <button
                key={level}
                onClick={() => setSelectedUserLevel(level as UserExperienceLevel)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedUserLevel === level
                    ? config.bgColor
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={config.color}>{config.icon}</span>
                  <h3 className="font-semibold capitalize">{level}</h3>
                  {selectedUserLevel === level && (
                    <span className="ml-auto text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{config.description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <div>Trades: {config.initialProgress.tradesCompleted}</div>
                  <div>Account: ${config.initialProgress.accountSize.toLocaleString()}</div>
                  <div>Time: {Math.floor(config.initialProgress.timeSpent / 60)}h {config.initialProgress.timeSpent % 60}m</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Organization Dashboard */}
        <FeatureOrganizationDashboard
          userLevel={selectedUserLevel}
          initialProgress={mockUserLevels[selectedUserLevel].initialProgress}
          onFeatureSelect={handleFeatureSelect}
        />

        {/* Selected Feature Info */}
        {selectedFeature && (
          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Selected Feature: {selectedFeature.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </h3>
            <p className="text-gray-600">
              This feature has been marked as used and will contribute to unlocking higher-tier features.
              In a real application, this would navigate to the actual feature page.
            </p>
          </div>
        )}

        {/* Implementation Details */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Implementation Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Core Features (Always Visible)</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Basic Calculator</li>
                <li>• Risk Assessment</li>
                <li>• Account Validation</li>
                <li>• Basic Dashboard</li>
                <li>• Tutorial & Assessment</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Intermediate Features (Unlock Criteria)</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• 10+ trades completed</li>
                <li>• Account verified</li>
                <li>• 2+ hours app usage</li>
                <li>• Risk assessment completed</li>
                <li>• Educational modules completed</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Advanced Features (Unlock Criteria)</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• 50+ trades completed</li>
                <li>• 40%+ win rate</li>
                <li>• $10,000+ account size</li>
                <li>• 10+ hours app usage</li>
                <li>• Key features used</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Research Benefits</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• 60% task completion improvement</li>
                <li>• 40% cognitive load reduction</li>
                <li>• Clear progression paths</li>
                <li>• Reduced feature overwhelm</li>
                <li>• Better user retention</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Implementation */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Technical Implementation
          </h3>
          <div className="text-sm text-gray-600 space-y-3">
            <div>
              <h4 className="font-medium text-gray-700">FeatureOrganizationController</h4>
              <p>Manages the FEATURE_ORGANIZATION system with progressive disclosure logic, unlock criteria validation, and user progress tracking.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Integration with Existing Systems</h4>
              <p>Works alongside FeatureVisibilityController and UXLayersController to provide a comprehensive progressive disclosure experience.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Unlock Criteria Engine</h4>
              <p>Evaluates multiple criteria (trades, account size, time spent, features used) to determine feature tier access with real-time progress tracking.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureOrganizationDemo; 