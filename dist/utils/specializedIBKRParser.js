/**
 * A specialized parser for IBKR CSV files that specifically targets
 * the "Trades,Data,Order" pattern we've seen in your IBKR file.
 */
export function parseIBKRTrades(csvContent) {
    console.log("Starting specialized IBKR trade parsing");
    var results = {
        trades: [],
        logs: [],
        accountId: ""
    };
    // Helper function to log and record messages
    var log = function (message) {
        console.log(message);
        results.logs.push(message);
    };
    try {
        // Split into lines
        var lines = csvContent.split('\n');
        log("File contains ".concat(lines.length, " lines"));
        // Find account ID
        var accountMatch = csvContent.match(/U\d{7}/);
        if (accountMatch) {
            results.accountId = accountMatch[0];
            log("Found account ID: ".concat(results.accountId));
        }
        // Look specifically for "Trades,Data,Order" pattern
        var tradeCount = 0;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.startsWith('Trades,Data,Order')) {
                tradeCount++;
                log("Found trade line ".concat(tradeCount, ": ").concat(line));
                // Parse this line to extract trade details
                var parts = parseCSVLine(line);
                if (parts.length >= 7) {
                    // Typical format: Trades,Data,Order,AssetCategory,Currency,Account,Symbol,DateTime,Quantity,Price,...
                    var trade = {
                        assetCategory: parts[3] || '',
                        currency: parts[4] || '',
                        account: parts[5] || '',
                        symbol: parts[6] || '',
                        dateTime: parts[7] || '',
                        quantity: parseFloat(parts[8] || '0'),
                        price: parseFloat(parts[9] || '0'),
                        // Add more fields as needed
                        rawLine: line
                    };
                    results.trades.push(trade);
                    log("Parsed trade ".concat(tradeCount, ": ").concat(trade.symbol, ", ").concat(trade.dateTime, ", ").concat(trade.quantity, " @ ").concat(trade.price));
                }
            }
        }
        log("Parsed ".concat(results.trades.length, " trades total"));
        return results;
    }
    catch (error) {
        log("Error parsing IBKR trades: ".concat(error));
        return results;
    }
}
/**
 * Parse a CSV line, handling quoted fields correctly
 */
function parseCSVLine(line) {
    var result = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
        var char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Handle escaped quotes
                current += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        }
        else {
            current += char;
        }
    }
    // Add the last field
    result.push(current);
    return result;
}
// Helper function to convert month name to number
export function getMonthNumber(monthStr) {
    var months = {
        'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
        'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
    };
    return months[monthStr.toUpperCase()] || 0;
}
