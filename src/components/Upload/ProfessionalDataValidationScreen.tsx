import React from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Progress,
  Badge,
  Button,
  Space,
  Alert,
  Divider,
  List,
  Statistic,
  Tabs,
  Tag,
  Table
} from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  WarningOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { 
  ProfessionalValidationResult, 
  ValidationCheck, 
  ValidationMetadata,
  AuditEntry
} from '../../services/ProfessionalDataValidationService';
import { ProcessingProgress } from '../../services/ProfessionalCsvProcessingService';

const { TabPane } = Tabs;

interface ProfessionalDataValidationScreenProps {
  isProcessing: boolean;
  progress?: ProcessingProgress;
  validationResult?: ProfessionalValidationResult;
  metadata?: ValidationMetadata;
  auditTrail?: AuditEntry[];
  onProceed?: () => void;
  onReject?: () => void;
  onRetry?: () => void;
}

const ProfessionalDataValidationScreen: React.FC<ProfessionalDataValidationScreenProps> = ({
  isProcessing,
  progress,
  validationResult,
  metadata,
  auditTrail = [],
  onProceed,
  onReject,
  onRetry
}) => {

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#52c41a'; // Green
    if (score >= 80) return '#faad14'; // Yellow
    if (score >= 70) return '#fa8c16'; // Orange
    return '#ff4d4f'; // Red
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default: return null;
    }
  };

  const validationColumns = [
    {
      title: 'Check',
      dataIndex: 'message',
      key: 'message',
      render: (text: string, record: ValidationCheck) => (
        <Space>
          {getSeverityIcon(record.severity)}
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score: number) => (
        <Progress 
          percent={score} 
          size="small" 
          strokeColor={getScoreColor(score)}
          showInfo={false}
        />
      )
    },
    {
      title: 'Status',
      dataIndex: 'passed',
      key: 'passed',
      width: 80,
      render: (passed: boolean, record: ValidationCheck) => (
        <Tag color={passed ? 'success' : record.severity === 'critical' ? 'error' : 'warning'}>
          {passed ? 'PASS' : 'FAIL'}
        </Tag>
      )
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true
    }
  ];

  const auditColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => new Date(timestamp).toLocaleString()
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 200
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details'
    }
  ];

  if (isProcessing && progress) {
    return (
      <Card title="📊 Professional Data Quality Assessment" className="validation-screen">
        <div className="text-center mb-6">
          <Progress 
            type="circle" 
            percent={progress.progress} 
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            format={() => `${progress.progress}%`}
          />
          <div className="mt-4">
            <h3 className="text-lg font-semibold">{progress.message}</h3>
            {progress.details && (
              <p className="text-gray-600">{progress.details}</p>
            )}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <ClockCircleOutlined className="text-blue-500" />
            <span className="text-blue-700">
              Processing Step: <strong>{progress.step.replace('_', ' ').toUpperCase()}</strong>
            </span>
          </div>
        </div>
      </Card>
    );
  }

  if (!validationResult || !metadata) {
    return (
      <Card title="📊 Professional Data Quality Assessment">
        <Alert 
          message="No validation results available" 
          type="info" 
          showIcon 
        />
      </Card>
    );
  }

  const allChecks = [
    ...validationResult.errors,
    ...validationResult.warnings,
    ...validationResult.auditTrail.map(audit => ({
      passed: true,
      score: 100,
      severity: 'info' as const,
      message: audit.action,
      details: audit.details
    })).filter(check => check.message.includes('VALIDATION'))
  ];

  return (
    <Card title="📊 Professional Data Quality Assessment" className="validation-screen">
      
      {/* Overall Status Alert */}
      <Alert
        type={validationResult.isValid ? "success" : "error"}
        message={`Data Validation ${validationResult.isValid ? 'Passed' : 'Failed'}`}
        description={
          validationResult.isValid 
            ? `Quality Score: ${validationResult.validationScore}/100 - Ready for institutional use`
            : `Quality Score: ${validationResult.validationScore}/100 - Requires attention before proceeding`
        }
        showIcon
        className="mb-6"
      />

      {/* Key Metrics Overview */}
      <div className="validation-overview mb-6">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic 
              title="Data Quality Score" 
              value={validationResult.validationScore}
              suffix="/ 100"
              valueStyle={{ color: getScoreColor(validationResult.validationScore) }}
              prefix={<TrophyOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Records Analyzed" 
              value={metadata.totalRows.toLocaleString()}
              prefix={<BarChartOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Critical Errors" 
              value={validationResult.errors.length}
              valueStyle={{ 
                color: validationResult.errors.length > 0 ? '#ff4d4f' : '#52c41a' 
              }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Quality Grade" 
              value={metadata.dataQualityGrade}
              valueStyle={{ 
                color: getScoreColor(validationResult.validationScore),
                fontSize: '32px',
                fontWeight: 'bold'
              }}
              prefix={<TrophyOutlined />}
            />
          </Col>
        </Row>
      </div>

      {/* Data Range Information */}
      <Card size="small" className="mb-6">
        <Row gutter={16}>
          <Col span={8}>
            <div className="text-center">
              <div className="text-gray-500">Date Range</div>
              <div className="font-semibold">
                {new Date(metadata.dataRange.startDate).toLocaleDateString()} - {' '}
                {new Date(metadata.dataRange.endDate).toLocaleDateString()}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <div className="text-gray-500">Price Range</div>
              <div className="font-semibold">
                ${metadata.dataRange.minPrice.toFixed(2)} - ${metadata.dataRange.maxPrice.toFixed(2)}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <div className="text-gray-500">Avg Daily Volume</div>
              <div className="font-semibold">
                {metadata.dataRange.avgVolume.toLocaleString()}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Institutional Compliance Status */}
      <div className="mb-6">
        <Tag 
          color={metadata.institutionalCompliance ? 'success' : 'error'} 
          className="text-sm px-3 py-1"
        >
          {metadata.institutionalCompliance ? '✅ INSTITUTIONAL COMPLIANT' : '❌ NON-COMPLIANT'}
        </Tag>
        <span className="ml-2 text-gray-600">
          {metadata.institutionalCompliance 
            ? 'Meets professional trading platform standards (99.9% uptime)'
            : 'Data quality below institutional standards - manual review required'
          }
        </span>
      </div>

      {/* Detailed Results Tabs */}
      <Tabs defaultActiveKey="overview">
        <TabPane tab="Quality Overview" key="overview">
          <Table 
            dataSource={allChecks}
            columns={validationColumns}
            pagination={false}
            size="small"
            rowKey={(record, index) => `check-${index}`}
          />
        </TabPane>

        <TabPane tab={`Errors (${validationResult.errors.length})`} key="errors">
          {validationResult.errors.length > 0 ? (
            <Table 
              dataSource={validationResult.errors}
              columns={validationColumns}
              pagination={false}
              size="small"
              rowKey={(record, index) => `error-${index}`}
            />
          ) : (
            <Alert message="No critical errors found" type="success" showIcon />
          )}
        </TabPane>

        <TabPane tab={`Warnings (${validationResult.warnings.length})`} key="warnings">
          {validationResult.warnings.length > 0 ? (
            <Table 
              dataSource={validationResult.warnings}
              columns={validationColumns}
              pagination={false}
              size="small"
              rowKey={(record, index) => `warning-${index}`}
            />
          ) : (
            <Alert message="No warnings found" type="success" showIcon />
          )}
        </TabPane>

        <TabPane tab="Audit Trail" key="audit">
          <Table 
            dataSource={auditTrail}
            columns={auditColumns}
            pagination={{ pageSize: 10 }}
            size="small"
            rowKey={(record, index) => `audit-${index}`}
          />
        </TabPane>
      </Tabs>

      <Divider />

      {/* Action Buttons */}
      <div className="text-center">
        <Space size="middle">
          {validationResult.isValid ? (
            <Button 
              type="primary" 
              size="large" 
              icon={<CheckCircleOutlined />}
              onClick={onProceed}
            >
              Proceed with Data
            </Button>
          ) : (
            <>
              <Button 
                type="primary" 
                danger 
                size="large" 
                icon={<ExclamationCircleOutlined />}
                onClick={onReject}
              >
                Reject Data
              </Button>
              <Button 
                size="large" 
                icon={<FileTextOutlined />}
                onClick={onRetry}
              >
                Upload Different File
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* Professional Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <div className="bg-gray-50 p-3 rounded">
          🏛️ <strong>Institutional Standards:</strong> This validation engine ensures 99.9% uptime standards 
          and professional data integrity for institutional trading platforms.
          <br />
          📊 Quality thresholds: A-grade (90%+), B-grade (80%+), C-grade (70%+), Below C-grade requires manual review.
        </div>
      </div>
    </Card>
  );
};

export default ProfessionalDataValidationScreen; 