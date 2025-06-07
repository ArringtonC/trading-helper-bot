export interface IBKRTradeRecord {
  symbol: string;
  dateTime: string;
  quantity: number;
  tradePrice: number;
  commissionFee: number;
  assetCategory: string;
  description: string;
  code: string;
  realizedPL: number;
  mtmPL: number;
  tradePL: number;
  putCall?: 'PUT' | 'CALL';
  closeDate?: string;
} 