export function transformDataForHeatmap(flatData) {
    if (!flatData || flatData.length === 0) {
        return { xLabels: [], yLabels: [], data: [] };
    }
    // Get unique, sorted dates (xLabels)
    var uniqueDates = Array.from(new Set(flatData.map(function (item) { return item.date; }))).sort();
    // Get unique, sorted symbols (yLabels)
    var uniqueSymbols = Array.from(new Set(flatData.map(function (item) { return item.symbol; }))).sort();
    // Create a map for quick P&L lookup: { 'SYMBOL_DATE': pnl }
    var pnlMap = new Map();
    flatData.forEach(function (item) {
        pnlMap.set("".concat(item.symbol, "_").concat(item.date), item.pnl);
    });
    // Initialize the data matrix with zeros (or a default value like null/NaN if preferred)
    var dataMatrix = Array(uniqueSymbols.length)
        .fill(null)
        .map(function () { return Array(uniqueDates.length).fill(0); });
    // Populate the data matrix
    uniqueSymbols.forEach(function (symbol, yIndex) {
        uniqueDates.forEach(function (date, xIndex) {
            var key = "".concat(symbol, "_").concat(date);
            if (pnlMap.has(key)) {
                dataMatrix[yIndex][xIndex] = pnlMap.get(key);
            }
        });
    });
    return {
        xLabels: uniqueDates,
        yLabels: uniqueSymbols,
        data: dataMatrix,
    };
}
