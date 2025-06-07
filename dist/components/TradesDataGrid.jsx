import React from 'react';
export var TradesDataGrid = function (_a) {
    var trades = _a.trades;
    if (!trades.length)
        return <div>No trades to display.</div>;
    return (<div className="overflow-x-auto mt-4">
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
          {trades.map(function (trade) { return (<tr key={trade.id}>
              <td className="border px-2 py-1">{trade.tradeDate}</td>
              <td className="border px-2 py-1">{trade.symbol}</td>
              <td className="border px-2 py-1">{trade.broker}</td>
              <td className="border px-2 py-1">{trade.quantity}</td>
              <td className="border px-2 py-1">{trade.tradePrice}</td>
              <td className="border px-2 py-1">{trade.netAmount}</td>
              <td className="border px-2 py-1">{trade.openCloseIndicator || ''}</td>
            </tr>); })}
        </tbody>
      </table>
    </div>);
};
