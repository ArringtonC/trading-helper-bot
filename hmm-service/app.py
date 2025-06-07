from flask import Flask, request, jsonify, send_from_directory
import numpy as np
import pandas as pd
import os
# Add datetime for more robust date validation
from datetime import datetime, timezone
from flask_cors import CORS # Import CORS
import yfinance as yf
import joblib
import io
import json
import sys
import traceback
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set matplotlib backend for non-GUI environments (fixes macOS threading issues)
import matplotlib
matplotlib.use('Agg')

# Assuming hmm_trainer and hmm_predictor are available in the same directory
# TODO: Consider organizing these into a package later
# Removed import of HMMTrainer as it's not a class
from hmm_trainer import load_price_data, train_hmm_model, save_model, create_features as create_hmm_features
from hmm_predictor import load_model, predict_regimes, load_price_data_for_prediction, map_states_to_regimes

# Import data acquisition, preprocessing, feature engineering, and trade processing modules
from data_acquisition import MarketDataAcquisition
from data_preprocessing import handle_missing_values, handle_outliers, normalize_data # Added normalize_data
from features_utils import create_features, calculate_technical_indicators, calculate_volatility_metrics # Import from the new file
from trade_data_processing import load_and_parse_trades, engineer_trade_features # Import trade data functions
from data_storage import get_historical_data, create_connection, DATABASE_FILE
from evaluation import VIXEvaluationFramework

# Import new ML ensemble
from ml_ensemble_basic import BasicMLEnsemble

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Define the directory to save/load models
MODEL_DIR = './models'
if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

# Embed the CSV content directly as a string
DUMMY_MARKET_DATA_CSV = """Date,Open,High,Low,Close,Adj Close,Volume
31-Dec-24,475.00,476.00,474.00,475.50,475.50,1000000
30-Dec-24,474.50,475.50,473.50,475.00,475.00,1200000
27-Dec-24,473.00,474.00,472.50,473.50,473.50,1100000
26-Dec-24,472.00,473.50,471.50,473.00,473.00,1300000
24-Dec-24,471.50,472.00,470.50,471.50,471.50,900000
23-Dec-24,470.00,471.00,469.50,470.50,470.50,1050000
20-Dec-24,469.50,470.00,468.50,470.00,470.00,1150000
19-Dec-24,468.00,469.50,467.50,469.50,469.50,1250000
18-Dec-24,467.50,468.00,466.50,468.00,468.00,1350000
17-Dec-24,466.00,467.50,465.50,467.50,467.50,1450000
16-Dec-24,465.50,466.00,464.50,466.00,466.00,1550000
13-Dec-24,464.00,465.50,463.50,465.50,465.50,1650000
12-Dec-24,463.50,464.00,462.50,464.00,464.00,1750000
11-Dec-24,462.00,463.50,461.50,463.50,463.50,1850000
10-Dec-24,461.50,462.00,460.50,462.00,462.00,1950000
09-Dec-24,460.00,461.50,459.50,461.50,461.50,2050000
06-Dec-24,459.50,460.00,458.50,460.00,460.00,2150000
05-Dec-24,458.00,459.50,457.50,459.50,459.50,2250000
04-Dec-24,457.50,458.00,456.50,458.00,458.00,2350000
03-Dec-24,456.00,457.50,455.50,457.50,457.50,2450000
02-Dec-24,455.50,456.00,454.50,456.00,456.00,2550000
01-Dec-24,454.00,455.50,453.50,455.50,455.50,2650000
30-Nov-24,453.50,454.00,452.50,453.00,453.00,2700000
29-Nov-24,453.00,453.50,452.00,452.50,452.50,2800000
28-Nov-24,452.00,453.00,451.50,452.00,452.00,2900000
27-Nov-24,451.50,452.00,451.00,451.50,451.50,3000000
26-Nov-24,450.00,451.50,450.50,451.00,451.00,3100000
25-Nov-24,450.50,451.00,449.50,450.50,450.50,3200000
22-Nov-24,449.00,450.50,448.50,450.00,450.00,3300000
21-Nov-24,448.50,449.00,448.00,448.50,448.50,3400000
20-Nov-24,447.00,448.50,446.50,448.00,448.00,3500000
19-Nov-24,446.50,447.00,446.00,446.50,446.50,3600000
18-Nov-24,445.00,446.50,445.50,446.00,446.00,3700000
15-Nov-24,444.50,445.00,444.00,444.50,444.50,3800000
14-Nov-24,443.00,444.50,443.50,444.00,444.00,3900000
13-Nov-24,442.50,443.00,442.00,442.50,442.50,4000000
12-Nov-24,441.00,442.50,441.50,442.00,442.00,4100000
11-Nov-24,440.50,441.00,440.00,440.50,440.50,4200000
08-Nov-24,439.00,440.50,439.50,440.00,440.00,4300000
07-Nov-24,438.50,439.00,438.00,438.50,438.50,4400000
06-Nov-24,437.00,438.50,437.50,438.00,438.00,4500000
05-Nov-24,436.50,437.00,436.00,436.50,436.50,4600000
04-Nov-24,435.00,436.50,435.50,436.00,436.00,4700000
01-Nov-24,434.50,435.00,434.00,434.50,434.50,4800000
"""

