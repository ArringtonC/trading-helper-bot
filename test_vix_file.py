#!/usr/bin/env python3
"""
Test script to verify VIX file integration
"""

import sys
import os
sys.path.append('hmm-service')

from data_acquisition import MarketDataAcquisition

def test_vix_file():
    print("🧪 Testing VIX File Integration")
    print("=" * 50)
    
    # Initialize data acquirer
    data_acquirer = MarketDataAcquisition()
    
    # Test date range
    start_date = "2024-01-01"
    end_date = "2024-12-31"
    
    print(f"📅 Testing date range: {start_date} to {end_date}")
    print()
    
    # Check for VIX files in common locations
    potential_vix_paths = [
        'data/VIX_IBKR_2025-05-24.csv',  # Your specific VIX file
        'data/vix.csv',
        'data/VIX.csv', 
        'data/vix_data.csv',
        'hmm-service/vix.csv',
        'hmm-service/VIX.csv',
        'vix.csv',
        'VIX.csv'
    ]
    
    print("🔍 Checking for VIX files...")
    found_files = []
    for path in potential_vix_paths:
        if os.path.exists(path):
            found_files.append(path)
            print(f"  ✅ Found: {path}")
        else:
            print(f"  ❌ Not found: {path}")
    
    if not found_files:
        print("\n📂 No VIX files found. Place your VIX file in one of these locations:")
        for path in potential_vix_paths[:3]:  # Show top 3 recommended
            print(f"  • {path}")
        return
    
    print(f"\n📊 Testing VIX data loading...")
    
    # Test with the first found file
    vix_file_path = found_files[0]
    print(f"Using: {vix_file_path}")
    
    try:
        vix_df = data_acquirer.fetch_vix_data(start_date, end_date, vix_file_path)
        
        if vix_df is None:
            print("❌ VIX data loading failed")
            return
        
        if vix_df.empty:
            print("❌ VIX data is empty")
            return
        
        print(f"✅ VIX data loaded successfully!")
        print(f"📈 Rows: {len(vix_df)}")
        print(f"📅 Date range: {vix_df.index.min()} to {vix_df.index.max()}")
        print(f"📊 VIX range: {vix_df['vix'].min():.2f} to {vix_df['vix'].max():.2f}")
        print(f"📊 VIX mean: {vix_df['vix'].mean():.2f}")
        
        print(f"\n📋 Sample data:")
        print(vix_df.head())
        
        print(f"\n🎯 Your VIX file is ready for use!")
        
    except Exception as e:
        print(f"❌ Error testing VIX file: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_vix_file() 