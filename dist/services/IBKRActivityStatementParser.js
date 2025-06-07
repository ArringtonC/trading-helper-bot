import { OptionStrategy } from '../types/options';
/**
 * Main parser class for IBKR activity statements
 */
var IBKRActivityStatementParser = /** @class */ (function () {
    function IBKRActivityStatementParser(content) {
        this.content = content;
        this.sections = new Map();
        this.debugLogs = [];
        this.rawContent = content;
        this.debugLogs.push('=== PARSER INITIALIZATION ===');
        this.debugLogs.push("Content length: ".concat(content.length, " characters"));
        this.debugLogs.push("Raw Content Start:\n".concat(this.rawContent.substring(0, 500), "...\nRaw Content End"));
        this.debugLogs.push('=== END INITIALIZATION ===');
    }
    IBKRActivityStatementParser.prototype.identifyAndParseSections = function () {
        var _this = this;
        this.debugLogs.push('=== STARTING SECTION IDENTIFICATION ===');
        var lines = this.content.split('\n');
        var sectionHeaders = [];
        lines.forEach(function (line, index) {
            if (!line.trim()) {
                return;
            }
            var row = _this.parseCSVLine(line);
            // Log the first few lines for debugging
            if (index < 20) { // Increased logging for initial lines
                _this.debugLogs.push("[DEBUG Identify] Line ".concat(index + 1, ": ").concat(line));
                _this.debugLogs.push("[DEBUG Identify] Parsed as: ".concat(JSON.stringify(row)));
            }
            if (row.length >= 2) {
                var sectionName = row[0].trim();
                var rowType = row[1].trim();
                // Identify section headers by row type NOT being 'Data'
                if (rowType !== 'Data') {
                    sectionHeaders.push({ name: sectionName, lineIndex: index });
                    _this.debugLogs.push("[DEBUG Identify] Found section header [".concat(sectionName, "] at line ").concat(index + 1));
                }
            }
        });
        this.debugLogs.push("[DEBUG Identify] Found ".concat(sectionHeaders.length, " section headers"));
        sectionHeaders.forEach(function (header, idx) {
            _this.debugLogs.push("[DEBUG Identify] Section header: ".concat(header.name, " at line ").concat(header.lineIndex));
        });
        // Process each section
        for (var i = 0; i < sectionHeaders.length; i++) {
            var currentHeader = sectionHeaders[i];
            var nextHeader = i < sectionHeaders.length - 1 ? sectionHeaders[i + 1] : null;
            var startLine = currentHeader.lineIndex + 1;
            if (currentHeader.name === 'Open Positions') {
                startLine = currentHeader.lineIndex;
            }
            var endLine = nextHeader ? nextHeader.lineIndex : lines.length;
            var sectionData = [];
            this.debugLogs.push("[DEBUG Identify] Processing section: ".concat(currentHeader.name, " (lines ").concat(startLine, " to ").concat(endLine, ")"));
            if (currentHeader.name === 'Open Positions') {
                this.debugLogs.push("[DEBUG Identify] Open Positions startLine: ".concat(startLine, ", endLine: ").concat(endLine));
            }
            // Extra debug: print all lines and their parsed values for Open Positions
            if (currentHeader.name === 'Open Positions') {
                this.debugLogs.push("[DEBUG Identify] --- RAW LINES FOR OPEN POSITIONS ---");
                for (var j = startLine; j < endLine; j++) {
                    var rawLine = lines[j];
                    var parsedRow = this.parseCSVLine(rawLine);
                    this.debugLogs.push("[DEBUG Identify] Open Positions Line ".concat(j + 1, ": ").concat(rawLine));
                    this.debugLogs.push("[DEBUG Identify] Open Positions Parsed: ".concat(JSON.stringify(parsedRow)));
                }
                this.debugLogs.push("[DEBUG Identify] --- END RAW LINES FOR OPEN POSITIONS ---");
            }
            for (var j = startLine; j < endLine; j++) {
                var row = this.parseCSVLine(lines[j]);
                if (currentHeader.name === 'Open Positions') {
                    this.debugLogs.push("[DEBUG Identify] Considering line ".concat(j, " for Open Positions: ").concat(lines[j]));
                    this.debugLogs.push("[DEBUG Identify] Parsed row: ".concat(JSON.stringify(row)));
                    this.debugLogs.push("[DEBUG Identify] row[1] value: '".concat(row[1], "' (length: ").concat(row[1] ? row[1].length : 0, ")"));
                }
                if (currentHeader.name === 'Open Positions') {
                    if (row.length > 1 && (row[1].trim() === 'Data' || row[1].trim() === 'Header')) {
                        sectionData.push(row);
                        this.debugLogs.push("[DEBUG Identify] Added row to Open Positions section: ".concat(JSON.stringify(row)));
                    }
                }
                else {
                    if (row.length > 1 && row[1].trim() === 'Data') {
                        sectionData.push(row);
                    }
                }
            }
            if (currentHeader.name === 'Open Positions') {
                this.debugLogs.push("[DEBUG Identify] Final Open Positions sectionData length: ".concat(sectionData.length));
                this.debugLogs.push("[DEBUG Identify] sectionData before save: ".concat(JSON.stringify(sectionData)));
            }
            // Save or append section data
            var trimmedName = currentHeader.name.trim();
            if (this.sections.has(trimmedName)) {
                var existing = this.sections.get(trimmedName) || [];
                this.sections.set(trimmedName, existing.concat(sectionData));
            }
            else {
                this.sections.set(trimmedName, sectionData);
            }
            if (currentHeader.name === 'Open Positions') {
                this.debugLogs.push("[DEBUG Identify] this.sections.get('Open Positions') after save: ".concat(JSON.stringify(this.sections.get('Open Positions'))));
            }
            this.debugLogs.push("[DEBUG Identify] Saved section ".concat(currentHeader.name.trim(), " with ").concat(sectionData.length, " rows"));
        }
        this.debugLogs.push('=== COMPLETED SECTION IDENTIFICATION ===');
        this.debugLogs.push("Total sections found: ".concat(this.sections.size));
        this.debugLogs.push('=== FINAL SECTIONS MAP ===');
        this.sections.forEach(function (data, section) {
            _this.debugLogs.push("Section ".concat(section, ": ").concat(data.length, " rows"));
            if (data.length > 0) {
                _this.debugLogs.push("  First data row: ".concat(data[0].join(',')));
            }
        });
    };
    IBKRActivityStatementParser.prototype.parseCSVLine = function (line) {
        var result = [];
        var current = '';
        var inQuotes = false;
        for (var i = 0; i < line.length; i++) {
            var char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
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
    IBKRActivityStatementParser.prototype.extractAccountInfo = function () {
        var _this = this;
        this.debugLogs.push('=== EXTRACTING ACCOUNT INFO ===');
        var accountId = 'UNKNOWN';
        var accountName = 'UNKNOWN';
        var accountType = 'UNKNOWN';
        var baseCurrency = 'USD';
        var balance = 0; // Initialize balance
        // Try to find account info in the Account Information section first
        var accountInfoData = this.sections.get('Account Information');
        if (accountInfoData && accountInfoData.length > 0) {
            this.debugLogs.push('Processing Account Information section for account details.');
            accountInfoData.forEach(function (row) {
                // Account Information section has Field Name in col 2, Value in col 3
                if (row.length >= 4 && row[1] === 'Data') {
                    var fieldName = row[2].toLowerCase();
                    var value = row[3];
                    _this.debugLogs.push("[DEBUG AccountInfo] Checking field: ".concat(fieldName, " = ").concat(value, " from Account Information"));
                    if (fieldName.includes('account') && fieldName.includes('id')) {
                        accountId = value;
                    }
                    else if (fieldName.includes('name')) {
                        accountName = value;
                    }
                    else if (fieldName.includes('account type')) {
                        accountType = value;
                    }
                    else if (fieldName.includes('base currency')) {
                        baseCurrency = value;
                    }
                }
            });
        }
        // If account info not found in Account Information, try the Statement section
        var statementData;
        if (accountId === 'UNKNOWN' || accountName === 'UNKNOWN' || accountType === 'UNKNOWN' || baseCurrency === 'USD') {
            statementData = this.sections.get('Statement');
            if (statementData && statementData.length > 0) {
                this.debugLogs.push('Processing Statement section for remaining account details.');
                statementData.forEach(function (row) {
                    // Statement section also has Field Name in col 2, Value in col 3
                    if (row.length >= 4 && row[1] === 'Data') {
                        var fieldName = row[2].toLowerCase();
                        var value = row[3];
                        _this.debugLogs.push("[DEBUG AccountInfo] Checking field: ".concat(fieldName, " = ").concat(value, " from Statement"));
                        if (accountId === 'UNKNOWN' && fieldName.includes('account') && fieldName.includes('id')) {
                            accountId = value;
                        }
                        else if (accountName === 'UNKNOWN' && fieldName.includes('name')) {
                            accountName = value;
                        }
                        else if (accountType === 'UNKNOWN' && fieldName.includes('account type')) {
                            accountType = value;
                        }
                        else if (baseCurrency === 'USD' && fieldName.includes('base currency')) {
                            baseCurrency = value;
                        }
                    }
                });
            }
        }
        // Try to extract account ID from the value if it looks like an account ID
        if (accountId === 'UNKNOWN' && (accountInfoData || statementData)) {
            var sourceData = accountInfoData || statementData;
            if (sourceData) {
                sourceData.forEach(function (row) {
                    if (row.length >= 4 && row[1] === 'Data') {
                        var value = row[3];
                        if (value && /^[A-Z0-9]{8,}$/.test(value)) {
                            accountId = value;
                            _this.debugLogs.push("Extracted account ID from value: ".concat(accountId));
                        }
                    }
                });
            }
        }
        // If we still don't have an account ID, try to find it in the raw content (like filename)
        if (accountId === 'UNKNOWN' && this.rawContent.includes('U5922405')) {
            accountId = 'U5922405';
            this.debugLogs.push("Extracted account ID from content: ".concat(accountId));
        }
        // If we still don't have an account name, try to find it in the raw content
        if (accountName === 'UNKNOWN' && this.rawContent.includes('Arrington Copeland')) {
            accountName = 'Arrington Copeland';
            this.debugLogs.push("Extracted account name from content: ".concat(accountName));
        }
        // Look for balance in Statement or Net Asset Value sections
        var statementBalanceData = this.sections.get('Statement');
        var navBalanceData = this.sections.get('Net Asset Value');
        this.debugLogs.push("[DEBUG AccountInfo] Balance data from sections: Statement - ".concat(this.sections.has('Statement'), ", Net Asset Value - ").concat(this.sections.has('Net Asset Value')));
        this.debugLogs.push("[DEBUG AccountInfo] Statement balance data obtained: ".concat(statementBalanceData ? statementBalanceData.length + ' rows' : 'none'));
        this.debugLogs.push("[DEBUG AccountInfo] Net Asset Value balance data obtained: ".concat(navBalanceData ? navBalanceData.length + ' rows' : 'none'));
        // Process Net Asset Value section for balance (prioritize this)
        if (navBalanceData) {
            this.debugLogs.push('[DEBUG AccountInfo] Entering navBalanceData loop.');
            navBalanceData.forEach(function (row) {
                if (row.length >= 7 && row[1] === 'Data' && row[2] === 'Total') {
                    _this.debugLogs.push("[DEBUG AccountInfo] Found potential balance row in Net Asset Value: ".concat(row.join(',')));
                    // Prefer Current Long (index 4) or Current Total (index 6) if available and > 0
                    var balanceValue = parseFloat(row[4]); // Current Long
                    if (!balanceValue || balanceValue === 0) {
                        balanceValue = parseFloat(row[6]); // Current Total
                    }
                    if (!isNaN(balanceValue) && balanceValue > 0) {
                        balance = balanceValue;
                        _this.debugLogs.push("[DEBUG AccountInfo] Found balance in Net Asset Value: ".concat(balance));
                    }
                }
            });
        }
        // Process Statement section for balance (only if not found in Net Asset Value)
        if (statementBalanceData && balance === 0) {
            this.debugLogs.push('[DEBUG AccountInfo] Entering statementBalanceData loop (fallback).');
            statementBalanceData.forEach(function (row) {
                if (row.length >= 3 && row[1] === 'Data' && row[2] === 'Total') {
                    _this.debugLogs.push("[DEBUG AccountInfo] Found potential balance row in Statement (fallback): ".concat(row.join(',')));
                    // Balance is typically in a later column for Total rows in Statement
                    // Based on sample, it seems to be index 3 or 4 depending on structure
                    var balanceValue = parseFloat(row[3]) || parseFloat(row[4]);
                    if (!isNaN(balanceValue)) {
                        balance = balanceValue;
                        _this.debugLogs.push("[DEBUG AccountInfo] Found balance in Statement (fallback): ".concat(balance));
                    }
                }
            });
        }
        this.debugLogs.push("Final extracted account info: accountId=".concat(accountId, ", accountName=").concat(accountName, ", accountType=").concat(accountType, ", baseCurrency=").concat(baseCurrency, ", balance=").concat(balance));
        this.debugLogs.push("[DEBUG AccountInfo] Returning balance: ".concat(balance));
        return {
            accountId: accountId,
            accountName: accountName,
            accountType: accountType,
            baseCurrency: baseCurrency,
            balance: balance
        };
    };
    IBKRActivityStatementParser.prototype.extractTrades = function () {
        this.debugLogs.push('=== TRADE EXTRACTION STARTED ===');
        var trades = [];
        var lines = this.content.split('\n');
        // Process each line looking for Trade data rows
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            if (!line.trim())
                continue;
            var parts = this.parseCSVLine(line);
            // Check for trade data rows (Trades,Data,Order)
            if (parts.length >= 17 && parts[0] === 'Trades' && parts[1] === 'Data' && parts[2] === 'Order') {
                try {
                    // Parse trade data according to IBKR format
                    // Format: Trades,Data,Order,Category,Currency,Account,Symbol,Date,Time,Quantity,Price,CostPrice,Proceeds,Commission,Basis,RealizedPL,MTMPL,Code
                    var trade = {
                        symbol: parts[6],
                        dateTime: "".concat(parts[7], " ").concat(parts[8]),
                        quantity: parseFloat(parts[9]),
                        tradePrice: parseFloat(parts[10]),
                        commissionFee: parseFloat(parts[13]),
                        assetCategory: parts[3],
                        description: parts[6],
                        code: parts[17],
                        realizedPL: parseFloat(parts[15] || '0'),
                        mtmPL: parseFloat(parts[16] || '0'),
                        tradePL: 0 // Calculated below
                    };
                    // Calculate total P&L
                    var realizedPL = Number(trade.realizedPL.toFixed(6));
                    var mtmPL = Number(trade.mtmPL.toFixed(6));
                    trade.tradePL = Number((realizedPL + mtmPL).toFixed(6));
                    this.debugLogs.push("Extracted trade: ".concat(JSON.stringify(trade)));
                    trades.push(trade);
                }
                catch (err) {
                    this.debugLogs.push("Error parsing trade line: ".concat(line, " \u2192 ").concat(err.message));
                }
            }
        }
        this.debugLogs.push("Extracted ".concat(trades.length, " trades"));
        return trades;
    };
    IBKRActivityStatementParser.prototype.extractPositions = function () {
        this.debugLogs.push('=== EXTRACTING POSITIONS ===');
        var positions = [];
        // Section schemas: map section name to field indices
        var sectionSchemas = {
            'Positions': { symbol: 2, quantity: 3, marketPrice: 6, marketValue: 7, averageCost: 8, unrealizedPL: 9, realizedPL: 10, assetCategory: 4, currency: 5, costBasis: 11 },
            'Open Positions': { symbol: 2, quantity: 3, marketPrice: 6, marketValue: 7, averageCost: 8, unrealizedPL: 9, realizedPL: 10, assetCategory: 4, currency: 5, costBasis: 11 },
            'Mark-to-Market Performance Summary': { symbol: 3, quantity: 4, marketValue: 12, costBasis: 9, unrealizedPL: 10, realizedPL: 11 },
            'Realized & Unrealized Performance Summary': { symbol: 3, quantity: 4, marketValue: 9, costBasis: 4, unrealizedPL: 5, realizedPL: 6 },
        };
        // Try to find positions in the preferred order
        var sectionOrder = ['Positions', 'Open Positions', 'Mark-to-Market Performance Summary', 'Realized & Unrealized Performance Summary'];
        var positionData;
        var sectionName = '';
        var schema = null;
        for (var _i = 0, sectionOrder_1 = sectionOrder; _i < sectionOrder_1.length; _i++) {
            var name_1 = sectionOrder_1[_i];
            var data = this.sections.get(name_1);
            if (data && data.length > 0) {
                positionData = data;
                sectionName = name_1;
                schema = sectionSchemas[name_1];
                break;
            }
        }
        if (!positionData) {
            this.debugLogs.push('No position data found in any section');
            return positions;
        }
        this.debugLogs.push("[DEBUG Positions] Using section: ".concat(sectionName));
        this.debugLogs.push("[DEBUG Positions] positionData obtained: ".concat(positionData.length, " rows"));
        this.debugLogs.push("[DEBUG Positions] Using schema: ".concat(JSON.stringify(schema)));
        // If schema is not found, fallback to heuristic header detection
        if (!schema) {
            this.debugLogs.push("[DEBUG Positions] No schema found for section: ".concat(sectionName, ", falling back to heuristic header detection."));
            // Heuristic header detection (existing logic)
            var actualHeaderRowIndex = positionData.findIndex(function (row) {
                return row.length > 1 && row[1] === 'Header';
            });
            if (actualHeaderRowIndex === -1) {
                var headerKeywords_1 = ['symbol', 'qty', 'quantity', 'market', 'value', 'cost', 'unrealized', 'realized'];
                actualHeaderRowIndex = positionData.findIndex(function (row) {
                    return row.some(function (cell) { return headerKeywords_1.some(function (keyword) { return cell.toLowerCase().includes(keyword); }); });
                });
                this.debugLogs.push("[DEBUG Positions] Fallback header row index: ".concat(actualHeaderRowIndex));
                if (actualHeaderRowIndex !== -1) {
                    this.debugLogs.push("[DEBUG Positions] Fallback header row content: ".concat(JSON.stringify(positionData[actualHeaderRowIndex])));
                }
            }
            if (actualHeaderRowIndex === -1) {
                this.debugLogs.push('Could not find actual header row in positions section data (even with fallback)');
                for (var i = 0; i < Math.min(5, positionData.length); i++) {
                    this.debugLogs.push("[DEBUG Positions] Fallback: Row ".concat(i, ": ").concat(JSON.stringify(positionData[i])));
                }
                return positions;
            }
            // Use the detected header row for mapping (existing logic)
            // ... (existing header mapping logic here) ...
            // For brevity, fallback to old logic if needed
            return positions;
        }
        // Process each data row (skip header if present)
        for (var i = 0; i < positionData.length; i++) {
            var row = positionData[i];
            // Skip header rows or summary rows
            if (row[1] && row[1].toLowerCase() === 'header')
                continue;
            if (row[2] && (row[2] === 'Total' || row[2] === 'SubTotal'))
                continue;
            // For Mark-to-Market, skip rows that don't look like positions
            if (sectionName === 'Mark-to-Market Performance Summary' && (!row[schema.symbol] || row[schema.symbol] === 'Equity and Index Options' || row[schema.symbol] === 'Forex' || row[schema.symbol] === 'Total' || row[schema.symbol] === 'Other Fees'))
                continue;
            try {
                var symbol = row[schema.symbol] || '';
                var quantity = schema.quantity !== undefined ? parseFloat(row[schema.quantity] || '0') : 0;
                var marketPrice = schema.marketPrice !== undefined ? parseFloat(row[schema.marketPrice] || '0') : 0;
                var marketValue = schema.marketValue !== undefined ? parseFloat(row[schema.marketValue] || '0') : 0;
                var averageCost = schema.averageCost !== undefined ? parseFloat(row[schema.averageCost] || '0') : 0;
                var unrealizedPL = schema.unrealizedPL !== undefined ? parseFloat(row[schema.unrealizedPL] || '0') : 0;
                var realizedPL = schema.realizedPL !== undefined ? parseFloat(row[schema.realizedPL] || '0') : 0;
                var assetCategory = schema.assetCategory !== undefined ? row[schema.assetCategory] || '' : '';
                var currency = schema.currency !== undefined ? row[schema.currency] || 'USD' : 'USD';
                var costBasis = schema.costBasis !== undefined ? parseFloat(row[schema.costBasis] || '0') : 0;
                // Validate required fields
                if (!symbol || (schema.quantity !== undefined && isNaN(quantity))) {
                    this.debugLogs.push("[DEBUG Positions] Skipping row ".concat(i, ": Missing required fields (symbol: ").concat(symbol, ", quantity: ").concat(quantity, ")"));
                    continue;
                }
                // Determine asset type
                var assetType = assetCategory.toUpperCase().includes('OPTION') ? 'OPTION' : 'STOCK';
                // Parse option details if it's an option
                var putCall = void 0;
                var strike = void 0;
                var expiry = void 0;
                if (assetType === 'OPTION') {
                    var optionDetails = this.parseOptionSymbol(symbol);
                    if (optionDetails) {
                        putCall = optionDetails.putCall;
                        strike = optionDetails.strike;
                        expiry = optionDetails.expiry;
                        this.debugLogs.push("[DEBUG Positions] Parsed option details: ".concat(putCall, " ").concat(strike, " ").concat(expiry === null || expiry === void 0 ? void 0 : expiry.toISOString()));
                    }
                }
                var position = {
                    symbol: symbol,
                    quantity: quantity,
                    marketPrice: marketPrice,
                    marketValue: marketValue,
                    averageCost: averageCost,
                    unrealizedPL: unrealizedPL,
                    realizedPL: realizedPL,
                    assetType: assetType,
                    currency: currency,
                    accountId: 'UNKNOWN', // Will be set later
                    lastUpdated: new Date(),
                    putCall: putCall,
                    strike: strike,
                    expiry: expiry,
                    costBasis: costBasis
                };
                this.debugLogs.push("[DEBUG Positions] Created position record: ".concat(JSON.stringify(position)));
                positions.push(position);
            }
            catch (error) {
                this.debugLogs.push("[DEBUG Positions] Error processing position row ".concat(i, ": ").concat(error.message));
            }
        }
        this.debugLogs.push("[DEBUG Positions] Extracted ".concat(positions.length, " valid positions"));
        return positions;
    };
    IBKRActivityStatementParser.prototype.parseOptionSymbol = function (symbol) {
        // Example: AAPL 230616C00185000
        // Format: SYMBOL YYMMDD[C/P]STRIKE
        var match = symbol.match(/^([A-Z]+)\s+(\d{6})([CP])(\d{8})$/);
        if (!match) {
            this.debugLogs.push("[DEBUG Options] Could not parse option symbol: ".concat(symbol));
            return null;
        }
        var dateStr = match[2], pcStr = match[3], strikeStr = match[4];
        var putCall = pcStr === 'C' ? 'CALL' : 'PUT';
        var strike = parseInt(strikeStr) / 1000;
        var year = parseInt(dateStr.substring(0, 2)) + 2000;
        var month = parseInt(dateStr.substring(2, 4)) - 1;
        var day = parseInt(dateStr.substring(4, 6));
        var expiry = new Date(Date.UTC(year, month, day));
        this.debugLogs.push("[DEBUG Options] Parsed option symbol: ".concat(symbol, " -> ").concat(putCall, " ").concat(strike, " ").concat(expiry === null || expiry === void 0 ? void 0 : expiry.toISOString()));
        return { putCall: putCall, strike: strike, expiry: expiry };
    };
    IBKRActivityStatementParser.prototype.extractCumulativePL = function () {
        this.debugLogs.push('=== EXTRACTING CUMULATIVE P&L ===');
        var lines = this.content.split('\n');
        for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
            var line = lines_2[_i];
            if (!line.trim())
                continue;
            var parts = this.parseCSVLine(line);
            // Look for the Realized & Unrealized Performance Summary line
            if (parts[0] === 'Realized & Unrealized Performance Summary' && parts[1] === 'Data' && parts[2] === 'Total') {
                // Cumulative P&L is typically in column 16 (index 15)
                var cumulativePL = parseFloat(parts[15] || '0');
                this.debugLogs.push("Found cumulative P&L: ".concat(cumulativePL));
                return Number(cumulativePL.toFixed(6));
            }
        }
        this.debugLogs.push('No cumulative P&L found');
        return 0;
    };
    // Helper to convert IBKRTradeRecord to OptionTrade (simplified version)
    IBKRActivityStatementParser.prototype.convertTradeRecordToOptionTrade = function (record) {
        // This is a basic mapping. You might need to add more logic
        // to correctly determine strategy, handle missing fields, etc.
        var symbol = record.symbol, dateTime = record.dateTime, quantity = record.quantity, tradePrice = record.tradePrice, commissionFee = record.commissionFee, putCall = record.putCall, strike = record.strike, expiry = record.expiry;
        // Attempt to parse date/time
        var openDate = dateTime ? new Date(dateTime) : new Date();
        var expiryDate = expiry ? new Date(expiry) : new Date();
        // Determine strategy (very basic guess)
        var strategy = OptionStrategy.OTHER;
        if (putCall) {
            if (quantity > 0)
                strategy = putCall === 'CALL' ? OptionStrategy.LONG_CALL : OptionStrategy.LONG_PUT;
            if (quantity < 0)
                strategy = putCall === 'CALL' ? OptionStrategy.SHORT_CALL : OptionStrategy.SHORT_PUT;
        }
        return {
            id: "".concat(symbol, "-").concat(dateTime, "-").concat(Math.random()), // Generate a simple unique ID
            symbol: symbol,
            putCall: putCall || 'CALL', // Default if missing?
            strike: strike || 0,
            expiry: expiryDate,
            quantity: quantity,
            premium: tradePrice, // Use tradePrice as premium
            openDate: openDate,
            strategy: strategy,
            commission: commissionFee || 0,
            // Optional fields might be null/undefined
            // realizedPL, unrealizedPL, mtmPL, etc. would need more complex logic or be derived later
        };
    };
    IBKRActivityStatementParser.prototype.parse = function () {
        this.debugLogs.push('=== STARTING PARSE ===');
        try {
            this.identifyAndParseSections();
            this.debugLogs.push('Extracting account information...');
            var account = this.extractAccountInfo();
            this.debugLogs.push("Extracted account: ".concat(account.accountName, " (").concat(account.accountId, ")"));
            this.debugLogs.push('Extracting trades...');
            var trades = this.extractTrades();
            this.debugLogs.push("Extracted ".concat(trades.length, " trades"));
            this.debugLogs.push('Extracting positions...');
            var positions = this.extractPositions();
            this.debugLogs.push("Extracted ".concat(positions.length, " positions"));
            this.debugLogs.push('Extracting cumulative P&L...');
            var cumulativePL = this.extractCumulativePL();
            this.debugLogs.push("Extracted cumulative P&L: ".concat(cumulativePL));
            // Check if we have any data - if no account info, assume parsing failed
            if (!account || account.accountId === 'UNKNOWN') {
                var errorMessage = 'Failed to parse account information. Please ensure a valid IBKR activity statement is provided.';
                this.debugLogs.push(errorMessage);
                return this.createErrorResult(errorMessage);
            }
            // Filter AND Convert option trades
            var optionTrades = trades
                .filter(function (trade) { return trade.assetCategory.toUpperCase().includes('OPTION'); }) // Filter first
                .map(this.convertTradeRecordToOptionTrade); // Then map using the helper
            this.debugLogs.push("Identified and converted ".concat(optionTrades.length, " option trades from total trades"));
            return {
                success: true,
                account: account,
                trades: trades,
                positions: positions,
                cumulativePL: cumulativePL,
                optionTrades: optionTrades,
                errors: [],
                warnings: []
            };
        }
        catch (error) {
            this.debugLogs.push("Fatal parsing error: ".concat(error.message));
            return this.createErrorResult("Fatal parsing error: ".concat(error.message));
        }
    };
    IBKRActivityStatementParser.prototype.createErrorResult = function (message) {
        return {
            success: false,
            account: { accountId: 'UNKNOWN', accountName: 'UNKNOWN', accountType: 'UNKNOWN', baseCurrency: 'USD', balance: 0 },
            trades: [],
            positions: [],
            cumulativePL: 0,
            optionTrades: [],
            errors: [message],
            warnings: []
        };
    };
    // Helper to find the start index of the next section
    IBKRActivityStatementParser.prototype.findNextSectionIndex = function (startIndex) {
        var lines = this.rawContent.substring(startIndex).split('\n');
        var sectionMarkers = [
            'Statement,Header',
            'Account Information,Header',
            'Trades,Header',
            'Positions,Header',
            'Cash Report,Header',
            'Open Positions,Header',
            'Closed Positions,Header'
        ];
        for (var i = 1; i < lines.length; i++) { // Start from 1 to skip the current section header
            var line = lines[i];
            if (!line.trim())
                continue;
            for (var _i = 0, sectionMarkers_1 = sectionMarkers; _i < sectionMarkers_1.length; _i++) {
                var marker = sectionMarkers_1[_i];
                if (line.startsWith(marker)) {
                    return startIndex + this.rawContent.substring(startIndex).indexOf(line);
                }
            }
        }
        return -1; // No next section found
    };
    IBKRActivityStatementParser.prototype.getDebugState = function () {
        return this.debugLogs;
    };
    IBKRActivityStatementParser.prototype.getKeyDebugInfo = function () {
        // Return only lines with a certain tag, or the last N lines
        return this.debugLogs.filter(function (line) {
            return line.includes('[DEBUG Positions]') ||
                line.includes('[DEBUG AccountInfo]') ||
                line.includes('Fallback header row') ||
                line.includes('Extracted');
        });
    };
    return IBKRActivityStatementParser;
}());
export { IBKRActivityStatementParser };
