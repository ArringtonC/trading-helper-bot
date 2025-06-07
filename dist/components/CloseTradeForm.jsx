import React, { useState } from 'react';
/**
 * Form component for closing an existing options trade
 */
var CloseTradeForm = function (_a) {
    var trade = _a.trade, onClose = _a.onClose, onCancel = _a.onCancel;
    var _b = useState(new Date()), closeDate = _b[0], setCloseDate = _b[1];
    var _c = useState(trade.premium || 0), closePremium = _c[0], setClosePremium = _c[1];
    var _d = useState({}), errors = _d[0], setErrors = _d[1];
    // Form validation
    var validateForm = function () {
        var newErrors = {};
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
    var handleSubmit = function (e) {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        onClose(trade.id, {
            closeDate: closeDate,
            closePremium: closePremium
        });
    };
    // Calculate estimated P&L
    var calculateEstimatedPL = function () {
        var multiplier = 100; // Standard for equity options
        var openValue = (trade.premium || 0) * Math.abs(trade.quantity) * multiplier;
        var closeValue = closePremium * Math.abs(trade.quantity) * multiplier;
        // For long positions, we want to sell higher than we bought
        if (trade.quantity > 0) {
            return closeValue - openValue - (trade.commission || 0);
        }
        // For short positions, we want to buy back lower than we sold
        else {
            return openValue - closeValue - (trade.commission || 0);
        }
    };
    var estimatedPL = calculateEstimatedPL();
    return (<div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
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
            <input type="date" value={closeDate.toISOString().split('T')[0]} onChange={function (e) { return setCloseDate(new Date(e.target.value)); }} className={"shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ".concat(errors.closeDate ? 'border-red-500' : '')}/>
            {errors.closeDate && (<p className="text-red-500 text-xs italic">{errors.closeDate}</p>)}
          </div>
          
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Close Premium
            </label>
          <div className="relative">
            <span className="absolute left-3 top-2">$</span>
              <input type="number" step="0.01" value={closePremium} onChange={function (e) { return setClosePremium(parseFloat(e.target.value)); }} className={"shadow appearance-none border rounded w-full py-2 pl-8 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ".concat(errors.closePremium ? 'border-red-500' : '')}/>
            </div>
            {errors.closePremium && (<p className="text-red-500 text-xs italic">{errors.closePremium}</p>)}
          </div>
          
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-semibold mb-2">Estimated P&L</h3>
          <p className={"text-2xl font-bold ".concat(estimatedPL >= 0 ? 'text-green-600' : 'text-red-600')}>
                ${estimatedPL.toFixed(2)}
          </p>
          </div>
          
        <div className="flex justify-end space-x-4">
            <button type="button" onClick={onCancel} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Close Trade
            </button>
        </div>
      </form>
    </div>);
};
export default CloseTradeForm;
