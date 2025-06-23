# Custom Trader Profile System - Implementation Guide

## 🧩 1. Complete JSON Profile Structure

```json
{
  "user_id": "123456",
  "trader_profile": {
    "type": "Swing Trader",
    "opted_in": true,
    "created_at": "2025-06-23",
    "risk_tolerance": "moderate",
    "capital_size": "10000",
    "preferred_timeframes": ["1h", "4h", "1D"],
    "tools_enabled": ["pattern_scanner", "watchlist", "breakout_alerts"],
    "dashboard_layout": {
      "widgets": ["sp500_professional", "famous_traders", "watchlist", "position_sizing"],
      "chart_timeframe": "4h",
      "default_indicators": ["RSI", "MACD", "Moving_Averages"]
    },
    "notifications": {
      "weekly_summary": true,
      "setup_alerts": true,
      "news_updates": false,
      "pattern_alerts": true
    },
    "automation_settings": {
      "weekly_scan": true,
      "position_sizing_auto": true,
      "risk_alerts": true
    }
  },
  "trading_stats": {
    "trades_this_month": 12,
    "win_rate": 65.5,
    "avg_hold_time": "3.2_days",
    "preferred_patterns": ["Bull_Flag", "Cup_Handle", "Double_Bottom"]
  }
}
```

## 🛠 2. Complete Onboarding Flow Script

### **Welcome Screen**
```
🎯 Welcome to Trading Helper Bot!
Let's customize your experience to match your trading style.

[Continue] [Skip Setup]
```

### **Profile Selection Screen**
```
📊 What's your trading style?

🚀 Day Trader
   • Multiple trades per day
   • Quick entries and exits
   • Focus on intraday patterns

📈 Swing Trader  
   • Hold trades 2-10 days
   • Focus on technical patterns
   • Balance of risk and opportunity

📊 Position Trader
   • Long-term trend following
   • Hold weeks to months
   • Focus on macro analysis

⚡ Scalper
   • Dozens of trades daily
   • Small, quick profits
   • High-frequency execution

🤖 Algo Trader
   • Systematic rule-based trading
   • Backtesting and automation
   • Data-driven decisions

❓ Not Sure Yet → [Take Quick Quiz]
⚪ Skip (Choose Later)

[Next]
```

### **Customization Confirmation**
```
✅ Perfect! We're setting you up as a Swing Trader

Your dashboard will include:
• 4-hour and daily chart focus
• Pattern recognition alerts
• Famous trader swing strategies
• Weekly planning tools

You can change this anytime in Settings.

[Finish Setup] [Back to Change]
```

## 🧪 3. Complete Trader Type Quiz

```json
{
  "quiz": {
    "title": "Find Your Trading Style",
    "description": "Answer 4 quick questions to discover your ideal trading approach",
    "questions": [
      {
        "id": 1,
        "question": "How much time can you dedicate to trading daily?",
        "choices": [
          { "label": "6+ hours actively watching", "weights": {"Day": 3, "Scalper": 3} },
          { "label": "1-2 hours for analysis", "weights": {"Swing": 3, "Position": 1} },
          { "label": "30 minutes or less", "weights": {"Position": 3, "Algo": 2} }
        ]
      },
      {
        "id": 2,
        "question": "How long do you prefer to hold trades?",
        "choices": [
          { "label": "Minutes to hours", "weights": {"Day": 3, "Scalper": 3} },
          { "label": "2-10 days", "weights": {"Swing": 3} },
          { "label": "Weeks to months", "weights": {"Position": 3} },
          { "label": "Let the algorithm decide", "weights": {"Algo": 3} }
        ]
      },
      {
        "id": 3,
        "question": "How do you handle market volatility?",
        "choices": [
          { "label": "Love it - more opportunities", "weights": {"Day": 2, "Scalper": 3} },
          { "label": "Manageable with good analysis", "weights": {"Swing": 3} },
          { "label": "Prefer steady, predictable moves", "weights": {"Position": 3} },
          { "label": "Systematic rules handle it", "weights": {"Algo": 3} }
        ]
      },
      {
        "id": 4,
        "question": "What's your primary goal?",
        "choices": [
          { "label": "Daily income from trading", "weights": {"Day": 3, "Scalper": 2} },
          { "label": "Steady monthly profits", "weights": {"Swing": 3} },
          { "label": "Long-term wealth building", "weights": {"Position": 3} },
          { "label": "Optimize and scale systems", "weights": {"Algo": 3} }
        ]
      }
    ],
    "scoring": {
      "method": "weighted_total",
      "profiles": ["Day", "Swing", "Position", "Scalper", "Algo"]
    }
  }
}
```

## 📊 4. Unified Progress Tracking by Profile

### **Core Concept**: Same dashboard, different progress metrics and status displays

### **Unified Dashboard Structure**
```json
{
  "unified_dashboard": {
    "static_sections": [
      "SP500 Professional",
      "Famous Traders", 
      "Watchlist",
      "Position Sizing"
    ],
    "dynamic_progress_section": {
      "adapts_to_profile": true,
      "shows_relevant_metrics": true,
      "tracks_profile_specific_goals": true
    }
  }
}
```

### **Progress Display Variations by Profile**

