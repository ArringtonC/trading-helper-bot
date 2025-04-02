import { Account } from '../types/account';

interface Projection {
  month: string;
  balance: number;
}

/**
 * Service for calculating account projections
 */
export class ProjectionService {
  /**
   * Calculate yearly projections for an account
   * @param account Account to calculate projections for
   * @returns Array of monthly projections
   */
  public static calculateYearlyProjections(account: Account): Projection[] {
    const projections: Projection[] = [];
    const currentDate = new Date();
    const currentBalance = account.balance;
    
    // Calculate monthly growth rate based on historical performance
    // This is a simplified calculation - in a real app, you'd want to use
    // actual historical data and possibly machine learning models
    const monthlyGrowthRate = 0.02; // 2% monthly growth assumption
    
    // Generate projections for the next 12 months
    for (let i = 0; i < 12; i++) {
      const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const projectedBalance = currentBalance * Math.pow(1 + monthlyGrowthRate, i + 1);
      
      projections.push({
        month: projectionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        balance: projectedBalance
      });
    }
    
    return projections;
  }
  
  /**
   * Calculate summary statistics for projections
   */
  public static calculateProjectionSummary(account: Account, projections: Projection[]) {
    if (!projections.length) {
      return {
        startingBalance: account.balance,
        finalBalance: account.balance,
        totalDeposits: 0,
        numDeposits: 0
      };
    }
    
    const currentDate = new Date(account.lastUpdated);
    const currentMonth = currentDate.getMonth();
    const numDeposits = 12 - currentMonth;
    const finalBalance = projections[projections.length - 1].balance;
    const totalDeposits = (account.monthlyDeposit || 0) * numDeposits;
    
    return {
      startingBalance: account.balance,
      finalBalance,
      totalDeposits,
      numDeposits
    };
  }
} 