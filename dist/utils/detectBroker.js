export var BrokerType;
(function (BrokerType) {
    BrokerType["IBKR"] = "IBKR";
    BrokerType["Schwab"] = "Schwab";
    BrokerType["Unknown"] = "Unknown";
})(BrokerType || (BrokerType = {}));
// More specific and less common headers are weighted higher or are prerequisites.
var IBKR_CHARACTERISTIC_HEADERS = [
    { header: 'Asset Category', weight: 2, required: true },
    { header: 'IBCommission', weight: 2 },
    { header: 'TradePrice', weight: 1 },
    { header: 'Symbol', weight: 1, required: true },
    { header: 'Currency', weight: 1, required: true },
    { header: 'TradeDate', weight: 1 },
    { header: 'Quantity', weight: 1 },
    { header: 'DataDiscriminator', weight: 1 }, // Often in 'Trades' or 'Orders' sections
    { header: 'Open/CloseIndicator', weight: 1 },
    { header: 'IBOrderID', weight: 1 },
];
var SCHWAB_CHARACTERISTIC_HEADERS = [
    { header: 'Date acquired', weight: 2 },
    { header: 'Date sold', weight: 2 },
    { header: 'Total proceeds', weight: 2, required: true },
    { header: 'Total cost basis', weight: 2, required: true },
    { header: 'Quantity', weight: 1 }, // Can overlap, so lower weight or check in context
    { header: 'Symbol', weight: 1 },
    { header: 'Description', weight: 1 }, // Schwab often has detailed descriptions
    { header: 'Wash sale loss disallowed', weight: 1 },
    { header: 'Net gain or loss', weight: 1 },
];
var MIN_REQUIRED_SCORE = 3; // Minimum score to be considered a match
var MIN_REQUIRED_HEADERS_PRESENT = 2; // Minimum number of *required* headers to be present for a potential match
export var detectBroker = function (headers) {
    if (!headers || headers.length === 0) {
        return BrokerType.Unknown;
    }
    var lowerCaseHeaders = headers.map(function (h) { return h.toLowerCase().trim(); });
    var ibkrScore = 0;
    var ibkrRequiredHeadersFound = 0;
    for (var _i = 0, IBKR_CHARACTERISTIC_HEADERS_1 = IBKR_CHARACTERISTIC_HEADERS; _i < IBKR_CHARACTERISTIC_HEADERS_1.length; _i++) {
        var charHeader = IBKR_CHARACTERISTIC_HEADERS_1[_i];
        if (lowerCaseHeaders.includes(charHeader.header.toLowerCase())) {
            ibkrScore += charHeader.weight;
            if (charHeader.required) {
                ibkrRequiredHeadersFound++;
            }
        }
    }
    var schwabScore = 0;
    var schwabRequiredHeadersFound = 0;
    for (var _a = 0, SCHWAB_CHARACTERISTIC_HEADERS_1 = SCHWAB_CHARACTERISTIC_HEADERS; _a < SCHWAB_CHARACTERISTIC_HEADERS_1.length; _a++) {
        var charHeader = SCHWAB_CHARACTERISTIC_HEADERS_1[_a];
        if (lowerCaseHeaders.includes(charHeader.header.toLowerCase())) {
            schwabScore += charHeader.weight;
            if (charHeader.required) {
                schwabRequiredHeadersFound++;
            }
        }
    }
    var isPotentiallyIBKR = ibkrScore >= MIN_REQUIRED_SCORE && ibkrRequiredHeadersFound >= MIN_REQUIRED_HEADERS_PRESENT;
    var isPotentiallySchwab = schwabScore >= MIN_REQUIRED_SCORE && schwabRequiredHeadersFound >= MIN_REQUIRED_HEADERS_PRESENT;
    if (isPotentiallyIBKR && isPotentiallySchwab) {
        // If both match, prefer the one with the higher score
        // This is a simple tie-breaker, more sophisticated logic could be added
        return ibkrScore > schwabScore ? BrokerType.IBKR : BrokerType.Schwab;
    }
    if (isPotentiallyIBKR) {
        return BrokerType.IBKR;
    }
    if (isPotentiallySchwab) {
        return BrokerType.Schwab;
    }
    return BrokerType.Unknown;
};
