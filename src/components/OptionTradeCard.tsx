import React from 'react';
import { OptionTrade, calculateTradePL, daysUntilExpiration } from '../types/options';

interface OptionTradeCardProps {
  trade: OptionTrade;
  onClose?: (tradeId: string, closePremium: number) => void;
  onDelete?: (tradeId: string) => void;
}

export const OptionTradeCard: React.FC<OptionTradeCardProps> = ({ trade, onClose, onDelete }) => {
  const isOpen = !trade.closeDate;
  const pl = calculateTradePL(trade);
  const daysToExpiry = daysUntilExpiration(trade);
  const isExpired = daysToExpiry <= 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold">{trade.symbol}</h3>
          <p className="text-sm text-gray-600">
            {trade.putCall} {trade.strike} Strike
          </p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-medium ${isOpen ? 'text-green-600' : 'text-gray-600'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
          <p className={`text-lg font-bold ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${pl.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div>
          <p className="text-gray-600">Quantity</p>
          <p className="font-medium">{trade.quantity}</p>
        </div>
        <div>
          <p className="text-gray-600">Premium</p>
          <p className="font-medium">${trade.premium.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Expiry</p>
          <p className="font-medium">{trade.expiry.toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-gray-600">Days to Expiry</p>
          <p className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
            {isExpired ? 'Expired' : daysToExpiry}
          </p>
        </div>
      </div>

      {trade.strategy && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Strategy</p>
          <p className="font-medium">{trade.strategy}</p>
        </div>
      )}

      {trade.notes && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Notes</p>
          <p className="text-sm">{trade.notes}</p>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        {isOpen && onClose && (
          <button
            onClick={() => onClose(trade.id, 0)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close Trade
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(trade.id)}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}; 