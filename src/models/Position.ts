export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  marketPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  strike?: number;
  expiry?: Date;
  putCall?: 'PUT' | 'CALL';
  assetType: 'STOCK' | 'OPTION' | 'FUTURE' | 'OTHER';
  currency: string;
  accountId: string;
  lastUpdated: Date;
} 