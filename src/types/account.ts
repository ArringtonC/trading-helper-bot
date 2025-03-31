/**
 * Account model representing a trading account
 */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  lastUpdated: Date;
  monthlyDeposit?: number;
}

/**
 * Types of trading accounts supported by the system
 */
export enum AccountType {
  CASH = 'Cash',
  IBKR = 'IBKR',
  NINJA_TRADER = 'NinjaTrader',
}

/**
 * Monthly projection data for an account
 */
export interface Projection {
  month: string;
  balance: number;
}

/**
 * Account with its projections
 */
export interface AccountWithProjections extends Account {
  projections: Projection[];
}

/**
 * Demo account data for initial development
 */
export const DEMO_ACCOUNT: Account = {
  id: "demo1",
  name: "Demo Trading Account",
  type: AccountType.CASH,
  balance: 0,
  lastUpdated: new Date(),
  monthlyDeposit: 100
}; 