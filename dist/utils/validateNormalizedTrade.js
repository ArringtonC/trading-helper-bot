import { BrokerType } from '../types/trade';
var DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export var validateNormalizedTradeData = function (trade) {
    var errors = [];
    if (!trade) {
        errors.push('Trade object is null or undefined.');
        return errors; // Cannot perform further validation
    }
    // Presence Checks for Essential Fields
    if (!trade.id || typeof trade.id !== 'string' || trade.id.trim() === '') {
        errors.push('Missing or invalid trade ID.');
    }
    if (!trade.importTimestamp || typeof trade.importTimestamp !== 'string' || isNaN(new Date(trade.importTimestamp).getTime())) {
        errors.push('Missing or invalid import timestamp.');
    }
    if (!trade.broker || !Object.values(BrokerType).includes(trade.broker)) {
        errors.push('Missing or invalid broker.');
    }
    if (!trade.tradeDate || typeof trade.tradeDate !== 'string') {
        errors.push('Missing or invalid trade date type.');
    }
    else if (!DATE_REGEX.test(trade.tradeDate) || isNaN(new Date(trade.tradeDate).getTime())) {
        errors.push("Invalid tradeDate format: ".concat(trade.tradeDate, ". Expected YYYY-MM-DD."));
    }
    if (!trade.symbol || typeof trade.symbol !== 'string' || trade.symbol.trim() === '') {
        errors.push('Missing or invalid symbol.');
    }
    // Check against string literals for AssetCategory
    var validAssetCategories = ['STK', 'OPT', 'FUT', 'CASH', 'FX', 'BOND', 'Unknown'];
    if (!trade.assetCategory || !validAssetCategories.includes(trade.assetCategory)) {
        errors.push('Missing or invalid asset category.');
    }
    if (typeof trade.quantity !== 'number' || isNaN(trade.quantity)) {
        errors.push('Missing or invalid quantity.');
    }
    if (typeof trade.tradePrice !== 'number' || isNaN(trade.tradePrice)) {
        errors.push('Missing or invalid trade price.');
    }
    if (!trade.currency || typeof trade.currency !== 'string' || trade.currency.trim().length !== 3) {
        errors.push('Missing or invalid currency code (must be 3 letters).');
    }
    if (typeof trade.netAmount !== 'number' || isNaN(trade.netAmount)) {
        errors.push('Missing or invalid net amount.');
    }
    // Format & Type Checks for Optional Fields (if present)
    if (trade.settleDate && (!DATE_REGEX.test(trade.settleDate) || isNaN(new Date(trade.settleDate).getTime()))) {
        errors.push("Invalid settleDate format: ".concat(trade.settleDate, ". Expected YYYY-MM-DD."));
    }
    if (trade.commission !== undefined && trade.commission !== null && typeof trade.commission !== 'number') {
        errors.push('Invalid commission type, must be a number or null/undefined.');
    }
    if (trade.fees !== undefined && trade.fees !== null && typeof trade.fees !== 'number') {
        errors.push('Invalid fees type, must be a number or null/undefined.');
    }
    if (trade.costBasis !== undefined && trade.costBasis !== null && typeof trade.costBasis !== 'number') {
        errors.push('Invalid costBasis type, must be a number or null/undefined.');
    }
    if (trade.proceeds !== undefined && trade.proceeds !== null && typeof trade.proceeds !== 'number') {
        errors.push('Invalid proceeds type, must be a number or null/undefined.');
    }
    // Check against string literals for OpenCloseIndicator
    var validOpenCloseIndicators = ['O', 'C', 'N/A'];
    if (trade.openCloseIndicator && !validOpenCloseIndicators.includes(trade.openCloseIndicator)) {
        errors.push('Invalid openCloseIndicator value.');
    }
    // Option Specific Validations
    if (trade.assetCategory === 'OPT') { // Compare with string literal 'OPT'
        if (!trade.expiryDate || !DATE_REGEX.test(trade.expiryDate) || isNaN(new Date(trade.expiryDate).getTime())) {
            errors.push("Options require a valid expiryDate (YYYY-MM-DD): ".concat(trade.expiryDate, "."));
        }
        if (trade.strikePrice === undefined || trade.strikePrice === null || typeof trade.strikePrice !== 'number' || trade.strikePrice <= 0) {
            errors.push('Options require a valid positive strikePrice.');
        }
        // Check against string literals for PutCall
        var validPutCallIndicators = ['P', 'C', 'N/A'];
        if (!trade.putCall || !validPutCallIndicators.includes(trade.putCall)) { // Corrected this line
            errors.push('Options require a valid putCall indicator (P or C).'); // Message can be more specific if N/A is not allowed here
        }
        if (trade.multiplier === undefined || trade.multiplier === null || typeof trade.multiplier !== 'number' || trade.multiplier <= 0) {
            errors.push('Options require a valid positive multiplier.');
        }
    }
    // Basic Consistency Checks (Examples)
    if (trade.quantity === 0 && trade.tradePrice !== 0 && trade.assetCategory !== 'CASH') { // Compare with string literal 'CASH'
        // Allow for cash transactions (e.g. dividends, interest) that might have 0 quantity
        // errors.push('Quantity is zero but tradePrice is not, which might be unusual for non-cash transactions.');
    }
    // Check netAmount roughly aligns with price*quantity - commissions/fees
    // This is a soft check due to variations in how brokers report cost/proceeds.
    if (trade.tradePrice !== undefined && trade.quantity !== undefined && trade.netAmount !== undefined) {
        var expectedNet = (trade.tradePrice * trade.quantity * (trade.multiplier || 1));
        var calculatedNet = expectedNet;
        if (trade.commission)
            calculatedNet -= Math.abs(trade.commission);
        if (trade.fees)
            calculatedNet -= Math.abs(trade.fees);
        // This logic remains commented out as it needs more sophisticated handling
        // if ( (expectedNet > 0 && trade.netAmount > 0 && Math.abs(expectedNet - trade.netAmount) > Math.abs(expectedNet * 0.1 + (Math.abs(trade.commission || 0) + Math.abs(trade.fees || 0)) * 2) ) || 
        //      (expectedNet < 0 && trade.netAmount < 0 && Math.abs(expectedNet - trade.netAmount) > Math.abs(expectedNet * 0.1 + (Math.abs(trade.commission || 0) + Math.abs(trade.fees || 0)) * 2) ) ) {
        //   // errors.push(`NetAmount (${trade.netAmount}) seems inconsistent with price*quantity (${expectedNet}) considering commissions/fees.`);
        // }
    }
    return errors;
};
