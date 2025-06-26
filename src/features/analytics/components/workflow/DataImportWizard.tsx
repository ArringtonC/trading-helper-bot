import React, { useState } from 'react';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Upload,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Alert,
  Progress,
  message,
  Switch,
  Tag,
  Divider
} from 'antd';
import {
  InboxOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { format, subDays } from 'date-fns';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Dragger } = Upload;

interface DataImportWizardProps {
  onComplete: (data: any) => void;
  initialSymbol?: string;
}

export const DataImportWizard: React.FC<DataImportWizardProps> = ({
  onComplete,
  initialSymbol = 'SPY'
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [completedDownloads, setCompletedDownloads] = useState<string[]>([]);
  const [includeVix, setIncludeVix] = useState(true);
  const [dataStatus, setDataStatus] = useState({
    spyData: false,
    vixData: false,
    combinedDataset: false
  });

  const availableSymbols = ['SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO'];
  
  const downloadSources = [
    { key: 'spy-ibkr', name: '💼 Download SPY Data (IBKR)', icon: '💼', dataType: 'spy' },
    { key: 'vix-ibkr', name: '📊 Download VIX Data (IBKR)', icon: '📊', dataType: 'vix' },
    { key: 'spy-alpha', name: '🚀 Download SPY Data (Alpha Vantage)', icon: '🚀', dataType: 'spy' },
    { key: 'spy-yahoo', name: '📈 Download Current SPY Data (Yahoo)', icon: '📈', dataType: 'spy' },
    { key: 'spy-polygon', name: 'Download SPY Data (Polygon)', icon: '🔷', dataType: 'spy' }
  ];

  const simulateDownload = async (sourceKey: string) => {
    setLoading(true);
    setDownloadProgress(prev => ({ ...prev, [sourceKey]: 0 }));

    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setDownloadProgress(prev => ({ ...prev, [sourceKey]: i }));
    }

    const source = downloadSources.find(s => s.key === sourceKey);
    setCompletedDownloads(prev => [...prev, sourceKey]);
    setDownloadProgress(prev => ({ ...prev, [sourceKey]: 100 }));
    
    // Update data status
    setDataStatus(prev => ({
      ...prev,
      spyData: prev.spyData || source?.dataType === 'spy',
      vixData: prev.vixData || source?.dataType === 'vix'
    }));

    message.success(`${source?.name} downloaded successfully!`);
    setLoading(false);
    
    // Check if we can create combined dataset
    setTimeout(() => {
      setDataStatus(prev => {
        const hasSpyData = prev.spyData || completedDownloads.some(key => 
          downloadSources.find(s => s.key === key)?.dataType === 'spy'
        );
        const hasVixData = prev.vixData || completedDownloads.some(key => 
          downloadSources.find(s => s.key === key)?.dataType === 'vix'
        );
        
        if (hasSpyData && hasVixData && includeVix) {
          message.success('✅ Combined Dataset Ready!');
          return { ...prev, combinedDataset: true };
        }
        return prev;
      });
    }, 1000);
  };

  const handleSubmit = async (values: any) => {
    const formData = {
      symbol: values.symbol || initialSymbol,
      dateRange: values.dateRange || [subDays(new Date(), 365), new Date()],
      includeVix: true,
      marketDataFile: values.marketDataFile?.fileList?.[0],
      completedDownloads,
      downloadProgress
    };

    onComplete(formData);
    message.success('Data import configuration complete!');
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.csv,.xlsx',
    beforeUpload: () => false, // Prevent auto upload
    onChange(info: any) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <div className="data-import-wizard">
      <Card>
        <Title level={4}>📊 Analysis Inputs</Title>
        <Paragraph>
          Configure your analysis parameters and import market data. You can either upload existing data
          or download fresh data from multiple sources.
        </Paragraph>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            symbol: initialSymbol,
            startDate: dayjs().subtract(30, 'day'),
            endDate: dayjs(),
            includeVix: true
          }}
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Form.Item
                name="symbol"
                label="Symbol"
                rules={[{ required: true, message: 'Please select a symbol' }]}
              >
                <Select placeholder="Select symbol" defaultValue={initialSymbol}>
                  {availableSymbols.map(symbol => (
                    <Option key={symbol} value={symbol}>{symbol}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="endDate"
                label="End Date"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item>
                <Space align="center">
                  <Switch 
                    checked={includeVix} 
                    onChange={setIncludeVix}
                    checkedChildren="📊" 
                    unCheckedChildren="📊"
                  />
                  <span><strong>📊 Include VIX Features</strong></span>
                  <span style={{ color: '#666' }}>(Enhances volatility regime detection)</span>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="marketDataFile"
                label="Market Data CSV File (Optional)"
              >
                <Upload {...uploadProps} maxCount={1}>
                  <Button icon={<InboxOutlined />}>Choose File</Button>
                  <span style={{ marginLeft: 8, color: '#666' }}>No file chosen</span>
                </Upload>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  Note: In a web browser, only the file name is shown. The backend needs access to the file content or path.
                </div>
              </Form.Item>
            </Col>
          </Row>

          {/* Data Download Section */}
          <Divider />
          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {downloadSources.map(source => (
                <Button
                  key={source.key}
                  type={completedDownloads.includes(source.key) ? 'default' : 'primary'}
                  icon={completedDownloads.includes(source.key) ? <CheckCircleOutlined /> : <DownloadOutlined />}
                  loading={loading && downloadProgress[source.key] !== undefined && !completedDownloads.includes(source.key)}
                  onClick={() => simulateDownload(source.key)}
                  disabled={completedDownloads.includes(source.key)}
                  style={{ textAlign: 'left', width: '300px' }}
                >
                  {source.name}
                </Button>
              ))}
            </Space>
            
            {downloadProgress && Object.keys(downloadProgress).length > 0 && (
              <div style={{ marginTop: 16 }}>
                {Object.entries(downloadProgress).map(([key, progress]) => (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: '12px', marginBottom: 4 }}>
                      {downloadSources.find(s => s.key === key)?.name}
                    </div>
                    <Progress 
                      percent={Math.round(progress)} 
                      size="small"
                      status={completedDownloads.includes(key) ? 'success' : 'active'}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Status Section */}
          <Divider />
          <Card size="small" title="Data Status" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Space>
                  <Tag color={dataStatus.spyData ? 'green' : 'orange'} icon={<ClockCircleOutlined />}>
                    {dataStatus.spyData ? '✅ SPY Data Ready' : '⏳ SPY Data Needed'}
                  </Tag>
                </Space>
              </div>
              
              {includeVix && (
                <div>
                  <Space>
                    <Tag color={dataStatus.vixData ? 'green' : 'orange'} icon={<ClockCircleOutlined />}>
                      {dataStatus.vixData ? '✅ VIX Data Ready' : '⏳ VIX Data Needed'}
                    </Tag>
                  </Space>
                </div>
              )}
              
              <div>
                <Space>
                  <Tag color={dataStatus.combinedDataset ? 'green' : 'orange'} icon={<DatabaseOutlined />}>
                    {dataStatus.combinedDataset ? '✅ Combined Dataset Ready' : '⏳ Combined Dataset'}
                  </Tag>
                </Space>
              </div>
            </Space>
          </Card>

          {/* Status Summary */}
          {completedDownloads.length > 0 && (
            <Alert
              message="Data Sources Ready"
              description={`${completedDownloads.length} data source(s) available for analysis. You can proceed to model training.`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                disabled={completedDownloads.length === 0}
              >
                Complete Data Setup
              </Button>
              <Button onClick={() => form.resetFields()}>
                Reset Form
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DataImportWizard;