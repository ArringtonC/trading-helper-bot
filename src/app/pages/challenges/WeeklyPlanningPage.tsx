import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons';
import { WeeklyPlanningWizard } from '../../../features/challenges/components';

const { Title, Paragraph } = Typography;

/**
 * Weekly Planning Page
 * 
 * Dedicated page for the weekly planning wizard within the challenge system.
 */
const WeeklyPlanningPage: React.FC = () => {
  return (
    <div className="weekly-planning-page">
      {/* Header with Navigation */}
      <div className="mb-6">
        <Space>
          <Link to="/challenge">
            <Button icon={<ArrowLeftOutlined />} type="text">
              Back to Challenge Dashboard
            </Button>
          </Link>
        </Space>
        
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mt-4">
          <Space align="center" size="large">
            <CalendarOutlined style={{ fontSize: '2rem' }} />
            <div>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                Weekly Planning Wizard
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                Plan your trading week with strategic goal setting and risk management
              </Paragraph>
            </div>
          </Space>
        </div>
      </div>

      {/* Main Planning Wizard */}
      <WeeklyPlanningWizard 
        challengeId="default-challenge"
        currentWeek={1}
        accountBalance={10000}
        openPositions={[]}
      />
      
      {/* Additional Navigation */}
      <Card className="mt-6">
        <Title level={4}>Next Steps</Title>
        <Space wrap>
          <Button type="primary">
            <Link to="/challenge/daily">View Daily Tasks</Link>
          </Button>
          <Button>
            <Link to="/challenge/progress">Track Progress</Link>
          </Button>
          <Button>
            <Link to="/challenge">Back to Dashboard</Link>
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default WeeklyPlanningPage;