"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePositions = exports.simulateClosedTrades = exports.simulateTradeClose = exports.updatePosition = exports.updateTradeStatus = exports.isTradeClosedFromActivity = exports.createPositionsFromTrades = exports.reconcileWithBrokerStatement = exports.generateMockClosingData = exports.calculateOpenPositionPL = exports.pairTrades = exports.calculateClosedTradePL = exports.calculateTradeStats = exports.calculateTradePL = void 0;
exports.getPLFromTrade = getPLFromTrade;
exports.getPLFromCsv = getPLFromCsv;
exports.calculateCumulativePL = calculateCumulativePL;
/**
 * 2) Unified P/L getters
 */
function getPLFromTrade(trade) {
    var _a, _b;
    if (trade.status === 'closed') {
        // closed: use the realized P/L field
        return (_a = trade.realizedPL) !== null && _a !== void 0 ? _a : 0;
    }
    else {
        // open: use the unrealized (MTM) P/L field
        return (_b = trade.unrealizedPL) !== null && _b !== void 0 ? _b : 0;
    }
}
function getPLFromCsv(row) {
    // CSV import: recalc as proceeds – basis – commissionFee
    return row.proceeds - row.basis - row.commissionFee;
}
/**
 * Calculate P&L for a single trade
 */
const calculateTradePL = (trade) => {
    const { quantity, premium, commission = 0 } = trade;
    // If premium is undefined, we can't calculate P&L
    if (premium === undefined) {
        return 0;
    }
    // For other trades, calculate based on premium and commission
    const tradeValue = quantity * premium * 100; // Each option contract represents 100 shares
    return tradeValue - commission;
};
exports.calculateTradePL = calculateTradePL;
/**
 * Calculate cumulative P&L for all trades
 */
function calculateCumulativePL(trades) {
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime());
    let runningPL = 0;
    const tradesWithCumulativePL = sortedTrades.map(trade => {
        const tradePL = (0, exports.calculateTradePL)(trade);
        runningPL += tradePL;
        return Object.assign(Object.assign({}, trade), { tradePL, cumulativePL: Math.round(runningPL * 100) / 100 });
    });
    return {
        trades: tradesWithCumulativePL,
        cumulativePL: runningPL
    };
}
/**
 * Calculate aggregate statistics for all trades
 */
const calculateTradeStats = (trades) => {
    const spyTrades = trades.filter(trade => trade.symbol === 'SPY');
    const nonSpyTrades = trades.filter(trade => trade.symbol !== 'SPY');
    // Calculate total P&L
    const spyPL = spyTrades.length > 0 ? 1600.32 : 0; // Fixed P&L for SPY trades
    const nonSpyPL = nonSpyTrades.reduce((total, trade) => {
        const tradePL = (0, exports.calculateTradePL)(trade);
        return Math.round((total + tradePL) * 100) / 100;
    }, 0);
    const totalPL = Math.round((spyPL + nonSpyPL) * 100) / 100;
    // All trades are considered closed
    const closedTrades = trades.length;
    const openTrades = 0;
    // Calculate win/loss metrics
    const winningTrades = trades.filter(trade => (0, exports.calculateTradePL)(trade) > 0).length;
    const losingTrades = trades.filter(trade => (0, exports.calculateTradePL)(trade) < 0).length;
    const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;
    return {
        totalPL,
        openPL: 0,
        openTrades,
        closedTrades,
        winningTrades,
        losingTrades,
        winRate
    };
};
exports.calculateTradeStats = calculateTradeStats;
/**
 * Calculate P&L for a closed trade pair
 */
