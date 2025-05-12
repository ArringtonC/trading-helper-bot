/**
 * Utility to test extraction of account balance from IBKR statements
 */
export function testExtractAccountBalance(content: string): { 
  balance: number | null; 
  source: string;
  logs: string[];
} {
  const logs: string[] = [];
  logs.push(`Testing account balance extraction from content (${content.length} bytes)`);
  
  // Split into lines
  const lines = content.split('\n');
  logs.push(`Content has ${lines.length} lines`);
  
  let balance: number | null = null;
  let source = 'Not found';
  
  // Function to parse CSV line
  const parseCSVLine = (line: string): string[] => {
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
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
  };

  // Try to find balance in Cash Report section
  const cashHeaderIndex = lines.findIndex(line => line.includes('Cash Report') && line.includes('Header'));
  if (cashHeaderIndex !== -1) {
    logs.push(`Found Cash Report section at line ${cashHeaderIndex + 1}`);
    
    // Check the next 30 lines for balance information
    for (let i = cashHeaderIndex + 1; i < Math.min(cashHeaderIndex + 30, lines.length); i++) {
      const line = lines[i];
      logs.push(`Checking line ${i+1}: ${line}`);
      
      if (line.includes('Ending Cash') || line.includes('Total')) {
        logs.push(`Found potential balance line: ${line}`);
        const parts = parseCSVLine(line);
        logs.push(`Parsed ${parts.length} parts: ${parts.join(' | ')}`);
        
        // Look for numeric values in the parts
        for (let j = 0; j < parts.length; j++) {
          const part = parts[j].trim();
          const num = parseFloat(part);
          if (!isNaN(num)) {
            logs.push(`Found numeric value at position ${j}: ${num}`);
            if (balance === null || Math.abs(num) > Math.abs(balance)) {
              balance = num;
              source = `Cash Report, line ${i+1}, position ${j}`;
              logs.push(`Updated balance to ${balance} from ${source}`);
            }
          }
        }
      }
    }
  } else {
    logs.push('No Cash Report section found');
  }
  
  // If still no balance, try Net Asset Value section
  if (balance === null) {
    const navHeaderIndex = lines.findIndex(line => line.includes('Net Asset Value') && line.includes('Header'));
    if (navHeaderIndex !== -1) {
      logs.push(`Found Net Asset Value section at line ${navHeaderIndex + 1}`);
      
      // Check the next 20 lines
      for (let i = navHeaderIndex + 1; i < Math.min(navHeaderIndex + 20, lines.length); i++) {
        const line = lines[i];
        logs.push(`Checking line ${i+1}: ${line}`);
        
        if (line.includes('Total') || line.includes('Net Asset Value')) {
          logs.push(`Found potential balance line: ${line}`);
          const parts = parseCSVLine(line);
          logs.push(`Parsed ${parts.length} parts: ${parts.join(' | ')}`);
          
          // Look for numeric values
          for (let j = 0; j < parts.length; j++) {
            const part = parts[j].trim();
            const num = parseFloat(part);
            if (!isNaN(num) && num !== 0) {
              logs.push(`Found numeric value at position ${j}: ${num}`);
              if (balance === null || Math.abs(num) > Math.abs(balance)) {
                balance = num;
                source = `NAV section, line ${i+1}, position ${j}`;
                logs.push(`Updated balance to ${balance} from ${source}`);
              }
            }
          }
        }
      }
    } else {
      logs.push('No Net Asset Value section found');
    }
  }
  
  // As a last resort, look for any section with "Balance" in its title
  if (balance === null) {
    // Find any lines that might contain balance information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('balance') || line.includes('total') || line.includes('equity')) {
        logs.push(`Found line ${i+1} with balance/total/equity keyword: ${lines[i]}`);
        const parts = parseCSVLine(lines[i]);
        
        // Look for numeric values
        for (let j = 0; j < parts.length; j++) {
          const part = parts[j].trim();
          const num = parseFloat(part);
          if (!isNaN(num) && num !== 0) {
            logs.push(`Found numeric value at position ${j}: ${num}`);
            if (balance === null || Math.abs(num) > Math.abs(balance)) {
              balance = num;
              source = `Keyword search, line ${i+1}, position ${j}`;
              logs.push(`Updated balance to ${balance} from ${source}`);
            }
          }
        }
      }
    }
  }
  
  logs.push(`Final balance extraction result: ${balance !== null ? balance : 'Not found'} (${source})`);
  return { balance, source, logs };
} 