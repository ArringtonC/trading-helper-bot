import React, { useState } from 'react';
import { OptionTrade, calculateTradePL } from '../types/options';

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
  const [closePremium, setClosePremium] = useState<number>(trade.premium);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Form validation
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!closeDate) {
      newErrors.closeDate = 'Close date is required';
    } else if (closeDate < trade.openDate) {
      newErrors.closeDate = 'Close date cannot be before open date';
    }
    
    if (!closePremium && closePremium !== 0) {
      newErrors.closePremium = 'Close premium is required';
    } else if (closePremium < 0) {
      newErrors.closePremium = 'Close premium cannot be negative';
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
    const openValue = trade.premium * Math.abs(trade.quantity) * multiplier;
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
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Close Position</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-700 mb-2">Position Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Symbol: <span className="font-medium">{trade.symbol}</span></div>
          <div>Type: <span className="font-medium">{trade.putCall}</span></div>
          <div>Strike: <span className="font-medium">${trade.strike.toFixed(2)}</span></div>
          <div>Expiry: <span className="font-medium">{trade.expiry.toLocaleDateString()}</span></div>
          <div>Quantity: <span className="font-medium">{trade.quantity}</span></div>
          <div>Open Premium: <span className="font-medium">${trade.premium.toFixed(2)}</span></div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Close Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Close Date
            </label>
            <input
              type="date"
              value={closeDate.toISOString().split('T')[0]}
              onChange={(e) => setCloseDate(new Date(e.target.value))}
              className={`w-full p-2 border rounded ${
                errors.closeDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.closeDate && (
              <p className="mt-1 text-sm text-red-600">{errors.closeDate}</p>
            )}
          </div>
          
          {/* Close Premium */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Close Premium (per share)
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                value={closePremium}
                onChange={(e) => setClosePremium(parseFloat(e.target.value))}
                className={`w-full pl-7 p-2 border rounded ${
                  errors.closePremium ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            {errors.closePremium && (
              <p className="mt-1 text-sm text-red-600">{errors.closePremium}</p>
            )}
          </div>
          
          {/* Estimated P&L */}
          <div className="p-4 border rounded-md bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Estimated P&L:</span>
              <span className={`text-lg font-bold ${estimatedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${estimatedPL.toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Close Position
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CloseTradeForm; 