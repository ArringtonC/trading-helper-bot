import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Badge,
  Tag,
  Alert,
  Modal,
  Switch,
  Select,
  Statistic,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  Drawer,
  Form,
  InputNumber,
  Input
} from 'antd';
import {
  BellOutlined,
  WarningOutlined,
  AlertOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined
} from '@ant-design/icons';
import riskAlertService, { 
  RiskAlert, 
  AlertRule, 
  AlertConfiguration,
  RiskParams
} from '../services/RiskAlertService';

interface AlertPanelProps {
  riskParams?: RiskParams;
  onAlertClick?: (alert: RiskAlert) => void;
  className?: string;
}

const AlertPanel: React.FC<AlertPanelProps> = ({
  riskParams,
  onAlertClick,
  className = ''
}) => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [alertStats, setAlertStats] = useState<any>({});
  const [configuration, setConfiguration] = useState<AlertConfiguration | null>(null);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [ruleFormVisible, setRuleFormVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [filterLevel, setFilterLevel] = useState<RiskAlert['level'] | 'all'>('all');
  const [autoEvaluate, setAutoEvaluate] = useState(true);

  const [form] = Form.useForm();

  useEffect(() => {
    // Load initial data
    loadAlerts();
    loadConfiguration();
    loadRules();
    loadStats();

    // Subscribe to alert service events
    const handleNewAlert = (alert: RiskAlert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
      loadStats();
    };

    const handleAlertAcknowledged = () => {
      loadAlerts();
      loadStats();
    };

    const handleAlertsCleared = () => {
      loadAlerts();
      loadStats();
    };

    riskAlertService.on('alert', handleNewAlert);
    riskAlertService.on('alertAcknowledged', handleAlertAcknowledged);
    riskAlertService.on('alertsCleared', handleAlertsCleared);

    // Set up auto-evaluation
    let evaluationInterval: NodeJS.Timeout | null = null;
    if (autoEvaluate && riskParams) {
      evaluationInterval = setInterval(() => {
        riskAlertService.evaluateRiskConditions(riskParams);
      }, 5000); // Evaluate every 5 seconds
    }

    return () => {
      riskAlertService.off('alert', handleNewAlert);
      riskAlertService.off('alertAcknowledged', handleAlertAcknowledged);
      riskAlertService.off('alertsCleared', handleAlertsCleared);
      
      if (evaluationInterval) {
        clearInterval(evaluationInterval);
      }
    };
  }, [riskParams, autoEvaluate]);

  const loadAlerts = () => {
    const allAlerts = riskAlertService.getAlerts(filterLevel === 'all' ? undefined : filterLevel);
    setAlerts(allAlerts);
  };

  const loadConfiguration = () => {
    const config = riskAlertService.getConfiguration();
    setConfiguration(config);
  };

  const loadRules = () => {
    const allRules = riskAlertService.getRules();
    setRules(allRules);
  };

  const loadStats = () => {
    const stats = riskAlertService.getAlertStats();
    setAlertStats(stats);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    riskAlertService.acknowledgeAlert(alertId);
  };

  const handleClearAlerts = (level?: RiskAlert['level']) => {
    riskAlertService.clearAlerts(level);
  };

  const handleAlertClick = (alert: RiskAlert) => {
    setSelectedAlert(alert);
    if (onAlertClick) {
      onAlertClick(alert);
    }
  };

  const handleConfigurationChange = (changes: Partial<AlertConfiguration>) => {
    if (configuration) {
      const newConfig = { ...configuration, ...changes };
      riskAlertService.updateConfiguration(newConfig);
      setConfiguration(newConfig);
    }
  };

  const handleRuleToggle = (ruleId: string, enabled: boolean) => {
    riskAlertService.updateRule(ruleId, { enabled });
    loadRules();
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      name: rule.name,
      threshold: rule.threshold,
      cooldownMinutes: rule.cooldownMinutes,
      enabled: rule.enabled
    });
    setRuleFormVisible(true);
  };

  const handleSaveRule = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRule) {
        riskAlertService.updateRule(editingRule.id, values);
      } else {
        // Add new rule (simplified for demo)
        console.log('Would add new rule:', values);
      }
      
      loadRules();
      setRuleFormVisible(false);
      setEditingRule(null);
      form.resetFields();
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const getAlertIcon = (level: RiskAlert['level']) => {
    switch (level) {
      case 'critical': return <AlertOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning': return <WarningOutlined style={{ color: '#fa8c16' }} />;
      case 'info': return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getAlertColor = (level: RiskAlert['level']) => {
    switch (level) {
      case 'critical': return '#ff4d4f';
      case 'warning': return '#fa8c16';
      case 'info': return '#1890ff';
    }
  };

  const filteredAlerts = filterLevel === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.level === filterLevel);

  return (
    <Card 
      className={`alert-panel ${className}`}
      title={
        <div className="flex justify-between items-center">
          <span>🚨 Risk Alerts</span>
          <div className="flex items-center space-x-2">
            <Badge count={alertStats.unacknowledged} size="small">
              <BellOutlined />
            </Badge>
            <Button 
              type="text" 
              icon={<SettingOutlined />} 
              onClick={() => setSettingsVisible(true)}
              size="small"
            />
          </div>
        </div>
      }
      extra={
        <div className="flex items-center space-x-2">
          <Select
            value={filterLevel}
            onChange={setFilterLevel}
            size="small"
            style={{ width: 100 }}
            options={[
              { value: 'all', label: 'All' },
              { value: 'critical', label: 'Critical' },
              { value: 'warning', label: 'Warning' },
              { value: 'info', label: 'Info' }
            ]}
          />
          {alertStats.total > 0 && (
            <Popconfirm
              title="Clear all alerts?"
              onConfirm={() => handleClearAlerts()}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              />
            </Popconfirm>
          )}
        </div>
      }
    >
      {/* Alert Statistics */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col span={6}>
          <Statistic
            title="Critical"
            value={alertStats.critical || 0}
            valueStyle={{ color: '#ff4d4f', fontSize: '1.2rem' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Warning"
            value={alertStats.warning || 0}
            valueStyle={{ color: '#fa8c16', fontSize: '1.2rem' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Info"
            value={alertStats.info || 0}
            valueStyle={{ color: '#1890ff', fontSize: '1.2rem' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="24h"
            value={alertStats.last24Hours || 0}
            valueStyle={{ fontSize: '1.2rem' }}
          />
        </Col>
      </Row>

      {/* Auto-evaluation Toggle */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Auto Risk Evaluation:</span>
          <Switch 
            checked={autoEvaluate} 
            onChange={setAutoEvaluate}
            size="small"
          />
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Alert
          message="No Active Alerts"
          description="All risk parameters are within safe ranges."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
        />
      ) : (
        <List
          size="small"
          dataSource={filteredAlerts}
          renderItem={(alert) => (
            <List.Item
              className={`cursor-pointer hover:bg-gray-50 ${alert.acknowledged ? 'opacity-60' : ''}`}
              onClick={() => handleAlertClick(alert)}
              actions={[
                !alert.acknowledged && (
                  <Button
                    type="text"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcknowledgeAlert(alert.id);
                    }}
                    icon={<CheckCircleOutlined />}
                  />
                )
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getAlertIcon(alert.level)}
                title={
                  <div className="flex items-center justify-between">
                    <span className={alert.acknowledged ? 'line-through' : ''}>
                      {alert.title}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Tag color={getAlertColor(alert.level)} size="small">
                        {alert.level.toUpperCase()}
                      </Tag>
                      {alert.actionRequired && (
                        <Tag color="red" size="small">ACTION REQUIRED</Tag>
                      )}
                    </div>
                  </div>
                }
                description={
                  <div>
                    <div className="text-sm mb-1">{alert.message}</div>
                    <div className="text-xs text-gray-500">
                      {alert.timestamp.toLocaleTimeString()}
                      {alert.value !== undefined && alert.threshold !== undefined && (
                        <span className="ml-2">
                          Value: {alert.value.toFixed(2)} | Threshold: {alert.threshold}
                        </span>
                      )}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}

      {/* Alert Detail Modal */}
      <Modal
        title={selectedAlert?.title}
        open={!!selectedAlert}
        onCancel={() => setSelectedAlert(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedAlert(null)}>
            Close
          </Button>,
          selectedAlert && !selectedAlert.acknowledged && (
            <Button
              key="acknowledge"
              type="primary"
              onClick={() => {
                handleAcknowledgeAlert(selectedAlert.id);
                setSelectedAlert(null);
              }}
            >
              Acknowledge
            </Button>
          )
        ].filter(Boolean)}
      >
        {selectedAlert && (
          <div>
            <Alert
              message={selectedAlert.message}
              type={selectedAlert.level === 'critical' ? 'error' : selectedAlert.level === 'warning' ? 'warning' : 'info'}
              showIcon
              className="mb-4"
            />
            
            <div className="mb-4">
              <strong>Suggestions:</strong>
              <ul className="mt-2">
                {selectedAlert.suggestions.map((suggestion, index) => (
                  <li key={index} className="mb-1">• {suggestion}</li>
                ))}
              </ul>
            </div>
            
            <div className="text-sm text-gray-600">
              <div>Category: {selectedAlert.category}</div>
              <div>Timestamp: {selectedAlert.timestamp.toLocaleString()}</div>
              {selectedAlert.value !== undefined && (
                <div>Value: {selectedAlert.value.toFixed(3)}</div>
              )}
              {selectedAlert.threshold !== undefined && (
                <div>Threshold: {selectedAlert.threshold}</div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Settings Drawer */}
      <Drawer
        title="Alert Settings"
        placement="right"
        onClose={() => setSettingsVisible(false)}
        open={settingsVisible}
        width={500}
      >
        {configuration && (
          <div className="space-y-6">
            {/* General Settings */}
            <Card size="small" title="General Settings">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Enable Sound</span>
                  <Switch
                    checked={configuration.enableSound}
                    onChange={(checked) => handleConfigurationChange({ enableSound: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Browser Notifications</span>
                  <Switch
                    checked={configuration.enableBrowserNotifications}
                    onChange={(checked) => handleConfigurationChange({ enableBrowserNotifications: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Email Alerts</span>
                  <Switch
                    checked={configuration.enableEmail}
                    onChange={(checked) => handleConfigurationChange({ enableEmail: checked })}
                  />
                </div>
              </div>
            </Card>

            {/* Alert Rules */}
            <Card 
              size="small" 
              title="Alert Rules"
              extra={
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingRule(null);
                    form.resetFields();
                    setRuleFormVisible(true);
                  }}
                >
                  Add Rule
                </Button>
              }
            >
              <List
                size="small"
                dataSource={rules}
                renderItem={(rule) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditRule(rule)}
                      />,
                      <Switch
                        size="small"
                        checked={rule.enabled}
                        onChange={(checked) => handleRuleToggle(rule.id, checked)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      title={rule.name}
                      description={
                        <div>
                          <Tag color={getAlertColor(rule.level)} size="small">
                            {rule.level.toUpperCase()}
                          </Tag>
                          <span className="text-xs text-gray-500 ml-2">
                            Threshold: {rule.threshold} | Cooldown: {rule.cooldownMinutes}m
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Drawer>

      {/* Rule Form Modal */}
      <Modal
        title={editingRule ? 'Edit Alert Rule' : 'Add Alert Rule'}
        open={ruleFormVisible}
        onOk={handleSaveRule}
        onCancel={() => {
          setRuleFormVisible(false);
          setEditingRule(null);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Rule Name"
            rules={[{ required: true, message: 'Please enter rule name' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="threshold"
            label="Threshold"
            rules={[{ required: true, message: 'Please enter threshold' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="cooldownMinutes"
            label="Cooldown (minutes)"
            rules={[{ required: true, message: 'Please enter cooldown period' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          
          <Form.Item name="enabled" valuePropName="checked">
            <Switch /> <span className="ml-2">Enabled</span>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AlertPanel;
export type { AlertPanelProps };