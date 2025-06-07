const https = require('https');
const fs = require('fs');
const path = require('path');

// Set your desired date range - from 1 year ago to today
const startDate = new Date();
startDate.setFullYear(startDate.getFullYear() - 2); // Go back 2 years for more data
const period1 = Math.floor(startDate.getTime() / 1000); // Start date

const endDate = new Date(); // Today
const period2 = Math.floor(endDate.getTime() / 1000); // End date (today)

console.log(`Downloading SPY data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

const url = `https://query1.finance.yahoo.com/v7/finance/download/SPY?period1=${period1}&period2=${period2}&interval=1d&events=history&includeAdjustedClose=true`;

const outPath = path.join(__dirname, 'SPY_history.csv');

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error('Failed to download SPY data:', res.statusCode);
    res.resume();
    return;
  }
  const file = fs.createWriteStream(outPath);
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log(`SPY data saved as ${outPath}`);
    console.log(`Data range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  });
}).on('error', (err) => {
  console.error('Error downloading SPY data:', err.message);
}); 
 
 
 
 
 