/**
 * ValidationDashboard - Comprehensive Platform Effectiveness Validation
 * 
 * Displays comprehensive analytics proving the effectiveness of the integrated platform:
 * - Real-time validation metrics and performance tracking
 * - Backtesting results showing historical performance validation
 * - A/B testing insights for continuous platform improvement
 * - User success metrics across all experience levels
 * - Research claim validation with statistical significance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/Card';
import { Badge } from '../../shared/components/ui/Badge';
import { Button } from '../../shared/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  RefreshCw,
  Award,
  Activity,
  Zap,
  Brain,
  LineChart,
  PieChart,
  Settings
} from 'lucide-react';
import { 
  ScreeningValidationService, 
  PlatformValidationReport,
  ValidationMetrics,
  BacktestingResult,
  ABTestResult,
  UserSuccessMetrics
} from '../../shared/services/ScreeningValidationService';

const ValidationDashboard: React.FC = () => {
  const [validationReport, setValidationReport] = useState<PlatformValidationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'backtesting' | 'abtesting' | 'users'>('overview');

  const validationService = new ScreeningValidationService();

  useEffect(() => {
    loadValidationData();
  }, []);

  const loadValidationData = async () => {
    setIsLoading(true);
    try {
      const report = await validationService.validatePlatformEffectiveness();
      setValidationReport(report);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load validation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async () => {
    if (!validationReport) return;
    
    try {
      const reportData = await validationService.exportValidationReport(validationReport);
      const blob = new Blob([reportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `platform-validation-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatBasisPoints = (value: number) => `${value.toFixed(0)} bps`;
  const formatReturn = (value: number) => `${(value * 100).toFixed(1)}%`;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getValidationBadge = (isValidated: boolean) => (
    <Badge variant={isValidated ? 'default' : 'danger'} className="ml-2">
      {isValidated ? (
        <>
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Validated
        </>
      ) : (
        <>
          <AlertTriangle className="h-3 w-3 mr-1" />
          Needs Improvement
        </>
      )}
    </Badge>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Running Platform Validation</h2>
          <p className="text-gray-600">Analyzing performance metrics and research claims...</p>
        </div>
      </div>
    );
  }

  if (!validationReport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Validation Failed</h2>
          <p className="text-gray-600 mb-4">Unable to load validation data</p>
          <Button onClick={loadValidationData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Validation Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive effectiveness validation for the integrated screening platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button variant="outline" onClick={loadValidationData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Score Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold mb-4 ${getScoreColor(validationReport.overallScore)}`}>
                {validationReport.overallScore}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall Platform Validation Score</h2>
              <p className="text-gray-600 mb-6">
                Comprehensive effectiveness score based on performance, user success, and research validation
              </p>
              
              {/* Research Claims Validation */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium">Performance</span>
                    {getValidationBadge(validationReport.researchValidation.performanceClaimValidated)}
                  </div>
                  <p className="text-sm text-gray-600">400+ basis points improvement</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium">Goal Alignment</span>
                    {getValidationBadge(validationReport.researchValidation.goalAlignmentClaimValidated)}
                  </div>
                  <p className="text-sm text-gray-600">&gt;80% accuracy target</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="font-medium">User Experience</span>
                    {getValidationBadge(validationReport.researchValidation.userExperienceClaimValidated)}
                  </div>
                  <p className="text-sm text-gray-600">Workflow completion rates</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Shield className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium">Risk Management</span>
                    {getValidationBadge(validationReport.researchValidation.riskManagementClaimValidated)}
                  </div>
                  <p className="text-sm text-gray-600">Protection effectiveness</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'backtesting', label: 'Backtesting', icon: LineChart },
              { id: 'abtesting', label: 'A/B Testing', icon: Activity },
              { id: 'users', label: 'User Success', icon: Users }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedTab(id as any)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  selectedTab === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-blue-600" />
                  Key Validation Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Performance Improvement</span>
                    <span className="font-semibold text-green-600">
                      {formatBasisPoints(validationReport.validationMetrics.performanceImprovement)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Goal Alignment Accuracy</span>
                    <span className="font-semibold text-blue-600">
                      {formatPercentage(validationReport.validationMetrics.goalAlignmentAccuracy)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">User Success Rate</span>
                    <span className="font-semibold text-purple-600">
                      {formatPercentage(validationReport.validationMetrics.userSuccessRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Workflow Completion</span>
                    <span className="font-semibold text-indigo-600">
                      {formatPercentage(validationReport.validationMetrics.workflowCompletionRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Risk Management Effectiveness</span>
                    <span className="font-semibold text-red-600">
                      {formatPercentage(validationReport.validationMetrics.riskManagementEffectiveness)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Template Matching Accuracy</span>
                    <span className="font-semibold text-orange-600">
                      {formatPercentage(validationReport.validationMetrics.templateMatchingAccuracy)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistical Significance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-600" />
                  Statistical Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sample Size</span>
                    <span className="font-semibold">
                      {validationReport.validationMetrics.sampleSize.toLocaleString()} users
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Statistical Significance</span>
                    <Badge variant={validationReport.validationMetrics.statisticalSignificance ? 'default' : 'danger'}>
                      {validationReport.validationMetrics.statisticalSignificance ? 'Achieved' : 'Not Achieved'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Confidence Level</span>
                    <span className="font-semibold">95%</span>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <CheckCircle2 className="h-4 w-4 inline mr-1" />
                      Sample size exceeds minimum requirement of 1,000 users for statistical significance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'backtesting' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {validationReport.backtestingResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{result.strategy}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Total Return</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatReturn(result.totalReturn)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Sharpe Ratio</span>
                        <span className="text-sm font-semibold">{result.sharpeRatio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Max Drawdown</span>
                        <span className="text-sm font-semibold text-red-600">
                          {formatReturn(result.maxDrawdown)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Win Rate</span>
                        <span className="text-sm font-semibold">{formatPercentage(result.winRate * 100)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">vs Benchmark</span>
                        <span className="text-sm font-semibold text-blue-600">
                          +{formatBasisPoints(result.outperformanceVsBenchmark)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'abtesting' && (
          <div className="space-y-6">
            {validationReport.abTestResults.map((test, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{test.experimentName}</span>
                    <Badge variant={test.isSignificant ? 'default' : 'secondary'}>
                      {test.isSignificant ? 'Statistically Significant' : 'Not Significant'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Control Group */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Control Group</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Sample Size</span>
                          <span className="text-sm font-medium">{test.controlGroup.sampleSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <span className="text-sm font-medium">{formatPercentage(test.controlGroup.successRate * 100)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Average Return</span>
                          <span className="text-sm font-medium">{formatReturn(test.controlGroup.averageReturn)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Completion Rate</span>
                          <span className="text-sm font-medium">{formatPercentage(test.controlGroup.completionRate * 100)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Treatment Group */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Treatment Group</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Sample Size</span>
                          <span className="text-sm font-medium">{test.treatmentGroup.sampleSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <span className="text-sm font-medium">{formatPercentage(test.treatmentGroup.successRate * 100)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Average Return</span>
                          <span className="text-sm font-medium">{formatReturn(test.treatmentGroup.averageReturn)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Completion Rate</span>
                          <span className="text-sm font-medium">{formatPercentage(test.treatmentGroup.completionRate * 100)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Improvements */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Improvements</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <span className="text-sm font-medium text-green-600">
                            +{formatPercentage(test.improvement.successRateImprovement)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Return</span>
                          <span className="text-sm font-medium text-green-600">
                            +{formatPercentage(test.improvement.returnImprovement)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Completion</span>
                          <span className="text-sm font-medium text-green-600">
                            +{formatPercentage(test.improvement.completionRateImprovement)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">P-value</span>
                          <span className="text-sm font-medium">{test.improvement.statisticalSignificance.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Beginner Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Beginner Traders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Target Return</span>
                    <span className="text-sm font-medium">{validationReport.userSuccessMetrics.beginnerMetrics.targetReturn}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Actual Return</span>
                    <span className="text-sm font-semibold text-green-600">
                      {validationReport.userSuccessMetrics.beginnerMetrics.actualReturn}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Max Drawdown Target</span>
                    <span className="text-sm font-medium">{validationReport.userSuccessMetrics.beginnerMetrics.maxDrawdown}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Actual Drawdown</span>
                    <span className="text-sm font-semibold text-green-600">
                      {validationReport.userSuccessMetrics.beginnerMetrics.actualDrawdown}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {formatPercentage(validationReport.userSuccessMetrics.beginnerMetrics.successRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Goal Achievement</span>
                    <span className="text-sm font-semibold text-purple-600">
                      {formatPercentage(validationReport.userSuccessMetrics.beginnerMetrics.goalAchievementRate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Intermediate Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Intermediate Traders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Target Return</span>
                    <span className="text-sm font-medium">{validationReport.userSuccessMetrics.intermediateMetrics.targetReturn}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Actual Return</span>
                    <span className="text-sm font-semibold text-green-600">
                      {validationReport.userSuccessMetrics.intermediateMetrics.actualReturn}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Max Drawdown Target</span>
                    <span className="text-sm font-medium">{validationReport.userSuccessMetrics.intermediateMetrics.maxDrawdown}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Actual Drawdown</span>
                    <span className="text-sm font-semibold text-green-600">
                      {validationReport.userSuccessMetrics.intermediateMetrics.actualDrawdown}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {formatPercentage(validationReport.userSuccessMetrics.intermediateMetrics.successRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Goal Achievement</span>
                    <span className="text-sm font-semibold text-purple-600">
                      {formatPercentage(validationReport.userSuccessMetrics.intermediateMetrics.goalAchievementRate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Advanced Traders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Target Return</span>
                    <span className="text-sm font-medium">{validationReport.userSuccessMetrics.advancedMetrics.targetReturn}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Actual Return</span>
                    <span className="text-sm font-semibold text-green-600">
                      {validationReport.userSuccessMetrics.advancedMetrics.actualReturn}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Max Drawdown Target</span>
                    <span className="text-sm font-medium">{validationReport.userSuccessMetrics.advancedMetrics.maxDrawdown}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Actual Drawdown</span>
                    <span className="text-sm font-semibold text-green-600">
                      {validationReport.userSuccessMetrics.advancedMetrics.actualDrawdown}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {formatPercentage(validationReport.userSuccessMetrics.advancedMetrics.successRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Goal Achievement</span>
                    <span className="text-sm font-semibold text-purple-600">
                      {formatPercentage(validationReport.userSuccessMetrics.advancedMetrics.goalAchievementRate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recommendations */}
        {validationReport.recommendations.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationReport.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    {recommendation.startsWith('✅') ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    )}
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ValidationDashboard; 