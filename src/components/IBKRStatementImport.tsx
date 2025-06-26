import React, { useState } from 'react';
import { extractIBKRPnLData, extractTradesWithActualPnL } from '../utils/importUtils';
import { AccountService } from '../services/AccountService';
import { OptionService } from '../services/OptionService';
import { formatCurrency } from '../utils/formatters';
import { AccountType } from '../types/account';

/**
 * Component for importing IBKR statements with direct P&L extraction
 */
const IBKRStatementImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    pnlData?: any;
    tradeCount?: number;
  } | null>(null);
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setResult({
        success: false,
        message: 'Please select a file to import'
      });
      return;
    }

    if (!accountId || !accountName) {
      setResult({
        success: false,
        message: 'Please enter account information'
      });
      return;
    }

    setParsing(true);
    setResult(null);

    try {
      // Read file content
      const fileContent = await file.text();
      
      // Extract P&L data from the statement
      const pnlData = extractIBKRPnLData(fileContent);
      
      // Extract trades with actual P&L values
      const { trades, stats } = extractTradesWithActualPnL(fileContent);
      
      // Create or update account
      AccountService.addAccount({
        id: accountId,
        name: accountName,
        type: AccountType.IBKR,
        balance: pnlData.realizedTotal + pnlData.unrealizedTotal,
        lastUpdated: new Date(),
        created: new Date()
      });
      
      // Get portfolio for account
      const portfolio = OptionService.getOptionsPortfolio(accountId);
      
      if (portfolio) {
        // Update trades to include portfolio information
        const tradesWithPortfolio = trades.map(trade => ({
          ...trade
          // Using actual realized P&L values from broker directly
        }));
        
        // Add each trade to the portfolio
        let successCount = 0;
        for (const trade of tradesWithPortfolio) {
          try {
            OptionService.addTrade(accountId, trade);
            successCount++;
          } catch (error) {
            console.error(`Failed to add trade ${trade.id}:`, error);
          }
        }
        
        setResult({
          success: true,
          message: `Successfully imported ${successCount} of ${trades.length} trades with actual P&L data`,
          pnlData: {
            ...pnlData,
            spyRealizedPL: stats.totalPL,
            openPL: stats.openPL,
            combinedPL: stats.combinedPL,
            winRate: stats.winRate
          },
          tradeCount: successCount
        });
      } else {
        setResult({
          success: false,
          message: 'Failed to get portfolio for account'
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: `Error importing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5>IBKR Statement Import (with Direct P&L)</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label htmlFor="accountId" className="form-label">Account ID</label>
          <input 
            type="text" 
            className="form-control" 
            id="accountId"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Enter account ID"
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="accountName" className="form-label">Account Name</label>
          <input 
            type="text" 
            className="form-control" 
            id="accountName"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Enter account name"
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="statementFile" className="form-label">IBKR Activity Statement CSV</label>
          <input
            type="file"
            className="form-control"
            id="statementFile"
            accept=".csv"
            onChange={handleFileChange}
          />
          <div className="form-text">
            Upload your IBKR activity statement in CSV format to import trades with direct P&L values.
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleImport}
          disabled={parsing || !file}
        >
          {parsing ? 'Importing...' : 'Import Statement'}
        </button>

        {result && (
          <div className={`alert mt-3 ${result.success ? 'alert-success' : 'alert-danger'}`}>
            <p>{result.message}</p>
            
            {result.success && result.pnlData && (
              <div className="mt-2">
                <h6>P&L Summary:</h6>
                <ul className="mb-0">
                  <li>Realized P&L: {formatCurrency(result.pnlData.realizedTotal)}</li>
                  <li>Unrealized P&L: {formatCurrency(result.pnlData.unrealizedTotal)}</li>
                  <li>Fees: {formatCurrency(result.pnlData.totalFees)}</li>
                  <li>SPY Realized P&L (net): {formatCurrency(result.pnlData.spyRealizedPL)}</li>
                  <li>Open Positions P&L: {formatCurrency(result.pnlData.openPL)}</li>
                  <li>Combined P&L: {formatCurrency(result.pnlData.combinedPL)}</li>
                  <li>Win Rate: {result.pnlData.winRate}</li>
                  <li>Trades Imported: {result.tradeCount}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IBKRStatementImport; 