import React from 'react';
import ScreeningHub from '../../../features/analytics/components/ScreeningHub/ScreeningHub';
// TODO: IntegrationContext needs to be implemented
// import { IntegrationProvider } from '../../../context/IntegrationContext';

/**
 * Screening Hub Page
 * Main route component for the unified screening-to-trading workflow
 * 
 * Route: /screening-hub
 * Features: Complete integration of all screening and trading features
 */

const ScreeningHubPage: React.FC = () => {
  return (
    <IntegrationProvider>
      <div className="min-h-screen bg-gray-50">
        <ScreeningHub />
      </div>
    </IntegrationProvider>
  );
};

export default ScreeningHubPage; 