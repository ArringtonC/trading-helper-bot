// Robust currency formatter with type‑safety
var formatCurrency = function (value, decimals) {
    if (decimals === void 0) { decimals = 2; }
    if (value === null || value === undefined)
        return '$0.00';
    var numeric = typeof value === 'string' ? parseFloat(value) : Number(value);
    return Number.isFinite(numeric) ? "$".concat(numeric.toFixed(decimals)) : '$0.00';
};
// Helper to colour positive vs negative values in the grid
var profitClass = function (params) {
    return Number(params.value) >= 0 ? 'positive-value' : 'negative-value';
};
export var TRADE_COLUMNS = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'symbol', headerName: 'Symbol', width: 180 },
    {
        field: 'dateTime',
        headerName: 'Date / Time',
        width: 180,
        valueFormatter: function (p) { var _a; return new Date(String((_a = p.value) !== null && _a !== void 0 ? _a : '').replace(',', '')).toLocaleString(); }
    },
    { field: 'quantity', headerName: 'Qty', width: 90, type: 'number' },
    {
        field: 'proceeds',
        headerName: 'Proceeds',
        width: 120,
        type: 'number',
        valueFormatter: function (p) { return formatCurrency(p.value); }
    },
    {
        field: 'basis',
        headerName: 'Basis',
        width: 120,
        type: 'number',
        valueFormatter: function (p) { return formatCurrency(p.value); }
    },
    {
        field: 'commissionFee',
        headerName: 'Commission Fee',
        width: 140,
        type: 'number',
        valueFormatter: function (p) { return formatCurrency(p.value); }
    },
    {
        field: 'realizedPL',
        headerName: 'Realized P&L',
        width: 140,
        type: 'number',
        valueFormatter: function (p) { return formatCurrency(p.value); },
        cellClassName: profitClass
    },
    {
        field: 'unrealizedPL',
        headerName: 'Unrealized P&L',
        width: 140,
        type: 'number',
        valueFormatter: function (p) { return formatCurrency(p.value); },
        cellClassName: profitClass
    },
    {
        field: 'tradePL',
        headerName: 'Trade P&L',
        width: 120,
        type: 'number',
        valueFormatter: function (p) { return formatCurrency(p.value); },
        cellClassName: profitClass
    }
];
