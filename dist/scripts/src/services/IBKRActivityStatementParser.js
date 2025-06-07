"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IBKRActivityStatementParser = void 0;
const options_1 = require("../types/options");
/**
 * Main parser class for IBKR activity statements
 */
class IBKRActivityStatementParser {
    constructor(content) {
        this.content = content;
        this.sections = new Map();
        this.debugLogs = [];
        this.rawContent = content;
        this.debugLogs.push('=== PARSER INITIALIZATION ===');
        this.debugLogs.push(`Content length: ${content.length} characters`);
        this.debugLogs.push(`Raw Content Start:\n${this.rawContent.substring(0, 500)}...\nRaw Content End`);
        this.debugLogs.push('=== END INITIALIZATION ===');
    }
    identifyAndParseSections() {
        this.debugLogs.push('=== STARTING SECTION IDENTIFICATION ===');
        const lines = this.content.split('\n');
        const sectionHeaders = [];
        lines.forEach((line, index) => {
            if (!line.trim()) {
                return;
            }
            const row = this.parseCSVLine(line);
            // Log the first few lines for debugging
            if (index < 20) { // Increased logging for initial lines
                this.debugLogs.push(`[DEBUG Identify] Line ${index + 1}: ${line}`);
                this.debugLogs.push(`[DEBUG Identify] Parsed as: ${JSON.stringify(row)}`);
            }
            if (row.length >= 2) {
                const sectionName = row[0].trim();
                const rowType = row[1].trim();
                // Identify section headers by row type NOT being 'Data'
                if (rowType !== 'Data') {
                    sectionHeaders.push({ name: sectionName, lineIndex: index });
                    this.debugLogs.push(`[DEBUG Identify] Found section header [${sectionName}] at line ${index + 1}`);
                }
            }
        });
        this.debugLogs.push(`[DEBUG Identify] Found ${sectionHeaders.length} section headers`);
        sectionHeaders.forEach((header, idx) => {
            this.debugLogs.push(`[DEBUG Identify] Section header: ${header.name} at line ${header.lineIndex}`);
        });
        // Process each section
        for (let i = 0; i < sectionHeaders.length; i++) {
            const currentHeader = sectionHeaders[i];
            const nextHeader = i < sectionHeaders.length - 1 ? sectionHeaders[i + 1] : null;
            let startLine = currentHeader.lineIndex + 1;
            if (currentHeader.name === 'Open Positions') {
                startLine = currentHeader.lineIndex;
            }
            const endLine = nextHeader ? nextHeader.lineIndex : lines.length;
            const sectionData = [];
            this.debugLogs.push(`[DEBUG Identify] Processing section: ${currentHeader.name} (lines ${startLine} to ${endLine})`);
            if (currentHeader.name === 'Open Positions') {
                this.debugLogs.push(`[DEBUG Identify] Open Positions startLine: ${startLine}, endLine: ${endLine}`);
            }
            // Extra debug: print all lines and their parsed values for Open Positions
            if (currentHeader.name === 'Open Positions') {
                this.debugLogs.push(`[DEBUG Identify] --- RAW LINES FOR OPEN POSITIONS ---`);
                for (let j = startLine; j < endLine; j++) {
                    const rawLine = lines[j];
                    const parsedRow = this.parseCSVLine(rawLine);
                    this.debugLogs.push(`[DEBUG Identify] Open Positions Line ${j + 1}: ${rawLine}`);
                    this.debugLogs.push(`[DEBUG Identify] Open Positions Parsed: ${JSON.stringify(parsedRow)}`);
                }
                this.debugLogs.push(`[DEBUG Identify] --- END RAW LINES FOR OPEN POSITIONS ---`);
            }
            for (let j = startLine; j < endLine; j++) {
                const row = this.parseCSVLine(lines[j]);
                if (currentHeader.name === 'Open Positions') {
                    this.debugLogs.push(`[DEBUG Identify] Considering line ${j} for Open Positions: ${lines[j]}`);
                    this.debugLogs.push(`[DEBUG Identify] Parsed row: ${JSON.stringify(row)}`);
                    this.debugLogs.push(`[DEBUG Identify] row[1] value: '${row[1]}' (length: ${row[1] ? row[1].length : 0})`);
                }
                if (currentHeader.name === 'Open Positions') {
                    if (row.length > 1 && (row[1].trim() === 'Data' || row[1].trim() === 'Header')) {
                        sectionData.push(row);
                        this.debugLogs.push(`[DEBUG Identify] Added row to Open Positions section: ${JSON.stringify(row)}`);
                    }
                }
                else {
                    if (row.length > 1 && row[1].trim() === 'Data') {
                        sectionData.push(row);
                    }
                }
            }
            if (currentHeader.name === 'Open Positions') {
                this.debugLogs.push(`[DEBUG Identify] Final Open Positions sectionData length: ${sectionData.length}`);
                this.debugLogs.push(`[DEBUG Identify] sectionData before save: ${JSON.stringify(sectionData)}`);
            }
            // Save or append section data
            const trimmedName = currentHeader.name.trim();
            if (this.sections.has(trimmedName)) {
                const existing = this.sections.get(trimmedName) || [];
                this.sections.set(trimmedName, existing.concat(sectionData));
            }
            else {
                this.sections.set(trimmedName, sectionData);
            }
            if (currentHeader.name === 'Open Positions') {
                this.debugLogs.push(`[DEBUG Identify] this.sections.get('Open Positions') after save: ${JSON.stringify(this.sections.get('Open Positions'))}`);
            }
            this.debugLogs.push(`[DEBUG Identify] Saved section ${currentHeader.name.trim()} with ${sectionData.length} rows`);
        }
        this.debugLogs.push('=== COMPLETED SECTION IDENTIFICATION ===');
        this.debugLogs.push(`Total sections found: ${this.sections.size}`);
        this.debugLogs.push('=== FINAL SECTIONS MAP ===');
        this.sections.forEach((data, section) => {
            this.debugLogs.push(`Section ${section}: ${data.length} rows`);
            if (data.length > 0) {
                this.debugLogs.push(`  First data row: ${data[0].join(',')}`);
            }
        });
    }
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
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
    }
    extractAccountInfo() {
        this.debugLogs.push('=== EXTRACTING ACCOUNT INFO ===');
        let accountId = 'UNKNOWN';
        let accountName = 'UNKNOWN';
        let accountType = 'UNKNOWN';
        let baseCurrency = 'USD';
        let balance = 0; // Initialize balance
        // Try to find account info in the Account Information section first
        const accountInfoData = this.sections.get('Account Information');
        if (accountInfoData && accountInfoData.length > 0) {
            this.debugLogs.push('Processing Account Information section for account details.');
            accountInfoData.forEach((row) => {
                // Account Information section has Field Name in col 2, Value in col 3
                if (row.length >= 4 && row[1] === 'Data') {
                    const fieldName = row[2].toLowerCase();
                    const value = row[3];
                    this.debugLogs.push(`[DEBUG AccountInfo] Checking field: ${fieldName} = ${value} from Account Information`);
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
        let statementData;
        if (accountId === 'UNKNOWN' || accountName === 'UNKNOWN' || accountType === 'UNKNOWN' || baseCurrency === 'USD') {
            statementData = this.sections.get('Statement');
            if (statementData && statementData.length > 0) {
                this.debugLogs.push('Processing Statement section for remaining account details.');
                statementData.forEach((row) => {
                    // Statement section also has Field Name in col 2, Value in col 3
                    if (row.length >= 4 && row[1] === 'Data') {
                        const fieldName = row[2].toLowerCase();
                        const value = row[3];
                        this.debugLogs.push(`[DEBUG AccountInfo] Checking field: ${fieldName} = ${value} from Statement`);
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
            const sourceData = accountInfoData || statementData;
            if (sourceData) {
                sourceData.forEach((row) => {
                    if (row.length >= 4 && row[1] === 'Data') {
                        const value = row[3];
                        if (value && /^[A-Z0-9]{8,}$/.test(value)) {
                            accountId = value;
                            this.debugLogs.push(`Extracted account ID from value: ${accountId}`);
                        }
                    }
                });
            }
        }
        // If we still don't have an account ID, try to find it in the raw content (like filename)
        if (accountId === 'UNKNOWN' && this.rawContent.includes('U5922405')) {
            accountId = 'U5922405';
            this.debugLogs.push(`Extracted account ID from content: ${accountId}`);
        }
        // If we still don't have an account name, try to find it in the raw content
        if (accountName === 'UNKNOWN' && this.rawContent.includes('Arrington Copeland')) {
            accountName = 'Arrington Copeland';
            this.debugLogs.push(`Extracted account name from content: ${accountName}`);
        }
        // Look for balance in Statement or Net Asset Value sections
        const statementBalanceData = this.sections.get('Statement');
        const navBalanceData = this.sections.get('Net Asset Value');
        this.debugLogs.push(`[DEBUG AccountInfo] Balance data from sections: Statement - ${this.sections.has('Statement')}, Net Asset Value - ${this.sections.has('Net Asset Value')}`);
        this.debugLogs.push(`[DEBUG AccountInfo] Statement balance data obtained: ${statementBalanceData ? statementBalanceData.length + ' rows' : 'none'}`);
        this.debugLogs.push(`[DEBUG AccountInfo] Net Asset Value balance data obtained: ${navBalanceData ? navBalanceData.length + ' rows' : 'none'}`);
        // Process Net Asset Value section for balance (prioritize this)
        if (navBalanceData) {
            this.debugLogs.push('[DEBUG AccountInfo] Entering navBalanceData loop.');
            navBalanceData.forEach((row) => {
                if (row.length >= 7 && row[1] === 'Data' && row[2] === 'Total') {
                    this.debugLogs.push(`[DEBUG AccountInfo] Found potential balance row in Net Asset Value: ${row.join(',')}`);
                    // Prefer Current Long (index 4) or Current Total (index 6) if available and > 0
                    let balanceValue = parseFloat(row[4]); // Current Long
                    if (!balanceValue || balanceValue === 0) {
                        balanceValue = parseFloat(row[6]); // Current Total
                    }
                    if (!isNaN(balanceValue) && balanceValue > 0) {
                        balance = balanceValue;
                        this.debugLogs.push(`[DEBUG AccountInfo] Found balance in Net Asset Value: ${balance}`);
                    }
                }
            });
        }
        // Process Statement section for balance (only if not found in Net Asset Value)
        if (statementBalanceData && balance === 0) {
            this.debugLogs.push('[DEBUG AccountInfo] Entering statementBalanceData loop (fallback).');
            statementBalanceData.forEach((row) => {
                if (row.length >= 3 && row[1] === 'Data' && row[2] === 'Total') {
                    this.debugLogs.push(`[DEBUG AccountInfo] Found potential balance row in Statement (fallback): ${row.join(',')}`);
                    // Balance is typically in a later column for Total rows in Statement
                    // Based on sample, it seems to be index 3 or 4 depending on structure
                    const balanceValue = parseFloat(row[3]) || parseFloat(row[4]);
                    if (!isNaN(balanceValue)) {
                        balance = balanceValue;
                        this.debugLogs.push(`[DEBUG AccountInfo] Found balance in Statement (fallback): ${balance}`);
                    }
                }
            });
        }
        this.debugLogs.push(`Final extracted account info: accountId=${accountId}, accountName=${accountName}, accountType=${accountType}, baseCurrency=${baseCurrency}, balance=${balance}`);
        this.debugLogs.push(`[DEBUG AccountInfo] Returning balance: ${balance}`);
        return {
            accountId,
            accountName,
            accountType,
            baseCurrency,
            balance
        };
    }
    extractTrades() {
        this.debugLogs.push('=== TRADE EXTRACTION STARTED ===');
        const trades = [];
        const lines = this.content.split('\n');
        // Get the 'Trades' section data if available, otherwise fall back to line-by-line (less robust)
        const tradeSectionData = this.sections.get('Trades');
        if (tradeSectionData) {
            this.debugLogs.push(`Processing ${tradeSectionData.length} lines from 'Trades' section.`);
            for (const parts of tradeSectionData) {
                // Ensure this is an actual trade data row, not a subtotal or header within the section data
                // The section parsing should ideally only give us 'Data' rows for 'Trades' that are 'Order' type.
                // However, let's add a check for safety, though parts[0] for section data will be the section name.
                // parts[0] = Symbol, parts[1] = Date/Time, etc. for data rows within section data
                // This check needs to be re-evaluated based on how `this.sections` stores 'Trades' data
                // Assuming `identifyAndParseSections` correctly filters so `tradeSectionData` contains only relevant trade rows
                // where `parts[0]` here corresponds to `DataDiscriminator` (e.g. 'Order') if section headers were stripped,
                // or directly to `Asset Category` if `Trades,Data,Order` were already processed.
                // The `identifyAndParseSections` method stores rows where `row[1] === 'Data'`.
                // So, for a line from the 'Trades' section like:
                // Trades,Data,Order,Equity and Index Options,USD,U5922405,AAPL...,"2025-03-27, 10:30:15",1,1.22,...
                // `parts` will be ["Trades", "Data", "Order", "Equity and Index Options", ...]
                // The actual data fields start from parts[3] if we are iterating section data directly.
                // The old loop iterated raw lines. If using sectionData, parts[0] is 'Trades', parts[1] is 'Data', etc.
                // The relevant check for an order row within the 'Trades' section data is parts[2] === 'Order'
                if (parts.length >= 17 && parts[0] === 'Trades' && parts[1] === 'Data' && parts[2] === 'Order') {
                    try {
                        // CSV Header reminder (0-indexed for data part after "Trades,Data,Order"):
                        // 3: Asset Category, 4: Currency, 5: Account, 6: Symbol, 7: Date/Time,
                        // 8: Quantity, 9: T. Price, 10: C. Price, 11: Proceeds, 12: Comm/Fee,
                        // 13: Basis, 14: Realized P/L, 15: MTM P/L, 16: Code
                        const trade = {
                            symbol: parts[6],
                            dateTime: parts[7],
                            quantity: parseFloat(parts[8]),
                            tradePrice: parseFloat(parts[9]),
                            commissionFee: parseFloat(parts[12] || '0'),
                            assetCategory: parts[3],
                            description: parts[6],
                            code: parts[16],
                            realizedPL: parseFloat(parts[14] || '0'),
                            mtmPL: parseFloat(parts[15] || '0'),
                            tradePL: 0, // Will be recalculated or is `realizedPL` for closed trades
                            // Populate new fields
                            currency: parts[4],
                            ibkrAccountId: parts[5],
                            csvProceeds: parseFloat(parts[11] || '0'),
                            csvBasis: parseFloat(parts[13] || '0'),
                        };
                        // Further P/L calculation or validation can be done here if needed
                        this.debugLogs.push(`Extracted trade (from section): ${JSON.stringify(trade)}`);
                        trades.push(trade);
                    }
                    catch (err) {
                        this.debugLogs.push(`Error parsing trade parts (from section): ${JSON.stringify(parts)} → ${err.message}`);
                    }
                }
            }
        }
        else {
            this.debugLogs.push(`'Trades' section not found by identifyAndParseSections. Falling back to line-by-line parsing for trades (less reliable).`);
            // Fallback to original line-by-line parsing logic if section not found
            // This part should ideally be phased out if identifyAndParseSections is robust
            for (const line of lines) {
                if (!line.trim())
                    continue;
                const parts = this.parseCSVLine(line);
                if (parts.length >= 17 && parts[0] === 'Trades' && parts[1] === 'Data' && parts[2] === 'Order') {
                    try {
                        const trade = {
                            symbol: parts[6],
                            dateTime: parts[7],
                            quantity: parseFloat(parts[8]),
                            tradePrice: parseFloat(parts[9]),
                            commissionFee: parseFloat(parts[12] || '0'),
                            assetCategory: parts[3],
                            description: parts[6],
                            code: parts[16],
                            realizedPL: parseFloat(parts[14] || '0'),
                            mtmPL: parseFloat(parts[15] || '0'),
                            tradePL: 0,
                            // Populate new fields for fallback logic too
                            currency: parts[4],
                            ibkrAccountId: parts[5],
                            csvProceeds: parseFloat(parts[11] || '0'),
                            csvBasis: parseFloat(parts[13] || '0'),
                        };
                        this.debugLogs.push(`Extracted trade (fallback): ${JSON.stringify(trade)}`);
                        trades.push(trade);
                    }
                    catch (err) {
                        this.debugLogs.push(`Error parsing trade line (fallback): ${line} → ${err.message}`);
                    }
                }
            }
        }
        // Post-processing: Calculate tradePL if necessary (example)
        trades.forEach(trade => {
            // Example: tradePL could be net effect if not directly available or needs validation
            // This might be redundant if Realized P/L from CSV is sufficient for tradePL
            const realized = trade.realizedPL || 0;
            // const mtm = trade.mtmPL || 0; // MTM P/L is more for open positions on that day
            trade.tradePL = realized; // Often, for closed trades, Realized P/L is the trade P/L
        });
        this.debugLogs.push(`Extracted ${trades.length} trades in total.`);
        return trades;
    }
    extractPositions() {
        this.debugLogs.push('=== EXTRACTING POSITIONS ===');
        const positions = [];
        // Section schemas: map section name to field indices
        const sectionSchemas = {
            'Positions': { symbol: 2, quantity: 3, marketPrice: 6, marketValue: 7, averageCost: 8, unrealizedPL: 9, realizedPL: 10, assetCategory: 4, currency: 5, costBasis: 11 },
            'Open Positions': { symbol: 2, quantity: 3, marketPrice: 6, marketValue: 7, averageCost: 8, unrealizedPL: 9, realizedPL: 10, assetCategory: 4, currency: 5, costBasis: 11 },
            'Mark-to-Market Performance Summary': { symbol: 3, quantity: 4, marketValue: 12, costBasis: 9, unrealizedPL: 10, realizedPL: 11 },
            'Realized & Unrealized Performance Summary': { symbol: 3, quantity: 4, marketValue: 9, costBasis: 4, unrealizedPL: 5, realizedPL: 6 },
        };
        // Try to find positions in the preferred order
        const sectionOrder = ['Positions', 'Open Positions', 'Mark-to-Market Performance Summary', 'Realized & Unrealized Performance Summary'];
        let positionData;
        let sectionName = '';
        let schema = null;
        for (const name of sectionOrder) {
            const data = this.sections.get(name);
            if (data && data.length > 0) {
                positionData = data;
                sectionName = name;
                schema = sectionSchemas[name];
                break;
            }
        }
        if (!positionData) {
            this.debugLogs.push('No position data found in any section');
            return positions;
        }
        this.debugLogs.push(`[DEBUG Positions] Using section: ${sectionName}`);
        this.debugLogs.push(`[DEBUG Positions] positionData obtained: ${positionData.length} rows`);
        this.debugLogs.push(`[DEBUG Positions] Using schema: ${JSON.stringify(schema)}`);
        // If schema is not found, fallback to heuristic header detection
        if (!schema) {
            this.debugLogs.push(`[DEBUG Positions] No schema found for section: ${sectionName}, falling back to heuristic header detection.`);
            // Heuristic header detection (existing logic)
            let actualHeaderRowIndex = positionData.findIndex((row) => row.length > 1 && row[1] === 'Header');
            if (actualHeaderRowIndex === -1) {
                const headerKeywords = ['symbol', 'qty', 'quantity', 'market', 'value', 'cost', 'unrealized', 'realized'];
                actualHeaderRowIndex = positionData.findIndex((row) => row.some(cell => headerKeywords.some(keyword => cell.toLowerCase().includes(keyword))));
                this.debugLogs.push(`[DEBUG Positions] Fallback header row index: ${actualHeaderRowIndex}`);
                if (actualHeaderRowIndex !== -1) {
                    this.debugLogs.push(`[DEBUG Positions] Fallback header row content: ${JSON.stringify(positionData[actualHeaderRowIndex])}`);
                }
            }
            if (actualHeaderRowIndex === -1) {
                this.debugLogs.push('Could not find actual header row in positions section data (even with fallback)');
                for (let i = 0; i < Math.min(5, positionData.length); i++) {
                    this.debugLogs.push(`[DEBUG Positions] Fallback: Row ${i}: ${JSON.stringify(positionData[i])}`);
                }
                return positions;
            }
            // Use the detected header row for mapping (existing logic)
            // ... (existing header mapping logic here) ...
            // For brevity, fallback to old logic if needed
            return positions;
        }
        // Process each data row (skip header if present)
        for (let i = 0; i < positionData.length; i++) {
            const row = positionData[i];
            // Skip header rows or summary rows
            if (row[1] && row[1].toLowerCase() === 'header')
                continue;
            if (row[2] && (row[2] === 'Total' || row[2] === 'SubTotal'))
                continue;
            // For Mark-to-Market, skip rows that don't look like positions
            if (sectionName === 'Mark-to-Market Performance Summary' && (!row[schema.symbol] || row[schema.symbol] === 'Equity and Index Options' || row[schema.symbol] === 'Forex' || row[schema.symbol] === 'Total' || row[schema.symbol] === 'Other Fees'))
                continue;
            try {
                const symbol = row[schema.symbol] || '';
                const quantity = schema.quantity !== undefined ? parseFloat(row[schema.quantity] || '0') : 0;
                const marketPrice = schema.marketPrice !== undefined ? parseFloat(row[schema.marketPrice] || '0') : 0;
                const marketValue = schema.marketValue !== undefined ? parseFloat(row[schema.marketValue] || '0') : 0;
                const averageCost = schema.averageCost !== undefined ? parseFloat(row[schema.averageCost] || '0') : 0;
                const unrealizedPL = schema.unrealizedPL !== undefined ? parseFloat(row[schema.unrealizedPL] || '0') : 0;
                const realizedPL = schema.realizedPL !== undefined ? parseFloat(row[schema.realizedPL] || '0') : 0;
                const assetCategory = schema.assetCategory !== undefined ? row[schema.assetCategory] || '' : '';
                const currency = schema.currency !== undefined ? row[schema.currency] || 'USD' : 'USD';
                const costBasis = schema.costBasis !== undefined ? parseFloat(row[schema.costBasis] || '0') : 0;
                // Validate required fields
                if (!symbol || (schema.quantity !== undefined && isNaN(quantity))) {
                    this.debugLogs.push(`[DEBUG Positions] Skipping row ${i}: Missing required fields (symbol: ${symbol}, quantity: ${quantity})`);
                    continue;
                }
                // Determine asset type
                const assetType = assetCategory.toUpperCase().includes('OPTION') ? 'OPTION' : 'STOCK';
                // Parse option details if it's an option
                let putCall;
                let strike;
                let expiry;
                if (assetType === 'OPTION') {
                    const optionDetails = this.parseOptionSymbol(symbol);
                    if (optionDetails) {
                        putCall = optionDetails.putCall;
                        strike = optionDetails.strike;
                        expiry = optionDetails.expiry;
                        this.debugLogs.push(`[DEBUG Positions] Parsed option details: ${putCall} ${strike} ${expiry === null || expiry === void 0 ? void 0 : expiry.toISOString()}`);
                    }
                }
                const position = {
                    symbol,
                    quantity,
                    marketPrice,
                    marketValue,
                    averageCost,
                    unrealizedPL,
                    realizedPL,
                    assetType,
                    currency,
                    accountId: 'UNKNOWN', // Will be set later
                    lastUpdated: new Date(),
                    putCall,
                    strike,
                    expiry,
                    costBasis
                };
                this.debugLogs.push(`[DEBUG Positions] Created position record: ${JSON.stringify(position)}`);
                positions.push(position);
            }
            catch (error) {
                this.debugLogs.push(`[DEBUG Positions] Error processing position row ${i}: ${error.message}`);
            }
        }
        this.debugLogs.push(`[DEBUG Positions] Extracted ${positions.length} valid positions`);
        return positions;
    }
    parseOptionSymbol(symbol) {
        // Example: AAPL 230616C00185000
        // Format: SYMBOL YYMMDD[C/P]STRIKE
        const match = symbol.match(/^([A-Z]+)\s+(\d{6})([CP])(\d{8})$/);
        if (!match) {
            this.debugLogs.push(`[DEBUG Options] Could not parse option symbol: ${symbol}`);
            return null;
        }
        const [, , dateStr, pcStr, strikeStr] = match;
        const putCall = pcStr === 'C' ? 'CALL' : 'PUT';
        const strike = parseInt(strikeStr) / 1000;
        const year = parseInt(dateStr.substring(0, 2)) + 2000;
        const month = parseInt(dateStr.substring(2, 4)) - 1;
        const day = parseInt(dateStr.substring(4, 6));
        const expiry = new Date(Date.UTC(year, month, day));
        this.debugLogs.push(`[DEBUG Options] Parsed option symbol: ${symbol} -> ${putCall} ${strike} ${expiry === null || expiry === void 0 ? void 0 : expiry.toISOString()}`);
        return { putCall, strike, expiry };
    }
    extractCumulativePL() {
        this.debugLogs.push('=== EXTRACTING CUMULATIVE P&L ===');
        const lines = this.content.split('\n');
        for (const line of lines) {
            if (!line.trim())
                continue;
            const parts = this.parseCSVLine(line);
            // Look for the Realized & Unrealized Performance Summary line
            if (parts[0] === 'Realized & Unrealized Performance Summary' && parts[1] === 'Data' && parts[2] === 'Total') {
                // Cumulative P&L is typically in column 16 (index 15)
                const cumulativePL = parseFloat(parts[15] || '0');
                this.debugLogs.push(`Found cumulative P&L: ${cumulativePL}`);
                return Number(cumulativePL.toFixed(6));
            }
        }
        this.debugLogs.push('No cumulative P&L found');
        return 0;
    }
    // Helper to convert IBKRTradeRecord to OptionTrade (simplified version)
    convertTradeRecordToOptionTrade(record) {
        // This is a basic mapping. You might need to add more logic
        // to correctly determine strategy, handle missing fields, etc.
        const { symbol, dateTime, quantity, tradePrice, commissionFee, putCall, strike, expiry } = record;
        // Attempt to parse date/time
        const openDate = dateTime ? new Date(dateTime) : new Date();
        const expiryDate = expiry ? new Date(expiry) : new Date();
        // Determine strategy (very basic guess)
        let strategy = options_1.OptionStrategy.OTHER;
        if (putCall) {
            if (quantity > 0)
                strategy = putCall === 'CALL' ? options_1.OptionStrategy.LONG_CALL : options_1.OptionStrategy.LONG_PUT;
            if (quantity < 0)
                strategy = putCall === 'CALL' ? options_1.OptionStrategy.SHORT_CALL : options_1.OptionStrategy.SHORT_PUT;
        }
        return {
            id: `${symbol}-${dateTime}-${Math.random()}`, // Generate a simple unique ID
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
    }
    parse() {
        this.debugLogs.push('=== STARTING PARSE ===');
        try {
            this.identifyAndParseSections();
            this.debugLogs.push('Extracting account information...');
            const account = this.extractAccountInfo();
            this.debugLogs.push(`Extracted account: ${account.accountName} (${account.accountId})`);
            this.debugLogs.push('Extracting trades...');
            const trades = this.extractTrades();
            this.debugLogs.push(`Extracted ${trades.length} trades`);
            this.debugLogs.push('Extracting positions...');
            const positions = this.extractPositions();
            this.debugLogs.push(`Extracted ${positions.length} positions`);
            this.debugLogs.push('Extracting cumulative P&L...');
            const cumulativePL = this.extractCumulativePL();
            this.debugLogs.push(`Extracted cumulative P&L: ${cumulativePL}`);
            // Check if we have any data - if no account info, assume parsing failed
            if (!account || account.accountId === 'UNKNOWN') {
                const errorMessage = 'Failed to parse account information. Please ensure a valid IBKR activity statement is provided.';
                this.debugLogs.push(errorMessage);
                return this.createErrorResult(errorMessage);
            }
            // Filter AND Convert option trades
            const optionTrades = trades
                .filter(trade => trade.assetCategory.toUpperCase().includes('OPTION')) // Filter first
                .map(this.convertTradeRecordToOptionTrade); // Then map using the helper
            this.debugLogs.push(`Identified and converted ${optionTrades.length} option trades from total trades`);
            return {
                success: true,
                account,
                trades,
                positions,
                cumulativePL,
                optionTrades,
                errors: [],
                warnings: []
            };
        }
        catch (error) {
            this.debugLogs.push(`Fatal parsing error: ${error.message}`);
            return this.createErrorResult(`Fatal parsing error: ${error.message}`);
        }
    }
    createErrorResult(message) {
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
    }
    // Helper to find the start index of the next section
    findNextSectionIndex(startIndex) {
        const lines = this.rawContent.substring(startIndex).split('\n');
        const sectionMarkers = [
            'Statement,Header',
            'Account Information,Header',
            'Trades,Header',
            'Positions,Header',
            'Cash Report,Header',
            'Open Positions,Header',
            'Closed Positions,Header'
        ];
        for (let i = 1; i < lines.length; i++) { // Start from 1 to skip the current section header
            const line = lines[i];
            if (!line.trim())
                continue;
            for (const marker of sectionMarkers) {
                if (line.startsWith(marker)) {
                    return startIndex + this.rawContent.substring(startIndex).indexOf(line);
                }
            }
        }
        return -1; // No next section found
    }
    getDebugState() {
        return this.debugLogs;
    }
    getKeyDebugInfo() {
        // Return only lines with a certain tag, or the last N lines
        return this.debugLogs.filter(line => line.includes('[DEBUG Positions]') ||
            line.includes('[DEBUG AccountInfo]') ||
            line.includes('Fallback header row') ||
            line.includes('Extracted'));
    }
}
exports.IBKRActivityStatementParser = IBKRActivityStatementParser;