# Instantiate data acquisition class
data_acquirer = MarketDataAcquisition()

# Global ML ensemble instance
ml_ensemble = None

def convert_numpy_to_json_serializable(obj):
    """Convert numpy arrays and other non-serializable objects to JSON-serializable types."""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, dict):
        return {key: convert_numpy_to_json_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_to_json_serializable(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_to_json_serializable(item) for item in obj)
    else:
        return obj

# Helper function to acquire and prepare data (market data + trade data)
def acquire_and_prepare_data(
    symbol: str,
    start_date: str,
    end_date: str,
    trade_data: str | None = None,
    market_data_filepath: str | None = None,
    include_vix: bool = False,
) -> tuple[np.ndarray | None, pd.DataFrame | None]:
    """Acquire and prepare market and trade data for HMM training or prediction.
    
    Args:
        symbol: Ticker symbol for market data
        start_date: Start date string (YYYY-MM-DD)
        end_date: End date string (YYYY-MM-DD)
        trade_data: Optional trade data string
        market_data_filepath: Optional filepath for market data
        include_vix: Whether to fetch and include VIX data as a feature
        
    Returns:
        Tuple of (features_array, merged_dataframe) or (None, None) on error
    """
    market_df = None

    # Use embedded dummy data for market data
    try:
        print("Using embedded dummy market data.")
        # Use the embedded CSV string instead of reading a file
        market_df = pd.read_csv(
            io.StringIO(DUMMY_MARKET_DATA_CSV),
            parse_dates=['Date'], # Use the explicitly named column
        )
        print(f"Raw columns from embedded data: {market_df.columns.tolist()}")
        print(f"Raw dtypes from embedded data: {market_df.dtypes.to_dict()}")

        # Convert column names to lowercase
        market_df.columns = market_df.columns.str.lower()
        print(f"Columns after lowercasing: {market_df.columns.tolist()}")

        # Ensure OHLCV columns are numeric
        numeric_cols = ['open', 'high', 'low', 'close', 'volume']
        for col in numeric_cols:
            if col in market_df.columns:
                market_df[col] = pd.to_numeric(market_df[col], errors='coerce')
        print(f"Dtypes after numeric conversion: {market_df.dtypes.to_dict()}")


        # Ensure the date column is named 'date' and set it as index
        date_column = next((col for col in market_df.columns if market_df[col].dtype == 'datetime64[ns]'), None)
        if date_column and date_column != 'date':
             market_df = market_df.rename(columns={date_column: 'date'})
             print(f"Renamed date column to 'date'. Columns: {market_df.columns.tolist()}")
        elif not date_column:
             raise ValueError("Could not identify date column in embedded data.")


        market_df = market_df.set_index('date')
        print(f"Market DataFrame shape after setting index: {market_df.shape}")


        # Filter market data by date range
        market_df_filtered = market_df.loc[(market_df.index >= start_date) & (market_df.index <= end_date)].copy()
        print(f"Market DataFrame shape after date filtering: {market_df_filtered.shape}")

        # Handle future dates: if no data found, extend with synthetic data
        if market_df_filtered.empty:
            print(f"No market data found in specified date range. Checking if this is a future date prediction...")
            
            # Check if the start_date is after our latest embedded data
            latest_embedded_date = market_df.index.max()
            start_date_dt = pd.to_datetime(start_date)
            end_date_dt = pd.to_datetime(end_date)
            
            print(f"Latest embedded data date: {latest_embedded_date}")
            print(f"Requested start date: {start_date_dt}")
            print(f"Requested end date: {end_date_dt}")
            
            if start_date_dt > latest_embedded_date:
                print("🔮 Future date prediction detected! Generating synthetic data...")
                
                # For future predictions, we need enough historical data for technical indicators
                # Take the last 30 days of historical data and extend with synthetic future data
                historical_lookback_days = 30
                extended_start_date = latest_embedded_date - pd.Timedelta(days=historical_lookback_days)
                
                # Get historical baseline data (last 30 days)
                historical_baseline = market_df.loc[market_df.index >= extended_start_date].copy()
                print(f"Using {len(historical_baseline)} historical days as baseline for feature calculation")
                
                # Generate synthetic future data based on latest available data
                latest_row = market_df.iloc[-1]  # Get the latest row
                print(f"Using latest data as baseline: {latest_row.to_dict()}")
                
                # Create date range for future dates
                future_dates = pd.date_range(start=start_date_dt, end=end_date_dt, freq='D')
                print(f"Generating {len(future_dates)} future data points from {future_dates[0]} to {future_dates[-1]}")
                
                # Generate synthetic future data (simple approach: slight variations around latest values)
                synthetic_data = []
                base_price = latest_row['close']
                base_volume = latest_row['volume']
                
                for date in future_dates:
                    # Add small random variations (±2% for prices, ±20% for volume)
                    price_variation = np.random.normal(0, 0.02)  # 2% standard deviation
                    volume_variation = np.random.normal(0, 0.20)  # 20% standard deviation
                    
                    new_close = base_price * (1 + price_variation)
                    new_open = new_close * (1 + np.random.normal(0, 0.01))  # 1% variation for open
                    new_high = max(new_open, new_close) * (1 + abs(np.random.normal(0, 0.01)))
                    new_low = min(new_open, new_close) * (1 - abs(np.random.normal(0, 0.01)))
                    new_volume = max(base_volume * (1 + volume_variation), 100000)  # Ensure minimum volume
                    
                    synthetic_data.append({
                        'open': new_open,
                        'high': new_high,
                        'low': new_low,
                        'close': new_close,
                        'volume': new_volume
                    })
                    
                    # Update base price for next iteration (trending)
                    base_price = new_close
                
                # Create synthetic DataFrame for future dates
                synthetic_future_df = pd.DataFrame(synthetic_data, index=future_dates)
                print(f"Generated synthetic future data shape: {synthetic_future_df.shape}")
                
                # Combine historical baseline with synthetic future data
                market_df_filtered = pd.concat([historical_baseline, synthetic_future_df])
                print(f"Combined historical + synthetic data shape: {market_df_filtered.shape}")
                print(f"Date range: {market_df_filtered.index.min()} to {market_df_filtered.index.max()}")
                print(f"Sample combined data:\n{market_df_filtered.tail()}")
                
            else:
                print(f"No market data found in embedded data within the specified date range.")
                return None # No market data to proceed

        # Handle outliers
        market_df_processed = handle_outliers(market_df_filtered.copy())

    except Exception as e:
        print(f"Error processing embedded market data: {e}")
        return None, None

    # Acquire VIX data if requested
    vix_df = None
    if include_vix:
        print("Fetching VIX data...")
        try:
            # Check for VIX file in common locations
            vix_file_path = None
            potential_vix_paths = [
                '../data/VIX_IBKR_2025-05-24.csv',  # Your specific VIX file
                '../data/vix.csv',
                '../data/VIX.csv', 
                '../data/vix_data.csv',
                'data/vix.csv',
                'data/VIX.csv',
                'data/vix_data.csv',
                './vix.csv',
                './VIX.csv'
            ]
            
            import os
            for path in potential_vix_paths:
                if os.path.exists(path):
                    vix_file_path = path
                    print(f"Found VIX file at: {path}")
                    break
            
            vix_df = data_acquirer.fetch_vix_data(start_date, end_date, vix_file_path)
            if vix_df is not None and not vix_df.empty:
                print(f"VIX data shape: {vix_df.shape}")
                # Align VIX data with market data dates
                if market_df_processed is not None:
                    vix_df = vix_df.reindex(market_df_processed.index, method='ffill')
                    print(f"VIX data aligned to market data dates. Shape: {vix_df.shape}")
            else:
                print("Warning: Could not fetch VIX data, generating synthetic VIX for future predictions")
                # For future predictions, create synthetic VIX data
                if market_df_processed is not None:
                    print("Generating synthetic VIX data for future predictions...")
                    # Create synthetic VIX based on market volatility
                    synthetic_vix = []
                    base_vix = 20.0  # Typical VIX neutral value
                    
                    for i, (date, row) in enumerate(market_df_processed.iterrows()):
                        # Calculate daily volatility proxy from high-low range
                        if pd.notna(row['high']) and pd.notna(row['low']) and pd.notna(row['close']):
                            daily_range = (row['high'] - row['low']) / row['close'] * 100
                            # Scale daily range to VIX-like values (typical range 10-40)
                            vix_estimate = max(10, min(40, base_vix + (daily_range - 2) * 5))
                        else:
                            vix_estimate = base_vix
                        
                        synthetic_vix.append(vix_estimate)
                        # Add some variation for next iteration
                        base_vix += np.random.normal(0, 1.0)
                        base_vix = max(10, min(40, base_vix))  # Keep within reasonable bounds
                    
                    vix_df = pd.DataFrame({'vix': synthetic_vix}, index=market_df_processed.index)
                    print(f"Generated synthetic VIX data. Shape: {vix_df.shape}")
                    print(f"Synthetic VIX range: {vix_df['vix'].min():.2f} to {vix_df['vix'].max():.2f}")
        except Exception as e:
            print(f"Error fetching VIX data: {e}. Generating fallback synthetic VIX.")
            # Final fallback: create basic synthetic VIX
            if market_df_processed is not None:
                fallback_vix = np.full(len(market_df_processed), 20.0)  # Neutral VIX
                vix_df = pd.DataFrame({'vix': fallback_vix}, index=market_df_processed.index)
                print(f"Generated fallback VIX data. Shape: {vix_df.shape}")


    trade_df = None
    if trade_data:
        print("Processing trade data from string.")
        try:
            trade_df = load_and_parse_trades(io.StringIO(trade_data))
            trade_df = engineer_trade_features(trade_df)
            print(f"Trade DataFrame shape: {trade_df.shape}")
        except Exception as e:
            print(f"Error processing trade data from string: {e}")
            return None, None

    # Merge market, trade, and VIX data
    merged_df = market_df_processed.copy() if market_df_processed is not None else None
    
    if merged_df is None:
        print("No market data available for feature creation.")
        return None, None
    
    # Ensure the market data index is datetime
    merged_df.index = pd.to_datetime(merged_df.index)
    
    # Add VIX data if available
    if vix_df is not None and not vix_df.empty:
        merged_df = pd.merge(
            merged_df,
            vix_df,
            left_index=True,
            right_index=True,
            how='left'  # Keep all market data rows, add VIX data where available
        )
        print(f"DataFrame shape after merging VIX data: {merged_df.shape}")
    
    # Add trade data if available
    if trade_df is not None:
        trade_df.index = pd.to_datetime(trade_df.index)
        merged_df = pd.merge(
            merged_df,
            trade_df,
            left_index=True,
            right_index=True,
            how='left'  # Keep all market data rows, add trade data where available
        )
        print(f"DataFrame shape after merging trade data: {merged_df.shape}")
        # Fill NaN trade features after merge
        trade_feature_cols = [col for col in trade_df.columns if col in merged_df.columns]
        merged_df[trade_feature_cols] = merged_df[trade_feature_cols].fillna(0)

    # Create features from merged data
    has_vix = vix_df is not None and not vix_df.empty
    features_df = create_features(
        merged_df, 
        include_volatility=True, 
        include_technical_indicators=True,
        include_vix=has_vix
    )

    # Separate features (X) and keep merged_df for prediction (to preserve index)
    # Refactored to return only the final features DataFrame
    final_features_df = features_df # Rename for clarity

    # For future predictions, filter features to only return the requested date range
    # This handles the case where we included historical data for technical indicator calculation
    try:
        start_date_dt = pd.to_datetime(start_date)
        end_date_dt = pd.to_datetime(end_date)
        
        # If this is a future prediction (start_date is in the future), filter to only future dates
        if final_features_df.index.max() > pd.to_datetime('2025-01-01'):  # Simple future date check
            future_features = final_features_df.loc[(final_features_df.index >= start_date_dt) & 
                                                   (final_features_df.index <= end_date_dt)]
            if not future_features.empty:
                print(f"Filtered features to requested date range: {future_features.shape}")
                print(f"Date range: {future_features.index.min()} to {future_features.index.max()}")
                return future_features
        
        # Return all features if not a future prediction or if filtering failed
        return final_features_df
        
    except Exception as e:
        print(f"Error filtering features by date range: {e}")
    return final_features_df

# Root endpoint to check service status
@app.route('/', methods=['GET'])
def index():
    """Root endpoint to check if the service is running."""
    return jsonify({'status': 'HMM Microservice is running'}), 200

# Endpoint to train the HMM model
@app.route('/train', methods=['POST', 'OPTIONS'])
def train_hmm():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.json
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400

    symbol = data.get('symbol')
    start_date_str = data.get('startDate')
    end_date_str = data.get('endDate')
    n_components = data.get('nComponents', 3)
    n_iter = data.get('nIter', 100)
    covariance_type = data.get('covarianceType', 'diag')
    trade_data_filepath = data.get('tradeDataFilepath')
    market_data_filepath = data.get('marketDataFilepath')
    trade_data = data.get('tradeData') # Get raw trade data string
    include_vix = data.get('includeVix', False) # Get VIX inclusion flag

    if not all([symbol, start_date_str, end_date_str]):
        return jsonify({'error': 'Missing required parameters: symbol, startDate, endDate'}), 400

    try:
        # Call acquire_and_prepare_data to get the features DataFrame
        features_df = acquire_and_prepare_data(
            symbol,
            start_date_str,
            end_date_str,
            trade_data=trade_data,
            market_data_filepath=market_data_filepath,
            include_vix=include_vix
        )

        # Correctly check if the features_df is None or empty
        if features_df is None or features_df.empty:
            print("Training failed: Could not acquire or prepare data.")
            return jsonify({'error': 'Could not acquire or prepare data for training.'}), 500

        # Extract NumPy array for training
        features_array = features_df.values
        print(f"Data prepared for training. Features shape: {features_array.shape}")

        # Prepare model parameters dictionary
        model_params = {
            'n_components': n_components,
            'n_iter': n_iter,
            'covariance_type': covariance_type
        }

        # Call the training function directly from hmm_trainer
        print("Starting HMM training...")
        model = train_hmm_model(features_array, model_params)
        print("HMM training completed.")

        # Check if model training was successful
        if model is None:
            print("Error: HMM model training failed.")
            return jsonify({'error': 'HMM model training failed. Check backend logs for details.'}), 500

        model_filename = f"{symbol}_hmm_model.pkl"
        model_path = os.path.join(MODEL_DIR, model_filename)
        joblib.dump(model, model_path)
        print(f"Model saved to {model_path}")

        # Get the means of the trained model to use for state mapping during prediction
        trained_means = model.means_
        means_filename = f"{symbol}_trained_means.pkl"
        means_path = os.path.join(MODEL_DIR, means_filename)
        joblib.dump(trained_means, means_path)
        print(f"Trained means saved to {means_path}")


        return jsonify({'message': 'Model trained and saved successfully', 'modelFile': model_filename}), 200

    except Exception as e:
        print(f"Error during HMM training: {e}")
        return jsonify({'error': f'Error during HMM training: {e}'}), 500

# Endpoint to predict regimes
@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict_regime():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.json
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400

    symbol = data.get('symbol')
    start_date_str = data.get('startDate')
    end_date_str = data.get('endDate')
    trade_data_filepath = data.get('tradeDataFilepath')
    market_data_filepath = data.get('marketDataFilepath')
    trade_data = data.get('tradeData') # Get raw trade data string
    include_vix = data.get('includeVix', False) # Get VIX inclusion flag

    if not all([symbol, start_date_str, end_date_str]):
        return jsonify({'error': 'Missing required parameters: symbol, startDate, endDate'}), 400

    model_filename = f"{symbol}_hmm_model.pkl"
    model_path = os.path.join(MODEL_DIR, model_filename)
    means_filename = f"{symbol}_trained_means.pkl"
    means_path = os.path.join(MODEL_DIR, means_filename)


    if not os.path.exists(model_path) or not os.path.exists(means_path):
        print(f"Error: Model or means file not found at {model_path} or {means_path}")
        return jsonify({'error': f'Model or means file not found at {model_path}. Please train the model first.'}), 404

    try:
        model = joblib.load(model_path)
        trained_means = joblib.load(means_path)
        print(f"Model and means loaded from {model_path} and {means_path}")

        # Call acquire_and_prepare_data to get the features DataFrame for prediction
        features_df_for_prediction = acquire_and_prepare_data(
            symbol,
            start_date_str,
            end_date_str,
            trade_data=trade_data,
            market_data_filepath=market_data_filepath,
            include_vix=include_vix
        )

        # Correctly check if the prediction DataFrame is None or empty
        if features_df_for_prediction is None or features_df_for_prediction.empty:
             print("Prediction failed: Could not acquire or prepare data.")
             return jsonify({'error': 'Could not acquire or prepare data for prediction.'}), 500

        print(f"Data prepared for prediction. Features shape: {features_df_for_prediction.shape}")

        print("Debug: Inside /predict endpoint - features_df_for_prediction shape before predict_regimes:")
        print(features_df_for_prediction.shape)
        print("Debug: Inside /predict endpoint - features_df_for_prediction columns before predict_regimes:")
        print(features_df_for_prediction.columns.tolist())

        # Removed HMMPredictor instantiation, calling function directly
        print("Starting HMM prediction...")
        # Call the prediction function directly from hmm_predictor, passing the features DataFrame
        # Corrected call: pass False for return_probabilities and pass trained_means to map_states_to_regimes later
        predicted_states = predict_regimes(model, features_df_for_prediction, return_probabilities=False)
        print("HMM prediction completed.")

        # Check if prediction was successful and map states to regimes
        if predicted_states is None:
            print("Error: HMM regime prediction failed.")
            return jsonify({'error': 'HMM regime prediction failed. Check backend logs for details.'}), 500

        # Map the predicted states to regimes using the trained_means
        # predicted_states is a pandas Series with DatetimeIndex from predict_regimes
        regime_sequence_series = map_states_to_regimes(predicted_states, model) # Pass only predicted_states and model

        # Check if state mapping was successful
        if regime_sequence_series is None:
             print("Error: HMM state mapping failed.")
             return jsonify({'error': 'HMM state mapping failed. Check backend logs for details.'}), 500


        # Convert the mapped regime sequence Series to a list of dictionaries for JSON response
        # Ensure date format is JSON serializable and consistent
        regime_history = [{'date': date.strftime('%Y-%m-%d'), 'regime': regime}
                          for date, regime in regime_sequence_series.items()] # Iterate over mapped series

        print(f"Prediction results generated. {len(regime_history)} entries.")
        print(f"Sample prediction results: {regime_history[:5]}")


        return jsonify({'regimeHistory': regime_history}), 200

    except Exception as e:
        print(f"Error during HMM prediction: {e}")
        return jsonify({'error': f'Error during HMM prediction: {e}'}), 500

@app.route('/models/<filename>')
def get_model(filename):
    # Security: Prevent directory traversal attacks
    if os.path.basename(filename) != filename:
        return "Invalid filename", 400
    try:
        return send_from_directory(MODEL_DIR, filename)
    except FileNotFoundError:
        return "Model not found", 404

# Evaluation endpoint
@app.route('/evaluate', methods=['POST'])
def evaluate_vix_impact():
    """Evaluate the impact of VIX integration on model performance."""
    data = request.json
    
    try:
        symbol = data.get('symbol', 'SPY')
        start_date = data.get('startDate', '2024-01-01')
        end_date = data.get('endDate', '2024-12-31')
        
        print(f"Running VIX impact evaluation for {symbol} from {start_date} to {end_date}")
        
        # Acquire data with and without VIX
        features_df_no_vix = acquire_and_prepare_data(
            symbol, start_date, end_date, include_vix=False
        )
        
        features_df_with_vix = acquire_and_prepare_data(
            symbol, start_date, end_date, include_vix=True
        )
        
        # Convert to numpy arrays for the evaluation framework
        features_array_no_vix = features_df_no_vix.values if features_df_no_vix is not None else None
        features_array_with_vix = features_df_with_vix.values if features_df_with_vix is not None else None
        
        if features_array_no_vix is None or features_array_with_vix is None:
            return jsonify({
                'success': False,
                'error': 'Failed to acquire data for evaluation'
            }), 400
        
        # Import and run evaluation
        evaluator = VIXEvaluationFramework(output_dir='evaluation_results')
        
        # Run complete evaluation
        evaluation_results = evaluator.run_complete_evaluation(
            features_array_no_vix, 
            features_array_with_vix
        )
        
        # Return summary results with numpy conversion
        summary = {
            'success': True,
            'evaluation_summary': {
                'overall_improvement': float(np.mean(list(evaluation_results['results']['metrics']['improvement'].values()))),
                'metrics_comparison': convert_numpy_to_json_serializable(evaluation_results['results']['metrics']),
                'statistical_significance': convert_numpy_to_json_serializable(evaluation_results['results']['statistical_tests']),
                'cross_validation_summary': convert_numpy_to_json_serializable(evaluation_results['results']['cross_validation'])
            },
            'report': evaluation_results['report'],
            'output_directory': 'evaluation_results'
        }
        
        return jsonify(summary)
        
    except Exception as e:
        print(f"Error during VIX evaluation: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Evaluation failed: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "HMM & ML Ensemble Service"})

@app.route('/ml/train', methods=['POST'])
def train_ml_ensemble():
    """Train ML ensemble model (Random Forest + LSTM + Gradient Boosting)"""
    global ml_ensemble
    
    try:
        data = request.get_json()
        
        symbol = data.get('symbol', 'SPY')
        prediction_horizon = data.get('prediction_horizon', 1)
        optimize_hyperparams = data.get('optimize_hyperparams', True)
        n_trials = data.get('n_trials', 20)  # Reduced for faster training
        
        print(f"Training ML ensemble for {symbol}...")
        
        # Initialize ML ensemble
        ml_ensemble = BasicMLEnsemble(
            prediction_horizon=prediction_horizon
        )
        
        # Prepare features
        X, y, _ = ml_ensemble.prepare_features_for_ml(symbol)
        
        # Train ensemble
        if optimize_hyperparams:
            print(f"Training with hyperparameter optimization ({n_trials} trials)...")
            results = ml_ensemble.train_ensemble(X, y, hyperparams=None, test_size=0.2)
        else:
            print("Training with default hyperparameters...")
            default_hyperparams = {
                'rf_n_estimators': 100,
                'rf_max_depth': 10,
                'rf_min_samples_split': 5,
                'gb_n_estimators': 100,
                'gb_max_depth': 6,
                'gb_learning_rate': 0.1
            }
            results = ml_ensemble.train_ensemble(X, y, hyperparams=default_hyperparams, test_size=0.2)
        
        # Save models
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        model_path = f"models/ml_ensemble_{symbol}_{timestamp}"
        ml_ensemble.save_models(model_path)
        
        # Check 65% accuracy requirement
        ensemble_accuracy = results['ensemble']['accuracy']
        meets_requirement = ensemble_accuracy >= 0.65
        
        response = {
            "success": True,
            "message": f"ML ensemble trained for {symbol}",
            "model_path": model_path,
            "performance": {
                "random_forest": results['random_forest']['accuracy'],
                "gradient_boosting": results['gradient_boosting']['accuracy'],
                "ensemble": ensemble_accuracy
            },
            "meets_65_percent_requirement": meets_requirement,
            "training_samples": len(X),
            "features_count": X.shape[1],
            "prediction_horizon": prediction_horizon
        }
        
        if meets_requirement:
            print(f"✅ SUCCESS: Ensemble achieves required 65% accuracy: {ensemble_accuracy:.4f}")
        else:
            print(f"⚠️ WARNING: Ensemble below 65% accuracy: {ensemble_accuracy:.4f}")
            response["warning"] = f"Ensemble accuracy ({ensemble_accuracy:.4f}) below required 65%"
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in ML ensemble training: {e}")
        traceback.print_exc()
        return jsonify({"error": f"ML ensemble training failed: {str(e)}", "success": False}), 500

@app.route('/ml/predict', methods=['POST'])
def predict_ml_ensemble():
    """Make predictions using trained ML ensemble"""
    global ml_ensemble
    
    try:
        data = request.get_json()
        
        symbol = data.get('symbol', 'SPY')
        model_path = data.get('model_path', None)
        n_predictions = data.get('n_predictions', 10)
        
        # Load models if not in memory
        if ml_ensemble is None or model_path:
            if model_path is None:
                return jsonify({"error": "No model in memory and no model_path provided", "success": False}), 400
            
            ml_ensemble = BasicMLEnsemble()
            ml_ensemble.load_models(model_path)
        
        # Prepare recent features for prediction
        X, _, _ = ml_ensemble.prepare_features_for_ml(symbol)
        recent_X = X.tail(n_predictions)
        
        # Make predictions
        predictions = ml_ensemble.predict(recent_X)
        
        # Format predictions
        prediction_results = []
        for i in range(len(predictions['ensemble_prediction'])):
            prediction_results.append({
                "index": i,
                "date": recent_X.index[i].isoformat() if hasattr(recent_X.index[i], 'isoformat') else str(recent_X.index[i]),
                "ensemble_prediction": int(predictions['ensemble_prediction'][i]),
                "ensemble_confidence": float(predictions['ensemble'][i]),
                "random_forest_confidence": float(predictions['random_forest'][i]),
                "gradient_boosting_confidence": float(predictions['gradient_boosting'][i]),
                "direction": "UP" if predictions['ensemble_prediction'][i] == 1 else "DOWN"
            })
        
        return jsonify({
            "success": True,
            "symbol": symbol,
            "predictions": prediction_results,
            "model_weights": ml_ensemble.ensemble_weights,
            "n_predictions": len(prediction_results)
        })
        
    except Exception as e:
        print(f"Error in ML ensemble prediction: {e}")
        traceback.print_exc()
        return jsonify({"error": f"ML ensemble prediction failed: {str(e)}", "success": False}), 500

@app.route('/ml/retrain', methods=['POST'])
def retrain_ml_ensemble():
    """Daily retraining endpoint for ML ensemble"""
    global ml_ensemble
    
    try:
        data = request.get_json()
        
        symbol = data.get('symbol', 'SPY')
        retrain_window_days = data.get('retrain_window_days', 365)
        
        if ml_ensemble is None:
            ml_ensemble = BasicMLEnsemble()
        
        # Perform daily retraining
        success = ml_ensemble.retrain_daily(symbol, retrain_window_days)
        
        if success:
            # Get latest performance
            latest_training = ml_ensemble.training_history[-1] if ml_ensemble.training_history else None
            
            return jsonify({
                "success": True,
                "message": f"Daily retraining successful for {symbol}",
                "meets_65_percent_requirement": True,
                "performance": latest_training['performance'] if latest_training else None,
                "retrain_window_days": retrain_window_days
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Daily retraining failed for {symbol} - accuracy below 65%",
                "meets_65_percent_requirement": False,
                "retrain_window_days": retrain_window_days
            }), 400
            
    except Exception as e:
        print(f"Error in daily retraining: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Daily retraining failed: {str(e)}", "success": False}), 500

@app.route('/ml/status', methods=['GET'])
def ml_ensemble_status():
    """Get ML ensemble status and performance history"""
    global ml_ensemble
    
    try:
        if ml_ensemble is None:
            return jsonify({
                "success": True,
                "status": "not_initialized",
                "message": "ML ensemble not initialized"
            })
        
        # Check if models are trained
        models_trained = all([
            ml_ensemble.random_forest is not None,
            ml_ensemble.gradient_boosting is not None
        ])
        
        response = {
            "success": True,
            "status": "trained" if models_trained else "initialized",
            "models_trained": models_trained,
            "ensemble_weights": convert_numpy_to_json_serializable(ml_ensemble.ensemble_weights),
            "prediction_horizon": ml_ensemble.prediction_horizon,
            "training_history_count": len(ml_ensemble.training_history)
        }
        
        # Include latest performance if available
        if ml_ensemble.training_history:
            latest = ml_ensemble.training_history[-1]
            response["latest_performance"] = convert_numpy_to_json_serializable(latest['performance'])
            response["latest_training_time"] = latest['timestamp']
            response["meets_65_percent_requirement"] = bool(latest['performance']['ensemble']['accuracy'] >= 0.65)
        
        return jsonify(convert_numpy_to_json_serializable(response))
        
    except Exception as e:
        print(f"Error getting ML ensemble status: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Status check failed: {str(e)}", "success": False}), 500

if __name__ == '__main__':
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    print("Starting HMM & ML Ensemble Service...")
    print("Available endpoints:")
    print("  - GET  /health")
    print("  - POST /train (HMM)")
    print("  - POST /predict (HMM)")
    print("  - POST /evaluate (HMM)")
    print("  - POST /ml/train (ML Ensemble)")
    print("  - POST /ml/predict (ML Ensemble)")
    print("  - POST /ml/retrain (Daily retraining)")
    print("  - GET  /ml/status (ML Ensemble status)")
    
    app.run(host='0.0.0.0', port=5001, debug=True)