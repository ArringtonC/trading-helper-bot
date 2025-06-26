#!/usr/bin/env node
/**
 * VIX Data Downloader
 * 
 * Automatically downloads VIX data from Yahoo Finance and formats it
 * for import into the VIX Professional Chart
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const DAYS_BACK = 90; // Number of days of historical data
const OUTPUT_FILE = 'vix-data-download.csv';

// Calculate date range
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - DAYS_BACK);

const formatDate = (date) => {
  return Math.floor(date.getTime() / 1000); // Unix timestamp
};

const period1 = formatDate(startDate);
const period2 = formatDate(endDate);

// Yahoo Finance URL for VIX data
const url = `https://query1.finance.yahoo.com/v7/finance/download/%5EVIX?period1=${period1}&period2=${period2}&interval=1d&events=history`;

console.log('🔄 Downloading VIX data from Yahoo Finance...');
console.log(`📅 Date range: ${startDate.toDateString()} to ${endDate.toDateString()}`);

https.get(url, (response) => {
  let data = '';
  
  response.on('data', (chunk) => {
    data += chunk;
  });
  
  response.on('end', () => {
    try {
      // Parse CSV data
      const lines = data.split('\n');
      const header = lines[0];
      
      if (!header.includes('Date') || !header.includes('Close')) {
        throw new Error('Invalid CSV format received');
      }
      
      // Find column indices
      const columns = header.split(',');
      const dateIndex = columns.findIndex(col => col.trim() === 'Date');
      const closeIndex = columns.findIndex(col => col.trim() === 'Close');
      
      if (dateIndex === -1 || closeIndex === -1) {
        throw new Error('Required columns not found');
      }
      
      // Process data lines
      const vixData = ['Date,VIX']; // New header
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length < Math.max(dateIndex, closeIndex) + 1) continue;
        
        const date = values[dateIndex].trim();
        const vix = parseFloat(values[closeIndex].trim());
        
        if (date && !isNaN(vix)) {
          vixData.push(`${date},${vix.toFixed(2)}`);
        }
      }
      
      // Write to file
      const outputPath = path.join(__dirname, '..', OUTPUT_FILE);
      fs.writeFileSync(outputPath, vixData.join('\n'));
      
      console.log('✅ VIX data downloaded successfully!');
      console.log(`📄 File saved: ${outputPath}`);
      console.log(`📊 Records: ${vixData.length - 1} data points`);
      console.log('🎯 Ready to import into VIX Professional Chart!');
      
      // Show first few lines as preview
      console.log('\n📋 Preview:');
      console.log(vixData.slice(0, 5).join('\n'));
      if (vixData.length > 5) {
        console.log('...');
      }
      
    } catch (error) {
      console.error('❌ Error processing data:', error.message);
      console.log('📋 Raw response preview:');
      console.log(data.substring(0, 200));
    }
  });
  
}).on('error', (error) => {
  console.error('❌ Download failed:', error.message);
  console.log('💡 Try manual download from: https://finance.yahoo.com/quote/%5EVIX/history');
});