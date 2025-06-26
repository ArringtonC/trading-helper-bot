import {
  ApiOutlined,
  BookOutlined,
  BugOutlined,
  BulbOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  LineChartOutlined,
  RocketOutlined,
  StarOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Card,
  Collapse,
  Progress,
  Spin,
  Statistic,
  Tabs,
  Tag,
  Timeline,
} from "antd";
import React, { useEffect, useState } from "react";

const { TabPane } = Tabs;
const { Panel } = Collapse;

interface Task {
  id: string;
  title: string;
  description: string;
  status: "done" | "in-progress" | "pending" | "deferred" | "cancelled";
  priority: "high" | "medium" | "low";
  dependencies: string[];
  category:
    | "core"
    | "enhancement"
    | "maintenance"
    | "research"
    | "infrastructure";
  subtasks?: {
    id: string;
    title: string;
    status: "done" | "pending" | "in-progress";
  }[];
}

interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: PlannedFeature[];
}

interface PlannedFeature {
  id: string;
  name: string;
  description: string;
  status: "planned" | "in-development" | "testing" | "complete" | "critical";
  priority: "high" | "medium" | "low";
  estimatedCompletion?: string;
  dependencies?: string[];
  userImpact: string;
  businessValue: string;
  technicalDetails?: string;
}

const WorkItemsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("current");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roadmap, setRoadmap] = useState<FeatureCategory[]>([]);
  const [debt, setDebt] = useState<any[]>([]);

  useEffect(() => {
    // This simulates fetching data from an API or Task Master
    const fetchData = async () => {
      setLoading(true);
      // In a real app, this would be an API call, e.g., `await api.getTasks()`
      const currentTasksData: Task[] = [
        {
          id: "55",
          title: "HMM Service Page UI/UX Enhancement",
          description:
            "Redesign the HMM service page to improve user experience and add interactive elements for visualizing HMM predictions and VIX integration.",
          status: "in-progress",
          priority: "high",
          dependencies: [],
          category: "enhancement",
          subtasks: [
            {
              id: "55.1",
              title: "Conduct Comprehensive UI/UX Review",
              status: "done",
            },
            {
              id: "55.2",
              title: "Redesign Page Layout and Structure",
              status: "in-progress",
            },
            {
              id: "55.3",
              title: "Develop Interactive Visualizations",
              status: "pending",
            },
            {
              id: "55.4",
              title: "Ensure Accessibility and Responsiveness",
              status: "pending",
            },
            {
              id: "55.5",
              title: "Document New UI Components",
              status: "pending",
            },
          ],
        },
        {
          id: "40",
          title: "Comprehensive Test Suite Implementation",
          description:
            "Build comprehensive test coverage for all major components and workflows to ensure application stability and reliability.",
          status: "pending",
          priority: "high",
          dependencies: [],
          category: "maintenance",
        },
        {
          id: "41",
          title: "S&P 500 Market Data Integration",
          description:
            "Integrate real-time S&P 500 market data and analysis capabilities.",
          status: "pending",
          priority: "high",
          dependencies: [],
          category: "core",
        },
      ];

      const plannedFeaturesData: FeatureCategory[] = [
        {
          id: "critical-fixes",
          name: "Critical Fixes & Refactoring",
          description:
            "Urgent issues identified from build logs and codebase analysis that need immediate attention.",
          icon: <FireOutlined />,
          color: "#ff4d4f",
          features: [
            {
              id: "fix-broken-imports",
              name: "Fix Broken Module Imports",
              description:
                "Resolve critical TS2307 errors where modules like '../types/trade' and './positionLimitRecommendations' cannot be found.",
              status: "critical",
              priority: "high",
              estimatedCompletion: "Next Sprint",
              userImpact:
                "Restores currently broken application functionality in position sizing and data utilities, making the app usable.",
              businessValue:
                "Improves application stability and reliability, reducing user-facing bugs and support requests.",
              technicalDetails:
                "Identify all TS2307 errors. Correct file paths, fix circular dependencies, and ensure all necessary modules are created and exported correctly.",
            },
            {
              id: "refactor-database-service",
              name: "Refactor DatabaseService Exports",
              description:
                "Correct TS2614/TS2339 errors by properly exporting 'insertNormalizedTrades' and 'getTrades' and ensuring their implementation is correct.",
              status: "critical",
              priority: "high",
              estimatedCompletion: "Next Sprint",
              userImpact:
                "Ensures that user trade data can be saved, retrieved, and analyzed correctly across the application.",
              businessValue:
                "Core data persistence functionality is critical for user retention and almost all other features.",
              technicalDetails:
                "Analyze the DatabaseService module. Expose the required functions through the main export and validate their signatures.",
            },
            {
              id: "implement-missing-services",
              name: "Implement Missing Services",
              description:
                "Create placeholder or full implementations for missing services like 'VolatilityAnalysisService' and 'AccountLevelSystem' to unblock dependent features.",
              status: "critical",
              priority: "high",
              estimatedCompletion: "Next Sprint",
              userImpact:
                "Unblocks development of key features like advanced risk management and goal-setting that are currently non-functional.",
              businessValue:
                "Accelerates development velocity by resolving key blockers for multiple high-value roadmap items.",
              technicalDetails:
                "Create new service files with placeholder functions that return mock data, allowing dependent UI components to render without crashing.",
            },
          ],
        },
        {
          id: "trading-core",
          name: "Core Trading Features",
          description: "Essential trading functionality and analysis tools",
          icon: <LineChartOutlined />,
          color: "#1890ff",
          features: [
            {
              id: "position-sizing-v2",
              name: "Enhanced Position Sizing Calculator",
              description:
                "Kelly Criterion integration with VIX-adjusted sizing and real-time risk calculations",
              status: "planned",
              priority: "high",
              estimatedCompletion: "Q2 2025",
              userImpact:
                "Users will be able to calculate optimal, risk-adjusted position sizes based on their personal risk profile and real-time market volatility.",
              businessValue:
                "Provides a significant competitive advantage by offering a sophisticated, research-backed tool that helps users manage risk more effectively.",
              technicalDetails:
                "Integrate Kelly Criterion and VIX-scaling formulas into the existing position sizing engine. Connect to a real-time VIX data feed.",
            },
            {
              id: "advanced-risk-management",
              name: "Advanced Risk Management",
              description:
                "Multi-factor volatility analysis, weekend gap risk, and portfolio-level risk controls",
              status: "in-development",
              priority: "high",
              estimatedCompletion: "Q1 2025",
              userImpact:
                "Allows traders to analyze and mitigate complex risks beyond simple stop-losses, such as overnight gaps and high-volatility events.",
              businessValue:
                "Positions the app as a professional-grade risk management tool, attracting more experienced traders.",
              technicalDetails:
                "Develop new services for volatility and gap risk analysis. Integrate these into a new risk dashboard.",
            },
            {
              id: "real-time-alerts",
              name: "Real-Time Trading Alerts",
              description:
                "Customizable alerts for market conditions, price targets, and risk thresholds",
              status: "planned",
              priority: "medium",
              estimatedCompletion: "Q3 2025",
              userImpact:
                "Users can set up personalized alerts and be notified of trading opportunities or risk events without having to constantly watch the market.",
              businessValue:
                "Increases user engagement and makes the tool an indispensable part of a trader's daily workflow.",
              technicalDetails:
                "Implement a backend service for monitoring market data and triggering push notifications or emails.",
            },
            {
              id: "paper-trading-mode",
              name: "Paper Trading Mode",
              description:
                "Implement a paper trading mode to allow users to test strategies without real capital.",
              status: "planned",
              priority: "medium",
              estimatedCompletion: "Q3 2025",
              userImpact:
                "Users can practice trading strategies and explore the app's features in a risk-free simulated environment.",
              businessValue:
                "Lowers the barrier to entry for new users and serves as a powerful tool for customer acquisition and education.",
              technicalDetails:
                'Create a separate "paper" account type that mirrors a real account but uses simulated funds and market data.',
            },
          ],
        },
        {
          id: "ai-ml",
          name: "AI & Machine Learning",
          description: "Advanced analytics and predictive capabilities",
          icon: <ThunderboltOutlined />,
          color: "#722ed1",
          features: [
            {
              id: "hmm-enhancement",
              name: "HMM Regime Prediction Enhancement",
              description:
                "Improved Hidden Markov Model with VIX integration for market regime detection",
              status: "complete",
              priority: "high",
              userImpact:
                "Provides users with a clear, AI-driven assessment of the current market state (e.g., low-volatility, high-volatility), helping them choose appropriate strategies.",
              businessValue:
                "Demonstrates cutting-edge AI capabilities and provides a unique, actionable insight that competitors lack.",
            },
            {
              id: "ml-trade-analysis",
              name: "ML-Powered Trade Analysis",
              description:
                "Machine learning ensemble for trade outcome prediction and pattern recognition",
              status: "complete",
              priority: "high",
              userImpact:
                "Users can analyze their trading history to identify their most profitable patterns and receive AI-powered suggestions for improvement.",
              businessValue:
                "A powerful retention tool that provides personalized, data-driven feedback to help users become better traders.",
            },
            {
              id: "sentiment-analysis",
              name: "Market Sentiment Analysis",
              description:
                "Real-time sentiment analysis from news and social media for trading signals",
              status: "planned",
              priority: "medium",
              estimatedCompletion: "Q4 2025",
              userImpact:
                "Traders can gauge the overall mood of the market towards a specific stock, providing an additional layer of confirmation for their trade ideas.",
              businessValue:
                "Adds a unique, qualitative data point to the app's analytical toolkit, appealing to a broader range of trading styles.",
              technicalDetails:
                "Integrate with a third-party news/sentiment API or build a custom NLP model to process financial news feeds.",
            },
            {
              id: "hmm-visualization",
              name: "HMM Prediction Visualization",
              description:
                "Add a chart or table to visualize the predicted market regimes from the HMM service directly on the AI Trade Analysis page.",
              status: "planned",
              priority: "medium",
              estimatedCompletion: "Q2 2025",
              dependencies: ["hmm-enhancement"],
              userImpact:
                "Users can see the history of market regimes on a chart, helping them understand how different market conditions evolve and affect their strategies.",
              businessValue:
                "Makes the HMM feature more intuitive and useful, increasing its adoption and perceived value.",
              technicalDetails:
                "Create a new chart component using a library like Recharts or Chart.js to plot the regime predictions over time.",
            },
          ],
        },
        {
          id: "user-experience",
          name: "User Experience",
          description: "Interface improvements and user-friendly features",
          icon: <StarOutlined />,
          color: "#52c41a",
          features: [
            {
              id: "mobile-companion",
              name: "Mobile Alert Companion",
              description:
                "Mobile app for receiving trading alerts and quick position monitoring",
              status: "planned",
              priority: "low",
              estimatedCompletion: "Q4 2025",
              dependencies: ["real-time-alerts"],
              userImpact:
                "Users can stay connected to the market and their portfolio on the go, receiving critical alerts and updates on their mobile devices.",
              businessValue:
                "Expands the product ecosystem and significantly increases daily user engagement and stickiness.",
              technicalDetails:
                "Develop a native (React Native) or cross-platform mobile application that connects to the main backend.",
            },
            {
              id: "tutorial-system",
              name: "Interactive Tutorial System",
              description:
                "Contextual tutorials and guided workflows for new users",
              status: "complete",
              priority: "high",
              userImpact:
                "New users are guided through the app's complex features with interactive tours and step-by-step instructions, reducing the learning curve.",
              businessValue:
                "Improves user onboarding and long-term retention by ensuring users understand how to get the most value out of the application.",
            },
            {
              id: "dark-mode",
              name: "Dark Mode & Themes",
              description:
                "Multiple UI themes including dark mode for extended trading sessions",
              status: "planned",
              priority: "low",
              estimatedCompletion: "Q3 2025",
              userImpact:
                "Provides a more comfortable viewing experience during long trading sessions, especially in low-light environments.",
              businessValue:
                "A highly requested cosmetic feature that improves user satisfaction and demonstrates attention to user needs.",
              technicalDetails:
                "Implement a theme-switching capability using CSS variables or a styling library like Styled Components.",
            },
            {
              id: "rule-editor-ux",
              name: "Advanced Rule Editor UX",
              description:
                "Enhance the rule editor with visualization, validation, and drag-and-drop capabilities.",
              status: "planned",
              priority: "medium",
              estimatedCompletion: "Q3 2025",
              userImpact:
                "Makes creating and managing complex trading rules easier and more intuitive, reducing errors and saving time.",
              businessValue:
                "Improves the usability of a core, powerful feature, making it accessible to a wider range of users.",
              technicalDetails:
                "Integrate a library like react-beautiful-dnd for drag-and-drop functionality and build a custom validation engine for the rules.",
            },
          ],
        },
        {
          id: "integrations",
          name: "Broker & API Integrations",
          description: "External service connections and data feeds",
          icon: <ApiOutlined />,
          color: "#fa8c16",
          features: [
            {
              id: "multi-broker-sync",
              name: "Multi-Broker API Synchronization",
              description:
                "Real-time synchronization with multiple broker APIs (IBKR, TD Ameritrade, etc.)",
              status: "in-development",
              priority: "medium",
              estimatedCompletion: "Q2 2025",
              userImpact:
                "Users can connect accounts from multiple brokerages and see all their positions and trades in one unified dashboard.",
              businessValue:
                "Greatly expands the target market to users of other popular brokerages and becomes a central hub for a trader's entire portfolio.",
              technicalDetails:
                "Develop new service modules for each broker's API, handling their unique authentication and data formats. Normalize the data into a common structure.",
            },
            {
              id: "options-chain-data",
              name: "Live Options Chain Data",
              description:
                "Real-time options chain data with Greeks calculations and IV analysis",
              status: "planned",
              priority: "high",
              estimatedCompletion: "Q2 2025",
              userImpact:
                "Users can analyze potential options trades with live market data, including all Greeks (Delta, Gamma, Theta, Vega) and Implied Volatility.",
              businessValue:
                "A must-have feature for any serious options trading tool. Its absence is a major competitive disadvantage.",
              technicalDetails:
                "Subscribe to a real-time market data feed API (e.g., Polygon.io, IEX Cloud) and build a new UI component to display the options chain.",
            },
            {
              id: "news-integration",
              name: "Financial News Integration",
              description:
                "Integrated news feeds with AI-powered relevance scoring",
              status: "planned",
              priority: "medium",
              estimatedCompletion: "Q3 2025",
              userImpact:
                "Users can see relevant news for the stocks they are analyzing directly within the app, saving them from having to switch to other news sources.",
              businessValue:
                "Increases the app's stickiness by becoming a one-stop-shop for both quantitative and qualitative analysis.",
              technicalDetails:
                "Integrate with a news API (e.g., NewsAPI.org) and add a news panel to relevant pages.",
            },
          ],
        },
        {
          id: "infrastructure",
          name: "Infrastructure & Platform",
          description: "Backend improvements and platform capabilities",
          icon: <DatabaseOutlined />,
          color: "#eb2f96",
          features: [
            {
              id: "saas-infrastructure",
              name: "SaaS Infrastructure",
              description:
                "Multi-tenant SaaS platform with user management and billing",
              status: "planned",
              priority: "high",
              estimatedCompletion: "Q4 2025",
              userImpact:
                "The application will become a web-based service, allowing users to access their data securely from any device.",
              businessValue:
                "Enables monetization through subscription plans and provides the foundation for a scalable, commercial product.",
              technicalDetails:
                "Build a new backend with user authentication (e.g., using Firebase Auth or Auth0), a multi-tenant database, and integrate a payment provider like Stripe.",
            },
            {
              id: "cloud-sync",
              name: "Cloud Data Synchronization",
              description:
                "Secure cloud storage and synchronization across devices",
              status: "planned",
              priority: "medium",
              estimatedCompletion: "Q4 2025",
              dependencies: ["saas-infrastructure"],
              userImpact:
                "Users' data, settings, and trade history will be seamlessly synced across their desktop and mobile devices.",
              businessValue:
                "A critical feature for a modern SaaS application that greatly improves the user experience and data reliability.",
              technicalDetails:
                "Utilize a cloud database (e.g., Firestore, DynamoDB) and build a synchronization layer in the client applications.",
            },
            {
              id: "advanced-security",
              name: "Advanced Security Features",
              description:
                "Two-factor authentication, encryption, and security monitoring",
              status: "planned",
              priority: "high",
              estimatedCompletion: "Q3 2025",
              userImpact:
                "Users can be confident that their sensitive financial data and broker credentials are secure.",
              businessValue:
                "Builds user trust, which is paramount for a financial application, and is a prerequisite for handling sensitive data.",
              technicalDetails:
                "Integrate 2FA with the authentication provider. Implement data-at-rest and data-in-transit encryption. Set up security logging and monitoring.",
            },
          ],
        },
      ];

      const technicalDebtData = [
        {
          id: "enable-strict-mode",
          title: "Enable TypeScript Strict Mode",
          description:
            "Activate TypeScript's strict mode and resolve all resulting 'implicit any' (TS7006) and other type errors across the codebase for improved type safety.",
          priority: "high",
          effort: "Large",
          impact: "High",
        },
        {
          id: "test-coverage",
          title: "Improve Test Coverage",
          description:
            "Current test coverage is below 50%. Need comprehensive unit and integration tests for all critical services and components to prevent regressions.",
          priority: "high",
          effort: "Large",
          impact: "High",
        },
        {
          id: "refactor-data-fetching",
          title: "Refactor Data Fetching & State",
          description:
            "Replace mock data with real data fetching in components like HeatmapChart and unify state management for positions and other core data.",
          priority: "medium",
          effort: "Medium",
          impact: "High",
        },
        {
          id: "dependency-updates",
          title: "Dependency Updates",
          description:
            "Update outdated dependencies (e.g., Ant Design, React) and resolve security vulnerabilities identified by npm audit.",
          priority: "high",
          effort: "Small",
          impact: "Medium",
        },
      ];

      setTimeout(() => {
        setTasks(currentTasksData);
        setRoadmap(plannedFeaturesData);
        setDebt(technicalDebtData);
        setLoading(false);
      }, 1200);
    };

    fetchData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
      case "complete":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "critical":
        return <FireOutlined style={{ color: "#ff4d4f" }} />;
      case "in-progress":
      case "in-development":
        return <ClockCircleOutlined style={{ color: "#1890ff" }} />;
      case "testing":
        return <BugOutlined style={{ color: "#faad14" }} />;
      case "pending":
      case "planned":
        return <ExclamationCircleOutlined style={{ color: "#8c8c8c" }} />;
      case "deferred":
        return <WarningOutlined style={{ color: "#fa8c16" }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: "#8c8c8c" }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ff4d4f";
      case "medium":
        return "#faad14";
      case "low":
        return "#52c41a";
      default:
        return "#8c8c8c";
    }
  };

  const currentStats = {
    total: 54,
    completed: 30,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    deferred: 8,
  };

  const completionPercentage = Math.round(
    (currentStats.completed / currentStats.total) * 100
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Loading Project Roadmap..." />
      </div>
    );
  }

  return (
    <div className="work-items-page p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Work Items & Project Roadmap
        </h1>
        <p className="text-gray-600">
          Track development progress, upcoming features, and technical
          improvements for the Trading Helper Bot.
        </p>
      </div>

      {/* Project Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <Statistic
            title="Project Progress"
            value={completionPercentage}
            suffix="%"
            valueStyle={{ color: "#52c41a" }}
            prefix={<RocketOutlined />}
          />
          <Progress percent={completionPercentage} strokeColor="#52c41a" />
        </Card>
        <Card>
          <Statistic
            title="Active Tasks"
            value={currentStats.inProgress}
            valueStyle={{ color: "#1890ff" }}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="Completed"
            value={currentStats.completed}
            valueStyle={{ color: "#52c41a" }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="Pending"
            value={currentStats.pending}
            valueStyle={{ color: "#faad14" }}
            prefix={<ExclamationCircleOutlined />}
          />
        </Card>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane
          tab={
            <span>
              <ToolOutlined />
              Current Tasks ({currentStats.inProgress + currentStats.pending})
            </span>
          }
          key="current"
        >
          <div className="space-y-4">
            <Alert
              message="Active Development"
              description="Currently working on HMM Service UI/UX Enhancement. Next up: Comprehensive Test Suite Implementation."
              type="info"
              showIcon
              className="mb-4"
            />

            {tasks.map((task) => (
              <Card key={task.id} className="shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <h3 className="text-lg font-semibold">
                        #{task.id} - {task.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {task.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Tag color={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Tag>
                    <Tag color="blue">{task.category}</Tag>
                  </div>
                </div>

                {task.subtasks && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Subtasks:</h4>
                    <div className="space-y-2">
                      {task.subtasks.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center space-x-2 text-sm"
                        >
                          {getStatusIcon(subtask.status)}
                          <span>{subtask.id}</span>
                          <span>{subtask.title}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Progress
                        percent={Math.round(
                          (task.subtasks.filter((s) => s.status === "done")
                            .length /
                            task.subtasks.length) *
                            100
                        )}
                        size="small"
                      />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BulbOutlined />
              Planned Features
            </span>
          }
          key="planned"
        >
          <div className="space-y-6">
            <Alert
              message="Project Roadmap"
              description="This roadmap outlines our strategic direction. It details the upcoming features, their value to you, and the benefits for the platform. Priorities and timelines are subject to change based on development progress and user feedback."
              type="success"
              showIcon
              className="mb-6"
            />

            {roadmap.map((category) => (
              <Card
                key={category.id}
                className="shadow-sm"
                headStyle={{
                  backgroundColor:
                    category.id === "critical-fixes" ? "#fff1f0" : "inherit",
                }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div style={{ color: category.color, fontSize: "24px" }}>
                    {category.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{category.name}</h2>
                    <p className="text-gray-600">{category.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.features.map((feature) => (
                    <Card
                      key={feature.id}
                      size="small"
                      className="h-full flex flex-col"
                    >
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          {getStatusIcon(feature.status)}
                          <Tag color={getPriorityColor(feature.priority)}>
                            {feature.priority}
                          </Tag>
                        </div>
                        <h4 className="font-medium mb-2">{feature.name}</h4>
                        <p className="text-gray-600 text-sm mb-3">
                          {feature.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {feature.estimatedCompletion && (
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <CalendarOutlined className="mr-1" />
                            {feature.estimatedCompletion}
                          </div>
                        )}
                        <Collapse ghost expandIconPosition="right" size="small">
                          <Panel
                            header={
                              <span className="text-xs font-semibold">
                                Impact & Details
                              </span>
                            }
                            key="1"
                          >
                            <div className="text-xs space-y-3">
                              <div>
                                <h5 className="font-bold mb-1">User Impact</h5>
                                <p>{feature.userImpact}</p>
                              </div>
                              <div>
                                <h5 className="font-bold mb-1">
                                  Business Value
                                </h5>
                                <p>{feature.businessValue}</p>
                              </div>
                              {feature.technicalDetails && (
                                <div>
                                  <h5 className="font-bold mb-1">
                                    Technical Details
                                  </h5>
                                  <p>{feature.technicalDetails}</p>
                                </div>
                              )}
                            </div>
                          </Panel>
                        </Collapse>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BugOutlined />
              Technical Debt
            </span>
          }
          key="technical"
        >
          <div className="space-y-4">
            <Alert
              message="Technical Debt Overview"
              description="Areas requiring attention to improve code quality, performance, and maintainability."
              type="warning"
              showIcon
              className="mb-4"
            />

            {debt.map((item) => (
              <Card key={item.id} className="shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-600 mb-3">{item.description}</p>
                    <div className="flex space-x-4 text-sm">
                      <div>
                        <span className="font-medium">Priority: </span>
                        <Tag color={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Tag>
                      </div>
                      <div>
                        <span className="font-medium">Effort: </span>
                        <Tag color="blue">{item.effort}</Tag>
                      </div>
                      <div>
                        <span className="font-medium">Impact: </span>
                        <Tag color="green">{item.impact}</Tag>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BookOutlined />
              Release Timeline
            </span>
          }
          key="timeline"
        >
          <div className="max-w-4xl">
            <Alert
              message="Development Timeline"
              description="Planned releases and major milestones for 2025."
              type="info"
              showIcon
              className="mb-6"
            />

            <Timeline>
              <Timeline.Item
                dot={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                color="green"
              >
                <div>
                  <h3 className="font-semibold">
                    Q4 2024 - Foundation Complete
                  </h3>
                  <p className="text-gray-600">
                    **Outcome:** A stable, core product with essential trading
                    tools.
                    <br />
                    Established the foundation for position sizing, risk
                    management, and integrated the core HMM AI service. Users
                    can analyze trades and get basic AI-driven insights.
                  </p>
                  <div className="mt-2">
                    <Tag color="green">Completed</Tag>
                  </div>
                </div>
              </Timeline.Item>

              <Timeline.Item
                dot={<ClockCircleOutlined style={{ color: "#1890ff" }} />}
                color="blue"
              >
                <div>
                  <h3 className="font-semibold">
                    Q1 2025 - Stability & Enhanced Analytics
                  </h3>
                  <p className="text-gray-600">
                    **Outcome:** A more reliable and insightful application.
                    <br />
                    Focusing on fixing critical bugs, improving test coverage,
                    and integrating S&P 500 data. Users will experience fewer
                    errors and gain deeper market insights.
                  </p>
                  <div className="mt-2">
                    <Tag color="blue">In Progress</Tag>
                  </div>
                </div>
              </Timeline.Item>

              <Timeline.Item color="gray">
                <div>
                  <h3 className="font-semibold">
                    Q2 2025 - Professional-Grade Tooling
                  </h3>
                  <p className="text-gray-600">
                    **Outcome:** Transition to a professional-grade trading
                    tool.
                    <br />
                    Introducing live options chain data, multi-broker support,
                    and the advanced Kelly Criterion position sizing. The app
                    will become a central hub for serious traders.
                  </p>
                  <div className="mt-2">
                    <Tag color="orange">Planned</Tag>
                  </div>
                </div>
              </Timeline.Item>

              <Timeline.Item color="gray">
                <div>
                  <h3 className="font-semibold">
                    Q3 2025 - Enhanced User Experience
                  </h3>
                  <p className="text-gray-600">
                    **Outcome:** A more intuitive and engaging user experience.
                    <br />
                    Adding real-time alerts, dark mode, and an improved rule
                    editor. The focus is on making the powerful features of the
                    app easier and more pleasant to use.
                  </p>
                  <div className="mt-2">
                    <Tag color="orange">Planned</Tag>
                  </div>
                </div>
              </Timeline.Item>

              <Timeline.Item color="gray">
                <div>
                  <h3 className="font-semibold">
                    Q4 2025 - Launch SaaS Platform
                  </h3>
                  <p className="text-gray-600">
                    **Outcome:** A commercially viable, scalable SaaS product.
                    <br />
                    Launching the full web-based platform with user accounts,
                    billing, cloud sync, and a companion mobile app. This marks
                    the transition to a full-featured commercial service.
                  </p>
                  <div className="mt-2">
                    <Tag color="orange">Planned</Tag>
                  </div>
                </div>
              </Timeline.Item>
            </Timeline>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default WorkItemsPage;
