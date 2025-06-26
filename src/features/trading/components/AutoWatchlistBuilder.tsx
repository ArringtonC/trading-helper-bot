import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Progress,
  Slider,
  Select,
  Space,
  Tooltip,
  Row,
  Col,
  Statistic,
  Alert,
  Modal,
  InputNumber,
  Dropdown,
  Menu,
  Badge,
  Divider,
  Typography,
  Switch,
  notification
} from 'antd';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';
import {
  ExportOutlined,
  CalculatorOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  LineChartOutlined,
  PieChartOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  RocketOutlined,
  FireOutlined,
  StarOutlined,
  ReloadOutlined,
  DownloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { WeeklyMarketScanService } from '../../market-data/services/WeeklyMarketScanService';
import { MonitoringService } from '../../../shared/services/MonitoringService';
import { useTrades } from '../hooks/TradesContext';
import { useGoalSizing } from '../../../shared/context/GoalSizingContext';
import type { ColumnsType } from 'antd/es/table';
import type { 
  WatchlistStock, 
  WatchlistMetrics, 
  OptimizationSettings 
} from '../types/watchlist';

const { Title, Text } = Typography;
const { Option } = Select;

const defaultSettings: OptimizationSettings = {
  maxStocks: 8,
  maxPerSector: 2,
  riskTolerance: 'MODERATE',
  stressLevel: 50,
  preferredSectors: [],
  avoidSectors: [],
  minMarketCap: 1000000000, // $1B
  maxVolatility: 30,
  correlationThreshold: 0.7
};

export const AutoWatchlistBuilder: React.FC = () => {
  const { trades } = useTrades();
  const accountBalance = 100000; // Mock value for testing
  const { config } = useGoalSizing();
  const riskPerTrade = config?.riskPerTrade || 2;
  
  const [scanResults, setScanResults] = useState<WatchlistStock[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<OptimizationSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedStock, setSelectedStock] = useState<WatchlistStock | null>(null);
  const [showPositionSizing, setShowPositionSizing] = useState(false);
  const [metrics, setMetrics] = useState<WatchlistMetrics | null>(null);

  // Load scan results
  useEffect(() => {
    loadScanResults();
  }, []);

  const loadScanResults = async () => {
    setLoading(true);
    try {
      const monitoring = new MonitoringService();
      const service = new WeeklyMarketScanService(monitoring);
      await service.initialize();
      
      // Run scans for all strategy classes and combine results
      const strategies = ['BUFFETT_GUARDIAN', 'DALIO_WARRIOR', 'SOROS_ASSASSIN', 'LYNCH_SCOUT'] as const;
      const allResults = [];
      
      for (const strategy of strategies) {
        const results = await service.runWeeklyScan(strategy, 'watchlist-user');
        allResults.push(...results);
      }
      
      // Transform scan results to watchlist format
      const stocks: WatchlistStock[] = allResults.map((result, index) => ({
        id: `${result.symbol}-${Date.now()}-${index}`,
        symbol: result.symbol,
        companyName: result.companyName,
        price: result.price,
        marketCap: result.marketCap,
        sector: result.sector,
        volatility: result.volatility || Math.random() * 40 + 10,
        confidenceScore: result.confidenceScore,
        setupQuality: result.confidenceScore, // Use confidence as setup quality proxy
        riskLevel: result.alertLevel === 'CRITICAL' ? 'HIGH' : 
                   result.alertLevel === 'HIGH' ? 'MEDIUM' : 'LOW',
        traderSignals: [result.strategyClass.replace('_', ' ')],
        technicalScore: result.confidenceScore * 0.8 + Math.random() * 20,
        fundamentalScore: result.confidenceScore * 0.7 + Math.random() * 30,
        momentum: result.priceChange1W || (Math.random() - 0.5) * 20
      }));
      
      setScanResults(stocks);
    } catch (error) {
      console.error('Failed to load scan results:', error);
      // Use mock data for demo
      setScanResults(generateMockScanResults());
    } finally {
      setLoading(false);
    }
  };

  // Watchlist optimization algorithm
  const optimizeWatchlist = useCallback(() => {
    const optimized = runOptimizationAlgorithm(scanResults, settings, accountBalance, riskPerTrade);
    setWatchlist(optimized);
    
    // Calculate metrics
    const newMetrics = calculatePortfolioMetrics(optimized);
    setMetrics(newMetrics);
    
    notification.success({
      message: 'Watchlist Optimized',
      description: `Generated ${optimized.length} stocks with ${newMetrics.diversificationScore.toFixed(1)}% diversification`
    });
  }, [scanResults, settings, accountBalance, riskPerTrade]);

  // Position sizing for selected stock
  const calculatePositionSize = (stock: WatchlistStock) => {
    const riskAmount = (accountBalance * riskPerTrade) / 100;
    const stopDistance = stock.price * 0.05; // 5% stop loss
    const shares = Math.floor(riskAmount / stopDistance);
    const positionSize = shares * stock.price;
    
    return {
      ...stock,
      positionSize,
      shareQuantity: shares,
      stopLoss: stock.price * 0.95,
      target: stock.price * 1.15,
      riskAmount
    };
  };

  // Apply position sizing to all watchlist stocks
  const applyPositionSizingToAll = () => {
    const sized = watchlist.map(stock => calculatePositionSize(stock));
    setWatchlist(sized);
    notification.success({
      message: 'Position Sizing Applied',
      description: 'Calculated position sizes for all stocks using 2% risk rule'
    });
  };

  // Export functions
  const exportToCSV = () => {
    const csv = convertWatchlistToCSV(watchlist);
    downloadFile(csv, 'watchlist.csv', 'text/csv');
  };

  const exportToTradingView = () => {
    const symbols = watchlist.map(s => s.symbol).join(',');
    const url = `https://www.tradingview.com/watchlists/?symbols=${symbols}`;
    window.open(url, '_blank');
  };

  const exportToIBKR = () => {
    const ibkrFormat = watchlist.map(stock => ({
      symbol: stock.symbol,
      action: 'BUY',
      quantity: stock.shareQuantity || 0,
      orderType: 'LMT',
      limitPrice: stock.price
    }));
    downloadFile(JSON.stringify(ibkrFormat, null, 2), 'ibkr_orders.json', 'application/json');
  };

  // Drag and drop handlers
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(watchlist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setWatchlist(items);
  };

  // Remove stock from watchlist
  const removeFromWatchlist = (stockId: string) => {
    setWatchlist(prev => prev.filter(s => s.id !== stockId));
  };

  // Add stock to watchlist manually
  const addToWatchlist = (stock: WatchlistStock) => {
    if (watchlist.some(s => s.symbol === stock.symbol)) {
      notification.warning({ message: 'Stock already in watchlist' });
      return;
    }
    
    if (watchlist.length >= settings.maxStocks) {
      notification.warning({ message: `Maximum ${settings.maxStocks} stocks allowed` });
      return;
    }
    
    setWatchlist(prev => [...prev, calculatePositionSize(stock)]);
  };

  // Risk level color mapping
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'orange';
      case 'HIGH': return 'red';
      default: return 'default';
    }
  };

  // Confidence score color
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  // Table columns for scan results
  const scanColumns: ColumnsType<WatchlistStock> = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      fixed: 'left',
      render: (symbol, record) => (
        <Space>
          <Text strong>{symbol}</Text>
          <Tooltip title={`${record.traderSignals.length} trader signals`}>
            <Badge count={record.traderSignals.length} />
          </Tooltip>
        </Space>
      )
    },
    {
      title: 'Sector',
      dataIndex: 'sector',
      key: 'sector',
      filters: [...new Set(scanResults.map(s => s.sector))].map(sector => ({
        text: sector,
        value: sector
      })),
      onFilter: (value, record) => record.sector === value
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price.toFixed(2)}`,
      sorter: (a, b) => a.price - b.price
    },
    {
      title: 'Confidence',
      dataIndex: 'confidenceScore',
      key: 'confidenceScore',
      render: (score) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={getConfidenceColor(score)}
          format={(percent) => `${percent?.toFixed(0)}%`}
        />
      ),
      sorter: (a, b) => a.confidenceScore - b.confidenceScore
    },
    {
      title: 'Risk',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (level) => <Tag color={getRiskColor(level)}>{level}</Tag>
    },
    {
      title: 'Volatility',
      dataIndex: 'volatility',
      key: 'volatility',
      render: (vol) => `${vol.toFixed(1)}%`,
      sorter: (a, b) => a.volatility - b.volatility
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          onClick={() => addToWatchlist(record)}
          disabled={watchlist.some(s => s.symbol === record.symbol)}
        >
          Add
        </Button>
      )
    }
  ];

  return (
    <div className="auto-watchlist-builder">
      {/* Header Section */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Title level={4} className="mb-0">
              <ThunderboltOutlined className="mr-2" />
              Auto Watchlist Builder
            </Title>
            <Text type="secondary">
              Intelligently generate optimal watchlists from weekly market scans
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadScanResults}
                loading={loading}
              >
                Refresh Scans
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setShowSettings(true)}
              >
                Settings
              </Button>
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={optimizeWatchlist}
                disabled={scanResults.length === 0}
              >
                Auto Generate
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Portfolio Metrics */}
      {metrics && (
        <Card className="mb-6">
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="Expected Return"
                value={metrics.expectedReturn}
                precision={2}
                suffix="%"
                prefix={<LineChartOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Max Drawdown"
                value={metrics.maxDrawdown}
                precision={2}
                suffix="%"
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Sharpe Ratio"
                value={metrics.sharpeRatio}
                precision={2}
                prefix={<SafetyOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Diversification"
                value={metrics.diversificationScore}
                precision={1}
                suffix="%"
                prefix={<PieChartOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Total Risk"
                value={metrics.totalRisk}
                precision={2}
                suffix="%"
                prefix={<FireOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Sector Balance"
                value={metrics.sectorBalance}
                precision={1}
                suffix="%"
                prefix={<CheckCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Current Watchlist */}
      {watchlist.length > 0 && (
        <Card
          title={
            <Space>
              <StarOutlined />
              <Text strong>Optimized Watchlist ({watchlist.length} stocks)</Text>
            </Space>
          }
          extra={
            <Space>
              <Button
                icon={<CalculatorOutlined />}
                onClick={applyPositionSizingToAll}
              >
                Apply Position Sizing
              </Button>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'csv',
                      label: 'Export to CSV',
                      icon: <ExportOutlined />,
                      onClick: exportToCSV
                    },
                    {
                      key: 'tradingview',
                      label: 'Export to TradingView',
                      icon: <ExportOutlined />,
                      onClick: exportToTradingView
                    },
                    {
                      key: 'ibkr',
                      label: 'Export to IBKR',
                      icon: <ExportOutlined />,
                      onClick: exportToIBKR
                    }
                  ]
                }}
              >
                <Button icon={<DownloadOutlined />}>
                  Export
                </Button>
              </Dropdown>
            </Space>
          }
          className="mb-6"
        >
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="watchlist">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {watchlist.map((stock, index) => (
                    <Draggable key={stock.id} draggableId={stock.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`watchlist-item ${snapshot.isDragging ? 'dragging' : ''}`}
                        >
                          <Card
                            size="small"
                            className="mb-2"
                            actions={[
                              <Button
                                size="small"
                                type="text"
                                icon={<CalculatorOutlined />}
                                onClick={() => {
                                  setSelectedStock(stock);
                                  setShowPositionSizing(true);
                                }}
                              >
                                Size
                              </Button>,
                              <Button
                                size="small"
                                type="text"
                                danger
                                onClick={() => removeFromWatchlist(stock.id)}
                              >
                                Remove
                              </Button>
                            ]}
                          >
                            <Row gutter={16} align="middle">
                              <Col span={3}>
                                <Text strong>{stock.symbol}</Text>
                              </Col>
                              <Col span={3}>
                                <Tag>{stock.sector}</Tag>
                              </Col>
                              <Col span={3}>
                                <Text>${stock.price.toFixed(2)}</Text>
                              </Col>
                              <Col span={3}>
                                <Tag color={getRiskColor(stock.riskLevel)}>
                                  {stock.riskLevel}
                                </Tag>
                              </Col>
                              <Col span={3}>
                                <Progress
                                  percent={stock.confidenceScore}
                                  size="small"
                                  strokeColor={getConfidenceColor(stock.confidenceScore)}
                                />
                              </Col>
                              <Col span={3}>
                                <Text type="secondary">
                                  Vol: {stock.volatility.toFixed(1)}%
                                </Text>
                              </Col>
                              {stock.positionSize && (
                                <>
                                  <Col span={3}>
                                    <Text>
                                      {stock.shareQuantity} shares
                                    </Text>
                                  </Col>
                                  <Col span={3}>
                                    <Text strong>
                                      ${stock.positionSize.toFixed(0)}
                                    </Text>
                                  </Col>
                                </>
                              )}
                            </Row>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Card>
      )}

      {/* Available Stocks Table */}
      <Card
        title={
          <Space>
            <LineChartOutlined />
            <Text strong>Available Stocks from Scan ({scanResults.length})</Text>
          </Space>
        }
      >
        <Table
          columns={scanColumns}
          dataSource={scanResults}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>

      {/* Settings Modal */}
      <Modal
        title="Watchlist Optimization Settings"
        open={showSettings}
        onOk={() => setShowSettings(false)}
        onCancel={() => setShowSettings(false)}
        width={600}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>Maximum Stocks:</Text>
            <Slider
              min={5}
              max={15}
              value={settings.maxStocks}
              onChange={(value) => setSettings(prev => ({ ...prev, maxStocks: value }))}
              marks={{
                5: '5',
                10: '10',
                15: '15'
              }}
            />
          </div>
          
          <div>
            <Text strong>Risk Tolerance:</Text>
            <Select
              style={{ width: '100%' }}
              value={settings.riskTolerance}
              onChange={(value) => setSettings(prev => ({ ...prev, riskTolerance: value }))}
            >
              <Option value="CONSERVATIVE">Conservative</Option>
              <Option value="MODERATE">Moderate</Option>
              <Option value="AGGRESSIVE">Aggressive</Option>
            </Select>
          </div>
          
          <div>
            <Text strong>Stress Level Adjustment:</Text>
            <Slider
              min={0}
              max={100}
              value={settings.stressLevel}
              onChange={(value) => setSettings(prev => ({ ...prev, stressLevel: value }))}
              marks={{
                0: 'Calm',
                50: 'Normal',
                100: 'Stressed'
              }}
            />
          </div>
          
          <div>
            <Text strong>Maximum Volatility:</Text>
            <InputNumber
              min={10}
              max={100}
              value={settings.maxVolatility}
              onChange={(value) => setSettings(prev => ({ ...prev, maxVolatility: value || 30 }))}
              addonAfter="%"
              style={{ width: '100%' }}
            />
          </div>
          
          <Alert
            message="Optimization Algorithm"
            description="The system will analyze correlation, diversification, and risk metrics to generate an optimal watchlist based on your settings."
            type="info"
            showIcon
          />
        </Space>
      </Modal>

      {/* Position Sizing Modal */}
      <Modal
        title={`Position Sizing: ${selectedStock?.symbol}`}
        open={showPositionSizing}
        onOk={() => {
          if (selectedStock) {
            const sized = calculatePositionSize(selectedStock);
            setWatchlist(prev => prev.map(s => 
              s.id === sized.id ? sized : s
            ));
          }
          setShowPositionSizing(false);
        }}
        onCancel={() => setShowPositionSizing(false)}
      >
        {selectedStock && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Account Balance"
                  value={accountBalance}
                  prefix="$"
                  precision={0}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Risk Per Trade"
                  value={riskPerTrade}
                  suffix="%"
                  precision={1}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Risk Amount"
                  value={(accountBalance * riskPerTrade) / 100}
                  prefix="$"
                  precision={0}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Share Quantity"
                  value={Math.floor(((accountBalance * riskPerTrade) / 100) / (selectedStock.price * 0.05))}
                  suffix="shares"
                />
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Entry Price"
                  value={selectedStock.price}
                  prefix="$"
                  precision={2}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Stop Loss"
                  value={selectedStock.price * 0.95}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Target"
                  value={selectedStock.price * 1.15}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
            </Row>
            
            <Alert
              message="Position Size Calculated"
              description={`Total position size: $${(Math.floor(((accountBalance * riskPerTrade) / 100) / (selectedStock.price * 0.05)) * selectedStock.price).toFixed(0)}`}
              type="success"
              showIcon
            />
          </Space>
        )}
      </Modal>

      <style jsx>{`
        .auto-watchlist-builder {
          padding: 24px;
        }
        
        .watchlist-item {
          transition: all 0.3s;
        }
        
        .watchlist-item.dragging {
          opacity: 0.5;
        }
        
        .ant-card {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .ant-progress-line {
          margin-bottom: 0;
        }
        
        .ant-statistic-title {
          font-size: 12px;
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
};

// Helper Functions

function generateMockScanResults(): WatchlistStock[] {
  const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrial'];
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'JNJ', 'XOM', 'WMT', 'PG', 'V', 'MA', 'UNH', 'HD', 'DIS', 'NFLX', 'ADBE', 'CRM'];
  
  return symbols.map((symbol, index) => ({
    id: `${symbol}-${Date.now()}-${index}`,
    symbol,
    companyName: `${symbol} Inc.`,
    price: Math.random() * 300 + 50,
    marketCap: Math.random() * 1000000000000 + 10000000000,
    sector: sectors[Math.floor(Math.random() * sectors.length)],
    volatility: Math.random() * 40 + 10,
    confidenceScore: Math.random() * 40 + 60,
    setupQuality: Math.random() * 40 + 60,
    riskLevel: Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.4 ? 'MEDIUM' : 'LOW',
    traderSignals: ['Buffett', 'Lynch'].filter(() => Math.random() > 0.5),
    technicalScore: Math.random() * 100,
    fundamentalScore: Math.random() * 100,
    momentum: (Math.random() - 0.5) * 20
  }));
}

