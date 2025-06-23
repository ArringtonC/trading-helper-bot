/**
 * Gap Risk Export Service
 * 
 * Provides data export functionality for gap risk reports including
 * PDF reports and CSV data exports with configurable options.
 */

import { TradingStyleGapAssessment, GapRiskRecommendation } from '../../types/tradingStyleRules';
import { NormalizedTradeData } from '../../types/trade';

export interface ExportOptions {
  format: 'pdf' | 'csv';
  includePositions?: boolean;
  includeRecommendations?: boolean;
  includeCharts?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: {
    riskLevel?: string[];
    symbols?: string[];
    priority?: string[];
  };
}

export interface ExportResult {
  success: boolean;
  fileName: string;
  filePath?: string;
  downloadUrl?: string;
  error?: string;
  metadata?: {
    recordCount: number;
    fileSize: number;
    exportDate: Date;
    format: string;
  };
}

export class GapRiskExportService {
  private readonly baseExportPath: string;

  constructor(exportPath: string = '/tmp/gap-risk-exports') {
    this.baseExportPath = exportPath;
  }

  /**
   * Export gap risk assessment data to specified format
   */
  async exportAssessment(
    assessment: TradingStyleGapAssessment,
    positions: NormalizedTradeData[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `gap-risk-report-${timestamp}.${options.format}`;
      
      if (options.format === 'csv') {
        return await this.exportToCSV(assessment, positions, fileName, options);
      } else if (options.format === 'pdf') {
        return await this.exportToPDF(assessment, positions, fileName, options);
      } else {
        throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        fileName: '',
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Export data to CSV format
   */
  private async exportToCSV(
    assessment: TradingStyleGapAssessment,
    positions: NormalizedTradeData[],
    fileName: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      let csvContent = '';
      let recordCount = 0;

      // Export positions if requested
      if (options.includePositions !== false) {
        csvContent += this.generatePositionsCSV(assessment, positions, options);
        recordCount += positions.length;
      }

      // Export recommendations if requested
      if (options.includeRecommendations !== false && csvContent) {
        csvContent += '\n\n';
      }
      
      if (options.includeRecommendations !== false) {
        csvContent += this.generateRecommendationsCSV(assessment.recommendations, options);
        recordCount += assessment.recommendations.length;
      }

      // In a real implementation, this would write to file system or cloud storage
      const mockFilePath = `${this.baseExportPath}/${fileName}`;
      const fileSize = new Blob([csvContent]).size;

      return {
        success: true,
        fileName,
        filePath: mockFilePath,
        downloadUrl: `/api/downloads/${fileName}`,
        metadata: {
          recordCount,
          fileSize,
          exportDate: new Date(),
          format: 'csv'
        }
      };
    } catch (error) {
      throw new Error(`CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export data to PDF format
   */
  private async exportToPDF(
    assessment: TradingStyleGapAssessment,
    positions: NormalizedTradeData[],
    fileName: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // In a real implementation, this would use a PDF library like jsPDF or Puppeteer
      const pdfContent = this.generatePDFContent(assessment, positions, options);
      const mockFilePath = `${this.baseExportPath}/${fileName}`;
      const fileSize = new Blob([pdfContent]).size;

      return {
        success: true,
        fileName,
        filePath: mockFilePath,
        downloadUrl: `/api/downloads/${fileName}`,
        metadata: {
          recordCount: positions.length + assessment.recommendations.length,
          fileSize,
          exportDate: new Date(),
          format: 'pdf'
        }
      };
    } catch (error) {
      throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate CSV content for positions
   */
  private generatePositionsCSV(
    assessment: TradingStyleGapAssessment,
    positions: NormalizedTradeData[],
    options: ExportOptions
  ): string {
    const headers = [
      'Symbol',
      'Quantity',
      'Trade Price',
      'Position Value',
      'Risk Level',
      'Risk Score',
      'Expected Loss',
      'Asset Category',
      'Broker',
      'Trade Date'
    ];

    let csv = 'POSITION SUMMARY\n';
    csv += headers.join(',') + '\n';

    const filteredPositions = this.applyFilters(positions, options);

    filteredPositions.forEach(position => {
      const evaluation = assessment.positionEvaluations.find(
        e => e.ruleId.includes(position.symbol)
      );
      const positionValue = (position.quantity || 0) * (position.tradePrice || 0);
      const expectedLoss = positionValue * 0.02; // Mock 2% expected loss

      const row = [
        position.symbol,
        position.quantity || 0,
        position.tradePrice || 0,
        positionValue.toFixed(2),
        evaluation?.riskLevel || 'low',
        Math.round(evaluation?.riskScore || 0),
        expectedLoss.toFixed(2),
        position.assetCategory || 'Unknown',
        position.broker || 'Unknown',
        position.tradeDate || 'Unknown'
      ];

      csv += row.join(',') + '\n';
    });

    return csv;
  }

  /**
   * Generate CSV content for recommendations
   */
  private generateRecommendationsCSV(
    recommendations: GapRiskRecommendation[],
    options: ExportOptions
  ): string {
    const headers = [
      'Priority',
      'Action',
      'Description',
      'Risk Reduction %',
      'Timeline',
      'Reasoning'
    ];

    let csv = 'RECOMMENDATIONS\n';
    csv += headers.join(',') + '\n';

    const filteredRecommendations = recommendations.filter(rec => {
      if (options.filters?.priority && options.filters.priority.length > 0) {
        return options.filters.priority.includes(rec.priority);
      }
      return true;
    });

    filteredRecommendations.forEach(rec => {
      const row = [
        rec.priority,
        `"${rec.action}"`,
        `"${rec.description}"`,
        rec.riskReduction || 0,
        rec.timeline || 'N/A',
        `"${rec.reasoning}"`
      ];

      csv += row.join(',') + '\n';
    });

    return csv;
  }

  /**
   * Generate PDF content (mock implementation)
   */
  private generatePDFContent(
    assessment: TradingStyleGapAssessment,
    positions: NormalizedTradeData[],
    options: ExportOptions
  ): string {
    // In a real implementation, this would generate actual PDF content
    // using libraries like jsPDF, Puppeteer, or server-side PDF generation
    
    let content = `
      WEEKEND GAP RISK ANALYSIS REPORT
      Generated: ${new Date().toISOString()}
      
      EXECUTIVE SUMMARY
      - Total Positions: ${assessment.summary.totalPositionsEvaluated}
      - High Risk Positions: ${assessment.summary.highRiskPositions}
      - Overall Risk Score: ${Math.round(assessment.overallRiskScore)}
      - Risk Level: ${assessment.riskLevel.toUpperCase()}
      
      PORTFOLIO METRICS
      - Weekend Exposure: $${(assessment.portfolioMetrics.totalWeekendExposure || 0).toLocaleString()}
      - Concentration Risk: ${Math.round((assessment.portfolioMetrics.concentrationRisk || 0) * 100)}%
      - Diversification Score: ${Math.round((assessment.portfolioMetrics.diversificationScore || 0) * 100)}%
      
      RECOMMENDATIONS (${assessment.recommendations.length})
    `;

    assessment.recommendations.forEach((rec, index) => {
      content += `
      ${index + 1}. ${rec.action} (${rec.priority.toUpperCase()})
         ${rec.description}
         Risk Reduction: ${rec.riskReduction || 0}%
      `;
    });

    return content;
  }

  /**
   * Apply filters to positions data
   */
  private applyFilters(
    positions: NormalizedTradeData[],
    options: ExportOptions
  ): NormalizedTradeData[] {
    let filtered = [...positions];

    if (options.filters?.symbols && options.filters.symbols.length > 0) {
      filtered = filtered.filter(pos => 
        options.filters!.symbols!.includes(pos.symbol)
      );
    }

    if (options.dateRange) {
      filtered = filtered.filter(pos => {
        const tradeDate = new Date(pos.tradeDate);
        return tradeDate >= options.dateRange!.start && 
               tradeDate <= options.dateRange!.end;
      });
    }

    return filtered;
  }

  /**
   * Get export history for audit purposes
   */
  async getExportHistory(userId: string, limit: number = 10): Promise<ExportResult[]> {
    // In a real implementation, this would query a database
    // For now, return mock data
    return [
      {
        success: true,
        fileName: 'gap-risk-report-2024-12-13T20-00-00.pdf',
        downloadUrl: '/api/downloads/gap-risk-report-2024-12-13T20-00-00.pdf',
        metadata: {
          recordCount: 25,
          fileSize: 245760,
          exportDate: new Date('2024-12-13T20:00:00Z'),
          format: 'pdf'
        }
      }
    ];
  }

  /**
   * Clean up old export files
   */
  async cleanupOldExports(olderThanDays: number = 30): Promise<number> {
    // In a real implementation, this would clean up old files
    console.log(`Cleaning up exports older than ${olderThanDays} days`);
    return 0; // Number of files cleaned
  }
} 