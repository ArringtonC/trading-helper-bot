import React, { useState, useCallback } from 'react';

interface AffordableStockFinderProps {
  maxBudget: number;
  onStockSelected: (stock: StockOption) => void;
}

interface StockOption {
  symbol: string;
  price: number;
  name: string;
  sector: string;
  optionVolume: 'High' | 'Medium' | 'Low';
  volatility: number;
  weeklyOptions: boolean;
  reasonForRecommendation: string;
  estimatedPremium: number;
}

const AffordableStockFinder: React.FC<AffordableStockFinderProps> = ({
  maxBudget,
  onStockSelected
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [minOptionVolume, setMinOptionVolume] = useState<string>('Medium');

  // Sample stock alternatives based on price ranges
  const getStockAlternatives = useCallback((): StockOption[] => {
    const allStocks: StockOption[] = [
      // Under $50 per share ($5,000 for 100 shares)
      {
        symbol: 'F',
        price: 12.45,
        name: 'Ford Motor Company',
        sector: 'Automotive',
        optionVolume: 'High',
        volatility: 28,
        weeklyOptions: true,
        reasonForRecommendation: 'High option volume, consistent premium income, dividend stock',
        estimatedPremium: 0.35
      },
      {
        symbol: 'BAC',
        price: 33.20,
        name: 'Bank of America',
        sector: 'Financial',
        optionVolume: 'High',
        volatility: 24,
        weeklyOptions: true,
        reasonForRecommendation: 'Large cap stability, excellent option liquidity, regular dividends',
        estimatedPremium: 0.85
      },
      {
        symbol: 'T',
        price: 16.80,
        name: 'AT&T Inc.',
        sector: 'Telecom',
        optionVolume: 'High',
        volatility: 22,
        weeklyOptions: true,
        reasonForRecommendation: 'High dividend yield, stable premiums, conservative play',
        estimatedPremium: 0.42
      },
      
      // $50-$100 per share ($5,000-$10,000 for 100 shares)
      {
        symbol: 'INTC',
        price: 78.90,
        name: 'Intel Corporation',
        sector: 'Technology',
        optionVolume: 'High',
        volatility: 32,
        weeklyOptions: true,
        reasonForRecommendation: 'Tech exposure at lower price point, good option premiums',
        estimatedPremium: 2.10
      },
      {
        symbol: 'KO',
        price: 59.30,
        name: 'Coca-Cola Company',
        sector: 'Consumer Staples',
        optionVolume: 'Medium',
        volatility: 18,
        weeklyOptions: false,
        reasonForRecommendation: 'Stable dividend aristocrat, consistent performance',
        estimatedPremium: 1.20
      },
      {
        symbol: 'PFE',
        price: 55.75,
        name: 'Pfizer Inc.',
        sector: 'Healthcare',
        optionVolume: 'High',
        volatility: 26,
        weeklyOptions: true,
        reasonForRecommendation: 'Healthcare exposure, good volatility for premiums',
        estimatedPremium: 1.45
      },
      
      // $100-$150 per share ($10,000-$15,000 for 100 shares)
      {
        symbol: 'AMD',
        price: 142.30,
        name: 'Advanced Micro Devices',
        sector: 'Technology',
        optionVolume: 'High',
        volatility: 45,
        weeklyOptions: true,
        reasonForRecommendation: 'High-growth tech with excellent option premiums, NVDA alternative',
        estimatedPremium: 4.20
      },
      {
        symbol: 'ABBV',
        price: 135.60,
        name: 'AbbVie Inc.',
        sector: 'Healthcare',
        optionVolume: 'Medium',
        volatility: 20,
        weeklyOptions: false,
        reasonForRecommendation: 'Stable pharmaceutical, good dividend coverage',
        estimatedPremium: 2.80
      },
      {
        symbol: 'COST',
        price: 128.45,
        name: 'Costco Wholesale',
        sector: 'Consumer Staples',
        optionVolume: 'Medium',
        volatility: 22,
        weeklyOptions: false,
        reasonForRecommendation: 'Defensive play, consistent growth, stable premiums',
        estimatedPremium: 2.65
      }
    ];

    // Filter by budget (100 shares)
    const budgetFiltered = allStocks.filter(stock => stock.price * 100 <= maxBudget);
    
    // Filter by sector if specified
    const sectorFiltered = selectedSector === 'all' 
      ? budgetFiltered 
      : budgetFiltered.filter(stock => stock.sector.toLowerCase() === selectedSector.toLowerCase());
    
    // Filter by minimum option volume
    const volumeFiltered = sectorFiltered.filter(stock => {
      if (minOptionVolume === 'High') return stock.optionVolume === 'High';
      if (minOptionVolume === 'Medium') return stock.optionVolume === 'High' || stock.optionVolume === 'Medium';
      return true; // Low includes all
    });

    return volumeFiltered.sort((a, b) => a.price - b.price);
  }, [maxBudget, selectedSector, minOptionVolume]);

  const stockOptions = getStockAlternatives();

  const calculateReturnEstimate = (stock: StockOption) => {
    const investment = stock.price * 100;
    const monthlyPremium = stock.estimatedPremium * 100;
    const monthlyReturn = (monthlyPremium / investment) * 100;
    return monthlyReturn;
  };

  const getBudgetMessage = () => {
    if (maxBudget < 5000) {
      return {
        level: 'warning',
        message: 'With under $5,000, consider building your account before covered calls. Focus on learning with paper trading.',
        recommendation: 'Target: $5,000+ for safer covered call strategies'
      };
    }
    if (maxBudget < 10000) {
      return {
        level: 'caution',
        message: 'Good starting budget for covered calls. Focus on stable, high-volume stocks.',
        recommendation: 'Prioritize: High option volume and lower volatility'
      };
    }
    return {
      level: 'good',
      message: 'Excellent budget for diverse covered call strategies.',
      recommendation: 'Consider: Multiple positions across different sectors'
    };
  };

  const budgetInfo = getBudgetMessage();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">
        🔍 Find Affordable Stock Alternatives
      </h3>
      
      <div className="mb-6">
        <div className={`p-4 rounded-lg border ${
          budgetInfo.level === 'warning' ? 'bg-red-50 border-red-200' :
          budgetInfo.level === 'caution' ? 'bg-yellow-50 border-yellow-200' :
          'bg-green-50 border-green-200'
        }`}>
          <h4 className={`font-semibold mb-2 ${
            budgetInfo.level === 'warning' ? 'text-red-800' :
            budgetInfo.level === 'caution' ? 'text-yellow-800' :
            'text-green-800'
          }`}>
            Budget Analysis: ${maxBudget.toLocaleString()}
          </h4>
          <p className={`text-sm mb-2 ${
            budgetInfo.level === 'warning' ? 'text-red-700' :
            budgetInfo.level === 'caution' ? 'text-yellow-700' :
            'text-green-700'
          }`}>
            {budgetInfo.message}
          </p>
          <p className={`text-xs font-medium ${
            budgetInfo.level === 'warning' ? 'text-red-600' :
            budgetInfo.level === 'caution' ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            💡 {budgetInfo.recommendation}
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Sector
          </label>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sectors</option>
            <option value="technology">Technology</option>
            <option value="financial">Financial</option>
            <option value="healthcare">Healthcare</option>
            <option value="consumer staples">Consumer Staples</option>
            <option value="automotive">Automotive</option>
            <option value="telecom">Telecom</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Option Volume
          </label>
          <select
            value={minOptionVolume}
            onChange={(e) => setMinOptionVolume(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="High">High Volume Only</option>
            <option value="Medium">Medium+ Volume</option>
            <option value="Low">Any Volume</option>
          </select>
        </div>
      </div>

      {/* Stock Options Grid */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800">
          Recommended Alternatives ({stockOptions.length} found)
        </h4>
        
        {stockOptions.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p className="text-gray-600 mb-2">No stocks found matching your criteria.</p>
            <p className="text-sm text-gray-500">
              Try increasing your budget or reducing filter restrictions.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {stockOptions.map((stock) => (
              <div
                key={stock.symbol}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="text-lg font-semibold text-gray-900">
                      {stock.symbol} - {stock.name}
                    </h5>
                    <p className="text-sm text-gray-600">{stock.sector}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      ${stock.price}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${(stock.price * 100).toLocaleString()} for 100 shares
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">Option Volume</div>
                    <div className={`text-sm font-medium ${
                      stock.optionVolume === 'High' ? 'text-green-600' :
                      stock.optionVolume === 'Medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {stock.optionVolume}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Volatility</div>
                    <div className="text-sm font-medium">{stock.volatility}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Weekly Options</div>
                    <div className="text-sm font-medium">
                      {stock.weeklyOptions ? '✅ Yes' : '❌ No'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Est. Monthly Return</div>
                    <div className="text-sm font-medium text-green-600">
                      {calculateReturnEstimate(stock).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded mb-3">
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    Why This Stock Works:
                  </div>
                  <div className="text-sm text-blue-700">
                    {stock.reasonForRecommendation}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Est. Premium: <span className="font-medium">${stock.estimatedPremium}</span> per share
                  </div>
                  <button
                    onClick={() => onStockSelected(stock)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Use This Stock →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {stockOptions.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-semibold text-gray-800 mb-2">💡 Pro Tips for Lower-Priced Stocks:</h5>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Start with high-volume stocks</strong> for better option liquidity</li>
            <li>• <strong>Focus on 30-45 day expirations</strong> for optimal time decay</li>
            <li>• <strong>Sell calls 5-10% out-of-the-money</strong> for good premium vs assignment risk</li>
            <li>• <strong>Consider diversifying</strong> across 2-3 different stocks if budget allows</li>
            <li>• <strong>Track earnings dates</strong> to avoid unexpected volatility</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AffordableStockFinder; 