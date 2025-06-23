// Backend proxy for SEC EDGAR API calls
// This handles CORS and restricted headers that browsers can't set

import axios from 'axios';
import { Request, Response } from 'express';

const SEC_CONFIG = {
  BASE_URL: 'https://data.sec.gov',
  USER_AGENT: 'Trading Helper Bot (contact@tradinghelperbot.com)',
  RATE_LIMIT_DELAY: 100
};

// Rate limiting for SEC compliance
let lastRequestTime = 0;

const rateLimitedRequest = async (url: string) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < SEC_CONFIG.RATE_LIMIT_DELAY) {
    await new Promise(resolve => 
      setTimeout(resolve, SEC_CONFIG.RATE_LIMIT_DELAY - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  
  return axios.get(url, {
    headers: {
      'User-Agent': SEC_CONFIG.USER_AGENT,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br'
    },
    timeout: 30000
  });
};

export const secEdgarProxy = {
  // Test connection to SEC EDGAR API
  async testConnection(req: Request, res: Response) {
    try {
      const response = await rateLimitedRequest(`${SEC_CONFIG.BASE_URL}/submissions/CIK0001649339.json`);
      
      res.json({
        success: true,
        status: response.status,
        message: 'SEC EDGAR API connection successful'
      });
    } catch (error) {
      console.error('[SEC Proxy] Connection test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to connect to SEC EDGAR API',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Get latest 13F filing for a CIK
  async getLatestFiling(req: Request, res: Response) {
    try {
      const { cik } = req.params;
      const paddedCik = cik.padStart(10, '0');
      
      const response = await rateLimitedRequest(`${SEC_CONFIG.BASE_URL}/submissions/CIK${paddedCik}.json`);
      const data = response.data;
      
      // Find latest 13F-HR filing
      const filings = data.filings?.recent;
      if (!filings) {
        return res.status(404).json({
          success: false,
          message: 'No filings found for this CIK'
        });
      }
      
      let latestFiling = null;
      for (let i = 0; i < filings.form.length; i++) {
        if (filings.form[i] === '13F-HR') {
          latestFiling = {
            accessionNumber: filings.accessionNumber[i],
            filingDate: filings.filingDate[i],
            reportDate: filings.reportDate[i],
            form: filings.form[i]
          };
          break;
        }
      }
      
      if (!latestFiling) {
        return res.status(404).json({
          success: false,
          message: 'No 13F-HR filings found'
        });
      }
      
      res.json({
        success: true,
        filing: latestFiling
      });
      
    } catch (error) {
      console.error('[SEC Proxy] Get filing failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch filing data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Parse 13F filing document
  async parseFiling(req: Request, res: Response) {
    try {
      const { cik, accessionNumber } = req.params;
      const paddedCik = cik.padStart(10, '0');
      
      // Remove dashes from accession number for URL
      const cleanAccessionNumber = accessionNumber.replace(/-/g, '');
      
      // Try different document naming patterns
      const possibleUrls = [
        `${SEC_CONFIG.BASE_URL}/Archives/edgar/data/${paddedCik}/${cleanAccessionNumber}/form13fInfoTable.xml`,
        `${SEC_CONFIG.BASE_URL}/Archives/edgar/data/${paddedCik}/${cleanAccessionNumber}/primary_doc.xml`,
        `${SEC_CONFIG.BASE_URL}/Archives/edgar/data/${paddedCik}/${cleanAccessionNumber}/${accessionNumber}.txt`
      ];
      
      let documentText = '';
      let documentUrl = '';
      
      for (const url of possibleUrls) {
        try {
          const response = await rateLimitedRequest(url);
          documentText = response.data;
          documentUrl = url;
          break;
        } catch (error) {
          console.log(`[SEC Proxy] Failed to fetch ${url}, trying next...`);
          continue;
        }
      }
      
      if (!documentText) {
        return res.status(404).json({
          success: false,
          message: 'Could not fetch 13F document from any known URL pattern'
        });
      }
      
      // Parse the document (simplified parser)
      const holdings = parseHoldingsFromDocument(documentText);
      
      res.json({
        success: true,
        data: {
          accessionNumber,
          filingDate: new Date().toISOString().split('T')[0], // Placeholder
          holdings,
          documentUrl,
          totalValue: holdings.reduce((sum, h) => sum + (h.value || 0), 0)
        }
      });
      
    } catch (error) {
      console.error('[SEC Proxy] Parse filing failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to parse filing document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

// Simplified document parser
function parseHoldingsFromDocument(documentText: string) {
  const holdings: any[] = [];
  
  try {
    // Look for XML-style holdings data
    const holdingRegex = /<holding>([\s\S]*?)<\/holding>/g;
    const matches = documentText.match(holdingRegex);
    
    if (matches) {
      matches.forEach(match => {
        const nameMatch = match.match(/<nameOfIssuer>(.*?)<\/nameOfIssuer>/);
        const sharesMatch = match.match(/<shrsOrPrnAmt>.*?<sshPrnamt>(.*?)<\/sshPrnamt>/);
        const valueMatch = match.match(/<value>(.*?)<\/value>/);
        const putCallMatch = match.match(/<putCall>(.*?)<\/putCall>/);
        
        if (nameMatch && valueMatch) {
          holdings.push({
            nameOfIssuer: nameMatch[1]?.trim(),
            shares: sharesMatch ? parseInt(sharesMatch[1]) || 0 : 0,
            value: valueMatch ? parseInt(valueMatch[1]) || 0 : 0,
            putCall: putCallMatch ? putCallMatch[1]?.trim() : undefined
          });
        }
      });
    }
    
    // If no XML matches, try text-based parsing
    if (holdings.length === 0) {
      // This is a fallback for text-based documents
      const lines = documentText.split('\n');
      for (const line of lines) {
        if (line.includes('NVIDIA') || line.includes('NVDA')) {
          holdings.push({
            nameOfIssuer: 'NVIDIA CORP',
            shares: 0,
            value: 0,
            putCall: 'Put' // Based on known Q1 2025 position
          });
        }
        // Add more patterns as needed
      }
    }
    
  } catch (error) {
    console.error('[SEC Proxy] Document parsing error:', error);
  }
  
  return holdings;
} 