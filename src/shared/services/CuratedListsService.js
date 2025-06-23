// CuratedListsService.js - Intelligent Stock Curation System
// Implements Goldman Sachs "Rule of 10" and quality-based outperformance strategies

class CuratedListsService {
  constructor() {
    this.updateFrequency = {
      weekly: ['momentum', 'trending', 'earlyOpportunities'],
      monthly: ['established', 'dividend', 'qualityScore']
    };
    
    this.benchmarks = {
      sp500: 0.12, // 12% annual return baseline
      sectorAverages: {
        technology: 0.15,
        healthcare: 0.11,
        financials: 0.13,
        consumer: 0.10,
        industrials: 0.09
      }
    };
  }

  // Goldman Sachs "Rule of 10" Implementation
  applyGoldmanRuleOf10(stocks) {
    return stocks.filter(stock => {
      const salesGrowth = this.calculateSalesGrowth(stock);
      const operatingProfitability = this.calculateOperatingProfitability(stock);
      const consistencyScore = this.calculateConsistencyScore(stock);
      
      return (
        salesGrowth >= 0.10 && // 10% consistent sales growth
        operatingProfitability >= 0.15 && // Top 30% operating profitability
        consistencyScore >= 0.8 // Consistency threshold
      );
    });
  }

  // Quality Filtering for 4.5% Outperformance
  applyQualityFiltering(stocks) {
    return stocks.filter(stock => {
      const roic = stock.metrics.roic || 0;
      const debtToEquity = stock.metrics.debtToEquity || 0;
      const grossMargin = stock.metrics.grossMargin || 0;
      const currentRatio = stock.metrics.currentRatio || 0;
      
      return (
        roic >= 0.15 && // High return on invested capital
        debtToEquity <= 0.5 && // Conservative debt levels
        grossMargin >= 0.40 && // 40%+ gross margins
        currentRatio >= 1.0 && // Financial stability
        stock.marketCap >= 10000000000 // $10B+ market cap
      );
    });
  }

  // Generate Demo Curated Lists
  generateCuratedLists() {
    const demoStocks = this.getDemoStockData();
    
    return {
      stocksOfYear: this.generateStocksOfYear(demoStocks),
      earlyOpportunities: this.generateEarlyOpportunities(demoStocks),
      stableDividend: this.generateStableDividend(demoStocks),
      established: this.generateEstablished(demoStocks),
      trending: this.generateTrending(demoStocks),
      sectorLeaders: this.generateSectorLeaders(demoStocks)
    };
  }

  generateStocksOfYear(stocks) {
    return {
      title: "Stocks of the Year",
      description: "YTD performance leaders with strong fundamentals",
      updateFrequency: "Weekly",
      lastUpdated: new Date().toISOString().split('T')[0],
      performance: {
        ytd: 0.285,
        vsSpx: 0.165,
        winRate: 0.78
      },
      stocks: [
        {
          symbol: "NVDA",
          name: "NVIDIA Corporation",
          price: 875.25,
          change: 45.30,
          changePercent: 5.46,
          ytdReturn: 0.185,
          qualityScore: 9.2,
          ruleOf10Score: 8.8,
          sector: "Technology",
          marketCap: 2150000000000,
          metrics: {
            roic: 0.32,
            salesGrowth: 0.22,
            grossMargin: 0.73,
            debtToEquity: 0.15
          },
          reasons: ["AI leadership", "Revenue acceleration", "Margin expansion"]
        },
        {
          symbol: "MSFT",
          name: "Microsoft Corporation",
          price: 420.15,
          change: 8.75,
          changePercent: 2.12,
          ytdReturn: 0.145,
          qualityScore: 9.5,
          ruleOf10Score: 9.1,
          sector: "Technology",
          marketCap: 3120000000000,
          metrics: {
            roic: 0.28,
            salesGrowth: 0.15,
            grossMargin: 0.69,
            debtToEquity: 0.22
          },
          reasons: ["Cloud dominance", "AI integration", "Subscription growth"]
        },
        {
          symbol: "AAPL",
          name: "Apple Inc.",
          price: 175.50,
          change: 2.25,
          changePercent: 1.30,
          ytdReturn: 0.12,
          qualityScore: 9.3,
          ruleOf10Score: 8.5,
          sector: "Technology",
          marketCap: 2750000000000,
          metrics: {
            roic: 0.35,
            salesGrowth: 0.08,
            grossMargin: 0.44,
            debtToEquity: 0.18
          },
          reasons: ["Services growth", "Brand loyalty", "Innovation pipeline"]
        }
      ]
    };
  }

