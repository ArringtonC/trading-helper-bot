import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { IBKRActivityStatementParser } from '../services/IBKRActivityStatementParser';
import { OptionService } from '../services/OptionService';
import { AccountService } from '../services/AccountService';
import { Account, AccountType } from '../types/account';
import { OptionTrade } from '../types/options';
import { Button, Card, Container, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';

/**
 * Integrated Import page component with service connections
 */
const Import: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importMethod, setImportMethod] = useState<'ibkr' | 'manual'>('ibkr');
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    accountInfo: any;
    trades: any[];
    positions: any[];
    optionTrades: OptionTrade[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setImportSummary(null);
      setError(null);
      setDebugInfo([]);
      addDebugInfo(`File selected: ${acceptedFiles[0].name} (${acceptedFiles[0].size} bytes)`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt', '.csv']
    },
    multiple: false
  });

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    setImporting(true);
    setError(null);
    setImportSummary(null);
    setDebugInfo([]);
    addDebugInfo('Starting import process...');

    try {
      console.log('Reading file content...');
      const content = await file.text();
      console.log(`File content read: ${content.length} characters`);
      addDebugInfo(`File content read: ${content.length} characters`);
      addDebugInfo(`First 100 characters: ${content.substring(0, 100)}`);
      addDebugInfo(`File content type: ${typeof content}`);
      addDebugInfo(`File content contains tabs: ${content.includes('\t')}`);
      addDebugInfo(`File content contains newlines: ${content.includes('\n')}`);
      addDebugInfo(`File content contains commas: ${content.includes(',')}`);

      if (importMethod === 'ibkr') {
        console.log('Parsing IBKR activity statement...');
        addDebugInfo('Parsing IBKR activity statement...');
        
        try {
          const parser = new IBKRActivityStatementParser(content);
          addDebugInfo('Parser created, starting parse...');
          console.log('Parser created, starting parse...');
          
          try {
            console.log('Calling parser.parse()...');
            const result = parser.parse();
            console.log('Parse completed successfully');
            addDebugInfo(`Parse completed. Account info: ${JSON.stringify(result.accountInfo)}`);
            addDebugInfo(`Found ${result.trades.length} trades`);
            addDebugInfo(`Found ${result.positions.length} positions`);
            addDebugInfo(`Converted to ${result.optionTrades.length} option trades`);

            setImportSummary(result);

            // Import the account and trades
            addDebugInfo('Importing account and trades...');
            console.log('Importing account and trades...');

            // Create or update account
            const account: Account = {
              id: result.accountInfo.accountId,
              name: result.accountInfo.accountName,
              type: AccountType.IBKR,
              balance: result.accountInfo.balance,
              lastUpdated: new Date()
            };

            console.log(`Creating account: ${JSON.stringify(account)}`);
            addDebugInfo(`Creating account: ${JSON.stringify(account)}`);
            
            try {
              await AccountService.addAccount(account);
              console.log(`Account saved: ${account.id}`);
              addDebugInfo(`Account saved: ${account.id}`);

              // Import option trades
              console.log(`Starting to import ${result.optionTrades.length} option trades...`);
              addDebugInfo(`Starting to import ${result.optionTrades.length} option trades...`);
              
              for (const trade of result.optionTrades) {
                console.log(`Importing trade: ${JSON.stringify(trade)}`);
                addDebugInfo(`Importing trade: ${JSON.stringify(trade)}`);
                await OptionService.addTrade(account.id, trade);
                console.log(`Option trade added: ${trade.id}`);
                addDebugInfo(`Option trade added: ${trade.id}`);
              }
              
              console.log(`All ${result.optionTrades.length} option trades imported successfully`);
              addDebugInfo(`All ${result.optionTrades.length} option trades imported successfully`);
            } catch (accountError) {
              console.error('Error saving account:', accountError);
              addDebugInfo(`Error saving account: ${accountError instanceof Error ? accountError.message : String(accountError)}`);
              throw accountError;
            }
          } catch (parseError) {
            console.error('Error parsing IBKR activity statement:', parseError);
            addDebugInfo(`Error parsing IBKR activity statement: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            throw parseError;
          }
        } catch (parserError) {
          console.error('Error creating parser:', parserError);
          addDebugInfo(`Error creating parser: ${parserError instanceof Error ? parserError.message : String(parserError)}`);
          throw parserError;
        }
      } else {
        // Manual import logic would go here
        setError('Manual import not implemented yet');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
      addDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`);
      if (err instanceof Error && err.stack) {
        console.error('Error stack:', err.stack);
        addDebugInfo(`Error stack: ${err.stack}`);
      }
    } finally {
      setImporting(false);
    }
  };

  // Add a function to log the file content to the console
  const logFileContent = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    try {
      const content = await file.text();
      console.log('File content:', content);
      addDebugInfo('File content logged to console');
    } catch (err) {
      console.error('Error reading file:', err);
      setError(`Error reading file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Import Data</h1>

      <Card className="mb-4">
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Import Method</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="IBKR Activity Statement"
                  name="importMethod"
                  checked={importMethod === 'ibkr'}
                  onChange={() => setImportMethod('ibkr')}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="Manual Entry"
                  name="importMethod"
                  checked={importMethod === 'manual'}
                  onChange={() => setImportMethod('manual')}
                />
              </div>
            </Form.Group>

            {importMethod === 'ibkr' && (
              <div
                {...getRootProps()}
                className={`p-5 border rounded text-center ${isDragActive ? 'bg-light' : ''}`}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p>Drop the IBKR activity statement CSV file here...</p>
                ) : (
                  <p>Drag and drop an IBKR activity statement CSV file here, or click to select a file</p>
                )}
                {file && <p className="mt-2">Selected file: {file.name}</p>}
              </div>
            )}

            {importMethod === 'manual' && (
              <Alert variant="info">
                Manual entry import will be implemented in a future update.
              </Alert>
            )}

            <div className="d-grid gap-2 mt-3">
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={!file || importing}
              >
                {importing ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Importing...
                  </>
                ) : (
                  'Import'
                )}
              </Button>
              
              {/* Add a button to log the file content */}
              {file && (
                <Button
                  variant="outline-secondary"
                  onClick={logFileContent}
                  disabled={importing}
                >
                  Log File Content
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {importSummary && (
        <Card className="mb-4">
          <Card.Header>Import Summary</Card.Header>
          <Card.Body>
            <h5>Account Information</h5>
            <div className="mb-4">
              <p><strong>Account ID:</strong> {importSummary.accountInfo.accountId}</p>
              <p><strong>Account Name:</strong> {importSummary.accountInfo.accountName}</p>
              <p><strong>Account Type:</strong> {importSummary.accountInfo.accountType}</p>
              <p><strong>Base Currency:</strong> {importSummary.accountInfo.baseCurrency}</p>
              <p><strong>Balance:</strong> {importSummary.accountInfo.balance.toFixed(2)}</p>
            </div>

            <h5>Option Trades</h5>
            <p>Imported {importSummary.optionTrades.length} option trades</p>
            
            {importSummary.optionTrades.length > 0 && (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Strike</th>
                      <th>Expiry</th>
                      <th>Quantity</th>
                      <th>Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importSummary.optionTrades.map((trade, index) => (
                      <tr key={index}>
                        <td>{trade.symbol}</td>
                        <td>{trade.putCall}</td>
                        <td>{trade.strike}</td>
                        <td>{trade.expiry.toLocaleDateString()}</td>
                        <td>{trade.quantity}</td>
                        <td>{trade.premium.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {debugInfo.length > 0 && (
        <Card className="mb-4">
          <Card.Header>Debug Information</Card.Header>
          <Card.Body>
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {debugInfo.map((info, index) => (
                <div key={index} className="mb-1">
                  <code>{info}</code>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Import; 