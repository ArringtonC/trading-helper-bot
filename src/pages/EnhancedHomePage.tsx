import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

// Enhanced feature set with more comprehensive descriptions
const primaryFeatures = [
  {
    icon: (
      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M13.828 10.172a4 4 0 010 5.656l-2.828 2.828a4 4 0 01-5.656-5.656l2.828-2.828a4 4 0 015.656 0z" />
        <path d="M6.343 17.657l1.414-1.414" />
      </svg>
    ),
    title: 'Multi-Broker Import',
    desc: 'Seamlessly import and reconcile data from IBKR, Schwab, and more—CSV or API.',
    benefits: ['Automated data parsing', 'Real-time sync', 'Error handling'],
    cta: { text: 'Import Data', link: '/import/direct' }
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 3v18h18" />
        <rect x="7" y="7" width="3" height="9" rx="1.5" />
        <rect x="12" y="10" width="3" height="6" rx="1.5" />
        <rect x="17" y="5" width="3" height="11" rx="1.5" />
      </svg>
    ),
    title: 'Unified Dashboards',
    desc: 'Visualize P&L, risk, and strategy edge across all accounts in one place.',
    benefits: ['Real-time metrics', 'Custom alerts', 'Multi-timeframe views'],
    cta: { text: 'View Dashboard', link: '/unified-dashboard' }
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: 'Risk & Sizing Guidance',
    desc: 'Goal-driven wizards and dynamic throttle rules help you size positions like a pro.',
    benefits: ['AI-powered sizing', 'Risk optimization', 'Goal tracking'],
    cta: { text: 'Start Wizard', link: '/goal-sizing' }
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h10M7 12h6" />
      </svg>
    ),
    title: 'Education & Community',
    desc: 'Learn in context with embedded tutorials and join a thriving trader community.',
    benefits: ['Interactive tutorials', 'Best practices', 'Community insights'],
    cta: { text: 'Learn More', link: '/education' }
  },
];

// Getting started steps
const gettingStartedSteps = [
  {
    step: 1,
    title: 'Import Your Data',
    description: 'Connect your broker accounts or upload CSV files to get started.',
    icon: '📊',
    estimatedTime: '2 minutes'
  },
  {
    step: 2,
    title: 'Set Your Goals',
    description: 'Define your trading objectives and risk tolerance preferences.',
    icon: '🎯',
    estimatedTime: '5 minutes'
  },
  {
    step: 3,
    title: 'Analyze & Optimize',
    description: 'Use our advanced analytics to optimize your trading strategy.',
    icon: '⚡',
    estimatedTime: 'Ongoing'
  }
];

// Testimonials/social proof (placeholder for future)
const socialProofStats = [
  { label: 'Active Traders', value: '2,500+' },
  { label: 'Trades Analyzed', value: '500K+' },
  { label: 'Average ROI Improvement', value: '23%' },
  { label: 'Time Saved Per Week', value: '4 hours' }
];

const EnhancedHomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Hero Section */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-purple-600 py-20 px-4 text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-400 rounded-full opacity-10 animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center max-w-4xl mx-auto">
          {/* Enhanced Logo */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-2xl flex items-center justify-center mb-8 border-4 border-white border-opacity-20">
            <span className="text-5xl font-bold text-white tracking-tight">TH</span>
          </div>
          
          {/* Enhanced Title */}
          <Badge className="mb-4 bg-white bg-opacity-20 text-white border-white border-opacity-30">
            Professional Options Analytics Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg leading-tight">
            Master Your Options Trading
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8 leading-relaxed">
            Institutional-grade insights for every active options trader. Automate multi-broker data ingestion, 
            visualize edge & risk, and master position sizing in minutes, not hours.
          </p>
          
          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link 
              to="/import/direct" 
              className="px-8 py-4 rounded-full bg-white text-blue-700 font-bold shadow-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 text-lg"
            >
              Get Started Free
            </Link>
            <Link 
              to="/unified-dashboard" 
              className="px-8 py-4 rounded-full bg-transparent text-white font-bold border-2 border-white hover:bg-white hover:text-blue-700 transition-all duration-300 text-lg"
            >
              View Demo Dashboard
            </Link>
          </div>
          
          {/* Quick Navigation */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/goal-sizing" className="px-4 py-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition">
              Position Sizing
            </Link>
            <Link to="/weekend-gap-risk" className="px-4 py-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition">
              Risk Analysis
            </Link>
            <Link to="/tutorials" className="px-4 py-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition">
              Learn & Tutorials
            </Link>
            <Link to="/settings" className="px-4 py-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition">
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-white py-12 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {socialProofStats.map((stat, i) => (
              <div key={i} className="flex flex-col">
                <div className="text-3xl font-bold text-blue-700 mb-2">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your trading approach with our step-by-step onboarding process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {gettingStartedSteps.map((step, i) => (
              <Card key={i} className="p-8 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {step.estimatedTime}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Feature Cards */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Professional Traders
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to analyze, optimize, and execute your options strategies
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {primaryFeatures.map((feature, i) => (
              <Card key={i} className="p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 mb-4">{feature.desc}</p>
                    <ul className="space-y-1 mb-4">
                      {feature.benefits.map((benefit, j) => (
                        <li key={j} className="text-sm text-gray-500 flex items-center">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <Link 
                      to={feature.cta.link}
                      className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors"
                    >
                      {feature.cta.text}
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Call to Action */}
      <div className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of traders who have elevated their options strategies with our platform. 
            Start your journey to smarter, more profitable trading today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link 
              to="/import/direct" 
              className="px-8 py-4 bg-white text-blue-700 font-bold rounded-full shadow-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 text-lg"
            >
              Start Free Trial
            </Link>
            <Link 
              to="/education" 
              className="px-8 py-4 bg-transparent text-white font-bold border-2 border-white rounded-full hover:bg-white hover:text-blue-700 transition-all duration-300 text-lg"
            >
              Learn More
            </Link>
          </div>
          
          <div className="text-blue-200 text-sm">
            No credit card required • 30-day free trial • Cancel anytime
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-gray-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><Link to="/unified-dashboard" className="text-gray-400 hover:text-white transition">Dashboard</Link></li>
                <li><Link to="/import/direct" className="text-gray-400 hover:text-white transition">Import Data</Link></li>
                <li><Link to="/weekend-gap-risk" className="text-gray-400 hover:text-white transition">Risk Analysis</Link></li>
                <li><Link to="/goal-sizing" className="text-gray-400 hover:text-white transition">Position Sizing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Education</h4>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">Learn</h4>
                <ul className="space-y-2">
                  <li><Link to="/tutorial" className="text-base text-gray-300 hover:text-white">Interactive Tutorial</Link></li>
                  <li><Link to="/educational-dashboard" className="text-base text-gray-300 hover:text-white">Educational Center</Link></li>
                </ul>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Tools</h4>
              <ul className="space-y-2">
                <li><Link to="/visualizer" className="text-gray-400 hover:text-white transition">Strategy Visualizer</Link></li>
                <li><Link to="/analysis" className="text-gray-400 hover:text-white transition">AI Analysis</Link></li>
                <li><Link to="/rule-engine-demo" className="text-gray-400 hover:text-white transition">Rule Engine</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/settings" className="text-gray-400 hover:text-white transition">Settings</Link></li>
                <li><button className="text-gray-400 hover:text-white transition text-left">Help Center</button></li>
                <li><button className="text-gray-400 hover:text-white transition text-left">Contact Support</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Trading Helper Bot. All rights reserved. • Demo Version</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedHomePage; 