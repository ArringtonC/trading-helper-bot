export enum OptionType {
  CALL = 'CALL',
  PUT = 'PUT'
}

export interface OptionTrade {
  id: string;
  symbol: string;
  putCall: 'PUT' | 'CALL';
  strike: number;
  expiry: Date;
  quantity: number;
  premium: number;
  openDate: Date;
  closeDate?: Date;
  profitLoss?: number;
  strategy?: string;
} 