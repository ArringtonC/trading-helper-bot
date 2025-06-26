#!/usr/bin/env node
/**
 * Simple VIX Data Scraper for Yahoo Finance
 * ========================================
 * 
 * Scrapes VIX historical data using Node.js built-in modules
 * No external dependencies required!
 * 
 * Usage:
 *   node scrape-vix-simple.js
 *   node scrape-vix-simple.js --days 180
 *   node scrape-vix-simple.js --period 1y
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class SimpleVIXScraper {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  calculateTimestamps(days = 90, period = null) {
    const endDate = new Date();
    let startDate;

    if (period) {
      switch (period) {
        case '1w': startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case '1m': startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); break;
        case '3m': startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); break;
        case '6m': startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000); break;
        case '1y': startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000); break;
        default: startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
    } else {
      startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    }

    return {
      period1: Math.floor(startDate.getTime() / 1000),
      period2: Math.floor(endDate.getTime() / 1000)
    };
  }

  scrapeVIXData(days = 90, period = null) {
    return new Promise((resolve, reject) => {
      const { period1, period2 } = this.calculateTimestamps(days, period);
      
      const params = new URLSearchParams({
        period1: period1,
        period2: period2,
        interval: '1d',
        events: 'history',
        includeAdjustedClose: 'true'
      });

      const url = `https://query1.finance.yahoo.com/v7/finance/download/%5EVIX?${params}`;
      
      console.log('🔄 Downloading VIX data from Yahoo Finance...');
      console.log(`📅 Date range: ${new Date(period1 * 1000).toDateString()} to ${new Date(period2 * 1000).toDateString()}`);

      const options = {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/csv,application/csv,text/plain,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache'
        },
        timeout: 30000
      };

      const req = https.get(url, options, (res) => {
        let data = '';

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const vixData = this.parseCSVData(data);
            resolve(vixData);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  parseCSVData(csvText) {
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('Invalid CSV format - insufficient data');
    }

    // Parse header
    const header = lines[0].split(',');
    const dateIndex = header.findIndex(col => col.trim().toLowerCase() === 'date');
    const closeIndex = header.findIndex(col => col.trim().toLowerCase() === 'close');

    if (dateIndex === -1 || closeIndex === -1) {
      throw new Error('Required columns (Date, Close) not found in CSV');
    }

    console.log(`📊 Found columns: Date (${dateIndex}), Close (${closeIndex})`);

    const vixData = [];
    let skippedRows = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',');
      
      if (columns.length > Math.max(dateIndex, closeIndex)) {
        try {
          const date = columns[dateIndex].trim();
          const vixValue = parseFloat(columns[closeIndex].trim());

          if (date && !isNaN(vixValue) && vixValue > 0) {
            vixData.push({
              Date: date,
              VIX: Math.round(vixValue * 100) / 100 // Round to 2 decimal places
            });
          } else {
            skippedRows++;
          }
        } catch (error) {
          skippedRows++;
        }
      }
    }

    if (skippedRows > 0) {
      console.log(`⚠️ Skipped ${skippedRows} invalid rows`);
    }

    if (vixData.length === 0) {
      throw new Error('No valid VIX data found in response');
    }

    // Sort by date (oldest first)
    vixData.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    return vixData;
  }

  saveToCSV(vixData, filename = null) {
    if (!vixData || vixData.length === 0) {
      throw new Error('No data to save');
    }

    // Generate filename if not provided
    if (!filename) {
      const today = new Date().toISOString().split('T')[0];
      filename = `vix-scraped-${today}.csv`;
    }

    // Create CSV content
    const csvHeader = 'Date,VIX\n';
    const csvRows = vixData.map(row => `${row.Date},${row.VIX}`).join('\n');
    const csvContent = csvHeader + csvRows;

    // Save to file
    const filepath = path.join(__dirname, '..', filename);
    fs.writeFileSync(filepath, csvContent);

    console.log('✅ VIX data saved successfully!');
    console.log(`📄 File: ${filepath}`);
    console.log(`📊 Records: ${vixData.length} data points`);
    console.log(`📅 Range: ${vixData[0].Date} to ${vixData[vixData.length - 1].Date}`);

    // Show preview
    console.log('\n📋 Data Preview:');
    console.log('Date,VIX');
    const previewCount = Math.min(5, vixData.length);
    for (let i = 0; i < previewCount; i++) {
      console.log(`${vixData[i].Date},${vixData[i].VIX}`);
    }
    if (vixData.length > previewCount) {
      console.log('...');
      const lastIndex = vixData.length - 1;
      console.log(`${vixData[lastIndex].Date},${vixData[lastIndex].VIX}`);
    }

    return filepath;
  }

  async scrapeWithRetry(days = 90, period = null, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
        
        if (attempt > 1) {
          // Wait before retry
          const delay = attempt * 2000; // 2s, 4s, 6s
          console.log(`⏳ Waiting ${delay/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const vixData = await this.scrapeVIXData(days, period);
        return vixData;
        
      } catch (error) {
        console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { days: 90, period: null, output: null };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--days':
        if (i + 1 < args.length) {
          options.days = parseInt(args[i + 1]);
          i++;
        }
        break;
      case '--period':
        if (i + 1 < args.length) {
          options.period = args[i + 1];
          i++;
        }
        break;
      case '--output':
        if (i + 1 < args.length) {
          options.output = args[i + 1];
          i++;
        }
        break;
      case '--help':
        console.log(`
VIX Data Scraper - Usage:
  node scrape-vix-simple.js [options]

Options:
  --days <number>     Number of days of historical data (default: 90)
  --period <period>   Time period: 1w, 1m, 3m, 6m, 1y
  --output <filename> Output filename (default: auto-generated)
  --help             Show this help message

Examples:
  node scrape-vix-simple.js
  node scrape-vix-simple.js --days 180
  node scrape-vix-simple.js --period 1y
  node scrape-vix-simple.js --period 3m --output my-vix-data.csv
        `);
        process.exit(0);
    }
  }

  return options;
}

// Main execution
async function main() {
  console.log('🚀 Simple VIX Data Scraper');
  console.log('=' * 30);

  try {
    const options = parseArgs();
    const scraper = new SimpleVIXScraper();

    const vixData = await scraper.scrapeWithRetry(options.days, options.period);
    const filepath = scraper.saveToCSV(vixData, options.output);

    console.log('\n🎯 Next Steps:');
    console.log('1. Go to: http://localhost:3000/vix-professional');
    console.log('2. Click "Import CSV" button');
    console.log(`3. Select file: ${path.basename(filepath)}`);
    console.log('4. View your real VIX data with trading signals!');

  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
    console.log('\n💡 Alternative options:');
    console.log('1. Try again in a few minutes (rate limiting)');
    console.log('2. Use the Python scraper: python scripts/scrape-vix-yahoo.py');
    console.log('3. Download manually: https://finance.yahoo.com/quote/%5EVIX/history');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}