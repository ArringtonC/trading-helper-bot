# Position Sizing Algorithms Specification

## 1. Two Percent Risk Rule Implementation

### Core Formula
```
Position Size (shares) = (Account Value × Risk Percentage) / (Entry Price - Stop Loss Price)
```

### Detailed Algorithm
```typescript
interface PositionSizeInput {
  accountValue: number;        // Total account value in USD
  riskPercentage: number;      // Risk per trade (default: 0.02 or 2%)
  entryPrice: number;          // Planned entry price per share
  stopLossPrice: number;       // Stop loss price per share
  sharesPerContract?: number;  // For options (default: 100)
}

function calculatePositionSize(input: PositionSizeInput): PositionSizeOutput {
  // Step 1: Calculate dollar risk
  const dollarRisk = input.accountValue * input.riskPercentage;
  
  // Step 2: Calculate risk per share
  const riskPerShare = Math.abs(input.entryPrice - input.stopLossPrice);
  
  // Step 3: Validate inputs
  if (riskPerShare <= 0) {
    throw new Error("Invalid stop loss placement");
  }
  
  // Step 4: Calculate raw position size
  const rawShares = dollarRisk / riskPerShare;
  
  // Step 5: Round down to nearest whole share
  const shares = Math.floor(rawShares);
  
  // Step 6: Calculate position value
  const positionValue = shares * input.entryPrice;
  
  // Step 7: Verify position doesn't exceed account limits
  const maxPositionValue = input.accountValue * MAX_POSITION_PERCENTAGE;
  
  return {
    shares: Math.min(shares, Math.floor(maxPositionValue / input.entryPrice)),
    dollarRisk: shares * riskPerShare,
    positionValue: shares * input.entryPrice,
    percentOfAccount: (shares * input.entryPrice) / input.accountValue
  };
}
```

## 2. Stop Loss Placement Calculations

### ATR-Based Stop Loss
```
Stop Loss = Entry Price - (ATR × Multiplier)
```

### Percentage-Based Stop Loss
```
Stop Loss = Entry Price × (1 - Stop Percentage)
```

### Support Level Stop Loss
```typescript
function calculateSupportStopLoss(data: PriceData[]): number {
  // Find recent support levels
  const supports = findSupportLevels(data, {
    lookback: 20,
    touchCount: 2,
    tolerance: 0.02
  });
  
  // Place stop below strongest support
  const strongestSupport = supports[0];
  const buffer = strongestSupport * 0.005; // 0.5% buffer
  
  return strongestSupport - buffer;
}
```

## 3. Share/Contract Quantity Calculations

### Stock Position Sizing
```typescript
function calculateShareQuantity(params: {
  accountValue: number;
  riskAmount: number;
  entryPrice: number;
  stopPrice: number;
}): number {
  const riskPerShare = Math.abs(params.entryPrice - params.stopPrice);
  const rawShares = params.riskAmount / riskPerShare;
  
  // Round to nearest lot size
  const lotSize = getLotSize(params.entryPrice);
  return Math.floor(rawShares / lotSize) * lotSize;
}

function getLotSize(price: number): number {
  if (price < 1) return 100;      // Penny stocks: 100 share lots
  if (price < 10) return 10;      // Low price: 10 share lots
  return 1;                        // Regular stocks: 1 share lots
}
```

### Options Contract Sizing
```typescript
function calculateOptionContracts(params: {
  accountValue: number;
  riskAmount: number;
  optionPrice: number;  // Price per contract
  deltaPerContract: number;
  stockStopLoss: number;
}): number {
  // Calculate theoretical loss per contract at stop
  const lossPerContract = params.optionPrice * 100 * params.deltaPerContract;
  
  // Calculate max contracts based on risk
  const maxContracts = Math.floor(params.riskAmount / lossPerContract);
  
  // Apply Kelly Criterion adjustment
  const kellyFraction = calculateKellyFraction(params);
  const adjustedContracts = Math.floor(maxContracts * kellyFraction);
  
  return Math.max(1, adjustedContracts);
}
```

## 4. Portfolio Risk Aggregation Methods

### Total Portfolio Risk
```typescript
function calculatePortfolioRisk(positions: Position[]): PortfolioRisk {
  let totalRisk = 0;
  let correlatedRisk = 0;
  
  // Calculate individual position risks
  const positionRisks = positions.map(pos => ({
    symbol: pos.symbol,
    risk: (pos.currentPrice - pos.stopLoss) * pos.shares,
    sector: pos.sector,
    beta: pos.beta
  }));
  
  // Sum uncorrelated risk
  totalRisk = positionRisks.reduce((sum, pr) => sum + pr.risk, 0);
  
  // Calculate correlation matrix
  const correlationMatrix = calculateCorrelationMatrix(positions);
  
  // Apply correlation adjustments
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const correlation = correlationMatrix[i][j];
      const jointRisk = positionRisks[i].risk * positionRisks[j].risk * correlation;
      correlatedRisk += jointRisk;
    }
  }
  
  return {
    totalRisk,
    correlatedRisk,
    effectiveRisk: Math.sqrt(totalRisk * totalRisk + correlatedRisk),
    riskPercentage: (Math.sqrt(totalRisk * totalRisk + correlatedRisk)) / accountValue
  };
}
```