  generateEarlyOpportunities(stocks) {
    return {
      title: "Early Opportunities",
      description: "High growth potential with competitive advantages",
      updateFrequency: "Weekly",
      lastUpdated: new Date().toISOString().split('T')[0],
      performance: {
        ytd: 0.195,
        vsSpx: 0.075,
        winRate: 0.65
      },
      riskLevel: "Moderate-High",
      stocks: [
        {
          symbol: "PLTR",
          name: "Palantir Technologies",
          price: 28.45,
          change: 1.85,
          changePercent: 6.95,
          ytdReturn: 0.175,
          qualityScore: 7.8,
          ruleOf10Score: 8.2,
          sector: "Technology",
          marketCap: 58000000000,
          metrics: {
            roic: 0.18,
            salesGrowth: 0.28,
            grossMargin: 0.81,
            debtToEquity: 0.05
          },
          reasons: ["Government contracts", "AI analytics", "Growing commercial"]
        },
        {
          symbol: "SHOP",
          name: "Shopify Inc.",
          price: 72.30,
          change: 3.20,
          changePercent: 4.63,
          ytdReturn: 0.085,
          qualityScore: 8.1,
          ruleOf10Score: 7.9,
          sector: "Technology",
          marketCap: 90000000000,
          metrics: {
            roic: 0.22,
            salesGrowth: 0.19,
            grossMargin: 0.53,
            debtToEquity: 0.08
          },
          reasons: ["E-commerce growth", "SMB adoption", "International expansion"]
        }
      ]
    };
  }

  generateStableDividend(stocks) {
    return {
      title: "Stable Dividend Champions",
      description: "Low volatility with consistent dividend payments",
      updateFrequency: "Monthly",
      lastUpdated: new Date().toISOString().split('T')[0],
      performance: {
        ytd: 0.085,
        vsSpx: -0.035,
        winRate: 0.82,
        avgDividendYield: 0.045
      },
      volatility: "Low",
      stocks: [
        {
          symbol: "JNJ",
          name: "Johnson & Johnson",
          price: 158.75,
          change: 0.85,
          changePercent: 0.54,
          ytdReturn: 0.065,
          dividendYield: 0.032,
          dividendGrowthYears: 62,
          qualityScore: 9.1,
          sector: "Healthcare",
          marketCap: 420000000000,
          metrics: {
            roic: 0.19,
            salesGrowth: 0.06,
            grossMargin: 0.68,
            currentRatio: 1.8
          },
          reasons: ["Dividend aristocrat", "Defensive healthcare", "Stable earnings"]
        },
        {
          symbol: "PG",
          name: "Procter & Gamble Co.",
          price: 152.40,
          change: 1.20,
          changePercent: 0.79,
          ytdReturn: 0.055,
          dividendYield: 0.025,
          dividendGrowthYears: 68,
          qualityScore: 8.9,
          sector: "Consumer Staples",
          marketCap: 360000000000,
          metrics: {
            roic: 0.24,
            salesGrowth: 0.04,
            grossMargin: 0.50,
            currentRatio: 1.2
          },
          reasons: ["Brand portfolio", "Global reach", "Consistent cash flow"]
        },
        {
          symbol: "KO",
          name: "The Coca-Cola Company",
          price: 62.15,
          change: 0.45,
          changePercent: 0.73,
          ytdReturn: 0.048,
          dividendYield: 0.031,
          dividendGrowthYears: 61,
          qualityScore: 8.7,
          sector: "Consumer Staples",
          marketCap: 270000000000,
          metrics: {
            roic: 0.16,
            salesGrowth: 0.03,
            grossMargin: 0.59,
            currentRatio: 1.1
          },
          reasons: ["Global brand", "Diversified portfolio", "Pricing power"]
        }
      ]
    };
  }

  generateEstablished(stocks) {
    return {
      title: "Established Leaders",
      description: "Blue chip companies with proven track records",
      updateFrequency: "Monthly",
      lastUpdated: new Date().toISOString().split('T')[0],
      performance: {
        ytd: 0.115,
        vsSpx: -0.005,
        winRate: 0.75
      },
      stocks: [
        {
          symbol: "BRK-B",
          name: "Berkshire Hathaway Inc.",
          price: 425.80,
          change: 5.25,
          changePercent: 1.25,
          ytdReturn: 0.095,
          qualityScore: 9.4,
          sector: "Financials",
          marketCap: 920000000000,
          metrics: {
            roic: 0.14,
            salesGrowth: 0.12,
            bookValue: 0.85,
            debtToEquity: 0.28
          },
          reasons: ["Buffett leadership", "Diversified holdings", "Strong balance sheet"]
        },
        {
          symbol: "JPM",
          name: "JPMorgan Chase & Co.",
          price: 185.60,
          change: 2.40,
          changePercent: 1.31,
          ytdReturn: 0.125,
          qualityScore: 8.8,
          sector: "Financials",
          marketCap: 540000000000,
          metrics: {
            roic: 0.16,
            salesGrowth: 0.08,
            grossMargin: 0.58,
            tier1Capital: 0.155
          },
          reasons: ["Banking leader", "Rising rates benefit", "Strong credit quality"]
        }
      ]
    };
  }

