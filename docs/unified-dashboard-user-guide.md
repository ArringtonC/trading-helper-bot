# Unified Positions Dashboard User Guide

## Overview

The Unified Positions Dashboard is the central hub for real-time position monitoring and analysis in the Trading Helper Bot. It consolidates all essential trading data, performance metrics, and risk management tools into a single, comprehensive interface.

### Key Features
- **Real-time position monitoring** with virtualized table performance
- **Interactive KPI cards** showing portfolio value, P&L, and performance metrics
- **Strategy heatmap** for visualizing performance patterns by day
- **Goal sizing wizard** for position optimization
- **Risk monitoring** with real-time Greeks tracking (Delta, Theta, Gamma, Vega)
- **Notification system** for alerts and risk management
- **Customizable layouts** with user preferences
- **Performance optimizations** including data caching and progressive loading

### Who Should Use This Dashboard
- Active options traders monitoring multiple positions
- Portfolio managers tracking performance metrics
- Risk managers monitoring exposure levels
- Anyone needing comprehensive position analysis

## Getting Started

### Accessing the Dashboard
Navigate to `/unified-dashboard` in the application or click "Unified Dashboard" in the main navigation menu.

### Importing Your Data
1. **CSV Upload**: Click the "Import Data" toggle to expand the import section
2. **Drag & Drop**: Drop your CSV files directly onto the upload area
3. **File Selection**: Click "Choose Files" to browse and select CSV files
4. **Auto-Refresh**: Dashboard automatically refreshes after successful import

### Initial Setup and User Preferences
The dashboard automatically saves your preferences including:
- Widget visibility settings
- Refresh intervals (15s, 30s, 1m, 5m)
- Notification preferences
- Layout customizations

## Feature Walkthrough

### 1. Real-Time Position Monitoring

#### Virtualized Positions Table
- **Performance**: Handles thousands of positions with smooth scrolling
- **Filtering**: Search by symbol, strategy, or any field
- **Sorting**: Click column headers to sort data
- **Trade Aggregation**: Automatically groups trades into positions (131 trades → 55 positions)

#### Key Columns
- **Symbol**: Underlying asset symbol
- **Strategy**: Detected strategy type (e.g., Iron Condor, Covered Call)
- **P&L**: Realized and unrealized profit/loss
- **Delta/Theta/Gamma/Vega**: Real-time Greeks
- **DTE**: Days to expiration
- **Position Size**: Current quantity and value

### 2. KPI Cards

#### Available Metrics
- **Total Value**: Current portfolio value
- **Total P&L**: Overall profit/loss with percentage
- **Day P&L**: Today's performance
- **Win Rate**: Percentage of profitable trades
- **Avg Win/Loss**: Average profit per winning/losing trade
- **Max Drawdown**: Largest peak-to-trough decline

#### Interactive Features
- **Color Coding**: Green for profits, red for losses
- **Trend Indicators**: Up/down arrows for performance direction
- **Real-time Updates**: Automatic refresh based on user settings

### 3. Strategy Heatmap

#### Visualization
- **Daily Performance**: Shows strategy performance by day of week
- **Color Intensity**: Darker colors indicate higher performance
- **Interactive**: Click cells for detailed breakdown

#### Customization
- **Date Range**: Adjust time period for analysis
- **Strategy Filter**: Focus on specific strategies
- **Metric Selection**: Choose between P&L, win rate, or volume

### 4. Goal Sizing Wizard

#### Purpose
Helps determine optimal position sizes based on:
- **Risk Tolerance**: Personal risk preferences
- **Account Size**: Available capital
- **Strategy Type**: Different sizing for different strategies
- **Market Conditions**: Volatility adjustments

#### Usage
1. Click "Goal Sizing" button
2. Input your parameters
3. Review recommendations
4. Apply suggested position sizes

### 5. Risk Monitoring

#### Real-time Greeks Tracking
- **Delta**: Directional exposure monitoring
- **Theta**: Time decay tracking
- **Gamma**: Delta sensitivity alerts
- **Vega**: Volatility exposure warnings

#### Alert System
- **Critical Thresholds**: Automatic alerts for dangerous exposure levels
- **Warning Levels**: Early warnings for approaching limits
- **Visual Indicators**: Color-coded gauges for quick assessment

### 6. Notification System

#### Alert Types
- **Risk Alerts**: Greeks exceeding thresholds
- **Position Changes**: New positions or closures
- **Performance Milestones**: Profit/loss targets reached
- **System Updates**: Import completion, errors

