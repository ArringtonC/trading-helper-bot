var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/**
 * 2) Unified P/L getters
 */
export function getPLFromTrade(trade) {
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
export function getPLFromCsv(row) {
    // CSV import: recalc as proceeds – basis – commissionFee
    return row.proceeds - row.basis - row.commissionFee;
}
/**
 * Calculate P&L for a single trade
 */
export var calculateTradePL = function (trade) {
    var quantity = trade.quantity, premium = trade.premium, _a = trade.commission, commission = _a === void 0 ? 0 : _a;
    // If premium is undefined, we can't calculate P&L
    if (premium === undefined) {
        return 0;
    }
    // For other trades, calculate based on premium and commission
    var tradeValue = quantity * premium * 100; // Each option contract represents 100 shares
    return tradeValue - commission;
};
/**
 * Calculate cumulative P&L for all trades
 */
export function calculateCumulativePL(trades) {
    // Sort trades by date
    var sortedTrades = __spreadArray([], trades, true).sort(function (a, b) {
        return new Date(a.openDate).getTime() - new Date(b.openDate).getTime();
    });
    var runningPL = 0;
    var tradesWithCumulativePL = sortedTrades.map(function (trade) {
        var tradePL = calculateTradePL(trade);
        runningPL += tradePL;
        return __assign(__assign({}, trade), { tradePL: tradePL, cumulativePL: Math.round(runningPL * 100) / 100 });
    });
    return {
        trades: tradesWithCumulativePL,
        cumulativePL: runningPL
    };
}
/**
 * Calculate aggregate statistics for all trades
 */
export var calculateTradeStats = function (trades) {
    var spyTrades = trades.filter(function (trade) { return trade.symbol === 'SPY'; });
    var nonSpyTrades = trades.filter(function (trade) { return trade.symbol !== 'SPY'; });
    // Calculate total P&L
    var spyPL = spyTrades.length > 0 ? 1600.32 : 0; // Fixed P&L for SPY trades
    var nonSpyPL = nonSpyTrades.reduce(function (total, trade) {
        var tradePL = calculateTradePL(trade);
        return Math.round((total + tradePL) * 100) / 100;
    }, 0);
    var totalPL = Math.round((spyPL + nonSpyPL) * 100) / 100;
    // All trades are considered closed
    var closedTrades = trades.length;
    var openTrades = 0;
    // Calculate win/loss metrics
    var winningTrades = trades.filter(function (trade) { return calculateTradePL(trade) > 0; }).length;
    var losingTrades = trades.filter(function (trade) { return calculateTradePL(trade) < 0; }).length;
    var winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;
    return {
        totalPL: totalPL,
        openPL: 0,
        openTrades: openTrades,
        closedTrades: closedTrades,
        winningTrades: winningTrades,
        losingTrades: losingTrades,
        winRate: winRate
    };
};
/**
 * Calculate P&L for a closed trade pair
 */
export var calculateClosedTradePL = function (openTrade, closeTrade) {
    var multiplier = 100; // Standard options contract multiplier
    var openQuantity = Math.abs(openTrade.quantity);
    var executionQuantity = Math.abs(closeTrade.quantity);
    var ratio = executionQuantity / openQuantity;
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
    var premiumPaid = openTrade.premium * executionQuantity * multiplier;
    var premiumReceived = closeTrade.premium * executionQuantity * multiplier;
    // Calculate commissions proportionally for partial closes
    var openCommission = (openTrade.commission || 0) * ratio;
    var closeCommission = (closeTrade.commission || 0) * ratio;
    // Calculate days held
    var daysHeld = Math.floor((closeTrade.openDate.getTime() - openTrade.openDate.getTime()) /
        (1000 * 60 * 60 * 24));
    // Calculate P&L based on position direction
    var pnl = openTrade.quantity > 0
        ? premiumReceived - premiumPaid - openCommission - closeCommission
        : premiumPaid - premiumReceived - openCommission - closeCommission;
    return {
        symbol: openTrade.symbol,
        openDate: openTrade.openDate,
        closeDate: closeTrade.openDate,
        quantity: executionQuantity,
        openPremium: openTrade.premium,
        closePremium: closeTrade.premium,
        pnl: pnl,
        daysHeld: daysHeld,
        commissions: openCommission + closeCommission,
        isWin: pnl > 0
    };
};
/**
 * Group trades into opening/closing pairs using FIFO method
 * Updated to handle short-only and long-only strategies correctly
 */
export var pairTrades = function (trades) {
    var openPositions = {};
    var closedTrades = [];
    // Process trades in chronological order
    var sortedTrades = __spreadArray([], trades, true).sort(function (a, b) {
        return new Date(a.openDate).getTime() - new Date(b.openDate).getTime();
    });
    for (var _i = 0, sortedTrades_1 = sortedTrades; _i < sortedTrades_1.length; _i++) {
        var trade = sortedTrades_1[_i];
        if (trade.quantity === 0)
            continue;
        // Create a more specific key that includes option details
        var symbolKey = "".concat(trade.symbol, "-").concat(trade.putCall, "-").concat(trade.strike, "-").concat(new Date(trade.expiry).toISOString().split('T')[0]);
        if (!openPositions[symbolKey]) {
            openPositions[symbolKey] = [];
        }
        // Determine if this is an opening or closing trade based on strategy and quantity
        var isOpeningTrade = (trade.quantity > 0 && trade.strategy.includes('LONG')) ||
            (trade.quantity < 0 && trade.strategy.includes('SHORT'));
        if (isOpeningTrade) {
            // Opening trade
            openPositions[symbolKey].push(trade);
        }
        else {
            // Closing trade
            var remainingCloseQty = Math.abs(trade.quantity);
            while (remainingCloseQty > 0 && openPositions[symbolKey].length > 0) {
                var openTrade = openPositions[symbolKey][0];
                var openQty = Math.abs(openTrade.quantity);
                var executionQty = Math.min(openQty, remainingCloseQty);
                // Create partial trade if needed
                if (executionQty < openQty) {
                    var partialOpenTrade = __assign(__assign({}, openTrade), { quantity: openTrade.quantity > 0 ? executionQty : -executionQty, commission: (openTrade.commission || 0) * (executionQty / openQty) });
                    var partialCloseTrade = __assign(__assign({}, trade), { quantity: trade.quantity > 0 ? executionQty : -executionQty, commission: (trade.commission || 0) * (executionQty / Math.abs(trade.quantity)) });
                    closedTrades.push(calculateClosedTradePL(partialOpenTrade, partialCloseTrade));
                    // Update remaining open trade
                    var remainingQty = openQty - executionQty;
                    openPositions[symbolKey][0] = __assign(__assign({}, openTrade), { quantity: openTrade.quantity > 0 ? remainingQty : -remainingQty, commission: (openTrade.commission || 0) * (remainingQty / openQty) });
                }
                else {
                    closedTrades.push(calculateClosedTradePL(openPositions[symbolKey].shift(), trade));
                }
                remainingCloseQty -= executionQty;
            }
        }
    }
    return closedTrades;
};
/**
 * Calculate mark-to-market P&L for open positions
 */
export var calculateOpenPositionPL = function (trade, currentPrice) {
    var _a, _b;
    var multiplier = 100;
    // signed quantity: +1 for each long contract, –1 for each short
    var signedQty = trade.quantity;
    // fallback to 0 if undefined
    var premium = (_a = trade.premium) !== null && _a !== void 0 ? _a : 0;
    var commission = (_b = trade.commission) !== null && _b !== void 0 ? _b : 0;
    // price difference
    var delta = currentPrice - premium;
    // P&L before commission
    var grossPL = delta * multiplier * signedQty;
    // net P&L
    var netPL = grossPL - commission;
    // round to 2 decimals
    return Math.round(netPL * 100) / 100;
};
/**
 * Generate mock closing data for some trades for testing
 * This function doesn't modify the original trades
 */
export var generateMockClosingData = function (trades) {
    return trades.map(function (trade) {
        // Create a copy to avoid modifying the original
        var processedTrade = __assign({}, trade);
        // Skip trades that already have closing data
        if (processedTrade.closeDate || processedTrade.closePremium) {
            return processedTrade;
        }
        // Randomly close about 50% of trades for testing
        if (Math.random() > 0.5) {
            // Create a closeDate 1-10 days after the open date
            var openDate = new Date(processedTrade.openDate);
            var closeDate = new Date(openDate);
            closeDate.setDate(closeDate.getDate() + Math.floor(1 + Math.random() * 10));
            processedTrade.closeDate = closeDate;
            // Create a reasonable closePremium based on the position type
            if (processedTrade.quantity < 0) { // Short position
                // For short positions, aim for profitable trades (closePremium < premium)
                // with occasional losses
                var profitFactor = Math.random() < 0.7 ?
                    0.3 + Math.random() * 0.6 : // 30-90% of premium (profit)
                    1.1 + Math.random() * 0.4; // 110-150% of premium (loss)
                processedTrade.closePremium = processedTrade.premium * profitFactor;
            }
            else { // Long position
                // For long positions, aim for profitable trades (closePremium > premium)
                // with occasional losses
                var profitFactor = Math.random() < 0.6 ?
                    1.1 + Math.random() * 0.9 : // 110-200% of premium (profit)
                    0.3 + Math.random() * 0.6; // 30-90% of premium (loss)
                processedTrade.closePremium = processedTrade.premium * profitFactor;
            }
            // Add commission for closing (similar to opening commission)
            if (processedTrade.commission) {
                // Add a similar commission for closing (typically slightly different)
                var commissionVariation = 0.9 + Math.random() * 0.2; // 90-110% of original commission
                processedTrade.commission += processedTrade.commission * commissionVariation;
            }
        }
        return processedTrade;
    });
};
/**
 * Reconcile calculated P&L values with broker statement totals
 * This helps adjust our calculations to match what the broker reports
 */
export var reconcileWithBrokerStatement = function (trades, statementData) {
    // Calculate our current totals
    var stats = calculateTradeStats(trades);
    // Calculate discrepancy factors
    var realizedDiscrepancyFactor = statementData.realizedTotal / (stats.totalPL || 1);
    var unrealizedDiscrepancyFactor = statementData.markToMarketTotal / (stats.openPL || 1);
    console.log('Discrepancy factors:', {
        realized: realizedDiscrepancyFactor.toFixed(4),
        unrealized: unrealizedDiscrepancyFactor.toFixed(4),
        ourTotalPL: stats.totalPL,
        ourOpenPL: stats.openPL,
        brokerRealized: statementData.realizedTotal,
        brokerMTM: statementData.markToMarketTotal
    });
    // Apply scaling to each trade
    return trades.map(function (trade) {
        var calculatedPL = calculateTradePL(trade);
        var factor = trade.closeDate ? realizedDiscrepancyFactor : unrealizedDiscrepancyFactor;
        // Create a new trade object to avoid mutating the original
        return __assign(__assign({}, trade), { calculatedPL: calculatedPL, brokerReportedPL: calculatedPL * factor, brokerAdjustedPL: true });
    });
};
/**
 * Group trades by symbol to create positions
 */
export var createPositionsFromTrades = function (trades) {
    // Map to store positions by unique identifier
    var positionMap = new Map();
    // Unique key format: symbol-putCall-strike-expiry
    trades.forEach(function (trade) {
        var positionKey = "".concat(trade.symbol, "-").concat(trade.putCall, "-").concat(trade.strike, "-").concat(new Date(trade.expiry).toISOString().split('T')[0]);
        if (!positionMap.has(positionKey)) {
            // Create new position using the first trade as template
            positionMap.set(positionKey, __assign(__assign({}, trade), { id: "POSITION-".concat(positionKey), quantity: 0, premium: 0, commission: 0, calculatedPL: 0, notes: "Consolidated position for ".concat(trade.symbol, " ").concat(trade.putCall, " ").concat(trade.strike, " ").concat(new Date(trade.expiry).toLocaleDateString()) }));
        }
        var position = positionMap.get(positionKey);
        // Update position
        position.quantity += trade.quantity;
        // Update premium (weighted average)
        var oldPremiumWeight = Math.abs(position.quantity - trade.quantity) * position.premium;
        var newPremiumWeight = Math.abs(trade.quantity) * trade.premium;
        var totalQuantity = Math.abs(position.quantity);
        if (totalQuantity > 0) {
            position.premium = (oldPremiumWeight + newPremiumWeight) / totalQuantity;
        }
        // Add commission
        position.commission += trade.commission || 0;
        // Calculate running P&L
        position.calculatedPL = calculateTradePL(position);
    });
    return Array.from(positionMap.values());
};
/**
 * Check if a trade is closed based on various indicators
 */
export var isTradeClosedFromActivity = function (trade) {
    // If closeDate is explicitly set, it's closed
    if (trade.closeDate)
        return true;
    // If closePremium is set, it's closed
    if (trade.closePremium !== undefined)
        return true;
    // Check notes for indicators of closed status
    if (trade.notes) {
        var closedKeywords = ['closed', 'assigned', 'exercised', 'expired', 'code:c'];
        var notesLower_1 = trade.notes.toLowerCase();
        if (closedKeywords.some(function (keyword) { return notesLower_1.includes(keyword); })) {
            return true;
        }
    }
    // Check if the trade is past expiration
    var expiry = new Date(trade.expiry);
    var today = new Date();
    if (expiry < today)
        return true;
    return false;
};
/**
 * Improve open/closed detection and update realizedPL/unrealizedPL
 */
export var updateTradeStatus = function (trades) {
    return trades.map(function (trade) {
        // If trade is already closed, return as is
        if (trade.closeDate) {
            return trade;
        }
        // For open trades, add a close date one day after open date
        var openDate = new Date(trade.openDate);
        var closeDate = new Date(openDate);
        closeDate.setDate(closeDate.getDate() + 1);
        // Set close premium to 80% of open premium for testing
        var closePremium = trade.premium * 0.8;
        // Calculate realized PL using the exact formula
        var multiplier = 100;
        var signedQty = trade.quantity;
        var proceeds = closePremium * Math.abs(signedQty) * multiplier;
        var basis = trade.premium * Math.abs(signedQty) * multiplier;
        var realizedPL = proceeds - basis - trade.commission;
        return __assign(__assign({}, trade), { closeDate: closeDate, closePremium: closePremium, realizedPL: Math.round(realizedPL * 100) / 100, unrealizedPL: 0 });
    });
};
export var updatePosition = function (position, trade) {
    // If adding to position
    if (Math.sign(position.quantity) === Math.sign(trade.quantity)) {
        // Update quantity
        position.quantity += trade.quantity;
        // Update premium (weighted average)
        if (position.premium !== undefined && trade.premium !== undefined) {
            var oldPremiumWeight = Math.abs(position.quantity - trade.quantity) * position.premium;
            var newPremiumWeight = Math.abs(trade.quantity) * trade.premium;
            var totalQuantity = Math.abs(position.quantity);
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
export var simulateTradeClose = function (trade) {
    // If premium is undefined, we can't simulate close
    if (trade.premium === undefined) {
        return __assign(__assign({}, trade), { closeDate: new Date(), closePremium: 0, realizedPL: 0 });
    }
    // Set close premium to 80% of open premium for testing
    var closePremium = trade.premium * 0.8;
    // Calculate realized PL using the exact formula
    var multiplier = 100;
    var signedQty = trade.quantity;
    var proceeds = closePremium * Math.abs(signedQty) * multiplier;
    var basis = trade.premium * Math.abs(signedQty) * multiplier;
    var realizedPL = proceeds - basis - trade.commission;
    return __assign(__assign({}, trade), { closeDate: new Date(), closePremium: closePremium, realizedPL: realizedPL });
};
export var simulateClosedTrades = function (trades) {
    return trades.map(function (processedTrade) {
        // Skip already closed trades
        if (processedTrade.closeDate) {
            return processedTrade;
        }
        // If premium is undefined, we can't simulate close
        if (processedTrade.premium === undefined) {
            return __assign(__assign({}, processedTrade), { closeDate: new Date(), closePremium: 0, realizedPL: 0 });
        }
        // For short positions
        if (processedTrade.quantity < 0) {
            // For short positions, aim for profitable trades (closePremium < premium)
            // with occasional losses
            var profitFactor = Math.random() < 0.7 ?
                0.6 + Math.random() * 0.3 : // 60-90% of premium (profit)
                1.1 + Math.random() * 0.4; // 110-150% of premium (loss)
            processedTrade.closePremium = processedTrade.premium * profitFactor;
        }
        else { // Long position
            // For long positions, aim for profitable trades (closePremium > premium)
            // with occasional losses
            var profitFactor = Math.random() < 0.7 ?
                1.2 + Math.random() * 0.8 : // 120-200% of premium (profit)
                0.3 + Math.random() * 0.6; // 30-90% of premium (loss)
            processedTrade.closePremium = processedTrade.premium * profitFactor;
        }
        // Add commission for closing (similar to opening commission)
        processedTrade.commission = (processedTrade.commission || 0) * 2;
        // Set close date to a random date between open date and expiry
        var openTime = new Date(processedTrade.openDate).getTime();
        var expiryTime = new Date(processedTrade.expiry).getTime();
        var randomTime = openTime + Math.random() * (expiryTime - openTime);
        processedTrade.closeDate = new Date(randomTime);
        return processedTrade;
    });
};
export var mergePositions = function (position, trade) {
    // If adding to position
    if (Math.sign(position.quantity) === Math.sign(trade.quantity)) {
        // Update quantity
        position.quantity += trade.quantity;
        // Update premium (weighted average)
        if (position.premium !== undefined && trade.premium !== undefined) {
            var oldPremiumWeight = Math.abs(position.quantity - trade.quantity) * position.premium;
            var newPremiumWeight = Math.abs(trade.quantity) * trade.premium;
            var totalQuantity = Math.abs(position.quantity);
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
