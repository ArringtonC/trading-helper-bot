import { CheckCircle, Clock, ExternalLink, Loader2, RefreshCw, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { secEdgarService, TraderPickAnalysis } from '../../../../shared/services/SECEdgarService';
import { Badge } from '../../../../shared/components/ui/Badge';
import { Button } from '../../../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card';

interface AutomationStatusProps {
  onDataUpdated?: (newPicks: TraderPickAnalysis[]) => void;
}

interface UpdateSummary {
  timestamp: string;
  beforeCount: number;
  afterCount: number;
  updatedPicksCount: number;
  success: boolean;
}

const AutomationStatus: React.FC<AutomationStatusProps> = ({ onDataUpdated }) => {
  const [testing, setTesting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  const [lastUpdate, setLastUpdate] = useState<UpdateSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load last update summary on component mount
  useEffect(() => {
    loadLastUpdateSummary();
  }, []);

  const loadLastUpdateSummary = async (): Promise<void> => {
    try {
      const response = await fetch('/scripts/automation/logs/last-update-summary.json');
      if (response.ok) {
        const summary = await response.json() as UpdateSummary;
        setLastUpdate(summary);
      }
    } catch (error) {
      // No summary file exists yet, which is fine
      console.log('No previous update summary found');
    }
  };

  const testConnection = async (): Promise<void> => {
    setTesting(true);
    setErrorMessage('');
    
    try {
      const result = await secEdgarService.testConnection();
      setConnectionStatus(result ? 'connected' : 'failed');
      
      if (!result) {
        setErrorMessage('SEC EDGAR API connection test failed. Please check network connectivity.');
      }
    } catch (error) {
      setConnectionStatus('failed');
      setErrorMessage(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const testUpdate = async (): Promise<void> => {
    setUpdating(true);
    setErrorMessage('');
    
    try {
      const picks = await secEdgarService.getMichaelBurryLatestPicks();
      
      if (picks.length > 0) {
        onDataUpdated?.(picks);
        setLastUpdate({
          timestamp: new Date().toISOString(),
          beforeCount: 1,
          afterCount: 1,
          updatedPicksCount: picks.length,
          success: true
        });
      } else {
        setErrorMessage('No 13F data found. This could be normal if no recent filings are available.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Update test failed');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'failed':
        return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          SEC EDGAR Automation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Automated tracking of Michael Burry's 13F filings from the SEC EDGAR database.
          Updates run quarterly after filing deadlines.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <h4 className="font-medium">API Connection</h4>
            <p className="text-sm text-muted-foreground">SEC EDGAR API connectivity status</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              disabled={testing}
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
            </Button>
          </div>
        </div>

        {/* Last Update Info */}
        {lastUpdate && (
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium mb-2">Last Automated Update</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Timestamp:</span>
                <p>{formatDate(lastUpdate.timestamp)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Picks Updated:</span>
                <p>{lastUpdate.updatedPicksCount}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={lastUpdate.success ? "success" : "danger"} className="ml-1">
                  {lastUpdate.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Next Update:</span>
                <p className="text-xs">Quarterly (Mar/Jun/Sep/Dec 15th)</p>
              </div>
            </div>
          </div>
        )}

        {/* Manual Test */}
        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Manual Update Test</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={testUpdate}
              disabled={updating || connectionStatus === 'failed'}
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test Update'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Fetch the latest 13F filing data to test the automation pipeline.
            This will not modify the stored data file.
          </p>
        </div>

        {/* Error Display */}
        {errorMessage && (
          <div className="p-3 border border-red-200 rounded-lg bg-red-50">
            <h4 className="font-medium text-red-800 mb-1">Error</h4>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Technical Details */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Data Source:</strong> SEC EDGAR API (data.sec.gov)</p>
          <p><strong>Target:</strong> Scion Asset Management (CIK: 0001649339)</p>
          <p><strong>Filing Type:</strong> 13F-HR (Institutional Holdings Report)</p>
          <p><strong>Rate Limit:</strong> 10 requests/second (SEC compliance)</p>
        </div>

        {/* External Links */}
        <div className="flex gap-2 pt-2 border-t">
          <a
            href="https://www.sec.gov/edgar/search/#/entityName=Scion%2520Asset%2520Management"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-3 h-3" />
            View SEC Filings
          </a>
          <a
            href="https://data.sec.gov/submissions/CIK0001649339.json"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-3 h-3" />
            Raw API Data
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomationStatus; 