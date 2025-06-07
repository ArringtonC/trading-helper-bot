import { NormalizedTradeData } from '../types/trade';

export type FeatureValue = number | string | boolean | null;

export interface FeatureDefinition {
  name: string;
  description: string;
  calculate: (trade: NormalizedTradeData, allTrades: NormalizedTradeData[]) => FeatureValue | Promise<FeatureValue>;
  dependsOn?: string[];
}

export type FeatureResult = Record<string, FeatureValue>; 
 
 
 
 
 