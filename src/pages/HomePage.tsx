import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 010 5.656l-2.828 2.828a4 4 0 01-5.656-5.656l2.828-2.828a4 4 0 015.656 0z" /><path d="M6.343 17.657l1.414-1.414" /></svg>
    ),
    title: 'Multi-Broker Import',
    desc: 'Seamlessly import and reconcile data from IBKR, Schwab, and more—CSV or API.'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18" /><rect x="7" y="7" width="3" height="9" rx="1.5" /><rect x="12" y="10" width="3" height="6" rx="1.5" /><rect x="17" y="5" width="3" height="11" rx="1.5" /></svg>
    ),
    title: 'Unified Dashboards',
    desc: 'Visualize P&L, risk, and strategy edge across all accounts in one place.'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
    ),
    title: 'Risk & Sizing Guidance',
    desc: 'Goal-driven wizards and dynamic throttle rules help you size positions like a pro.'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h6" /></svg>
    ),
    title: 'Education & Community',
    desc: 'Learn in context with embedded tutorials and join a thriving trader community.'
  },
];

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-700 to-blue-500 py-20 px-4 text-center relative">
        <div className="flex flex-col items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-blue-600 shadow-lg flex items-center justify-center mb-6 border-4 border-blue-400">
            <span className="text-4xl font-bold text-white tracking-tight">TH</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">Options Trading Analytics Platform</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8">Institutional-grade insight for every active options trader—automate multi-broker data ingest, visualize edge & risk, and master position sizing in minutes, not hours.</p>
          <div className="flex flex-wrap gap-4 justify-center mb-2">
            <Link to="/import/direct" className="px-6 py-2 rounded-full bg-white text-blue-700 font-semibold shadow hover:bg-blue-100 transition">Import Data</Link>
            <Link to="/unified-dashboard" className="px-6 py-2 rounded-full bg-white text-blue-700 font-semibold shadow hover:bg-blue-100 transition">Dashboard</Link>
            <Link to="/unified-dashboard" className="px-6 py-2 rounded-full bg-white text-blue-700 font-semibold shadow hover:bg-blue-100 transition">Goal Wizard</Link>
            <Link to="/settings" className="px-6 py-2 rounded-full bg-white text-blue-700 font-semibold shadow hover:bg-blue-100 transition">Tutorials</Link>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((f, i) => (
          <div key={i} className="bg-[#10182f] rounded-2xl shadow-lg p-8 flex flex-col items-start min-h-[220px]">
            <div className="mb-4">{f.icon}</div>
            <h2 className="text-white text-xl font-bold mb-2">{f.title}</h2>
            <p className="text-blue-100 text-base">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="flex justify-center py-12 px-4">
        <div className="w-full max-w-2xl bg-gradient-to-r from-blue-600 to-purple-500 rounded-2xl shadow-xl p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Ready to elevate your trading?</h2>
          <p className="text-blue-100 mb-6">Join thousands of traders who use our platform to gain an edge in the markets.</p>
          <Link to="/import/direct" className="inline-block px-8 py-3 bg-white text-blue-700 font-bold rounded-full shadow hover:bg-blue-100 transition text-lg">Get Started Free</Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 