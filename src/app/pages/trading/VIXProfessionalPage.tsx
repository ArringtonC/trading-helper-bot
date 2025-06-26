import React from 'react';
import VIXProfessionalChart from '../../../features/analytics/components/VIXProfessionalChart';

/**
 * VIX Professional Page
 * 
 * Clean VIX volatility chart with clear buy/sell signal annotations
 * Shows VIX levels with trading recommendations in a clear, readable format
 */
const VIXProfessionalPage: React.FC = () => {
  return (
    <div style={{ 
      padding: '24px',
      background: '#f0f2f5',
      minHeight: '100vh'
    }}>
      <VIXProfessionalChart 
        realTime={true}
        width={1200}
        height={600}
      />
    </div>
  );
};

export default VIXProfessionalPage;