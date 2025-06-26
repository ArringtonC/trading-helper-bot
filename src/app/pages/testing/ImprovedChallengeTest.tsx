import React from 'react';
import { Typography } from 'antd';
import ImprovedChallengeDashboard from '../../../features/challenges/components/ImprovedChallengeDashboard';

const { Title } = Typography;

/**
 * Test page to display ONLY the ImprovedChallengeDashboard component
 */
const ImprovedChallengeTest: React.FC = () => {
  return (
    <div className="improved-challenge-test-page p-4">
      <Title level={2} className="mb-4">Improved Challenge Dashboard Test</Title>
      <p className="mb-6">This page shows ONLY the ImprovedChallengeDashboard component:</p>
      
      <ImprovedChallengeDashboard 
        showPsychologyFeatures={true}
        currentDay={32}
        accountBalance={13450}
        targetAmount={20000}
      />
    </div>
  );
};

export default ImprovedChallengeTest;