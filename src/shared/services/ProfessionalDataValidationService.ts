/**
 * Professional Data Validation Service
 * Institutional-grade validation for financial market data
 * Ensures 99.9% uptime standards and professional data integrity
 */

import { SP500PriceData } from './DatabaseService';

export interface ValidationCheck {
  passed: boolean;
  score: number; // 0-100
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details?: string;
  correction?: string;
  affectedRows?: number[];
}

export interface ProfessionalValidationResult {
  isValid: boolean;
  validationScore: number; // 0-100
  errors: ValidationCheck[];
  warnings: ValidationCheck[];
  corrections: DataCorrection[];
  metadata: ValidationMetadata;
  auditTrail: AuditEntry[];
}

export interface DataCorrection {
  type: 'price_cap' | 'interpolate' | 'remove_outlier' | 'volume_normalize' | 'date_fix';
  description: string;
  rowIndex: number;
  originalValue: any;
  correctedValue: any;
  confidence: number;
}

export interface ValidationMetadata {
  totalRows: number;
  dataRange: {
    startDate: string;
    endDate: string;
    minPrice: number;
    maxPrice: number;
    avgVolume: number;
  };
  tradingDaysExpected: number;
  tradingDaysFound: number;
  dataQualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  institutionalCompliance: boolean;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  details: string;
  dataId?: string;
  userId?: string;
}

export class ProfessionalDataValidationService {
  
  private readonly PRICE_RANGE_2025 = { min: 4980, max: 6200 };
  private readonly EXPECTED_TRADING_DAYS_2025 = { min: 250, max: 260 };
  private readonly MAX_DAILY_CHANGE_PERCENT = 0.15; // 15% max daily change
  private readonly MIN_VOLUME = 1000000; // 1M minimum volume
  private readonly MAX_ATR_MULTIPLIER = 3; // 3x ATR for outlier detection

  /**
   * Main validation method for market data
   */
  public validateMarketDataProfessional(
    csvData: SP500PriceData[], 
    symbol: string = 'SPX'
  ): ProfessionalValidationResult {
    
    const validationChecks: ValidationCheck[] = [];
    const corrections: DataCorrection[] = [];
    const auditTrail: AuditEntry[] = [];

    // Execute all validation checks
    validationChecks.push(this.validatePriceRanges(csvData));
    validationChecks.push(this.validateRowCounts(csvData));
    validationChecks.push(this.validateTradingDaySequence(csvData));
    validationChecks.push(this.validateOHLCRelationships(csvData));
    validationChecks.push(this.validateVolumePatterns(csvData));
    validationChecks.push(this.validateATRBounds(csvData));
    validationChecks.push(this.validateMarketHolidays(csvData));
    validationChecks.push(this.validateDataIntegrity(csvData));

    // Separate errors and warnings
    const errors = validationChecks.filter(check => !check.passed && check.severity === 'critical');
    const warnings = validationChecks.filter(check => !check.passed && check.severity === 'warning');

    // Calculate overall validation score
    const validationScore = this.calculateValidationScore(validationChecks);

    // Generate metadata
    const metadata = this.generateValidationMetadata(csvData, validationChecks);

    // Create audit entry
    auditTrail.push({
      timestamp: new Date().toISOString(),
      action: 'DATA_VALIDATION_COMPLETED',
      details: `Validated ${csvData.length} records with score ${validationScore}/100`
    });

    return {
      isValid: errors.length === 0 && validationScore >= 85, // Institutional standard: 85+ score
      validationScore,
      errors,
      warnings,
      corrections,
      metadata,
      auditTrail
    };
  }

  /**
   * Validate price ranges for 2025 S&P 500 data
   */
  private validatePriceRanges(data: SP500PriceData[]): ValidationCheck {
    const outOfRangeRows: number[] = [];
    let validPrices = 0;

    data.forEach((row, index) => {
      const prices = [row.open, row.high, row.low, row.close];
      const inRange = prices.every(price => 
        price >= this.PRICE_RANGE_2025.min && price <= this.PRICE_RANGE_2025.max
      );
      
      if (inRange) {
        validPrices++;
      } else {
        outOfRangeRows.push(index);
      }
    });

    const successRate = (validPrices / data.length) * 100;
    const passed = outOfRangeRows.length === 0;

    return {
      passed,
      score: Math.max(0, successRate),
      severity: outOfRangeRows.length > data.length * 0.05 ? 'critical' : 'warning',
      message: passed ? 'All prices within expected 2025 range' : `${outOfRangeRows.length} rows with prices outside range`,
      details: `Expected range: ${this.PRICE_RANGE_2025.min}-${this.PRICE_RANGE_2025.max}`,
      correction: 'Cap outlier prices to range boundaries',
      affectedRows: outOfRangeRows
    };
  }