#### **Day Trader Progress**
```json
{
  "progress_header": {
    "title": "Day Trading Progress",
    "current_level": "Novice Day Trader",
    "level_progress": "7/20 profitable days this month"
  },
  "status_metrics": [
    {
      "label": "Today's P&L",
      "value": "+$247",
      "status": "positive",
      "goal": "Target: +$150/day"
    },
    {
      "label": "Trades Today", 
      "value": "12/15",
      "status": "on_track",
      "goal": "Max 15 trades/day"
    },
    {
      "label": "Win Rate This Week",
      "value": "68%",
      "status": "excellent", 
      "goal": "Target: 60%+"
    }
  ],
  "current_objectives": [
    "Complete 3 more profitable trades today",
    "Maintain risk under 1% per trade",
    "Hit daily $150 profit target"
  ]
}
```

#### **Swing Trader Progress** 
```json
{
  "progress_header": {
    "title": "$10k → $20k Challenge - Week 2",
    "current_level": "Intermediate Swing Trader", 
    "level_progress": "Account: $13,250 (32.5% toward goal)"
  },
  "status_metrics": [
    {
      "label": "Monthly Progress",
      "value": "$13,250 / $20,000",
      "status": "ahead_of_schedule",
      "goal": "Week 2 target: $12,500"
    },
    {
      "label": "Active Positions",
      "value": "3/5",
      "status": "optimal",
      "goal": "Max 5 swing positions"
    },
    {
      "label": "Weekly Tasks",
      "value": "4/7 completed",
      "status": "on_track",
      "goal": "Complete Sunday-Friday workflow"
    }
  ],
  "current_objectives": [
    "Complete Friday position review",
    "Prepare Sunday weekly plan",
    "Monitor AAPL swing setup"
  ]
}
```

#### **Position Trader Progress**
```json
{
  "progress_header": {
    "title": "Portfolio Growth Journey",
    "current_level": "Advanced Position Trader",
    "level_progress": "6-month return: +23.4%"
  },
  "status_metrics": [
    {
      "label": "YTD Performance",
      "value": "+18.7%",
      "status": "outperforming", 
      "goal": "Target: +15% annually"
    },
    {
      "label": "Portfolio Positions",
      "value": "8/10",
      "status": "well_diversified",
      "goal": "Target: 8-12 positions"
    },
    {
      "label": "Risk Allocation",
      "value": "2.3%",
      "status": "conservative",
      "goal": "Max 3% per position"
    }
  ],
  "current_objectives": [
    "Review monthly rebalancing",
    "Analyze tech sector allocation", 
    "Monitor macro trend signals"
  ]
}
```

## ⚡ 5. Implementation Components

### **A. Profile Manager Service**
```typescript
// src/features/auth/services/ProfileManagerService.ts
class ProfileManagerService {
  setTraderProfile(userId: string, profileType: TraderType): Promise<void>
  getProfileSettings(userId: string): Promise<TraderProfile>
  updateDashboardLayout(userId: string, layout: DashboardLayout): Promise<void>
  switchProfile(userId: string, newType: TraderType): Promise<void>
}
```

### **B. Dashboard Configuration**
```typescript
// src/features/dashboard/services/DashboardConfigService.ts
class DashboardConfigService {
  getLayoutForProfile(profileType: TraderType): DashboardLayout
  customizeWidgets(profile: TraderProfile): Widget[]
  setDefaultIndicators(profile: TraderProfile): Indicator[]
}
```

### **C. Profile-Based Automation**
```typescript
// src/features/automation/services/ProfileAutomationService.ts
class ProfileAutomationService {
  enableProfileAutomation(userId: string, profile: TraderProfile): void
  scheduleScans(profile: TraderProfile): void
  setRiskParameters(profile: TraderProfile): void
}
```

## 🎮 6. Gamification Elements

### **Profile Levels & Achievements**
```json
{
  "gamification": {
    "levels": {
      "Swing Trader": {
        "novice": { "trades_required": 10, "win_rate_min": 40 },
        "intermediate": { "trades_required": 50, "win_rate_min": 55 },
        "advanced": { "trades_required": 100, "win_rate_min": 65 },
        "expert": { "trades_required": 250, "win_rate_min": 70 }
      }
    },
    "achievements": {
      "pattern_master": "Successfully trade 10 bull flags",
      "risk_manager": "Never exceed 2% risk per trade for 30 days",
      "consistent_trader": "Positive return 4 weeks in a row"
    },
    "progress_tracking": {
      "trades_completed": 0,
      "current_level": "novice",
      "next_milestone": "10_trades",
      "achievements_unlocked": []
    }
  }
}
```

## 🔄 7. Profile Switching Flow

### **Settings Page Implementation**
```
Current Profile: Swing Trader ⚙️

📊 Change Trading Style
   [Day Trader] [Swing Trader ✓] [Position Trader] [Scalper] [Algo]

⚠️ Switching will:
   • Reset your dashboard layout
   • Update automation settings  
   • Clear current watchlists
   • Preserve your trading history

[Switch Profile] [Cancel]

🚫 Opt Out of Profiles
   [Use Generic Dashboard] - No profile-specific features
```

This complete system gives users flexibility while providing valuable customization based on their trading style.

**Ready for the Figma wireframe mockup?**