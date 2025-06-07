import React, { useState, useEffect, useMemo } from 'react';
import { HeatMapGrid } from 'react-grid-heatmap';
import { getHeatmapData } from '../../services/DatabaseService'; // Import data fetching function
import { transformDataForHeatmap, TransformedHeatmapData, HeatmapDataRow } from '../../utils/heatmapUtils'; // Import transformation function and type

// Mock data removed

interface HeatMapComponentProps {
  // Props remain empty for now
}

const HeatMapComponent: React.FC<HeatMapComponentProps> = () => {
  const [allHeatmapData, setAllHeatmapData] = useState<HeatmapDataRow[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const rawData = await getHeatmapData();
        setAllHeatmapData(rawData);
        // Extract unique symbols from fetched data
        const symbols = Array.from(new Set(rawData.map(item => item.symbol))).sort();
        setAvailableSymbols(symbols);
        // Initially select all symbols
        setSelectedSymbols(symbols);

      } catch (err) {
        console.error("Error fetching heatmap data:", err);
        setError("Failed to load heatmap data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  // Apply filtering and transform data whenever filters or source data changes
  const transformedHeatmapData = useMemo(() => {
    if (!allHeatmapData || allHeatmapData.length === 0) {
      return { xLabels: [], yLabels: [], data: [] };
    }

    let filteredData = allHeatmapData;

    // Filter by date range
    if (startDate) {
      filteredData = filteredData.filter(item => item.date >= startDate);
    }
    if (endDate) {
      filteredData = filteredData.filter(item => item.date <= endDate);
    }

    // Filter by selected symbols
    if (selectedSymbols.length > 0) {
       // Filter only if selectedSymbols is not empty. If empty, show all (or none depending on desired behavior - showing all when array is empty is more intuitive for a multiselect)
       const symbolsToFilter = new Set(selectedSymbols); // Use a Set for faster lookups
       filteredData = filteredData.filter(item => symbolsToFilter.has(item.symbol));
    }
     // If selectedSymbols is empty, we should probably show no data, or handle this state.
     // Current logic will show all data if selectedSymbols was initially all symbols and then cleared.
     // Let's refine: if selectedSymbols is empty, show no data.
     if (selectedSymbols.length === 0 && availableSymbols.length > 0 && allHeatmapData.length > 0) {
         filteredData = []; // Show no data if explicitly no symbols are selected
     }

    return transformDataForHeatmap(filteredData);
  }, [allHeatmapData, startDate, endDate, selectedSymbols, availableSymbols]);

  // After transforming, filter out all-zero rows and columns
  const cleanedTransformedData = useMemo(() => {
    if (!transformedHeatmapData || !transformedHeatmapData.data) return transformedHeatmapData;
    const { xLabels, yLabels, data } = transformedHeatmapData;
    // Filter out all-zero rows
    const nonZeroRowIndices = data
      .map((row, i) => ({
        i,
        hasNonZero: row.some(val => Number(val) !== 0)
      }))
      .filter(r => r.hasNonZero)
      .map(r => r.i);
    const filteredYLabels = yLabels.filter((_, i) => nonZeroRowIndices.includes(i));
    const filteredData = data.filter((_, i) => nonZeroRowIndices.includes(i));
    // Filter out all-zero columns
    const nonZeroColIndices = xLabels
      .map((_, colIdx) => filteredData.some(row => Number(row[colIdx]) !== 0))
      .map((hasNonZero, idx) => hasNonZero ? idx : -1)
      .filter(idx => idx !== -1);
    const filteredXLabels = xLabels.filter((_, i) => nonZeroColIndices.includes(i));
    const finalData = filteredData.map(row => nonZeroColIndices.map(i => row[i]));
    return {
      xLabels: filteredXLabels,
      yLabels: filteredYLabels,
      data: finalData
    };
  }, [transformedHeatmapData]);

  // Helper to handle symbol selection changes (basic toggle for now)
  const handleSymbolToggle = (symbol: string) => {
    setSelectedSymbols(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };


  return (
    <div className="p-4 border rounded shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-4">Daily P&L Heatmap</h2>

      {/* Filter Controls */}
      <div className="mb-4 flex space-x-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
         {/* Basic symbol filter - could be a multiselect dropdown later */}
         <div>
             <label className="block text-sm font-medium text-gray-700">Symbols:</label>
             <div className="mt-1 flex flex-wrap gap-2">
                 {availableSymbols.map(symbol => (
                     <button
                         key={symbol}
                         onClick={() => handleSymbolToggle(symbol)}
                         className={`px-3 py-1 border rounded-full text-sm ${selectedSymbols.includes(symbol) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                     >
                         {symbol}
                     </button>
                 ))}
                  {availableSymbols.length === 0 && !isLoading && !error && allHeatmapData.length > 0 && (
                      <p className="text-sm text-gray-500">No symbols available for filtering.</p>
                  )}
                   {isLoading && <p className="text-sm text-gray-500">Loading symbols...</p>}
                   {error && <p className="text-sm text-red-500">Error loading symbols.</p>}
             </div>
         </div>
      </div>

      {isLoading && <p>Loading heatmap data...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!isLoading && !error && cleanedTransformedData && cleanedTransformedData.xLabels.length > 0 && cleanedTransformedData.yLabels.length > 0 ? (
        <HeatMapGrid
          xLabels={cleanedTransformedData.xLabels}
          yLabels={cleanedTransformedData.yLabels}
          data={cleanedTransformedData.data}
          cellStyle={(_x: number, _y: number, value: number) => ({
            background: value === 0 ? '#f0f0f0' :
                        value > 0 ? `rgba(0, 180, 0, ${Math.min(value / 200, 1)})` :
                                    `rgba(255, 50, 50, ${Math.min(Math.abs(value) / 200, 1)})`,
            fontSize: '11px',
            color: Math.abs(value) > 100 ? 'white' : '#333',
            border: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          })}
          cellHeight="35px"
          xLabelsStyle={(index: number) => ({
            color: '#555',
            fontSize: '11px',
            width: '80px'
          })}
          yLabelsStyle={(index: number) => ({
            color: '#555',
            fontSize: '11px',
            textAlign: 'right',
            paddingRight: '5px',
            width: '50px'
          })}
          cellRender={(x, y, value) => {
            const symbol = cleanedTransformedData.yLabels[y];
            const date = cleanedTransformedData.xLabels[x];
            const pnl = value.toFixed(2);
            const tooltipText = `Symbol: ${symbol}\nDate: ${date}\nP&L: $${pnl}`;
            return <div title={tooltipText} className="w-full h-full flex items-center justify-center">{pnl}</div>;
          }}
          onClick={(x, y) => {
            const symbol = cleanedTransformedData.yLabels[y];
            const date = cleanedTransformedData.xLabels[x];
            const pnl = cleanedTransformedData.data[y][x];
            console.log(`Clicked Cell - Symbol: ${symbol}, Date: ${date}, P&L: ${pnl.toFixed(2)}`);
          }}
        />
      ) : (
        !isLoading && !error && <p>No non-zero P&L data available for heatmap based on current filters.</p>
      )}
    </div>
  );
};

export default HeatMapComponent; 