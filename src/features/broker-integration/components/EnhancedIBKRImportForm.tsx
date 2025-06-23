import React, { useState } from 'react';
import { IBKRService } from '../../../shared/services/IBKRService';
import { AccountService } from '../../../shared/services/AccountService';
import { OptionService } from '../../../shared/services/OptionService';
import { Account } from '../../../types/account';
import { OptionTrade } from '../../../types/options';
import { IBKRImportResult } from '../../../types/ibkr';
import { IBKRActivityStatementParser } from '../services/brokers/parsers/IBKRActivityStatementParser';
import { IBKRTradeRecord } from '../../../types/ibkr';
import Upload from 'antd/es/upload';
import Button from 'antd/es/button';
import { message } from 'antd';
import Card from 'antd/es/card';
import Typography from 'antd/es/typography';
import Space from 'antd/es/space';
import Divider from 'antd/es/divider';
import Alert from 'antd/es/alert';
import Spin from 'antd/es/spin';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { saveLogsToFile } from '../../../shared/utils/logUtils';
import ibkrIntegrationService from '../../../shared/services/IBKRIntegrationService';

// Interface for batch summary
interface BatchSummary {
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  accounts: string[];
  totalTrades: number;
  newTrades: number;
  updatedTrades: number;
  positions: number;
}

// Notification interface
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

// Props interface for the component
interface EnhancedIBKRImportFormProps {
  onImportComplete?: () => void;
  onCancel?: () => void;
  onLogMessage?: (message: string) => void;
}

// Define missing types
type ImportStatus = 'idle' | 'processing' | 'success' | 'error';
type ImportResult = IBKRImportResult;

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface ImportSummary {
  accountName: string;
  totalPositions: number;
  optionsPositions: number;
  stockPositions: number;
  completed: boolean;
}

interface File {
  id: string;
  name: string;
  content: string;
  status: {
    status: 'pending' | 'processing' | 'success' | 'error';
    message: string;
    content?: string;
  };
}

