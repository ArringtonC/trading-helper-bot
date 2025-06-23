# Pattern Recognition Mathematical Definitions

## 1. Bull Flag Pattern Recognition

### Mathematical Definition
A Bull Flag consists of:
1. **Flagpole**: Strong upward price movement (>3% in 1-5 days)
2. **Flag**: Consolidation period with slight downward drift
3. **Breakout**: Price breaks above flag's upper trendline with volume

```typescript
interface BullFlagPattern {
  flagpole: {
    startPrice: number;
    endPrice: number;
    duration: number;      // bars
    volume: number[];      // volume during flagpole
    strength: number;      // price change percentage
  };
  flag: {
    highPoints: number[];  // upper trendline points
    lowPoints: number[];   // lower trendline points
    slope: number;         // flag slope (should be negative)
    duration: number;      // consolidation period
    volumeDecline: number; // volume decline percentage
  };
  breakout: {
    price: number;         // breakout price
    volume: number;        // breakout volume
    confirmed: boolean;    // above average volume
  };
}

function detectBullFlag(prices: OHLCV[], minFlagpole: number = 0.03): BullFlagPattern | null {
  for (let i = 20; i < prices.length - 10; i++) {
    // Step 1: Identify potential flagpole
    const flagpole = identifyFlagpole(prices, i, minFlagpole);
    if (!flagpole) continue;
    
    // Step 2: Look for flag formation after flagpole
    const flag = identifyFlag(prices, flagpole.endIndex, flagpole.high);
    if (!flag) continue;
    
    // Step 3: Check for breakout
    const breakout = identifyBreakout(prices, flag.endIndex, flag.upperTrendline);
    if (!breakout) continue;
    
    // Step 4: Validate pattern quality
    const pattern = {
      flagpole,
      flag,
      breakout,
      quality: calculatePatternQuality(flagpole, flag, breakout)
    };
    
    if (pattern.quality > 0.70) {
      return pattern;
    }
  }
  
  return null;
}

function identifyFlagpole(
  prices: OHLCV[], 
  endIndex: number, 
  minGain: number
): Flagpole | null {
  // Look back for flagpole start (max 5 days)
  for (let lookback = 1; lookback <= 5; lookback++) {
    const startIndex = endIndex - lookback;
    if (startIndex < 0) break;
    
    const startPrice = prices[startIndex].low;
    const endPrice = prices[endIndex].high;
    const gain = (endPrice - startPrice) / startPrice;
    
    if (gain >= minGain) {
      // Validate flagpole strength
      const avgVolume = calculateAverageVolume(prices, startIndex - 20, 20);
      const flagpoleVolume = prices.slice(startIndex, endIndex + 1)
        .reduce((sum, bar) => sum + bar.volume, 0) / (endIndex - startIndex + 1);
      
      const volumeRatio = flagpoleVolume / avgVolume;
      
      if (volumeRatio > 1.5) { // Volume confirmation
        return {
          startIndex,
          endIndex,
          startPrice,
          endPrice,
          gain,
          duration: endIndex - startIndex + 1,
          volumeRatio,
          strength: calculateFlagpoleStrength(prices, startIndex, endIndex)
        };
      }
    }
  }
  
  return null;
}

function identifyFlag(
  prices: OHLCV[],
  startIndex: number,
  flagpoleHigh: number
): Flag | null {
  const maxFlagDuration = 15; // Max 15 bars for flag
  const minFlagDuration = 3;  // Min 3 bars for flag
  
  for (let duration = minFlagDuration; duration <= maxFlagDuration; duration++) {
    const endIndex = startIndex + duration;
    if (endIndex >= prices.length) break;
    
    const flagBars = prices.slice(startIndex, endIndex + 1);
    
    // Calculate trendlines
    const upperTrendline = calculateTrendline(flagBars.map(b => b.high));
    const lowerTrendline = calculateTrendline(flagBars.map(b => b.low));
    
    // Validate flag characteristics
    if (validateFlagCharacteristics(flagBars, upperTrendline, lowerTrendline, flagpoleHigh)) {
      return {
        startIndex,
        endIndex,
        upperTrendline,
        lowerTrendline,
        slope: upperTrendline.slope,
        volumeDecline: calculateVolumeDecline(flagBars),
        tightness: calculateFlagTightness(flagBars)
      };
    }
  }
  
  return null;
}

function validateFlagCharacteristics(
  flagBars: OHLCV[],
  upperTrendline: Trendline,
  lowerTrendline: Trendline,
  flagpoleHigh: number
): boolean {
  // 1. Flag should slope downward or sideways (-0.5% to +0.1% per day)
  const dailySlope = upperTrendline.slope;
  if (dailySlope > 0.001 || dailySlope < -0.005) return false;
  
  // 2. Flag should not retrace more than 50% of flagpole
  const flagLow = Math.min(...flagBars.map(b => b.low));
  const maxRetracement = 0.50;
  // Calculate retracement from flagpole high
  const retracement = (flagpoleHigh - flagLow) / flagpoleHigh;
  if (retracement > maxRetracement) return false;
  
  // 3. Volume should decline during flag
  const volumeDecline = calculateVolumeDecline(flagBars);
  if (volumeDecline < 0.20) return false; // At least 20% volume decline
  
  // 4. Price should stay within flag boundaries
  const containmentRatio = calculateContainmentRatio(flagBars, upperTrendline, lowerTrendline);
  if (containmentRatio < 0.80) return false; // 80% of bars should be contained
  
  return true;
}

function calculateTrendline(values: number[]): Trendline {
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  
  // Linear regression
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const meanY = sumY / n;
  const totalSumSquares = values.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const residualSumSquares = values.reduce((sum, y, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const rSquared = 1 - (residualSumSquares / totalSumSquares);
  
  return {
    slope,
    intercept,
    rSquared,
    getValueAt: (x: number) => slope * x + intercept
  };
}
```

