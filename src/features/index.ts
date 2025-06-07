import { NormalizedTradeData } from '../types/trade';
import { tradeDurationFeature, tradePLFeature, rsiFeature, macdFeature, bollingerFeature, streakFeature, marketRegimeFeature } from './core/tradeFeatures';
import { FeatureDefinition, FeatureResult } from './types';

// Registry of all feature definitions
const featureRegistry: FeatureDefinition[] = [
  tradeDurationFeature,
  tradePLFeature,
  rsiFeature,
  macdFeature,
  bollingerFeature,
  streakFeature,
  marketRegimeFeature,
  // add more features here
];

export async function computeFeaturesForTrade(trade: NormalizedTradeData, allTrades: NormalizedTradeData[]): Promise<FeatureResult> {
  const result: FeatureResult = {};
  for (const feature of featureRegistry) {
    const calculatedValue = feature.calculate(trade, allTrades);
    // Await the result if it's a Promise
    if (calculatedValue instanceof Promise) {
      result[feature.name] = await calculatedValue;
    } else {
      result[feature.name] = calculatedValue;
    }
  }
  return result;
}

export async function computeFeaturesForBatch(trades: NormalizedTradeData[]): Promise<FeatureResult[]> {
  // Use Promise.all to process trades concurrently
  const featureResults = await Promise.all(
    trades.map(trade => computeFeaturesForTrade(trade, trades))
  );
  return featureResults;
} 