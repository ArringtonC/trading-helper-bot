/**
 * Battle Zone Markers Component
 * 
 * Visual representation of Monday range boundaries and breakout levels
 * Integrates with trading charts to show key battle zones
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Button,
  Tooltip,
  Switch,
  Slider,
  Alert
} from 'antd';
import {
  AimOutlined,
  EyeOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { MondayRangeCalculator, MondayRangeData } from '../../market-data/services/MondayRangeCalculator';

const { Title, Text } = Typography;

interface BattleZoneMarkersProps {
  symbol?: string;
  currentPrice?: number;
  showLabels?: boolean;
  showTargets?: boolean;
  chartHeight?: number;
  onZoneClick?: (zone: string, price: number) => void;
  className?: string;
}

const BattleZoneMarkers: React.FC<BattleZoneMarkersProps> = ({
  symbol = 'SPY',
  currentPrice: propCurrentPrice,
  showLabels = true,
  showTargets = true,
  chartHeight = 400,
  onZoneClick,
  className = ''
}) => {
  const [mondayRange, setMondayRange] = useState<MondayRangeData | null>(null);
  const [currentPrice, setCurrentPrice] = useState(propCurrentPrice || 450);
  const [showAdvancedZones, setShowAdvancedZones] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Array<{ time: string; price: number }>>([]);
  const [opacity, setOpacity] = useState(0.3);

  const calculator = MondayRangeCalculator.getInstance();

  // Initialize Monday range
  useEffect(() => {
    const initializeRange = async () => {
      try {
        const range = await calculator.calculateMondayRange(symbol);
        setMondayRange(range);
      } catch (error) {
        console.error('Error calculating Monday range:', error);
      }
    };

    initializeRange();
  }, [symbol]);

  // Generate price history for visualization
  useEffect(() => {
    if (!mondayRange) return;

    const generatePriceHistory = () => {
      const history = [];
      const now = new Date();
      const basePrice = currentPrice;
      
      // Generate 50 data points over the last few hours
      for (let i = 49; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals
        const randomWalk = (Math.random() - 0.5) * 2;
        const price = basePrice + randomWalk * (i / 10);
        
        history.push({
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: Number(price.toFixed(2))
        });
      }
      
      setPriceHistory(history);
    };

    generatePriceHistory();
    
    // Update every 30 seconds
    const interval = setInterval(generatePriceHistory, 30000);
    return () => clearInterval(interval);
  }, [mondayRange, currentPrice]);

  // Update current price from props
  useEffect(() => {
    if (propCurrentPrice) {
      setCurrentPrice(propCurrentPrice);
    }
  }, [propCurrentPrice]);

  const getZoneColor = (zone: string): string => {
    const colors = {
      mondayHigh: '#52c41a',
      mondayLow: '#ff4d4f',
      upperBreakout: '#1890ff',
      lowerBreakout: '#722ed1',
      upperTarget1: '#52c41a',
      upperTarget2: '#389e0d',
      lowerTarget1: '#ff4d4f',
      lowerTarget2: '#cf1322',
      currentPrice: '#faad14'
    };
    return colors[zone as keyof typeof colors] || '#8c8c8c';
  };

  const getZoneLabel = (zone: string, price: number): string => {
    const labels = {
      mondayHigh: `Monday High: $${price.toFixed(2)}`,
      mondayLow: `Monday Low: $${price.toFixed(2)}`,
      upperBreakout: `Upper Breakout: $${price.toFixed(2)}`,
      lowerBreakout: `Lower Breakout: $${price.toFixed(2)}`,
      upperTarget1: `Target 1: $${price.toFixed(2)} (+50%)`,
      upperTarget2: `Target 2: $${price.toFixed(2)} (+100%)`,
      lowerTarget1: `Target 1: $${price.toFixed(2)} (-50%)`,
      lowerTarget2: `Target 2: $${price.toFixed(2)} (-100%)`,
      currentPrice: `Current: $${price.toFixed(2)}`
    };
    return labels[zone as keyof typeof labels] || `$${price.toFixed(2)}`;
  };

  const isPriceInDangerZone = (): boolean => {
    if (!mondayRange) return false;
    
    const { high, low, breakoutLevels } = mondayRange;
    const range = high - low;
    const buffer = range * 0.05; // 5% buffer
    
    return (
      currentPrice > high - buffer && currentPrice < breakoutLevels.upperBreakout ||
      currentPrice < low + buffer && currentPrice > breakoutLevels.lowerBreakout
    );
  };

  const getMarketZoneDescription = (): { zone: string; description: string; color: string } => {
    if (!mondayRange) return { zone: 'Unknown', description: 'Loading...', color: '#8c8c8c' };

    const { high, low, breakoutLevels } = mondayRange;
    
    if (currentPrice > breakoutLevels.upperBreakout) {
      return {
        zone: 'BREAKOUT ZONE',
        description: 'Price has broken above Monday\'s high - bullish momentum',
        color: '#52c41a'
      };
    } else if (currentPrice < breakoutLevels.lowerBreakout) {
      return {
        zone: 'BREAKDOWN ZONE',
        description: 'Price has broken below Monday\'s low - bearish momentum',
        color: '#ff4d4f'
      };
    } else if (currentPrice > high) {
      return {
        zone: 'UPPER BATTLE ZONE',
        description: 'Above Monday high but below breakout level - critical zone',
        color: '#faad14'
      };
    } else if (currentPrice < low) {
      return {
        zone: 'LOWER BATTLE ZONE',
        description: 'Below Monday low but above breakdown level - critical zone',
        color: '#faad14'
      };
    } else {
      return {
        zone: 'RANGE BOUND',
        description: 'Price trading within Monday\'s range - waiting for direction',
        color: '#1890ff'
      };
    }
  };

  const battleZoneInfo = getMarketZoneDescription();

  if (!mondayRange) {
    return (
      <Card className={className} loading>
        <Title level={4}>Loading Battle Zone...</Title>
      </Card>
    );
  }

  const markers = calculator.getBattleZoneMarkers();
  if (!markers) return null;

  const minPrice = Math.min(...priceHistory.map(d => d.price), markers.lowerTarget2) - 2;
  const maxPrice = Math.max(...priceHistory.map(d => d.price), markers.upperTarget2) + 2;

  return (
    <Card 
      className={`battle-zone-markers ${className}`}
      title={
        <Space>
          <AimOutlined />
          <span>Battle Zone Analysis</span>
          <Tag color={mondayRange.volatilityMode === 'BOSS_BATTLE' ? 'red' : 'blue'}>
            {mondayRange.volatilityMode}
          </Tag>
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="Show/hide target zones">
            <Switch
              size="small"
              checked={showAdvancedZones}
              onChange={setShowAdvancedZones}
              checkedChildren="All"
              unCheckedChildren="Basic"
            />
          </Tooltip>
          <Button 
            type="text" 
            icon={<SettingOutlined />}
            size="small"
          />
        </Space>
      }
    >
      {/* Current Zone Status */}
      <div className="mb-4">
        <Alert
          message={battleZoneInfo.zone}
          description={battleZoneInfo.description}
          type={isPriceInDangerZone() ? 'warning' : 'info'}
          showIcon
          icon={isPriceInDangerZone() ? <WarningOutlined /> : <InfoCircleOutlined />}
          style={{ borderColor: battleZoneInfo.color }}
        />
      </div>

      {/* Zone Markers Legend */}
      <Row gutter={[8, 8]} className="mb-4">
        <Col span={6}>
          <div className="text-center">
            <div 
              style={{ 
                height: '4px', 
                backgroundColor: getZoneColor('mondayHigh'),
                marginBottom: '4px'
              }}
            />
            <Text className="text-xs">Monday High</Text>
            <div className="font-semibold">${mondayRange.high.toFixed(2)}</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="text-center">
            <div 
              style={{ 
                height: '4px', 
                backgroundColor: getZoneColor('upperBreakout'),
                marginBottom: '4px'
              }}
            />
            <Text className="text-xs">Upper Breakout</Text>
            <div className="font-semibold">${markers.upperBreakout.toFixed(2)}</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="text-center">
            <div 
              style={{ 
                height: '4px', 
                backgroundColor: getZoneColor('lowerBreakout'),
                marginBottom: '4px'
              }}
            />
            <Text className="text-xs">Lower Breakout</Text>
            <div className="font-semibold">${markers.lowerBreakout.toFixed(2)}</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="text-center">
            <div 
              style={{ 
                height: '4px', 
                backgroundColor: getZoneColor('mondayLow'),
                marginBottom: '4px'
              }}
            />
            <Text className="text-xs">Monday Low</Text>
            <div className="font-semibold">${mondayRange.low.toFixed(2)}</div>
          </div>
        </Col>
      </Row>

      {/* Opacity Control */}
      <div className="mb-4">
        <Text className="text-xs">Zone Opacity: </Text>
        <Slider
          min={0.1}
          max={0.8}
          step={0.1}
          value={opacity}
          onChange={setOpacity}
          style={{ width: 100, display: 'inline-block', marginLeft: 8 }}
        />
      </div>

      {/* Price Chart with Battle Zones */}
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[minPrice, maxPrice]}
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <RechartsTooltip
              formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            
            {/* Main price line */}
            <Line
              type="monotone"
              dataKey="price"
              stroke="#1890ff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />

            {/* Monday Range Area */}
            <ReferenceArea
              y1={mondayRange.low}
              y2={mondayRange.high}
              fill="#e6f7ff"
              fillOpacity={opacity}
              stroke="#1890ff"
              strokeDasharray="2 2"
            />

            {/* Monday High/Low Lines */}
            <ReferenceLine
              y={mondayRange.high}
              stroke={getZoneColor('mondayHigh')}
              strokeWidth={2}
              strokeDasharray="5 5"
              label={showLabels ? { value: "Monday High", position: "topLeft" } : undefined}
            />
            <ReferenceLine
              y={mondayRange.low}
              stroke={getZoneColor('mondayLow')}
              strokeWidth={2}
              strokeDasharray="5 5"
              label={showLabels ? { value: "Monday Low", position: "bottomLeft" } : undefined}
            />

            {/* Breakout Lines */}
            <ReferenceLine
              y={markers.upperBreakout}
              stroke={getZoneColor('upperBreakout')}
              strokeWidth={2}
              label={showLabels ? { value: "Upper Breakout", position: "topRight" } : undefined}
            />
            <ReferenceLine
              y={markers.lowerBreakout}
              stroke={getZoneColor('lowerBreakout')}
              strokeWidth={2}
              label={showLabels ? { value: "Lower Breakout", position: "bottomRight" } : undefined}
            />

            {/* Current Price Line */}
            <ReferenceLine
              y={currentPrice}
              stroke={getZoneColor('currentPrice')}
              strokeWidth={3}
              label={showLabels ? { value: `Current: $${currentPrice.toFixed(2)}`, position: "topLeft" } : undefined}
            />

            {/* Target Lines (Advanced Zones) */}
            {showAdvancedZones && showTargets && (
              <>
                <ReferenceLine
                  y={markers.targets[0]}
                  stroke={getZoneColor('upperTarget1')}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                />
                <ReferenceLine
                  y={markers.targets[1]}
                  stroke={getZoneColor('upperTarget2')}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                />
                <ReferenceLine
                  y={markers.targets[2]}
                  stroke={getZoneColor('lowerTarget1')}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                />
                <ReferenceLine
                  y={markers.targets[3]}
                  stroke={getZoneColor('lowerTarget2')}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Battle Zone Stats */}
      <Row gutter={[16, 8]} className="mt-4">
        <Col span={8}>
          <div className="text-center">
            <Text type="secondary">Range Size</Text>
            <div className="text-lg font-semibold">
              {mondayRange.range.toFixed(2)} pts
            </div>
            <Text className="text-xs">
              {mondayRange.volatilityMode === 'BOSS_BATTLE' ? 'High Vol' : 'Normal Vol'}
            </Text>
          </div>
        </Col>
        <Col span={8}>
          <div className="text-center">
            <Text type="secondary">From High</Text>
            <div className="text-lg font-semibold">
              {(mondayRange.high - currentPrice).toFixed(2)} pts
            </div>
            <Text className="text-xs">
              {((mondayRange.high - currentPrice) / mondayRange.high * 100).toFixed(1)}%
            </Text>
          </div>
        </Col>
        <Col span={8}>
          <div className="text-center">
            <Text type="secondary">From Low</Text>
            <div className="text-lg font-semibold">
              {(currentPrice - mondayRange.low).toFixed(2)} pts
            </div>
            <Text className="text-xs">
              {((currentPrice - mondayRange.low) / mondayRange.low * 100).toFixed(1)}%
            </Text>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default BattleZoneMarkers;