### Bull Flag Success Rate Calculation
```typescript
function calculateBullFlagSuccessRate(
  historicalPatterns: BullFlagPattern[],
  lookAheadPeriod: number = 10
): PatternStatistics {
  let successful = 0;
  let total = historicalPatterns.length;
  const returns: number[] = [];
  
  historicalPatterns.forEach(pattern => {
    const breakoutPrice = pattern.breakout.price;
    const targetPrice = calculateBullFlagTarget(pattern);
    
    // Check if target was reached within lookAheadPeriod
    const futurePrice = pattern.futurePrice || breakoutPrice; // Would be actual future price
    const actualReturn = (futurePrice - breakoutPrice) / breakoutPrice;
    const targetReturn = (targetPrice - breakoutPrice) / breakoutPrice;
    
    returns.push(actualReturn);
    
    if (actualReturn >= targetReturn * 0.8) { // 80% of target reached
      successful++;
    }
  });
  
  return {
    successRate: successful / total,
    averageReturn: returns.reduce((a, b) => a + b, 0) / returns.length,
    winRate: returns.filter(r => r > 0).length / returns.length,
    averageWin: returns.filter(r => r > 0).reduce((a, b) => a + b, 0) / returns.filter(r => r > 0).length,
    averageLoss: returns.filter(r => r < 0).reduce((a, b) => a + b, 0) / returns.filter(r => r < 0).length,
    profitFactor: Math.abs(
      returns.filter(r => r > 0).reduce((a, b) => a + b, 0) /
      returns.filter(r => r < 0).reduce((a, b) => a + b, 0)
    )
  };
}

function calculateBullFlagTarget(pattern: BullFlagPattern): number {
  // Traditional target: Flagpole height added to breakout point
  const flagpoleHeight = pattern.flagpole.endPrice - pattern.flagpole.startPrice;
  return pattern.breakout.price + flagpoleHeight;
}
```

## 2. Cup and Handle Pattern Recognition

