#!/usr/bin/env python3
"""
Debug script to test HMM prediction pipeline step by step
"""

import sys
import pandas as pd
import numpy as np
import joblib
from datetime import datetime

# Import the functions from our modules
from app import acquire_and_prepare_data
from hmm_predictor import predict_regimes, map_states_to_regimes

def debug_prediction():
    symbol = "SPY"
    start_date = "2025-05-24"
    end_date = "2025-06-07"
    
    print(f"🔍 Debugging HMM prediction for {symbol} from {start_date} to {end_date}")
    
    # Test both with and without VIX to see which matches
    for include_vix in [False, True]:
        print(f"\n{'='*60}")
        print(f"🧪 Testing with include_vix={include_vix}")
        print(f"{'='*60}")
        
        # Step 1: Test data acquisition
        print("\n📊 Step 1: Testing data acquisition...")
        try:
            features_df = acquire_and_prepare_data(
                symbol, start_date, end_date, include_vix=include_vix
            )
            
            if features_df is None:
                print("❌ Data acquisition returned None")
                continue
            elif features_df.empty:
                print("❌ Data acquisition returned empty DataFrame")
                continue
            else:
                print(f"✅ Data acquisition successful. Shape: {features_df.shape}")
                print(f"Columns: {features_df.columns.tolist()}")
                print(f"Date range: {features_df.index.min()} to {features_df.index.max()}")
                print(f"Sample data:\n{features_df.head()}")
                
        except Exception as e:
            print(f"❌ Data acquisition failed: {e}")
            import traceback
            traceback.print_exc()
            continue
        
        # Step 2: Test model loading
        print("\n🤖 Step 2: Testing model loading...")
        try:
            model_path = f"./models/{symbol}_hmm_model.pkl"
            means_path = f"./models/{symbol}_trained_means.pkl"
            
            model = joblib.load(model_path)
            trained_means = joblib.load(means_path)
            
            print(f"✅ Model loaded successfully from {model_path}")
            print(f"Model components: {model.n_components}")
            print(f"Model expects: {model.means_.shape[1]} features")
            print(f"Data provides: {features_df.shape[1]} features")
            
            if model.means_.shape[1] == features_df.shape[1]:
                print("🎯 FEATURE DIMENSIONS MATCH!")
            else:
                print("❌ FEATURE DIMENSION MISMATCH!")
                print(f"   Expected: {model.means_.shape[1]}")
                print(f"   Got: {features_df.shape[1]}")
                continue
                
        except Exception as e:
            print(f"❌ Model loading failed: {e}")
            continue
        
        # Step 3: Test prediction
        print("\n🔮 Step 3: Testing HMM prediction...")
        try:
            predicted_states = predict_regimes(model, features_df, return_probabilities=False)
            
            if predicted_states is None:
                print("❌ Prediction returned None")
                continue
            else:
                print(f"✅ Prediction successful. Shape: {predicted_states.shape}")
                print(f"Predicted states: {predicted_states.values}")
                print(f"Sample predictions:\n{predicted_states.head()}")
                
        except Exception as e:
            print(f"❌ Prediction failed: {e}")
            import traceback
            traceback.print_exc()
            continue
        
        # Step 4: Test state mapping
        print("\n🏷️ Step 4: Testing state mapping...")
        try:
            regime_sequence = map_states_to_regimes(predicted_states, model)
            
            if regime_sequence is None:
                print("❌ State mapping returned None")
                continue
            else:
                print(f"✅ State mapping successful. Shape: {regime_sequence.shape}")
                print(f"Sample mapped regimes:\n{regime_sequence.head()}")
                
        except Exception as e:
            print(f"❌ State mapping failed: {e}")
            import traceback
            traceback.print_exc()
            continue
        
        # Step 5: Test final JSON conversion
        print("\n📝 Step 5: Testing JSON conversion...")
        try:
            regime_history = [{'date': date.strftime('%Y-%m-%d'), 'regime': regime}
                             for date, regime in regime_sequence.items()]
            
            print(f"✅ JSON conversion successful. {len(regime_history)} entries")
            print(f"Sample JSON: {regime_history[:3]}")
            
        except Exception as e:
            print(f"❌ JSON conversion failed: {e}")
            import traceback
            traceback.print_exc()
            continue
        
        print(f"\n🎉 All steps completed successfully with include_vix={include_vix}!")
        return regime_history
    
    print("\n❌ No configuration worked successfully")
    return None

if __name__ == "__main__":
    debug_prediction() 