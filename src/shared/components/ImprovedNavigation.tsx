import React, { useState } from 'react';
import { Layout, Menu, Button, Switch, Space, Typography, Tooltip } from 'antd';
import {
  HomeOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Header } = Layout;
const { Text } = Typography;

interface ImprovedNavigationProps {
  darkMode?: boolean;
  onDarkModeToggle?: (enabled: boolean) => void;
}

const ImprovedNavigation: React.FC<ImprovedNavigationProps> = ({
  darkMode = false,
  onDarkModeToggle
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(darkMode);

  const handleDarkModeToggle = (enabled: boolean) => {
    setIsDarkMode(enabled);
    if (onDarkModeToggle) {
      onDarkModeToggle(enabled);
    }
  };

  const getActiveKey = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path.includes('/challenge')) return 'challenge';
    if (path.includes('/daily')) return 'daily';
    if (path.includes('/progress')) return 'progress';
    if (path.includes('/settings')) return 'settings';
    return 'home';
  };

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Home',
      onClick: () => navigate('/')
    },
    {
      key: 'challenge',
      icon: <TrophyOutlined />,
      label: 'Challenge',
      onClick: () => navigate('/challenge')
    },
    {
      key: 'daily',
      icon: <ClockCircleOutlined />,
      label: 'Daily',
      onClick: () => navigate('/challenge/daily')
    },
    {
      key: 'progress',
      icon: <RiseOutlined />,
      label: 'Progress',
      onClick: () => navigate('/challenge/progress')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings')
    }
  ];

  return (
    <Header 
      style={{ 
        background: isDarkMode ? '#1f1f1f' : '#ffffff',
        borderBottom: `1px solid ${isDarkMode ? '#434343' : '#f0f0f0'}`,
        padding: '0 24px',
        height: '64px',
        lineHeight: '64px'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        height: '100%'
      }}>
        {/* Logo/Brand */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text 
            strong 
            style={{ 
              fontSize: '20px',
              color: isDarkMode ? '#ffffff' : '#1f1f1f',
              marginRight: '32px'
            }}
          >
            Trading Helper
          </Text>
        </div>

        {/* Main Navigation */}
        <Menu
          mode="horizontal"
          selectedKeys={[getActiveKey()]}
          style={{
            background: 'transparent',
            border: 'none',
            flex: 1,
            justifyContent: 'center'
          }}
          theme={isDarkMode ? 'dark' : 'light'}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: item.onClick,
            style: {
              display: 'flex',
              alignItems: 'center',
              fontSize: '16px',
              fontWeight: 500
            }
          }))}
        />

        {/* Right Side Actions */}
        <Space size="large">
          {/* Dark Mode Toggle */}
          <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <Space>
              <SunOutlined style={{ color: isDarkMode ? '#8c8c8c' : '#faad14' }} />
              <Switch
                checked={isDarkMode}
                onChange={handleDarkModeToggle}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
              />
              <MoonOutlined style={{ color: isDarkMode ? '#1890ff' : '#8c8c8c' }} />
            </Space>
          </Tooltip>

          {/* Quick Help */}
          <Tooltip title="Quick Help">
            <Button 
              type="text" 
              icon={<BulbOutlined />}
              style={{ color: isDarkMode ? '#ffffff' : '#1f1f1f' }}
            >
              Help
            </Button>
          </Tooltip>
        </Space>
      </div>
    </Header>
  );
};

export default ImprovedNavigation;