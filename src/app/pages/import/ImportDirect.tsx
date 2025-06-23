import React, { useState } from 'react';
import { IBKRActivityStatementParser } from '../../../features/broker-integration/services/brokers/parsers/IBKRActivityStatementParser';
import { OptionTrade, OptionStrategy } from '../../../types/options';

export const ImportDirect: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Add a log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
    console.log(message);
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      addLog(`File selected: ${files[0].name} (${files[0].size} bytes)`);
    }
  };
  
  // Read and parse the file
  const handleParseFile = async () => {
    if (!file) {
      addLog('No file selected');
      return;
    }
    
    setIsProcessing(true);
    setTrades([]);
    
    try {
      addLog(`Reading file: ${file.name}`);
      const content = await readFileContent(file);
      addLog(`File read successfully (${content.length} bytes)`);
      
      // Parse the file using the specialized parser
      addLog('Starting specialized parsing...');
      const parser = new IBKRActivityStatementParser(content);
      const result = await parser.parseToDatabase();
      
      addLog(`Parsing complete. Found ${result.trades.length} trades`);
      setTrades(result.trades);
      
      // If we have trades, try to save them to localStorage
      if (result.trades.length > 0 && result.accountId) {
        addLog(`Saving ${result.trades.length} trades to localStorage for account ${result.accountId}`);
        
        // Create a basic options portfolio structure
        const accountId = `ibkr-${result.accountId.replace(/\D/g, '')}`;
        const portfolio = {
          accountId,
          trades: result.trades.map(trade => convertToOptionTrade(trade, accountId))
        };
        
        // Save to localStorage
        try {
          // Get existing portfolios or create new object
          const existingPortfolios = JSON.parse(localStorage.getItem('options_portfolios') || '{}');
          
          // Add our portfolio
          existingPortfolios[accountId] = portfolio;
          
          // Save back to localStorage
          localStorage.setItem('options_portfolios', JSON.stringify(existingPortfolios));
          
          addLog(`Successfully saved trades to options_portfolios for account ${accountId}`);
          addLog('Refresh the page to see the updated trades in the dashboard');
        } catch (error) {
          addLog(`Error saving to localStorage: ${error}`);
        }
      }
    } catch (error) {
      addLog(`Error processing file: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file content'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  };
  
  // Reset everything
  const handleReset = () => {
    setFile(null);
    setLogs([]);
    setTrades([]);
  };
  
  // Clear localStorage
  const handleClearStorage = () => {
    try {
      localStorage.clear();
      addLog('LocalStorage cleared successfully');
    } catch (error) {
      addLog(`Error clearing localStorage: ${error}`);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Direct IBKR Parser</h2>
      
      <div className="mb-4">
        <label className="block mb-2">Select IBKR CSV File</label>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange}
          className="border p-2 w-full"
        />
      </div>
      
      <div className="flex space-x-2 mb-6">
        <button
          onClick={handleParseFile}
          disabled={!file || isProcessing}
          className={`px-4 py-2 rounded ${
            !file || isProcessing 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Parse File'}
        </button>
        
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Reset
        </button>
        
        <button
          onClick={handleClearStorage}
          className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
        >
          Clear Storage
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-medium mb-2">Processing Logs</h3>
          <div className="bg-gray-100 p-3 rounded h-64 overflow-y-auto">
            {logs.length > 0 ? (
              <pre className="text-xs whitespace-pre-wrap">{logs.join('\n')}</pre>
            ) : (
              <p className="text-gray-500 text-sm">Logs will appear here...</p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Detected Trades ({trades.length})</h3>
          <div className="bg-gray-100 p-3 rounded h-64 overflow-y-auto">
            {trades.length > 0 ? (
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(trades, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500 text-sm">Detected trades will appear here...</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Select your IBKR CSV file</li>
          <li>Click "Parse File" to process the file</li>
          <li>View the results in the logs and trades sections</li>
          <li>If trades are found, they will be saved to localStorage</li>
          <li>Refresh the page to see the trades in the dashboard</li>
        </ol>
      </div>
    </div>
  );
};

// Helper function to convert raw trade data to OptionTrade type
function convertToOptionTrade(trade: any, accountId: string): OptionTrade {
  return {
    id: `${accountId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    symbol: trade.symbol || '',
    putCall: trade.putCall || 'CALL',
    strike: trade.strike || 0,
    expiry: new Date(trade.expiry || Date.now()),
    quantity: trade.quantity || 0,
    premium: trade.premium || 0,
    openDate: new Date(trade.dateOpened || Date.now()),
    closeDate: trade.dateClosed ? new Date(trade.dateClosed) : undefined,
    closePremium: trade.closePrice || undefined,
    strategy: trade.strategy as OptionStrategy || OptionStrategy.OTHER,
    commission: trade.fees || 0,
    notes: trade.notes || '',
    status: trade.status || 'closed',
    tradePL: trade.pl || 0
  };
} 