import React from 'react';
var formatPnl = function (pnl) {
    if (pnl === null)
        return 'N/A';
    return pnl.toFixed(2);
};
var getDiscrepancyTypeText = function (type) {
    switch (type) {
        case 'Missing_SourceA': return 'Missing in Local DB';
        case 'Missing_SourceB': return 'Missing in Auth Source';
        case 'Pnl_Mismatch': return 'P&L Mismatch';
        default: return 'Unknown';
    }
};
var ReconciliationReport = function (_a) {
    var result = _a.result, isLoading = _a.isLoading, error = _a.error;
    if (isLoading) {
        return <div className="p-4 border rounded shadow-md bg-white">Loading reconciliation report...</div>;
    }
    if (error) {
        return <div className="p-4 border rounded shadow-md bg-red-100 text-red-700">Error generating report: {error}</div>;
    }
    if (!result) {
        return <div className="p-4 border rounded shadow-md bg-white">No reconciliation data available. Upload both trade and authoritative files.</div>;
    }
    var summary = result.summary, discrepancies = result.discrepancies;
    return (<div className="p-4 border rounded shadow-md bg-white mt-4 space-y-4">
      <h2 className="text-xl font-semibold mb-2">Reconciliation Report</h2>

      {/* Summary Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="bg-gray-100 p-2 rounded"><span className="font-medium">Items in Local DB (A):</span> {summary.countSourceA}</div>
        <div className="bg-gray-100 p-2 rounded"><span className="font-medium">Items in Auth Source (B):</span> {summary.countSourceB}</div>
        <div className="bg-green-100 p-2 rounded text-green-800"><span className="font-medium">Reconciled Items:</span> {summary.countReconciled}</div>
        <div className={"p-2 rounded ".concat(summary.countDiscrepancies > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100')}><span className="font-medium">Total Discrepancies:</span> {summary.countDiscrepancies}</div>
        {summary.countDiscrepancies > 0 && (<>
            <div className="bg-yellow-100 p-2 rounded text-yellow-800"><span className="font-medium">Missing in Local DB:</span> {summary.countMissingSourceA}</div>
            <div className="bg-yellow-100 p-2 rounded text-yellow-800"><span className="font-medium">Missing in Auth Source:</span> {summary.countMissingSourceB}</div>
            <div className="bg-orange-100 p-2 rounded text-orange-800"><span className="font-medium">P&L Mismatches:</span> {summary.countPnlMismatch}</div>
          </>)}
      </div>

      {/* Discrepancies Table */}
      {discrepancies.length > 0 && (<div>
          <h3 className="text-lg font-semibold mb-2">Discrepancy Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">P&L Local (A)</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">P&L Auth (B)</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                  {/* Add Action column later for Subtask 2.3.7 */}
                  {/* <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Action</th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {discrepancies.map(function (item, index) { return (<tr key={"".concat(item.symbol, "-").concat(item.date, "-").concat(index)} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{item.symbol}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">{item.date}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">{getDiscrepancyTypeText(item.type)}</td>
                    <td className={"px-4 py-2 whitespace-nowrap text-right ".concat(item.pnlSourceA === null ? 'text-gray-400' : '')}>{formatPnl(item.pnlSourceA)}</td>
                    <td className={"px-4 py-2 whitespace-nowrap text-right ".concat(item.pnlSourceB === null ? 'text-gray-400' : '')}>{formatPnl(item.pnlSourceB)}</td>
                    <td className={"px-4 py-2 whitespace-nowrap text-right font-medium ".concat(item.difference && Math.abs(item.difference) > 0.01 ? 'text-red-600' : 'text-gray-500')}>{formatPnl(item.difference)}</td>
                    {/* Add Action cell later */}
                    {/* <td className="px-4 py-2 whitespace-nowrap">...</td> */}
                  </tr>); })}
              </tbody>
            </table>
          </div>
        </div>)}

      {summary.countDiscrepancies === 0 && (<p className="text-green-600 font-medium">✅ All items reconciled successfully!</p>)}
    </div>);
};
export default ReconciliationReport;