// Function to analyze IBKR content
function analyzeIBKRContent(content: string): { logs: string[], sections: Record<string, number> } {
  const logs: string[] = [];
  const sections: Record<string, number> = {};
  
  // Add a log function that can be used throughout the analysis
  const log = (message: string) => {
    logs.push(`[${new Date().toISOString()}] ${message}`);
  };
  
  logs.push(`File content length: ${content.length} bytes`);
  
  // Check if this is even a CSV file
  if (!content.includes(',')) {
    logs.push('WARNING: Content does not appear to be CSV format (no commas found)');
  }
  
  // Split into lines for analysis
  const lines = content.split('\n');
  logs.push(`File contains ${lines.length} lines`);
  
  // Log the first few lines to see the file structure
  logs.push('File starts with:');
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    logs.push(`Line ${i+1}: ${lines[i]}`);
  }
  
  // Look for common IBKR sections and their variants
  const sectionPatterns = [
    { name: 'Statement', patterns: ['Statement,Header', 'Statement,Data', 'Statement, Header'] },
    { name: 'Account', patterns: ['Account Information,Header', 'Account Information,Data', 'Account Information'] },
    { name: 'Trades', patterns: ['Trades,Header', 'Trades,Data', 'Trade', 'Trade List', 'TradeConfirm'] },
    { name: 'Positions', patterns: ['Positions,Header', 'Open Positions,Header', 'Position'] },
    { name: 'Cash Report', patterns: ['Cash Report,Header', 'Cash Report'] }
  ];
  
  // Check for each section pattern
  sectionPatterns.forEach(section => {
    section.patterns.forEach(pattern => {
      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(pattern)) {
          count++;
          if (count === 1) {
            logs.push(`Found "${pattern}" at line ${i+1}: ${lines[i]}`);
            
            // Log next few lines for context
            logs.push('Next lines:');
            for (let j = 1; j <= 3; j++) {
              if (i+j < lines.length) {
                logs.push(`  Line ${i+j+1}: ${lines[i+j]}`);
              }
            }
          }
        }
      }
      if (count > 0) {
        sections[`${section.name}:${pattern}`] = count;
        logs.push(`Total occurrences of "${pattern}": ${count}`);
      }
    });
  });
  
  // Check for critical data patterns
  const dataPatterns = [
    { name: 'Orders', pattern: /Order/i },
    { name: 'Trades', pattern: /Trade/i },
    { name: 'OptionSymbol', pattern: /\d+([CP])\d+/ },
    { name: 'DataDiscriminator', pattern: /DataDiscriminator/i },
    { name: 'AccountID', pattern: /U\d{7}/ }
  ];
  
  dataPatterns.forEach(pattern => {
    const matches = content.match(new RegExp(pattern.pattern, 'g'));
    const count = matches ? matches.length : 0;
    logs.push(`Found ${count} occurrences of ${pattern.name} pattern`);
    
    if (count > 0 && pattern.name === 'OptionSymbol') {
      logs.push(`Example option symbols: ${matches!.slice(0, 3).join(', ')}`);
    }
  });
  
  // Try to find the "Trades" section specifically and analyze its structure
  const tradesHeaderIndex = lines.findIndex(line => line.includes('Trades,Header'));
  if (tradesHeaderIndex !== -1) {
    logs.push(`Analyzing Trades section starting at line ${tradesHeaderIndex+1}`);
    
    // Look for the column headers (typically the line after Trades,Header)
    if (tradesHeaderIndex + 1 < lines.length) {
      const columnsLine = lines[tradesHeaderIndex + 1];
      logs.push(`Trades columns: ${columnsLine}`);
      
      // Look for essential columns
      const columns = columnsLine.split(',').map(col => col.trim().toLowerCase());
      const essentialColumns = ['symbol', 'date', 'quantity', 'price', 'discriminator'];
      
      essentialColumns.forEach(col => {
        const found = columns.some(c => c.includes(col));
        logs.push(`Essential column '${col}' ${found ? 'found' : 'NOT FOUND'}`);
      });
      
      // Check for the first data row
      if (tradesHeaderIndex + 2 < lines.length) {
        logs.push(`First data row: ${lines[tradesHeaderIndex + 2]}`);
      }
    }
  } else {
    logs.push('WARNING: No specific "Trades,Header" section found');
    
    // Try to find anything trade-related
    const tradeRelatedIndex = lines.findIndex(line => 
      line.toLowerCase().includes('trade') || 
      line.toLowerCase().includes('order') ||
      line.toLowerCase().includes('fill')
    );
    
    if (tradeRelatedIndex !== -1) {
      logs.push(`Found potential trade-related line at ${tradeRelatedIndex+1}: ${lines[tradeRelatedIndex]}`);
      
      // Look at surrounding lines
      for (let i = Math.max(0, tradeRelatedIndex - 2); i <= Math.min(lines.length - 1, tradeRelatedIndex + 2); i++) {
        if (i !== tradeRelatedIndex) {
          logs.push(`  Line ${i+1}: ${lines[i]}`);
        }
      }
    }
  }
  
  return { logs, sections };
}

/**
 * Enhanced form component for importing IBKR account data with analysis capabilities
 */
