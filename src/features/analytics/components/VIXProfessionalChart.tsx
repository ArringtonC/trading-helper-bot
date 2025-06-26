import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, Row, Col, Button, Space, Typography, Tag, Statistic, Switch, Select, message, Upload } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  ReloadOutlined,
  FullscreenOutlined,
  SettingOutlined,
  UploadOutlined,
  DownloadOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import VIXDataService from '../../market-data/services/VIXDataService';

const { Title, Text } = Typography;
const { Option } = Select;

interface VIXDataPoint {
  date: string;
  vix: number;
  signal?: 'BUY' | 'SELL' | 'HEDGE' | 'HOLD';
  regime?: 'BULL' | 'BEAR' | 'NEUTRAL' | 'VOLATILE';
  confidence?: number;
}

interface VIXProfessionalChartProps {
  data?: VIXDataPoint[];
  width?: number;
  height?: number;
  realTime?: boolean;
}

const VIXProfessionalChart: React.FC<VIXProfessionalChartProps> = ({ 
  data = [], 
  width = 1200, 
  height = 600,
  realTime = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initializedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeframe, setTimeframe] = useState('1D');
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [currentSignal, setCurrentSignal] = useState('');
  const [vixData, setVixData] = useState<VIXDataPoint[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataSource, setDataSource] = useState<'live' | 'fallback'>('live');
  
  const vixService = VIXDataService.getInstance();

  // Handle CSV file upload for VIX data
  const handleVIXUpload: UploadProps['customRequest'] = ({ file, onSuccess, onError }) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        // Handle different line break formats and literal \n text
        const normalizedCsv = csv.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = normalizedCsv.split('\n');
        const vixDataFromCsv: VIXDataPoint[] = [];

        // Skip header row, parse CSV data
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const columns = line.split(',');
          if (columns.length >= 2) {
            const date = columns[0].trim();
            const vixValue = parseFloat(columns[1].trim());

            if (!isNaN(vixValue) && date) {
              const signal = vixValue < 16 ? 'BUY' : 
                           vixValue > 30 ? 'SELL' : 
                           vixValue > 25 ? 'HEDGE' : 'HOLD';
              
              vixDataFromCsv.push({
                date: date,
                vix: vixValue,
                signal: signal,
                regime: vixValue < 20 ? 'BULL' : vixValue > 30 ? 'BEAR' : 'NEUTRAL',
                confidence: 0.9
              });
            }
          }
        }

        if (vixDataFromCsv.length > 0) {
          setVixData(vixDataFromCsv);
          setDataSource('live');
          const lastPoint = vixDataFromCsv[vixDataFromCsv.length - 1];
          setCurrentPrice(lastPoint.vix);
          setCurrentSignal(lastPoint.signal || '');
          message.success(`Imported ${vixDataFromCsv.length} VIX data points from CSV`);
          onSuccess?.(file);
        } else {
          throw new Error('No valid VIX data found in CSV');
        }
      } catch (error) {
        console.error('CSV parsing error:', error);
        message.error('Failed to parse CSV file. Expected format: Date,VIX');
        onError?.(error as Error);
      }
    };
    reader.readAsText(file as File);
  };

  // Export VIX data to CSV with descriptive explanations
  const exportVIXData = () => {
    if (vixData.length === 0) {
      message.warning('No data to export');
      return;
    }

    const getSignalDescription = (signal: string) => {
      switch (signal) {
        case 'BUY': return 'Complacency - Enter positions';
        case 'HOLD': return 'Normal - Maintain positions';
        case 'HEDGE': return 'Elevated fear - Add protection';
        case 'SELL': return 'Panic - Reduce exposure';
        default: return '';
      }
    };

    const getFearLevel = (vix: number) => {
      if (vix < 16) return 'LOW';
      if (vix < 20) return 'MODERATE';
      if (vix < 25) return 'HIGH';
      if (vix < 30) return 'ELEVATED';
      return 'EXTREME';
    };

    const getMarketSentiment = (vix: number) => {
      if (vix < 16) return 'Market complacent - Investors feel secure';
      if (vix < 20) return 'Normal conditions - Balanced sentiment';
      if (vix < 25) return 'Increased anxiety - Investors nervous';
      if (vix < 30) return 'High stress - Market fear elevated';
      return 'Panic mode - Extreme fear and uncertainty';
    };

    const csvHeader = 'Date,VIX,Signal,Signal_Description,Regime,Fear_Level,Market_Sentiment,Confidence\n';
    const csvData = vixData.map(point => {
      const signal = point.signal || '';
      const signalDesc = getSignalDescription(signal);
      const fearLevel = getFearLevel(point.vix);
      const sentiment = getMarketSentiment(point.vix);
      
      return `${point.date},${point.vix.toFixed(2)},${signal},"${signalDesc}",${point.regime || ''},${fearLevel},"${sentiment}",${(point.confidence || 0).toFixed(3)}`;
    }).join('\n');

    const csvContent = csvHeader + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vix-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('Enhanced VIX analysis exported successfully');
  };

  // Generate mock VIX data with trading signals - removed useCallback to prevent infinite loops
  const generateVIXData = () => {
    const mockData: VIXDataPoint[] = [];
    const now = new Date();
    
    for (let i = 90; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const vix = 15 + Math.random() * 25; // VIX range 15-40
      
      // Determine signal based on VIX level
      let signal: VIXDataPoint['signal'];
      let regime: VIXDataPoint['regime'];
      
      if (vix < 16) {
        signal = 'BUY';
        regime = 'BULL';
      } else if (vix > 30) {
        signal = 'SELL';
        regime = 'BEAR';
      } else if (vix > 25) {
        signal = 'HEDGE';
        regime = 'VOLATILE';
      } else if (vix < 20) {
        signal = 'HOLD';
        regime = 'NEUTRAL';
      }
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        vix,
        signal,
        regime,
        confidence: 0.7 + Math.random() * 0.3
      });
    }
    
    return mockData;
  };

  // Load real VIX data
  const loadVIXData = async () => {
    if (isLoadingData) return;
    
    setIsLoadingData(true);
    try {
      // Determine number of days based on timeframe
      const days = timeframe === '1D' ? 1 : 
                   timeframe === '1W' ? 7 :
                   timeframe === '1M' ? 30 : 90;

      const historicalData = await vixService.getHistoricalVIX(days);
      
      if (historicalData.length > 0) {
        setVixData(historicalData);
        setDataSource('live');
        const lastPoint = historicalData[historicalData.length - 1];
        setCurrentPrice(lastPoint.vix);
        setCurrentSignal(lastPoint.signal || '');
        console.log(`Loaded ${historicalData.length} real VIX data points`);
      } else {
        throw new Error('No VIX data received');
      }
    } catch (error) {
      console.error('Failed to load real VIX data:', error);
      message.warning('Using fallback data - live VIX data unavailable');
      setDataSource('fallback');
      
      // Fallback to mock data
      const fallbackData = generateVIXData();
      setVixData(fallbackData);
      const lastPoint = fallbackData[fallbackData.length - 1];
      if (lastPoint) {
        setCurrentPrice(lastPoint.vix);
        setCurrentSignal(lastPoint.signal || '');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  // Memoize mock data to prevent regeneration on every render
  const initialMockData = useMemo(() => generateVIXData(), []);

  // Initialize data only once when component mounts
  useEffect(() => {
    if (!initializedRef.current) {
      if (data && data.length > 0) {
        setVixData(data);
        const lastPoint = data[data.length - 1];
        if (lastPoint) {
          setCurrentPrice(lastPoint.vix);
          setCurrentSignal(lastPoint.signal || '');
        }
      } else {
        // Load real VIX data instead of mock data
        loadVIXData();
      }
      initializedRef.current = true;
    }
  }, []); // Empty dependency array - only run once on mount

  // Separate effect for external data updates
  useEffect(() => {
    if (initializedRef.current && data && data.length > 0) {
      setVixData(data);
      const lastPoint = data[data.length - 1];
      if (lastPoint) {
        setCurrentPrice(lastPoint.vix);
        setCurrentSignal(lastPoint.signal || '');
      }
    }
  }, [data]);

  // Reload data when timeframe changes
  useEffect(() => {
    if (initializedRef.current && (!data || data.length === 0)) {
      loadVIXData();
    }
  }, [timeframe]);

  const drawChart = () => {
    if (!canvasRef.current || !vixData.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clean Chart Colors
    const bgColor = '#ffffff';
    const gridColor = '#e6e6e6';
    const vixColor = '#1890ff';
    const textColor = '#333333';
    const titleColor = '#262626';
    const buyColor = '#52c41a';
    const sellColor = '#f5222d';
    const hedgeColor = '#faad14';
    const holdColor = '#1890ff';

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Chart dimensions
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Calculate VIX range
    const vixValues = vixData.map(d => d.vix);
    const minVix = Math.min(...vixValues);
    const maxVix = Math.max(...vixValues);
    const vixRange = maxVix - minVix;
    const vixPadding = vixRange * 0.1;

    // Draw grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (VIX levels)
    const gridLevels = [10, 15, 20, 25, 30, 35, 40];
    gridLevels.forEach(level => {
      if (level >= minVix - vixPadding && level <= maxVix + vixPadding) {
        const y = padding + chartHeight - ((level - (minVix - vixPadding)) / (vixRange + 2 * vixPadding)) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        
        // VIX level labels
        ctx.fillStyle = textColor;
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(level.toString(), padding - 10, y + 4);
      }
    });

    // Vertical grid lines (time)
    const timeSteps = 10;
    for (let i = 0; i <= timeSteps; i++) {
      const x = padding + (i / timeSteps) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw VIX line
    ctx.strokeStyle = vixColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    vixData.forEach((point, index) => {
      const x = padding + (index / (vixData.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((point.vix - (minVix - vixPadding)) / (vixRange + 2 * vixPadding)) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw signal annotations
    if (showAnnotations) {
      vixData.forEach((point, index) => {
        if (!point.signal) return;
        
        const x = padding + (index / (vixData.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((point.vix - (minVix - vixPadding)) / (vixRange + 2 * vixPadding)) * chartHeight;
        
        // Signal color
        let signalColor = textColor;
        switch (point.signal) {
          case 'BUY': signalColor = buyColor; break;
          case 'SELL': signalColor = sellColor; break;
          case 'HEDGE': signalColor = hedgeColor; break;
          case 'HOLD': signalColor = holdColor; break;
        }
        
        // Draw signal marker
        ctx.fillStyle = signalColor;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw signal text
        ctx.fillStyle = signalColor;
        ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(point.signal, x, y - 15);
      });
    }

    // Draw reference lines for key VIX levels
    const refLevels = [
      { level: 16, color: buyColor, label: 'BUY ZONE' },
      { level: 25, color: hedgeColor, label: 'HEDGE ZONE' },
      { level: 30, color: sellColor, label: 'SELL ZONE' }
    ];

    refLevels.forEach(ref => {
      if (ref.level >= minVix - vixPadding && ref.level <= maxVix + vixPadding) {
        const y = padding + chartHeight - ((ref.level - (minVix - vixPadding)) / (vixRange + 2 * vixPadding)) * chartHeight;
        
        ctx.strokeStyle = ref.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Zone label
        ctx.fillStyle = ref.color;
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(ref.label, padding + 10, y - 5);
      }
    });

    // Draw title
    ctx.fillStyle = titleColor;
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('VIX Volatility Index', padding, 25);

    // Time labels
    ctx.fillStyle = textColor;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    
    const startDate = new Date(vixData[0]?.date || '');
    const endDate = new Date(vixData[vixData.length - 1]?.date || '');
    
    ctx.fillText(startDate.toLocaleDateString(), padding, height - 15);
    ctx.fillText(endDate.toLocaleDateString(), width - padding, height - 15);

  };

  // Single useEffect for drawing chart with stable dependencies
  useEffect(() => {
    drawChart();
  }, [vixData, width, height, showAnnotations]);

  // Real-time updates using VIX service
  useEffect(() => {
    if (!isPlaying || !realTime) return;

    const interval = setInterval(async () => {
      try {
        if (dataSource === 'live') {
          // Try to get real-time VIX data
          const realTimeData = await vixService.getRealTimeVIX();
          
          setCurrentPrice(realTimeData.vix);
          setCurrentSignal(realTimeData.signal || '');
          
          // Add new data point and update VIX data
          setVixData(prev => [...prev.slice(1), realTimeData]);
          
          console.log('Real-time VIX update:', realTimeData.vix);
        } else {
          // Fallback to mock updates
          const newVix = 15 + Math.random() * 25;
          let newSignal: VIXDataPoint['signal'];
          
          if (newVix < 16) newSignal = 'BUY';
          else if (newVix > 30) newSignal = 'SELL';
          else if (newVix > 25) newSignal = 'HEDGE';
          else if (newVix < 20) newSignal = 'HOLD';
          
          setCurrentPrice(newVix);
          setCurrentSignal(newSignal || '');
          
          const newPoint: VIXDataPoint = {
            date: new Date().toISOString().split('T')[0],
            vix: newVix,
            signal: newSignal,
            regime: newVix < 20 ? 'BULL' : newVix > 30 ? 'BEAR' : 'NEUTRAL'
          };
          setVixData(prev => [...prev.slice(1), newPoint]);
        }
      } catch (error) {
        console.error('Real-time VIX update failed:', error);
        // Continue with existing data
      }
    }, 30000); // Update every 30 seconds for real data (API rate limits)

    return () => clearInterval(interval);
  }, [isPlaying, realTime, dataSource]);

  return (
    <Card title="VIX Volatility Chart with Trading Signals" style={{ margin: 0 }}>
      {/* Simple Controls */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type={isPlaying ? 'default' : 'primary'}
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? 'Pause' : 'Live Updates'}
          </Button>
          
          <Select
            value={timeframe}
            onChange={setTimeframe}
            style={{ width: 100 }}
          >
            <Option value="1D">1 Day</Option>
            <Option value="1W">1 Week</Option>
            <Option value="1M">1 Month</Option>
            <Option value="3M">3 Months</Option>
          </Select>
          
          <Switch
            checked={showAnnotations}
            onChange={setShowAnnotations}
            checkedChildren="Signals ON"
            unCheckedChildren="Signals OFF"
          />
          
          <Button 
            icon={<ReloadOutlined />}
            loading={isLoadingData}
            onClick={() => {
              vixService.clearCache();
              loadVIXData();
            }}
          >
            Refresh Data
          </Button>
          
          <Tag color={dataSource === 'live' ? 'green' : 'orange'}>
            {dataSource === 'live' ? '📡 Live Data' : '⚠️ Fallback Data'}
          </Tag>
          
          <Upload
            customRequest={handleVIXUpload}
            accept=".csv"
            showUploadList={false}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>
              Import CSV
            </Button>
          </Upload>
          
          <Button 
            icon={<DownloadOutlined />}
            onClick={exportVIXData}
          >
            Export CSV
          </Button>
          
          <Button 
            icon={<QuestionCircleOutlined />}
            onClick={() => window.open('/scripts/vix-scraper-help.html', '_blank')}
            title="Need help getting VIX data? Click for step-by-step guide!"
          >
            Help
          </Button>
        </Space>
      </div>

      {/* Current Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic
            title="Current VIX"
            value={currentPrice.toFixed(2)}
            valueStyle={{ 
              color: currentPrice < 16 ? '#52c41a' : 
                     currentPrice > 30 ? '#f5222d' : 
                     currentPrice > 25 ? '#faad14' : '#1890ff'
            }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Signal"
            value={currentSignal || 'NONE'}
            valueStyle={{ 
              color: currentSignal === 'BUY' ? '#52c41a' : 
                     currentSignal === 'SELL' ? '#f5222d' :
                     currentSignal === 'HEDGE' ? '#faad14' : '#1890ff'
            }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Fear Level"
            value={currentPrice < 16 ? 'LOW' : currentPrice > 30 ? 'EXTREME' : currentPrice > 25 ? 'HIGH' : 'MODERATE'}
            valueStyle={{ color: '#666' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Last Update"
            value={new Date().toLocaleTimeString()}
            valueStyle={{ fontSize: 14, color: '#666' }}
          />
        </Col>
      </Row>

      {/* Signal Explanation Card */}
      <Card 
        size="small" 
        title="📊 Current Market Interpretation" 
        style={{ marginBottom: 16, backgroundColor: '#f9f9f9' }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ padding: '8px' }}>
              <Text strong style={{ fontSize: '16px' }}>
                {currentSignal === 'BUY' && '🟢 BUY Signal Active'}
                {currentSignal === 'SELL' && '🔴 SELL Signal Active'}
                {currentSignal === 'HEDGE' && '🟡 HEDGE Signal Active'}
                {currentSignal === 'HOLD' && '🔵 HOLD Signal Active'}
                {!currentSignal && '⚪ No Signal'}
              </Text>
              <br />
              <Text type="secondary">
                {currentSignal === 'BUY' && 'Low fear environment - Good time to enter long positions'}
                {currentSignal === 'SELL' && 'High fear/panic - Consider reducing positions or going short'}
                {currentSignal === 'HEDGE' && 'Elevated volatility - Protect positions with hedges'}
                {currentSignal === 'HOLD' && 'Normal volatility - Maintain current positions'}
                {!currentSignal && 'Waiting for clear signal...'}
              </Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '8px' }}>
              <Text strong>Market Sentiment:</Text>
              <br />
              <Text>
                {currentPrice < 16 && '😌 Market is complacent - Investors feel secure'}
                {currentPrice >= 16 && currentPrice < 20 && '😐 Normal market conditions - Balanced sentiment'}
                {currentPrice >= 20 && currentPrice < 25 && '😟 Increased anxiety - Investors becoming nervous'}
                {currentPrice >= 25 && currentPrice < 30 && '😰 High stress - Market fear is elevated'}
                {currentPrice >= 30 && '😱 Panic mode - Extreme fear and uncertainty'}
              </Text>
            </div>
          </Col>
        </Row>
        
        {/* Detailed Action Recommendations */}
        <div style={{ 
          marginTop: 12, 
          padding: 12, 
          backgroundColor: currentSignal === 'BUY' ? '#f6ffed' : 
                           currentSignal === 'SELL' ? '#fff2f0' :
                           currentSignal === 'HEDGE' ? '#fffbf0' : '#f0f5ff',
          borderRadius: 6,
          border: `1px solid ${currentSignal === 'BUY' ? '#b7eb8f' : 
                                currentSignal === 'SELL' ? '#ffa39e' :
                                currentSignal === 'HEDGE' ? '#ffd591' : '#91d5ff'}`
        }}>
          <Text strong>💡 Recommended Actions:</Text>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {currentSignal === 'BUY' && (
              <>
                <li>Consider initiating new long positions</li>
                <li>Good time to buy quality stocks at discounts</li>
                <li>Low volatility = cheaper option premiums</li>
                <li>Market complacency often precedes upward moves</li>
              </>
            )}
            {currentSignal === 'SELL' && (
              <>
                <li>Consider reducing position sizes</li>
                <li>Take profits on winning positions</li>
                <li>Avoid new long positions in this environment</li>
                <li>Consider put options or inverse ETFs for protection</li>
              </>
            )}
            {currentSignal === 'HEDGE' && (
              <>
                <li>Buy protective puts on existing positions</li>
                <li>Consider VIX calls as portfolio insurance</li>
                <li>Reduce position sizes if overexposed</li>
                <li>Prepare for potential market volatility</li>
              </>
            )}
            {currentSignal === 'HOLD' && (
              <>
                <li>Maintain current portfolio allocation</li>
                <li>Normal market conditions - no urgency to act</li>
                <li>Good time for systematic investing (DCA)</li>
                <li>Monitor for changes in volatility regime</li>
              </>
            )}
          </ul>
        </div>
      </Card>

      {/* Main Chart */}
      <div style={{ position: 'relative', background: '#fff', border: '1px solid #d9d9d9' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', background: '#fff' }}
        />
        
        {/* Collapsible Trading Legend */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          fontSize: '12px'
        }}>
          {showAnnotations ? (
            <div style={{
              background: 'rgba(255,255,255,0.97)',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '280px'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: 8, 
                color: '#262626',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }} onClick={() => setShowAnnotations(false)}>
                📊 VIX Trading Signals
                <span style={{ fontSize: '16px', opacity: 0.6 }}>✕</span>
              </div>
            <div style={{ color: '#52c41a', marginBottom: 6, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', marginRight: '8px' }}>●</span>
              <div>
                <strong>BUY: VIX &lt; 16</strong>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>Complacency - Enter positions</div>
              </div>
            </div>
            <div style={{ color: '#1890ff', marginBottom: 6, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', marginRight: '8px' }}>●</span>
              <div>
                <strong>HOLD: VIX 16-20</strong>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>Normal - Maintain positions</div>
              </div>
            </div>
            <div style={{ color: '#faad14', marginBottom: 6, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', marginRight: '8px' }}>●</span>
              <div>
                <strong>HEDGE: VIX 20-30</strong>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>Elevated fear - Add protection</div>
              </div>
            </div>
            <div style={{ color: '#f5222d', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', marginRight: '8px' }}>●</span>
              <div>
                <strong>SELL: VIX &gt; 30</strong>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>Panic - Reduce exposure</div>
              </div>
            </div>
            <div style={{ 
              marginTop: 10, 
              paddingTop: 8, 
              borderTop: '1px solid #f0f0f0',
              fontSize: '10px',
              color: '#666'
            }}>
              💡 VIX measures market fear & volatility
            </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }} onClick={() => setShowAnnotations(true)}>
              📊 Signals
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default VIXProfessionalChart;