  generateTrending(stocks) {
    return {
      title: "Trending Momentum",
      description: "Stocks showing strong recent momentum and technical strength",
      updateFrequency: "Weekly",
      lastUpdated: new Date().toISOString().split('T')[0],
      performance: {
        ytd: 0.225,
        vsSpx: 0.105,
        winRate: 0.68
      },
      momentumScore: 8.5,
      stocks: [
        {
          symbol: "TSM",
          name: "Taiwan Semiconductor",
          price: 102.45,
          change: 4.85,
          changePercent: 4.97,
          ytdReturn: 0.165,
          momentumScore: 9.2,
          technicalRating: "Strong Buy",
          sector: "Technology",
          marketCap: 530000000000,
          reasons: ["AI chip demand", "Advanced node leadership", "Capacity expansion"]
        },
        {
          symbol: "AMD",
          name: "Advanced Micro Devices",
          price: 168.75,
          change: 8.20,
          changePercent: 5.11,
          ytdReturn: 0.145,
          momentumScore: 8.8,
          technicalRating: "Buy",
          sector: "Technology",
          marketCap: 270000000000,
          reasons: ["Data center growth", "AI acceleration", "Intel competition"]
        }
      ]
    };
  }

  generateSectorLeaders(stocks) {
    return {
      title: "Sector Leaders",
      description: "Top 2-3 companies in each major sector",
      updateFrequency: "Monthly",
      lastUpdated: new Date().toISOString().split('T')[0],
      sectors: {
        technology: {
          leaders: ["AAPL", "MSFT", "GOOGL"],
          performance: 0.155,
          description: "Innovation and digital transformation leaders"
        },
        healthcare: {
          leaders: ["JNJ", "UNH", "PFE"],
          performance: 0.085,
          description: "Essential services with defensive characteristics"
        },
        financials: {
          leaders: ["JPM", "BRK-B", "BAC"],
          performance: 0.125,
          description: "Benefiting from rising interest rate environment"
        },
        consumer: {
          leaders: ["AMZN", "TSLA", "HD"],
          performance: 0.095,
          description: "Consumer spending and e-commerce trends"
        }
      }
    };
  }

  // Performance Tracking vs Benchmarks
  calculateListPerformance(listId, timeframe = '1Y') {
    const performanceData = {
      '1M': { return: 0.045, benchmark: 0.025, outperformance: 0.020 },
      '3M': { return: 0.125, benchmark: 0.085, outperformance: 0.040 },
      '6M': { return: 0.185, benchmark: 0.120, outperformance: 0.065 },
      '1Y': { return: 0.285, benchmark: 0.195, outperformance: 0.090 }
    };
    
    return performanceData[timeframe] || performanceData['1Y'];
  }

  // Update Simulation
  simulateWeeklyUpdate() {
    const updateStats = {
      listsUpdated: 3,
      stocksAdded: 2,
      stocksRemoved: 1,
      criteriaChanges: 0,
      performanceImpact: 0.015,
      timestamp: new Date().toISOString()
    };
    
    return updateStats;
  }

  simulateMonthlyReview() {
    const reviewStats = {
      comprehensiveReview: true,
      fundamentalChanges: 4,
      sectorRotations: 2,
      qualityScoreUpdates: 12,
      geneticAlgorithmReturn: 0.2841,
      benchmarkComparison: {
        sp500: 0.045,
        nasdaq: 0.038,
        russell2000: 0.052
      },
      timestamp: new Date().toISOString()
    };
    
    return reviewStats;
  }

  // Helper Methods
  calculateSalesGrowth(stock) {
    return stock.metrics?.salesGrowth || Math.random() * 0.20;
  }

  calculateOperatingProfitability(stock) {
    return stock.metrics?.operatingMargin || Math.random() * 0.25;
  }

  calculateConsistencyScore(stock) {
    return Math.random() * 0.4 + 0.6; // 0.6-1.0 range
  }

  getDemoStockData() {
    // This would typically come from a real data source
    return [
      { symbol: "AAPL", marketCap: 2750000000000 },
      { symbol: "MSFT", marketCap: 3120000000000 },
      { symbol: "GOOGL", marketCap: 1680000000000 },
      { symbol: "AMZN", marketCap: 1580000000000 },
      // ... more stocks
    ];
  }

  // Educational Content
  getGoldmanRuleOf10Explanation() {
    return {
      title: "Goldman Sachs 'Rule of 10'",
      description: "A quality screening methodology identifying S&P 500 stocks with consistent 10% sales growth",
      criteria: [
        "10%+ annual sales growth consistency",
        "Top 30% operating profitability in sector",
        "Strong balance sheet metrics",
        "Sustainable competitive advantages"
      ],
      historicalPerformance: "21 S&P 500 stocks meet all criteria",
      outperformance: "4.5% annual outperformance vs market"
    };
  }

  getQualityMetricsExplanation() {
    return {
      title: "Quality Stock Characteristics",
      metrics: [
        {
          name: "Return on Invested Capital (ROIC)",
          description: "Measures how efficiently a company uses capital",
          threshold: "15%+ for quality designation"
        },
        {
          name: "Gross Margin",
          description: "Indicates pricing power and cost efficiency",
          threshold: "40%+ for sustainable advantage"
        },
        {
          name: "Debt-to-Equity Ratio",
          description: "Financial stability and leverage management",
          threshold: "Below 0.5 for conservative approach"
        },
        {
          name: "Current Ratio",
          description: "Short-term liquidity and financial health",
          threshold: "Above 1.0 for stability"
        }
      ]
    };
  }
}

export default new CuratedListsService(); 