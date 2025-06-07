import { BrokerType } from './detectBroker';
import { NormalizedTradeData, AssetCategory, OpenCloseIndicator, PutCall } from '../types/trade';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

// Helper to find a header in a list of CSV headers, with optional fuzzy matching
const findHeader = (csvHeaders: string[], targetHeaders: string[], exactMatch: boolean = false): string | undefined => {
  const normalizedCsvHeaders = csvHeaders.map(h => h.toLowerCase().trim());
  for (const target of targetHeaders) {
    const normalizedTarget = target.toLowerCase().trim();
    if (exactMatch) {
      if (normalizedCsvHeaders.includes(normalizedTarget)) {
        return csvHeaders[normalizedCsvHeaders.indexOf(normalizedTarget)];
      }
    } else {
      const found = normalizedCsvHeaders.find(h => h.includes(normalizedTarget) || normalizedTarget.includes(h));
      if (found) {
        return csvHeaders[normalizedCsvHeaders.indexOf(found)];
      }
    }
  }
  return undefined;
};

// Helper to get a value from a row using a list of possible header names
const getValue = (row: Record<string, string>, csvHeaders: string[], possibleNames: string[], exactMatch: boolean = false): string | undefined => {
  const actualHeader = findHeader(csvHeaders, possibleNames, exactMatch);
  return actualHeader ? row[actualHeader] : undefined;
};

// TODO: Implement more robust date and number parsing, possibly with a library like date-fns
const parseSafeNumber = (value?: string): number | null => {
  if (value === undefined || value === null || value.trim() === '') return null;
  const num = parseFloat(value.replace(/[^\d.-]/g, ''));
  return isNaN(num) ? null : num;
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  try {
    // If the string contains a comma or space, extract only the date part before it
    const justDate = dateStr.split(/[ ,]/)[0];
    // Handle YYYYMMDD (e.g., 20230115)
    if (/^\d{8}$/.test(justDate)) {
      const date = new Date(justDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
      if (isNaN(date.getTime())) return justDate;
      return date.toISOString().split('T')[0];
    }
    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(justDate)) {
      return justDate;
    }
    // Try parsing as date
    const date = new Date(justDate);
    if (isNaN(date.getTime())) return justDate;
    return date.toISOString().split('T')[0];
  } catch (e) {
    return dateStr; // Return original on error
  }
};

// Define Mappings (these will be very basic initially and need significant expansion/refinement)
// For now, we'll assume a simple direct mapping or slight variations for key fields.

const mapToAssetCategory = (value?: string): AssetCategory => {
  if (!value) return 'Unknown';
  const lowerVal = value.toLowerCase();
  if (lowerVal.includes('stk') || lowerVal.includes('stock')) return 'STK';
  if (lowerVal.includes('opt') || lowerVal.includes('option')) return 'OPT';
  // Add more mappings
  return 'Unknown';
};

const mapToOpenClose = (value?: string): OpenCloseIndicator => {
  if (!value) return 'N/A';
  const lowerVal = value.toLowerCase();
  if (lowerVal.startsWith('o')) return 'O';
  if (lowerVal.startsWith('c')) return 'C';
  return 'N/A';
}

const mapToPutCall = (value?: string) : PutCall => {
    if (!value) return 'N/A';
    const lowerVal = value.toLowerCase();
    if (lowerVal === 'p' || lowerVal === 'put') return 'P';
    if (lowerVal === 'c' || lowerVal === 'call') return 'C';
    return 'N/A';
}

