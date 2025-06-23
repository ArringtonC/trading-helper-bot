import React from 'react';
import { Card, Badge, Typography } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export interface DataAuditResults {
  priceRange: {
    min: number;
    max: number;
    expected: { min: number; max: number };
    status: 'PASS' | 'FAIL';
  };
  vixRange: {
    current: number;
    historical: { min: number; max: number };
    status: 'PASS' | 'FAIL';
  };
  dataCompleteness: {
    expectedRows: number;
    actualRows: number;
    status: 'PASS' | 'FAIL';
  };
  supportLevelConsistency: {
    variations: number;
    status: 'PASS' | 'FAIL';
  };
}

interface DataAuditPanelProps {
  auditResults: DataAuditResults;
  className?: string;
}

export const DataAuditPanel: React.FC<DataAuditPanelProps> = ({ auditResults, className }) => {
  const getStatusIcon = (status: 'PASS' | 'FAIL') => {
    return status === 'PASS' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
  };

  const getStatusColor = (status: 'PASS' | 'FAIL') => {
    return status === 'PASS' ? 'success' : 'error';
  };

  return (
    <Card 
      title={
        <div className="flex items-center space-x-2">
          <span>📋</span>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>Data Audit</Title>
        </div>
      }
      className={`${className} audit-panel`}
      size="small"
      style={{ backgroundColor: '#001529', border: '1px solid #1890ff' }}
      headStyle={{ backgroundColor: '#002140', borderBottom: '1px solid #1890ff' }}
    >
      <div className="space-y-3">
        {/* Price Range Check */}
        <div className="audit-item p-3 bg-gray-800 rounded border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <Text strong className="text-blue-300">Price Range Validation</Text>
            <Badge 
              status={getStatusColor(auditResults.priceRange.status)}
              text={
                <span className="text-white flex items-center">
                  {getStatusIcon(auditResults.priceRange.status)}
                  <span className="ml-1">{auditResults.priceRange.status}</span>
                </span>
              }
            />
          </div>
          <div className="text-gray-400 text-sm">
            <div>Current Range: ${auditResults.priceRange.min.toFixed(0)} - ${auditResults.priceRange.max.toFixed(0)}</div>
            <div>Expected Range: ${auditResults.priceRange.expected.min} - ${auditResults.priceRange.expected.max}</div>
          </div>
        </div>

        {/* VIX Range Check */}
        <div className="audit-item p-3 bg-gray-800 rounded border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <Text strong className="text-blue-300">VIX Calculation Validation</Text>
            <Badge 
              status={getStatusColor(auditResults.vixRange.status)}
              text={
                <span className="text-white flex items-center">
                  {getStatusIcon(auditResults.vixRange.status)}
                  <span className="ml-1">{auditResults.vixRange.status}</span>
                </span>
              }
            />
          </div>
          <div className="text-gray-400 text-sm">
            <div>Current VIX: {auditResults.vixRange.current.toFixed(1)}</div>
            <div>Historical Range: {auditResults.vixRange.historical.min} - {auditResults.vixRange.historical.max}</div>
          </div>
        </div>

        {/* Data Completeness Check */}
        <div className="audit-item p-3 bg-gray-800 rounded border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <Text strong className="text-blue-300">Data Completeness</Text>
            <Badge 
              status={getStatusColor(auditResults.dataCompleteness.status)}
              text={
                <span className="text-white flex items-center">
                  {getStatusIcon(auditResults.dataCompleteness.status)}
                  <span className="ml-1">{auditResults.dataCompleteness.status}</span>
                </span>
              }
            />
          </div>
          <div className="text-gray-400 text-sm">
            <div>Data Points: {auditResults.dataCompleteness.actualRows} / {auditResults.dataCompleteness.expectedRows}</div>
            <div>Coverage: {((auditResults.dataCompleteness.actualRows / auditResults.dataCompleteness.expectedRows) * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* Support Level Consistency */}
        <div className="audit-item p-3 bg-gray-800 rounded border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <Text strong className="text-blue-300">Support Level Consistency</Text>
            <Badge 
              status={getStatusColor(auditResults.supportLevelConsistency.status)}
              text={
                <span className="text-white flex items-center">
                  {getStatusIcon(auditResults.supportLevelConsistency.status)}
                  <span className="ml-1">{auditResults.supportLevelConsistency.status}</span>
                </span>
              }
            />
          </div>
          <div className="text-gray-400 text-sm">
            <div>Variations: {auditResults.supportLevelConsistency.variations}</div>
            <div>Status: Unified support calculation</div>
          </div>
        </div>

        {/* Overall Status */}
        <div className="mt-4 p-3 bg-gray-900 rounded border border-blue-500">
          <div className="flex items-center justify-between">
            <Text strong className="text-blue-300">Overall Data Integrity</Text>
            {Object.values(auditResults).every(result => result.status === 'PASS') ? (
              <Badge status="success" text={<span className="text-green-400">ALL CHECKS PASSED</span>} />
            ) : (
              <Badge status="error" text={<span className="text-red-400">ISSUES DETECTED</span>} />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}; 