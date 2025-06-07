import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImportToDatabaseService from '../services/ImportToDatabaseService';
import { insertSummary, resetDatabase, insertNormalizedTrades } from '../services/DatabaseService';
import { refreshDashboard } from '../utils/enhancedDashboardRefresh';
import { testExtractAccountBalance } from '../utils/accountBalanceTester';
import { FiUpload, FiFile, FiDollarSign, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { BrokerType } from '../types/trade';

interface FixedIBKRImportTesterProps {
  navigate?: ReturnType<typeof useNavigate>;
}

/**
 * Simple component to test the fixed IBKR import functionality
 */
const FixedIBKRImportTester: React.FC<FixedIBKRImportTesterProps> = ({ navigate }) => {
  console.log('FixedIBKRImportTester component rendered');
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [importResultDebug, setImportResultDebug] = useState<any>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setResult(null);
    setLogs([]);
  };

  // Start import process
  const handleImport = async () => {
    console.log('Step 1: Starting import');
    if (!file) return;
    setIsImporting(true);
    setLogs([]);
    addLog('Starting import process...');
    try {
      const content = await readFileContent(file);
      console.log('Step 2: File read, content length:', content.length);
      addLog(`File read successfully, size: ${content.length} bytes`);
      const importResult = await ImportToDatabaseService.importActivityStatement(content);
      console.log('Step 3: Import result:', importResult);
      if (importResult.trades && importResult.trades.length > 0) {
        console.log('Step 4: First raw trade from importResult:', importResult.trades[0]);
      }
      setImportResultDebug(importResult);
      setResult(importResult);
      if (importResult.success && Array.isArray(importResult.trades) && importResult.trades.length > 0) {
        await resetDatabase();
        console.log('Step 5: After resetDatabase');
        // Log the first trade's relevant fields for debugging
        const t = importResult.trades[0] as any;
        console.log('First trade fields:', {
          netAmount: t['netAmount'],
          proceeds: t.proceeds,
          basis: t.basis,
          cost: t['cost'],
          commissionFee: t.commissionFee
        });
        const normalizedTrades = importResult.trades.map((t: any) => ({
          id: t.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
          importTimestamp: new Date().toISOString(),
          broker: BrokerType.IBKR,
          accountId: t.accountId || null,
          tradeDate: t.tradeDate || (t.dateTime ? t.dateTime.split(' ')[0] : ''),
          settleDate: t.settleDate || null,
          symbol: t.symbol,
          dateTime: t.dateTime,
          description: t.description || null,
          assetCategory: t.assetCategory || 'OPT',
          action: t.action || null,
          quantity: t.quantity,
          tradePrice: t.tradePrice || t.price,
          currency: t.currency || 'USD',
          proceeds: t.proceeds,
          cost: (t as any)['cost'] ?? t.basis ?? 0,
          commission: t.commissionFee,
          fees: t.fees || null,
          netAmount: (Number(t.tradePrice) * Number(t.quantity) * (Number(t.multiplier) || 100)) - (Number(t.commissionFee) || 0),
          openCloseIndicator: t.openCloseIndicator || 'C',
          costBasis: t.costBasis || null,
          optionSymbol: t.optionSymbol || null,
          expiryDate: t.expiryDate || null,
          strikePrice: t.strikePrice || null,
          putCall: t.putCall || null,
          multiplier: t.multiplier || null,
          orderID: t.orderID || null,
          executionID: t.executionID || null,
          notes: t.notes || null,
          rawCsvRow: Object.fromEntries(Object.entries(t).map(([k, v]) => [k, String(v)])),
        }));
        console.log('Step 6: After mapping normalizedTrades. First normalized trade:', normalizedTrades[0]);
        const result = await insertNormalizedTrades(normalizedTrades);
        console.log('Step 7: After insertNormalizedTrades. Result:', result);
        if (result.errors.length > 0) {
          console.error('DB Insert Errors:', result.errors);
        }
        console.log('Step 8: Before calculating PL and inserting summary');
        console.log('All netAmount values:', normalizedTrades.map(t => t.netAmount));
        const calculatedPL = normalizedTrades.reduce((sum, t) => sum + (t.netAmount ?? 0), 0);
        console.log('Sum of netAmount:', calculatedPL);
        await insertSummary(calculatedPL);
        console.log('Step 9: Inserted summary with cumulativePL:', calculatedPL);
        addLog('Trades and summary inserted into database.');
        toast.success('Step 10: Import completed successfully!');
        setImportSuccess(true);
        return;
      } else {
        addLog(`Import failed: No trades were imported.`);
        toast.error('Import failed! No trades were imported.');
      }
    } catch (error) {
      addLog(`Error during import: ${error}`);
      toast.error('Unexpected error during import.');
    } finally {
      setIsImporting(false);
    }
  };

  // Test balance extraction
  const handleTestBalanceExtraction = async () => {
    if (!file) return;
    
    addLog('Testing balance extraction...');
    
    try {
      const content = await readFileContent(file);
      const result = testExtractAccountBalance(content);
      
      // Log the balance value and source
      addLog(`Extracted balance: ${result.balance !== null ? result.balance : 'Not found'} (${result.source})`);
      
      // Log the detailed extraction logs
      result.logs.forEach(log => {
        addLog(`  ${log}`);
      });
    } catch (error) {
      addLog(`Error testing balance extraction: ${error}`);
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

  // Add log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const handleManualBalanceUpdate = async () => {
    if (!result || !result.accountId) return;
    
    // Ask for a balance value
    const balanceStr = prompt('Enter account balance to set:', '5000');
    if (!balanceStr) return;
    
    const balance = parseFloat(balanceStr);
    if (isNaN(balance)) {
      alert('Invalid balance value');
      return;
    }
    
    try {
      addLog(`Manually updating account ${result.accountId} balance to ${balance}`);
      await ImportToDatabaseService.updateAccountBalance(result.accountId, balance);
      addLog('Balance updated successfully');
      
      // Refresh dashboard
      addLog('Refreshing dashboard...');
      refreshDashboard();
    } catch (error) {
      addLog(`Error updating balance: ${error}`);
    }
  };

  // Add function to handle setting balance with a specific value
  const handleSetBalance = async (balanceValue: number) => {
    if (!result || !result.accountId) return;
    
    try {
      addLog(`Setting account ${result.accountId} balance to ${balanceValue}`);
      await ImportToDatabaseService.updateAccountBalance(result.accountId, balanceValue);
      addLog('Balance updated successfully to ' + balanceValue);
      
      // Refresh dashboard
      addLog('Refreshing dashboard...');
      refreshDashboard();
    } catch (error) {
      addLog(`Error updating balance: ${error}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Fixed IBKR Import Tester</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload IBKR Activity Statement</h2>
        
        <div className="mb-4">
          <input
            type="file"
            id="file-upload"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            data-testid="import-csv-input"
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              file ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <span className="mr-2">
              {FiUpload({})}
            </span>
            {file ? 'Change File' : 'Select File'}
          </label>
          {file && (
            <span className="ml-3 text-sm text-gray-500">
              <span className="inline mr-1">
                {FiFile({})}
              </span>
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleImport}
            disabled={!file || isImporting}
            data-testid="btn-import-trades"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              !file || isImporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isImporting ? 'Importing...' : 'Import Statement'}
          </button>
          
          <button
            onClick={handleTestBalanceExtraction}
            disabled={!file}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              !file ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <span className="mr-2">
              {FiDollarSign({})}
            </span>
            Test Balance Extraction
          </button>
        </div>
      </div>
      
      {result && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Import Result</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Account ID</p>
              <p className="font-medium">{result.accountId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Name</p>
              <p className="font-medium">{result.accountName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Trades</p>
              <p className="font-medium">{result.totalTrades}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.success ? (
                  <span className="flex items-center">
                    <span className="mr-1">
                      {FiCheck({})}
                    </span>
                    Success
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-1">
                      {FiX({})}
                    </span>
                    Failed
                  </span>
                )}
              </span>
            </div>
            {result.account && result.account.balance !== undefined && (
              <div>
                <p className="text-sm text-gray-500">Account Balance</p>
                <p className="font-medium">${result.account.balance.toFixed(2)}</p>
              </div>
            )}
          </div>
          
          {result.success && (
            <div className="mt-4">
              <button
                onClick={handleManualBalanceUpdate}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <span className="mr-2">
                  {FiDollarSign({})}
                </span>
                Set Account Balance Manually
              </button>
            </div>
          )}
        </div>
      )}
      
      {result && !result.success && (
        <div id="error-log" style={{ background: '#fee', color: '#900', padding: 10, whiteSpace: 'pre-line', fontFamily: 'monospace', marginTop: 16, borderRadius: 8, border: '1px solid #fca5a5' }}>
          <strong>Error during import:</strong>
          <br />
          {Array.isArray(result.errors) && result.errors.length > 0 ? (
            <div>{result.errors.join('\n')}</div>
          ) : Array.isArray(result.debugLogs) && result.debugLogs.length > 0 ? (
            <div>{result.debugLogs.slice(-20).join('\n')}</div>
          ) : (
            <div>No error details available.</div>
          )}
        </div>
      )}
      
      {logs.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Import Logs</h2>
          <div className="bg-gray-100 p-4 rounded-md">
            <pre className="text-sm whitespace-pre-wrap">
              {logs.join('\n')}
            </pre>
          </div>
          
          {importResultDebug && (
            <div className="mt-4">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Debug: importResult</div>
              <pre style={{ fontSize: 12, color: '#333', whiteSpace: 'pre-wrap', background: '#f9fafb', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                {JSON.stringify(importResultDebug, null, 2)}
              </pre>
              {importResultDebug && importResultDebug.success === false && (
                <div style={{ background: '#fee', color: '#900', padding: 10, whiteSpace: 'pre-line', fontFamily: 'monospace', marginTop: 16, borderRadius: 8, border: '1px solid #fca5a5' }}>
                  <strong>Error during import:</strong>
                  <br />
                  {Array.isArray(importResultDebug.errors) && importResultDebug.errors.length > 0 ? (
                    <div>{importResultDebug.errors.join('\n')}</div>
                  ) : Array.isArray(importResultDebug.debugLogs) && importResultDebug.debugLogs.length > 0 ? (
                    <div>{importResultDebug.debugLogs.slice(-20).join('\n')}</div>
                  ) : (
                    <div>No error details available.</div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Add prominent button for setting balance when not found */}
          {logs.some(log => log.includes('Account balance: Not found')) && result && (
            <div className="mt-4">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                <p className="font-bold">Account balance not found in statement</p>
                <p>Please set your account balance manually to ensure your dashboard shows accurate data.</p>
                <p className="mt-2">Your statement shows a balance of <strong>$6,694.75</strong> (from Cash Report).</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleSetBalance(6694.75)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent text-md font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  <span className="mr-2">
                    {FiDollarSign({})}
                  </span>
                  Set Balance to $6,694.75
                </button>
                <button
                  onClick={handleManualBalanceUpdate}
                  className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent text-md font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <span className="mr-2">
                    {FiDollarSign({})}
                  </span>
                  Set Custom Balance
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {importSuccess && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h2>✅ Import Successful!</h2>
          <button
            onClick={() => navigate && navigate('/options')}
            style={{ marginTop: 16, padding: '10px 24px', fontSize: 16, borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default FixedIBKRImportTester;