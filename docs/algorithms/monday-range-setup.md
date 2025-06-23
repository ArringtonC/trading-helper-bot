# Monday Range Setup Algorithm Specification

## Overview
The Monday Range Setup is a professional day trading strategy that uses Monday's trading range to identify breakout opportunities throughout the week. Based on Larry Williams' research showing Monday's range is statistically significant for weekly price action.

## 1. Monday Range Calculation Methodology

### Basic Range Calculation
```typescript
interface MondayRange {
  high: number;
  low: number;
  range: number;        // high - low
  midpoint: number;     // (high + low) / 2
  date: Date;
  isHugeRange: boolean; // range > 16 points for SPY
}

function calculateMondayRange(mondayBars: OHLCV[]): MondayRange {
  // Use entire Monday session (9:30 AM - 4:00 PM ET)
  const sessionBars = mondayBars.filter(bar => 
    isWithinRegularHours(bar.timestamp)
  );
  
  const high = Math.max(...sessionBars.map(bar => bar.high));
  const low = Math.min(...sessionBars.map(bar => bar.low));
  const range = high - low;
  const midpoint = (high + low) / 2;
  
  return {
    high,
    low,
    range,
    midpoint,
    date: new Date(sessionBars[0].timestamp),
    isHugeRange: range > HUGE_RANGE_THRESHOLD
  };
}

function isWithinRegularHours(timestamp: number): boolean {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const minute = date.getMinutes();
  
  // 9:30 AM to 4:00 PM ET
  const startTime = 9 * 60 + 30; // 9:30 AM in minutes
  const endTime = 16 * 60;       // 4:00 PM in minutes
  const currentTime = hour * 60 + minute;
  
  return currentTime >= startTime && currentTime <= endTime;
}
```

## 2. "Huge Range" Day Definitions

### Statistical Analysis
```typescript
const HUGE_RANGE_CRITERIA = {
  SPY: {
    threshold: 16,      // Points (16 points = $1600 per 100 shares)
    percentile: 90,     // Top 10% of ranges
    minVolume: 50000000 // 50M shares minimum
  },
  QQQ: {
    threshold: 8,       // Points
    percentile: 90,
    minVolume: 20000000
  },
  IWM: {
    threshold: 6,       // Points
    percentile: 90,
    minVolume: 15000000
  }
};

function isHugeRangeDay(range: MondayRange, symbol: string): HugeRangeAnalysis {
  const criteria = HUGE_RANGE_CRITERIA[symbol];
  if (!criteria) throw new Error(`No criteria for symbol: ${symbol}`);
  
  // Historical percentile analysis
  const historicalRanges = getHistoricalMondayRanges(symbol, 252); // 1 year
  const percentileRank = calculatePercentile(range.range, historicalRanges);
  
  return {
    isHugeRange: range.range > criteria.threshold,
    percentileRank,
    significance: percentileRank > criteria.percentile ? 'HIGH' : 'NORMAL',
    expectedFollowThrough: percentileRank > 95 ? 0.75 : 0.60, // Success rate
    recommendations: generateHugeRangeRecommendations(range, percentileRank)
  };
}

function calculatePercentile(value: number, dataset: number[]): number {
  const sorted = dataset.sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);
  return (index / sorted.length) * 100;
}
```

## 3. Breakout Level Identification

### Primary Breakout Levels
```typescript
interface BreakoutLevels {
  upperBreakout: number;    // Monday high
  lowerBreakout: number;    // Monday low
  midpointReversion: number; // Range midpoint
  extensions: {
    upper: number[];        // Fibonacci extensions above
    lower: number[];        // Fibonacci extensions below
  };
  volumeConfirmation: {
    requiredVolume: number;
    averageVolume: number;
  };
}

function calculateBreakoutLevels(range: MondayRange, historicalData: OHLCV[]): BreakoutLevels {
  const rangeSize = range.range;
  const averageVolume = calculateAverageVolume(historicalData, 20);
  
  // Fibonacci extension levels
  const fibLevels = [1.0, 1.272, 1.618, 2.0, 2.618];
  
  const upperExtensions = fibLevels.map(fib => 
    range.high + (rangeSize * (fib - 1))
  );
  
  const lowerExtensions = fibLevels.map(fib => 
    range.low - (rangeSize * (fib - 1))
  );
  
  return {
    upperBreakout: range.high,
    lowerBreakout: range.low,
    midpointReversion: range.midpoint,
    extensions: {
      upper: upperExtensions,
      lower: lowerExtensions
    },
    volumeConfirmation: {
      requiredVolume: averageVolume * 1.5, // 150% of average
      averageVolume
    }
  };
}
```