export const mapRowToNormalizedTradeData = (
  row: Record<string, string>,
  originalHeaders: string[],
  broker: BrokerType
): NormalizedTradeData | null => {
  const get = (possibleNames: string[], exactMatch: boolean = false) => getValue(row, originalHeaders, possibleNames, exactMatch);

  let data: Partial<NormalizedTradeData> = {};

  if (broker === BrokerType.IBKR) {
    data.tradeDate = formatDate(get(['TradeDate', 'Trade Date', 'Date/Time']));
    data.symbol = get(['Symbol']);
    data.assetCategory = mapToAssetCategory(get(['Asset Category']));
    const quantityVal = parseSafeNumber(get(['Quantity']));
    data.quantity = quantityVal !== null ? quantityVal : 0;
    data.tradePrice = parseSafeNumber(get(['TradePrice', 'Trade Price', 'T. Price', 'Price', 'Price Executed'])) ?? undefined;
    data.commission = parseSafeNumber(get(['IBCommission', 'Commission', 'Comm/Fee'])) ?? undefined;
    data.fees = parseSafeNumber(get(['Fees'])) ?? undefined;
    data.currency = get(['Currency']) || 'USD';
    // Determine open/close indicator for IBKR
    let codeField = get(['Code']) ?? row['Code'];
    let realizedPLField = get(['Realized P/L']) ?? row['Realized P/L'];
    let openClose: OpenCloseIndicator = 'O';
    if (codeField && codeField.trim().toUpperCase() === 'C') {
      openClose = 'C';
    } else if (realizedPLField && parseFloat(realizedPLField) !== 0) {
      openClose = 'C';
    }
    data.openCloseIndicator = openClose;
    console.debug('[MAP] IBKR openCloseIndicator:', { symbol: data.symbol, codeField, realizedPLField, openClose });
    data.costBasis = parseSafeNumber(get(['CostBasis', 'Basis'])) ?? undefined;
    data.proceeds = parseSafeNumber(get(['Proceeds'])) ?? undefined;
    // Robust netAmount calculation for options
    const expiryRaw = get(['Expiry', 'Expiration', 'Expiration Date']) ?? row['Expiry'];
    const strikeRaw = get(['Strike', 'Strike Price']) ?? row['Strike'];
    if (data.assetCategory === 'OPT') {
      data.multiplier = parseSafeNumber(get(['Multiplier'])) ?? 100;
      data.netAmount = (data.tradePrice ?? 0) * (data.quantity ?? 0) * (data.multiplier ?? 100) - (data.commission ?? 0);
      // --- Debug logging for expiry/strike mapping ---
      console.debug('[MAP] Option row:', { symbol: data.symbol, expiryRaw, strikeRaw, row });
      data.expiryDate = formatDate(expiryRaw);
      data.strikePrice = parseSafeNumber(strikeRaw) ?? undefined;
      if (!expiryRaw || !strikeRaw) {
        console.warn('[MAP][WARN] Option row missing expiry or strike:', { symbol: data.symbol, expiryRaw, strikeRaw, row, originalHeaders });
      }
    } else {
      data.netAmount = parseSafeNumber(get(['NetCash', 'TradeMoney'])) ?? undefined;
      data.expiryDate = undefined;
      data.strikePrice = undefined;
    }
    data.orderID = get(['IBOrderID', 'Order ID']);
    data.executionID = get(['IBExecID', 'Exec ID']);
    data.putCall = mapToPutCall(get(['Put/Call', 'Right']));
    data.description = get(['Description']);
    data.action = get(['Action', 'Buy/Sell']);
    // Add support for rawRealizedPL if present
    const rawRealizedPL = parseSafeNumber(get(['Realized P/L']));
    if (rawRealizedPL !== null) data.rawRealizedPL = rawRealizedPL;
    // Ignore MTM P/L and closePrice for now (not in NormalizedTradeData)

  } else if (broker === BrokerType.Schwab) {
    // Schwab often has different report types (Trades, Gains/Losses)
    // This mapping is a generic attempt and will need refinement based on specific Schwab CSV structures
    data.tradeDate = formatDate(get(['Date', 'Trade Date'])); // 'Date' is common, but context needed
    data.symbol = get(['Symbol']);
    data.description = get(['Description']);
    const quantityVal = parseSafeNumber(get(['Quantity']));
    data.tradePrice = parseSafeNumber(get(['Price'])) ?? 0;
    data.commission = parseSafeNumber(get(['Commissions & Fees', 'Fees & Commissions', 'Commission']));
    // Schwab might combine commissions and fees. Or have them separate.
    // data.fees = ... if a separate fees column exists
    data.currency = 'USD'; // Assume USD for Schwab unless specified
    data.netAmount = parseSafeNumber(get(['Amount', 'Net Amount'])) ?? 0;
    
    const action = get(['Action']);
    data.action = action;
    if (action) {
        const lowerAction = action.toLowerCase();
        if (lowerAction.includes('buy')) {
            data.quantity = quantityVal !== null ? Math.abs(quantityVal) : 0;
            data.cost = data.netAmount !== null ? Math.abs(data.netAmount) : null; // Or price * quantity
        } else if (lowerAction.includes('sell')) {
            data.quantity = quantityVal !== null ? -Math.abs(quantityVal) : 0;
            data.proceeds = data.netAmount !== null ? Math.abs(data.netAmount) : null;
        } else {
            data.quantity = quantityVal !== null ? quantityVal : 0; // E.g. for dividends, interest etc.
        }
        if(lowerAction.includes('open')) data.openCloseIndicator = 'O';
        if(lowerAction.includes('close')) data.openCloseIndicator = 'C';
    }

    // Option specific fields for Schwab (often requires careful parsing of 'Description')
    if (data.description && (data.description.includes('CALL') || data.description.includes('PUT'))) {
        data.assetCategory = 'OPT';
        // Regex or string splitting might be needed to extract expiry, strike, P/C from description
        // Example: 'SPY   JUN 23 2023 450.0 C'
        const optionMatch = data.description.match(/([A-Z]+)\s*([A-Z]{3})\s*(\d{1,2})\s*(\d{4})\s*([\d.]+)\s*([CP])/i);
        if (optionMatch) {
            // data.symbol = optionMatch[1]; // Underlying, if different from main symbol field
            const month = optionMatch[2];
            const day = optionMatch[3];
            const year = optionMatch[4];
            data.expiryDate = formatDate(`${year}-${month}-${day}`); // Needs month name to number conversion
            data.strikePrice = parseFloat(optionMatch[5]);
            data.putCall = optionMatch[6].toUpperCase() === 'C' ? 'C' : 'P';
        }
        data.multiplier = 100;
    } else {
        data.assetCategory = 'STK'; // Default to STK if not clearly an option
    }

  } else {
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
    broker,
    tradeDate: data.tradeDate,
    symbol: data.symbol,
    assetCategory: data.assetCategory || 'Unknown',
    quantity: data.quantity,
    tradePrice: data.tradePrice,
    currency: data.currency || 'USD',
    netAmount: data.netAmount,
    // Optional fields with defaults or null
    accountId: get(['Account', 'Account ID']) || undefined,
    settleDate: (() => {
      const rawSettle = get(['SettleDate', 'Settlement Date']);
      if (!rawSettle) return undefined;
      const formatted = formatDate(rawSettle);
      return formatted === 'N/A' ? undefined : formatted;
    })(),
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
    rawCsvRow: row
}; 
}