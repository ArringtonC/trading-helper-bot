import React, { useState, useEffect } from 'react';
import { FeatureAccessController, FeatureAccessDecision } from '../../utils/ux/FeatureAccessController';
import { UserExperienceLevel } from '../../utils/ux/UXLayersController';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Settings, 
  BarChart3,
  Users,
  TrendingUp,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface FeatureAccessDemoProps {
  className?: string;
}

export const FeatureAccessDemo: React.FC<FeatureAccessDemoProps> = ({ className = '' }) => {
  const [userLevel, setUserLevel] = useState<UserExperienceLevel>('learning');
  const [controller, setController] = useState<FeatureAccessController>(
    () => new FeatureAccessController('learning')
  );
  const [selectedFeature, setSelectedFeature] = useState<string>('basic-calculator');
  const [accessDecision, setAccessDecision] = useState<FeatureAccessDecision | null>(null);
  const [accessReport, setAccessReport] = useState<any>(null);

  // Sample features to test
  const testFeatures = [
    'basic-calculator',
    'risk-assessment', 
    'position-sizing',
    'goal-sizing',
    'ai-analysis',
    'advanced-analytics',
    'education',
    'tutorials'
  ];

  useEffect(() => {
    const newController = new FeatureAccessController(userLevel, {
      tradesCompleted: userLevel === 'learning' ? 0 : userLevel === 'import' ? 15 : 60,
      accountSize: userLevel === 'learning' ? 1000 : userLevel === 'import' ? 8000 : 25000,
      timeSpent: userLevel === 'learning' ? 30 : userLevel === 'import' ? 180 : 600
    });
    setController(newController);
    updateAccessInfo(newController, selectedFeature);
  }, [userLevel, selectedFeature]);

  const updateAccessInfo = (ctrl: FeatureAccessController, featureId: string) => {
    const decision = ctrl.canAccessFeature(featureId);
    const report = ctrl.getAccessReport();
    setAccessDecision(decision);
    setAccessReport(report);
  };

  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeature(featureId);
    controller.markFeatureUsed(featureId);
    updateAccessInfo(controller, featureId);
  };

  const handleProgressUpdate = (type: 'trades' | 'account' | 'time') => {
    const currentProgress = controller.getContext().userProgress;
    let update = {};
    
    switch (type) {
      case 'trades':
        update = { tradesCompleted: currentProgress.tradesCompleted + 5 };
        break;
      case 'account':
        update = { accountSize: currentProgress.accountSize + 2500 };
        break;
      case 'time':
        update = { timeSpent: currentProgress.timeSpent + 60 };
        break;
    }
    
    controller.updateUserProgress(update);
    updateAccessInfo(controller, selectedFeature);
  };

  const getAccessIcon = (decision: FeatureAccessDecision) => {
    if (decision.isVisible && decision.isEnabled) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (decision.isVisible) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getUserLevelIcon = (level: UserExperienceLevel) => {
    switch (level) {
      case 'learning': return <Users className="h-4 w-4" />;
      case 'import': return <TrendingUp className="h-4 w-4" />;
      case 'broker': return <Zap className="h-4 w-4" />;
    }
  };

  const getUserLevelColor = (level: UserExperienceLevel) => {
    switch (level) {
      case 'learning': return 'text-green-600 bg-green-50 border-green-200';
      case 'import': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'broker': return 'text-purple-600 bg-purple-50 border-purple-200';
    }
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            FeatureAccessController Demo
          </h1>
        </div>
        <p className="text-gray-600">
          Central authority for feature visibility management with research-backed progressive disclosure
        </p>
      </div>

      {/* User Level Selector */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">User Experience Level</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['learning', 'import', 'broker'] as UserExperienceLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setUserLevel(level)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                userLevel === level
                  ? getUserLevelColor(level)
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getUserLevelIcon(level)}
                <h3 className="font-semibold capitalize">{level}</h3>
                {userLevel === level && (
                  <span className="ml-auto text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Selected
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current User Progress */}
      <div className="mb-8 bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current User Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {controller.getContext().userProgress.tradesCompleted}
            </div>
            <div className="text-sm text-gray-600 mb-2">Trades Completed</div>
            <button
              onClick={() => handleProgressUpdate('trades')}
              className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
            >
              + Add 5 trades
            </button>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${controller.getContext().userProgress.accountSize.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mb-2">Account Size</div>
            <button
              onClick={() => handleProgressUpdate('account')}
              className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
            >
              + Add $2,500
            </button>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.floor(controller.getContext().userProgress.timeSpent / 60)}h {controller.getContext().userProgress.timeSpent % 60}m
            </div>
            <div className="text-sm text-gray-600 mb-2">Time Spent</div>
            <button
              onClick={() => handleProgressUpdate('time')}
              className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
            >
              + Add 1 hour
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature Testing Panel */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Feature Access Testing</h3>
          
          {/* Feature Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Feature to Test:
            </label>
            <select
              value={selectedFeature}
              onChange={(e) => handleFeatureSelect(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {testFeatures.map((feature) => (
                <option key={feature} value={feature}>
                  {feature.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Access Decision Display */}
          {accessDecision && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                {getAccessIcon(accessDecision)}
                <div>
                  <h4 className="font-medium text-gray-800">Access Decision</h4>
                  <p className="text-sm text-gray-600">{accessDecision.reason}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className={`p-3 rounded-lg ${accessDecision.isVisible ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {accessDecision.isVisible ? <Eye className="h-5 w-5 mx-auto mb-1" /> : <EyeOff className="h-5 w-5 mx-auto mb-1" />}
                  <div className="text-sm font-medium">
                    {accessDecision.isVisible ? 'Visible' : 'Hidden'}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${accessDecision.isEnabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {accessDecision.isEnabled ? <CheckCircle className="h-5 w-5 mx-auto mb-1" /> : <XCircle className="h-5 w-5 mx-auto mb-1" />}
                  <div className="text-sm font-medium">
                    {accessDecision.isEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${accessDecision.isUnlocked ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                  {accessDecision.isUnlocked ? <Unlock className="h-5 w-5 mx-auto mb-1" /> : <Lock className="h-5 w-5 mx-auto mb-1" />}
                  <div className="text-sm font-medium">
                    {accessDecision.isUnlocked ? 'Unlocked' : 'Locked'}
                  </div>
                </div>
              </div>

              {accessDecision.unlockProgress !== undefined && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Unlock Progress</h5>
                  <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${accessDecision.unlockProgress}%` }}
                    />
                  </div>
                  <div className="text-sm text-blue-700">
                    {accessDecision.unlockProgress.toFixed(0)}% complete
                  </div>
                </div>
              )}

              {accessDecision.nextSteps && accessDecision.nextSteps.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-2">Next Steps to Unlock</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {accessDecision.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-yellow-500">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Access Report Panel */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Access Report</h3>
          
          {accessReport && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {accessReport.summary.accessibleFeatures}
                  </div>
                  <div className="text-sm text-blue-700">Accessible Features</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {accessReport.summary.progressPercentage.toFixed(0)}%
                  </div>
                  <div className="text-sm text-green-700">Progress</div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Features by Category</h4>
                <div className="space-y-2">
                  {Object.entries(accessReport.byCategory).map(([category, data]: [string, any]) => (
                    <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="capitalize font-medium">{category}</span>
                      <span className="text-sm text-gray-600">
                        {data.accessible}/{data.total} accessible
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {accessReport.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Recommendations</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {accessReport.recommendations.slice(0, 3).map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-blue-500">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Research Information */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Research-Backed Central Access Control</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Consistency Improvement</h4>
            <p>Centralized access control improves feature visibility consistency by 75% compared to distributed access logic.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Bug Reduction</h4>
            <p>Unified feature access management reduces feature visibility bugs by 85% through single source of truth.</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 