### Breakout Confirmation Criteria
```typescript
interface BreakoutSignal {
  type: 'UPPER_BREAKOUT' | 'LOWER_BREAKOUT' | 'MIDPOINT_REVERSION';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  price: number;
  volume: number;
  timeOfBreakout: Date;
  isConfirmed: boolean;
  confidence: number; // 0-100
}

function validateBreakout(
  currentPrice: number,
  currentVolume: number,
  levels: BreakoutLevels,
  timeframe: number = 5 // minutes for confirmation
): BreakoutSignal | null {
  
  let signal: BreakoutSignal | null = null;
  
  // Upper breakout detection
  if (currentPrice > levels.upperBreakout) {
    signal = {
      type: 'UPPER_BREAKOUT',
      strength: getBreakoutStrength(currentPrice, levels.upperBreakout, currentVolume),
      price: currentPrice,
      volume: currentVolume,
      timeOfBreakout: new Date(),
      isConfirmed: false,
      confidence: 0
    };
  }
  
  // Lower breakout detection
  else if (currentPrice < levels.lowerBreakout) {
    signal = {
      type: 'LOWER_BREAKOUT',
      strength: getBreakoutStrength(levels.lowerBreakout, currentPrice, currentVolume),
      price: currentPrice,
      volume: currentVolume,
      timeOfBreakout: new Date(),
      isConfirmed: false,
      confidence: 0
    };
  }
  
  // Midpoint reversion
  else if (Math.abs(currentPrice - levels.midpointReversion) < 0.5) {
    signal = {
      type: 'MIDPOINT_REVERSION',
      strength: 'MODERATE',
      price: currentPrice,
      volume: currentVolume,
      timeOfBreakout: new Date(),
      isConfirmed: false,
      confidence: 0
    };
  }
  
  if (signal) {
    signal.confidence = calculateBreakoutConfidence(signal, levels);
    signal.isConfirmed = signal.confidence > 70;
  }
  
  return signal;
}

function getBreakoutStrength(
  priceLevel: number,
  breakoutPrice: number,
  volume: number
): 'WEAK' | 'MODERATE' | 'STRONG' {
  const penetration = Math.abs(breakoutPrice - priceLevel);
  const volumeRatio = volume / levels.volumeConfirmation.averageVolume;
  
  if (penetration > 2 && volumeRatio > 2) return 'STRONG';
  if (penetration > 1 && volumeRatio > 1.5) return 'MODERATE';
  return 'WEAK';
}
```

## 4. Stop Loss Placement Based on Range

