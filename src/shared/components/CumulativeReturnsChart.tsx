import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { OptionTrade } from '../types/options';
import { calculateTradePL } from '../utils/tradeUtils';
import { safeParseDate, formatDateForDisplay } from '../utils/dateUtils';

interface CumulativeReturnsChartProps {
  trades: OptionTrade[];
  groupBy: 'strategy' | 'expiration' | 'none';
  dateRange?: [Date, Date] | null;
  height?: number | string;
}

// Color palette for different strategies/expirations
const COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#EC4899', '#8B5CF6',
  '#6366F1', '#10B981', '#059669', '#0EA5E9', '#6D28D9'
];

// Define types for chart data
interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

interface ChartGroup {
  id: string;
  name: string;
  color: string;
}

interface ChartData {
  chartData: ChartDataPoint[];
  groups: ChartGroup[];
}

const CumulativeReturnsChart: React.FC<CumulativeReturnsChartProps> = ({
  trades,
  groupBy = 'strategy',
  dateRange = null,
  height = 400
}) => {
  // Calculate cumulative returns and format data for chart
  const chartData = useMemo<ChartData>(() => {
    // Filter trades by date range if provided
    let filteredTrades = [...trades];
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      filteredTrades = filteredTrades.filter(trade => {
        const tradeDate = safeParseDate(trade.closeDate || trade.openDate);
        if (!tradeDate) return false;
        return tradeDate >= startDate && tradeDate <= endDate;
      });
    }

    // Sort trades by date
    filteredTrades.sort((a, b) => {
      const dateA = safeParseDate(a.closeDate || a.openDate);
      const dateB = safeParseDate(b.closeDate || b.openDate);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

    // Group trades by date and strategy/expiration
    const tradesByDate: { 
      [date: string]: { [group: string]: number } 
    } = {};
    
    // Initialize cumulative totals by group
    const cumulativeTotals: { [group: string]: number } = {};
    
    // Process each trade
    filteredTrades.forEach(trade => {
      const tradeDate = safeParseDate(trade.closeDate || trade.openDate);
      if (!tradeDate) return;
      
      const formattedDate = formatDateForDisplay(tradeDate, 'yyyy-MM-dd');
      
      // Determine group key based on groupBy parameter
      let groupKey: string;
      if (groupBy === 'strategy') {
        groupKey = trade.strategy || 'Unknown';
      } else if (groupBy === 'expiration') {
        const expiryDate = safeParseDate(trade.expiry);
        if (!expiryDate) return;
        groupKey = formatDateForDisplay(expiryDate, 'MMM yyyy');
      } else {
        groupKey = 'All Trades';
      }
      
      // Calculate P&L for this trade
      const pl = calculateTradePL(trade);
      
      // Initialize group in cumulative totals if needed
      if (cumulativeTotals[groupKey] === undefined) {
        cumulativeTotals[groupKey] = 0;
      }
      
      // Add P&L to cumulative total for this group
      cumulativeTotals[groupKey] += pl;
      
      // Initialize date in tradesByDate if needed
      if (!tradesByDate[formattedDate]) {
        tradesByDate[formattedDate] = {};
      }
      
      // Store cumulative total for this group on this date
      tradesByDate[formattedDate][groupKey] = cumulativeTotals[groupKey];
    });
    
    // Convert to array format for Recharts
    const dates = Object.keys(tradesByDate).sort();
    const result = dates.map(date => {
      const dateData: ChartDataPoint = { date };
      
      // Fill in values for each group
      Object.keys(cumulativeTotals).forEach(group => {
        dateData[group] = tradesByDate[date][group] || 0;
      });
      
      return dateData;
    });
    
    return {
      chartData: result,
      groups: Object.keys(cumulativeTotals).map((group, index) => ({
        id: group,
        name: group,
        color: COLORS[index % COLORS.length]
      }))
    };
  }, [trades, groupBy, dateRange]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-semibold text-gray-800">{format(parseISO(label), 'MMM d, yyyy')}</p>
          <div className="mt-2">
            {payload.map((entry, index) => (
              <div key={`tooltip-${index}`} className="flex items-center mb-1">
                <div 
                  className="w-2 h-2 mr-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm mr-2">{entry.name}:</span>
                <span className={`text-sm font-semibold ${Number(entry.value) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Number(entry.value).toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Cumulative Returns</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData.chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(parseISO(date), 'MMM d')}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {chartData.groups.map(group => (
              <Line
                key={group.id}
                type="monotone"
                dataKey={group.id}
                name={group.name}
                stroke={group.color}
                activeDot={{ r: 8 }}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CumulativeReturnsChart; 