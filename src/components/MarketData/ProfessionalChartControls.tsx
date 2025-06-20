import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Select, 
  Space, 
  Typography, 
  Drawer, 
  Switch, 
  Badge, 
  Divider, 
  Radio, 
  Tooltip,
  Form,
  Dropdown,
  MenuProps,
  Checkbox
} from 'antd';
import {
  SettingOutlined,
  DownloadOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CameraOutlined,
  FileTextOutlined,
  FileProtectOutlined,
  ExportOutlined,
  DownOutlined,
  ZoomInOutlined
} from '@ant-design/icons';

// Types
import { SP500PriceData } from '../../services/DatabaseService';
import { EnhancedNewsEvent } from '../../services/AINewsAnalysisService';

const { Text } = Typography;

export type ChartMode = 'time' | 'ordinal';

export type TimeframeKey = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'YTD';

export interface DataQuality {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  confidence: number;
}

export interface ValidationResults {
  recordCount: number;
  timestamp: string;
}

export interface ChartSettings {
  chartType: 'candlestick' | 'line' | 'area';
  indicators: string[];
  newsDisplay: 'markers' | 'annotations' | 'both';
  showTechnicalLevels: boolean;
}

export interface ChartModeControllerProps {
  currentMode: 'time' | 'ordinal';
  onModeChange: (mode: 'time' | 'ordinal') => void;
  dataContext: {
    totalRecords: number;
    dateRange: string;
  };
}

