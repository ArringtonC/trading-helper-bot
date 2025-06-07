const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
if (!API_KEY) {
  console.error('Error: Please set your Alpha Vantage API key in the ALPHA_VANTAGE_API_KEY environment variable.');
  process.exit(1);
}

const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=SPY&outputsize=full&datatype=csv&apikey=${API_KEY}`;
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
    console.log('SPY data saved as', outPath);
  });
}).on('error', (err) => {
  console.error('Error downloading SPY data:', err.message);
}); 