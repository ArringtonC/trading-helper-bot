/**
 * Browser-Based VIX Data Scraper
 * ===============================
 * 
 * This script can be run directly in your browser's console
 * to scrape VIX data from Yahoo Finance or other financial sites.
 * 
 * INSTRUCTIONS:
 * 1. Go to https://finance.yahoo.com/quote/%5EVIX/history
 * 2. Open browser console (F12 → Console tab)
 * 3. Paste this entire script and press Enter
 * 4. The script will scrape data and download a CSV file
 */

(function() {
    console.log('🔄 Starting browser-based VIX scraper...');
    
    // Method 1: Scrape from Yahoo Finance history table
    function scrapeYahooFinanceTable() {
        console.log('📊 Attempting to scrape Yahoo Finance table...');
        
        // Look for the data table
        const table = document.querySelector('table[data-test="historical-prices"]') || 
                     document.querySelector('table') ||
                     document.querySelector('[data-testid="historical-prices"]');
        
        if (!table) {
            console.log('❌ No table found. Make sure you\'re on the Yahoo Finance VIX history page.');
            return null;
        }
        
        const rows = table.querySelectorAll('tbody tr');
        const vixData = [];
        
        console.log(`📈 Found ${rows.length} data rows`);
        
        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
                try {
                    const dateText = cells[0].textContent.trim();
                    const closeText = cells[4].textContent.trim(); // Close price
                    
                    // Parse date (MMM DD, YYYY format)
                    const closePrice = parseFloat(closeText.replace(/,/g, ''));
                    
                    if (dateText && !isNaN(closePrice)) {
                        // Convert date format
                        const date = new Date(dateText);
                        const formattedDate = date.toISOString().split('T')[0];
                        
                        vixData.push({
                            Date: formattedDate,
                            VIX: closePrice
                        });
                        
                        if (index < 5) {
                            console.log(`   ${formattedDate}: ${closePrice}`);
                        }
                    }
                } catch (error) {
                    console.log(`⚠️ Error parsing row ${index}:`, error.message);
                }
            }
        });
        
        return vixData;
    }
    
    // Method 2: Try to extract from JSON data embedded in page
    function scrapeFromPageData() {
        console.log('🔍 Looking for embedded JSON data...');
        
        // Look for script tags with JSON data
        const scripts = document.querySelectorAll('script');
        
        for (let script of scripts) {
            const content = script.textContent;
            
            // Look for chart data patterns
            if (content.includes('chart') && content.includes('timestamp') && content.includes('close')) {
                try {
                    // Try to extract chart data
                    const chartMatch = content.match(/chart.*?({.*?})/);
                    if (chartMatch) {
                        const jsonStr = chartMatch[1];
                        const data = JSON.parse(jsonStr);
                        
                        if (data.result && data.result[0] && data.result[0].timestamp) {
                            const timestamps = data.result[0].timestamp;
                            const closes = data.result[0].indicators.quote[0].close;
                            
                            const vixData = timestamps.map((timestamp, i) => ({
                                Date: new Date(timestamp * 1000).toISOString().split('T')[0],
                                VIX: closes[i]
                            })).filter(item => item.VIX !== null);
                            
                            console.log(`📊 Extracted ${vixData.length} points from embedded data`);
                            return vixData;
                        }
                    }
                } catch (error) {
                    // Continue searching
                }
            }
        }
        
        return null;
    }
    
    // Method 3: Use Yahoo Finance API directly from browser
    async function fetchVIXFromAPI() {
        console.log('🌐 Trying direct API call...');
        
        try {
            const endTime = Math.floor(Date.now() / 1000);
            const startTime = endTime - (90 * 24 * 60 * 60); // 90 days ago
            
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?period1=${startTime}&period2=${endTime}&interval=1d`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.chart && data.chart.result && data.chart.result[0]) {
                const result = data.chart.result[0];
                const timestamps = result.timestamp;
                const closes = result.indicators.quote[0].close;
                
                const vixData = timestamps.map((timestamp, i) => ({
                    Date: new Date(timestamp * 1000).toISOString().split('T')[0],
                    VIX: closes[i]
                })).filter(item => item.VIX !== null && !isNaN(item.VIX));
                
                console.log(`🎯 API returned ${vixData.length} data points`);
                return vixData;
            }
        } catch (error) {
            console.log('❌ API call failed:', error.message);
        }
        
        return null;
    }
    
    // Function to download CSV
    function downloadCSV(vixData, filename = null) {
        if (!vixData || vixData.length === 0) {
            console.log('❌ No data to download');
            return;
        }
        
        // Generate filename
        if (!filename) {
            const today = new Date().toISOString().split('T')[0];
            filename = `vix-browser-scraped-${today}.csv`;
        }
        
        // Create CSV content with proper line breaks
        const csvHeader = 'Date,VIX\r\n';
        const csvRows = vixData.map(row => `${row.Date},${row.VIX}`).join('\r\n');
        const csvContent = csvHeader + csvRows;
        
        // Create download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`✅ Downloaded: ${filename}`);
        console.log(`📊 Records: ${vixData.length}`);
        console.log(`📅 Range: ${vixData[0].Date} to ${vixData[vixData.length - 1].Date}`);
        
        // Show preview
        console.log('\n📋 Data Preview:');
        console.log('Date,VIX');
        vixData.slice(0, 5).forEach(row => {
            console.log(`${row.Date},${row.VIX}`);
        });
        if (vixData.length > 5) {
            console.log('...');
            console.log(`${vixData[vixData.length - 1].Date},${vixData[vixData.length - 1].VIX}`);
        }
    }
    
    // Main execution
    async function runScraper() {
        console.log('🚀 Browser VIX Scraper v1.0');
        console.log('=============================');
        
        let vixData = null;
        
        // Try method 1: Table scraping
        vixData = scrapeYahooFinanceTable();
        
        // Try method 2: Embedded data
        if (!vixData || vixData.length === 0) {
            vixData = scrapeFromPageData();
        }
        
        // Try method 3: Direct API
        if (!vixData || vixData.length === 0) {
            vixData = await fetchVIXFromAPI();
        }
        
        if (vixData && vixData.length > 0) {
            // Sort by date
            vixData.sort((a, b) => new Date(a.Date) - new Date(b.Date));
            
            console.log(`\n🎉 Success! Scraped ${vixData.length} VIX data points`);
            downloadCSV(vixData);
            
            console.log('\n🎯 Next Steps:');
            console.log('1. Go to: http://localhost:3000/vix-professional');
            console.log('2. Click "Import CSV" button');
            console.log('3. Select the downloaded CSV file');
            console.log('4. View your real VIX data with trading signals!');
            
            return vixData;
        } else {
            console.log('❌ Failed to scrape VIX data from this page');
            console.log('\n💡 Try these alternatives:');
            console.log('1. Make sure you\'re on: https://finance.yahoo.com/quote/%5EVIX/history');
            console.log('2. Try: https://finance.yahoo.com/quote/%5EVIX/chart');
            console.log('3. Try: https://www.cboe.com/tradable_products/vix/');
            console.log('4. Use the Node.js/Python scrapers from the command line');
        }
    }
    
    // Run the scraper
    runScraper();
    
    // Make functions globally available for manual use
    window.scrapeVIXData = runScraper;
    window.downloadVIXCSV = downloadCSV;
    
    console.log('\n💡 Functions available:');
    console.log('- scrapeVIXData() - Run the full scraper');
    console.log('- downloadVIXCSV(data) - Download data as CSV');
    
})();