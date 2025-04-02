import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IBKRService } from '../services/IBKRService';
import { AccountService } from '../services/AccountService';
import { OptionService } from '../services/OptionService';
import { IBKRActivityStatementParser } from '../services/IBKRActivityStatementParser';

/**
 * Integrated Import page component with service connections
 */
const Import: React.FC = () => {
  const [importType, setImportType] = useState<'ibkr' | 'manual' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    accountName: string;
    accountId: string;
    totalPositions: number;
    optionsPositions: number;
    stockPositions: number;
    balance: number;
    completed: boolean;
  } | null>(null);
  
  const navigate = useNavigate();
  
  // Read file content as text
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          resolve(event.target.result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  };
  
  // Handle IBKR import
  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Read file content
      const content = await readFileContent(file);
      
      // Create a parser instance
      const parser = new IBKRActivityStatementParser(content);
      
      // Parse the content
      const parseResult = parser.parse();
      
      // Convert IBKRAccountInfo to IBKRAccount
      const ibkrAccount = {
        id: parseResult.accountInfo.accountId,
        name: parseResult.accountInfo.accountName,
        type: parseResult.accountInfo.accountType === 'MARGIN' ? 'MARGIN' as const : 'CASH' as const,
        currency: parseResult.accountInfo.baseCurrency,
        balance: parseResult.accountInfo.balance,
        cash: parseResult.accountInfo.balance,
        marketValue: 0,
        positions: parseResult.positions.map(p => ({
          symbol: p.symbol,
          quantity: p.quantity,
          marketPrice: p.closePrice,
          marketValue: p.value,
          averageCost: p.costPrice,
          unrealizedPL: p.unrealizedPL,
          realizedPL: 0,
          assetType: p.assetCategory.includes('Options') ? 'OPTION' as const : 'STOCK' as const,
          currency: p.currency,
          accountId: parseResult.accountInfo.accountId,
          lastUpdated: new Date()
        })),
        lastUpdated: new Date()
      };
      
      // Convert to account
      const account = IBKRService.convertToAccount(ibkrAccount);
      
      // Save account to storage
      AccountService.addAccount(account);
      
      // Extract option trades
      const optionTrades = parseResult.optionTrades;
      
      // Save option trades to storage
      optionTrades.forEach(trade => {
        OptionService.addTrade(account.id, trade);
      });
      
      // Set import summary
      setImportSummary({
        accountName: account.name,
        accountId: account.id,
        totalPositions: parseResult.positions.length,
        optionsPositions: optionTrades.length,
        stockPositions: parseResult.positions.length - optionTrades.length,
        balance: account.balance,
        completed: true
      });
    } catch (err: any) {
      setError(`Import failed: ${err.message}`);
      setImportSummary(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigation after successful import
  const handleGoToAccount = () => {
    if (importSummary && importSummary.accountId) {
      navigate(`/?accountId=${importSummary.accountId}`);
    } else {
      navigate('/');
    }
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Import Account Data</h1>
      
      {!importType ? (
        <div className="space-y-6">
          <p className="text-gray-600">
            Choose an import method to add account data to the Trading Helper Bot.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* IBKR Import Option */}
            <div
              onClick={() => setImportType('ibkr')}
              className="bg-white p-6 rounded-lg shadow border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                </div>
                <h2 className="text-lg font-medium">Import from IBKR</h2>
              </div>
              <p className="text-gray-600 text-sm">
                Import account data and positions from Interactive Brokers activity statements or portfolio reports.
              </p>
              <div className="mt-4">
                <span className="text-blue-600 text-sm font-medium">Select This Option →</span>
              </div>
            </div>
            
            {/* Manual Entry Option */}
            <div
              onClick={() => setImportType('manual')}
              className="bg-white p-6 rounded-lg shadow border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    ></path>
                  </svg>
                </div>
                <h2 className="text-lg font-medium">Manual Entry</h2>
              </div>
              <p className="text-gray-600 text-sm">
                Manually create a new account and enter your positions and balances.
              </p>
              <div className="mt-4">
                <span className="text-blue-600 text-sm font-medium">Select This Option →</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Import Notes</h3>
            <ul className="text-xs text-gray-600 space-y-1 list-disc pl-5">
              <li>Imported accounts will be added to your existing accounts.</li>
              <li>For IBKR imports, positions will be mapped to the appropriate asset types.</li>
              <li>Options positions will be added to your options portfolio.</li>
              <li>Your data is stored locally and never sent to external servers.</li>
            </ul>
          </div>
        </div>
      ) : importType === 'ibkr' ? (
        !importSummary ? (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Import IBKR Account</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select IBKR Statement File (CSV or Excel)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col rounded-lg border-2 border-dashed border-gray-300 w-full h-40 p-10 group text-center cursor-pointer">
                    <div className="h-full w-full text-center flex flex-col items-center justify-center">
                      {file ? (
                        <>
                          <p className="text-gray-700 font-semibold">
                            {file.name}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {(file.size / 1024).toFixed(0)} KB
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                            }}
                            className="mt-2 text-xs text-red-600 hover:text-red-800"
                          >
                            Remove file
                          </button>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-10 h-10 text-gray-400 group-hover:text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            ></path>
                          </svg>
                          <p className="text-gray-500 text-sm mt-2">
                            Drag and drop file here, or click to select
                          </p>
                          <p className="text-gray-400 text-xs">
                            Supported formats: CSV, Excel
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setFile(e.target.files[0]);
                          setError(null);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                  {error}
                </div>
              )}
              
              {isLoading && (
                <div className="flex items-center justify-center p-4">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-3 text-gray-700">Processing import...</span>
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Import Information</h3>
                <ul className="text-xs text-gray-600 space-y-1 list-disc pl-5">
                  <li>This will import your IBKR account positions and balances</li>
                  <li>Options positions will be added to your options portfolio</li>
                  <li>Stock positions will be tracked in your account</li>
                  <li>Your existing accounts will not be modified</li>
                  <li>For best results, use an Activity Statement or Portfolio Analyst export</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setImportType(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!file || isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Importing...' : 'Import Account'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Import Successful</h2>
            
            <div className="space-y-6">
              <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span className="font-medium">Import Successful!</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Import Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Account Name:</span>
                    <span className="font-medium">{importSummary.accountName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Account ID:</span>
                    <span className="font-medium">{importSummary.accountId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Positions:</span>
                    <span className="font-medium">{importSummary.totalPositions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Options Positions:</span>
                    <span className="font-medium">{importSummary.optionsPositions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock Positions:</span>
                    <span className="font-medium">{importSummary.stockPositions}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-600 font-medium">Account Balance:</span>
                    <span className="font-medium">${importSummary.balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setImportSummary(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Import Another File
                </button>
                <button
                  type="button"
                  onClick={handleGoToAccount}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  View Account
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Manual Account Entry</h2>
          <p className="text-gray-600 mb-4">
            This feature will be available in a future update. Please use the IBKR import option or create an account in the Settings page.
          </p>
          <button
            onClick={() => setImportType(null)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
};

export default Import; 