import {
    Activity,
    BarChart3,
    BookOpen,
    Brain,
    Calculator,
    ChevronRight,
    Compass,
    Database,
    DollarSign,
    GraduationCap,
    LineChart,
    PieChart,
    Rocket,
    Settings,
    Shield,
    Sparkles,
    Star,
    Target,
    TrendingUp,
    Zap
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

// Trading tool categories with their tools
const tradingCategories = [
  {
    id: 'stocks',
    title: 'Stocks',
    icon: TrendingUp,
    theme: 'green',
    gradient: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    tools: [
      { name: '🚀 Quick Picks - Get 5 Best Stocks', path: '/quick-picks', icon: Rocket },
      { name: 'Market Data & Analysis', path: '/sp500-demo', icon: LineChart },
      { name: 'AI Stock Screener', path: '/advanced-screening', icon: Sparkles },
      { name: 'Curated Stock Lists', path: '/curated-lists', icon: Target },
      { name: 'Template Matching', path: '/template-matching', icon: Compass },
      { name: 'My Watchlist', path: '/watchlist', icon: Star },
      { name: 'Professional Terminal', path: '/sp500-professional', icon: Activity }
    ]
  },
  {
    id: 'options',
    title: 'Options',
    icon: Calculator,
    theme: 'purple',
    gradient: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    tools: [
      { name: 'Options Database', path: '/options', icon: Database },
      { name: 'Strategy Visualizer', path: '/visualizer', icon: PieChart },
      { name: 'AI Trade Analysis', path: '/analysis', icon: Brain },
      { name: 'Interactive Analytics', path: '/interactive-analytics', icon: BarChart3 },
      { name: 'Trade Screener', path: '/trade-screener', icon: Zap }
    ]
  },
  {
    id: 'management',
    title: 'Risk & Position Management',
    icon: Shield,
    theme: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    tools: [
      { name: 'Position Sizing Tool', path: '/position-sizing', icon: Target },
      { name: 'Goal Sizing Wizard', path: '/goal-sizing', icon: Compass },
      { name: 'Risk Management', path: '/risk-management', icon: Shield },
      { name: 'Weekend Gap Risk', path: '/weekend-gap-risk', icon: Activity },
      { name: 'Account Classification', path: '/account-classification', icon: Settings }
    ]
  },
  {
    id: 'futures',
    title: 'Futures & Advanced',
    icon: BarChart3,
    theme: 'orange',
    gradient: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    tools: [
      { name: 'MES Futures Tutorial', path: '/mes-futures-tutorial', icon: BookOpen },
      { name: 'P&L Dashboard', path: '/pl-dashboard', icon: DollarSign },
      { name: 'Unified Dashboard', path: '/unified-dashboard', icon: BarChart3 },
      { name: 'Broker Sync', path: '/broker-sync', icon: Database },
      { name: 'IBKR API Demo', path: '/ibkr-api-demo', icon: Settings }
    ]
  },
  {
    id: 'learning',
    title: 'Learning & Tools',
    icon: GraduationCap,
    theme: 'indigo',
    gradient: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    tools: [
      { name: 'Interactive Tutorial', path: '/tutorial', icon: GraduationCap },
      { name: 'Trading Tutorials', path: '/tutorials', icon: BookOpen },
      { name: 'Famous Traders', path: '/learning/famous-traders', icon: Star },
      { name: 'Psychology Simulator', path: '/psychological-trading', icon: Brain },
      { name: 'Educational Dashboard', path: '/education', icon: Sparkles },
      { name: 'Assessment Test', path: '/assessment-test', icon: Target }
    ]
  },
  {
    id: 'setup',
    title: 'Import & Setup',
    icon: Database,
    theme: 'gray',
    gradient: 'from-gray-500 to-slate-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    tools: [
      { name: 'Direct Import', path: '/import/direct', icon: Database },
      { name: 'Import Analysis', path: '/import-analyze', icon: BarChart3 },
      { name: 'Import to Database', path: '/import', icon: Settings },
      { name: 'Settings', path: '/settings', icon: Settings },
      { name: 'Validation Dashboard', path: '/validation-dashboard', icon: Shield }
    ]
  }
];

const CategoryCard: React.FC<{
  category: typeof tradingCategories[0];
}> = ({ category }) => {
  const IconComponent = category.icon;
  
  return (
    <div className={`${category.bgColor} ${category.borderColor} border-2 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group`}>
      {/* Header Section */}
      <div className={`bg-gradient-to-r ${category.gradient} p-6 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative z-10 flex items-center space-x-3">
          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
            <IconComponent className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">{category.title}</h3>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white bg-opacity-5 rounded-full"></div>
      </div>
      
      {/* Content Section */}
      <div className="p-6 bg-white">
        <div className="space-y-3">
          {category.tools.map((tool, index) => {
            const ToolIcon = tool.icon;
            return (
              <Link
                key={index}
                to={tool.path}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group/tool"
              >
                <div className={`p-1.5 rounded-md bg-gradient-to-r ${category.gradient} bg-opacity-10`}>
                  <ToolIcon className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-gray-700 font-medium flex-1 group-hover/tool:text-gray-900">
                  {tool.name}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover/tool:opacity-100 transition-opacity duration-200" />
              </Link>
            );
          })}
        </div>
        
        {/* Open Category Button */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link
            to={category.tools[0]?.path || '/'}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r ${category.gradient} text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105`}
          >
            <span>Open {category.title}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const EnhancedHomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Trading Helper Bot</h1>
            </div>
            <Link
              to="/"
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <span className="text-gray-700 font-medium">Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 via-purple-600 to-blue-800 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white rounded-full opacity-5"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Professional Trading Tools
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8 leading-relaxed">
            Discover powerful tools organized by category. From learning basics to advanced analytics, 
            everything you need for successful trading.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/tutorial"
              className="px-8 py-4 bg-white text-blue-700 rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Start Learning
            </Link>
            <Link
              to="/position-sizing"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold hover:bg-white hover:text-blue-700 transition-all duration-300"
            >
              Try Position Sizing
            </Link>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Trading Tools
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore our comprehensive suite of tools, from market analysis to risk management, 
            designed to elevate your trading strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tradingCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </main>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-16 mt-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20">
            <h4 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Trading?
            </h4>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join thousands of traders using our professional-grade tools to improve their performance and manage risk effectively.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/import/direct"
                className="inline-flex items-center px-8 py-4 bg-white text-indigo-700 rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Database className="h-5 w-5 mr-2" />
                Import Your Data
              </Link>
              <Link
                to="/goal-sizing"
                className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold hover:bg-white hover:text-indigo-700 transition-all duration-300"
              >
                <Target className="h-5 w-5 mr-2" />
                Set Your Goals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Trading Helper Bot - Professional Trading Tools & Education
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedHomePage; 