### Range-Based Stop Loss Algorithm
```typescript
interface StopLossConfig {
  type: 'FIXED_PERCENTAGE' | 'ATR_BASED' | 'RANGE_BASED' | 'SUPPORT_RESISTANCE';
  parameters: {
    percentage?: number;
    atrMultiplier?: number;
    rangeMultiplier?: number;
    supportOffset?: number;
  };
}

function calculateRangeBasedStopLoss(
  entry: number,
  range: MondayRange,
  signal: BreakoutSignal,
  config: StopLossConfig = { type: 'RANGE_BASED', parameters: { rangeMultiplier: 0.5 }}
): number {
  
  switch (signal.type) {
    case 'UPPER_BREAKOUT':
      return calculateUpperBreakoutStop(entry, range, config);
    
    case 'LOWER_BREAKOUT':
      return calculateLowerBreakoutStop(entry, range, config);
    
    case 'MIDPOINT_REVERSION':
      return calculateMidpointReversionStop(entry, range, config);
    
    default:
      throw new Error('Invalid signal type');
  }
}

function calculateUpperBreakoutStop(
  entry: number,
  range: MondayRange,
  config: StopLossConfig
): number {
  const rangeSize = range.range;
  
  switch (config.type) {
    case 'RANGE_BASED':
      // Stop below Monday high with range-based buffer
      const buffer = rangeSize * (config.parameters.rangeMultiplier || 0.5);
      return range.high - buffer;
    
    case 'FIXED_PERCENTAGE':
      return entry * (1 - (config.parameters.percentage || 0.02));
    
    case 'SUPPORT_RESISTANCE':
      // Stop below nearest support level
      return findNearestSupport(entry, range) - (config.parameters.supportOffset || 0.5);
    
    default:
      return range.high - (rangeSize * 0.25); // Default: 25% of range
  }
}

function calculateLowerBreakoutStop(
  entry: number,
  range: MondayRange,
  config: StopLossConfig
): number {
  const rangeSize = range.range;
  
  switch (config.type) {
    case 'RANGE_BASED':
      // Stop above Monday low with range-based buffer
      const buffer = rangeSize * (config.parameters.rangeMultiplier || 0.5);
      return range.low + buffer;
    
    case 'FIXED_PERCENTAGE':
      return entry * (1 + (config.parameters.percentage || 0.02));
    
    case 'SUPPORT_RESISTANCE':
      // Stop above nearest resistance level
      return findNearestResistance(entry, range) + (config.parameters.supportOffset || 0.5);
    
    default:
      return range.low + (rangeSize * 0.25); // Default: 25% of range
  }
}
```

## 5. Entry and Exit Signal Generation

### Entry Signal Algorithm
```typescript
interface EntrySignal {
  action: 'BUY' | 'SELL' | 'WAIT';
  price: number;
  stopLoss: number;
  target1: number;
  target2: number;
  positionSize: number;
  confidence: number;
  timeframe: 'SCALP' | 'SWING' | 'POSITION';
  reasoning: string[];
}

function generateEntrySignal(
  currentPrice: number,
  range: MondayRange,
  levels: BreakoutLevels,
  signal: BreakoutSignal,
  accountSize: number
): EntrySignal {
  
  const riskAmount = accountSize * 0.02; // 2% risk
  
  switch (signal.type) {
    case 'UPPER_BREAKOUT':
      return generateLongEntry(currentPrice, range, levels, signal, riskAmount);
    
    case 'LOWER_BREAKOUT':
      return generateShortEntry(currentPrice, range, levels, signal, riskAmount);
    
    case 'MIDPOINT_REVERSION':
      return generateReversionEntry(currentPrice, range, levels, signal, riskAmount);
    
    default:
      return {
        action: 'WAIT',
        price: currentPrice,
        stopLoss: 0,
        target1: 0,
        target2: 0,
        positionSize: 0,
        confidence: 0,
        timeframe: 'WAIT',
        reasoning: ['No valid signal detected']
      };
  }
}

function generateLongEntry(
  price: number,
  range: MondayRange,
  levels: BreakoutLevels,
  signal: BreakoutSignal,
  riskAmount: number
): EntrySignal {
  
  const stopLoss = calculateRangeBasedStopLoss(price, range, signal);
  const riskPerShare = price - stopLoss;
  const positionSize = Math.floor(riskAmount / riskPerShare);
  
  // Target levels based on Fibonacci extensions
  const target1 = levels.extensions.upper[1]; // 127.2% extension
  const target2 = levels.extensions.upper[2]; // 161.8% extension
  
  const reasoning = [
    `Upper breakout at ${price}`,
    `Monday range: ${range.low} - ${range.high}`,
    `Stop loss: ${stopLoss}`,
    `Risk per share: $${riskPerShare.toFixed(2)}`
  ];
  
  if (range.isHugeRange) {
    reasoning.push('Huge range day - increased probability');
  }
  
  return {
    action: 'BUY',
    price,
    stopLoss,
    target1,
    target2,
    positionSize,
    confidence: signal.confidence,
    timeframe: range.isHugeRange ? 'SWING' : 'SCALP',
    reasoning
  };
}
```

