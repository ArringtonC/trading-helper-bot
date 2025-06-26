import React from 'react';
import {
  Card,
  Progress,
  Statistic,
  Row,
  Col,
  Tag,
  Tooltip
} from 'antd';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell
} from 'recharts';
import {
  TrophyOutlined,
  StarOutlined,
  RiseOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { RPGProgress } from '../../../services/AnalyticsDataService';

interface XPProgressChartProps {
  rpgProgress: RPGProgress;
  className?: string;
}

const XPProgressChart: React.FC<XPProgressChartProps> = ({
  rpgProgress,
  className = ''
}) => {
  // Prepare skill breakdown data for chart
  const skillData = [
    {
      skill: 'Patience',
      level: rpgProgress.skillBreakdown.patience.level,
      xp: rpgProgress.skillBreakdown.patience.xp,
      maxXP: rpgProgress.skillBreakdown.patience.level * 50,
      fill: '#52c41a'
    },
    {
      skill: 'Risk Mgmt',
      level: rpgProgress.skillBreakdown.riskManagement.level,
      xp: rpgProgress.skillBreakdown.riskManagement.xp,
      maxXP: rpgProgress.skillBreakdown.riskManagement.level * 50,
      fill: '#1890ff'
    },
    {
      skill: 'Setup Quality',
      level: rpgProgress.skillBreakdown.setupQuality.level,
      xp: rpgProgress.skillBreakdown.setupQuality.xp,
      maxXP: rpgProgress.skillBreakdown.setupQuality.level * 50,
      fill: '#722ed1'
    },
    {
      skill: 'Strategy',
      level: rpgProgress.skillBreakdown.strategyAdherence.level,
      xp: rpgProgress.skillBreakdown.strategyAdherence.xp,
      maxXP: rpgProgress.skillBreakdown.strategyAdherence.level * 50,
      fill: '#fa8c16'
    }
  ];

  // XP sources data for radial chart
  const xpSourcesData = [
    {
      name: 'Trades',
      value: rpgProgress.xpFromTrades,
      fill: '#52c41a'
    },
    {
      name: 'Tasks',
      value: rpgProgress.xpFromTasks,
      fill: '#1890ff'
    },
    {
      name: 'Streaks',
      value: rpgProgress.xpFromStreaks,
      fill: '#722ed1'
    }
  ];

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'LEGENDARY': return '#ff4d4f';
      case 'MASTER': return '#722ed1';
      case 'EXPERT': return '#1890ff';
      case 'SKILLED': return '#52c41a';
      case 'NOVICE': return '#d9d9d9';
      default: return '#d9d9d9';
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'LEGENDARY': return <CrownOutlined />;
      case 'MASTER': return <TrophyOutlined />;
      case 'EXPERT': return <StarOutlined />;
      case 'SKILLED': return <RiseOutlined />;
      default: return <StarOutlined />;
    }
  };

  const levelProgressPercent = rpgProgress.xpToNextLevel > 0 ? 
    ((rpgProgress.totalXP % 100) / (rpgProgress.totalXP % 100 + rpgProgress.xpToNextLevel)) * 100 : 100;

  return (
    <Card 
      className={`xp-progress-chart ${className}`} 
      title="🏆 Character Progression"
    >
      {/* Level and Rank Overview */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="Character Level"
              value={rpgProgress.currentLevel}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '2rem' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="Total XP"
              value={rpgProgress.totalXP.toLocaleString()}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <div className="mb-2">
              <span className="text-gray-600 text-sm">Rank Status</span>
            </div>
            <Tag 
              color={getRankColor(rpgProgress.rankStatus)}
              icon={getRankIcon(rpgProgress.rankStatus)}
              className="text-lg px-3 py-1"
            >
              {rpgProgress.rankStatus}
            </Tag>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="Target Progress"
              value={rpgProgress.progressToTarget}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ 
                color: rpgProgress.progressToTarget >= 50 ? '#52c41a' : '#fa8c16' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Level Progress Bar */}
      <Card size="small" className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Level {rpgProgress.currentLevel} Progress</span>
          <span className="text-gray-600">
            {rpgProgress.xpToNextLevel} XP to Level {rpgProgress.currentLevel + 1}
          </span>
        </div>
        <Progress
          percent={levelProgressPercent}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          showInfo={false}
          size="large"
        />
      </Card>

      <Row gutter={16}>
        {/* XP Sources Breakdown */}
        <Col xs={24} lg={12}>
          <Card size="small" title="📊 XP Sources" className="mb-4">
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="40%" 
                outerRadius="80%" 
                data={xpSourcesData}
              >
                <RadialBar 
                  dataKey="value" 
                  cornerRadius={10} 
                  label={{ position: 'insideStart', fill: '#fff' }}
                />
                <Legend />
                <RechartsTooltip formatter={(value) => [`${value} XP`, 'XP Earned']} />
              </RadialBarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {xpSourcesData.map((source, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded mr-2" 
                      style={{ backgroundColor: source.fill }}
                    />
                    {source.name}
                  </span>
                  <span className="font-medium">{source.value} XP</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Skill Breakdown */}
        <Col xs={24} lg={12}>
          <Card size="small" title="⚔️ Skill Levels" className="mb-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={skillData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 'dataMax + 1']} />
                <YAxis dataKey="skill" type="category" width={80} />
                <RechartsTooltip 
                  formatter={(value, name) => [
                    name === 'level' ? `Level ${value}` : `${value} XP`,
                    name === 'level' ? 'Skill Level' : 'Skill XP'
                  ]}
                />
                <Bar dataKey="level" radius={[0, 4, 4, 0]}>
                  {skillData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-3">
              {skillData.map((skill, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{skill.skill}</span>
                    <span className="text-xs text-gray-600">
                      Level {skill.level} • {skill.xp} XP
                    </span>
                  </div>
                  <Progress
                    percent={(skill.xp / Math.max(skill.maxXP, 1)) * 100}
                    strokeColor={skill.fill}
                    showInfo={false}
                    size="small"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Achievement Hints */}
      <Card size="small" title="🎯 Level Up Tips">
        <Row gutter={16}>
          <Col span={24}>
            <div className="space-y-2 text-sm">
              {rpgProgress.xpToNextLevel <= 50 && (
                <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                  <span className="text-blue-700">
                    🔥 Almost there! Just {rpgProgress.xpToNextLevel} XP to reach Level {rpgProgress.currentLevel + 1}
                  </span>
                </div>
              )}
              
              {rpgProgress.progressToTarget < 50 && (
                <div className="p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                  <span className="text-orange-700">
                    📈 Focus on consistent daily trading to reach your challenge target
                  </span>
                </div>
              )}
              
              {rpgProgress.skillBreakdown.patience.level < 5 && (
                <div className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                  <span className="text-green-700">
                    🧘 Practice patience by waiting for A+ setups to boost your Patience skill
                  </span>
                </div>
              )}
              
              {rpgProgress.rankStatus === 'NOVICE' && (
                <div className="p-2 bg-purple-50 rounded border-l-4 border-purple-400">
                  <span className="text-purple-700">
                    🚀 Complete daily tasks consistently to advance beyond Novice rank
                  </span>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </Card>
  );
};

export default XPProgressChart;
export type { XPProgressChartProps };