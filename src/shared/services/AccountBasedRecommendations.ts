interface StockRecommendation {
  symbol: string;
  name: string;
  price: number;
  targetAllocation: number; // Percentage of account
  positionSize: number; // Dollar amount
  shares: number; // Number of shares
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

type AccountTier = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

class AccountBasedStockPicker {
  private stockDatabase = {
    BEGINNER: [
      {
        symbol: 'AAPL', name: 'Apple Inc.', price: 175.30, sector: 'Technology',
        marketCap: 2700000000000, beta: 1.2, dividend: 0.5, yearlyReturn: 12.5,
        rationale: 'Blue-chip tech leader with consistent growth and dividends'
      },
      {
        symbol: 'MSFT', name: 'Microsoft Corp.', price: 395.80, sector: 'Technology', 
        marketCap: 2900000000000, beta: 0.9, dividend: 0.7, yearlyReturn: 15.2,
        rationale: 'Dominant cloud computing with stable revenue streams'
      },
      {
        symbol: 'KO', name: 'Coca-Cola Co.', price: 62.50, sector: 'Consumer Staples',
        marketCap: 270000000000, beta: 0.6, dividend: 3.1, yearlyReturn: 8.5,
        rationale: 'Dividend aristocrat with global brand stability'
      },
      {
        symbol: 'JNJ', name: 'Johnson & Johnson', price: 158.90, sector: 'Healthcare',
        marketCap: 420000000000, beta: 0.7, dividend: 2.9, yearlyReturn: 9.2,
        rationale: 'Healthcare giant with defensive characteristics'
      },
      {
        symbol: 'PG', name: 'Procter & Gamble', price: 149.20, sector: 'Consumer Staples',
        marketCap: 356000000000, beta: 0.5, dividend: 2.4, yearlyReturn: 7.8,
        rationale: 'Consumer staples leader with consistent performance'
      }
    ],
    INTERMEDIATE: [
      {
        symbol: 'NVDA', name: 'NVIDIA Corp.', price: 695.50, sector: 'Technology',
        marketCap: 1700000000000, beta: 1.8, dividend: 0.1, yearlyReturn: 28.5,
        rationale: 'AI leader with explosive growth potential'
      },
      {
        symbol: 'GOOGL', name: 'Alphabet Inc.', price: 138.25, sector: 'Technology',
        marketCap: 1750000000000, beta: 1.1, dividend: 0, yearlyReturn: 18.3,
        rationale: 'Search dominance with AI and cloud expansion'
      },
      {
        symbol: 'V', name: 'Visa Inc.', price: 264.80, sector: 'Financial Services',
        marketCap: 565000000000, beta: 1.0, dividend: 0.8, yearlyReturn: 16.7,
        rationale: 'Payment processing moat with global expansion'
      },
      {
        symbol: 'UNH', name: 'UnitedHealth Group', price: 521.75, sector: 'Healthcare',
        marketCap: 485000000000, beta: 0.8, dividend: 1.5, yearlyReturn: 14.2,
        rationale: 'Healthcare services leader with pricing power'
      },
      {
        symbol: 'SPY', name: 'SPDR S&P 500 ETF', price: 445.20, sector: 'Diversified',
        marketCap: 450000000000, beta: 1.0, dividend: 1.3, yearlyReturn: 11.8,
        rationale: 'Broad market exposure with low fees'
      }
    ],
    ADVANCED: [
      {
        symbol: 'PLTR', name: 'Palantir Technologies', price: 18.45, sector: 'Technology',
        marketCap: 38000000000, beta: 2.5, dividend: 0, yearlyReturn: 35.2,
        rationale: 'Data analytics disruptor with government contracts'
      },
      {
        symbol: 'SHOP', name: 'Shopify Inc.', price: 78.90, sector: 'Technology',
        marketCap: 98000000000, beta: 2.1, dividend: 0, yearlyReturn: 22.8,
        rationale: 'E-commerce platform with SMB market capture'
      },
      {
        symbol: 'TSLA', name: 'Tesla Inc.', price: 248.75, sector: 'Consumer Cyclical',
        marketCap: 790000000000, beta: 2.3, dividend: 0, yearlyReturn: 45.6,
        rationale: 'EV leader with energy storage expansion'
      },
      {
        symbol: 'COIN', name: 'Coinbase Global', price: 145.30, sector: 'Financial Services',
        marketCap: 35000000000, beta: 3.2, dividend: 0, yearlyReturn: 67.4,
        rationale: 'Crypto exchange with institutional adoption'
      },
      {
        symbol: 'RBLX', name: 'Roblox Corp.', price: 42.60, sector: 'Technology',
        marketCap: 26000000000, beta: 2.8, dividend: 0, yearlyReturn: -8.5,
        rationale: 'Metaverse platform with young demographic'
      }
    ]
  };

  classifyAccount(accountValue: number): AccountTier {
    if (accountValue < 25000) return 'BEGINNER';
    if (accountValue < 100000) return 'INTERMEDIATE';
    return 'ADVANCED';
  }

  private getMaxPositionSize(accountValue: number, tier: AccountTier): number {
    switch (tier) {
      case 'BEGINNER': return Math.min(accountValue * 0.15, 5000);
      case 'INTERMEDIATE': return accountValue * 0.20;
      case 'ADVANCED': return accountValue * 0.25;
    }
  }

  getTop5Stocks(accountValue: number, riskTolerance: RiskTolerance = 'moderate'): PortfolioRecommendation {
    const tier = this.classifyAccount(accountValue);
    let stockUniverse = [...this.stockDatabase[tier]];
    
    if (riskTolerance === 'conservative' && tier !== 'BEGINNER') {
      stockUniverse = [...stockUniverse.slice(0, 3), ...this.stockDatabase.BEGINNER.slice(0, 2)];
    } else if (riskTolerance === 'aggressive' && tier !== 'ADVANCED') {
      stockUniverse = [...stockUniverse.slice(0, 3), ...this.stockDatabase.ADVANCED.slice(0, 2)];
    }

    const selectedStocks = stockUniverse.slice(0, 5);
    const maxPositionSize = this.getMaxPositionSize(accountValue, tier);
    const investmentBudget = accountValue * 0.9;
    const targetAllocation = 100 / selectedStocks.length;
    
    const recommendations: StockRecommendation[] = selectedStocks.map(stock => {
      const targetDollarAmount = Math.min((investmentBudget * targetAllocation) / 100, maxPositionSize);
      const shares = Math.floor(targetDollarAmount / stock.price);
      const actualInvestment = shares * stock.price;
      const actualAllocation = (actualInvestment / accountValue) * 100;
      
      return {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        targetAllocation: actualAllocation,
        positionSize: actualInvestment,
        shares,
        rationale: stock.rationale,
        riskLevel: stock.beta < 0.8 ? 'low' : stock.beta < 1.5 ? 'medium' : 'high',
        sector: stock.sector,
        marketCap: stock.marketCap,
        beta: stock.beta,
        dividend: stock.dividend,
        yearlyReturn: stock.yearlyReturn
      };
    });
    
    const totalInvestment = recommendations.reduce((sum, stock) => sum + stock.positionSize, 0);
    const cashReserve = accountValue - totalInvestment;
    const weightedReturn = recommendations.reduce((sum, stock) => 
      sum + (stock.yearlyReturn || 0) * (stock.targetAllocation / 100), 0
    );
    const sectors = new Set(recommendations.map(s => s.sector));
    const diversificationScore = Math.min((sectors.size / 5) * 100, 100);
    const maxDrawdown = recommendations.reduce((max, stock) => Math.max(max, stock.beta * 20), 0);
    
    return {
      stocks: recommendations,
      totalInvestment,
      cashReserve,
      riskProfile: this.getRiskProfile(tier, riskTolerance),
      diversificationScore,
      expectedReturn: weightedReturn,
      maxDrawdown
    };
  }

  private getRiskProfile(tier: AccountTier, riskTolerance: RiskTolerance): string {
    const profiles = {
      BEGINNER: { conservative: 'Ultra-Conservative', moderate: 'Conservative Growth', aggressive: 'Balanced Growth' },
      INTERMEDIATE: { conservative: 'Conservative Growth', moderate: 'Balanced Growth', aggressive: 'Growth-Focused' },
      ADVANCED: { conservative: 'Balanced Growth', moderate: 'Growth-Focused', aggressive: 'High-Growth Aggressive' }
    };
    return profiles[tier][riskTolerance];
  }

  getAccountTierInfo(accountValue: number) {
    const tier = this.classifyAccount(accountValue);
    const ranges = {
      BEGINNER: '$1,000 - $25,000',
      INTERMEDIATE: '$25,000 - $100,000', 
      ADVANCED: '$100,000+'
    };
    const features = {
      BEGINNER: ['Blue-chip stocks only', 'Maximum 15% position size', 'Dividend-focused picks'],
      INTERMEDIATE: ['Growth + dividend mix', 'Maximum 20% position size', 'Sector diversification'],
      ADVANCED: ['High-growth opportunities', 'Maximum 25% position size', 'Small-cap access']
    };
    
    return {
      tier,
      range: ranges[tier],
      maxPosition: this.getMaxPositionSize(accountValue, tier),
      features: features[tier]
    };
  }
}

export default AccountBasedStockPicker;
export type { StockRecommendation, PortfolioRecommendation, AccountTier, RiskTolerance };