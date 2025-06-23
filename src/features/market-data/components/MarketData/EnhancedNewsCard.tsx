import React from 'react';
import { Card, Badge, Alert, Tooltip } from 'antd';
import { WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';

// Simplified interface for news with AI analysis
interface AIAnalysis {
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
  confidence: number;
  tradingRecommendation: string;
  marketCorrelation: string;
  riskAssessment: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  sentimentScore: number;
}

interface NewsWithAI {
  id: number;
  title: string;
  description: string;
  date: string;
  source: string;
  aiAnalysis: AIAnalysis;
}

interface EnhancedNewsCardProps {
  newsEvent: NewsWithAI;
  onClick?: (newsId: number) => void;
  isSelected?: boolean;
}

const EnhancedNewsCard: React.FC<EnhancedNewsCardProps> = ({
  newsEvent,
  onClick,
  isSelected = false
}) => {
  const { aiAnalysis } = newsEvent;

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'HIGH': return '#ff4d4f';
      case 'MEDIUM': return '#faad14';
      case 'LOW': return '#52c41a';
      case 'MINIMAL': return '#d9d9d9';
      default: return '#d9d9d9';
    }
  };

  const getRecommendationColor = (recommendation: string): 'success' | 'info' | 'warning' | 'error' => {
    if (recommendation.includes('AVOID')) return 'error';
    if (recommendation.includes('MONITOR')) return 'warning';
    if (recommendation.includes('OPPORTUNITY')) return 'success';
    return 'info';
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: 8,
        borderLeft: `4px solid ${getImpactColor(aiAnalysis.impactLevel)}`,
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: isSelected ? '#f6ffed' : 'white'
      }}
      onClick={() => onClick && onClick(newsEvent.id)}
      hoverable={!!onClick}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Badge 
          color={getImpactColor(aiAnalysis.impactLevel)}
          text={`${aiAnalysis.impactLevel} IMPACT`}
          style={{ fontWeight: 'bold', fontSize: '11px' }}
        />
        <Tooltip title="AI Analysis Confidence">
          <span style={{ fontSize: '12px', color: '#666' }}>
            {aiAnalysis.confidence}% confidence
          </span>
        </Tooltip>
      </div>

      {/* Title */}
      <h4 style={{ 
        margin: '0 0 8px 0', 
        fontSize: '14px', 
        lineHeight: '1.4',
        color: '#262626'
      }}>
        {newsEvent.title}
      </h4>

      {/* Trading Recommendation */}
      <Alert
        type={getRecommendationColor(aiAnalysis.tradingRecommendation)}
        message={aiAnalysis.tradingRecommendation}
        showIcon
        style={{ marginBottom: 8, fontSize: '12px' }}
      />

      {/* Market Impact */}
      <div style={{ 
        padding: 6, 
        backgroundColor: '#fafafa', 
        borderRadius: 4,
        marginBottom: 8,
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: 'bold', color: '#666', marginBottom: 2 }}>
          Market Impact
        </div>
        <div style={{ color: '#262626', fontSize: '11px', lineHeight: '1.3' }}>
          {aiAnalysis.marketCorrelation}
        </div>
      </div>

      {/* Risk and Sentiment */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontSize: '11px',
        color: '#666'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {aiAnalysis.riskAssessment === 'EXTREME' || aiAnalysis.riskAssessment === 'HIGH' ? 
            <WarningOutlined style={{ color: '#ff4d4f' }} /> : 
            <InfoCircleOutlined style={{ color: '#52c41a' }} />
          }
          Risk: {aiAnalysis.riskAssessment}
        </div>
        <div>
          Sentiment: {aiAnalysis.sentimentScore > 0 ? 'Positive' : aiAnalysis.sentimentScore < 0 ? 'Negative' : 'Neutral'}
        </div>
      </div>

      {/* Description */}
      <div style={{ 
        marginTop: 8, 
        fontSize: '12px', 
        color: '#595959',
        lineHeight: '1.4',
        borderTop: '1px solid #f0f0f0',
        paddingTop: 8
      }}>
        {newsEvent.description}
      </div>
    </Card>
  );
};

export default EnhancedNewsCard; 