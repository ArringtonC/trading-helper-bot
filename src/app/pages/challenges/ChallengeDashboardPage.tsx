import {
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Space, Typography } from "antd";
import React from "react";
import { Link } from "react-router-dom";
import ImprovedChallengeDashboard from "../../../features/challenges/components/ImprovedChallengeDashboard";

const { Title, Paragraph } = Typography;

// Simple Error Boundary to catch rendering errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Challenge Dashboard Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <Alert
            message="Component Error"
            description={`Something went wrong loading the dashboard: ${
              this.state.error?.message || "Unknown error"
            }`}
            type="error"
            showIcon
          />
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Challenge Dashboard Page
 *
 * Main landing page for the $10k → $20k Challenge system.
 * Displays challenge overview and navigation to other challenge features.
 */
const ChallengeDashboardPage: React.FC = () => {
  return (
    <div className="challenge-dashboard-page">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg mb-6">
        <Space align="center" size="large">
          <RocketOutlined style={{ fontSize: "2rem" }} />
          <div>
            <Title level={2} style={{ color: "white", margin: 0 }}>
              🎯 $10k → $20k Challenge
            </Title>
            <Paragraph style={{ color: "rgba(255,255,255,0.9)", margin: 0 }}>
              Transform your trading with our structured 90-day challenge system
            </Paragraph>
          </div>
        </Space>
      </div>

      {/* Quick Navigation */}
      <Card className="mb-6">
        <Title level={4}>Challenge Tools</Title>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/challenge/planning">
            <Card
              hoverable
              className="text-center h-full"
              bodyStyle={{ padding: "24px 16px" }}
            >
              <CalendarOutlined
                style={{ fontSize: "2rem", color: "#1890ff" }}
              />
              <Title level={5} className="mt-3 mb-2">
                Weekly Planning
              </Title>
              <Paragraph type="secondary" className="mb-0">
                Set up your trading week with goals and risk parameters
              </Paragraph>
            </Card>
          </Link>

          <Link to="/challenge/daily">
            <Card
              hoverable
              className="text-center h-full"
              bodyStyle={{ padding: "24px 16px" }}
            >
              <CheckCircleOutlined
                style={{ fontSize: "2rem", color: "#52c41a" }}
              />
              <Title level={5} className="mt-3 mb-2">
                Daily Workflow
              </Title>
              <Paragraph type="secondary" className="mb-0">
                Follow your daily pre-market and post-market routines
              </Paragraph>
            </Card>
          </Link>

          <Link to="/challenge/progress">
            <Card
              hoverable
              className="text-center h-full"
              bodyStyle={{ padding: "24px 16px" }}
            >
              <BarChartOutlined
                style={{ fontSize: "2rem", color: "#f5222d" }}
              />
              <Title level={5} className="mt-3 mb-2">
                Progress Tracking
              </Title>
              <Paragraph type="secondary" className="mb-0">
                Visualize your journey and analyze performance
              </Paragraph>
            </Card>
          </Link>
        </div>
      </Card>

      {/* Component 2 Integration Notice */}
      <Alert
        message="🆕 NEW: Component 2 Integration Complete!"
        description="Monday Range Calculator & Setup now integrated with battle zone visualization and breakout alerts"
        type="success"
        showIcon
        className="mb-6"
        action={
          <Button size="small" type="link">
            <Link to="/component2-test">Test Component 2</Link>
          </Button>
        }
      />

      {/* Main Challenge Dashboard - Now with Component 2! */}
      <ErrorBoundary>
        <ImprovedChallengeDashboard />
      </ErrorBoundary>

      {/* Additional Navigation */}
      <Card className="mt-6">
        <Title level={4}>Get Started</Title>
        <Space wrap>
          <Button type="primary" size="large">
            <Link to="/challenge/planning">Start Weekly Planning</Link>
          </Button>
          <Button size="large">
            <Link to="/challenge/daily">View Today's Tasks</Link>
          </Button>
          <Button size="large">
            <Link to="/challenge/progress">Check Progress</Link>
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default ChallengeDashboardPage;
