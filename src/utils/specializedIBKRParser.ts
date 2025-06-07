/**
 * A specialized parser for IBKR CSV files that specifically targets
 * the "Trades,Data,Order" pattern we've seen in your IBKR file.
 */

// Define types for the parser
interface IBKRTrade {
  assetCategory: string;
  currency: string;
  account: string;
  symbol: string;
  dateTime: string;
  quantity: number;
  price: number;
  rawLine: string;
}

interface IBKRParserResult {
  trades: IBKRTrade[];
  logs: string[];
  accountId: string;
}

export function parseIBKRTrades(csvContent: string): IBKRParserResult {
  console.log("Starting specialized IBKR trade parsing");
  const results: IBKRParserResult = {
    trades: [],
    logs: [],
    accountId: ""
  };

  // Helper function to log and record messages
  const log = (message: string): void => {
    console.log(message);
    results.logs.push(message);
  };

  try {
    // Split into lines
    const lines = csvContent.split('\n');
    log(`File contains ${lines.length} lines`);

    // Find account ID
    const accountMatch = csvContent.match(/U\d{7}/);
    if (accountMatch) {
      results.accountId = accountMatch[0];
      log(`Found account ID: ${results.accountId}`);
    }

    // Look specifically for "Trades,Data,Order" pattern
    let tradeCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('Trades,Data,Order')) {
        tradeCount++;
        log(`Found trade line ${tradeCount}: ${line}`);
        
        // Parse this line to extract trade details
        const parts = parseCSVLine(line);
        
        if (parts.length >= 7) {
          // Typical format: Trades,Data,Order,AssetCategory,Currency,Account,Symbol,DateTime,Quantity,Price,...
          const trade: IBKRTrade = {
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
          log(`Parsed trade ${tradeCount}: ${trade.symbol}, ${trade.dateTime}, ${trade.quantity} @ ${trade.price}`);
        }
      }
    }

    log(`Parsed ${results.trades.length} trades total`);
    return results;
  } catch (error) {
    log(`Error parsing IBKR trades: ${error}`);
    return results;
  }
}

/**
 * Parse a CSV line, handling quoted fields correctly
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}

// Helper function to convert month name to number
export function getMonthNumber(monthStr: string): number {
  const months: Record<string, number> = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
  };
  return months[monthStr.toUpperCase()] || 0;
} 