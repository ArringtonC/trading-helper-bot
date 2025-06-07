/**
 * Service for calculating account projections
 */
var ProjectionService = /** @class */ (function () {
    function ProjectionService() {
    }
    /**
     * Calculate yearly projections for an account
     * @param account Account to calculate projections for
     * @returns Array of monthly projections
     */
    ProjectionService.calculateYearlyProjections = function (account) {
        var projections = [];
        var currentDate = new Date();
        var currentBalance = account.balance;
        // Calculate monthly growth rate based on historical performance
        // This is a simplified calculation - in a real app, you'd want to use
        // actual historical data and possibly machine learning models
        var monthlyGrowthRate = 0.02; // 2% monthly growth assumption
        // Generate projections for the next 12 months
        for (var i = 0; i < 12; i++) {
            var projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            var projectedBalance = currentBalance * Math.pow(1 + monthlyGrowthRate, i + 1);
            projections.push({
                month: projectionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                balance: projectedBalance
            });
        }
        return projections;
    };
    /**
     * Calculate summary statistics for projections
     */
    ProjectionService.calculateProjectionSummary = function (account, projections) {
        if (!projections.length) {
            return {
                startingBalance: account.balance,
                finalBalance: account.balance,
                totalDeposits: 0,
                numDeposits: 0
            };
        }
        var currentDate = new Date(account.lastUpdated);
        var currentMonth = currentDate.getMonth();
        var numDeposits = 12 - currentMonth;
        var finalBalance = projections[projections.length - 1].balance;
        var totalDeposits = (account.monthlyDeposit || 0) * numDeposits;
        return {
            startingBalance: account.balance,
            finalBalance: finalBalance,
            totalDeposits: totalDeposits,
            numDeposits: numDeposits
        };
    };
    return ProjectionService;
}());
export { ProjectionService };