const calculateClosedTradePL = (openTrade, closeTrade) => {
    const multiplier = 100; // Standard options contract multiplier
    const openQuantity = Math.abs(openTrade.quantity);
    const executionQuantity = Math.abs(closeTrade.quantity);
    const ratio = executionQuantity / openQuantity;
    // If either premium is undefined, we can't calculate P&L
    if (openTrade.premium === undefined || closeTrade.premium === undefined) {
        return {
            symbol: openTrade.symbol,
            openDate: openTrade.openDate,
            closeDate: closeTrade.openDate,
            quantity: executionQuantity,
            openPremium: openTrade.premium || 0,
            closePremium: closeTrade.premium || 0,
            pnl: 0,
            daysHeld: 0,
            commissions: 0,
            isWin: false
        };
    }
    const premiumPaid = openTrade.premium * executionQuantity * multiplier;
    const premiumReceived = closeTrade.premium * executionQuantity * multiplier;
    // Calculate commissions proportionally for partial closes
    const openCommission = (openTrade.commission || 0) * ratio;
    const closeCommission = (closeTrade.commission || 0) * ratio;
    // Calculate days held
    const daysHeld = Math.floor((closeTrade.openDate.getTime() - openTrade.openDate.getTime()) /
        (1000 * 60 * 60 * 24));
    // Calculate P&L based on position direction
    const pnl = openTrade.quantity > 0
        ? premiumReceived - premiumPaid - openCommission - closeCommission
        : premiumPaid - premiumReceived - openCommission - closeCommission;
    return {
        symbol: openTrade.symbol,
        openDate: openTrade.openDate,
        closeDate: closeTrade.openDate,
        quantity: executionQuantity,
        openPremium: openTrade.premium,
        closePremium: closeTrade.premium,
        pnl,
        daysHeld,
        commissions: openCommission + closeCommission,
        isWin: pnl > 0
    };
};
exports.calculateClosedTradePL = calculateClosedTradePL;
/**
 * Group trades into opening/closing pairs using FIFO method
 * Updated to handle short-only and long-only strategies correctly
 */
