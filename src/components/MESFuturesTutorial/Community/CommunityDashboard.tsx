import React from 'react';
import { UserProfile } from '../types';

interface CommunityDashboardProps {
  userProfile: UserProfile;
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
}

const CommunityDashboard: React.FC<CommunityDashboardProps> = ({
  userProfile,
  onProfileUpdate
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          👥 Community Dashboard
        </h2>
        <p className="text-gray-600 mb-6">
          Connect with fellow MES futures traders, share strategies, and learn from experienced mentors.
        </p>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-800 mb-2">Coming Soon Features:</h3>
          <ul className="text-sm text-purple-600 space-y-1">
            <li>• Discussion forums and strategy sharing</li>
            <li>• Mentor matching and guidance programs</li>
            <li>• Study groups and live trading sessions</li>
            <li>• Strategy marketplace and reviews</li>
            <li>• Community challenges and leaderboards</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CommunityDashboard; 