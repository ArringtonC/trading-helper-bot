import React, { useState, useEffect } from 'react';
import { useGoalSizing } from '../../../../shared/context/GoalSizingContext';
import { GoalAnalyticsDashboard } from './GoalAnalyticsDashboard';
import { FeedbackCollection, FeedbackSummaryDashboard } from './FeedbackCollection';
import { Card } from '../../../../shared/components/ui/Card';
import { Button } from '../../../../shared/components/ui/button';
import { Alert } from '../../../../shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../shared/components/ui/tabs';

interface AnalysisInsight {
  type: 'performance' | 'compliance' | 'opportunity' | 'warning';
  title: string;
  description: string;
  actionRequired: boolean;
  severity: 'low' | 'medium' | 'high';
}

interface PlanVsRealityAnalysisHubProps {
  className?: string;
  defaultTab?: 'analytics' | 'feedback' | 'insights';
  showFeedbackTrigger?: boolean;
}

export const PlanVsRealityAnalysisHub: React.FC<PlanVsRealityAnalysisHubProps> = ({
  className = '',
  defaultTab = 'analytics',
  showFeedbackTrigger = true
}) => {
  const { config, isLoading } = useGoalSizing();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [insights, setInsights] = useState<AnalysisInsight[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Generate insights based on goal performance
  useEffect(() => {
    generateInsights();
  }, [config]);

  const generateInsights = async () => {
    if (!config) return;

    const generatedInsights: AnalysisInsight[] = [];

    // Performance insights
    if (config.goalParameters?.targetReturn) {
      generatedInsights.push({
        type: 'performance',
        title: 'Goal Target Analysis',
        description: `Your target return is set to ${config.goalParameters.targetReturn}%. Monitor your progress regularly to stay on track.`,
        actionRequired: false,
        severity: 'low'
      });
    }

    // Risk management insights
    if (config.sizingRules?.maxPositionSize && config.sizingRules.maxPositionSize > 10) {
      generatedInsights.push({
        type: 'warning',
        title: 'High Position Size Limit',
        description: `Your maximum position size is set to ${config.sizingRules.maxPositionSize}%. Consider reducing this for better risk management.`,
        actionRequired: true,
        severity: 'medium'
      });
    }

    // Capital objective insights
    if (config.capitalObjectiveParameters?.currentBalance) {
      const balance = config.capitalObjectiveParameters.currentBalance;
      if (balance < 10000) {
        generatedInsights.push({
          type: 'opportunity',
          title: 'Account Size Consideration',
          description: 'With a smaller account, focus on percentage gains rather than absolute dollar amounts for better goal tracking.',
          actionRequired: false,
          severity: 'low'
        });
      }
    }

    // Compliance insights based on trade statistics
    if (config.tradeStatistics?.winRate && config.tradeStatistics.winRate > 80) {
      generatedInsights.push({
        type: 'warning',
        title: 'Unrealistic Win Rate Expectation',
        description: `Your expected win rate of ${config.tradeStatistics.winRate}% may be too optimistic. Consider a more conservative target.`,
        actionRequired: true,
        severity: 'high'
      });
    }

    setInsights(generatedInsights);
  };

  const handleFeedbackSubmitted = (feedback: any) => {
    // Handle feedback submission - could trigger re-analysis or insights update
    console.log('Feedback submitted:', feedback);
    
    // Show success message or update insights based on feedback
    if (feedback.type === 'goal_effectiveness' && feedback.rating < 3) {
      setInsights(prev => [...prev, {
        type: 'opportunity',
        title: 'Goal Effectiveness Feedback',
        description: 'Recent feedback suggests your current goals may need adjustment. Consider reviewing your targets.',
        actionRequired: true,
        severity: 'medium'
      }]);
    }
  };

  const renderInsightsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Analysis Insights</h3>
        <Button
          variant="outline"
          onClick={() => generateInsights()}
        >
          Refresh Insights
        </Button>
      </div>

      {insights.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="text-gray-500">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-medium mb-2">No Insights Available</h4>
            <p className="text-sm">
              Complete your goal setup and start trading to see personalized insights.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full text-white text-sm font-bold flex-shrink-0 ${
                  insight.type === 'performance' ? 'bg-blue-500' :
                  insight.type === 'compliance' ? 'bg-green-500' :
                  insight.type === 'opportunity' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {insight.type === 'performance' ? '📈' :
                   insight.type === 'compliance' ? '✅' :
                   insight.type === 'opportunity' ? '💡' : '⚠️'}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{insight.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      insight.severity === 'high' ? 'bg-red-100 text-red-800' :
                      insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {insight.severity}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {insight.description}
                  </p>
                  
                  {insight.actionRequired && (
                    <div className="flex gap-2">
                      <Button variant="outline" className="text-sm">
                        Take Action
                      </Button>
                      <Button variant="outline" className="text-sm">
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Action Items Summary */}
      {insights.filter(i => i.actionRequired).length > 0 && (
        <Alert>
          <div className="font-medium">Action Required</div>
          <div className="text-sm">
            You have {insights.filter(i => i.actionRequired).length} insights that require your attention.
          </div>
        </Alert>
      )}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Goal Performance Analytics</h3>
        {showFeedbackTrigger && (
          <FeedbackCollection
            triggerPoint="manual"
            context={{ section: 'analytics_dashboard' }}
            onFeedbackSubmitted={handleFeedbackSubmitted}
          />
        )}
      </div>
      
      <GoalAnalyticsDashboard showDetailedView={true} />
    </div>
  );

  const renderFeedbackTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Feedback & Continuous Improvement</h3>
        <Button
          variant="outline"
          onClick={() => setShowFeedbackModal(true)}
        >
          Submit New Feedback
        </Button>
      </div>

      <FeedbackSummaryDashboard />

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white">
            <div className="p-6">
              <FeedbackCollection
                triggerPoint="manual"
                context={{ 
                  section: 'feedback_tab',
                  timestamp: new Date().toISOString()
                }}
                onFeedbackSubmitted={(feedback) => {
                  handleFeedbackSubmitted(feedback);
                  setShowFeedbackModal(false);
                }}
              />
              <Button
                variant="outline"
                onClick={() => setShowFeedbackModal(false)}
                className="mt-4 w-full"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-12 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold mb-2">No Goal Configuration Found</h3>
          <p className="text-gray-600 mb-4">
            Create your trading goals using the Goal Sizing Wizard to access plan vs. reality analysis.
          </p>
          <Button>
            Start Goal Setup
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Plan vs. Reality Analysis</h2>
          <p className="text-gray-600">
            Track your goal progress, analyze performance gaps, and collect feedback for continuous improvement.
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
          <TabsTrigger value="insights">Insights & Actions</TabsTrigger>
          <TabsTrigger value="feedback">Feedback System</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          {renderAnalyticsTab()}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {renderInsightsTab()}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          {renderFeedbackTab()}
        </TabsContent>
      </Tabs>

      {/* Auto-triggered feedback collection */}
      <FeedbackCollection
        triggerPoint="dashboard_view"
        context={{ 
          currentTab: activeTab,
          goalType: config?.goalType,
          viewTimestamp: new Date().toISOString()
        }}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />
    </div>
  );
}; 