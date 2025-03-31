import { Account, Projection } from '../types/account';

/**
 * Service for calculating account projections
 */
export class ProjectionService {
  /**
   * Calculate monthly projections for an account for the remaining months in the year
   * 
   * @param account Account to generate projections for
   * @returns Array of monthly projections
   */
  public static calculateYearlyProjections(account: Account): Projection[] {
    const currentDate = new Date(account.lastUpdated);
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed (0 = January)
    
    const projections: Projection[] = [];
    let runningBalance = account.balance;
    
    // Generate a projection for each month remaining in the year
    for (let month = currentMonth; month <= 11; month++) {
      // Add monthly deposit for current and future months
      if (month >= currentMonth) {
        runningBalance += account.monthlyDeposit || 0;
      }
      
      // Format month name (e.g., "Jan", "Feb", etc.)
      const monthName = new Date(currentYear, month, 1)
        .toLocaleString('default', { month: 'short' });
      
      projections.push({
        month: monthName,
        balance: runningBalance
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