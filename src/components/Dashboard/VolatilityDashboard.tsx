/**
 * Volatility Dashboard Component
 * 
 * A comprehensive volatility visualization system that displays:
 * - IV Percentile with historical range markers
 * - ATR (Average True Range) charts
 * - Bollinger Bands overlays
 * - VIX integration and correlation
 * - Customizable time frames and interactive tooltips
 * - Color-coded volatility zones
 * - Side-by-side security comparison
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { LineChartWrapper, AreaChartWrapper } from '../visualizations/ChartComponents';
import { Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from 'recharts';

// Types for volatility data
interface VolatilityData {
  timestamp: number;
  date: string;
  price: number;
  ivPercentile: number;
  impliedVolatility: number;
  historicalVolatility: number;
  atr: number;
  bollingerUpper: number;
  bollingerLower: number;
  bollingerMiddle: number;
  vix: number;
  volume: number;
}

interface SecurityConfig {
  symbol: string;
  name: string;
  color: string;
  enabled: boolean;
}

interface DashboardSettings {
  timeFrame: '1D' | '1W' | '1M' | '3M' | '1Y';
  indicators: {
    ivPercentile: boolean;
    atr: boolean;
    bollingerBands: boolean;
    vix: boolean;
  };
  volatilityZones: {
    low: number;
    medium: number;
    high: number;
  };
  refreshInterval: number;
}

interface VolatilityDashboardProps {
  symbols?: string[];
  onExport?: (type: 'png' | 'csv', data: any) => void;
  onSettingsChange?: (settings: DashboardSettings) => void;
}

// Color scheme for volatility zones
const VOLATILITY_COLORS = {
  low: '#10b981',      // green
  medium: '#f59e0b',   // amber
  high: '#ef4444',     // red
  critical: '#dc2626'  // dark red
};

// Mock data generator (in production, this would come from the calculation engine)
const generateMockData = (days: number = 30): VolatilityData[] => {
  const data: VolatilityData[] = [];
  const basePrice = 100;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    const price = basePrice + (Math.random() - 0.5) * 20 + i * 0.1;
    const iv = 0.15 + Math.random() * 0.25;
    const hv = 0.12 + Math.random() * 0.2;
    const atr = price * (0.01 + Math.random() * 0.03);
    
    data.push({
      timestamp: date.getTime(),
      date: date.toISOString().split('T')[0],
      price,
      ivPercentile: Math.random() * 100,
      impliedVolatility: iv,
      historicalVolatility: hv,
      atr,
      bollingerUpper: price * 1.02,
      bollingerLower: price * 0.98,
      bollingerMiddle: price,
      vix: 15 + Math.random() * 25,
      volume: Math.floor(1000000 + Math.random() * 5000000)
    });
  }
  
  return data;
};

export const VolatilityDashboard: React.FC<VolatilityDashboardProps> = ({
  symbols = ['AAPL'],
  onExport,
  onSettingsChange
}) => {
  const [data, setData] = useState<VolatilityData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0] || 'AAPL');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [settings, setSettings] = useState<DashboardSettings>({
    timeFrame: '1M',
    indicators: {
      ivPercentile: true,
      atr: true,
      bollingerBands: true,
      vix: true
    },
    volatilityZones: {
      low: 25,
      medium: 50,
      high: 75
    },
    refreshInterval: 30000 // 30 seconds
  });

  const [securities] = useState<SecurityConfig[]>([
    { symbol: 'AAPL', name: 'Apple Inc.', color: '#007AFF', enabled: true },
    { symbol: 'TSLA', name: 'Tesla Inc.', color: '#FF3B30', enabled: false },
    { symbol: 'SPY', name: 'SPDR S&P 500', color: '#34C759', enabled: false },
    { symbol: 'QQQ', name: 'Invesco QQQ', color: '#FF9500', enabled: false }
  ]);

  // Fetch volatility data
  const fetchVolatilityData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // In production, this would be an API call to the calculation engine
      const newData = generateMockData(30);
      setData(newData);
      setLastUpdate(Date.now());
      
    } catch (error) {
      console.error('Failed to fetch volatility data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSymbol, settings.timeFrame]);

  // Setup real-time updates
  useEffect(() => {
    fetchVolatilityData();
    
    if (isRealTimeEnabled) {
      refreshIntervalRef.current = setInterval(fetchVolatilityData, settings.refreshInterval);
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchVolatilityData, isRealTimeEnabled, settings.refreshInterval]);

  // Handle settings changes
  const handleSettingsChange = useCallback((newSettings: Partial<DashboardSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
  }, [settings, onSettingsChange]);

  // Get volatility zone color
  const getVolatilityZoneColor = (percentile: number): string => {
    if (percentile <= settings.volatilityZones.low) return VOLATILITY_COLORS.low;
    if (percentile <= settings.volatilityZones.medium) return VOLATILITY_COLORS.medium;
    if (percentile <= settings.volatilityZones.high) return VOLATILITY_COLORS.high;
    return VOLATILITY_COLORS.critical;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              Price: <span className="font-medium">${data.price?.toFixed(2)}</span>
            </p>
            <p className="text-sm text-gray-600">
              IV Percentile: <span className="font-medium">{data.ivPercentile?.toFixed(1)}%</span>
            </p>
            <p className="text-sm text-gray-600">
              ATR: <span className="font-medium">${data.atr?.toFixed(2)}</span>
            </p>
            <p className="text-sm text-gray-600">
              VIX: <span className="font-medium">{data.vix?.toFixed(1)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Time frame options
  const timeFrameOptions = [
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '1Y', label: '1 Year' }
  ];

  if (isLoading && data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading volatility data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Volatility Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
              {isRealTimeEnabled && (
                <Badge variant="success" className="ml-2">Live</Badge>
              )}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Symbol selector */}
            <select 
              value={selectedSymbol} 
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {securities.map(security => (
                <option key={security.symbol} value={security.symbol}>
                  {security.symbol} - {security.name}
                </option>
              ))}
            </select>

            {/* Time frame selector */}
            <div className="flex bg-gray-100 rounded-md p-1">
              {timeFrameOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSettingsChange({ timeFrame: option.value as any })}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    settings.timeFrame === option.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Real-time toggle */}
            <Button
              variant={isRealTimeEnabled ? "default" : "outline"}
              className="text-sm px-3 py-1"
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            >
              {isRealTimeEnabled ? '● Live' : '○ Paused'}
            </Button>

            {/* Export options */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="text-sm px-3 py-1"
                onClick={() => onExport?.('png', data)}
              >
                Export PNG
              </Button>
              <Button 
                variant="outline" 
                className="text-sm px-3 py-1"
                onClick={() => onExport?.('csv', data)}
              >
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* IV Percentile Chart */}
        {settings.indicators.ivPercentile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>IV Percentile</span>
                <Badge variant="secondary">
                  Current: {data[data.length - 1]?.ivPercentile?.toFixed(1)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChartWrapper data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#666"
                      fontSize={12}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={settings.volatilityZones.low} stroke={VOLATILITY_COLORS.low} strokeDasharray="2 2" />
                    <ReferenceLine y={settings.volatilityZones.medium} stroke={VOLATILITY_COLORS.medium} strokeDasharray="2 2" />
                    <ReferenceLine y={settings.volatilityZones.high} stroke={VOLATILITY_COLORS.high} strokeDasharray="2 2" />
                    <Line 
                      type="monotone" 
                      dataKey="ivPercentile" 
                      stroke="#007AFF" 
                      strokeWidth={2}
                      dot={{ fill: '#007AFF', strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, stroke: '#007AFF', strokeWidth: 2 }}
                    />
                  </LineChartWrapper>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ATR Chart */}
        {settings.indicators.atr && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Average True Range (ATR)</span>
                <Badge variant="secondary">
                  Current: ${data[data.length - 1]?.atr?.toFixed(2)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChartWrapper data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#666"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="atr" 
                      stroke="#ff7300" 
                      fill="#ff7300"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChartWrapper>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bollinger Bands with Price Chart */}
        {settings.indicators.bollingerBands && (
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Bollinger Bands & Price Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChartWrapper data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#666"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="bollingerUpper" 
                      stroke="#dc2626" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Upper Band"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bollingerMiddle" 
                      stroke="#6b7280" 
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                      name="Middle Band"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bollingerLower" 
                      stroke="#dc2626" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Lower Band"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#007AFF" 
                      strokeWidth={2}
                      dot={{ fill: '#007AFF', strokeWidth: 0, r: 2 }}
                      activeDot={{ r: 4, stroke: '#007AFF', strokeWidth: 2 }}
                      name="Price"
                    />
                  </LineChartWrapper>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIX Correlation */}
        {settings.indicators.vix && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>VIX Correlation</span>
                <Badge variant="secondary">
                  VIX: {data[data.length - 1]?.vix?.toFixed(1)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChartWrapper data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#666"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="ivPercentile" 
                      stroke="#007AFF" 
                      strokeWidth={2}
                      dot={false}
                      name="IV Percentile"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="vix" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={false}
                      name="VIX"
                    />
                  </LineChartWrapper>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Volatility Summary Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Volatility Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {data[data.length - 1]?.impliedVolatility ? (data[data.length - 1].impliedVolatility * 100).toFixed(1) : '--'}%
                  </div>
                  <div className="text-sm text-gray-600">Implied Volatility</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {data[data.length - 1]?.historicalVolatility ? (data[data.length - 1].historicalVolatility * 100).toFixed(1) : '--'}%
                  </div>
                  <div className="text-sm text-gray-600">Historical Volatility</div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Current Zone</span>
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ 
                      backgroundColor: getVolatilityZoneColor(data[data.length - 1]?.ivPercentile || 0)
                    }}
                  >
                    {data[data.length - 1]?.ivPercentile <= settings.volatilityZones.low ? 'Low' :
                     data[data.length - 1]?.ivPercentile <= settings.volatilityZones.medium ? 'Medium' :
                     data[data.length - 1]?.ivPercentile <= settings.volatilityZones.high ? 'High' : 'Critical'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Low: 0-{settings.volatilityZones.low}% | 
                  Medium: {settings.volatilityZones.low}-{settings.volatilityZones.medium}% | 
                  High: {settings.volatilityZones.medium}-{settings.volatilityZones.high}% | 
                  Critical: {settings.volatilityZones.high}%+
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}; 