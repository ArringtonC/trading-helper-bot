import { AlertCircle, CheckCircle, Download, ExternalLink, RefreshCw, Server, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SEC_CONFIG, secEdgarService, TraderPickAnalysis } from '../../../../shared/services/SECEdgarService';
import { Button } from '../../../../shared/components/ui/button';
import { Progress } from '../../../../shared/components/ui/progress';

interface UpdateTradesButtonProps {
  onDataUpdated?: (newPicks: TraderPickAnalysis[]) => void;
  className?: string;
}

interface UpdateProgress {
  step: string;
  progress: number;
  status: 'loading' | 'success' | 'error' | 'idle';
  message: string;
}

interface ServerStatus {
  isRunning: boolean;
  lastChecked: Date | null;
  error?: string;
}

const UpdateTradesButton: React.FC<UpdateTradesButtonProps> = ({ 
  onDataUpdated, 
  className = '' 
}) => {
  const [updating, setUpdating] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    isRunning: false,
    lastChecked: null
  });
  const [progress, setProgress] = useState<UpdateProgress>({
    step: 'idle',
    progress: 0,
    status: 'idle',
    message: ''
  });
  const [lastUpdate, setLastUpdate] = useState<{
    timestamp: string;
    success: boolean;
    picksCount: number;
  } | null>(null);

  // Check server status on component mount and periodically
  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkServerStatus = async () => {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      setServerStatus({
        isRunning: response.ok,
        lastChecked: new Date(),
        error: response.ok ? undefined : 'Server responded with error'
      });
    } catch (error) {
      setServerStatus({
        isRunning: false,
        lastChecked: new Date(),
        error: 'Cannot connect to proxy server'
      });
    }
  };

  const updateProgress = (step: string, progress: number, message: string, status: 'loading' | 'success' | 'error' = 'loading') => {
    setProgress({ step, progress, message, status });
  };

  const handleStartServer = () => {
    // Open instructions for starting the server
    const instructions = `
To start the SEC EDGAR proxy server:

1. Open a new terminal window
2. Navigate to your project directory
3. Run: npm run start-proxy

Or run both servers together:
npm run dev-with-proxy

The server will start on http://localhost:3001
    `;
    
    if (window.confirm(`The SEC EDGAR proxy server needs to be running.\n\n${instructions}\n\nWould you like to open the terminal instructions?`)) {
      // Copy command to clipboard if possible
      if (navigator.clipboard) {
        navigator.clipboard.writeText('npm run start-proxy');
      }
    }
  };

  const handleUpdateTrades = async () => {
    if (updating) return;

    // Check server status first
    if (!serverStatus.isRunning) {
      handleStartServer();
      return;
    }

    setUpdating(true);
    setProgress({ step: 'starting', progress: 0, status: 'loading', message: 'Initializing update...' });

    try {
      // Step 1: Test connection
      updateProgress('connection', 10, 'Testing SEC EDGAR API connection...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      
      const isConnected = await secEdgarService.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to SEC EDGAR API');
      }

      // Step 2: Fetch latest filing
      updateProgress('fetching', 30, 'Fetching Michael Burry\'s latest 13F filing...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const latestFiling = await secEdgarService.getLatest13FFiling(SEC_CONFIG.SCION_CIK);
      if (!latestFiling) {
        throw new Error('No recent 13F filings found');
      }

      // Step 3: Parse filing data
      updateProgress('parsing', 60, 'Parsing holdings data from SEC document...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const filingData = await secEdgarService.parse13FFiling(
        SEC_CONFIG.SCION_CIK, 
        latestFiling.accessionNumber
      );

      if (!filingData) {
        throw new Error('Failed to parse filing data');
      }

      // Step 4: Convert to trader picks
      updateProgress('converting', 80, 'Converting data to investment picks...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const traderPicks = secEdgarService.convertToTraderPicks(filingData);

      // Step 5: Complete
      const isDemo = filingData.documentUrl?.includes('Mock data');
      const message = isDemo 
        ? `Demo: Showing ${traderPicks.length} Q1 2025 picks (Michael Burry's actual positions)`
        : `Successfully updated ${traderPicks.length} latest picks!`;
      
      updateProgress('complete', 100, message, 'success');
      
      // Update parent component
      if (onDataUpdated) {
        onDataUpdated(traderPicks);
      }

      // Store last update info
      setLastUpdate({
        timestamp: new Date().toISOString(),
        success: true,
        picksCount: traderPicks.length
      });

      // Reset after delay
      setTimeout(() => {
        setProgress({ step: 'idle', progress: 0, status: 'idle', message: '' });
      }, 3000);

    } catch (error) {
      console.error('Update trades error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      updateProgress('error', 0, `Update failed: ${errorMessage}`, 'error');
      
      setLastUpdate({
        timestamp: new Date().toISOString(),
        success: false,
        picksCount: 0
      });

      // Reset after delay
      setTimeout(() => {
        setProgress({ step: 'idle', progress: 0, status: 'idle', message: '' });
      }, 5000);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'loading':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  const getButtonVariant = () => {
    switch (progress.status) {
      case 'success':
        return 'default';
      case 'error':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getServerStatusColor = () => {
    return serverStatus.isRunning ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Server Status Indicator */}
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Server className={`w-4 h-4 ${getServerStatusColor()}`} />
          <span className="text-sm font-medium">
            Proxy Server: {serverStatus.isRunning ? 'Running' : 'Stopped'}
          </span>
          {serverStatus.lastChecked && (
            <span className="text-xs text-gray-500">
              (checked {serverStatus.lastChecked.toLocaleTimeString()})
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={checkServerStatus}
            disabled={updating}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          
          {!serverStatus.isRunning && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleStartServer}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Start Server
            </Button>
          )}
        </div>
      </div>

      {/* Server Error Message */}
      {!serverStatus.isRunning && serverStatus.error && (
        <div className="flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
          <AlertCircle className="w-4 h-4" />
          <div>
            <div className="font-medium">Proxy server is not running</div>
            <div className="text-xs mt-1">
              Run <code className="bg-amber-100 px-1 rounded">npm run start-proxy</code> in terminal, then click refresh
            </div>
          </div>
        </div>
      )}

      {/* Update Button */}
      <Button
        onClick={handleUpdateTrades}
        disabled={updating || !serverStatus.isRunning}
        variant={getButtonVariant()}
        className="w-full sm:w-auto"
      >
        {getStatusIcon()}
        <span className="ml-2">
          {updating ? 'Updating...' : 
           !serverStatus.isRunning ? 'Server Required' : 
           'Update Latest Trades'}
        </span>
      </Button>

      {/* Progress Bar */}
      {(updating || progress.status === 'success' || progress.status === 'error') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {progress.message}
            </span>
            <span className="text-gray-500">
              {progress.progress}%
            </span>
          </div>
          
          <Progress 
            value={progress.progress} 
            className="w-full h-2"
          />
          
          {progress.status === 'error' && (
            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <AlertCircle className="w-4 h-4" />
              <span>Update failed. Please try again or check the automation status.</span>
            </div>
          )}
        </div>
      )}

      {/* Last Update Info */}
      {lastUpdate && !updating && progress.status === 'idle' && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div className="flex items-center justify-between">
            <span>
              Last update: {new Date(lastUpdate.timestamp).toLocaleString()}
            </span>
            <span className={lastUpdate.success ? 'text-green-600' : 'text-red-600'}>
              {lastUpdate.success ? 
                `✓ ${lastUpdate.picksCount} picks updated` : 
                '✗ Update failed'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateTradesButton; 