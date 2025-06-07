import { BrokerType } from './detectBroker';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
// Helper to find a header in a list of CSV headers, with optional fuzzy matching
var findHeader = function (csvHeaders, targetHeaders, exactMatch) {
    if (exactMatch === void 0) { exactMatch = false; }
    var normalizedCsvHeaders = csvHeaders.map(function (h) { return h.toLowerCase().trim(); });
    var _loop_1 = function (target) {
        var normalizedTarget = target.toLowerCase().trim();
        if (exactMatch) {
            if (normalizedCsvHeaders.includes(normalizedTarget)) {
                return { value: csvHeaders[normalizedCsvHeaders.indexOf(normalizedTarget)] };
            }
        }
        else {
            var found = normalizedCsvHeaders.find(function (h) { return h.includes(normalizedTarget) || normalizedTarget.includes(h); });
            if (found) {
                return { value: csvHeaders[normalizedCsvHeaders.indexOf(found)] };
            }
        }
    };
    for (var _i = 0, targetHeaders_1 = targetHeaders; _i < targetHeaders_1.length; _i++) {
        var target = targetHeaders_1[_i];
        var state_1 = _loop_1(target);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    return undefined;
};
// Helper to get a value from a row using a list of possible header names
var getValue = function (row, csvHeaders, possibleNames, exactMatch) {
    if (exactMatch === void 0) { exactMatch = false; }
    var actualHeader = findHeader(csvHeaders, possibleNames, exactMatch);
    return actualHeader ? row[actualHeader] : undefined;
};
// TODO: Implement more robust date and number parsing, possibly with a library like date-fns
var parseSafeNumber = function (value) {
    if (value === undefined || value === null || value.trim() === '')
        return null;
    var num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? null : num;
};
var formatDate = function (dateStr) {
    if (!dateStr)
        return 'N/A';
    try {
        var date = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')); // Handle YYYYMMDD
        if (isNaN(date.getTime()))
            return dateStr; // Return original if invalid
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    catch (e) {
        return dateStr; // Return original on error
    }
};
// Define Mappings (these will be very basic initially and need significant expansion/refinement)
// For now, we'll assume a simple direct mapping or slight variations for key fields.
var mapToAssetCategory = function (value) {
    if (!value)
        return 'Unknown';
    var lowerVal = value.toLowerCase();
    if (lowerVal.includes('stk') || lowerVal.includes('stock'))
        return 'STK';
    if (lowerVal.includes('opt') || lowerVal.includes('option'))
        return 'OPT';
    // Add more mappings
    return 'Unknown';
};
var mapToOpenClose = function (value) {
    if (!value)
        return 'N/A';
    var lowerVal = value.toLowerCase();
    if (lowerVal.startsWith('o'))
        return 'O';
    if (lowerVal.startsWith('c'))
        return 'C';
    return 'N/A';
};
var mapToPutCall = function (value) {
    if (!value)
        return 'N/A';
    var lowerVal = value.toLowerCase();
    if (lowerVal === 'p' || lowerVal === 'put')
        return 'P';
    if (lowerVal === 'c' || lowerVal === 'call')
        return 'C';
    return 'N/A';
};
export var mapRowToNormalizedTradeData = function (row, originalHeaders, broker) {
    var _a, _b, _c, _d, _e;
    var get = function (possibleNames, exactMatch) {
        if (exactMatch === void 0) { exactMatch = false; }
        return getValue(row, originalHeaders, possibleNames, exactMatch);
    };
    var data = {};
    if (broker === BrokerType.IBKR) {
        data.tradeDate = formatDate(get(['TradeDate', 'Trade Date']));
        data.symbol = get(['Symbol']);
        data.assetCategory = mapToAssetCategory(get(['Asset Category']));
        var quantityVal = parseSafeNumber(get(['Quantity']));
        data.quantity = quantityVal !== null ? quantityVal : 0;
        data.tradePrice = (_a = parseSafeNumber(get(['TradePrice', 'Trade Price']))) !== null && _a !== void 0 ? _a : 0;
        data.commission = parseSafeNumber(get(['IBCommission', 'Commission']));
        data.fees = parseSafeNumber(get(['Fees'])); // IBKR might not have a separate 'Fees' column for trades often
        data.currency = get(['Currency']) || 'USD';
        data.openCloseIndicator = mapToOpenClose(get(['Open/CloseIndicator', 'OpenClose']));
        data.costBasis = parseSafeNumber(get(['CostBasis']));
        data.proceeds = parseSafeNumber(get(['Proceeds']));
        data.netAmount = (_b = parseSafeNumber(get(['NetCash', 'TradeMoney']))) !== null && _b !== void 0 ? _b : 0; // TradeMoney can be negative for debit
        data.orderID = get(['IBOrderID', 'Order ID']);
        data.executionID = get(['IBExecID', 'Exec ID']);
        data.expiryDate = formatDate(get(['Expiry']));
        data.strikePrice = parseSafeNumber(get(['Strike']));
        data.putCall = mapToPutCall(get(['Put/Call', 'Right']));
        data.multiplier = (_c = parseSafeNumber(get(['Multiplier']))) !== null && _c !== void 0 ? _c : (data.assetCategory === 'OPT' ? 100 : 1);
        data.description = get(['Description']);
        data.action = get(['Action', 'Buy/Sell']); // Usually inferred from quantity sign
    }
    else if (broker === BrokerType.Schwab) {
        // Schwab often has different report types (Trades, Gains/Losses)
        // This mapping is a generic attempt and will need refinement based on specific Schwab CSV structures
        data.tradeDate = formatDate(get(['Date', 'Trade Date'])); // 'Date' is common, but context needed
        data.symbol = get(['Symbol']);
        data.description = get(['Description']);
        var quantityVal = parseSafeNumber(get(['Quantity']));
        data.tradePrice = (_d = parseSafeNumber(get(['Price']))) !== null && _d !== void 0 ? _d : 0;
        data.commission = parseSafeNumber(get(['Commissions & Fees', 'Fees & Commissions', 'Commission']));
        // Schwab might combine commissions and fees. Or have them separate.
        // data.fees = ... if a separate fees column exists
        data.currency = 'USD'; // Assume USD for Schwab unless specified
        data.netAmount = (_e = parseSafeNumber(get(['Amount', 'Net Amount']))) !== null && _e !== void 0 ? _e : 0;
        var action = get(['Action']);
        data.action = action;
        if (action) {
            var lowerAction = action.toLowerCase();
            if (lowerAction.includes('buy')) {
                data.quantity = quantityVal !== null ? Math.abs(quantityVal) : 0;
                data.cost = data.netAmount !== null ? Math.abs(data.netAmount) : null; // Or price * quantity
            }
            else if (lowerAction.includes('sell')) {
                data.quantity = quantityVal !== null ? -Math.abs(quantityVal) : 0;
                data.proceeds = data.netAmount !== null ? Math.abs(data.netAmount) : null;
            }
            else {
                data.quantity = quantityVal !== null ? quantityVal : 0; // E.g. for dividends, interest etc.
            }
            if (lowerAction.includes('open'))
                data.openCloseIndicator = 'O';
            if (lowerAction.includes('close'))
                data.openCloseIndicator = 'C';
        }
        // Option specific fields for Schwab (often requires careful parsing of 'Description')
        if (data.description && (data.description.includes('CALL') || data.description.includes('PUT'))) {
            data.assetCategory = 'OPT';
            // Regex or string splitting might be needed to extract expiry, strike, P/C from description
            // Example: 'SPY   JUN 23 2023 450.0 C'
            var optionMatch = data.description.match(/([A-Z]+)\s*([A-Z]{3})\s*(\d{1,2})\s*(\d{4})\s*([\d.]+)\s*([CP])/i);
            if (optionMatch) {
                // data.symbol = optionMatch[1]; // Underlying, if different from main symbol field
                var month = optionMatch[2];
                var day = optionMatch[3];
                var year = optionMatch[4];
                data.expiryDate = formatDate("".concat(year, "-").concat(month, "-").concat(day)); // Needs month name to number conversion
                data.strikePrice = parseFloat(optionMatch[5]);
                data.putCall = optionMatch[6].toUpperCase() === 'C' ? 'C' : 'P';
            }
            data.multiplier = 100;
        }
        else {
            data.assetCategory = 'STK'; // Default to STK if not clearly an option
        }
    }
    else {
        return null; // Unknown broker
    }
    // Basic validation for essential fields
    if (!data.tradeDate || data.tradeDate === 'N/A' || !data.symbol || data.quantity === undefined || data.tradePrice === undefined || data.netAmount === undefined) {
        console.warn('Could not map essential fields for row:', row, 'Detected broker:', broker);
        return null;
    }
    return {
        id: uuidv4(),
        importTimestamp: new Date().toISOString(),
        broker: broker,
        tradeDate: data.tradeDate,
        symbol: data.symbol,
        assetCategory: data.assetCategory || 'Unknown',
        quantity: data.quantity,
        tradePrice: data.tradePrice,
        currency: data.currency || 'USD',
        netAmount: data.netAmount,
        // Optional fields with defaults or null
        accountId: get(['Account', 'Account ID']) || undefined,
        settleDate: formatDate(get(['SettleDate', 'Settlement Date'])) || undefined,
        description: data.description || undefined,
        action: data.action || undefined,
        proceeds: data.proceeds !== undefined ? data.proceeds : null,
        cost: data.cost !== undefined ? data.cost : null,
        commission: data.commission !== undefined ? data.commission : null,
        fees: data.fees !== undefined ? data.fees : null,
        openCloseIndicator: data.openCloseIndicator || 'N/A',
        costBasis: data.costBasis !== undefined ? data.costBasis : null,
        optionSymbol: data.optionSymbol || undefined,
        expiryDate: data.expiryDate === 'N/A' ? undefined : data.expiryDate,
        strikePrice: data.strikePrice !== undefined ? data.strikePrice : null,
        putCall: data.putCall || 'N/A',
        multiplier: data.multiplier || (data.assetCategory === 'OPT' ? 100 : undefined),
        orderID: data.orderID || undefined,
        executionID: data.executionID || undefined,
        notes: get(['Notes', 'Notes/Codes']) || undefined,
        rawCsvRow: row,
    };
};