### Precise Mathematical Criteria
```typescript
interface CupHandlePattern {
  cup: {
    leftRim: number;      // Left high point
    rightRim: number;     // Right high point
    bottom: number;       // Cup bottom
    depth: number;        // Depth as % of left rim
    duration: number;     // Weeks in formation
    shape: 'U' | 'V';     // Cup shape quality
  };
  handle: {
    start: number;        // Handle start price
    low: number;          // Handle low
    duration: number;     // Handle duration (days)
    retracement: number;  // % retracement from right rim
    volumePattern: 'DECLINING' | 'STABLE' | 'INCREASING';
  };
  breakout: {
    price: number;        // Breakout price above right rim
    volume: number;       // Breakout volume
    confirmed: boolean;   // Volume > 150% of average
  };
}

function detectCupAndHandle(
  dailyPrices: OHLCV[],
  minCupDuration: number = 7 * 5,  // 7 weeks minimum
  maxCupDuration: number = 65 * 5  // 65 weeks maximum
): CupHandlePattern | null {
  
  for (let i = minCupDuration; i < dailyPrices.length - 30; i++) {
    // Step 1: Identify potential cup formation
    const cup = identifyCup(dailyPrices, i - minCupDuration, i);
    if (!cup || !validateCupCriteria(cup)) continue;
    
    // Step 2: Look for handle formation
    const handle = identifyHandle(dailyPrices, i, cup.rightRim);
    if (!handle || !validateHandleCriteria(handle, cup)) continue;
    
    // Step 3: Check for breakout
    const breakout = identifyBreakout(dailyPrices, handle.endIndex, cup.rightRim);
    if (!breakout) continue;
    
    const pattern = { cup, handle, breakout };
    
    // Step 4: Validate overall pattern quality
    if (validateCupHandlePattern(pattern)) {
      return pattern;
    }
  }
  
  return null;
}

function identifyCup(
  prices: OHLCV[],
  startIndex: number,
  endIndex: number
): Cup | null {
  const cupPrices = prices.slice(startIndex, endIndex + 1);
  
  // Find left and right rim (highest points near start and end)
  const leftRimIndex = findLocalMaximum(cupPrices, 0, Math.floor(cupPrices.length * 0.2));
  const rightRimIndex = findLocalMaximum(cupPrices, Math.floor(cupPrices.length * 0.8), cupPrices.length - 1);
  
  if (leftRimIndex === -1 || rightRimIndex === -1) return null;
  
  const leftRim = cupPrices[leftRimIndex].high;
  const rightRim = cupPrices[rightRimIndex].high;
  
  // Find cup bottom
  const bottomIndex = findGlobalMinimum(cupPrices, leftRimIndex, rightRimIndex);
  const bottom = cupPrices[bottomIndex].low;
  
  // Calculate cup metrics
  const depth = (leftRim - bottom) / leftRim;
  const rimDifference = Math.abs(rightRim - leftRim) / leftRim;
  const shape = analyzeCupShape(cupPrices, leftRimIndex, rightRimIndex, bottomIndex);
  
  return {
    leftRimIndex: startIndex + leftRimIndex,
    rightRimIndex: startIndex + rightRimIndex,
    bottomIndex: startIndex + bottomIndex,
    leftRim,
    rightRim,
    bottom,
    depth,
    rimDifference,
    shape,
    duration: endIndex - startIndex + 1
  };
}

function validateCupCriteria(cup: Cup): boolean {
  // 1. Cup depth should be 10-50% (deeper = stronger base)
  if (cup.depth < 0.10 || cup.depth > 0.50) return false;
  
  // 2. Right rim should be within 5% of left rim
  if (cup.rimDifference > 0.05) return false;
  
  // 3. Cup should be U-shaped, not V-shaped
  if (cup.shape === 'V') return false;
  
  // 4. Duration should be appropriate (7-65 weeks)
  const durationWeeks = cup.duration / 5;
  if (durationWeeks < 7 || durationWeeks > 65) return false;
  
  return true;
}

function identifyHandle(
  prices: OHLCV[],
  cupEndIndex: number,
  rightRimPrice: number
): Handle | null {
  const maxHandleDuration = 25; // Max 5 weeks for handle
  const minHandleDuration = 5;  // Min 1 week for handle
  
  for (let duration = minHandleDuration; duration <= maxHandleDuration; duration++) {
    const endIndex = cupEndIndex + duration;
    if (endIndex >= prices.length) break;
    
    const handleBars = prices.slice(cupEndIndex, endIndex + 1);
    const handleLow = Math.min(...handleBars.map(b => b.low));
    const retracement = (rightRimPrice - handleLow) / rightRimPrice;
    
    // Handle should retrace 10-50% of right side of cup
    if (retracement >= 0.10 && retracement <= 0.50) {
      const volumePattern = analyzeHandleVolume(handleBars);
      
      // Volume during handle should decline or remain stable
      if (volumePattern === 'DECLINING' || volumePattern === 'STABLE') {
        return {
          startIndex: cupEndIndex,
          endIndex,
          start: rightRimPrice,
          low: handleLow,
          retracement,
          duration,
          volumePattern,
          quality: calculateHandleQuality(handleBars, retracement, volumePattern)
        };
      }
    }
  }
  
  return null;
}

function analyzeCupShape(
  prices: OHLCV[],
  leftRimIndex: number,
  rightRimIndex: number,
  bottomIndex: number
): 'U' | 'V' {
  // Analyze the curvature of the cup
  const leftSide = prices.slice(leftRimIndex, bottomIndex + 1);
  const rightSide = prices.slice(bottomIndex, rightRimIndex + 1);
  
  // Calculate decline and recovery rates
  const leftDeclineRate = calculateDeclineRate(leftSide);
  const rightRecoveryRate = calculateRecoveryRate(rightSide);
  
  // U-shape: gradual decline and recovery
  // V-shape: sharp decline and recovery
  const isGradual = leftDeclineRate > -0.02 && rightRecoveryRate < 0.02; // <2% per day
  
  return isGradual ? 'U' : 'V';
}
```

