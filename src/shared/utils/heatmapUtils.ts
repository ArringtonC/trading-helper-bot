export interface HeatmapDataRow {
  symbol: string;
  date: string;
  pnl: number;
}

export interface TransformedHeatmapData {
  xLabels: string[]; // Dates
  yLabels: string[]; // Symbols
  data: number[][];  // P&L values matrix
}

export function transformDataForHeatmap(flatData: HeatmapDataRow[]): TransformedHeatmapData {
  if (!flatData || flatData.length === 0) {
    return { xLabels: [], yLabels: [], data: [] };
  }

  // Get unique, sorted dates (xLabels)
  const uniqueDates = Array.from(new Set(flatData.map(item => item.date))).sort();

  // Get unique, sorted symbols (yLabels)
  const uniqueSymbols = Array.from(new Set(flatData.map(item => item.symbol))).sort();

  // Create a map for quick P&L lookup: { 'SYMBOL_DATE': pnl }
  const pnlMap = new Map<string, number>();
  flatData.forEach(item => {
    pnlMap.set(`${item.symbol}_${item.date}`, item.pnl);
  });

  // Initialize the data matrix with zeros (or a default value like null/NaN if preferred)
  const dataMatrix: number[][] = Array(uniqueSymbols.length)
    .fill(null)
    .map(() => Array(uniqueDates.length).fill(0));

  // Populate the data matrix
  uniqueSymbols.forEach((symbol, yIndex) => {
    uniqueDates.forEach((date, xIndex) => {
      const key = `${symbol}_${date}`;
      if (pnlMap.has(key)) {
        dataMatrix[yIndex][xIndex] = pnlMap.get(key)!;
      }
    });
  });

  return {
    xLabels: uniqueDates,
    yLabels: uniqueSymbols,
    data: dataMatrix,
  };
} 