const EnhancedIBKRImportForm: React.FC<EnhancedIBKRImportFormProps> = ({ onImportComplete, onCancel, onLogMessage }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [showRawContent, setShowRawContent] = useState(false);
  
  // Add a log function that can be used throughout the component
  const log = (message: string) => {
    console.log(`[EnhancedIBKRImportForm] ${message}`);
    if (onLogMessage) {
      onLogMessage(message);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = [];
      
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            const content = event.target.result as string;
            const newFile: File = {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
              name: file.name,
              content,
              status: { status: 'pending', message: 'File loaded, ready for import' }
            };
            
            setFiles(prev => [...prev, newFile]);
            log(`File selected: ${file.name} (${file.size} bytes)`);
          }
        };
        
        reader.readAsText(file);
      });
      
      setError(null);
    }
  };
  
  // Analyze file content
  const handleAnalyzeFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.content) {
      const { logs } = analyzeIBKRContent(file.content);
      setDebugLogs(logs);
      setShowDebugLogs(true);
      log(`Analyzing file: ${file.name}`);
    }
  };
  
  // View raw file content
  const viewRawFileContent = (fileStatus: File['status']) => {
    if (fileStatus.content) {
      setSelectedFileContent(fileStatus.content);
      setShowRawContent(true);
    }
  };
  
  // Process the import
  const handleImport = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    log(`Starting import for file: ${file.name}`);
    
    // Update file status to processing
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: { ...f.status, status: 'processing', message: 'Importing...' } } 
        : f
    ));
    
    try {
      // Parse account data
      const parsedResult = await IBKRService.parseActivityStatement(file.content);
      
      if (parsedResult.errors && parsedResult.errors.length > 0) {
        throw new Error(`Parsing failed: ${parsedResult.errors.join(', ')}`);
      }
      
      // Convert to internal account model
      if (!parsedResult.account) {
        throw new Error('No account information found in the imported file');
      }
      
      const account = IBKRService.convertToAccount(parsedResult.account);
      
      // Save account to storage
      AccountService.addAccount(account);
      
      // Extract option trades
      const optionTrades = IBKRService.convertToOptionTrades(parsedResult);
      
      // Save option trades
      optionTrades.forEach(trade => {
        OptionService.addTrade(account.id, trade);
      });
      
      // Set import summary
      const positionsLength = Array.isArray(parsedResult.positions) ? parsedResult.positions.length : 0;
      setImportSummary({
        accountName: account.name,
        totalPositions: positionsLength,
        optionsPositions: optionTrades.length,
        stockPositions: positionsLength - optionTrades.length,
        completed: true
      });
      
      // Notify parent component
      if (onImportComplete) {
        onImportComplete();
      }
      
      log(`Import successful for file: ${file.name}`);
    } catch (error: any) {
      setError(error.message);
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: { status: 'error', message: error.message } } 
          : f
      ));
      log(`Import failed for file: ${file.name} - ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove a file
  const handleRemoveFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      log(`Removing file: ${file.name}`);
    }
    
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Import IBKR Account</h2>
      
      {!importSummary ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select IBKR Statement Files (CSV or Excel)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col rounded-lg border-2 border-dashed border-gray-300 w-full h-40 p-10 group text-center cursor-pointer">
                <div className="h-full w-full text-center flex flex-col items-center justify-center">
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
                    Drag and drop files here, or click to select
                  </p>
                  <p className="text-gray-400 text-xs">
                    Supported formats: CSV, Excel
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  multiple
                />
              </label>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h3>
              <div className="border rounded-md divide-y">
                {files.map(file => (
                  <div key={file.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.status.message}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleAnalyzeFile(file.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Analyze
                      </button>
                      {file.status.status === 'success' && (
                        <button
                          type="button"
                          onClick={() => viewRawFileContent(file.status)}
                          className="text-green-600 hover:text-green-800 text-xs"
                        >
                          View
                        </button>
                      )}
                      {file.status.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleImport(file.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          disabled={isLoading}
                        >
                          Import
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
                setFiles([]);
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
      
      {/* Debug Logs Modal */}
      {showDebugLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">File Analysis</h3>
              <button
                type="button"
                onClick={() => setShowDebugLogs(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-grow bg-gray-50 p-4 rounded-md font-mono text-xs">
              {debugLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDebugLogs(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Raw Content Modal */}
      {showRawContent && selectedFileContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Raw File Content</h3>
              <button
                type="button"
                onClick={() => setShowRawContent(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-grow bg-gray-50 p-4 rounded-md font-mono text-xs whitespace-pre">
              {selectedFileContent}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRawContent(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedIBKRImportForm; 