### Exit Signal Algorithm
```typescript
interface ExitSignal {
  action: 'HOLD' | 'PARTIAL_PROFIT' | 'FULL_EXIT' | 'STOP_LOSS';
  price: number;
  quantity: number;
  reason: string;
  newStopLoss?: number;
}

function generateExitSignal(
  currentPrice: number,
  entry: EntrySignal,
  currentPosition: number,
  timeHeld: number // minutes
): ExitSignal {
  
  // Stop loss hit
  if ((entry.action === 'BUY' && currentPrice <= entry.stopLoss) ||
      (entry.action === 'SELL' && currentPrice >= entry.stopLoss)) {
    return {
      action: 'STOP_LOSS',
      price: currentPrice,
      quantity: currentPosition,
      reason: 'Stop loss triggered'
    };
  }
  
  // Target 1 hit - take partial profits
  if ((entry.action === 'BUY' && currentPrice >= entry.target1) ||
      (entry.action === 'SELL' && currentPrice <= entry.target1)) {
    return {
      action: 'PARTIAL_PROFIT',
      price: currentPrice,
      quantity: Math.floor(currentPosition * 0.5), // Take 50%
      reason: 'Target 1 reached',
      newStopLoss: entry.price // Move stop to breakeven
    };
  }
  
  // Target 2 hit - full exit
  if ((entry.action === 'BUY' && currentPrice >= entry.target2) ||
      (entry.action === 'SELL' && currentPrice <= entry.target2)) {
    return {
      action: 'FULL_EXIT',
      price: currentPrice,
      quantity: currentPosition,
      reason: 'Target 2 reached'
    };
  }
  
  // Time-based exit for scalps
  if (entry.timeframe === 'SCALP' && timeHeld > 60) { // 1 hour
    const profitThreshold = entry.action === 'BUY' ? 
      entry.price * 1.005 : entry.price * 0.995; // 0.5% profit
    
    if ((entry.action === 'BUY' && currentPrice >= profitThreshold) ||
        (entry.action === 'SELL' && currentPrice <= profitThreshold)) {
      return {
        action: 'FULL_EXIT',
        price: currentPrice,
        quantity: currentPosition,
        reason: 'Time-based exit with profit'
      };
    }
  }
  
  return {
    action: 'HOLD',
    price: currentPrice,
    quantity: 0,
    reason: 'Continue holding position'
  };
}
```

## Configuration and Constants

```typescript
const MONDAY_RANGE_CONFIG = {
  HUGE_RANGE_THRESHOLD: 16,        // Points for SPY
  MIN_VOLUME_MULTIPLIER: 1.5,      // 150% of average volume
  BREAKOUT_CONFIRMATION_TIME: 5,    // Minutes
  MAX_HOLDING_PERIOD: 300,         // 5 hours max
  PROFIT_TARGET_MULTIPLIERS: [1.272, 1.618, 2.0], // Fibonacci levels
  STOP_LOSS_RANGE_MULTIPLE: 0.25, // 25% of Monday range
  RISK_PERCENTAGE: 0.02,           // 2% risk per trade
  POSITION_SIZE_CAP: 0.20,         // 20% max position size
  
  TIME_FILTERS: {
    ENTRY_WINDOW_START: '09:45',   // No entries before 9:45 AM
    ENTRY_WINDOW_END: '15:30',     // No entries after 3:30 PM
    EXIT_BY: '15:50'               // Exit all positions by 3:50 PM
  },
  
  MARKET_CONDITIONS: {
    VIX_THRESHOLD: 20,             // High volatility threshold
    SPY_VOLUME_THRESHOLD: 50000000, // Minimum volume requirement
    TREND_CONFIRMATION_PERIODS: 20  // SMA periods for trend
  }
};
```

## Edge Cases and Risk Controls

```typescript
function validateMondayRangeSetup(
  range: MondayRange,
  marketConditions: MarketConditions
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Market holiday checks
  if (isMarketHoliday(range.date)) {
    errors.push('Monday was a market holiday');
  }
  
  // Low volume warning
  if (marketConditions.volume < MONDAY_RANGE_CONFIG.MARKET_CONDITIONS.SPY_VOLUME_THRESHOLD) {
    warnings.push('Low volume day - reduced reliability');
  }
  
  // High volatility environment
  if (marketConditions.vix > MONDAY_RANGE_CONFIG.MARKET_CONDITIONS.VIX_THRESHOLD) {
    warnings.push('High VIX environment - increased risk');
  }
  
  // Narrow range warning
  if (range.range < 5) {
    warnings.push('Narrow Monday range - reduced breakout potential');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```