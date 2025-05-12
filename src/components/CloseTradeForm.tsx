import React, { useState } from 'react';
import { OptionTrade } from '../types/options';

interface CloseTradeFormProps {
  trade: OptionTrade;
  onClose: (tradeId: string, closeData: { closeDate: Date; closePremium: number }) => void;
  onCancel: () => void;
}

/**
 * Form component for closing an existing options trade
 */
const CloseTradeForm: React.FC<CloseTradeFormProps> = ({ trade, onClose, onCancel }) => {
  const [closeDate, setCloseDate] = useState<Date>(new Date());
  const [closePremium, setClosePremium] = useState<number>(trade.premium || 0);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Form validation
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!closeDate) {
      newErrors.closeDate = 'Close date is required';
    }
    
    if (closePremium <= 0) {
      newErrors.closePremium = 'Close premium must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onClose(trade.id, {
      closeDate,
      closePremium
    });
  };
  
  // Calculate estimated P&L
  const calculateEstimatedPL = (): number => {
    const multiplier = 100; // Standard for equity options
    const openValue = (trade.premium || 0) * Math.abs(trade.quantity) * multiplier;
    const closeValue = closePremium * Math.abs(trade.quantity) * multiplier;
    
    // For long positions, we want to sell higher than we bought
    if (trade.quantity > 0) {
      return closeValue - openValue - (trade.commission || 0);
    } 
    // For short positions, we want to buy back lower than we sold
    else {
      return openValue - closeValue - (trade.commission || 0);
    }
  };
  
  const estimatedPL = calculateEstimatedPL();
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Close Trade</h2>
      
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h3 className="text-lg font-semibold mb-2">Trade Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>Symbol: <span className="font-medium">{trade.symbol}</span></div>
          <div>Type: <span className="font-medium">{trade.putCall}</span></div>
          <div>Strike: <span className="font-medium">${trade.strike.toFixed(2)}</span></div>
          <div>Expiry: <span className="font-medium">{trade.expiry.toLocaleDateString()}</span></div>
          <div>Quantity: <span className="font-medium">{trade.quantity}</span></div>
          <div>Open Premium: <span className="font-medium">${(trade.premium || 0).toFixed(2)}</span></div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
              Close Date
            </label>
            <input
              type="date"
              value={closeDate.toISOString().split('T')[0]}
              onChange={(e) => setCloseDate(new Date(e.target.value))}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.closeDate ? 'border-red-500' : ''
              }`}
            />
            {errors.closeDate && (
            <p className="text-red-500 text-xs italic">{errors.closeDate}</p>
            )}
          </div>
          
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Close Premium
            </label>
          <div className="relative">
            <span className="absolute left-3 top-2">$</span>
              <input
                type="number"
              step="0.01"
                value={closePremium}
                onChange={(e) => setClosePremium(parseFloat(e.target.value))}
              className={`shadow appearance-none border rounded w-full py-2 pl-8 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.closePremium ? 'border-red-500' : ''
                }`}
              />
            </div>
            {errors.closePremium && (
            <p className="text-red-500 text-xs italic">{errors.closePremium}</p>
            )}
          </div>
          
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-semibold mb-2">Estimated P&L</h3>
          <p className={`text-2xl font-bold ${
            estimatedPL >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
                ${estimatedPL.toFixed(2)}
          </p>
          </div>
          
        <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
            Close Trade
            </button>
        </div>
      </form>
    </div>
  );
};

export default CloseTradeForm; 