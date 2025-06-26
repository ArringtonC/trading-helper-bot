# Trading RPG Analysis Scripts 🎮

These scripts provide automated market analysis for the Trading Skills RPG challenge system.

## 🚀 Quick Start

Run all analysis scripts at once:
```bash
./scripts/trading/run-all-analysis.sh
```

Or run individual scripts:
```bash
# Weekly market intelligence
npx ts-node scripts/trading/weekly-market-analysis.ts

# Monday range setup analysis  
npx ts-node scripts/trading/monday-range-calculator.ts

# Strategy class optimization
npx ts-node scripts/trading/strategy-optimizer.ts
```

## 📊 What Each Script Does

### 1. Weekly Market Analysis (`weekly-market-analysis.ts`)
**Purpose:** Sunday planning intelligence gathering
- 📈 Analyzes current market regime (BULL/BEAR/SIDEWAYS/VOLATILE)
- 📅 Fetches economic calendar events for the week
- 💼 Identifies major earnings announcements
- 🎭 Recommends optimal strategy classes (Buffett Guardian, Dalio Warrior, etc.)
- 🎯 Generates strategic watchlist suggestions
- ⚠️ Calculates weekly risk level and target adjustments

**Output:** `public/data/market-analysis/latest-analysis.json`

### 2. Monday Range Calculator (`monday-range-calculator.ts`)
**Purpose:** Monday setup and battle strategy analysis
- 📏 Calculates Monday's price range for SPY/target symbol
- 🏷️ Classifies range size (HUGE/LARGE/NORMAL/SMALL)
- ⚔️ Determines battle strategy type (VOLATILITY_BREAKOUT/COMPRESSION/STANDARD)
- 🎯 Calculates breakout levels for Tuesday-Thursday execution
- 🛡️ Sets optimal stop-loss levels based on range
- 💰 Recommends position sizing based on volatility

**Output:** `public/data/monday-analysis/latest-monday-analysis.json`

### 3. Strategy Optimizer (`strategy-optimizer.ts`)
**Purpose:** Performance-based strategy recommendations
- 📊 Analyzes historical performance by strategy class
- 🎯 Calculates win rates, profit factors, and risk metrics
- 🎭 Recommends optimal strategy class based on market conditions
- 💡 Provides optimization suggestions for improvement
- ⚖️ Adjusts risk parameters based on performance

**Output:** `public/data/strategy-optimization/latest-strategy-recommendation.json`

## 🎮 RPG Integration

### Strategy Classes
- 🏰 **Buffett Guardian** - Value/Defense specialist
- ⚔️ **Dalio Warrior** - Trend/Momentum fighter  
- 🗡️ **Soros Assassin** - Contrarian/Timing master
- 🏹 **Lynch Scout** - Growth/Discovery ranger

### Boss Battle System
- **Level 1 Boss:** $12,500 (Novice Trader)
- **Level 2 Boss:** $15,000 (Skilled Trader)
- **Level 3 Boss:** $17,500 (Expert Trader)
- **Final Boss:** $20,000 (Master Trader) 👑

### XP System
Scripts help earn XP through:
- 🧘 **Patience XP** - For disciplined no-trade days
- 💎 **Quality XP** - For A+ legendary setups
- ⚔️ **Battle XP** - For successful boss defeats
- 🎯 **Skill XP** - For strategy mastery progression

## 📁 File Structure

```
scripts/trading/
├── weekly-market-analysis.ts     # Sunday planning intelligence
├── monday-range-calculator.ts    # Monday setup analysis
├── strategy-optimizer.ts         # Performance optimization
├── run-all-analysis.sh          # Execute all scripts
└── README.md                     # This file

public/data/
├── market-analysis/
│   └── latest-analysis.json      # Weekly market intelligence
├── monday-analysis/
│   └── latest-monday-analysis.json # Monday range data
└── strategy-optimization/
    └── latest-strategy-recommendation.json # Strategy advice
```

## 🔧 Configuration

### Environment Variables
- `ALPHA_VANTAGE_API_KEY` - For real market data (optional, uses demo data)
- `POLYGON_API_KEY` - Alternative market data source (optional)

### Default Settings
- Target symbol: SPY (can be overridden with command line argument)
- Weekly target: $2,500 profit
- Max risk per trade: 2%
- Analysis refreshes: Daily/weekly as needed

## 💡 Usage Tips

### Best Practices
1. **Run Sunday evening** before weekly planning session
2. **Run Monday after market close** for range analysis
3. **Check strategy optimization** when performance changes
4. **Use with RPG challenge** for optimal XP gain

### Command Examples
```bash
# Analyze specific symbol
./run-all-analysis.sh AAPL

# Just Monday range for QQQ
npx ts-node scripts/trading/monday-range-calculator.ts QQQ

# Weekly analysis only
npx ts-node scripts/trading/weekly-market-analysis.ts
```

## 🎯 Integration with Planning Wizard

The weekly planning wizard at `http://localhost:3000/challenge/planning` automatically:
- ✅ Loads latest analysis data
- 🚀 Provides "Run Analysis Scripts" button
- 🔄 Refreshes data after script execution
- 🎮 Displays RPG-style strategy recommendations

## ⚡ Performance Notes

- Scripts run in 10-30 seconds typically
- Use caching to avoid API rate limits
- Fallback to mock data if APIs unavailable
- Optimized for RPG challenge workflow

---

🎮 **Ready to level up your trading game!** Use these scripts to gain intelligence advantages in your quest to defeat the $20k final boss!