### Cup and Handle Success Metrics
```typescript
function calculateCupHandleStatistics(patterns: CupHandlePattern[]): CupHandleStats {
  const results = patterns.map(pattern => {
    const target = calculateCupHandleTarget(pattern);
    const actualMove = pattern.actualHighAfterBreakout || target; // Would use real data
    const success = actualMove >= target * 0.90; // 90% of target reached
    
    return {
      success,
      targetReached: actualMove / target,
      daysToTarget: pattern.daysToTarget || 0,
      maxDrawdown: pattern.maxDrawdownAfterBreakout || 0
    };
  });
  
  return {
    successRate: results.filter(r => r.success).length / results.length,
    averageTargetReached: results.reduce((sum, r) => sum + r.targetReached, 0) / results.length,
    averageDaysToTarget: results.filter(r => r.success)
      .reduce((sum, r) => sum + r.daysToTarget, 0) / results.filter(r => r.success).length,
    maxDrawdownStats: {
      average: results.reduce((sum, r) => sum + r.maxDrawdown, 0) / results.length,
      maximum: Math.max(...results.map(r => r.maxDrawdown)),
      percentageWithinTolerance: results.filter(r => r.maxDrawdown < 0.10).length / results.length
    }
  };
}

function calculateCupHandleTarget(pattern: CupHandlePattern): number {
  // Target = Cup depth added to breakout point
  const cupDepth = pattern.cup.leftRim - pattern.cup.bottom;
  return pattern.breakout.price + cupDepth;
}
```

## 3. Double Bottom Pattern Recognition