  /**
   * Validate expected row counts for trading year
   */
  private validateRowCounts(data: SP500PriceData[]): ValidationCheck {
    const rowCount = data.length;
    const inRange = rowCount >= this.EXPECTED_TRADING_DAYS_2025.min && 
                   rowCount <= this.EXPECTED_TRADING_DAYS_2025.max;

    return {
      passed: inRange,
      score: inRange ? 100 : Math.max(0, 100 - Math.abs(rowCount - 252) * 2),
      severity: inRange ? 'info' : 'warning',
      message: inRange ? 'Row count within expected range' : `Unexpected row count: ${rowCount}`,
      details: `Expected: ${this.EXPECTED_TRADING_DAYS_2025.min}-${this.EXPECTED_TRADING_DAYS_2025.max} trading days`,
      correction: rowCount < this.EXPECTED_TRADING_DAYS_2025.min ? 'Check for missing trading days' : 'Verify extra rows are valid trading days'
    };
  }

  /**
   * Validate trading day sequence (no weekends, account for holidays)
   */
  private validateTradingDaySequence(data: SP500PriceData[]): ValidationCheck {
    const invalidDates: number[] = [];
    const gaps: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const currentDate = new Date(data[i].date);
      const dayOfWeek = currentDate.getDay();
      
      // Check for weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        invalidDates.push(i);
      }
      
