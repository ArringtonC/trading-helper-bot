import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/Badge';
import { 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Target, 
  Star,
  Plus,
  ArrowRight,
  CheckCircle,
  PieChart,
  Calculator,
  Wallet,
  Info
} from 'lucide-react';
import AccountBasedStockPicker from '../../../shared/services/AccountBasedRecommendations';
import WatchlistService from '../../../shared/services/WatchlistService';

interface StockRecommendation {
  symbol: string;
  name: string;
  price: number;
  targetAllocation: number;
  positionSize: number;
  shares: number;
  rationale: string;
  riskLevel: 'low' | 'medium' | 'high';
  sector: string;
  marketCap: number;
  beta: number;
  dividend?: number;
  yearlyReturn?: number;
}

interface PortfolioRecommendation {
  stocks: StockRecommendation[];
  totalInvestment: number;
  cashReserve: number;
  riskProfile: string;
  diversificationScore: number;
  expectedReturn: number;
  maxDrawdown: number;
}

interface EqualPortfolioAllocation {
  symbol: string;
  name: string;
  price: number;
  equalInvestment: number;
  shares: number;
}

const StockSelectionLanding = () => {
  const [accountValue, setAccountValue] = useState<string>('');
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [recommendations, setRecommendations] = useState<PortfolioRecommendation | null>(null);
  const [equalPortfolio, setEqualPortfolio] = useState<EqualPortfolioAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
  const [addedToWatchlist, setAddedToWatchlist] = useState<string[]>([]);

  const stockPicker = new AccountBasedStockPicker();

  const buildEqualPortfolio = (stocks: StockRecommendation[], totalAccountValue: number) => {
    const investableAmount = totalAccountValue * 0.8; // Reserve 20% for cash
    const equalInvestmentPerStock = investableAmount / 5;

    return stocks.map(stock => {
      const shares = Math.floor(equalInvestmentPerStock / stock.price);
      const actualInvestment = shares * stock.price;
      
      return {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        equalInvestment: actualInvestment,
        shares: shares
      };
    });
  };

  const getRiskToleranceExplanation = (tolerance: string) => {
    switch (tolerance) {
      case 'conservative':
        return 'Focus on stable, dividend-paying stocks with lower volatility. Prioritizes capital preservation over growth.';
      case 'moderate':
        return 'Balanced mix of growth and stability. Moderate volatility with steady returns over time.';
      case 'aggressive':
        return 'Growth-focused stocks with higher potential returns but increased volatility and risk.';
      default:
        return '';
    }
  };

  const handleGetRecommendations = async () => {
    const value = parseFloat(accountValue);
    if (!value || value < 1000) {
      alert('Please enter an account value of at least $1,000');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const portfolio = stockPicker.getTop5Stocks(value, riskTolerance);
      setRecommendations(portfolio);
      
      const equalPortfolioData = buildEqualPortfolio(portfolio.stocks, value);
      setEqualPortfolio(equalPortfolioData);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllToWatchlist = async () => {
    if (!recommendations) return;
    
    setAddingAll(true);
    try {
      const added: string[] = [];
      
      for (const stock of recommendations.stocks) {
        if (!WatchlistService.isInWatchlist(stock.symbol)) {
          WatchlistService.addStock({
            symbol: stock.symbol,
            name: stock.name,
            price: stock.price,
            source: 'manual',
            riskLevel: stock.riskLevel,
            category: stock.sector
          });
          added.push(stock.symbol);
        }
      }
      
      setAddedToWatchlist(prev => [...prev, ...added]);
    } catch (error) {
      console.error('Failed to add stocks to watchlist:', error);
    } finally {
      setAddingAll(false);
    }
  };

  const handleAddSingleStock = (stock: StockRecommendation) => {
    if (!WatchlistService.isInWatchlist(stock.symbol)) {
      WatchlistService.addStock({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        source: 'manual',
        riskLevel: stock.riskLevel,
        category: stock.sector
      });
      setAddedToWatchlist(prev => [...prev, stock.symbol]);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const accountInfo = accountValue ? stockPicker.getAccountTierInfo(parseFloat(accountValue)) : null;
  const totalEqualInvestment = equalPortfolio.reduce((sum, stock) => sum + stock.equalInvestment, 0);
  const cashReserve = accountValue ? parseFloat(accountValue) - totalEqualInvestment : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Build Your Perfect Stock Portfolio
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get 5 research-backed stocks with exact dollar amounts to invest in each one.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Account Value
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    placeholder="e.g., 25000"
                    value={accountValue}
                    onChange={(e) => setAccountValue(e.target.value)}
                    className="pl-10 text-lg flex h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    min="1000"
                    step="1000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Risk Tolerance
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['conservative', 'moderate', 'aggressive'] as const).map((risk) => (
                    <Button
                      key={risk}
                      variant={riskTolerance === risk ? 'default' : 'outline'}
                      onClick={() => setRiskTolerance(risk)}
                      className="capitalize"
                    >
                      {risk}
                    </Button>
                  ))}
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      {getRiskToleranceExplanation(riskTolerance)}
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleGetRecommendations}
                disabled={!accountValue || loading}
                className="w-full text-lg py-6"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Building Portfolio...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5" />
                    <span>Build My Portfolio</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {accountInfo && (
          <Card className="max-w-2xl mx-auto bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">
                    {accountInfo.tier} Investor
                  </h3>
                  <p className="text-sm text-blue-700">
                    Range: {accountInfo.range} • Max Position: {formatCurrency(accountInfo.maxPosition)}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {accountInfo.tier}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {recommendations && equalPortfolio.length > 0 && (
        <div className="space-y-6">
          {/* Equal Weight Portfolio */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-green-600" />
                <span>Your Equal-Weight Portfolio</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(totalEqualInvestment)}
                  </div>
                  <div className="text-sm text-gray-600">Total Investment (80%)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(cashReserve)}
                  </div>
                  <div className="text-sm text-gray-600">Cash Reserve (20%)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    ~{formatCurrency(totalEqualInvestment / 5)}
                  </div>
                  <div className="text-sm text-gray-600">Per Stock (Average)</div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  🎯 Exact Amounts to Buy Each Stock
                </h4>
                <div className="space-y-3">
                  {equalPortfolio.map((stock, index) => (
                    <div key={stock.symbol} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <span className="font-bold text-lg">{stock.symbol}</span>
                          <div className="text-sm text-gray-600">@ {formatCurrency(stock.price)} per share</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(stock.equalInvestment)}</div>
                        <div className="text-sm font-semibold text-gray-700">Buy {stock.shares} shares</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                  Equal Weight Strategy
                </Badge>
                <Button 
                  onClick={handleAddAllToWatchlist}
                  disabled={addingAll}
                  className="flex items-center space-x-2"
                >
                  {addingAll ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Adding All...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add All to Watchlist</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Portfolio Analytics & AI Comparison</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(recommendations.totalInvestment)}
                  </div>
                  <div className="text-sm text-gray-600">AI Recommended Investment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(recommendations.cashReserve)}
                  </div>
                  <div className="text-sm text-gray-600">AI Recommended Cash</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {recommendations.expectedReturn.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Expected Return</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {recommendations.diversificationScore.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Diversification</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Stock Details */}
          <div className="grid gap-4">
            <h3 className="text-xl font-semibold text-gray-900">Stock Details & Research</h3>
            {recommendations.stocks.map((stock, index) => {
              const isAdded = addedToWatchlist.includes(stock.symbol) || 
                            WatchlistService.isInWatchlist(stock.symbol);
              const equalStock = equalPortfolio.find(eq => eq.symbol === stock.symbol);
              
              return (
                <Card key={stock.symbol} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{stock.symbol}</h3>
                              <p className="text-sm text-gray-600">{stock.name}</p>
                            </div>
                          </div>
                          <Badge className={getRiskColor(stock.riskLevel)}>
                            {stock.riskLevel} risk
                          </Badge>
                          <Badge className="bg-gray-100 text-gray-800">
                            {stock.sector}
                          </Badge>
                        </div>

                        <p className="text-gray-700">{stock.rationale}</p>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Price:</span>
                            <div className="font-semibold">{formatCurrency(stock.price)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">AI Allocation:</span>
                            <div className="font-semibold">{stock.targetAllocation.toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-500">AI Investment:</span>
                            <div className="font-semibold">{formatCurrency(stock.positionSize)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Equal Investment:</span>
                            <div className="font-semibold text-green-600">{formatCurrency(equalStock?.equalInvestment || 0)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Equal Shares:</span>
                            <div className="font-semibold text-green-600">{equalStock?.shares || 0}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Expected Return:</span>
                            <div className="font-semibold text-green-600">
                              {stock.yearlyReturn?.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleAddSingleStock(stock)}
                        disabled={isAdded}
                        variant={isAdded ? 'outline' : 'default'}
                        className="ml-4"
                      >
                        {isAdded ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>Added</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4" />
                            <span>Add to Watchlist</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-green-900 mb-3">Next Steps</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Button variant="outline" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>View Watchlist</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Explore Advanced Screening</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Research Curated Lists</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StockSelectionLanding; 