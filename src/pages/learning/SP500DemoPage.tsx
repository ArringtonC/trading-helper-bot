import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Shield, 
  Target, 
  DollarSign, 
  BookOpen, 
  BarChart3, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Users,
  PieChart
} from 'lucide-react';

interface MarketEvent {
  id: number;
  date: string;
  title: string;
  category: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  priceImpact: string;
  relevanceScore: number;
}

interface AccountProfile {
  id: string;
  name: string;
  accountSize: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  experience: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal: 'income' | 'growth' | 'preservation' | 'learning' | 'trading';
  timeHorizon: 'short' | 'medium' | 'long';
  matchPercentage?: number;
  strengths?: string[];
  challenges?: string[];
  recommended?: boolean;
}

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  dateRange: string;
  startPrice: number;
  endPrice: number;
  maxDrawdown: number;
  volatility: number;
  events: MarketEvent[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focusAreas: string[];
}

const SP500DemoPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState<string>('Q1_2025');
  const [userProfile, setUserProfile] = useState<Partial<AccountProfile>>({});
  const [matchedProfiles, setMatchedProfiles] = useState<AccountProfile[]>([]);
  const [currentStep, setCurrentStep] = useState<'profile' | 'scenarios' | 'demo'>('profile');
  const [marketEvents, setMarketEvents] = useState<MarketEvent[]>([]);

  // Sample account profiles for template matching
  const accountProfiles: AccountProfile[] = [
    {
      id: 'conservative_income',
      name: 'Conservative Income Seeker',
      accountSize: 250000,
      riskTolerance: 'conservative',
      experience: 'beginner',
      primaryGoal: 'income',
      timeHorizon: 'long',
      strengths: ['Dividend focus', 'Risk management', 'Long-term perspective'],
      challenges: ['Market volatility', 'Growth opportunities'],
    },
    {
      id: 'growth_focused',
      name: 'Growth-Focused Investor',
      accountSize: 100000,
      riskTolerance: 'moderate',
      experience: 'intermediate',
      primaryGoal: 'growth',
      timeHorizon: 'medium',
      strengths: ['Market timing', 'Sector rotation', 'Technology trends'],
      challenges: ['Downside protection', 'Emotional decisions'],
    },
    {
      id: 'active_trader',
      name: 'Active Trader',
      accountSize: 75000,
      riskTolerance: 'aggressive',
      experience: 'advanced',
      primaryGoal: 'trading',
      timeHorizon: 'short',
      strengths: ['Technical analysis', 'Risk management', 'Quick decisions'],
      challenges: ['Overtrading', 'News-driven volatility'],
    },
    {
      id: 'learning_investor',
      name: 'Learning Investor',
      accountSize: 25000,
      riskTolerance: 'moderate',
      experience: 'beginner',
      primaryGoal: 'learning',
      timeHorizon: 'long',
      strengths: ['Education focus', 'Systematic approach', 'Documentation'],
      challenges: ['Experience gap', 'Confidence building'],
    },
    {
      id: 'preservation_focused',
      name: 'Capital Preservation',
      accountSize: 500000,
      riskTolerance: 'conservative',
      experience: 'intermediate',
      primaryGoal: 'preservation',
      timeHorizon: 'long',
      strengths: ['Risk control', 'Diversification', 'Patience'],
      challenges: ['Inflation protection', 'Opportunity cost'],
    }
  ];

  // Demo scenarios with real S&P 500 data
  const demoScenarios: DemoScenario[] = [
    {
      id: 'Q1_2025',
      title: 'Q1 2025: Steady Growth Phase',
      description: 'Experience the steady bull market conditions that characterized the first quarter of 2025',
      dateRange: 'Jan 2 - Mar 31, 2025',
      startPrice: 6005.80,
      endPrice: 6440.85,
      maxDrawdown: -2.1,
      volatility: 12.8,
      events: [],
      difficulty: 'beginner',
      focusAreas: ['Trend following', 'Long-term positioning', 'Risk management basics']
    },
    {
      id: 'TARIFF_CRISIS',
      title: 'April 2025: Tariff Crisis',
      description: 'Navigate the historic tariff-driven crash and recovery that dominated April 2025',
      dateRange: 'Apr 1 - Apr 30, 2025',
      startPrice: 6449.30,
      endPrice: 5741.05,
      maxDrawdown: -22.7,
      volatility: 45.2,
      events: [],
      difficulty: 'advanced',
      focusAreas: ['Crisis management', 'Volatility trading', 'News reaction']
    },
    {
      id: 'RECOVERY_2025',
      title: 'May-June 2025: Recovery Rally',
      description: 'Learn from the systematic recovery following the April crisis',
      dateRange: 'May 1 - Jun 2, 2025',
      startPrice: 5778.70,
      endPrice: 6400.00,
      volatility: 28.5,
      maxDrawdown: -3.8,
      events: [],
      difficulty: 'intermediate',
      focusAreas: ['Recovery patterns', 'Momentum strategies', 'Risk-on positioning']
    }
  ];

  useEffect(() => {
    // Load market events from JSON file
    fetch('/data/SP500_2025_NewsEvents.json')
      .then(response => response.json())
      .then(data => setMarketEvents(data.events))
      .catch(error => console.error('Error loading market events:', error));
  }, []);

  const calculateProfileMatch = (profile: AccountProfile): number => {
    let matchScore = 0;
    const weights = {
      accountSize: 0.2,
      riskTolerance: 0.25,
      experience: 0.2,
      primaryGoal: 0.25,
      timeHorizon: 0.1
    };

    // Account size match (closer = better)
    const sizeRatio = Math.min(userProfile.accountSize || 0, profile.accountSize) / 
                     Math.max(userProfile.accountSize || 1, profile.accountSize);
    matchScore += sizeRatio * weights.accountSize * 100;

    // Direct matches
    if (userProfile.riskTolerance === profile.riskTolerance) matchScore += weights.riskTolerance * 100;
    if (userProfile.experience === profile.experience) matchScore += weights.experience * 100;
    if (userProfile.primaryGoal === profile.primaryGoal) matchScore += weights.primaryGoal * 100;
    if (userProfile.timeHorizon === profile.timeHorizon) matchScore += weights.timeHorizon * 100;

    return Math.round(matchScore);
  };

  const handleProfileSubmit = () => {
    const profiles = accountProfiles.map(profile => ({
      ...profile,
      matchPercentage: calculateProfileMatch(profile)
    })).sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));

    // Mark top match as recommended
    if (profiles.length > 0) {
      profiles[0].recommended = true;
    }

    setMatchedProfiles(profiles);
    setCurrentStep('scenarios');
  };

  const getScenarioEvents = (scenarioId: string): MarketEvent[] => {
    const scenario = demoScenarios.find(s => s.id === scenarioId);
    if (!scenario) return [];

    // Filter events by date range
    const events = marketEvents.filter(event => {
      const eventDate = new Date(event.date);
      if (scenarioId === 'Q1_2025') {
        return eventDate >= new Date('2025-01-01') && eventDate <= new Date('2025-03-31');
      } else if (scenarioId === 'TARIFF_CRISIS') {
        return eventDate >= new Date('2025-04-01') && eventDate <= new Date('2025-04-30');
      } else if (scenarioId === 'RECOVERY_2025') {
        return eventDate >= new Date('2025-05-01') && eventDate <= new Date('2025-06-02');
      }
      return false;
    });

    return events.slice(0, 5); // Limit to 5 most relevant events
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const renderProfileBuilder = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Build Your Investor Profile</h2>
        <p className="text-lg text-gray-600">
          Help us match you with the most relevant S&P 500 trading templates and scenarios
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 space-y-6">
        {/* Account Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Size
          </label>
          <select
            value={userProfile.accountSize || ''}
            onChange={(e) => setUserProfile({...userProfile, accountSize: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select account size</option>
            <option value="10000">$10,000 - $25,000</option>
            <option value="50000">$25,000 - $100,000</option>
            <option value="200000">$100,000 - $500,000</option>
            <option value="750000">$500,000+</option>
          </select>
        </div>

        {/* Risk Tolerance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Tolerance
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['conservative', 'moderate', 'aggressive'].map((risk) => (
              <button
                key={risk}
                onClick={() => setUserProfile({...userProfile, riskTolerance: risk as any})}
                className={`p-3 border rounded-lg text-sm font-medium ${
                  userProfile.riskTolerance === risk
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {risk.charAt(0).toUpperCase() + risk.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['beginner', 'intermediate', 'advanced'].map((exp) => (
              <button
                key={exp}
                onClick={() => setUserProfile({...userProfile, experience: exp as any})}
                className={`p-3 border rounded-lg text-sm font-medium ${
                  userProfile.experience === exp
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {exp.charAt(0).toUpperCase() + exp.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Goal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Investment Goal
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: 'income', label: 'Income', icon: DollarSign },
              { key: 'growth', label: 'Growth', icon: TrendingUp },
              { key: 'preservation', label: 'Preservation', icon: Shield },
              { key: 'learning', label: 'Learning', icon: BookOpen },
              { key: 'trading', label: 'Active Trading', icon: BarChart3 }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setUserProfile({...userProfile, primaryGoal: key as any})}
                className={`p-3 border rounded-lg text-sm font-medium flex flex-col items-center gap-2 ${
                  userProfile.primaryGoal === key
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Horizon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Horizon
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'short', label: 'Short-term (< 1 year)' },
              { key: 'medium', label: 'Medium-term (1-5 years)' },
              { key: 'long', label: 'Long-term (5+ years)' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setUserProfile({...userProfile, timeHorizon: key as any})}
                className={`p-3 border rounded-lg text-sm font-medium ${
                  userProfile.timeHorizon === key
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleProfileSubmit}
          disabled={!userProfile.accountSize || !userProfile.riskTolerance || !userProfile.experience || !userProfile.primaryGoal || !userProfile.timeHorizon}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Find My Matches
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderTemplateMatching = () => (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Template Matches</h2>
        <p className="text-lg text-gray-600">
          Based on your profile, here are the investor templates that best match your characteristics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matchedProfiles.map((profile) => (
          <div
            key={profile.id}
            className={`bg-white rounded-lg border shadow-sm p-6 ${
              profile.recommended ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
            }`}
          >
            {profile.recommended && (
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Recommended Match
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
                <p className="text-gray-600">${profile.accountSize.toLocaleString()} Account</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{profile.matchPercentage}%</div>
                <div className="text-sm text-gray-500">Match</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Risk:</span> {profile.riskTolerance}
              </div>
              <div>
                <span className="text-gray-500">Experience:</span> {profile.experience}
              </div>
              <div>
                <span className="text-gray-500">Goal:</span> {profile.primaryGoal}
              </div>
              <div>
                <span className="text-gray-500">Horizon:</span> {profile.timeHorizon}-term
              </div>
            </div>

            {profile.strengths && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Strengths
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.strengths.map((strength, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.challenges && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Focus Areas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.challenges.map((challenge, index) => (
                    <span key={index} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      {challenge}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={() => setCurrentStep('demo')}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 mx-auto"
        >
          Continue to Demo Scenarios
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderDemoScenarios = () => {
    const scenario = demoScenarios.find(s => s.id === selectedScenario);
    const events = getScenarioEvents(selectedScenario);

    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">S&P 500 Demo Scenarios</h2>
          <p className="text-lg text-gray-600">
            Experience real market conditions with authentic S&P 500 data and events
          </p>
        </div>

        {/* Scenario Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demoScenarios.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setSelectedScenario(demo.id)}
              className={`p-4 border rounded-lg text-left transition-all ${
                selectedScenario === demo.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{demo.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(demo.difficulty)}`}>
                  {demo.difficulty}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{demo.description}</p>
              <div className="text-xs text-gray-500">
                <div>{demo.dateRange}</div>
                <div>Max Drawdown: {demo.maxDrawdown}%</div>
              </div>
            </button>
          ))}
        </div>

        {scenario && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Scenario Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{scenario.title}</h3>
                  <p className="text-gray-600">{scenario.dateRange}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(scenario.difficulty)}`}>
                  {scenario.difficulty}
                </span>
              </div>
            </div>

            {/* Scenario Metrics */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {((scenario.endPrice - scenario.startPrice) / scenario.startPrice * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Total Return</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{scenario.maxDrawdown}%</div>
                  <div className="text-sm text-gray-500">Max Drawdown</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{scenario.volatility}%</div>
                  <div className="text-sm text-gray-500">Volatility</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{events.length}</div>
                  <div className="text-sm text-gray-500">Key Events</div>
                </div>
              </div>
            </div>

            {/* Focus Areas */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Learning Focus Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                {scenario.focusAreas.map((area, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Market Events */}
            {events.length > 0 && (
              <div className="px-6 py-4">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Key Market Events
                </h4>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 min-w-[80px]">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{event.title}</h5>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className={`font-medium ${getImpactColor(event.impact)}`}>
                            {event.impact} impact
                          </span>
                          <span className="text-gray-500">
                            Price Impact: {event.priceImpact}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
              <div className="flex gap-3">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Start Interactive Demo
                </button>
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  View Strategy Guide
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📈 S&P 500 Demo Lab
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Template matching and account classification with real market scenarios
              </p>
            </div>
            <button
              onClick={() => navigate('/learning')}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              ← Back to Learning
            </button>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {[
              { key: 'profile', label: 'Build Profile', icon: Users },
              { key: 'scenarios', label: 'Template Matching', icon: PieChart },
              { key: 'demo', label: 'Demo Scenarios', icon: BarChart3 }
            ].map(({ key, label, icon: Icon }, index) => (
              <div key={key} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  currentStep === key 
                    ? 'bg-blue-100 text-blue-700'
                    : index < ['profile', 'scenarios', 'demo'].indexOf(currentStep)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{label}</span>
                </div>
                {index < 2 && <ArrowRight className="h-4 w-4 text-gray-400 mx-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12">
        {currentStep === 'profile' && renderProfileBuilder()}
        {currentStep === 'scenarios' && renderTemplateMatching()}
        {currentStep === 'demo' && renderDemoScenarios()}
      </div>
    </div>
  );
};

export default SP500DemoPage;