import { Position } from './Position';

export interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  cash?: number;
  marketValue?: number;
  lastUpdated?: Date;
  positions: Position[];
} 