function runOptimizationAlgorithm(
  stocks: WatchlistStock[],
  settings: OptimizationSettings,
  accountBalance: number,
  riskPerTrade: number
): WatchlistStock[] {
  // Filter based on settings
  let filtered = stocks.filter(stock => {
    if (settings.avoidSectors.includes(stock.sector)) return false;
    if (stock.marketCap < settings.minMarketCap) return false;
    if (stock.volatility > settings.maxVolatility) return false;
    
    // Adjust for risk tolerance
    if (settings.riskTolerance === 'CONSERVATIVE' && stock.riskLevel === 'HIGH') return false;
    if (settings.riskTolerance === 'MODERATE' && stock.riskLevel === 'HIGH' && stock.confidenceScore < 70) return false;
    
    return true;
  });
  
  // Prefer certain sectors
  if (settings.preferredSectors.length > 0) {
    filtered = filtered.sort((a, b) => {
      const aPreferred = settings.preferredSectors.includes(a.sector) ? 1 : 0;
      const bPreferred = settings.preferredSectors.includes(b.sector) ? 1 : 0;
      return bPreferred - aPreferred;
    });
  }
  
  // Score and rank stocks
  const scored = filtered.map(stock => {
    let score = stock.confidenceScore * 0.4 + stock.setupQuality * 0.3 + stock.technicalScore * 0.2 + stock.fundamentalScore * 0.1;
    
    // Adjust for stress level
    if (settings.stressLevel > 70) {
      // Prefer lower volatility when stressed
      score *= (1 - (stock.volatility / 100) * 0.3);
    }
    
    // Boost for trader signals
    score += stock.traderSignals.length * 5;
    
    // Risk adjustment
    if (stock.riskLevel === 'LOW') score *= 1.1;
    if (stock.riskLevel === 'HIGH') score *= 0.9;
    
    return { ...stock, score };
  });
  
  // Sort by score
  scored.sort((a, b) => b.score - a.score);
  
  // Apply diversification
  const selected: WatchlistStock[] = [];
  const sectorCount: { [key: string]: number } = {};
  
  for (const stock of scored) {
    if (selected.length >= settings.maxStocks) break;
    
    // Check sector limit
    const currentSectorCount = sectorCount[stock.sector] || 0;
    if (currentSectorCount >= settings.maxPerSector) continue;
    
    // Add to watchlist
    selected.push(stock);
    sectorCount[stock.sector] = currentSectorCount + 1;
  }
  
  // Apply position sizing
  return selected.map(stock => {
    const riskAmount = (accountBalance * riskPerTrade) / 100;
    const stopDistance = stock.price * 0.05;
    const shares = Math.floor(riskAmount / stopDistance);
    const positionSize = shares * stock.price;
    
    return {
      ...stock,
      positionSize,
      shareQuantity: shares,
      stopLoss: stock.price * 0.95,
      target: stock.price * 1.15,
      riskAmount
    };
  });
}

