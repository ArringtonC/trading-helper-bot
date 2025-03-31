import React from 'react';

const Futures: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Futures Module</h1>
      
      <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
        <h2 className="text-xl font-medium text-gray-800 mb-2">Coming Soon</h2>
        <p className="text-gray-600 mb-4">
          The Futures Trading module with scenario bots will be available in a future update.
        </p>
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
          <span className="text-4xl text-gray-400">🔜</span>
        </div>
      </div>
    </div>
  );
};

export default Futures; 