### Mathematical Confirmation Rules
```typescript
interface DoubleBottomPattern {
  firstBottom: {
    price: number;
    index: number;
    volume: number;
    date: Date;
  };
  peak: {
    price: number;        // Peak between bottoms
    index: number;
    retracementFromFirst: number; // % retracement
  };
  secondBottom: {
    price: number;
    index: number;
    volume: number;
    date: Date;
    confirmationCriteria: {
      priceVariance: number;    // % difference from first bottom
      volumeComparison: number; // Volume vs first bottom
      higherLow: boolean;       // Second bottom slightly higher?
    };
  };
  neckline: {
    price: number;        // Resistance level to break
    slope: number;        // Neckline slope
    touches: number;      // Number of tests
  };
  confirmation: {
    breakoutPrice: number;
    breakoutVolume: number;
    confirmed: boolean;
    retestCompleted: boolean;
  };
}

function detectDoubleBottom(
  prices: OHLCV[],
  minDistanceBetweenBottoms: number = 15,
  maxDistanceBetweenBottoms: number = 100
): DoubleBottomPattern | null {
  
  for (let i = 50; i < prices.length - 20; i++) {
    // Step 1: Identify first bottom
    const firstBottom = identifyLocalMinimum(prices, i - 20, i + 5);
    if (!firstBottom) continue;
    
    // Step 2: Look for peak after first bottom
    const peak = identifyPeakAfterBottom(prices, firstBottom.index, minDistanceBetweenBottoms);
    if (!peak) continue;
    
    // Step 3: Look for second bottom
    const secondBottom = identifySecondBottom(
      prices, 
      peak.index, 
      firstBottom.price, 
      maxDistanceBetweenBottoms
    );
    if (!secondBottom) continue;
    
    // Step 4: Calculate neckline
    const neckline = calculateNeckline(prices, firstBottom, peak, secondBottom);
    
    // Step 5: Check for confirmation
    const confirmation = checkDoubleBottomConfirmation(prices, secondBottom.index, neckline);
    
    const pattern = {
      firstBottom,
      peak,
      secondBottom,
      neckline,
      confirmation
    };
    
    // Step 6: Validate pattern quality
    if (validateDoubleBottomPattern(pattern)) {
      return pattern;
    }
  }
  
  return null;
}

function identifySecondBottom(
  prices: OHLCV[],
  startIndex: number,
  firstBottomPrice: number,
  maxDistance: number
): SecondBottom | null {
  
  for (let i = startIndex; i < Math.min(startIndex + maxDistance, prices.length - 10); i++) {
    const localMin = identifyLocalMinimum(prices, i - 5, i + 5);
    if (!localMin) continue;
    
    const priceVariance = Math.abs(localMin.price - firstBottomPrice) / firstBottomPrice;
    
    // Second bottom should be within 3% of first bottom
    if (priceVariance <= 0.03) {
      const volumeComparison = localMin.volume / prices[startIndex].volume;
      const higherLow = localMin.price > firstBottomPrice;
      
      return {
        price: localMin.price,
        index: localMin.index,
        volume: localMin.volume,
        date: new Date(prices[localMin.index].timestamp),
        confirmationCriteria: {
          priceVariance,
          volumeComparison,
          higherLow
        }
      };
    }
  }
  
  return null;
}

function validateDoubleBottomPattern(pattern: DoubleBottomPattern): boolean {
  // 1. Price variance between bottoms should be minimal (<3%)
  if (pattern.secondBottom.confirmationCriteria.priceVariance > 0.03) return false;
  
  // 2. Peak should retrace at least 10% from first bottom
  if (pattern.peak.retracementFromFirst < 0.10) return false;
  
  // 3. Volume on second bottom should be lower (selling climax exhausted)
  if (pattern.secondBottom.confirmationCriteria.volumeComparison > 1.2) return false;
  
  // 4. Time between bottoms should be reasonable
  const timeBetweenBottoms = pattern.secondBottom.index - pattern.firstBottom.index;
  if (timeBetweenBottoms < 15 || timeBetweenBottoms > 100) return false;
  
  // 5. Neckline should have been tested multiple times
  if (pattern.neckline.touches < 2) return false;
  
  return true;
}

function calculateNeckline(
  prices: OHLCV[],
  firstBottom: Bottom,
  peak: Peak,
  secondBottom: SecondBottom
): Neckline {
  // Neckline connects the peak with any intermediate highs
  const necklinePoints: Point[] = [
    { x: peak.index, y: peak.price }
  ];
  
  // Look for other resistance points between first and second bottom
  for (let i = firstBottom.index; i <= secondBottom.index; i += 5) {
    const localMax = identifyLocalMaximum(prices, Math.max(0, i - 3), Math.min(prices.length - 1, i + 3));
    if (localMax && Math.abs(localMax.price - peak.price) / peak.price < 0.05) {
      necklinePoints.push({ x: localMax.index, y: localMax.price });
    }
  }
  
  // Calculate trendline through neckline points
  const trendline = calculateTrendline(necklinePoints.map(p => p.y));
  
  return {
    price: peak.price, // Primary resistance level
    slope: trendline.slope,
    touches: necklinePoints.length,
    equation: trendline
  };
}
```

### Double Bottom Success Rate Analysis
```typescript
function analyzeDoubleBottomPerformance(patterns: DoubleBottomPattern[]): PatternPerformance {
  const confirmed = patterns.filter(p => p.confirmation.confirmed);
  const withRetest = confirmed.filter(p => p.confirmation.retestCompleted);
  
  const results = confirmed.map(pattern => {
    const target = calculateDoubleBottomTarget(pattern);
    const breakoutToTarget = (target - pattern.confirmation.breakoutPrice) / pattern.confirmation.breakoutPrice;
    
    return {
      pattern,
      target,
      expectedReturn: breakoutToTarget,
      actualReturn: pattern.actualReturn || 0, // Would use historical data
      success: (pattern.actualReturn || 0) >= breakoutToTarget * 0.8,
      hadRetest: pattern.confirmation.retestCompleted,
      retestSuccess: pattern.retestHeld || false
    };
  });
  
  return {
    confirmationRate: confirmed.length / patterns.length,
    retestRate: withRetest.length / confirmed.length,
    retestSuccessRate: withRetest.filter(p => p.confirmation.retestCompleted).length / withRetest.length,
    overallSuccessRate: results.filter(r => r.success).length / results.length,
    averageReturn: results.reduce((sum, r) => sum + r.actualReturn, 0) / results.length,
    retestVsNoRetestPerformance: {
      withRetest: withRetest.map(p => p.actualReturn || 0).reduce((a, b) => a + b, 0) / withRetest.length,
      withoutRetest: confirmed.filter(p => !p.confirmation.retestCompleted)
        .map(p => p.actualReturn || 0).reduce((a, b) => a + b, 0) / 
        confirmed.filter(p => !p.confirmation.retestCompleted).length
    }
  };
}

function calculateDoubleBottomTarget(pattern: DoubleBottomPattern): number {
  // Target = Height of pattern (neckline to bottom) added to breakout point
  const patternHeight = pattern.neckline.price - Math.min(pattern.firstBottom.price, pattern.secondBottom.price);
  return pattern.confirmation.breakoutPrice + patternHeight;
}
```

