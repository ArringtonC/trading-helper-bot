import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  Switch,
  Slider,
  TimePicker,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Tabs,
  Checkbox,
  Input,
  Radio,
  Badge,
  Tag,
  Tooltip,
  Row,
  Col,
  Modal,
  message
} from 'antd';
import {
  SettingOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ExperimentOutlined,
  BellOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { Challenge } from '../types/challenge';
import type { WorkflowPreferences } from './DailyWorkflowTemplateEngine';

// Note: In a real implementation, you'd use dayjs or date-fns instead of moment
// For this demo, we'll use a simple time format
const formatTime = (time: string) => time;
const parseTime = (time: string) => ({ format: (format: string) => time });

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface WorkflowCustomizerProps {
  challenge: Challenge;
  preferences: WorkflowPreferences;
  onPreferencesChange: (preferences: WorkflowPreferences) => void;
  onSave: () => void;
  className?: string;
}

interface CustomWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  tasks: CustomTask[];
  schedule: ScheduleConfig;
  active: boolean;
}

interface CustomTask {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedMinutes: number;
  required: boolean;
  timeSlot: string;
  conditions?: TaskCondition[];
}

interface TaskCondition {
  type: 'DAY_OF_WEEK' | 'MARKET_CONDITION' | 'EXPERIENCE_LEVEL';
  value: string;
}

interface ScheduleConfig {
  preMarketStart: string;
  marketHours: string;
  postMarketEnd: string;
  weekendEducation: boolean;
  restDays: string[];
}

interface NotificationSettings {
  enabled: boolean;
  preMarketReminder: boolean;
  taskReminders: boolean;
  streakNotifications: boolean;
  achievementAlerts: boolean;
  dailySummary: boolean;
  reminderTimes: {
    morning: string;
    trading: string;
    evening: string;
  };
}

interface PersonalizationSettings {
  displayName: string;
  motivationalQuotes: boolean;
  difficultyLevel: 'EASY' | 'MODERATE' | 'CHALLENGING';
  focusAreas: string[];
  learningGoals: string[];
  tradingStyle: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
}