#### Customization
- **Enable/Disable**: Toggle notifications on/off
- **Alert Levels**: Choose which alerts to receive
- **Sound Notifications**: Audio alerts for critical events

## API and Data Model Documentation

### Data Sources
- **CSV Imports**: IBKR activity statements, custom trade logs
- **Real-time Data**: Live position updates, market data
- **Calculated Metrics**: Derived P&L, Greeks, performance statistics

### Position Data Model
```typescript
interface Position {
  id: string;
  symbol: string;
  strategy: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  delta: number;
  theta: number;
  gamma: number;
  vega: number;
  dte: number;
  openDate: Date;
  trades: Trade[];
}
```

### Performance Optimizations
- **Data Caching**: 30-second TTL for position data, 5-minute for historical data
- **Virtualization**: Only renders visible table rows
- **Memoization**: Cached calculations for KPI cards and widgets
- **Progressive Loading**: Loads critical data first, then secondary metrics

### API Endpoints
- `GET /api/positions` - Fetch current positions
- `GET /api/trades` - Retrieve trade history
- `GET /api/performance` - Get performance metrics
- `POST /api/upload` - Upload CSV data

## Troubleshooting

### Common Issues

#### Dashboard Not Loading
1. **Check Network Connection**: Ensure stable internet connection
2. **Clear Browser Cache**: Refresh with Ctrl+F5 (Cmd+Shift+R on Mac)
3. **Verify Data Import**: Ensure CSV files are properly formatted
4. **Check Console**: Open browser dev tools for error messages

#### Performance Issues
1. **Reduce Refresh Frequency**: Increase interval to 5 minutes
2. **Disable Unused Widgets**: Hide widgets you don't need
3. **Clear Old Data**: Remove outdated positions and trades
4. **Check System Resources**: Ensure adequate RAM and CPU

#### Data Not Updating
1. **Verify Auto-Refresh**: Check refresh interval settings
2. **Manual Refresh**: Click refresh button or reload page
3. **Check Data Source**: Ensure CSV files contain recent data
4. **Validate Format**: Confirm CSV structure matches expected format

#### Import Errors
1. **File Format**: Ensure CSV files are properly formatted
2. **Column Headers**: Verify required columns are present
3. **Data Types**: Check that numeric fields contain valid numbers
4. **File Size**: Large files may need to be split into smaller chunks

### Error Messages

#### "Failed to load positions"
- **Cause**: Database connection issue or corrupted data
- **Solution**: Refresh page, re-import data, or contact support

#### "Invalid CSV format"
- **Cause**: CSV file doesn't match expected structure
- **Solution**: Check file format against documentation, ensure proper headers

#### "Performance data unavailable"
- **Cause**: Insufficient trade history for calculations
- **Solution**: Import more historical data or wait for more trades

### Performance Tips

#### Optimal Settings
- **Refresh Interval**: 30 seconds for active trading, 5 minutes for monitoring
- **Widget Configuration**: Enable only needed widgets
- **Data Retention**: Keep 1-2 years of historical data maximum

#### Browser Recommendations
- **Chrome/Edge**: Best performance with modern JavaScript features
- **Firefox**: Good compatibility, may be slightly slower
- **Safari**: Compatible but may have minor display differences

#### System Requirements
- **RAM**: Minimum 4GB, recommended 8GB+
- **CPU**: Modern multi-core processor
- **Network**: Stable broadband connection
- **Browser**: Latest version of Chrome, Firefox, Edge, or Safari

## Advanced Features

### Custom Layouts
- **Widget Reordering**: Drag and drop widgets (future feature)
- **Size Adjustment**: Resize widgets to fit your workflow
- **Hide/Show**: Toggle widget visibility based on needs

### Data Export
- **CSV Export**: Download position data for external analysis
- **PDF Reports**: Generate formatted performance reports
- **API Access**: Programmatic access to dashboard data

### Integration Options
- **IBKR Connection**: Direct broker integration for live data
- **Third-party APIs**: Connect external data sources
- **Webhook Support**: Real-time notifications to external systems

## Support and Resources

### Documentation
- **API Reference**: Complete endpoint documentation
- **Video Tutorials**: Step-by-step feature walkthroughs
- **Best Practices**: Recommended workflows and configurations

### Community
- **User Forum**: Community discussions and tips
- **Feature Requests**: Submit ideas for new functionality
- **Bug Reports**: Report issues and track fixes

### Contact
- **Technical Support**: help@tradinghelperbot.com
- **Feature Requests**: features@tradinghelperbot.com
- **General Inquiries**: info@tradinghelperbot.com

---

*Last Updated: [Current Date]*
*Version: 1.0* 