## Pattern Recognition Configuration

```typescript
const PATTERN_RECOGNITION_CONFIG = {
  BULL_FLAG: {
    MIN_FLAGPOLE_GAIN: 0.03,        // 3% minimum flagpole
    MAX_FLAG_RETRACEMENT: 0.50,     // 50% max retracement
    MIN_VOLUME_INCREASE: 1.5,       // 150% volume on flagpole
    MAX_FLAG_DURATION: 15,          // 15 days max flag duration
    MIN_BREAKOUT_VOLUME: 1.3,       // 130% volume on breakout
    SUCCESS_RATE_THRESHOLD: 0.70     // 70% historical success rate
  },
  
  CUP_HANDLE: {
    MIN_CUP_DEPTH: 0.10,            // 10% minimum cup depth
    MAX_CUP_DEPTH: 0.50,            // 50% maximum cup depth
    MIN_CUP_DURATION: 35,           // 7 weeks minimum
    MAX_CUP_DURATION: 325,          // 65 weeks maximum
    MAX_RIM_DIFFERENCE: 0.05,       // 5% max difference between rims
    MIN_HANDLE_RETRACEMENT: 0.10,   // 10% min handle retracement
    MAX_HANDLE_RETRACEMENT: 0.50,   // 50% max handle retracement
    MAX_HANDLE_DURATION: 25         // 5 weeks max handle duration
  },
  
  DOUBLE_BOTTOM: {
    MAX_BOTTOM_VARIANCE: 0.03,      // 3% max variance between bottoms
    MIN_PEAK_RETRACEMENT: 0.10,     // 10% min peak retracement
    MIN_DISTANCE_BETWEEN_BOTTOMS: 15, // 15 days minimum
    MAX_DISTANCE_BETWEEN_BOTTOMS: 100, // 100 days maximum
    MIN_NECKLINE_TOUCHES: 2,        // 2 minimum neckline tests
    BREAKOUT_VOLUME_MULTIPLIER: 1.5  // 150% volume on breakout
  },
  
  GENERAL: {
    MIN_LIQUIDITY: 100000,          // $100k minimum daily volume
    MIN_PRICE: 5.00,                // $5 minimum stock price
    MAX_VOLATILITY: 0.05,           // 5% max daily volatility
    CONFIRMATION_BARS: 3,           // Bars needed for confirmation
    LOOKBACK_PERIOD: 252,           // 1 year for statistics
    MIN_PATTERN_QUALITY: 0.70       // 70% minimum quality score
  }
};
```

## Pattern Quality Scoring
```typescript
function calculatePatternQuality(pattern: any, type: PatternType): number {
  let score = 0;
  const weights = PATTERN_WEIGHTS[type];
  
  switch (type) {
    case 'BULL_FLAG':
      score += pattern.flagpole.strength * weights.flagpoleStrength;
      score += pattern.flag.volumeDecline * weights.volumeDecline;
      score += pattern.breakout.volumeConfirmation * weights.breakoutVolume;
      score += pattern.flag.tightness * weights.flagTightness;
      break;
      
    case 'CUP_HANDLE':
      score += pattern.cup.shapeQuality * weights.cupShape;
      score += pattern.handle.quality * weights.handleQuality;
      score += pattern.breakout.volumeConfirmation * weights.breakoutVolume;
      score += pattern.cup.durationScore * weights.duration;
      break;
      
    case 'DOUBLE_BOTTOM':
      score += pattern.symmetry * weights.symmetry;
      score += pattern.volumeAnalysis * weights.volumeAnalysis;
      score += pattern.necklineQuality * weights.necklineQuality;
      score += pattern.confirmation.strength * weights.confirmationStrength;
      break;
  }
  
  return Math.min(1.0, Math.max(0.0, score));
}
```