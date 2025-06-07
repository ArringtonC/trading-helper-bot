"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionStrategy = void 0;
exports.getContractMultiplier = getContractMultiplier;
exports.calculateTradePL = calculateTradePL;
exports.isExpired = isExpired;
exports.daysUntilExpiration = daysUntilExpiration;
/**
 * Represents an options trading strategy
 */
var OptionStrategy;
(function (OptionStrategy) {
    OptionStrategy["LONG_CALL"] = "LONG_CALL";
    OptionStrategy["SHORT_CALL"] = "SHORT_CALL";
    OptionStrategy["LONG_PUT"] = "LONG_PUT";
    OptionStrategy["SHORT_PUT"] = "SHORT_PUT";
    OptionStrategy["CALL_SPREAD"] = "CALL_SPREAD";
    OptionStrategy["PUT_SPREAD"] = "PUT_SPREAD";
    OptionStrategy["IRON_CONDOR"] = "IRON_CONDOR";
    OptionStrategy["BUTTERFLY"] = "BUTTERFLY";
    OptionStrategy["OTHER"] = "OTHER";
})(OptionStrategy || (exports.OptionStrategy = OptionStrategy = {}));
/**
 * Calculate the multiplier for an option contract
 * Default is 100 shares per contract for equity options
 */
function getContractMultiplier(trade) {
    // Standard options contract is 100 shares
    return 100;
}
/**
 * Calculate the profit/loss for a trade
 */
function calculateTradePL(trade) {
    console.log(`\n🔍 Calculating P&L for trade: ${trade.symbol}`);
    console.log('Trade details:', JSON.stringify({
        id: trade.id,
        symbol: trade.symbol,
        putCall: trade.putCall,
        strike: trade.strike,
        quantity: trade.quantity,
        premium: trade.premium,
        openDate: trade.openDate,
        closeDate: trade.closeDate,
        closePremium: trade.closePremium,
        strategy: trade.strategy,
        commission: trade.commission,
        notes: trade.notes
    }, null, 2));
    // Check if P&L is stored in notes
    if (trade.notes) {
        // Try to extract total P&L first
        const totalPLMatch = trade.notes.match(/Total P&L: \$([-\d.]+)/);
        if (totalPLMatch && totalPLMatch[1]) {
            const pl = parseFloat(totalPLMatch[1]);
            console.log('Found total P&L in notes:', pl);
            return pl;
        }
        // If no total P&L, try to calculate from realized and unrealized P&L
        const realizedPLMatch = trade.notes.match(/Realized P&L: \$([-\d.]+)/);
        const unrealizedPLMatch = trade.notes.match(/Unrealized P&L: \$([-\d.]+)/);
        if (realizedPLMatch && unrealizedPLMatch) {
            const realizedPL = parseFloat(realizedPLMatch[1]);
            const unrealizedPL = parseFloat(unrealizedPLMatch[1]);
            const totalPL = realizedPL + unrealizedPL;
            console.log('Calculated P&L from realized and unrealized:', totalPL);
            return totalPL;
        }
    }
    const standardMultiplier = 100; // Standard options contract multiplier
    const quantity = Math.abs(trade.quantity); // Quantity is already in contracts
    const commission = trade.commission || 0;
    // For open trades, calculate unrealized P&L
    if (!trade.closeDate || !trade.closePremium) {
        // If premium is undefined, we can't calculate P&L
        if (trade.premium === undefined) {
            console.log('Premium is undefined, returning 0');
            return 0;
        }
        // Premium is per share, total cost is premium * 100 per contract
        const totalCost = trade.premium * standardMultiplier * quantity;
        // For long positions (positive quantity), cost is negative
        // For short positions (negative quantity), cost is positive
        const pl = trade.quantity > 0 ? -totalCost : totalCost;
        console.log('Open trade P&L calculation:', JSON.stringify({
            standardMultiplier,
            quantity,
            premium: trade.premium,
            totalCost,
            isLong: trade.quantity > 0,
            commission,
            pl: pl - commission
        }, null, 2));
        return pl - commission;
    }
    // For closed trades, calculate realized P&L
    // If either premium is undefined, we can't calculate P&L
    if (trade.premium === undefined) {
        console.log('Premium is undefined, returning 0');
        return 0;
    }
    const openCost = trade.premium * standardMultiplier * quantity;
    const closeCost = trade.closePremium * standardMultiplier * quantity;
    let pl;
    if (trade.quantity > 0) {
        // Long position: Sell price - Buy price
        pl = closeCost - openCost - commission;
    }
    else {
        // Short position: Buy price - Sell price
        pl = openCost - closeCost - commission;
    }
    console.log('Closed trade P&L calculation:', JSON.stringify({
        standardMultiplier,
        quantity,
        openPremium: trade.premium,
        closePremium: trade.closePremium,
        openCost,
        closeCost,
        commission,
        isLong: trade.quantity > 0,
        pl
    }, null, 2));
    return pl;
}
/**
 * Check if an option is expired
 */
function isExpired(trade) {
    return daysUntilExpiration(trade) <= 0;
}
/**
 * Calculate days until expiration
 */
function daysUntilExpiration(trade) {
    const today = new Date();
    const expiry = new Date(trade.expiry);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