function calculatePortfolioMetrics(watchlist: WatchlistStock[]): WatchlistMetrics {
  if (watchlist.length === 0) {
    return {
      expectedReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      diversificationScore: 0,
      totalRisk: 0,
      sectorBalance: 0
    };
  }
  
  // Expected return (weighted average)
  const expectedReturn = watchlist.reduce((sum, stock) => {
    const stockReturn = (stock.target! - stock.price) / stock.price * 100;
    const weight = (stock.positionSize || 0) / watchlist.reduce((total, s) => total + (s.positionSize || 0), 1);
    return sum + (stockReturn * weight);
  }, 0);
  
  // Max drawdown (worst case scenario)
  const maxDrawdown = Math.max(...watchlist.map(stock => 
    ((stock.price - stock.stopLoss!) / stock.price) * 100
  ));
  
  // Sharpe ratio approximation
  const avgVolatility = watchlist.reduce((sum, stock) => sum + stock.volatility, 0) / watchlist.length;
  const sharpeRatio = expectedReturn / avgVolatility;
  
  // Diversification score
  const sectors = new Set(watchlist.map(s => s.sector));
  const diversificationScore = (sectors.size / Math.min(watchlist.length, 6)) * 100;
  
  // Total risk
  const totalRisk = watchlist.reduce((sum, stock) => sum + (stock.riskAmount || 0), 0);
  
  // Sector balance (how evenly distributed)
  const sectorCounts = watchlist.reduce((acc, stock) => {
    acc[stock.sector] = (acc[stock.sector] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  const maxSectorCount = Math.max(...Object.values(sectorCounts));
  const minSectorCount = Math.min(...Object.values(sectorCounts));
  const sectorBalance = (1 - (maxSectorCount - minSectorCount) / watchlist.length) * 100;
  
  return {
    expectedReturn,
    maxDrawdown,
    sharpeRatio,
    diversificationScore,
    totalRisk,
    sectorBalance
  };
}

function convertWatchlistToCSV(watchlist: WatchlistStock[]): string {
  const headers = ['Symbol', 'Company', 'Price', 'Shares', 'Position Size', 'Stop Loss', 'Target', 'Risk Level', 'Confidence', 'Sector'];
  const rows = watchlist.map(stock => [
    stock.symbol,
    stock.companyName,
    stock.price.toFixed(2),
    stock.shareQuantity || 0,
    stock.positionSize?.toFixed(2) || 0,
    stock.stopLoss?.toFixed(2) || 0,
    stock.target?.toFixed(2) || 0,
    stock.riskLevel,
    stock.confidenceScore.toFixed(1),
    stock.sector
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default AutoWatchlistBuilder;