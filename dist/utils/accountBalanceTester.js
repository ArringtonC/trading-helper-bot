/**
 * Utility to test extraction of account balance from IBKR statements
 */
export function testExtractAccountBalance(content) {
    var logs = [];
    logs.push("Testing account balance extraction from content (".concat(content.length, " bytes)"));
    // Split into lines
    var lines = content.split('\n');
    logs.push("Content has ".concat(lines.length, " lines"));
    var balance = null;
    var source = 'Not found';
    // Function to parse CSV line
    var parseCSVLine = function (line) {
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
                result.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        // Add the last field
        result.push(current.trim());
        return result;
    };
    // Try to find balance in Cash Report section
    var cashHeaderIndex = lines.findIndex(function (line) { return line.includes('Cash Report') && line.includes('Header'); });
    if (cashHeaderIndex !== -1) {
        logs.push("Found Cash Report section at line ".concat(cashHeaderIndex + 1));
        // Check the next 30 lines for balance information
        for (var i = cashHeaderIndex + 1; i < Math.min(cashHeaderIndex + 30, lines.length); i++) {
            var line = lines[i];
            logs.push("Checking line ".concat(i + 1, ": ").concat(line));
            if (line.includes('Ending Cash') || line.includes('Total')) {
                logs.push("Found potential balance line: ".concat(line));
                var parts = parseCSVLine(line);
                logs.push("Parsed ".concat(parts.length, " parts: ").concat(parts.join(' | ')));
                // Look for numeric values in the parts
                for (var j = 0; j < parts.length; j++) {
                    var part = parts[j].trim();
                    var num = parseFloat(part);
                    if (!isNaN(num)) {
                        logs.push("Found numeric value at position ".concat(j, ": ").concat(num));
                        if (balance === null || Math.abs(num) > Math.abs(balance)) {
                            balance = num;
                            source = "Cash Report, line ".concat(i + 1, ", position ").concat(j);
                            logs.push("Updated balance to ".concat(balance, " from ").concat(source));
                        }
                    }
                }
            }
        }
    }
    else {
        logs.push('No Cash Report section found');
    }
    // If still no balance, try Net Asset Value section
    if (balance === null) {
        var navHeaderIndex = lines.findIndex(function (line) { return line.includes('Net Asset Value') && line.includes('Header'); });
        if (navHeaderIndex !== -1) {
            logs.push("Found Net Asset Value section at line ".concat(navHeaderIndex + 1));
            // Check the next 20 lines
            for (var i = navHeaderIndex + 1; i < Math.min(navHeaderIndex + 20, lines.length); i++) {
                var line = lines[i];
                logs.push("Checking line ".concat(i + 1, ": ").concat(line));
                if (line.includes('Total') || line.includes('Net Asset Value')) {
                    logs.push("Found potential balance line: ".concat(line));
                    var parts = parseCSVLine(line);
                    logs.push("Parsed ".concat(parts.length, " parts: ").concat(parts.join(' | ')));
                    // Look for numeric values
                    for (var j = 0; j < parts.length; j++) {
                        var part = parts[j].trim();
                        var num = parseFloat(part);
                        if (!isNaN(num) && num !== 0) {
                            logs.push("Found numeric value at position ".concat(j, ": ").concat(num));
                            if (balance === null || Math.abs(num) > Math.abs(balance)) {
                                balance = num;
                                source = "NAV section, line ".concat(i + 1, ", position ").concat(j);
                                logs.push("Updated balance to ".concat(balance, " from ").concat(source));
                            }
                        }
                    }
                }
            }
        }
        else {
            logs.push('No Net Asset Value section found');
        }
    }
    // As a last resort, look for any section with "Balance" in its title
    if (balance === null) {
        // Find any lines that might contain balance information
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].toLowerCase();
            if (line.includes('balance') || line.includes('total') || line.includes('equity')) {
                logs.push("Found line ".concat(i + 1, " with balance/total/equity keyword: ").concat(lines[i]));
                var parts = parseCSVLine(lines[i]);
                // Look for numeric values
                for (var j = 0; j < parts.length; j++) {
                    var part = parts[j].trim();
                    var num = parseFloat(part);
                    if (!isNaN(num) && num !== 0) {
                        logs.push("Found numeric value at position ".concat(j, ": ").concat(num));
                        if (balance === null || Math.abs(num) > Math.abs(balance)) {
                            balance = num;
                            source = "Keyword search, line ".concat(i + 1, ", position ").concat(j);
                            logs.push("Updated balance to ".concat(balance, " from ").concat(source));
                        }
                    }
                }
            }
        }
    }
    logs.push("Final balance extraction result: ".concat(balance !== null ? balance : 'Not found', " (").concat(source, ")"));
    return { balance: balance, source: source, logs: logs };
}
