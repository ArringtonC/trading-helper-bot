import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle,
  Database,
  ExternalLink,
  HelpCircle,
  Info,
  LineChart,
  Rocket,
  Sparkles,
  Star,
  Target,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface PageGuide {
  id: string;
  title: string;
  path: string;
  icon: any;
  category: string;
  description: string;
  keyFeatures: string[];
  howToUse: string[];
  tips: string[];
  prerequisites?: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
}

const pageGuides: PageGuide[] = [
  {
    id: "hmm-analysis",
    title: "HMM Regime Prediction & AI Trade Analysis",
    path: "/analysis",
    icon: Brain,
    category: "AI & Machine Learning",
    description:
      "Advanced Hidden Markov Model for market regime prediction, VIX integration, and ML-powered trade insights.",
    keyFeatures: [
      "Hidden Markov Model training on your trade data",
      "Market regime prediction (High/Medium/Low volatility)",
      "VIX integration for enhanced accuracy",
      "Future regime predictions (2-week forecasts)",
      "Real-time regime visualization",
      "ML ensemble models for trade recommendations",
      "Trade pattern recognition and insights",
    ],
    howToUse: [
      '1. Navigate to "/analysis" from the AI & ML section',
      "2. Ensure HMM service is running (green status indicator)",
      "3. Configure analysis inputs: Symbol (default: SPY), Date range",
      "4. Optional: Upload trade data CSV or market data files",
      "5. Toggle VIX integration for enhanced predictions",
      '6. Click "Train HMM Model" to analyze historical patterns',
      '7. Use "🔮 Predict Next 2 Weeks" for future regime forecasts',
      '8. Click "📊 Evaluate VIX Impact" to measure improvement',
      "9. Review regime visualizations and probability charts",
      "10. Export results or integrate with other tools",
    ],
    tips: [
      "Ensure HMM service is running: cd hmm-service && python3 app.py",
      "Use at least 30 days of trade data for better accuracy",
      "VIX integration typically improves prediction accuracy by 2-15%",
      "High volatility regimes suggest defensive strategies",
      "Low volatility regimes may favor momentum strategies",
      "Check statistical significance in evaluation results",
      "Combine with other technical indicators for best results",
    ],
    prerequisites: [
      "Basic understanding of volatility",
      "Some trading experience",
    ],
    difficulty: "Advanced",
    estimatedTime: "15-30 minutes",
  },
  {
    id: "quick-picks",
    title: "Quick Picks - Get 5 Best Stocks",
    path: "/quick-picks",
    icon: Rocket,
    category: "Stock Picking",
    description:
      "AI-powered stock selection to instantly get the 5 best stocks tailored to your investment goals.",
    keyFeatures: [
      "AI-driven stock analysis and ranking",
      "Personalized recommendations based on goals",
      "Real-time market data integration",
      "Risk-adjusted returns calculation",
      "Sector diversification optimization",
    ],
    howToUse: [
      '1. Click "🚀 Quick Picks" from the Stocks section',
      "2. Select your investment timeline (short/medium/long term)",
      "3. Choose risk tolerance (Conservative/Moderate/Aggressive)",
      "4. Set investment amount or percentage allocation",
      "5. Review the 5 recommended stocks with rationale",
      "6. Click on individual stocks for detailed analysis",
      "7. Add promising stocks to your watchlist",
      '8. Use the "Export" feature to save recommendations',
    ],
    tips: [
      "Update your risk profile regularly as markets change",
      "Consider the correlation between recommended stocks",
      "Review the reasoning behind each recommendation",
      "Combine with technical analysis for entry timing",
      "Set stop-losses based on your risk tolerance",
    ],
    difficulty: "Beginner",
    estimatedTime: "5-10 minutes",
  },
  {
    id: "position-sizing",
    title: "Position Sizing Tool",
    path: "/position-sizing",
    icon: Target,
    category: "Risk Management",
    description:
      "Calculate optimal position sizes based on your account size, risk tolerance, and trading strategy.",
    keyFeatures: [
      "Kelly Criterion calculations",
      "Risk-based position sizing",
      "Account percentage risk management",
      "Multiple position sizing models",
      "Interactive calculators and visualizations",
    ],
    howToUse: [
      "1. Enter your total account value",
      "2. Set your maximum risk per trade (typically 1-2%)",
      "3. Input the stock price and your stop-loss level",
      "4. Review the calculated position size",
      "5. Adjust parameters to see different scenarios",
      "6. Save your preferred settings for future use",
    ],
    tips: [
      "Never risk more than 2% of your account on a single trade",
      "Consider correlation between positions",
      "Adjust position sizes based on market volatility",
      "Keep detailed records of your position sizing decisions",
    ],
    difficulty: "Beginner",
    estimatedTime: "5-15 minutes",
  },
  {
    id: "options-database",
    title: "Options Database",
    path: "/options",
    icon: Database,
    category: "Options Trading",
    description:
      "Comprehensive options trading database with strategy analysis, Greeks calculations, and trade tracking.",
    keyFeatures: [
      "Options chain analysis",
      "Greeks calculations (Delta, Gamma, Theta, Vega)",
      "Strategy payoff diagrams",
      "Historical options data",
      "Trade entry and exit tracking",
    ],
    howToUse: [
      "1. Navigate to the Options section",
      "2. Search for your target stock symbol",
      "3. Select expiration date and strike prices",
      "4. Analyze the Greeks and implied volatility",
      "5. Use strategy builder for complex trades",
      "6. Record your trades for tracking",
    ],
    tips: [
      "Focus on high-volume options for better liquidity",
      "Pay attention to implied volatility percentiles",
      "Consider time decay (Theta) in your strategy",
      "Use paper trading to practice before risking capital",
    ],
    difficulty: "Intermediate",
    estimatedTime: "10-20 minutes",
  },
  {
    id: "sp500-analysis",
    title: "Market Data & Analysis",
    path: "/sp500-demo",
    icon: LineChart,
    category: "Market Analysis",
    description:
      "Real-time S&P 500 analysis with news integration, technical indicators, and market insights.",
    keyFeatures: [
      "Real-time S&P 500 charts",
      "Technical indicator overlays",
      "Market news integration",
      "Sector performance analysis",
      "Economic calendar events",
    ],
    howToUse: [
      "1. Access from the Stocks section",
      "2. Select timeframe for analysis (1D, 1W, 1M, 1Y)",
      "3. Add technical indicators as needed",
      "4. Review current market news and events",
      "5. Analyze sector rotations and trends",
      "6. Export charts for further analysis",
    ],
    tips: [
      "Check multiple timeframes for complete picture",
      "Correlate news events with price movements",
      "Use sector analysis for stock picking ideas",
      "Monitor economic calendar for volatility events",
    ],
    difficulty: "Beginner",
    estimatedTime: "10-15 minutes",
  },
  {
    id: "import-analyze",
    title: "Import & Analyze",
    path: "/import-analyze",
    icon: BarChart3,
    category: "Data Import",
    description:
      "Import trade data from brokers, analyze performance, and get AI-powered insights and recommendations.",
    keyFeatures: [
      "Multi-broker CSV import support",
      "Automated trade classification",
      "Performance analytics and metrics",
      "AI-powered trade insights",
      "Risk analysis and recommendations",
    ],
    howToUse: [
      "1. Export trade data from your broker as CSV",
      "2. Navigate to Import & Analyze section",
      "3. Drag and drop your CSV file",
      "4. Review and confirm data mapping",
      "5. Let AI analyze your trading patterns",
      "6. Review performance metrics and insights",
      "7. Implement suggested improvements",
    ],
    tips: [
      "Ensure CSV includes all required fields (date, symbol, quantity, price)",
      "Clean up any formatting issues before import",
      "Regular analysis helps identify improving patterns",
      "Use insights to refine your trading strategy",
    ],
    prerequisites: ["Trade data from broker", "Basic spreadsheet knowledge"],
    difficulty: "Beginner",
    estimatedTime: "15-25 minutes",
  },
];

