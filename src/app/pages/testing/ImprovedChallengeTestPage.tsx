import React, { useState } from 'react';
import { Layout, ConfigProvider, Button, Space, Alert, Typography } from 'antd';
import ImprovedChallengeDashboard from '../../../features/challenges/components/ImprovedChallengeDashboard';
import ImprovedNavigation from '../../../shared/components/ImprovedNavigation';
import { antdThemeConfig } from '../../../shared/styles/designSystem';

const { Content } = Layout;
const { Title, Text } = Typography;

const ImprovedChallengeTestPage: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    // In a real app, this would update global theme state
    document.body.style.backgroundColor = enabled ? '#1f1f1f' : '#ffffff';
    document.body.style.color = enabled ? '#ffffff' : '#000000';
  };

  return (
    <ConfigProvider theme={antdThemeConfig}>
      <Layout style={{ minHeight: '100vh', background: darkMode ? '#1f1f1f' : '#f5f5f5' }}>
        <ImprovedNavigation 
          darkMode={darkMode} 
          onDarkModeToggle={handleDarkModeToggle}
        />
          
          <Content style={{ 
            background: darkMode ? '#1f1f1f' : '#f5f5f5',
            padding: '24px'
          }}>
            {/* Test Header */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <Alert
                message="UI/UX Improvement Testing"
                description="This is the improved Challenge Dashboard implementing all 10 UI/UX recommendations"
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              
              <Space>
                <Button 
                  type="primary" 
                  onClick={() => window.location.href = '/challenge'}
                >
                  View Original Dashboard
                </Button>
                <Button 
                  type="default"
                  onClick={() => setDarkMode(!darkMode)}
                >
                  Toggle {darkMode ? 'Light' : 'Dark'} Mode
                </Button>
              </Space>
            </div>

            {/* Improved Dashboard */}
            <ImprovedChallengeDashboard />
            
            {/* Implementation Notes */}
            <div style={{ 
              marginTop: '48px', 
              padding: '24px', 
              background: darkMode ? '#262626' : '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? '#434343' : '#f0f0f0'}`
            }}>
              <Title level={3}>✅ Implemented Improvements</Title>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div>
                  <Text strong>1. Consistent Layout Grid ✅</Text>
                  <Text className="block text-sm text-gray-600">12-column responsive grid with proper spacing</Text>
                </div>
                
                <div>
                  <Text strong>2. Simplified Navigation ✅</Text>
                  <Text className="block text-sm text-gray-600">Clean format: Home | Challenge | Daily | Progress | Settings</Text>
                </div>
                
                <div>
                  <Text strong>3. Elevated Key Metrics ✅</Text>
                  <Text className="block text-sm text-gray-600">Hero progress card above the fold with visual dominance</Text>
                </div>
                
                <div>
                  <Text strong>4. Psychology Check-In UI ✅</Text>
                  <Text className="block text-sm text-gray-600">Sliders, emojis, and intuitive controls</Text>
                </div>
                
                <div>
                  <Text strong>5. Tabbed Interface ✅</Text>
                  <Text className="block text-sm text-gray-600">Overview | Weekly Plan | Daily Flow | Progress</Text>
                </div>
                
                <div>
                  <Text strong>6. Condensed Profit Summary ✅</Text>
                  <Text className="block text-sm text-gray-600">Clean card with toggle and extract buttons</Text>
                </div>
                
                <div>
                  <Text strong>7. Visual Achievements ✅</Text>
                  <Text className="block text-sm text-gray-600">Progress circles, badges, and clear visual hierarchy</Text>
                </div>
                
                <div>
                  <Text strong>8. Timeline UI ✅</Text>
                  <Text className="block text-sm text-gray-600">Daily routine with time blocks and icons</Text>
                </div>
                
                <div>
                  <Text strong>9. Reduced Repetition ✅</Text>
                  <Text className="block text-sm text-gray-600">Consolidated headers and streamlined content</Text>
                </div>
                
                <div>
                  <Text strong>10. Design Hierarchy ✅</Text>
                  <Text className="block text-sm text-gray-600">Proper font sizes, accent colors, dark/light modes</Text>
                </div>
              </div>
            </div>
          </Content>
        </Layout>
      </ConfigProvider>
  );
};

export default ImprovedChallengeTestPage;