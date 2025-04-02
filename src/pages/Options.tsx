import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OptionTrade } from '../types/options';
import { Account } from '../types/account';
import { AccountService } from '../services/AccountService';
import { OptionService } from '../services/OptionService';
import OptionsTable from '../components/OptionsTable';
import NewTradeForm from '../components/NewTradeForm';
import CloseTradeForm from '../components/CloseTradeForm';
import OptionsAnalysisCard from '../components/options/OptionsAnalysisCard';
import ExpirationCalendar from '../components/options/ExpirationCalendar';
import PositionDetailView from '../components/options/PositionDetailView';

/**
 * Enhanced Options module page component with analysis and calendar
 */
const Options: React.FC = () => {
  const [activeTab, setActiveTab] = useState('open');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [openPositions, setOpenPositions] = useState<OptionTrade[]>([]);
  const [closedPositions, setClosedPositions] = useState<OptionTrade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<OptionTrade | null>(null);
  const [viewingTrade, setViewingTrade] = useState<OptionTrade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Load accounts on mount
  useEffect(() => {
    const loadAccounts = () => {
      try {
        const loadedAccounts = AccountService.getAccounts();
        setAccounts(loadedAccounts);
        
        if (loadedAccounts.length > 0) {
          // Check if accountId is in the URL query params
          const params = new URLSearchParams(location.search);
          const accountId = params.get('accountId');
          
          if (accountId && loadedAccounts.some(a => a.id === accountId)) {
            setSelectedAccountId(accountId);
          } else {
            setSelectedAccountId(loadedAccounts[0].id);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading accounts', error);
        setIsLoading(false);
      }
    };
    
    loadAccounts();
  }, [location.search]);
  
  // Load options positions when account changes
  useEffect(() => {
    if (selectedAccountId) {
      try {
        const open = OptionService.getOpenPositions(selectedAccountId);
        const closed = OptionService.getClosedPositions(selectedAccountId);
        
        setOpenPositions(open);
        setClosedPositions(closed);
      } catch (error) {
        console.error('Error loading options positions', error);
      }
    }
  }, [selectedAccountId]);
  
  // Handle account selection change
  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const accountId = e.target.value;
    setSelectedAccountId(accountId);
    navigate(`/options?accountId=${accountId}`);
  };
  
  // Handle adding a new trade
  const handleAddTrade = (trade: OptionTrade) => {
    try {
      OptionService.addTrade(selectedAccountId, trade);
      
      // Refresh positions
      const open = OptionService.getOpenPositions(selectedAccountId);
      setOpenPositions(open);
      
      // Switch to open positions tab
      setActiveTab('open');
    } catch (error) {
      console.error('Error adding trade', error);
      alert('Error adding trade. Please try again.');
    }
  };
  
  // Handle initiating position close
  const handleClosePosition = (tradeId: string) => {
    const trade = openPositions.find(p => p.id === tradeId);
    if (trade) {
      setSelectedTrade(trade);
      setActiveTab('close');
    }
  };
  
  // Handle confirming position close
  const handleConfirmClose = (
    tradeId: string, 
    closeData: { closeDate: Date; closePremium: number }
  ) => {
    try {
      OptionService.closeTrade(selectedAccountId, tradeId, closeData);
      
      // Refresh positions
      const open = OptionService.getOpenPositions(selectedAccountId);
      const closed = OptionService.getClosedPositions(selectedAccountId);
      
      setOpenPositions(open);
      setClosedPositions(closed);
      
      // Switch back to open positions tab
      setActiveTab('open');
      setSelectedTrade(null);
    } catch (error) {
      console.error('Error closing position', error);
      alert('Error closing position. Please try again.');
    }
  };
  
  // Handle deleting a trade
  const handleDeleteTrade = (tradeId: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        OptionService.deleteTrade(selectedAccountId, tradeId);
        
        // Refresh positions
        const open = OptionService.getOpenPositions(selectedAccountId);
        const closed = OptionService.getClosedPositions(selectedAccountId);
        
        setOpenPositions(open);
        setClosedPositions(closed);
      } catch (error) {
        console.error('Error deleting trade', error);
        alert('Error deleting trade. Please try again.');
      }
    }
  };
  
  // Handle viewing position details
  const handleViewPosition = (trade: OptionTrade) => {
    setViewingTrade(trade);
  };

  // Handle closing position details view
  const handleClosePositionDetails = () => {
    setViewingTrade(null);
  };
  
  if (isLoading) {
    return <div className="p-4">Loading accounts...</div>;
  }

  if (viewingTrade) {
    return (
      <div className="p-4">
        <PositionDetailView
          trade={viewingTrade}
          onClose={handleClosePositionDetails}
          onClosePosition={handleClosePosition}
        />
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Options Trading</h1>
      
      {/* Account Selector */}
      <div className="mb-6">
        <label htmlFor="account-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Account
        </label>
        <select
          id="account-select"
          value={selectedAccountId}
          onChange={handleAccountChange}
          className="w-full md:w-64 p-2 border border-gray-300 rounded shadow-sm"
        >
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>
      
      {selectedAccountId ? (
        <>
          {/* Analysis Section */}
          <div className="mb-6">
            <OptionsAnalysisCard 
              openPositions={openPositions} 
              closedPositions={closedPositions} 
            />
          </div>
          
          {/* Tab Navigation */}
          <div className="flex justify-between items-center border-b border-gray-200 mb-6">
            <div className="flex">
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === 'open' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('open')}
              >
                Open Positions ({openPositions.length})
              </button>
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === 'closed' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('closed')}
              >
                Closed Positions ({closedPositions.length})
              </button>
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === 'new' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('new')}
              >
                New Trade
              </button>
            </div>
            
            {/* View Toggle (only for open positions) */}
            {activeTab === 'open' && (
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <button
                  className={`py-1 px-3 text-sm ${
                    viewMode === 'table' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
                <button
                  className={`py-1 px-3 text-sm ${
                    viewMode === 'calendar' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setViewMode('calendar')}
                >
                  Calendar
                </button>
              </div>
            )}
          </div>
          
          {/* Content based on active tab */}
          {activeTab === 'open' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Open Positions</h2>
                <button
                  onClick={() => setActiveTab('new')}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Add New Trade
                </button>
              </div>
              
              {viewMode === 'table' ? (
                <OptionsTable
                  positions={openPositions}
                  onClose={handleClosePosition}
                  onDelete={handleDeleteTrade}
                  onView={handleViewPosition}
                />
              ) : (
                <ExpirationCalendar 
                  trades={openPositions} 
                  onTradeClick={handleViewPosition}
                />
              )}
            </div>
          )}
          
          {activeTab === 'closed' && (
            <div>
              <h2 className="text-xl font-medium mb-4">Closed Positions</h2>
              <OptionsTable
                positions={closedPositions}
                showActions={false}
                onView={handleViewPosition}
              />
            </div>
          )}
          
          {activeTab === 'new' && (
            <div>
              <h2 className="text-xl font-medium mb-4">New Trade</h2>
              <NewTradeForm
                onSubmit={handleAddTrade}
                onCancel={() => setActiveTab('open')}
              />
            </div>
          )}
          
          {activeTab === 'close' && selectedTrade && (
            <div>
              <h2 className="text-xl font-medium mb-4">Close Position</h2>
              <CloseTradeForm
                trade={selectedTrade}
                onClose={handleConfirmClose}
                onCancel={() => {
                  setActiveTab('open');
                  setSelectedTrade(null);
                }}
              />
            </div>
          )}
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <p className="mb-3">No accounts found. You need to create an account or import from IBKR before using the Options module.</p>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/import')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Import from IBKR
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 border border-gray-300 bg-white rounded hover:bg-gray-50"
            >
              Go to Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Options; 