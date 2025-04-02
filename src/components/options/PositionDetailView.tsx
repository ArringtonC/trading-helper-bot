import React from 'react';
import { OptionTrade } from '../../types/options';

interface PositionDetailViewProps {
  trade: OptionTrade;
  onClose: () => void;
  onClosePosition?: (tradeId: string) => void;
}

/**
 * Detailed view for a single option position
 */
const PositionDetailView: React.FC<PositionDetailViewProps> = ({ 
  trade, 
  onClose,
  onClosePosition
}) => {
  // Calculate days until expiration
  const daysUntilExpiry = (): number => {
    const today = new Date();
    const expiry = new Date(trade.expiry);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };
  
  // Calculate P&L if position is closed
  const calculatePL = (): number | undefined => {
    if (!trade.closeDate || trade.closePremium === undefined) {
      return undefined;
    }
    
    const multiplier = 100; // Standard for equity options
    const openValue = trade.premium * Math.abs(trade.quantity) * multiplier;
    const closeValue = trade.closePremium * Math.abs(trade.quantity) * multiplier;
    
    // For long positions, we want to sell higher than we bought
    if (trade.quantity > 0) {
      return closeValue - openValue - (trade.commission || 0);
    } 
    // For short positions, we want to buy back lower than we sold
    else {
      return openValue - closeValue - (trade.commission || 0);
    }
  };
  
  const pl = calculatePL();
  const days = daysUntilExpiry();
  const isExpired = days === 0 && !trade.closeDate;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-bold">Position Details</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Symbol</div>
            <div className="text-lg font-medium">{trade.symbol}</div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Option Type</div>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              trade.putCall === 'CALL' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {trade.putCall}
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Strike Price</div>
            <div className="text-lg font-medium">${trade.strike.toFixed(2)}</div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Expiration</div>
            <div className="text-lg font-medium">
              {new Date(trade.expiry).toLocaleDateString()}
              {!trade.closeDate && (
                <span 
                  className={`ml-2 text-xs ${
                    isExpired ? 'text-red-600' : days <= 7 ? 'text-yellow-600' : 'text-green-600'
                  }`}
                >
                  {isExpired ? 'Expired' : `${days} days remaining`}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Quantity</div>
            <div className="text-lg font-medium">
              {trade.quantity} contract{Math.abs(trade.quantity) !== 1 ? 's' : ''}
              <span className="text-sm ml-2">
                ({trade.quantity > 0 ? 'Long' : 'Short'})
              </span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Premium</div>
            <div className="text-lg font-medium">
              ${trade.premium.toFixed(2)} per share
              <span className="text-sm ml-2">
                (${(trade.premium * Math.abs(trade.quantity) * 100).toFixed(2)} total)
              </span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Open Date</div>
            <div className="text-lg font-medium">
              {new Date(trade.openDate).toLocaleDateString()}
            </div>
          </div>
          
          {trade.closeDate && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Close Date</div>
              <div className="text-lg font-medium">
                {new Date(trade.closeDate).toLocaleDateString()}
              </div>
            </div>
          )}
          
          {trade.closePremium !== undefined && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Close Premium</div>
              <div className="text-lg font-medium">
                ${trade.closePremium.toFixed(2)} per share
              </div>
            </div>
          )}
          
          {pl !== undefined && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Profit/Loss</div>
              <div className={`text-lg font-medium ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${pl.toFixed(2)}
                <span className="text-sm ml-2">
                  ({((pl / (trade.premium * Math.abs(trade.quantity) * 100)) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {trade.strategy && (
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">Strategy</div>
          <div className="text-base">{trade.strategy}</div>
        </div>
      )}
      
      {trade.notes && (
        <div className="mb-6">
          <div className="text-sm text-gray-500 mb-1">Notes</div>
          <div className="text-base bg-gray-50 p-3 rounded">{trade.notes}</div>
        </div>
      )}
      
      {!trade.closeDate && onClosePosition && (
        <div className="flex justify-end border-t border-gray-200 pt-4">
          <button
            onClick={() => onClosePosition(trade.id)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Close Position
          </button>
        </div>
      )}
    </div>
  );
};

export default PositionDetailView; 