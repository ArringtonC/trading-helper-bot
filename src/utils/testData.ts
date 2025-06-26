import { insertNormalizedTrades } from '../services/DatabaseService';
import { NormalizedTradeData, BrokerType, AssetCategory } from '../types/trade';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate realistic sample trading data for testing the UnifiedAnalyticsEngine
 */
export const generateSampleTrades = (): NormalizedTradeData[] => {
  const trades: NormalizedTradeData[] = [];
  const symbols = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL'];
  const startDate = new Date('2024-01-01');
  const endDate = new Date();
  
  // Generate 50 trades over the past year
  for (let i = 0; i < 50; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const isOption = Math.random() > 0.3; // 70% options, 30% stocks
    
    // Random date between start and end
    const tradeDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    const tradeDateStr = tradeDate.toISOString().split('T')[0];
    
    // Generate realistic trade data
    const quantity = isOption ? Math.floor(Math.random() * 10) + 1 : Math.floor(Math.random() * 100) + 10;
    const basePrice = symbol === 'SPY' ? 450 : symbol === 'QQQ' ? 380 : 
                     symbol === 'AAPL' ? 180 : symbol === 'MSFT' ? 350 :
                     symbol === 'NVDA' ? 800 : symbol === 'TSLA' ? 250 :
                     symbol === 'AMZN' ? 150 : 2800; // GOOGL
    
    const tradePrice = isOption ? 
      Math.random() * 20 + 1 : // Options: $1-21
      basePrice + (Math.random() - 0.5) * 50; // Stocks: ±$25 from base
    
    const commission = Math.random() * 2 + 0.5; // $0.50 - $2.50
    const netAmount = quantity * tradePrice * (isOption ? 100 : 1) * (Math.random() > 0.5 ? -1 : 1) - commission;
    
    // Generate option-specific data if it's an option
    let optionData = {};
    if (isOption) {
      const isCall = Math.random() > 0.5;
      const strikePrice = Math.round(basePrice + (Math.random() - 0.5) * 100);
      const expiryDate = new Date(tradeDate);
      expiryDate.setDate(expiryDate.getDate() + Math.floor(Math.random() * 60) + 7); // 1-9 weeks out
      
      optionData = {
        assetCategory: 'OPT' as AssetCategory,
        optionSymbol: `${symbol}${expiryDate.toISOString().slice(2,4)}${String(expiryDate.getMonth() + 1).padStart(2, '0')}${String(expiryDate.getDate()).padStart(2, '0')}${isCall ? 'C' : 'P'}${String(strikePrice * 1000).padStart(8, '0')}`,
        expiryDate: expiryDate.toISOString().split('T')[0],
        strikePrice,
        putCall: isCall ? 'C' : 'P',
        multiplier: 100,
        action: Math.random() > 0.5 ? 'BTO' : 'STC',
        openCloseIndicator: Math.random() > 0.5 ? 'O' : 'C'
      };
    }
    
    const trade: NormalizedTradeData = {
      id: uuidv4(),
      importTimestamp: new Date().toISOString(),
      broker: BrokerType.IBKR,
      accountId: 'DEMO123',
      tradeDate: tradeDateStr,
      symbol,
      description: isOption ? `${symbol} Option Trade` : `${symbol} Stock Trade`,
      assetCategory: isOption ? 'OPT' : 'STK',
      quantity,
      tradePrice,
      currency: 'USD',
      commission: -commission,
      fees: -0.1,
      netAmount,
      ...optionData,
      rawCsvRow: { source: 'sample_data_generator' }
    };
    
    trades.push(trade);
  }
  
  // Sort by trade date
  trades.sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime());
  
  return trades;
};

/**
 * Populate the database with sample trading data
 */
export const populateSampleData = async (): Promise<void> => {
  try {
    const sampleTrades = generateSampleTrades();
    const result = await insertNormalizedTrades(sampleTrades);
    
    console.log(`✅ Sample data populated successfully!`);
    console.log(`   - ${result.successCount} trades inserted`);
    console.log(`   - ${result.errors.length} errors`);
    
    if (result.errors.length > 0) {
      console.warn('Errors during sample data insertion:', result.errors);
    }
  } catch (error) {
    console.error('❌ Failed to populate sample data:', error);
    throw error;
  }
};

/**
 * Check if sample data already exists
 */
export const hasSampleData = async (): Promise<boolean> => {
  try {
    const { getTrades } = await import('../services/DatabaseService');
    const trades = await getTrades();
    return trades.length > 0;
  } catch (error) {
    console.error('Error checking for sample data:', error);
    return false;
  }
};

/**
 * Initialize sample data if none exists
 */
export const initializeSampleDataIfNeeded = async (): Promise<void> => {
  const hasData = await hasSampleData();
  
  if (!hasData) {
    console.log('🔄 No trading data found. Generating sample data...');
    await populateSampleData();
  } else {
    console.log('✅ Trading data already exists. Skipping sample data generation.');
  }
}; 