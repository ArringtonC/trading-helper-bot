import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined, BarChartOutlined } from '@ant-design/icons';
import { ProgressVisualization } from '../../../features/challenges/components';

const { Title, Paragraph } = Typography;

/**
 * Progress Visualization Page
 * 
 * Dedicated page for progress tracking and visualization within the challenge system.
 */
const ProgressVisualizationPage: React.FC = () => {
  return (
    <div className="progress-visualization-page">
      {/* Header with Navigation */}
      <div className="mb-6">
        <Space>
          <Link to="/challenge">
            <Button icon={<ArrowLeftOutlined />} type="text">
              Back to Challenge Dashboard
            </Button>
          </Link>
        </Space>
        
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg mt-4">
          <Space align="center" size="large">
            <BarChartOutlined style={{ fontSize: '2rem' }} />
            <div>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                Progress Visualization
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                Track your journey from $10k to $20k with detailed analytics and insights
              </Paragraph>
            </div>
          </Space>
        </div>
      </div>

      {/* Main Progress Visualization */}
      <ProgressVisualization 
        challenge={{
          id: "default-challenge",
          title: "$10k → $20k Challenge",
          startingAmount: 10000,
          targetAmount: 20000,
          currentAmount: 10000,
          currentDay: 1,
          totalDays: 90,
          status: "active"
        }}
        weeklyMilestones={[]}
        performanceMetrics={{
          totalGain: 0,
          winRate: 0,
          averageReturn: 0,
          maxDrawdown: 0,
          streaks: { current: 0, longest: 0 }
        }}
        streaks={{
          currentWinStreak: 0,
          currentLossStreak: 0,
          longestWinStreak: 0,
          longestLossStreak: 0
        }}
      />
      
      {/* Additional Navigation */}
      <Card className="mt-6">
        <Title level={4}>Challenge Tools</Title>
        <Space wrap>
          <Button type="primary">
            <Link to="/challenge/planning">Weekly Planning</Link>
          </Button>
          <Button>
            <Link to="/challenge/daily">Daily Tasks</Link>
          </Button>
          <Button>
            <Link to="/challenge">Back to Dashboard</Link>
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default ProgressVisualizationPage;