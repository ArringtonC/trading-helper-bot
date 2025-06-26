import React from 'react';

interface Trade {
  id: string;
  tradeDate: string;
  broker: string;
  symbol: string;
  assetCategory: string;
  quantity: number;
  tradePrice: number;
  currency: string;
  netAmount: number;
  openCloseIndicator?: string;
  commission?: number;
  fees?: number;
  proceeds?: number;
  cost?: number;
  optionSymbol?: string;
  expiryDate?: string;
  strikePrice?: number;
  putCall?: string;
  multiplier?: number;
}

interface Props {
  trades: Trade[];
}

export const TradesDataGrid: React.FC<Props> = ({ trades }) => {
  if (!trades.length) return <div>No trades to display.</div>;
  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full border text-xs">
        <thead>
          <tr>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Symbol</th>
            <th className="border px-2 py-1">Broker</th>
            <th className="border px-2 py-1">Qty</th>
            <th className="border px-2 py-1">Price</th>
            <th className="border px-2 py-1">Net Amount</th>
            <th className="border px-2 py-1">Type</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, i) => (
            <tr key={trade.id || i}>
              <td className="border px-2 py-1">{trade.tradeDate}</td>
              <td className="border px-2 py-1">{trade.symbol}</td>
              <td className="border px-2 py-1">{trade.broker}</td>
              <td className="border px-2 py-1">{trade.quantity}</td>
              <td className="border px-2 py-1">{trade.tradePrice}</td>
              <td className="border px-2 py-1">{trade.netAmount}</td>
              <td className="border px-2 py-1">{trade.openCloseIndicator || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 