const WorkflowCustomizer: React.FC<WorkflowCustomizerProps> = ({
  challenge,
  preferences,
  onPreferencesChange,
  onSave,
  className = ''
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('schedule');
  const [customTemplates, setCustomTemplates] = useState<CustomWorkflowTemplate[]>([]);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    enabled: true,
    preMarketReminder: true,
    taskReminders: true,
    streakNotifications: true,
    achievementAlerts: true,
    dailySummary: true,
    reminderTimes: {
      morning: '06:30',
      trading: '09:00',
      evening: '16:30'
    }
  });
  const [personalization, setPersonalization] = useState<PersonalizationSettings>({
    displayName: '',
    motivationalQuotes: true,
    difficultyLevel: 'MODERATE',
    focusAreas: [],
    learningGoals: [],
    tradingStyle: 'MODERATE',
    experienceLevel: 'INTERMEDIATE'
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomWorkflowTemplate | null>(null);

  useEffect(() => {
    // Initialize form with current preferences
    form.setFieldsValue({
      wakeUpTime: preferences.wakeUpTime ? parseTime(preferences.wakeUpTime) : parseTime('06:30'),
      marketPrepTime: preferences.marketPrepTime || 60,
      tradingStyle: preferences.tradingStyle || 'DAY_TRADING',
      experienceLevel: preferences.experienceLevel || 'INTERMEDIATE',
      focusAreas: preferences.focusAreas || [],
      weekendEducation: preferences.weekendEducation ?? true
    });
  }, [preferences, form]);

  const handleFormChange = (changedFields: any, allFields: any) => {
    const newPreferences: WorkflowPreferences = {
      wakeUpTime: allFields.wakeUpTime?.format('HH:mm'),
      marketPrepTime: allFields.marketPrepTime,
      tradingStyle: allFields.tradingStyle,
      experienceLevel: allFields.experienceLevel,
      focusAreas: allFields.focusAreas || [],
      weekendEducation: allFields.weekendEducation ?? true
    };
    onPreferencesChange(newPreferences);
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      onSave();
      message.success('Workflow preferences saved successfully!');
    }).catch(() => {
      message.error('Please fix the form errors before saving.');
    });
  };

  const handleReset = () => {
    const defaultPreferences: WorkflowPreferences = {
      wakeUpTime: '06:30',
      marketPrepTime: 60,
      tradingStyle: 'DAY_TRADING',
      experienceLevel: 'INTERMEDIATE',
      focusAreas: [],
      weekendEducation: true
    };
    
    form.setFieldsValue({
      wakeUpTime: parseTime('06:30'),
      marketPrepTime: 60,
      tradingStyle: 'DAY_TRADING',
      experienceLevel: 'INTERMEDIATE',
      focusAreas: [],
      weekendEducation: true
    });
    
    onPreferencesChange(defaultPreferences);
    message.info('Workflow preferences reset to defaults');
  };

  const createCustomTemplate = () => {
    setEditingTemplate({
      id: `custom-${Date.now()}`,
      name: '',
      description: '',
      tasks: [],
      schedule: {
        preMarketStart: '06:30',
        marketHours: '09:30-16:00',
        postMarketEnd: '17:00',
        weekendEducation: true,
        restDays: ['Saturday']
      },
      active: false
    });
    setShowTemplateModal(true);
  };

  const saveCustomTemplate = (template: CustomWorkflowTemplate) => {
    setCustomTemplates(prev => {
      const existing = prev.findIndex(t => t.id === template.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = template;
        return updated;
      }
      return [...prev, template];
    });
    setShowTemplateModal(false);
    setEditingTemplate(null);
    message.success('Custom workflow template saved!');
  };

  const renderScheduleTab = () => (
    <div className="space-y-6">
      <Card title="🕒 Daily Schedule" size="small">
        <Form.Item 
          label="Wake Up Time" 
          name="wakeUpTime"
          tooltip="When do you typically wake up for trading?"
        >
          <TimePicker 
            format="HH:mm" 
            placeholder="Select time"
            className="w-full"
            showNow={false}
          />
        </Form.Item>
        
        <Form.Item 
          label="Pre-Market Preparation Time" 
          name="marketPrepTime"
          tooltip="How many minutes before market open do you want to start preparing?"
        >
          <Slider
            min={15}
            max={180}
            marks={{
              15: '15m',
              30: '30m',
              60: '1h',
              120: '2h',
              180: '3h'
            }}
            tooltip={{ formatter: (value) => `${value} minutes` }}
          />
        </Form.Item>
        
        <Form.Item 
          label="Weekend Education" 
          name="weekendEducation"
          valuePropName="checked"
        >
          <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
        </Form.Item>
      </Card>

      <Card title="🎯 Trading Preferences" size="small">
        <Form.Item 
          label="Trading Style" 
          name="tradingStyle"
          tooltip="What type of trading do you primarily focus on?"
        >
          <Select>
            <Option value="SCALPING">Scalping (Minutes)</Option>
            <Option value="DAY_TRADING">Day Trading (Hours)</Option>
            <Option value="SWING">Swing Trading (Days)</Option>
            <Option value="POSITION">Position Trading (Weeks)</Option>
          </Select>
        </Form.Item>
        
        <Form.Item 
          label="Experience Level" 
          name="experienceLevel"
          tooltip="This affects the complexity of tasks and educational content"
        >
          <Radio.Group>
            <Radio.Button value="BEGINNER">Beginner</Radio.Button>
            <Radio.Button value="INTERMEDIATE">Intermediate</Radio.Button>
            <Radio.Button value="ADVANCED">Advanced</Radio.Button>
          </Radio.Group>
        </Form.Item>
        
        <Form.Item 
          label="Focus Areas" 
          name="focusAreas"
          tooltip="Select areas you want to focus on improving"
        >
          <Checkbox.Group
            options={[
              { label: 'Risk Management', value: 'RISK_MANAGEMENT' },
              { label: 'Technical Analysis', value: 'TECHNICAL_ANALYSIS' },
              { label: 'Psychology', value: 'PSYCHOLOGY' },
              { label: 'Strategy Development', value: 'STRATEGY' },
              { label: 'Market Analysis', value: 'MARKET_ANALYSIS' },
              { label: 'Position Sizing', value: 'POSITION_SIZING' }
            ]}
          />
        </Form.Item>
      </Card>

      <Alert
        message="💡 Customization Tips"
        description={
          <ul className="mt-2 space-y-1">
            <li>• Set your wake-up time to ensure adequate pre-market preparation</li>
            <li>• Adjust preparation time based on your trading style complexity</li>
            <li>• Focus areas determine which educational modules are prioritized</li>
            <li>• Experience level affects task difficulty and explanations</li>
          </ul>
        }
        type="info"
        showIcon={false}
      />
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <Card title="🔔 Notification Settings" size="small">
        <Form.Item>
          <div className="flex items-center justify-between mb-4">
            <Text strong>Enable Notifications</Text>
            <Switch 
              checked={notifications.enabled}
              onChange={(checked) => setNotifications(prev => ({ ...prev, enabled: checked }))}
            />
          </div>
        </Form.Item>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Text>Pre-Market Reminders</Text>
              <br />
              <Text type="secondary" className="text-sm">Remind me to start my morning routine</Text>
            </div>
            <Switch 
              checked={notifications.preMarketReminder}
              onChange={(checked) => setNotifications(prev => ({ ...prev, preMarketReminder: checked }))}
              disabled={!notifications.enabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Text>Task Reminders</Text>
              <br />
              <Text type="secondary" className="text-sm">Remind me about incomplete tasks</Text>
            </div>
            <Switch 
              checked={notifications.taskReminders}
              onChange={(checked) => setNotifications(prev => ({ ...prev, taskReminders: checked }))}
              disabled={!notifications.enabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Text>Streak Notifications</Text>
              <br />
              <Text type="secondary" className="text-sm">Celebrate streak milestones</Text>
            </div>
            <Switch 
              checked={notifications.streakNotifications}
              onChange={(checked) => setNotifications(prev => ({ ...prev, streakNotifications: checked }))}
              disabled={!notifications.enabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Text>Achievement Alerts</Text>
              <br />
              <Text type="secondary" className="text-sm">Notify me when I unlock achievements</Text>
            </div>
            <Switch 
              checked={notifications.achievementAlerts}
              onChange={(checked) => setNotifications(prev => ({ ...prev, achievementAlerts: checked }))}
              disabled={!notifications.enabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Text>Daily Summary</Text>
              <br />
              <Text type="secondary" className="text-sm">End-of-day performance summary</Text>
            </div>
            <Switch 
              checked={notifications.dailySummary}
              onChange={(checked) => setNotifications(prev => ({ ...prev, dailySummary: checked }))}
              disabled={!notifications.enabled}
            />
          </div>
        </div>
      </Card>

      <Card title="🕕 Reminder Times" size="small">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <div className="text-center">
              <Text strong>Morning</Text>
              <br />
              <TimePicker
                format="HH:mm"
                value={parseTime(notifications.reminderTimes.morning)}
                onChange={(time) => setNotifications(prev => ({
                  ...prev,
                  reminderTimes: { ...prev.reminderTimes, morning: formatTime(time?.toString() || '06:30') }
                }))}
                disabled={!notifications.enabled}
                showNow={false}
              />
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <Text strong>Trading</Text>
              <br />
              <TimePicker
                format="HH:mm"
                value={parseTime(notifications.reminderTimes.trading)}
                onChange={(time) => setNotifications(prev => ({
                  ...prev,
                  reminderTimes: { ...prev.reminderTimes, trading: formatTime(time?.toString() || '09:00') }
                }))}
                disabled={!notifications.enabled}
                showNow={false}
              />
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <Text strong>Evening</Text>
              <br />
              <TimePicker
                format="HH:mm"
                value={parseTime(notifications.reminderTimes.evening)}
                onChange={(time) => setNotifications(prev => ({
                  ...prev,
                  reminderTimes: { ...prev.reminderTimes, evening: formatTime(time?.toString() || '16:30') }
                }))}
                disabled={!notifications.enabled}
                showNow={false}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const renderPersonalizationTab = () => (
    <div className="space-y-6">
      <Card title="👤 Personal Preferences" size="small">
        <div className="space-y-4">
          <div>
            <Text strong>Display Name</Text>
            <Input
              placeholder="How should we address you?"
              value={personalization.displayName}
              onChange={(e) => setPersonalization(prev => ({ ...prev, displayName: e.target.value }))}
              className="mt-1"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Text strong>Motivational Quotes</Text>
              <br />
              <Text type="secondary" className="text-sm">Show inspirational quotes in your workflow</Text>
            </div>
            <Switch
              checked={personalization.motivationalQuotes}
              onChange={(checked) => setPersonalization(prev => ({ ...prev, motivationalQuotes: checked }))}
            />
          </div>
          
          <div>
            <Text strong>Challenge Difficulty</Text>
            <br />
            <Text type="secondary" className="text-sm">How challenging should your daily tasks be?</Text>
            <Radio.Group
              value={personalization.difficultyLevel}
              onChange={(e) => setPersonalization(prev => ({ ...prev, difficultyLevel: e.target.value }))}
              className="mt-2"
            >
              <Radio.Button value="EASY">Easy - Build confidence</Radio.Button>
              <Radio.Button value="MODERATE">Moderate - Balanced growth</Radio.Button>
              <Radio.Button value="CHALLENGING">Challenging - Accelerated learning</Radio.Button>
            </Radio.Group>
          </div>
          
          <div>
            <Text strong>Trading Style</Text>
            <br />
            <Text type="secondary" className="text-sm">How do you approach risk in trading?</Text>
            <Radio.Group
              value={personalization.tradingStyle}
              onChange={(e) => setPersonalization(prev => ({ ...prev, tradingStyle: e.target.value }))}
              className="mt-2"
            >
              <Radio.Button value="CONSERVATIVE">Conservative - Safety first</Radio.Button>
              <Radio.Button value="MODERATE">Moderate - Balanced approach</Radio.Button>
              <Radio.Button value="AGGRESSIVE">Aggressive - High growth focus</Radio.Button>
            </Radio.Group>
          </div>
        </div>
      </Card>

      <Card title="🞯 Learning Goals" size="small">
        <div className="space-y-4">
          <div>
            <Text strong>Current Learning Goals</Text>
            <br />
            <Text type="secondary" className="text-sm">What do you want to achieve this month?</Text>
            <Checkbox.Group
              options={[
                { label: 'Improve win rate to 60%+', value: 'WIN_RATE' },
                { label: 'Master risk management', value: 'RISK_MANAGEMENT' },
                { label: 'Develop patience and discipline', value: 'DISCIPLINE' },
                { label: 'Learn advanced technical analysis', value: 'TECHNICAL' },
                { label: 'Build consistent daily routine', value: 'ROUTINE' },
                { label: 'Increase position sizing skills', value: 'POSITION_SIZING' }
              ]}
              value={personalization.learningGoals}
              onChange={(goals) => setPersonalization(prev => ({ ...prev, learningGoals: goals }))}
              className="mt-2"
            />
          </div>
          
          <div>
            <Text strong>Custom Learning Goal</Text>
            <TextArea
              placeholder="Describe a specific goal you want to work on..."
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderCustomTemplatesTab = () => (
    <div className="space-y-6">
      <Card title="🔧 Custom Workflow Templates" size="small">
        <div className="mb-4">
          <Button 
            type="primary" 
            icon={<ExperimentOutlined />}
            onClick={createCustomTemplate}
          >
            Create Custom Template
          </Button>
        </div>
        
        {customTemplates.length === 0 ? (
          <Alert
            message="No Custom Templates Yet"
            description="Create your first custom workflow template to tailor your daily routine to your specific needs."
            type="info"
            showIcon
          />
        ) : (
          <div className="space-y-3">
            {customTemplates.map(template => (
              <Card key={template.id} size="small" className="border">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Text strong>{template.name}</Text>
                      {template.active && <Badge status="success" text="Active" />}
                    </div>
                    <Text type="secondary" className="text-sm">{template.description}</Text>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>📋 {template.tasks.length} tasks</span>
                      <span>🕒 {template.schedule.preMarketStart} - {template.schedule.postMarketEnd}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      size="small"
                      checked={template.active}
                      onChange={(checked) => {
                        setCustomTemplates(prev => prev.map(t => 
                          t.id === template.id ? { ...t, active: checked } : { ...t, active: false }
                        ));
                      }}
                    />
                    <Button 
                      size="small" 
                      icon={<SettingOutlined />}
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowTemplateModal(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
      
      <Alert
        message="💡 Custom Template Tips"
        description={
          <ul className="mt-2 space-y-1">
            <li>• Create templates for different market conditions (trending, ranging, volatile)</li>
            <li>• Customize task timing based on your schedule and preferences</li>
            <li>• Add specific tasks for your trading strategy or areas of focus</li>
            <li>• Only one template can be active at a time</li>
          </ul>
        }
        type="info"
        showIcon={false}
      />
    </div>
  );

  return (
    <Card className={`workflow-customizer ${className}`} title="⚙️ Workflow Customizer">
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
        initialValues={{
          wakeUpTime: parseTime('06:30'),
          marketPrepTime: 60,
          tradingStyle: 'DAY_TRADING',
          experienceLevel: 'INTERMEDIATE',
          focusAreas: [],
          weekendEducation: true
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="🕒 Schedule" key="schedule">
            {renderScheduleTab()}
          </TabPane>
          <TabPane tab="🔔 Notifications" key="notifications">
            {renderNotificationsTab()}
          </TabPane>
          <TabPane tab="👤 Personal" key="personal">
            {renderPersonalizationTab()}
          </TabPane>
          <TabPane tab="🔧 Templates" key="templates">
            {renderCustomTemplatesTab()}
          </TabPane>
        </Tabs>
        
        <Divider />
        
        <div className="flex justify-between items-center">
          <Space>
            <Tooltip title="Reset all settings to defaults">
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Reset to Defaults
              </Button>
            </Tooltip>
          </Space>
          <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              Save Preferences
            </Button>
          </Space>
        </div>
      </Form>
      
      {/* Custom Template Modal */}
      <Modal
        title={editingTemplate?.name ? 'Edit Template' : 'Create Custom Template'}
        visible={showTemplateModal}
        onCancel={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
        }}
        footer={null}
        width={800}
      >
        <div className="space-y-4">
          <Input
            placeholder="Template Name"
            value={editingTemplate?.name || ''}
            onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
          />
          <TextArea
            placeholder="Template Description"
            value={editingTemplate?.description || ''}
            onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
            rows={3}
          />
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setShowTemplateModal(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              onClick={() => editingTemplate && saveCustomTemplate(editingTemplate)}
              disabled={!editingTemplate?.name}
            >
              Save Template
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default WorkflowCustomizer;
export type { WorkflowCustomizerProps, WorkflowPreferences };
