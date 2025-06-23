import React from 'react';

interface TradeCardProps {
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: string;
}

const TradeCard: React.FC<TradeCardProps> = ({ symbol, type, price, quantity, timestamp }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{symbol}</h3>
          <p className="text-sm text-gray-500">{timestamp}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {type.toUpperCase()}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Price</p>
          <p className="text-lg font-medium text-gray-900">${price.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Quantity</p>
          <p className="text-lg font-medium text-gray-900">{quantity}</p>
        </div>
      </div>
    </div>
  );
};

export default TradeCard;