export const ChartModeController: React.FC<ChartModeControllerProps> = ({
  currentMode,
  onModeChange,
  dataContext
}) => {
  const [selectedMode, setSelectedMode] = useState(currentMode);
  
  const modes = {
    time: {
      label: 'Time Axis',
      description: 'Preserves market timing for volatility analysis',
      icon: <ClockCircleOutlined />,
      benefits: ['Accurate temporal spacing', 'Market hours preserved', 'Volatility context']
    },
    ordinal: {
      label: 'Event Focus',
      description: 'Equal spacing emphasizes price action patterns',
      icon: <BarChartOutlined />,
      benefits: ['Clean trend visualization', 'Pattern recognition', 'No weekend gaps']
    }
  };

  const handleModeChange = (e: any) => {
    const newMode = e.target.value;
    setSelectedMode(newMode);
    onModeChange(newMode);
  };

  return (
    <Card size="small" className="chart-mode-selector" style={{ marginBottom: 16 }}>
      <div className="mode-toggle-header" style={{ marginBottom: 12 }}>
        <Space>
          <Text strong>Chart Display Mode</Text>
          <Tooltip title="Professional trading platforms offer different visualization modes for optimal analysis">
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      </div>
      
      <Radio.Group 
        value={selectedMode} 
        onChange={handleModeChange}
        style={{ marginBottom: 12 }}
      >
        {Object.entries(modes).map(([key, mode]) => (
          <Radio.Button key={key} value={key} className="mode-button">
            {mode.icon} {mode.label}
          </Radio.Button>
        ))}
      </Radio.Group>
      
      <div className="mode-benefits">
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {modes[selectedMode].description}
        </Text>
        <div style={{ marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Benefits: {modes[selectedMode].benefits.join(' • ')}
          </Text>
        </div>
      </div>

      <Divider style={{ margin: '8px 0' }} />
      
      <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
        Data: {dataContext.totalRecords} records • Range: {dataContext.dateRange}
      </div>
    </Card>
  );
};

export interface ProfessionalTimeframeSelectorProps {
  currentRange: string;
  onRangeChange: (range: string) => void;
  dataAvailable: number;
  onContextChange: (context: number) => void;
}

export const ProfessionalTimeframeSelector: React.FC<ProfessionalTimeframeSelectorProps> = ({
  currentRange,
  onRangeChange,
  dataAvailable,
  onContextChange
}) => {
  const [eventContext, setEventContext] = useState(5);

  const timeframes = [
    { key: '1M', label: '1 Month', days: 22, description: 'Recent trends' },
    { key: '3M', label: '3 Months', days: 65, description: 'Quarterly patterns' },
    { key: '6M', label: '6 Months', days: 130, description: 'Correction analysis' },
    { key: '1Y', label: '1 Year', days: 252, description: 'Full market cycle' },
    { key: '2Y', label: '2 Years', days: 504, description: 'Long-term trends' },
    { key: 'YTD', label: 'YTD', days: 'current' as any, description: '2025 performance' }
  ];

  const handleContextChange = (e: any) => {
    const value = e.target.value;
    setEventContext(value);
    onContextChange(value);
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <div className="timeframe-header" style={{ marginBottom: 12 }}>
        <Text strong>Analysis Period</Text>
        <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
          ({dataAvailable} trading days available)
        </Text>
      </div>
      
      <Button.Group style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        {timeframes.map(tf => (
          <Tooltip key={tf.key} title={tf.description}>
            <Button
              type={currentRange === tf.key ? 'primary' : 'default'}
              onClick={() => onRangeChange(tf.key)}
              disabled={tf.days !== 'current' && tf.days > dataAvailable}
              size="small"
            >
              {tf.label}
            </Button>
          </Tooltip>
        ))}
      </Button.Group>
      
      <div className="context-controls">
        <Text type="secondary" style={{ fontSize: '12px' }}>Event Context: </Text>
        <Radio.Group size="small" value={eventContext} onChange={handleContextChange}>
          <Radio.Button value={5}>±5 Sessions</Radio.Button>
          <Radio.Button value={10}>±10 Sessions</Radio.Button>
        </Radio.Group>
      </div>
    </Card>
  );
};

export interface ProfessionalChartToolsProps {
  chartRef: React.RefObject<any>;
  marketData: SP500PriceData[];
  newsEvents: EnhancedNewsEvent[];
  onExportStart?: () => void;
  onExportComplete?: () => void;
}

export const ProfessionalChartTools: React.FC<ProfessionalChartToolsProps> = ({
  chartRef,
  marketData,
  newsEvents,
  onExportStart,
  onExportComplete
}) => {
  const [exportLoading, setExportLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const exportChartImage = async (ref: React.RefObject<any>, filename: string) => {
    setExportLoading(true);
    onExportStart?.();
    try {
      // Simulate chart export functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      const link = document.createElement('a');
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
      onExportComplete?.();
    }
  };

  const exportMarketDataCSV = async (data: SP500PriceData[], filename: string) => {
    setExportLoading(true);
    onExportStart?.();
    try {
      const csvContent = [
        'Date,Open,High,Low,Close,Volume',
        ...data.map(row => `${row.date},${row.open},${row.high},${row.low},${row.close},${row.volume}`)
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export failed:', error);
    } finally {
      setExportLoading(false);
      onExportComplete?.();
    }
  };

  const exportNewsCorrelation = async (events: EnhancedNewsEvent[], data: SP500PriceData[]) => {
    setExportLoading(true);
    onExportStart?.();
    try {
      const correlationData = {
        metadata: {
          exportDate: new Date().toISOString(),
          dataRange: {
            start: data[0]?.date,
            end: data[data.length - 1]?.date
          },
          recordCount: data.length,
          newsEventCount: events.length
        },
                 correlations: events.map(event => ({
           date: event.date,
           title: event.title,
           impact: event.aiAnalysis?.impactLevel || 'unknown',
           confidence: event.aiAnalysis?.confidence || 0,
           priceData: data.find(d => d.date === event.date)
         }))
      };
      
      const blob = new Blob([JSON.stringify(correlationData, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `news-correlation-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('News correlation export failed:', error);
    } finally {
      setExportLoading(false);
      onExportComplete?.();
    }
  };

  const generateProfessionalReport = async (data: SP500PriceData[], events: EnhancedNewsEvent[]) => {
    setExportLoading(true);
    onExportStart?.();
    try {
      const report = {
        title: 'Professional S&P 500 Analysis Report',
        generatedAt: new Date().toISOString(),
        summary: {
          totalTradingDays: data.length,
          dateRange: {
            start: data[0]?.date,
            end: data[data.length - 1]?.date
          },
          priceRange: {
            high: Math.max(...data.map(d => d.high)),
            low: Math.min(...data.map(d => d.low)),
            current: data[data.length - 1]?.close
          },
          totalReturn: ((data[data.length - 1]?.close - data[0]?.open) / data[0]?.open * 100).toFixed(2) + '%',
                     newsEvents: events.length,
           highImpactEvents: events.filter(e => e.aiAnalysis?.impactLevel === 'HIGH').length
        },
        technicalAnalysis: {
          volatility: 'Analysis pending',
          trends: 'Analysis pending',
          support: 'Analysis pending',
          resistance: 'Analysis pending'
        },
        newsAnalysis: {
                     majorEvents: events.slice(0, 10).map(e => ({
             date: e.date,
             title: e.title,
             impact: e.aiAnalysis?.impactLevel,
             confidence: e.aiAnalysis?.confidence
           }))
        }
      };
      
      const blob = new Blob([JSON.stringify(report, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SP500-analysis-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setExportLoading(false);
      onExportComplete?.();
    }
  };

  const resetChartZoom = (ref: React.RefObject<any>) => {
    if (ref.current && ref.current.resetZoom) {
      ref.current.resetZoom();
    }
  };

  const exportOptions = [
    {
      key: 'chartImage',
      label: 'Export Chart as PNG',
      icon: <CameraOutlined />,
      onClick: () => exportChartImage(chartRef, 'SP500-analysis')
    },
    {
      key: 'marketData',
      label: 'Export Market Data (CSV)',
      icon: <DownloadOutlined />,
      onClick: () => exportMarketDataCSV(marketData, 'SP500-data')
    },
    {
      key: 'newsCorrelation',
      label: 'Export News Correlation (JSON)',
      icon: <FileTextOutlined />,
      onClick: () => exportNewsCorrelation(newsEvents, marketData)
    },
    {
      key: 'fullReport',
      label: 'Generate Analysis Report',
      icon: <FileProtectOutlined />,
      onClick: () => generateProfessionalReport(marketData, newsEvents)
    }
  ];

  const menuProps: MenuProps = {
    items: exportOptions
  };

  return (
    <Space>
      <Dropdown menu={menuProps} trigger={['click']}>
        <Button icon={<ExportOutlined />} loading={exportLoading}>
          Export & Analysis <DownOutlined />
        </Button>
      </Dropdown>
      
      <Button 
        icon={<ZoomInOutlined />} 
        onClick={() => resetChartZoom(chartRef)}
        title="Reset Zoom"
      >
        Reset Zoom
      </Button>
      
      <Button 
        icon={<SettingOutlined />} 
        onClick={() => setSettingsVisible(true)}
        title="Chart Settings"
      >
        Settings
      </Button>

      <Drawer
        title="Professional Chart Configuration"
        placement="right"
        onClose={() => setSettingsVisible(false)}
        open={settingsVisible}
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label="Chart Type">
            <Select defaultValue="candlestick">
              <Select.Option value="candlestick">Candlestick</Select.Option>
              <Select.Option value="line">Line Chart</Select.Option>
              <Select.Option value="area">Area Chart</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="Technical Indicators">
            <Checkbox.Group defaultValue={['ma20']}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Checkbox value="ma20">20-day Moving Average</Checkbox>
                <Checkbox value="ma50">50-day Moving Average</Checkbox>
                <Checkbox value="ma200">200-day Moving Average</Checkbox>
                <Checkbox value="fibonacci">Fibonacci Levels</Checkbox>
                <Checkbox value="volume">Volume Bars</Checkbox>
              </div>
            </Checkbox.Group>
          </Form.Item>
          
          <Form.Item label="News Event Display">
            <Radio.Group defaultValue="markers">
              <Radio value="markers">Chart Markers</Radio>
              <Radio value="annotations">Annotations</Radio>
              <Radio value="both">Both</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item label="Professional Features">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Show Technical Levels</Text>
                <Switch defaultChecked />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Enable Click-to-Correlate</Text>
                <Switch defaultChecked />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Show Data Quality Badge</Text>
                <Switch defaultChecked />
              </div>
            </div>
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
};

export interface ChartDataQualityBadgeProps {
  dataQuality: DataQuality;
  validationResults: ValidationResults;
}

export const ChartDataQualityBadge: React.FC<ChartDataQualityBadgeProps> = ({
  dataQuality,
  validationResults
}) => {
  const getQualityColor = (score: number): string => {
    if (score >= 85) return '#52c41a'; // Green
    if (score >= 70) return '#faad14'; // Yellow
    return '#ff4d4f'; // Red
  };

  const tooltipContent = (
    <div>
      <div>Validation Score: {dataQuality.score}/100</div>
      <div>Records: {validationResults.recordCount.toLocaleString()}</div>
      <div>Confidence: {dataQuality.confidence}%</div>
      <div>Last Updated: {new Date(validationResults.timestamp).toLocaleString()}</div>
      <div style={{ marginTop: 8, fontSize: '11px', color: '#8c8c8c' }}>
        Institutional compliance: {dataQuality.score >= 85 ? '✅ COMPLIANT' : '⚠️ REVIEW REQUIRED'}
      </div>
    </div>
  );

  return (
    <div className="chart-quality-indicator">
      <Badge 
        color={getQualityColor(dataQuality.score)}
        text={`Data Quality: ${dataQuality.grade} (${dataQuality.score}/100)`}
        style={{ fontSize: '12px' }}
      />
      
      <Tooltip title={tooltipContent}>
        <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
      </Tooltip>
    </div>
  );
};

export interface ProfessionalChartContainerProps {
  children: React.ReactNode;
  chartMode: 'time' | 'ordinal';
  onChartModeChange: (mode: 'time' | 'ordinal') => void;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  dataQuality: DataQuality;
  validationResults: ValidationResults;
  marketData: SP500PriceData[];
  newsEvents: EnhancedNewsEvent[];
  dataAvailable: number;
  chartRef: React.RefObject<any>;
}

export const ProfessionalChartContainer: React.FC<ProfessionalChartContainerProps> = ({
  children,
  chartMode,
  onChartModeChange,
  timeframe,
  onTimeframeChange,
  dataQuality,
  validationResults,
  marketData,
  newsEvents,
  dataAvailable,
  chartRef
}) => {
  const [eventContext, setEventContext] = useState(5);

  const dataContext = {
    totalRecords: marketData.length,
    dateRange: marketData.length > 0 ? 
      `${marketData[0]?.date} to ${marketData[marketData.length - 1]?.date}` : 
      'No data'
  };

  return (
    <div className="professional-chart-container">
      {/* Chart Controls Header */}
      <div className="chart-controls-header" style={{ marginBottom: 16 }}>
        <Row gutter={16} justify="space-between" align="top">
          <Col xs={24} lg={12}>
            <ChartModeController 
              currentMode={chartMode}
              onModeChange={onChartModeChange}
              dataContext={dataContext}
            />
            <ProfessionalTimeframeSelector 
              currentRange={timeframe}
              onRangeChange={onTimeframeChange}
              dataAvailable={dataAvailable}
              onContextChange={setEventContext}
            />
          </Col>
          <Col xs={24} lg={12} style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 12 }}>
              <ChartDataQualityBadge 
                dataQuality={dataQuality}
                validationResults={validationResults}
              />
            </div>
            <ProfessionalChartTools 
              chartRef={chartRef}
              marketData={marketData}
              newsEvents={newsEvents}
            />
          </Col>
        </Row>
      </div>

      {/* Enhanced Chart Display */}
      <div className="chart-display-area" style={{ 
        border: '1px solid #d9d9d9', 
        borderRadius: '6px',
        minHeight: '400px',
        backgroundColor: '#fff'
      }}>
        {children}
      </div>

      {/* Professional Footer */}
      <div className="chart-footer" style={{ 
        marginTop: 12, 
        padding: '8px 12px', 
        backgroundColor: '#fafafa',
        borderRadius: '4px'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Institutional-grade data validation • Professional analysis tools • Export capabilities
            </Text>
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Chart mode: {chartMode} • Data quality: {dataQuality.grade} • Context: ±{eventContext} sessions
            </Text>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProfessionalChartContainer; 