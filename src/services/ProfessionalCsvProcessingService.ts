/**
 * Professional CSV Processing Service
 * Enhanced CSV processing with institutional-grade validation
 */

import Papa from 'papaparse';
import { 
  ProfessionalDataValidationService, 
  ProfessionalValidationResult, 
  ValidationMetadata,
  AuditEntry,
  DataCorrection
} from './ProfessionalDataValidationService';
import { SP500PriceData } from './DatabaseService';

export interface ProfessionalProcessingResult {
  success: boolean;
  data: SP500PriceData[];
  validation: {
    preValidation: ProfessionalValidationResult | null;
    postValidation: ProfessionalValidationResult | null;
    originalData: SP500PriceData[] | null;
    cleanedData: SP500PriceData[] | null;
    auditTrail: AuditEntry[];
  };
  metadata: ValidationMetadata | null;
  error?: string;
}

export interface ProcessingProgress {
  step: 'parsing' | 'pre_validation' | 'cleaning' | 'post_validation' | 'complete';
  progress: number;
  message: string;
  details?: string;
}

export class ProfessionalDataValidationError extends Error {
  constructor(
    message: string, 
    public validationResults: any,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ProfessionalDataValidationError';
  }
}

export class ProfessionalCsvProcessingService {
  
  private validationService: ProfessionalDataValidationService;

  constructor() {
    this.validationService = new ProfessionalDataValidationService();
  }

  /**
   * Parse CSV file into SP500PriceData format
   */
  private async parseCSVFile(file: File): Promise<SP500PriceData[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data: SP500PriceData[] = results.data.map((row: any, index: number) => {
              // Handle different possible column names
              const date = row['Date'] || row['date'] || row['DATE'];
              const open = parseFloat(row['Open'] || row['open'] || row['OPEN']);
              const high = parseFloat(row['High'] || row['high'] || row['HIGH']);
              const low = parseFloat(row['Low'] || row['low'] || row['LOW']);
              const close = parseFloat(row['Close'] || row['close'] || row['CLOSE'] || row['Adj Close']);
              const volume = parseInt(row['Volume'] || row['volume'] || row['VOLUME']) || 0;

              if (!date || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
                throw new Error(`Invalid data at row ${index + 1}: missing required fields`);
              }

              return {
                id: index + 1,
                date,
                open,
                high,
                low,
                close,
                volume,
                source: 'csv_upload'
              };
            });

            resolve(data);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  }

  public async processWithInstitutionalValidation(
    file: File,
    progressCallback?: (progress: ProcessingProgress) => void
  ): Promise<ProfessionalProcessingResult> {
    
    const validationResults = {
      preValidation: null as ProfessionalValidationResult | null,
      postValidation: null as ProfessionalValidationResult | null,
      originalData: null as SP500PriceData[] | null,
      cleanedData: null as SP500PriceData[] | null,
      auditTrail: [] as AuditEntry[]
    };

    try {
      progressCallback?.({
        step: 'parsing',
        progress: 10,
        message: 'Parsing CSV file...',
        details: `Processing ${file.name}`
      });

      const rawData = await this.parseCSVFile(file);
      validationResults.originalData = rawData;

      validationResults.auditTrail.push({
        timestamp: new Date().toISOString(),
        action: 'CSV_FILE_RECEIVED',
        details: `Received file: ${file.name}, Records: ${rawData.length}`
      });

      progressCallback?.({
        step: 'pre_validation',
        progress: 30,
        message: 'Running validation checks...',
        details: `Validating ${rawData.length} records`
      });

      validationResults.preValidation = this.validationService.validateMarketDataProfessional(rawData);

      progressCallback?.({
        step: 'cleaning',
        progress: 60,
        message: 'Applying corrections...',
        details: `Quality score: ${validationResults.preValidation.validationScore}/100`
      });

      let cleanedData = rawData;
      if (validationResults.preValidation.errors.length > 0) {
        const correctionResult = this.validationService.applyDataCorrections(
          rawData, 
          validationResults.preValidation
        );
        cleanedData = correctionResult.correctedData;
      }

      validationResults.cleanedData = cleanedData;

      progressCallback?.({
        step: 'post_validation',
        progress: 85,
        message: 'Final validation...',
        details: 'Verifying data integrity'
      });

      validationResults.postValidation = this.validationService.validateMarketDataProfessional(cleanedData);

      progressCallback?.({
        step: 'complete',
        progress: 100,
        message: 'Processing complete',
        details: `Final grade: ${validationResults.postValidation.metadata.dataQualityGrade}`
      });

      return {
        success: validationResults.postValidation.isValid,
        data: cleanedData,
        validation: validationResults,
        metadata: validationResults.postValidation.metadata
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      
      throw new ProfessionalDataValidationError(
        `Professional validation failed: ${errorMessage}`,
        validationResults,
        error instanceof Error ? error : undefined
      );
    }
  }

  public handleValidationFailure(
    validationResults: ProfessionalValidationResult
  ): {
    canProceed: boolean;
    recommendation: string;
    actions: string[];
  } {
    
    const criticalErrors = validationResults.errors.filter(e => e.severity === 'critical');

    if (criticalErrors.length > 0) {
      return {
        canProceed: false,
        recommendation: 'Data contains critical errors that must be resolved',
        actions: [
          'Review price ranges (expected: 4,980-6,200)',
          'Verify OHLC relationships',
          'Check trading day sequence',
          'Validate data integrity'
        ]
      };
    }

    return {
      canProceed: true,
      recommendation: 'Data quality acceptable with corrections',
      actions: validationResults.warnings.map(w => w.correction || 'Review warning').filter(Boolean)
    };
  }

  /**
   * Generate institutional compliance report
   */
  public generateComplianceReport(
    validationResult: ProfessionalValidationResult
  ): {
    summary: {
      overallGrade: string;
      compliance: boolean;
      score: number;
      totalRecords: number;
    };
    recommendations: string[];
  } {
    
    const recommendations: string[] = [];
    
    if (validationResult.validationScore < 90) {
      recommendations.push('Implement additional data quality controls at source');
    }
    if (validationResult.errors.length > 0) {
      recommendations.push('Review data provider compliance and accuracy standards');
    }
    if (!validationResult.metadata.institutionalCompliance) {
      recommendations.push('Upgrade to institutional-grade data feed for compliance');
    }

    return {
      summary: {
        overallGrade: validationResult.metadata.dataQualityGrade,
        compliance: validationResult.metadata.institutionalCompliance,
        score: validationResult.validationScore,
        totalRecords: validationResult.metadata.totalRows
      },
      recommendations
    };
  }
}
