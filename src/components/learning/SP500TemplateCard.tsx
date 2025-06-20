import React, { useState } from 'react';
import { 
  User, 
  TrendingUp, 
  Shield, 
  Target, 
  ChevronDown, 
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  DollarSign
} from 'lucide-react';

interface AccountProfile {
  id: string;
  name: string;
  accountSize: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  experience: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal: 'income' | 'growth' | 'preservation' | 'learning' | 'trading';
  timeHorizon: 'short' | 'medium' | 'long';
  description: string;
  strengths: string[];
  challenges: string[];
  recommendedStrategies: string[];
  typicalAllocation: { [key: string]: number };
  matchPercentage?: number;
  recommended?: boolean;
}

interface SP500TemplateCardProps {
  profile: AccountProfile;
  expanded?: boolean;
  onSelect?: (profileId: string) => void;
  showAllocation?: boolean;
  className?: string;
}

const SP500TemplateCard: React.FC<SP500TemplateCardProps> = ({
  profile,
  expanded = false,
  onSelect,
  showAllocation = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'conservative': return 'bg-green-100 text-green-800 border-green-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'aggressive': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getExperienceColor = (experience: string) => {
    switch (experience) {
      case 'beginner': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'intermediate': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'advanced': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'income': return <DollarSign className="h-4 w-4" />;
      case 'growth': return <TrendingUp className="h-4 w-4" />;
      case 'preservation': return <Shield className="h-4 w-4" />;
      case 'learning': return <User className="h-4 w-4" />;
      case 'trading': return <BarChart3 className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(profile.id);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`bg-white rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md ${
        profile.recommended ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
      } ${onSelect ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="p-6">
        {profile.recommended && (
          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Best Match
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getGoalIcon(profile.primaryGoal)}
              <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
            </div>
            <p className="text-gray-600 mb-2">${profile.accountSize.toLocaleString()} Account</p>
            <p className="text-sm text-gray-500">{profile.description}</p>
          </div>
          
          {profile.matchPercentage && (
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-blue-600">{profile.matchPercentage}%</div>
              <div className="text-sm text-gray-500">Match</div>
            </div>
          )}
        </div>

        {/* Profile Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(profile.riskTolerance)}`}>
            {profile.riskTolerance} risk
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium border ${getExperienceColor(profile.experience)}`}>
            {profile.experience}
          </span>
          <span className="px-2 py-1 rounded text-xs font-medium border bg-gray-100 text-gray-800 border-gray-300">
            {profile.timeHorizon}-term
          </span>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={handleExpandClick}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show Details
            </>
          )}
        </button>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="p-6 space-y-6">
            {/* Strengths */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Key Strengths
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.strengths.map((strength, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {strength}
                  </span>
                ))}
              </div>
            </div>

            {/* Challenges */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Focus Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.challenges.map((challenge, index) => (
                  <span key={index} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    {challenge}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended Strategies */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Recommended Strategies
              </h4>
              <ul className="space-y-2">
                {profile.recommendedStrategies.map((strategy, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {strategy}
                  </li>
                ))}
              </ul>
            </div>

            {/* Typical Allocation */}
            {showAllocation && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-purple-500" />
                  Typical Asset Allocation
                </h4>
                <div className="space-y-2">
                  {Object.entries(profile.typicalAllocation).map(([asset, percentage]) => (
                    <div key={asset} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{asset}</span>
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Select This Template
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SP500TemplateCard; 