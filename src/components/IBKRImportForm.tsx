import React, { useState } from 'react';
import { IBKRService } from '../services/IBKRService';
import { AccountService } from '../services/AccountService';
import { OptionService } from '../services/OptionService';

interface IBKRImportFormProps {
  onImportComplete?: () => void;
  onCancel?: () => void;
}

/**
 * Form component for importing IBKR account data
 */
const IBKRImportForm: React.FC<IBKRImportFormProps> = ({ onImportComplete, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    accountName: string;
    totalPositions: number;
    optionsPositions: number;
    stockPositions: number;
    completed: boolean;
  } | null>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };
  
  // Read file contents
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Error reading file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  };
  
  // Process the import
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
      
      // Parse account data
      const ibkrAccount = IBKRService.parseActivityStatement(content);
      
      // Convert to internal account model
      const account = IBKRService.convertToAccount(ibkrAccount);
      
      // Save account to storage
      AccountService.addAccount(account);
      
      // Extract option trades
      const optionTrades = IBKRService.convertToOptionTrades(ibkrAccount);
      
      // Save option trades
      optionTrades.forEach(trade => {
        OptionService.addTrade(account.id, trade);
      });
      
      // Set import summary
      setImportSummary({
        accountName: account.name,
        totalPositions: ibkrAccount.positions.length,
        optionsPositions: optionTrades.length,
        stockPositions: ibkrAccount.positions.length - optionTrades.length,
        completed: true
      });
      
      // Notify parent component
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err: any) {
      setError(`Import failed: ${err.message}`);
      setImportSummary(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Import IBKR Account</h2>
      
      {!importSummary ? (
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
                        onClick={() => setFile(null)}
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
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              {error}
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
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
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
      ) : (
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
              onClick={() => {
                if (onImportComplete) {
                  onImportComplete();
                }
              }}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              View Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IBKRImportForm; 