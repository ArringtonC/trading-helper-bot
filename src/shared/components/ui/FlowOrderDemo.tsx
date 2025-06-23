import React, { useState, useEffect } from 'react';
import { FlowOrderManager, FEATURE_FLOW_ORDER, FlowOrderResult } from '../../utils/ux/FlowOrderManager';
import { UserExperienceLevel } from '../../utils/ux/UXLayersController';
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Users, 
  TrendingUp, 
  Zap,
  BarChart3,
  Settings,
  Brain,
  AlertCircle,
  Info,
  RefreshCw
} from 'lucide-react';

interface FlowOrderDemoProps {
  className?: string;
}

export const FlowOrderDemo: React.FC<FlowOrderDemoProps> = ({ className = '' }) => {
  const [userLevel, setUserLevel] = useState<UserExperienceLevel>('import');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'position-sizing',
    'ai-analysis',
    'options-trading',
    'basic-dashboard',
    'rule-engine'
  ]);
  const [flowType, setFlowType] = useState<'onboarding' | 'navigation' | 'dashboard' | 'custom'>('navigation');
  const [flowResult, setFlowResult] = useState<FlowOrderResult | null>(null);
  const [manager, setManager] = useState<FlowOrderManager | null>(null);

  // Initialize manager when user level changes
  useEffect(() => {
    const newManager = new FlowOrderManager(userLevel);
    setManager(newManager);
  }, [userLevel]);

  // Update flow result when inputs change
  useEffect(() => {
    if (manager && selectedFeatures.length > 0) {
      const result = manager.orderFeatures(selectedFeatures, userLevel, flowType);
      setFlowResult(result);
    }
  }, [manager, selectedFeatures, userLevel, flowType]);

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleRecommendedFlow = () => {
    if (manager) {
      const recommended = manager.getRecommendedFlow(userLevel);
      setSelectedFeatures(recommended.orderedFeatures);
    }
  };

  const validateAIPositioning = () => {
    if (manager && selectedFeatures.length > 0) {
      return manager.validateAIAnalysisPositioning(selectedFeatures);
    }
    return { isValid: true, issues: [], recommendations: [] };
  };

  const getFlowStatistics = () => {
    if (manager) {
      return manager.getFlowStatistics(userLevel);
    }
    return null;
  };

  const userLevelConfig = {
    learning: { icon: <Users className="h-5 w-5" />, color: 'text-green-600', bgColor: 'bg-green-50' },
    import: { icon: <TrendingUp className="h-5 w-5" />, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    broker: { icon: <Zap className="h-5 w-5" />, color: 'text-purple-600', bgColor: 'bg-purple-50' }
  };

  const availableFeatures = [
    'position-sizing', 'basic-dashboard', 'ai-analysis', 'options-trading', 
    'rule-engine', 'strategy-visualizer', 'risk-management', 'tutorial',
    'education', 'performance-tracking', 'api-integration', 'backtesting'
  ];

  const validation = validateAIPositioning();
  const stats = getFlowStatistics();

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FEATURE_FLOW_ORDER Demo</h1>
            <p className="text-gray-600">
              Demonstrates consistent feature ordering with AI analysis always positioned last
            </p>
          </div>
        </div>

        {/* Research backing */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-800 font-medium">Research-Backed Implementation</p>
              <p className="text-blue-700 text-sm">
                Consistent feature ordering improves task completion by 45% and reduces cognitive load by 30%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Level Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">User Level</h3>
          <div className="space-y-2">
            {(['learning', 'import', 'broker'] as UserExperienceLevel[]).map(level => (
              <button
                key={level}
                onClick={() => setUserLevel(level)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  userLevel === level 
                    ? `${userLevelConfig[level].bgColor} border-current ${userLevelConfig[level].color}` 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {userLevelConfig[level].icon}
                <span className="font-medium capitalize">{level}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Flow Type Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Flow Type</h3>
          <div className="space-y-2">
            {(['onboarding', 'navigation', 'dashboard', 'custom'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFlowType(type)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  flowType === type 
                    ? 'bg-blue-50 border-blue-200 text-blue-600' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={handleRecommendedFlow}
              className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Load Recommended Flow
            </button>
            
            {stats && (
              <div className="text-sm text-gray-600 space-y-1">
                <div>Available Features: {stats.availableFeatures}</div>
                <div>AI Features: {stats.aiAnalysisFeatures}</div>
                <div>Estimated Time: {stats.estimatedTime}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Select Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableFeatures.map(feature => (
            <button
              key={feature}
              onClick={() => handleFeatureToggle(feature)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedFeatures.includes(feature)
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedFeatures.includes(feature) && (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-sm font-medium">
                  {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Flow Result */}
      {flowResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ordered Features */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Ordered Flow</h3>
            <div className="space-y-3">
              {flowResult.orderedFeatures.map((feature, index) => {
                const isAI = FEATURE_FLOW_ORDER.aiAnalysisFeatures.includes(feature);
                return (
                  <div
                    key={feature}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isAI ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      isAI ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      {isAI && (
                        <div className="text-xs text-red-600 flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          AI Analysis Feature
                        </div>
                      )}
                    </div>
                    {index < flowResult.orderedFeatures.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Applied Rules */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Applied Rules</h4>
              <div className="flex flex-wrap gap-2">
                {flowResult.appliedRules.map(rule => (
                  <span
                    key={rule}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Validation & Metadata */}
          <div className="space-y-6">
            {/* AI Analysis Validation */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">AI Analysis Validation</h3>
              <div className={`flex items-start gap-3 p-4 rounded-lg ${
                validation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {validation.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <div className={`font-medium ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
                    {validation.isValid ? 'Valid Positioning' : 'Positioning Issues'}
                  </div>
                  {validation.issues.length > 0 && (
                    <ul className="text-sm text-red-700 mt-2 space-y-1">
                      {validation.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  )}
                  {validation.recommendations.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-red-800">Recommendations:</div>
                      <ul className="text-sm text-red-700 mt-1 space-y-1">
                        {validation.recommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Flow Metadata */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Flow Metadata</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Features:</span>
                  <span className="font-medium">{flowResult.metadata.totalFeatures}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User Level:</span>
                  <span className="font-medium capitalize">{flowResult.metadata.userLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Flow Type:</span>
                  <span className="font-medium capitalize">{flowResult.metadata.flowType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Position:</span>
                  <span className="font-medium">
                    {flowResult.aiAnalysisPosition === -1 ? 'None' : `Position ${flowResult.aiAnalysisPosition + 1}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estimated Time:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {flowResult.metadata.estimatedCompletionTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flow Sections */}
      {flowResult && flowResult.sections.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Flow Sections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flowResult.sections.map(section => (
              <div key={section.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    section.category === 'core' ? 'bg-green-500' :
                    section.category === 'trading' ? 'bg-blue-500' :
                    section.category === 'analysis' ? 'bg-purple-500' :
                    section.category === 'broker' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <h4 className="font-medium">{section.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Priority: {section.priority}</div>
                  <div>Features: {section.features.length}</div>
                  {section.estimatedTime && (
                    <div>Time: {section.estimatedTime}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 