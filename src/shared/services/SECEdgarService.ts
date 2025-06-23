// Frontend service for SEC EDGAR data - uses local proxy to avoid CORS issues
export const SEC_CONFIG = {
  BASE_URL: 'https://data.sec.gov',
  RATE_LIMIT_DELAY: 100,
  USER_AGENT: 'Trading Helper Bot (contact@tradinghelperbot.com)',
  SCION_CIK: '0001649339',
  FORM_TYPE: '13F-HR'
} as const;

// Types for SEC API responses
export interface SECSubmission {
  cik: string;
  entityType: string;
  name: string;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      form: string[];
    };
  };
}

export interface Filing {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string;
}

export interface Holding {
  nameOfIssuer: string;
  shares: number;
  value: number;
  putCall?: string;
}

export interface Processed13FData {
  accessionNumber: string;
  filingDate: string;
  holdings: Holding[];
  totalValue: number;
  documentUrl?: string;
}

export interface TraderPickAnalysis {
  ticker: string;
  thesis: string;
  date: string;
  value?: number;
  positionType?: 'long' | 'short' | 'put' | 'call';
}

class SECEdgarService {
  private readonly proxyBaseUrl = 'http://localhost:3001/api/sec-edgar';

  /**
   * Test connection to SEC EDGAR API via proxy
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.proxyBaseUrl}/test-connection`);
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('[SEC EDGAR] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get the latest 13F filing for a given CIK via proxy
   */
  async getLatest13FFiling(cik: string): Promise<Filing | null> {
    try {
      const response = await fetch(`${this.proxyBaseUrl}/filing/${cik}/latest`);
      const result = await response.json();
      
      if (result.success) {
        return result.filing;
      } else {
        console.warn('[SEC EDGAR] No 13F filing found:', result.message);
        return null;
      }
    } catch (error) {
      console.error('[SEC EDGAR] Error fetching latest filing:', error);
      return null;
    }
  }

  /**
   * Parse a 13F filing document via proxy
   */
  async parse13FFiling(cik: string, accessionNumber: string): Promise<Processed13FData | null> {
    try {
      const response = await fetch(`${this.proxyBaseUrl}/filing/${cik}/${accessionNumber}/parse`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        console.warn('[SEC EDGAR] Failed to parse filing:', result.message);
        // Return null to trigger error handling, but log that this is expected behavior
        console.log('[SEC EDGAR] Document parsing failed - this is normal for some SEC filings');
        return null;
      }
    } catch (error) {
      console.error('[SEC EDGAR] Error parsing 13F filing:', error);
      return null;
    }
  }

  /**
   * Convert SEC holdings data to trader pick analysis
   */
  convertToTraderPicks(data: Processed13FData): TraderPickAnalysis[] {
    const picks: TraderPickAnalysis[] = [];
    
    // Company name to ticker mapping
    const tickerMap: Record<string, string> = {
      'NVIDIA CORP': 'NVDA',
      'ALIBABA GROUP HOLDING': 'BABA',
      'JD.COM INC': 'JD',
      'ESTEE LAUDER COMPANIES': 'EL',
      'APPLE INC': 'AAPL',
      'MICROSOFT CORP': 'MSFT',
      'AMAZON COM INC': 'AMZN',
      'TESLA INC': 'TSLA',
      'ALPHABET INC': 'GOOGL'
    };

    data.holdings.forEach(holding => {
      // Find ticker symbol
      let ticker = 'UNKNOWN';
      for (const [company, symbol] of Object.entries(tickerMap)) {
        if (holding.nameOfIssuer.toUpperCase().includes(company)) {
          ticker = symbol;
          break;
        }
      }

      // Determine position type and generate thesis
      let positionType: 'long' | 'short' | 'put' | 'call' = 'long';
      let thesis = '';

      if (holding.putCall === 'Put' || holding.putCall === 'P') {
        positionType = 'put';
        thesis = `Bearish position via put options on ${holding.nameOfIssuer}. ` +
                `Burry expects significant downside, consistent with his contrarian investment approach.`;
      } else if (holding.putCall === 'Call' || holding.putCall === 'C') {
        positionType = 'call';
        thesis = `Bullish position via call options on ${holding.nameOfIssuer}. ` +
                `Burry sees upside potential despite market sentiment.`;
      } else {
        positionType = 'long';
        thesis = `Long position in ${holding.nameOfIssuer}. ` +
                `Value play consistent with Burry's fundamental analysis approach.`;
      }

      // Special handling for known Q1 2025 positions
      if (ticker === 'NVDA') {
        thesis = 'Massive bearish bet against NVIDIA via put options. ' +
                'Burry likely sees AI bubble characteristics and expects significant correction.';
      } else if (ticker === 'BABA' || ticker === 'JD') {
        thesis = `Bearish position on Chinese tech via put options. ` +
                `Reflects concerns about regulatory environment and economic headwinds in China.`;
      } else if (ticker === 'EL') {
        thesis = 'Sole long position in Estée Lauder. ' +
                'Contrarian value play in luxury consumer goods with potential for recovery.';
      }

      picks.push({
        ticker,
        thesis,
        date: data.filingDate,
        value: holding.value,
        positionType
      });
    });

    return picks;
  }

  /**
   * Get Michael Burry's latest picks (main entry point)
   */
  async getMichaelBurryLatestPicks(): Promise<TraderPickAnalysis[]> {
    try {
      // Step 1: Get latest 13F filing
      const latestFiling = await this.getLatest13FFiling(SEC_CONFIG.SCION_CIK);
      if (!latestFiling) {
        throw new Error('No recent 13F filings found for Michael Burry');
      }

      // Step 2: Parse the filing
      const filingData = await this.parse13FFiling(SEC_CONFIG.SCION_CIK, latestFiling.accessionNumber);
      if (!filingData) {
        throw new Error('Failed to parse 13F filing data');
      }

      // Step 3: Convert to trader picks
      const picks = this.convertToTraderPicks(filingData);
      
      console.log(`[SEC EDGAR] Successfully processed ${picks.length} picks from filing ${latestFiling.accessionNumber}`);
      return picks;

    } catch (error) {
      console.error('[SEC EDGAR] Error getting Michael Burry picks:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const secEdgarService = new SECEdgarService(); 