const categoryColors: Record<string, string> = {
  "AI & Machine Learning": "bg-pink-100 text-pink-800",
  "Stock Picking": "bg-green-100 text-green-800",
  "Risk Management": "bg-blue-100 text-blue-800",
  "Options Trading": "bg-purple-100 text-purple-800",
  "Market Analysis": "bg-orange-100 text-orange-800",
  "Data Import": "bg-gray-100 text-gray-800",
  Learning: "bg-indigo-100 text-indigo-800",
};

const difficultyColors: Record<string, string> = {
  Beginner: "bg-green-100 text-green-800",
  Intermediate: "bg-yellow-100 text-yellow-800",
  Advanced: "bg-red-100 text-red-800",
};

const HowToPage: React.FC = () => {
  const [selectedGuide, setSelectedGuide] = useState<PageGuide | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    ...Array.from(new Set(pageGuides.map((guide) => guide.category))),
  ];

  const filteredGuides = pageGuides.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg">
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  HOW TO Guide
                </h1>
                <p className="text-sm text-gray-600">
                  Complete guide to all features and functionalities
                </p>
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span>Back to Home</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Start Section */}
        <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Rocket className="h-6 w-6 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Getting Started
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">
                  1. New to Trading?
                </h3>
              </div>
              <p className="text-green-700 text-sm mb-3">
                Start with learning and basic tools
              </p>
              <Link
                to="/tutorial"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Begin Interactive Tutorial →
              </Link>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  2. Have Trade Data?
                </h3>
              </div>
              <p className="text-blue-700 text-sm mb-3">
                Import and analyze your existing trades
              </p>
              <Link
                to="/import-analyze"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Import Your Data →
              </Link>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">
                  3. Ready for AI?
                </h3>
              </div>
              <p className="text-purple-700 text-sm mb-3">
                Use advanced ML and HMM predictions
              </p>
              <Link
                to="/analysis"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Try HMM Analysis →
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Guides Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {filteredGuides.map((guide) => {
            const IconComponent = guide.icon;
            return (
              <div
                key={guide.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <IconComponent className="h-6 w-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {guide.title}
                        </h3>
                        <Link
                          to={guide.path}
                          className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                        >
                          Open Feature →
                        </Link>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          categoryColors[guide.category]
                        }`}
                      >
                        {guide.category}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          difficultyColors[guide.difficulty]
                        }`}
                      >
                        {guide.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4">
                    {guide.description}
                  </p>

                  {/* Key Features */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      Key Features
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {guide.keyFeatures.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {guide.keyFeatures.length > 3 && (
                        <li className="text-xs text-gray-500">
                          +{guide.keyFeatures.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span>⏱️ {guide.estimatedTime}</span>
                    <button
                      onClick={() => setSelectedGuide(guide)}
                      className="text-teal-600 hover:text-teal-700 font-medium"
                    >
                      View Full Guide
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Guide Modal */}
        {selectedGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <selectedGuide.icon className="h-6 w-6 text-teal-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedGuide.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedGuide(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  {/* Description & Meta */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 mb-3">
                      {selectedGuide.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center space-x-1">
                        <Target className="h-4 w-4 text-gray-500" />
                        <span>Difficulty: {selectedGuide.difficulty}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>⏱️</span>
                        <span>Time: {selectedGuide.estimatedTime}</span>
                      </span>
                      <Link
                        to={selectedGuide.path}
                        className="flex items-center space-x-1 text-teal-600 hover:text-teal-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open Feature</span>
                      </Link>
                    </div>
                  </div>

                  {/* Prerequisites */}
                  {selectedGuide.prerequisites && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                        Prerequisites
                      </h3>
                      <ul className="text-gray-600 space-y-1">
                        {selectedGuide.prerequisites.map((prereq, index) => (
                          <li key={index} className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                            {prereq}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* How to Use */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
                      Step-by-Step Guide
                    </h3>
                    <ol className="space-y-2">
                      {selectedGuide.howToUse.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                            {index + 1}
                          </span>
                          <span className="text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Tips */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                      Pro Tips
                    </h3>
                    <ul className="space-y-2">
                      {selectedGuide.tips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <Zap className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Features */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Star className="h-5 w-5 text-purple-500 mr-2" />
                      All Features
                    </h3>
                    <div className="grid md:grid-cols-2 gap-2">
                      {selectedGuide.keyFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HowToPage;
