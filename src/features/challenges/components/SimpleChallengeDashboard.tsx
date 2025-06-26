import React from 'react';
import { Card, Typography, Button, Space, Alert } from 'antd';
import { RocketOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

/**
 * Simple Challenge Dashboard - Minimal version for debugging
 */
const SimpleChallengeDashboard: React.FC = () => {
  return (
    <div className="simple-challenge-dashboard">
      <Card>
        <Space align="center" size="large">
          <RocketOutlined style={{ fontSize: '2rem' }} />
          <div>
            <Title level={2}>
              🎯 $10k → $20k Challenge
            </Title>
            <Paragraph>
              Simple test version - if you see this, the basic routing works
            </Paragraph>
          </div>
        </Space>
      </Card>
      
      <Alert
        message="Debug: Challenge Dashboard Loading"
        description="This is a minimal version to test component loading"
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </div>
  );
};

export default SimpleChallengeDashboard;