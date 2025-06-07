var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import React, { useState } from 'react';
import { OptionStrategy } from '../types/options';
/**
 * Form component for adding a new options trade
 */
var NewTradeForm = function (_a) {
    var onSubmit = _a.onSubmit, onCancel = _a.onCancel;
    var _b = useState({
        symbol: '',
        putCall: 'CALL',
        strike: 0,
        quantity: 1,
        premium: 0,
        openDate: new Date(),
        expiry: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Default to 1 month expiry
        strategy: OptionStrategy.LONG_CALL
    }), tradeData = _b[0], setTradeData = _b[1];
    var _c = useState({}), errors = _c[0], setErrors = _c[1];
    // Handle form field changes
    var handleChange = function (field, value) {
        setTradeData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
        // Clear error for this field if exists
        if (errors[field]) {
            setErrors(function (prev) {
                var newErrors = __assign({}, prev);
                delete newErrors[field];
                return newErrors;
            });
        }
    };
    // Form validation
    var validateForm = function () {
        var newErrors = {};
        if (!tradeData.symbol) {
            newErrors.symbol = 'Symbol is required';
        }
        if (!tradeData.strike || tradeData.strike <= 0) {
            newErrors.strike = 'Valid strike price is required';
        }
        if (!tradeData.quantity || tradeData.quantity === 0) {
            newErrors.quantity = 'Quantity cannot be zero';
        }
        if (!tradeData.premium || tradeData.premium <= 0) {
            newErrors.premium = 'Valid premium is required';
        }
        if (!tradeData.expiry) {
            newErrors.expiry = 'Expiration date is required';
        }
        else if (tradeData.expiry < new Date()) {
            newErrors.expiry = 'Expiration date cannot be in the past';
        }
        if (!tradeData.openDate) {
            newErrors.openDate = 'Open date is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    // Handle form submission
    var handleSubmit = function (e) {
        var _a;
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        // Create the trade object with a generated ID
        var newTrade = {
            id: "trade-".concat(Date.now()),
            symbol: ((_a = tradeData.symbol) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || '',
            putCall: tradeData.putCall,
            strike: tradeData.strike || 0,
            quantity: tradeData.quantity || 0,
            premium: tradeData.premium || 0,
            openDate: tradeData.openDate || new Date(),
            expiry: tradeData.expiry || new Date(),
            strategy: tradeData.strategy || OptionStrategy.LONG_CALL,
            commission: tradeData.commission || 0,
            notes: tradeData.notes
        };
        onSubmit(newTrade);
        // Reset form
        setTradeData({
            symbol: '',
            putCall: 'CALL',
            strike: 0,
            quantity: 1,
            premium: 0,
            openDate: new Date(),
            expiry: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            strategy: OptionStrategy.LONG_CALL
        });
    };
    return (<div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Add New Option Trade</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Symbol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol
            </label>
            <input type="text" value={tradeData.symbol} onChange={function (e) { return handleChange('symbol', e.target.value.toUpperCase()); }} className={"w-full p-2 border rounded ".concat(errors.symbol ? 'border-red-500' : 'border-gray-300')} placeholder="AAPL"/>
            {errors.symbol && (<p className="mt-1 text-sm text-red-600">{errors.symbol}</p>)}
          </div>
          
          {/* Put/Call Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Option Type
            </label>
            <div className="flex">
              <button type="button" className={"flex-1 py-2 px-4 text-sm font-medium rounded-l-md ".concat(tradeData.putCall === 'CALL'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300')} onClick={function () { return handleChange('putCall', 'CALL'); }}>
                CALL
              </button>
              <button type="button" className={"flex-1 py-2 px-4 text-sm font-medium rounded-r-md ".concat(tradeData.putCall === 'PUT'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300')} onClick={function () { return handleChange('putCall', 'PUT'); }}>
                PUT
              </button>
            </div>
          </div>
          
          {/* Strike Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strike Price
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input type="number" value={tradeData.strike || ''} onChange={function (e) { return handleChange('strike', parseFloat(e.target.value)); }} className={"w-full pl-7 p-2 border rounded ".concat(errors.strike ? 'border-red-500' : 'border-gray-300')} placeholder="0.00" step="0.01"/>
            </div>
            {errors.strike && (<p className="mt-1 text-sm text-red-600">{errors.strike}</p>)}
          </div>
          
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <div className="flex items-center">
              <button type="button" onClick={function () { return handleChange('quantity', -Math.abs(tradeData.quantity || 1)); }} className={"px-3 py-2 border border-gray-300 rounded-l-md ".concat((tradeData.quantity || 0) < 0 ? 'bg-blue-100' : 'bg-white')}>
                Short
              </button>
              <input type="number" value={Math.abs(tradeData.quantity || 0)} onChange={function (e) {
            var value = parseInt(e.target.value);
            var sign = (tradeData.quantity || 0) < 0 ? -1 : 1;
            handleChange('quantity', sign * value);
        }} className={"w-24 p-2 text-center border-y ".concat(errors.quantity ? 'border-red-500' : 'border-gray-300')}/>
              <button type="button" onClick={function () { return handleChange('quantity', Math.abs(tradeData.quantity || 1)); }} className={"px-3 py-2 border border-gray-300 rounded-r-md ".concat((tradeData.quantity || 0) > 0 ? 'bg-blue-100' : 'bg-white')}>
                Long
              </button>
            </div>
            {errors.quantity && (<p className="mt-1 text-sm text-red-600">{errors.quantity}</p>)}
          </div>
          
          {/* Premium */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Premium (per share)
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input type="number" value={tradeData.premium || ''} onChange={function (e) { return handleChange('premium', parseFloat(e.target.value)); }} className={"w-full pl-7 p-2 border rounded ".concat(errors.premium ? 'border-red-500' : 'border-gray-300')} placeholder="0.00" step="0.01"/>
            </div>
            {errors.premium && (<p className="mt-1 text-sm text-red-600">{errors.premium}</p>)}
          </div>
          
          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date
            </label>
            <input type="date" value={tradeData.expiry ? tradeData.expiry.toISOString().split('T')[0] : ''} onChange={function (e) { return handleChange('expiry', new Date(e.target.value)); }} className={"w-full p-2 border rounded ".concat(errors.expiry ? 'border-red-500' : 'border-gray-300')}/>
            {errors.expiry && (<p className="mt-1 text-sm text-red-600">{errors.expiry}</p>)}
          </div>
          
          {/* Open Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Open Date
            </label>
            <input type="date" value={tradeData.openDate ? tradeData.openDate.toISOString().split('T')[0] : ''} onChange={function (e) { return handleChange('openDate', new Date(e.target.value)); }} className={"w-full p-2 border rounded ".concat(errors.openDate ? 'border-red-500' : 'border-gray-300')}/>
            {errors.openDate && (<p className="mt-1 text-sm text-red-600">{errors.openDate}</p>)}
          </div>
          
          {/* Strategy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strategy
            </label>
            <select value={tradeData.strategy} onChange={function (e) { return handleChange('strategy', e.target.value); }} className="w-full p-2 border border-gray-300 rounded">
              {Object.entries(OptionStrategy).map(function (_a) {
            var key = _a[0], value = _a[1];
            return (<option key={key} value={value}>
                  {value}
                </option>);
        })}
            </select>
          </div>
          
          {/* Commission (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commission (Optional)
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input type="number" value={tradeData.commission || ''} onChange={function (e) { return handleChange('commission', parseFloat(e.target.value)); }} className="w-full pl-7 p-2 border border-gray-300 rounded" placeholder="0.00" step="0.01"/>
            </div>
          </div>
          
          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea value={tradeData.notes || ''} onChange={function (e) { return handleChange('notes', e.target.value); }} className="w-full p-2 border border-gray-300 rounded" rows={3} placeholder="Add any additional notes about this trade..."/>
          </div>
          
          {/* Form Actions */}
          <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
            {onCancel && (<button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Cancel
              </button>)}
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              Add Trade
            </button>
          </div>
        </div>
      </form>
    </div>);
};
export default NewTradeForm;
