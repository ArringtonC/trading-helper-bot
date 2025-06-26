#!/usr/bin/env python3
"""
VIX Data Scraper for Yahoo Finance
==================================

Scrapes VIX historical data from Yahoo Finance and formats it
for import into the VIX Professional Chart.

Features:
- Scrapes real VIX data from Yahoo Finance
- Handles different date ranges (1 week to 1 year)
- Outputs clean CSV format ready for import
- Error handling and retry logic
- User-agent rotation to avoid blocking

Requirements:
    pip install requests beautifulsoup4 lxml pandas

Usage:
    python scrape-vix-yahoo.py --days 90
    python scrape-vix-yahoo.py --period 1y
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import re
import time
import random
import argparse
from datetime import datetime, timedelta
from urllib.parse import urlencode
import sys
import os

class VIXScraper:
    def __init__(self):
        self.session = requests.Session()
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
        ]
        
    def get_random_headers(self):
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }

    def calculate_timestamps(self, days=None, period=None):
        """Calculate start and end timestamps for the request"""
        end_date = datetime.now()
        
        if period:
            if period == '1w':
                start_date = end_date - timedelta(weeks=1)
            elif period == '1m':
                start_date = end_date - timedelta(days=30)
            elif period == '3m':
                start_date = end_date - timedelta(days=90)
            elif period == '6m':
                start_date = end_date - timedelta(days=180)
            elif period == '1y':
                start_date = end_date - timedelta(days=365)
            else:
                start_date = end_date - timedelta(days=90)  # Default
        else:
            days = days or 90
            start_date = end_date - timedelta(days=days)
        
        return int(start_date.timestamp()), int(end_date.timestamp())

    def scrape_vix_data(self, days=None, period=None, retries=3):
        """Scrape VIX data from Yahoo Finance"""
        period1, period2 = self.calculate_timestamps(days, period)
        
        # Yahoo Finance download URL
        url = f"https://query1.finance.yahoo.com/v7/finance/download/%5EVIX"
        params = {
            'period1': period1,
            'period2': period2,
            'interval': '1d',
            'events': 'history',
            'includeAdjustedClose': 'true'
        }
        
        for attempt in range(retries):
            try:
                print(f"🔄 Attempt {attempt + 1}: Downloading VIX data from Yahoo Finance...")
                
                # Random delay to be respectful
                time.sleep(random.uniform(1, 3))
                
                response = self.session.get(
                    url, 
                    params=params,
                    headers=self.get_random_headers(),
                    timeout=30
                )
                
                if response.status_code == 200:
                    return self.parse_csv_response(response.text)
                elif response.status_code == 429:
                    print(f"⚠️ Rate limited. Waiting {(attempt + 1) * 10} seconds...")
                    time.sleep((attempt + 1) * 10)
                else:
                    print(f"❌ HTTP {response.status_code}: {response.text[:200]}")
                    
            except Exception as e:
                print(f"❌ Attempt {attempt + 1} failed: {str(e)}")
                if attempt < retries - 1:
                    time.sleep(5)
                
        return None

    def parse_csv_response(self, csv_text):
        """Parse CSV response and extract VIX data"""
        try:
            lines = csv_text.strip().split('\n')
            if len(lines) < 2:
                raise ValueError("Invalid CSV format")
            
            # Parse header
            header = lines[0].split(',')
            if 'Date' not in header or 'Close' not in header:
                raise ValueError("Required columns not found")
            
            date_idx = header.index('Date')
            close_idx = header.index('Close')
            
            vix_data = []
            for line in lines[1:]:
                if not line.strip():
                    continue
                    
                columns = line.split(',')
                if len(columns) > max(date_idx, close_idx):
                    try:
                        date = columns[date_idx].strip()
                        vix_value = float(columns[close_idx].strip())
                        
                        if date and not pd.isna(vix_value):
                            vix_data.append({
                                'Date': date,
                                'VIX': round(vix_value, 2)
                            })
                    except (ValueError, IndexError):
                        continue
            
            return vix_data
            
        except Exception as e:
            print(f"❌ Error parsing CSV: {str(e)}")
            return None

    def scrape_with_selenium_fallback(self, days=None, period=None):
        """Fallback method using Selenium (requires selenium and chromedriver)"""
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            
            print("🔄 Using Selenium fallback method...")
            
            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            
            driver = webdriver.Chrome(options=chrome_options)
            
            # Navigate to Yahoo Finance VIX page
            driver.get("https://finance.yahoo.com/quote/%5EVIX/history")
            
            # Wait for page to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "table"))
            )
            
            # Find download link and click it
            download_link = driver.find_element(By.LINK_TEXT, "Download")
            download_link.click()
            
            time.sleep(5)  # Wait for download
            driver.quit()
            
            print("✅ Download initiated via Selenium")
            return "selenium_download"
            
        except ImportError:
            print("❌ Selenium not available. Install with: pip install selenium")
            return None
        except Exception as e:
            print(f"❌ Selenium fallback failed: {str(e)}")
            return None

    def save_to_csv(self, vix_data, filename=None):
        """Save VIX data to CSV file"""
        if not vix_data:
            print("❌ No data to save")
            return None
            
        df = pd.DataFrame(vix_data)
        
        # Sort by date
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date')
        df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')
        
        # Generate filename if not provided
        if not filename:
            today = datetime.now().strftime('%Y-%m-%d')
            filename = f"vix-data-scraped-{today}.csv"
        
        # Save to file
        filepath = os.path.join(os.path.dirname(__file__), '..', filename)
        df.to_csv(filepath, index=False)
        
        print(f"✅ VIX data saved to: {filepath}")
        print(f"📊 Records saved: {len(df)}")
        print(f"📅 Date range: {df['Date'].min()} to {df['Date'].max()}")
        
        # Show preview
        print("\n📋 Data Preview:")
        print(df.head(10).to_string(index=False))
        if len(df) > 10:
            print("...")
            
        return filepath

def main():
    parser = argparse.ArgumentParser(description='Scrape VIX data from Yahoo Finance')
    parser.add_argument('--days', type=int, help='Number of days of historical data (default: 90)')
    parser.add_argument('--period', choices=['1w', '1m', '3m', '6m', '1y'], 
                       help='Time period (1w, 1m, 3m, 6m, 1y)')
    parser.add_argument('--output', help='Output filename (default: auto-generated)')
    parser.add_argument('--selenium', action='store_true', 
                       help='Use Selenium fallback method')
    
    args = parser.parse_args()
    
    print("🚀 VIX Data Scraper for Yahoo Finance")
    print("=" * 40)
    
    scraper = VIXScraper()
    
    if args.selenium:
        result = scraper.scrape_with_selenium_fallback(args.days, args.period)
        if result == "selenium_download":
            print("📁 Check your Downloads folder for the VIX CSV file")
            return
    else:
        vix_data = scraper.scrape_vix_data(args.days, args.period)
        
        if vix_data:
            filepath = scraper.save_to_csv(vix_data, args.output)
            print(f"\n🎯 Ready to import into VIX Professional Chart!")
            print(f"👉 Go to: http://localhost:3000/vix-professional")
            print(f"👉 Click 'Import CSV' and select: {os.path.basename(filepath)}")
        else:
            print("❌ Failed to scrape VIX data")
            print("💡 Try using --selenium flag for fallback method")
            print("💡 Or download manually from: https://finance.yahoo.com/quote/%5EVIX/history")

if __name__ == "__main__":
    main()