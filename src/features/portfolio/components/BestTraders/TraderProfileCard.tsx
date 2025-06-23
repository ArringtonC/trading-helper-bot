import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, Award, BookOpen, Target } from 'lucide-react';
import { TraderProfile } from './types';

interface TraderProfileCardProps {
  trader: TraderProfile;
}

const TraderProfileCard: React.FC<TraderProfileCardProps> = ({ trader }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={trader.imageUrl} 
                alt={trader.name} 
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(trader.name)}&size=80&background=3b82f6&color=ffffff`;
                }}
              />
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                <Award className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{trader.name}</h2>
              <p className="text-blue-600 font-medium text-sm flex items-center">
                <Target className="w-4 h-4 mr-1" />
                {trader.philosophy}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-6 h-6 text-gray-600" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Bio Section */}
        {isExpanded && (
          <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center mb-3">
              <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Background</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">{trader.bio}</p>
          </div>
        )}

        {/* Famous Trades */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Legendary Trades</h3>
          </div>
          <div className="space-y-3">
            {trader.famousTrades.slice(0, isExpanded ? undefined : 2).map((trade, index) => (
              <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                <h4 className="font-semibold text-green-800 mb-1">{trade.title}</h4>
                <p className="text-green-700 text-sm">{trade.summary}</p>
              </div>
            ))}
            {!isExpanded && trader.famousTrades.length > 2 && (
              <p className="text-sm text-gray-500 italic">
                +{trader.famousTrades.length - 2} more trades (click to expand)
              </p>
            )}
          </div>
        </div>

        {/* Latest Picks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Current Holdings</h3>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {trader.latestPicks.length} positions
            </span>
          </div>
          <div className="grid gap-3">
            {trader.latestPicks.map((pick, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100 hover:border-blue-200 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-lg text-blue-700 tracking-wide">{pick.ticker}</span>
                    <span className="text-xs font-medium bg-blue-200 text-blue-800 px-2 py-1 rounded-full ml-2">
                      {pick.date}
                    </span>
                  </div>
                </div>
                <p className="text-blue-700 text-sm leading-relaxed group-hover:text-blue-800 transition-colors">
                  {pick.thesis}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraderProfileCard; 