### Sector Concentration Risk
```typescript
function calculateSectorConcentration(positions: Position[]): SectorRisk[] {
  const sectorMap = new Map<string, number>();
  const totalValue = positions.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
  
  positions.forEach(pos => {
    const value = pos.shares * pos.currentPrice;
    sectorMap.set(pos.sector, (sectorMap.get(pos.sector) || 0) + value);
  });
  
  return Array.from(sectorMap.entries()).map(([sector, value]) => ({
    sector,
    value,
    percentage: value / totalValue,
    risk: value > (totalValue * MAX_SECTOR_CONCENTRATION) ? 'HIGH' : 'ACCEPTABLE'
  }));
}
```

## 5. Maximum Position Size Limits

### Progressive Position Sizing
```typescript
const POSITION_SIZE_LIMITS = {
  beginner: {
    maxPercentPerPosition: 0.05,      // 5% max per position
    maxPercentAtRisk: 0.01,           // 1% max risk per position
    maxOpenPositions: 3,              // 3 positions max
    maxTotalExposure: 0.15            // 15% total exposure
  },
  intermediate: {
    maxPercentPerPosition: 0.10,      // 10% max per position
    maxPercentAtRisk: 0.02,           // 2% max risk per position
    maxOpenPositions: 5,              // 5 positions max
    maxTotalExposure: 0.50            // 50% total exposure
  },
  advanced: {
    maxPercentPerPosition: 0.20,      // 20% max per position
    maxPercentAtRisk: 0.02,           // 2% max risk per position
    maxOpenPositions: 10,             // 10 positions max
    maxTotalExposure: 1.00            // 100% total exposure
  },
  professional: {
    maxPercentPerPosition: 0.25,      // 25% max per position
    maxPercentAtRisk: 0.03,           // 3% max risk per position
    maxOpenPositions: 20,             // 20 positions max
    maxTotalExposure: 1.50            // 150% with margin
  }
};

function enforcePositionLimits(
  proposedPosition: ProposedPosition,
  currentPortfolio: Portfolio,
  traderLevel: TraderLevel
): PositionSizeAdjustment {
  const limits = POSITION_SIZE_LIMITS[traderLevel];
  const accountValue = currentPortfolio.totalValue;
  
  // Check single position size
  const proposedPercent = proposedPosition.value / accountValue;
  if (proposedPercent > limits.maxPercentPerPosition) {
    proposedPosition.shares = Math.floor(
      (accountValue * limits.maxPercentPerPosition) / proposedPosition.entryPrice
    );
  }
  
  // Check risk limit
  const proposedRisk = proposedPosition.shares * 
    (proposedPosition.entryPrice - proposedPosition.stopLoss);
  const riskPercent = proposedRisk / accountValue;
  
  if (riskPercent > limits.maxPercentAtRisk) {
    proposedPosition.shares = Math.floor(
      (accountValue * limits.maxPercentAtRisk) / 
      (proposedPosition.entryPrice - proposedPosition.stopLoss)
    );
  }
  
  // Check total exposure
  const currentExposure = currentPortfolio.positions.reduce(
    (sum, p) => sum + (p.shares * p.currentPrice), 0
  );
  const newTotalExposure = currentExposure + 
    (proposedPosition.shares * proposedPosition.entryPrice);
  
  if (newTotalExposure > accountValue * limits.maxTotalExposure) {
    const availableCapital = (accountValue * limits.maxTotalExposure) - currentExposure;
    proposedPosition.shares = Math.floor(availableCapital / proposedPosition.entryPrice);
  }
  
  return proposedPosition;
}
```

## Edge Cases and Validation

### Input Validation
```typescript
function validatePositionSizeInputs(input: PositionSizeInput): ValidationResult {
  const errors: string[] = [];
  
  if (input.accountValue <= 0) {
    errors.push("Account value must be positive");
  }
  
  if (input.riskPercentage <= 0 || input.riskPercentage > 0.05) {
    errors.push("Risk percentage must be between 0% and 5%");
  }
  
  if (input.entryPrice <= 0) {
    errors.push("Entry price must be positive");
  }
  
  if (input.stopLossPrice <= 0) {
    errors.push("Stop loss price must be positive");
  }
  
  if (input.stopLossPrice >= input.entryPrice) {
    errors.push("Stop loss must be below entry price for long positions");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### Minimum Position Size
```typescript
function ensureMinimumViablePosition(
  calculatedShares: number,
  entryPrice: number
): number {
  const minimumValue = 100; // $100 minimum position
  const minimumShares = Math.ceil(minimumValue / entryPrice);
  
  if (calculatedShares < minimumShares) {
    console.warn(`Position too small. Minimum ${minimumShares} shares required.`);
    return 0; // Don't take position if below minimum
  }
  
  return calculatedShares;
}
```

## Constants and Configuration

```typescript
const POSITION_SIZING_CONFIG = {
  DEFAULT_RISK_PERCENTAGE: 0.02,        // 2%
  MAX_RISK_PERCENTAGE: 0.05,            // 5%
  MIN_RISK_PERCENTAGE: 0.001,           // 0.1%
  MAX_POSITION_PERCENTAGE: 0.25,        // 25% of portfolio
  MAX_SECTOR_CONCENTRATION: 0.30,       // 30% in one sector
  DEFAULT_ATR_MULTIPLIER: 2.0,          // For ATR-based stops
  KELLY_FRACTION_CAP: 0.25,             // Max Kelly bet size
  CORRELATION_THRESHOLD: 0.70,          // High correlation threshold
  MIN_POSITION_VALUE: 100,              // $100 minimum
  COMMISSION_BUFFER: 1.01               // 1% for fees/slippage
};
```