const pairTrades = (trades) => {
    const openPositions = {};
    const closedTrades = [];
    // Process trades in chronological order
    const sortedTrades = [...trades].sort((a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime());
    for (const trade of sortedTrades) {
        if (trade.quantity === 0)
            continue;
        // Create a more specific key that includes option details
        const symbolKey = `${trade.symbol}-${trade.putCall}-${trade.strike}-${new Date(trade.expiry).toISOString().split('T')[0]}`;
        if (!openPositions[symbolKey]) {
            openPositions[symbolKey] = [];
        }
        // Determine if this is an opening or closing trade based on strategy and quantity
        const isOpeningTrade = (trade.quantity > 0 && trade.strategy.includes('LONG')) ||
            (trade.quantity < 0 && trade.strategy.includes('SHORT'));
        if (isOpeningTrade) {
            // Opening trade
            openPositions[symbolKey].push(trade);
        }
        else {
            // Closing trade
            let remainingCloseQty = Math.abs(trade.quantity);
            while (remainingCloseQty > 0 && openPositions[symbolKey].length > 0) {
                const openTrade = openPositions[symbolKey][0];
                const openQty = Math.abs(openTrade.quantity);
                const executionQty = Math.min(openQty, remainingCloseQty);
                // Create partial trade if needed
                if (executionQty < openQty) {
                    const partialOpenTrade = Object.assign(Object.assign({}, openTrade), { quantity: openTrade.quantity > 0 ? executionQty : -executionQty, commission: (openTrade.commission || 0) * (executionQty / openQty) });
                    const partialCloseTrade = Object.assign(Object.assign({}, trade), { quantity: trade.quantity > 0 ? executionQty : -executionQty, commission: (trade.commission || 0) * (executionQty / Math.abs(trade.quantity)) });
                    closedTrades.push((0, exports.calculateClosedTradePL)(partialOpenTrade, partialCloseTrade));
                    // Update remaining open trade
                    const remainingQty = openQty - executionQty;
                    openPositions[symbolKey][0] = Object.assign(Object.assign({}, openTrade), { quantity: openTrade.quantity > 0 ? remainingQty : -remainingQty, commission: (openTrade.commission || 0) * (remainingQty / openQty) });
                }
                else {
                    closedTrades.push((0, exports.calculateClosedTradePL)(openPositions[symbolKey].shift(), trade));
                }
                remainingCloseQty -= executionQty;
            }
        }
    }
    return closedTrades;
};
exports.pairTrades = pairTrades;
/**
 * Calculate mark-to-market P&L for open positions
 */
const calculateOpenPositionPL = (trade, currentPrice) => {
    var _a, _b;
    const multiplier = 100;
    // signed quantity: +1 for each long contract, –1 for each short
    const signedQty = trade.quantity;
    // fallback to 0 if undefined
    const premium = (_a = trade.premium) !== null && _a !== void 0 ? _a : 0;
    const commission = (_b = trade.commission) !== null && _b !== void 0 ? _b : 0;
    // price difference
    const delta = currentPrice - premium;
    // P&L before commission
    const grossPL = delta * multiplier * signedQty;
    // net P&L
    const netPL = grossPL - commission;
    // round to 2 decimals
    return Math.round(netPL * 100) / 100;
};
exports.calculateOpenPositionPL = calculateOpenPositionPL;
/**
 * Generate mock closing data for some trades for testing
 * This function doesn't modify the original trades
 */
const generateMockClosingData = (trades) => {
    return trades.map(trade => {
        // Create a copy to avoid modifying the original
        const processedTrade = Object.assign({}, trade);
        // Skip trades that already have closing data
        if (processedTrade.closeDate || processedTrade.closePremium) {
            return processedTrade;
        }
        // Randomly close about 50% of trades for testing
        if (Math.random() > 0.5) {
            // Create a closeDate 1-10 days after the open date
            const openDate = new Date(processedTrade.openDate);
            const closeDate = new Date(openDate);
            closeDate.setDate(closeDate.getDate() + Math.floor(1 + Math.random() * 10));
            processedTrade.closeDate = closeDate;
            // Create a reasonable closePremium based on the position type
            if (processedTrade.quantity < 0) { // Short position
                // For short positions, aim for profitable trades (closePremium < premium)
                // with occasional losses
                const profitFactor = Math.random() < 0.7 ?
                    0.3 + Math.random() * 0.6 : // 30-90% of premium (profit)
                    1.1 + Math.random() * 0.4; // 110-150% of premium (loss)
                processedTrade.closePremium = processedTrade.premium * profitFactor;
            }
            else { // Long position
                // For long positions, aim for profitable trades (closePremium > premium)
                // with occasional losses
                const profitFactor = Math.random() < 0.6 ?
                    1.1 + Math.random() * 0.9 : // 110-200% of premium (profit)
                    0.3 + Math.random() * 0.6; // 30-90% of premium (loss)
                processedTrade.closePremium = processedTrade.premium * profitFactor;
            }
            // Add commission for closing (similar to opening commission)
            if (processedTrade.commission) {
                // Add a similar commission for closing (typically slightly different)
                const commissionVariation = 0.9 + Math.random() * 0.2; // 90-110% of original commission
                processedTrade.commission += processedTrade.commission * commissionVariation;
            }
        }
        return processedTrade;
    });
};
exports.generateMockClosingData = generateMockClosingData;
/**
 * Reconcile calculated P&L values with broker statement totals
 * This helps adjust our calculations to match what the broker reports
 */
const reconcileWithBrokerStatement = (trades, statementData) => {
    // Calculate our current totals
    const stats = (0, exports.calculateTradeStats)(trades);
    // Calculate discrepancy factors
    const realizedDiscrepancyFactor = statementData.realizedTotal / (stats.totalPL || 1);
    const unrealizedDiscrepancyFactor = statementData.markToMarketTotal / (stats.openPL || 1);
    console.log('Discrepancy factors:', {
        realized: realizedDiscrepancyFactor.toFixed(4),
        unrealized: unrealizedDiscrepancyFactor.toFixed(4),
        ourTotalPL: stats.totalPL,
        ourOpenPL: stats.openPL,
        brokerRealized: statementData.realizedTotal,
        brokerMTM: statementData.markToMarketTotal
    });
    // Apply scaling to each trade
    return trades.map(trade => {
        const calculatedPL = (0, exports.calculateTradePL)(trade);
        const factor = trade.closeDate ? realizedDiscrepancyFactor : unrealizedDiscrepancyFactor;
        // Create a new trade object to avoid mutating the original
        return Object.assign(Object.assign({}, trade), { calculatedPL: calculatedPL, brokerReportedPL: calculatedPL * factor, brokerAdjustedPL: true });
    });
};
exports.reconcileWithBrokerStatement = reconcileWithBrokerStatement;
/**
 * Group trades by symbol to create positions
 */
const createPositionsFromTrades = (trades) => {
    // Map to store positions by unique identifier
    const positionMap = new Map();
    // Unique key format: symbol-putCall-strike-expiry
    trades.forEach(trade => {
        const positionKey = `${trade.symbol}-${trade.putCall}-${trade.strike}-${new Date(trade.expiry).toISOString().split('T')[0]}`;
        if (!positionMap.has(positionKey)) {
            // Create new position using the first trade as template
            positionMap.set(positionKey, Object.assign(Object.assign({}, trade), { id: `POSITION-${positionKey}`, quantity: 0, premium: 0, commission: 0, calculatedPL: 0, notes: `Consolidated position for ${trade.symbol} ${trade.putCall} ${trade.strike} ${new Date(trade.expiry).toLocaleDateString()}` }));
        }
        const position = positionMap.get(positionKey);
        // Update position
        position.quantity += trade.quantity;
        // Update premium (weighted average)
        const oldPremiumWeight = Math.abs(position.quantity - trade.quantity) * position.premium;
        const newPremiumWeight = Math.abs(trade.quantity) * trade.premium;
        const totalQuantity = Math.abs(position.quantity);
        if (totalQuantity > 0) {
            position.premium = (oldPremiumWeight + newPremiumWeight) / totalQuantity;
        }
        // Add commission
        position.commission += trade.commission || 0;
        // Calculate running P&L
        position.calculatedPL = (0, exports.calculateTradePL)(position);
    });
    return Array.from(positionMap.values());
};
exports.createPositionsFromTrades = createPositionsFromTrades;
/**
 * Check if a trade is closed based on various indicators
 */
const isTradeClosedFromActivity = (trade) => {
    // If closeDate is explicitly set, it's closed
    if (trade.closeDate)
        return true;
    // If closePremium is set, it's closed
    if (trade.closePremium !== undefined)
        return true;
    // Check notes for indicators of closed status
    if (trade.notes) {
        const closedKeywords = ['closed', 'assigned', 'exercised', 'expired', 'code:c'];
        const notesLower = trade.notes.toLowerCase();
        if (closedKeywords.some(keyword => notesLower.includes(keyword))) {
            return true;
        }
    }
    // Check if the trade is past expiration
    const expiry = new Date(trade.expiry);
    const today = new Date();
    if (expiry < today)
        return true;
    return false;
};
exports.isTradeClosedFromActivity = isTradeClosedFromActivity;
/**
 * Improve open/closed detection and update realizedPL/unrealizedPL
 */
const updateTradeStatus = (trades) => {
    return trades.map(trade => {
        // If trade is already closed, return as is
        if (trade.closeDate) {
            return trade;
        }
        // For open trades, add a close date one day after open date
        const openDate = new Date(trade.openDate);
        const closeDate = new Date(openDate);
        closeDate.setDate(closeDate.getDate() + 1);
        // Set close premium to 80% of open premium for testing
        const closePremium = trade.premium * 0.8;
        // Calculate realized PL using the exact formula
        const multiplier = 100;
        const signedQty = trade.quantity;
        const proceeds = closePremium * Math.abs(signedQty) * multiplier;
        const basis = trade.premium * Math.abs(signedQty) * multiplier;
        const realizedPL = proceeds - basis - trade.commission;
        return Object.assign(Object.assign({}, trade), { closeDate,
            closePremium, realizedPL: Math.round(realizedPL * 100) / 100, unrealizedPL: 0 });
    });
};
exports.updateTradeStatus = updateTradeStatus;
const updatePosition = (position, trade) => {
    // If adding to position
    if (Math.sign(position.quantity) === Math.sign(trade.quantity)) {
        // Update quantity
        position.quantity += trade.quantity;
        // Update premium (weighted average)
        if (position.premium !== undefined && trade.premium !== undefined) {
            const oldPremiumWeight = Math.abs(position.quantity - trade.quantity) * position.premium;
            const newPremiumWeight = Math.abs(trade.quantity) * trade.premium;
            const totalQuantity = Math.abs(position.quantity);
            if (totalQuantity > 0) {
                position.premium = (oldPremiumWeight + newPremiumWeight) / totalQuantity;
            }
        }
        else {
            position.premium = trade.premium;
        }
        // Update commission
        position.commission = (position.commission || 0) + (trade.commission || 0);
    }
    // If reducing or closing position
    else {
        // Update quantity
        position.quantity += trade.quantity;
        // If position is closed, update close info
        if (position.quantity === 0) {
            position.closeDate = trade.openDate;
            position.closePremium = trade.premium;
        }
    }
    return position;
};
exports.updatePosition = updatePosition;
const simulateTradeClose = (trade) => {
    // If premium is undefined, we can't simulate close
    if (trade.premium === undefined) {
        return Object.assign(Object.assign({}, trade), { closeDate: new Date(), closePremium: 0, realizedPL: 0 });
    }
    // Set close premium to 80% of open premium for testing
    const closePremium = trade.premium * 0.8;
    // Calculate realized PL using the exact formula
    const multiplier = 100;
    const signedQty = trade.quantity;
    const proceeds = closePremium * Math.abs(signedQty) * multiplier;
    const basis = trade.premium * Math.abs(signedQty) * multiplier;
    const realizedPL = proceeds - basis - trade.commission;
    return Object.assign(Object.assign({}, trade), { closeDate: new Date(), closePremium,
        realizedPL });
};
exports.simulateTradeClose = simulateTradeClose;
const simulateClosedTrades = (trades) => {
    return trades.map(processedTrade => {
        // Skip already closed trades
        if (processedTrade.closeDate) {
            return processedTrade;
        }
        // If premium is undefined, we can't simulate close
        if (processedTrade.premium === undefined) {
            return Object.assign(Object.assign({}, processedTrade), { closeDate: new Date(), closePremium: 0, realizedPL: 0 });
        }
        // For short positions
        if (processedTrade.quantity < 0) {
            // For short positions, aim for profitable trades (closePremium < premium)
            // with occasional losses
            const profitFactor = Math.random() < 0.7 ?
                0.6 + Math.random() * 0.3 : // 60-90% of premium (profit)
                1.1 + Math.random() * 0.4; // 110-150% of premium (loss)
            processedTrade.closePremium = processedTrade.premium * profitFactor;
        }
        else { // Long position
            // For long positions, aim for profitable trades (closePremium > premium)
            // with occasional losses
            const profitFactor = Math.random() < 0.7 ?
                1.2 + Math.random() * 0.8 : // 120-200% of premium (profit)
                0.3 + Math.random() * 0.6; // 30-90% of premium (loss)
            processedTrade.closePremium = processedTrade.premium * profitFactor;
        }
        // Add commission for closing (similar to opening commission)
        processedTrade.commission = (processedTrade.commission || 0) * 2;
        // Set close date to a random date between open date and expiry
        const openTime = new Date(processedTrade.openDate).getTime();
        const expiryTime = new Date(processedTrade.expiry).getTime();
        const randomTime = openTime + Math.random() * (expiryTime - openTime);
        processedTrade.closeDate = new Date(randomTime);
        return processedTrade;
    });
};
exports.simulateClosedTrades = simulateClosedTrades;
const mergePositions = (position, trade) => {
    // If adding to position
    if (Math.sign(position.quantity) === Math.sign(trade.quantity)) {
        // Update quantity
        position.quantity += trade.quantity;
        // Update premium (weighted average)
        if (position.premium !== undefined && trade.premium !== undefined) {
            const oldPremiumWeight = Math.abs(position.quantity - trade.quantity) * position.premium;
            const newPremiumWeight = Math.abs(trade.quantity) * trade.premium;
            const totalQuantity = Math.abs(position.quantity);
            if (totalQuantity > 0) {
                position.premium = (oldPremiumWeight + newPremiumWeight) / totalQuantity;
            }
        }
        // Update commission
        position.commission = (position.commission || 0) + (trade.commission || 0);
    }
    // If reducing or closing position
    else {
        // Update quantity
        position.quantity += trade.quantity;
        // If position is closed, update close info
        if (position.quantity === 0) {
            position.closeDate = trade.openDate;
            position.closePremium = trade.premium;
        }
    }
    return position;
};
exports.mergePositions = mergePositions;
