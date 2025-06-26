#!/usr/bin/env node
/**
 * Fresh VIX Data Downloader
 * Quick script to get latest VIX data using multiple methods
 */

console.log('🔄 Fresh VIX Data Downloader');
console.log('===========================');

console.log('\n📋 Choose your download method:\n');

console.log('1️⃣ BROWSER CONSOLE (Recommended)');
console.log('   • Go to: https://finance.yahoo.com/quote/%5EVIX/history');
console.log('   • Press F12 → Console tab');
console.log('   • Copy-paste this code:\n');

console.log(`// Fresh VIX Scraper - Copy this entire block
(function() {
    console.log('🔄 VIX Scraper Starting...');
    const tables = document.querySelectorAll('table');
    let vixData = [];
    
    tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
                const dateText = cells[0]?.textContent?.trim();
                const vixText = cells[4]?.textContent?.trim() || cells[1]?.textContent?.trim();
                
                if (dateText && vixText) {
                    const vixValue = parseFloat(vixText.replace(/[,$%]/g, ''));
                    if (!isNaN(vixValue) && vixValue > 5 && vixValue < 100) {
                        try {
                            const date = new Date(dateText);
                            if (!isNaN(date.getTime())) {
                                vixData.push({
                                    Date: date.toISOString().split('T')[0],
                                    VIX: vixValue
                                });
                            }
                        } catch (e) {}
                    }
                }
            }
        });
    });
    
    vixData = vixData.filter((item, index, self) => 
        index === self.findIndex(t => t.Date === item.Date)
    ).sort((a, b) => new Date(a.Date) - new Date(b.Date));
    
    if (vixData.length > 0) {
        const csv = 'Date,VIX\\n' + vixData.map(d => \`\${d.Date},\${d.VIX}\`).join('\\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`vix-fresh-\${new Date().toISOString().split('T')[0]}.csv\`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(\`✅ Downloaded \${vixData.length} VIX data points!\`);
    } else {
        console.log('❌ No VIX data found');
    }
})();`);

console.log('\n2️⃣ MANUAL TOOL');
console.log('   • Open: scripts/manual-webpage-scraper.html');
console.log('   • Copy VIX table from any financial site');
console.log('   • Paste and download');

console.log('\n3️⃣ COMMAND LINE (if you have puppeteer)');
console.log('   • npm install puppeteer');
console.log('   • node scripts/advanced-browser-scraper.js');

console.log('\n4️⃣ ALTERNATIVE SITES');
console.log('   • CBOE: https://www.cboe.com/tradable_products/vix/');
console.log('   • Investing: https://www.investing.com/indices/volatility-s-p-500-historical-data');
console.log('   • MarketWatch: https://www.marketwatch.com/investing/index/vix');

console.log('\n🎯 After downloading:');
console.log('1. If file has issues, run: node scripts/csv-validator.js /path/to/file.csv');
console.log('2. Import at: http://localhost:3000/vix-professional');
console.log('3. Click "Import CSV" and select your file');

console.log('\n💡 Tip: Method #1 (browser console) is fastest and most reliable!');