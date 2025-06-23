import React from 'react';
import { VirtualPortfolio, UserProfile, TutorialProgress, MESFeatureFlags } from '../types';

interface AnalyticsDashboardProps {
  virtualPortfolio: VirtualPortfolio;
  userProfile: UserProfile;
  tutorialProgress: TutorialProgress;
  featureFlags: MESFeatureFlags;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  virtualPortfolio,
  userProfile,
  tutorialProgress,
  featureFlags
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          📈 Advanced Analytics
        </h2>
        <p className="text-gray-600 mb-6">
          Comprehensive performance analytics, risk assessment, and improvement recommendations 
          are currently being developed.
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Coming Soon Features:</h3>
          <ul className="text-sm text-green-600 space-y-1">
            <li>• Performance tracking and trade analysis</li>
            <li>• Risk metrics and drawdown analysis</li>
            <li>• Behavioral pattern identification</li>
            <li>• Personalized improvement recommendations</li>
            <li>• Comparative benchmarking and peer analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 