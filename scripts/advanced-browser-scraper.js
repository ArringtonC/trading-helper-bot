#!/usr/bin/env node
/**
 * Advanced Browser-Automated VIX Scraper
 * Uses Puppeteer to control a real browser and bypass detection
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AdvancedBrowserScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Starting advanced browser scraper...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Set realistic browser properties
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await this.page.setViewport({ width: 1366, height: 768 });
    
    // Remove automation detection
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
  }

  async scrapeYahooFinance() {
    console.log('📊 Scraping Yahoo Finance VIX data...');
    
    try {
      await this.page.goto('https://finance.yahoo.com/quote/%5EVIX/history', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for data table to load
      await this.page.waitForSelector('table[data-test="historical-prices"]', { timeout: 15000 });

      // Extract VIX data
      const vixData = await this.page.evaluate(() => {
        const table = document.querySelector('table[data-test="historical-prices"]');
        if (!table) return [];

        const rows = table.querySelectorAll('tbody tr');
        const data = [];

        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 6) {
            try {
              const dateText = cells[0].textContent.trim();
              const closeText = cells[4].textContent.trim();
              
              const date = new Date(dateText);
              const vix = parseFloat(closeText.replace(/,/g, ''));
              
              if (!isNaN(date.getTime()) && !isNaN(vix)) {
                data.push({
                  Date: date.toISOString().split('T')[0],
                  VIX: vix
                });
              }
            } catch (error) {
              console.log('Error parsing row:', error);
            }
          }
        });

        return data;
      });

      console.log(`✅ Scraped ${vixData.length} data points from Yahoo Finance`);
      return vixData;

    } catch (error) {
      console.log('❌ Yahoo Finance scraping failed:', error.message);
      return null;
    }
  }

  async scrapeCBOE() {
    console.log('📊 Scraping CBOE VIX data...');
    
    try {
      await this.page.goto('https://www.cboe.com/tradable_products/vix/', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Look for VIX data on CBOE site
      const vixData = await this.page.evaluate(() => {
        const tables = document.querySelectorAll('table');
        const data = [];

        tables.forEach(table => {
          const rows = table.querySelectorAll('tr');
          
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
              const dateText = cells[0]?.textContent?.trim();
              const vixText = cells[1]?.textContent?.trim();
              
              if (dateText && vixText) {
                try {
                  const date = new Date(dateText);
                  const vix = parseFloat(vixText.replace(/[^\d.]/g, ''));
                  
                  if (!isNaN(date.getTime()) && !isNaN(vix) && vix > 5 && vix < 100) {
                    data.push({
                      Date: date.toISOString().split('T')[0],
                      VIX: vix
                    });
                  }
                } catch (error) {
                  // Skip invalid rows
                }
              }
            }
          });
        });

        return data;
      });

      console.log(`✅ Scraped ${vixData.length} data points from CBOE`);
      return vixData;

    } catch (error) {
      console.log('❌ CBOE scraping failed:', error.message);
      return null;
    }
  }

  async scrapeInvesting() {
    console.log('📊 Scraping Investing.com VIX data...');
    
    try {
      await this.page.goto('https://www.investing.com/indices/volatility-s-p-500-historical-data', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for historical data table
      await this.page.waitForSelector('#curr_table', { timeout: 15000 });

      const vixData = await this.page.evaluate(() => {
        const table = document.querySelector('#curr_table');
        if (!table) return [];

        const rows = table.querySelectorAll('tbody tr');
        const data = [];

        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            try {
              const dateText = cells[0].textContent.trim();
              const closeText = cells[1].textContent.trim();
              
              const date = new Date(dateText);
              const vix = parseFloat(closeText.replace(/,/g, ''));
              
              if (!isNaN(date.getTime()) && !isNaN(vix)) {
                data.push({
                  Date: date.toISOString().split('T')[0],
                  VIX: vix
                });
              }
            } catch (error) {
              // Skip invalid rows
            }
          }
        });

        return data;
      });

      console.log(`✅ Scraped ${vixData.length} data points from Investing.com`);
      return vixData;

    } catch (error) {
      console.log('❌ Investing.com scraping failed:', error.message);
      return null;
    }
  }

  async scrapeMarketWatch() {
    console.log('📊 Scraping MarketWatch VIX data...');
    
    try {
      await this.page.goto('https://www.marketwatch.com/investing/index/vix/charts', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Try to find chart data or tables
      const vixData = await this.page.evaluate(() => {
        // Look for any data tables or chart data
        const tables = document.querySelectorAll('table');
        const data = [];

        tables.forEach(table => {
          const rows = table.querySelectorAll('tr');
          
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
              const text1 = cells[0]?.textContent?.trim();
              const text2 = cells[1]?.textContent?.trim();
              
              // Try to parse as date and VIX value
              try {
                const date = new Date(text1);
                const vix = parseFloat(text2.replace(/[^\d.]/g, ''));
                
                if (!isNaN(date.getTime()) && !isNaN(vix) && vix > 5 && vix < 100) {
                  data.push({
                    Date: date.toISOString().split('T')[0],
                    VIX: vix
                  });
                }
              } catch (error) {
                // Try reverse order
                try {
                  const date = new Date(text2);
                  const vix = parseFloat(text1.replace(/[^\d.]/g, ''));
                  
                  if (!isNaN(date.getTime()) && !isNaN(vix) && vix > 5 && vix < 100) {
                    data.push({
                      Date: date.toISOString().split('T')[0],
                      VIX: vix
                    });
                  }
                } catch (error2) {
                  // Skip invalid rows
                }
              }
            }
          });
        });

        return data;
      });

      console.log(`✅ Scraped ${vixData.length} data points from MarketWatch`);
      return vixData;

    } catch (error) {
      console.log('❌ MarketWatch scraping failed:', error.message);
      return null;
    }
  }

  async saveVixData(vixData, filename) {
    if (!vixData || vixData.length === 0) {
      console.log('❌ No data to save');
      return;
    }

    // Remove duplicates and sort
    const uniqueData = vixData.filter((item, index, self) => 
      index === self.findIndex(t => t.Date === item.Date)
    ).sort((a, b) => new Date(a.Date) - new Date(b.Date));

    // Create CSV content
    const csvHeader = 'Date,VIX\n';
    const csvRows = uniqueData.map(row => `${row.Date},${row.VIX}`).join('\n');
    const csvContent = csvHeader + csvRows;

    // Save to file
    const filepath = path.join(__dirname, '..', filename);
    fs.writeFileSync(filepath, csvContent);

    console.log('✅ VIX data saved successfully!');
    console.log(`📄 File: ${filepath}`);
    console.log(`📊 Records: ${uniqueData.length} data points`);
    console.log(`📅 Range: ${uniqueData[0].Date} to ${uniqueData[uniqueData.length - 1].Date}`);

    // Show preview
    console.log('\n📋 Data Preview:');
    console.log('Date,VIX');
    const previewCount = Math.min(5, uniqueData.length);
    for (let i = 0; i < previewCount; i++) {
      console.log(`${uniqueData[i].Date},${uniqueData[i].VIX}`);
    }
    if (uniqueData.length > previewCount) {
      console.log('...');
      const lastIndex = uniqueData.length - 1;
      console.log(`${uniqueData[lastIndex].Date},${uniqueData[lastIndex].VIX}`);
    }
  }

  async run() {
    try {
      await this.init();

      const sites = [
        { name: 'Yahoo Finance', scraper: () => this.scrapeYahooFinance() },
        { name: 'CBOE', scraper: () => this.scrapeCBOE() },
        { name: 'Investing.com', scraper: () => this.scrapeInvesting() },
        { name: 'MarketWatch', scraper: () => this.scrapeMarketWatch() }
      ];

      let allData = [];

      for (let site of sites) {
        console.log(`\n🔄 Trying ${site.name}...`);
        try {
          const data = await site.scraper();
          if (data && data.length > 0) {
            allData = allData.concat(data);
            console.log(`✅ Got ${data.length} points from ${site.name}`);
          }
        } catch (error) {
          console.log(`❌ ${site.name} failed:`, error.message);
        }

        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (allData.length > 0) {
        const filename = `vix-browser-scraped-${new Date().toISOString().split('T')[0]}.csv`;
        await this.saveVixData(allData, filename);

        console.log('\n🎯 Next Steps:');
        console.log('1. Go to: http://localhost:3000/vix-professional');
        console.log('2. Click "Import CSV" button');
        console.log(`3. Select file: ${filename}`);
        console.log('4. View your real VIX data with trading signals!');
      } else {
        console.log('\n❌ No VIX data found from any source');
        console.log('💡 Try the manual methods or check internet connection');
      }

    } catch (error) {
      console.error('💥 Scraper failed:', error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Command line usage
if (require.main === module) {
  const scraper = new AdvancedBrowserScraper();
  
  scraper.run().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down scraper...');
    await scraper.close();
    process.exit(0);
  });
}

module.exports = AdvancedBrowserScraper;