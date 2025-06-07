const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.POLYGON_API_KEY || 'wSrCptEsGIDm3TywC0AT0P7Bk_ooreDR';
const symbol = 'SPY';
const from = '2021-01-01';
const to = '2024-12-31';

const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${from}/${to}?adjusted=true&sort=asc&apiKey=${API_KEY}`;
const outPath = path.join(__dirname, 'SPY_history.csv');

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    if (!json.results) {
      console.error('No results:', json);
      return;
    }
    // Convert to CSV
    const header = 'date,open,high,low,close,volume\n';
    const rows = json.results.map(row => {
      const date = new Date(row.t).toISOString().split('T')[0];
      return [
        date,
        row.o,
        row.h,
        row.l,
        row.c,
        row.v
      ].join(',');
    });
    fs.writeFileSync(outPath, header + rows.join('\n'));
    console.log('SPY data saved as', outPath);
  });
}).on('error', (err) => {
  console.error('Error downloading SPY data:', err.message);
}); 
 
 
 
 
 