      // Check for gaps (more than 3 days between trading days)
      if (i > 0) {
        const prevDate = new Date(data[i-1].date);
        const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 4) { // Allow for long weekends
          gaps.push(i);
        }
      }
    }

    const issues = invalidDates.length + gaps.length;
    const passed = issues === 0;
    const score = Math.max(0, 100 - (issues * 5));

    return {
      passed,
      score,
      severity: issues > 5 ? 'critical' : 'warning',
      message: passed ? 'Valid trading day sequence' : `${issues} date sequence issues found`,
      details: `Invalid dates: ${invalidDates.length}, Gaps: ${gaps.length}`,
      correction: 'Remove weekend dates and fill trading day gaps',
      affectedRows: [...invalidDates, ...gaps]
    };
  }

  /**
   * Validate OHLC relationships (High >= Open/Close, Low <= Open/Close)
   */
  private validateOHLCRelationships(data: SP500PriceData[]): ValidationCheck {
    const invalidRows: number[] = [];

    data.forEach((row, index) => {
      const { open, high, low, close } = row;
      
      const validHigh = high >= Math.max(open, close) && high >= low;
      const validLow = low <= Math.min(open, close) && low <= high;
      
      if (!validHigh || !validLow) {
        invalidRows.push(index);
      }
    });

    const passed = invalidRows.length === 0;
    const score = Math.max(0, 100 - (invalidRows.length / data.length) * 100);

    return {
      passed,
      score,
      severity: 'critical', // OHLC integrity is critical
      message: passed ? 'All OHLC relationships valid' : `${invalidRows.length} rows with invalid OHLC`,
      details: 'High must be >= Open/Close/Low, Low must be <= Open/Close/High',
      correction: 'Correct OHLC values to maintain logical relationships',
      affectedRows: invalidRows
    };
  }

  /**
   * Validate volume patterns and detect anomalies
   */
  private validateVolumePatterns(data: SP500PriceData[]): ValidationCheck {
    const invalidRows: number[] = [];
    const volumes = data.map(row => row.volume || 0);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const volumeStdDev = Math.sqrt(
      volumes.reduce((sq, vol) => sq + Math.pow(vol - avgVolume, 2), 0) / volumes.length
    );

    data.forEach((row, index) => {
      const volume = row.volume || 0;
      
      // Check minimum volume threshold
      if (volume < this.MIN_VOLUME) {
        invalidRows.push(index);
        return;
      }

      // Check for extreme outliers (>5 standard deviations)
      if (Math.abs(volume - avgVolume) > 5 * volumeStdDev) {
        invalidRows.push(index);
      }
    });

    const passed = invalidRows.length === 0;
    const score = Math.max(0, 100 - (invalidRows.length / data.length) * 50);

    return {
      passed,
      score,
      severity: 'warning',
      message: passed ? 'Volume patterns normal' : `${invalidRows.length} volume anomalies detected`,
      details: `Min volume: ${this.MIN_VOLUME.toLocaleString()}, Avg: ${Math.round(avgVolume).toLocaleString()}`,
      correction: 'Review and normalize volume outliers',
      affectedRows: invalidRows
    };
  }

  /**
   * Validate ATR bounds to detect suspicious price movements
   */
  private validateATRBounds(data: SP500PriceData[]): ValidationCheck {
    if (data.length < 20) {
      return {
        passed: true,
        score: 100,
        severity: 'info',
        message: 'Insufficient data for ATR validation'
      };
    }

    const suspiciousRows: number[] = [];
    
    // Calculate 20-day ATR
    for (let i = 20; i < data.length; i++) {
      const atrPeriod = data.slice(i - 20, i);
      let atrSum = 0;
      
      for (let j = 1; j < atrPeriod.length; j++) {
        const current = atrPeriod[j];
        const previous = atrPeriod[j - 1];
        
        const trueRange = Math.max(
          current.high - current.low,
          Math.abs(current.high - previous.close),
          Math.abs(current.low - previous.close)
        );
        atrSum += trueRange;
      }
      
      const atr = atrSum / 19;
      const currentRow = data[i];
      const prevClose = data[i - 1].close;
      
      // Check if price movement exceeds ATR threshold
      const priceChange = Math.abs(currentRow.close - prevClose);
      if (priceChange > atr * this.MAX_ATR_MULTIPLIER) {
        suspiciousRows.push(i);
      }
    }

    const passed = suspiciousRows.length === 0;
    const score = Math.max(0, 100 - (suspiciousRows.length / data.length) * 100);

    return {
      passed,
      score,
      severity: suspiciousRows.length > 3 ? 'critical' : 'warning',
      message: passed ? 'No suspicious price movements detected' : `${suspiciousRows.length} suspicious movements found`,
      details: `Movements exceeding ${this.MAX_ATR_MULTIPLIER}x ATR threshold`,
      correction: 'Review large price movements for data accuracy',
      affectedRows: suspiciousRows
    };
  }

  /**
   * Validate market holidays (basic check for major US holidays)
   */
  private validateMarketHolidays(data: SP500PriceData[]): ValidationCheck {
    // 2025 US Market Holidays
    const marketHolidays2025 = [
      '2025-01-01', // New Year's Day
      '2025-01-20', // MLK Day
      '2025-02-17', // Presidents Day
      '2025-04-18', // Good Friday
      '2025-05-26', // Memorial Day
      '2025-07-04', // Independence Day
      '2025-09-01', // Labor Day
      '2025-11-27', // Thanksgiving
      '2025-12-25'  // Christmas
    ];

    const invalidRows: number[] = [];
    
    data.forEach((row, index) => {
      const dateStr = row.date.split('T')[0]; // Get YYYY-MM-DD part
      if (marketHolidays2025.includes(dateStr)) {
        invalidRows.push(index);
      }
    });

    const passed = invalidRows.length === 0;
    const score = Math.max(0, 100 - (invalidRows.length * 10));

    return {
      passed,
      score,
      severity: 'warning',
      message: passed ? 'No trading on market holidays' : `${invalidRows.length} entries on market holidays`,
      details: 'Data should not include major US market holidays',
      correction: 'Remove entries for market holidays',
      affectedRows: invalidRows
    };
  }

  /**
   * Validate overall data integrity
   */
  private validateDataIntegrity(data: SP500PriceData[]): ValidationCheck {
    let integrityScore = 100;
    const issues: string[] = [];

    // Check for missing required fields
    const requiredFields = ['date', 'open', 'high', 'low', 'close', 'volume'];
    let missingFieldCount = 0;

    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (row[field as keyof SP500PriceData] === null || 
            row[field as keyof SP500PriceData] === undefined) {
          missingFieldCount++;
        }
      });
    });

    if (missingFieldCount > 0) {
      integrityScore -= (missingFieldCount / (data.length * requiredFields.length)) * 50;
      issues.push(`${missingFieldCount} missing field values`);
    }

    // Check for duplicate dates
    const dates = data.map(row => row.date);
    const uniqueDates = new Set(dates);
    if (dates.length !== uniqueDates.size) {
      integrityScore -= 20;
      issues.push('Duplicate dates found');
    }

    // Check chronological order
    let outOfOrder = 0;
    for (let i = 1; i < data.length; i++) {
      if (new Date(data[i].date) <= new Date(data[i-1].date)) {
        outOfOrder++;
      }
    }

    if (outOfOrder > 0) {
      integrityScore -= (outOfOrder / data.length) * 30;
      issues.push(`${outOfOrder} records out of chronological order`);
    }

    const passed = integrityScore >= 90;

    return {
      passed,
      score: Math.max(0, integrityScore),
      severity: integrityScore < 70 ? 'critical' : 'warning',
      message: passed ? 'Data integrity excellent' : `${issues.length} integrity issues found`,
      details: issues.join(', '),
      correction: 'Address data integrity issues before proceeding'
    };
  }

  /**
   * Calculate overall validation score
   */
  private calculateValidationScore(checks: ValidationCheck[]): number {
    if (checks.length === 0) return 0;
    
    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    return Math.round(totalScore / checks.length);
  }

  /**
   * Generate comprehensive validation metadata
   */
  private generateValidationMetadata(
    data: SP500PriceData[], 
    checks: ValidationCheck[]
  ): ValidationMetadata {
    const prices = data.map(row => row.close);
    const volumes = data.map(row => row.volume || 0);
    const validationScore = this.calculateValidationScore(checks);

    return {
      totalRows: data.length,
      dataRange: {
        startDate: data[0]?.date || '',
        endDate: data[data.length - 1]?.date || '',
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        avgVolume: Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length)
      },
      tradingDaysExpected: 252, // Standard trading year
      tradingDaysFound: data.length,
      dataQualityGrade: this.getQualityGrade(validationScore),
      institutionalCompliance: validationScore >= 85 && checks.every(c => c.severity !== 'critical' || c.passed)
    };
  }

  /**
   * Get quality grade based on validation score
   */
  private getQualityGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Apply data corrections based on validation results
   */
  public applyDataCorrections(
    data: SP500PriceData[], 
    validationResult: ProfessionalValidationResult
  ): { correctedData: SP500PriceData[]; corrections: DataCorrection[] } {
    const correctedData = [...data];
    const corrections: DataCorrection[] = [];

    // Apply price range corrections
    const priceRangeCheck = validationResult.errors.find(e => e.message.includes('prices outside range'));
    if (priceRangeCheck?.affectedRows) {
      priceRangeCheck.affectedRows.forEach(rowIndex => {
        const row = correctedData[rowIndex];
        const fields: (keyof SP500PriceData)[] = ['open', 'high', 'low', 'close'];
        
        fields.forEach(field => {
          const value = row[field] as number;
          if (value < this.PRICE_RANGE_2025.min) {
            corrections.push({
              type: 'price_cap',
              description: `Capped ${field} below minimum`,
              rowIndex,
              originalValue: value,
              correctedValue: this.PRICE_RANGE_2025.min,
              confidence: 0.8
            });
            (row[field] as number) = this.PRICE_RANGE_2025.min;
          } else if (value > this.PRICE_RANGE_2025.max) {
            corrections.push({
              type: 'price_cap',
              description: `Capped ${field} above maximum`,
              rowIndex,
              originalValue: value,
              correctedValue: this.PRICE_RANGE_2025.max,
              confidence: 0.8
            });
            (row[field] as number) = this.PRICE_RANGE_2025.max;
          }
        });
      });
    }

    return { correctedData, corrections };
  }

  /**
   * Generate professional audit trail
   */
  public generateAuditTrail(
    originalData: SP500PriceData[],
    cleanedData: SP500PriceData[],
    preValidation: ProfessionalValidationResult,
    postValidation: ProfessionalValidationResult
  ): AuditEntry[] {
    const auditTrail: AuditEntry[] = [];
    const timestamp = new Date().toISOString();

    auditTrail.push({
      timestamp,
      action: 'DATA_RECEIVED',
      details: `Received ${originalData.length} records for validation`
    });

    auditTrail.push({
      timestamp,
      action: 'PRE_VALIDATION_COMPLETED',
      details: `Pre-validation score: ${preValidation.validationScore}/100, Errors: ${preValidation.errors.length}`
    });

    if (originalData.length !== cleanedData.length) {
      auditTrail.push({
        timestamp,
        action: 'DATA_CLEANING_APPLIED',
        details: `Applied corrections, ${originalData.length - cleanedData.length} records modified`
      });
    }

    auditTrail.push({
      timestamp,
      action: 'POST_VALIDATION_COMPLETED',
      details: `Post-validation score: ${postValidation.validationScore}/100, Final quality grade: ${postValidation.metadata.dataQualityGrade}`
    });

    return auditTrail;
  }
} 