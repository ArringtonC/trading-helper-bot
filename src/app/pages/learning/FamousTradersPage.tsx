import { ArrowLeft, Loader, Users, TrendingUp, Award, Search, Filter } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AutomationStatus from '../../../features/portfolio/components/BestTraders/AutomationStatus';
import BestTradersSection from '../../../features/portfolio/components/BestTraders/BestTradersSection';
import UpdateTradesButton from '../../../features/portfolio/components/BestTraders/UpdateTradesButton';
import { TraderProfile } from '../../../features/portfolio/components/BestTraders/types';
import { TraderPickAnalysis } from '../../../shared/services/SECEdgarService';

const FamousTradersPage: React.FC = () => {
  const [traders, setTraders] = useState<TraderProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAutomation, setShowAutomation] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');

  useEffect(() => {
    const fetchTraders = async () => {
      try {
        const response = await fetch('/data/traders.json');
        if (!response.ok) {
          throw new Error('Failed to fetch trader data');
        }
        const data: TraderProfile[] = await response.json();
        setTraders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTraders();
  }, []);

  const handleDataUpdated = (newPicks: TraderPickAnalysis[]) => {
    // Update the Michael Burry profile with new picks from the test
    setTraders(prevTraders => {
      const updatedTraders = [...prevTraders];
      const burryIndex = updatedTraders.findIndex(t => t.name === 'Michael Burry');
      
      if (burryIndex >= 0) {
        updatedTraders[burryIndex] = {
          ...updatedTraders[burryIndex],
          latestPicks: newPicks.map(pick => ({
            ticker: pick.ticker,
            thesis: pick.thesis,
            date: pick.date
          }))
        };
      }
      
      return updatedTraders;
    });
  };

  const filteredTraders = useMemo(() => {
    return traders.filter(trader => {
      const matchesSearch = trader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trader.philosophy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStrategy = selectedStrategy === 'all' || 
                             trader.philosophy.toLowerCase().includes(selectedStrategy.toLowerCase());
      
      return matchesSearch && matchesStrategy;
    });
  }, [traders, searchTerm, selectedStrategy]);

  const strategies = ['all', 'value', 'growth', 'contrarian', 'innovation', 'macro'];

  const stats = useMemo(() => {
    const totalTrades = traders.reduce((sum, trader) => sum + trader.famousTrades.length, 0);
    const totalPicks = traders.reduce((sum, trader) => sum + trader.latestPicks.length, 0);
    return { totalTrades, totalPicks };
  }, [traders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Famous Traders</h1>
                <p className="text-gray-600 mt-1">Learn from the masters of finance</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAutomation(!showAutomation)}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-colors flex items-center space-x-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{showAutomation ? 'Hide' : 'Show'} Live Data</span>
              </button>
              <Link 
                to="/learning"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Learning</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{traders.length}</p>
                <p className="text-gray-600 text-sm">Legendary Traders</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalTrades}</p>
                <p className="text-gray-600 text-sm">Famous Trades</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalPicks}</p>
                <p className="text-gray-600 text-sm">Current Positions</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center">
              <Award className="w-8 h-8 mr-3" />
              <div>
                <p className="text-xl font-bold">Hall of Fame</p>
                <p className="text-blue-100 text-sm">Investment Legends</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search traders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Strategy:</span>
              </div>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {strategies.map(strategy => (
                  <option key={strategy} value={strategy}>
                    {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Data Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Real-Time 13F Filings
                </h2>
                <p className="text-gray-600">
                  Get the latest SEC EDGAR filing data from institutional investors
                </p>
              </div>
              <UpdateTradesButton 
                onDataUpdated={handleDataUpdated}
                className="sm:min-w-[200px]"
              />
            </div>
          </div>
        </div>

        {/* Automation Status (collapsible) */}
        {showAutomation && (
          <div className="mb-8">
            <AutomationStatus onDataUpdated={handleDataUpdated} />
          </div>
        )}
        
        {/* Results Count */}
        {searchTerm || selectedStrategy !== 'all' ? (
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredTraders.length} of {traders.length} traders
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedStrategy !== 'all' && ` with ${selectedStrategy} strategy`}
            </p>
          </div>
        ) : null}

        {/* Trader Profiles */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin h-8 w-8 text-blue-600 mr-3" />
            <p className="text-gray-600">Loading legendary traders...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
        {!loading && !error && (
          filteredTraders.length > 0 ? (
            <BestTradersSection traders={filteredTraders} />
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No traders found matching your criteria</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStrategy('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FamousTradersPage; 