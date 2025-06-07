import numpy as np
from hmmlearn import hmm
import pickle
import pandas as pd # Import pandas for data loading
import os # Import os for path manipulation
# Import relevant functions from feature_engineering and data_preprocessing
from feature_engineering import calculate_technical_indicators, calculate_volatility_metrics, create_time_based_features, create_volume_features
from data_preprocessing import create_lagged_features, normalize_data, handle_missing_values, handle_outliers

# Import create_features from the shared utility module
from features_utils import create_features

# TODO: Define a function to load historical price data
# This function might be redundant if data is passed directly from the API endpoint
def load_price_data(filepath):
    """Loads historical price data from a CSV file.

    Args:
        filepath (str): The path to the CSV file.

    Returns:
        pd.DataFrame: A pandas DataFrame containing the price data.
    """
    # This function is likely not needed if data comes via API. Keeping as placeholder.
    print("Warning: load_price_data called. Assuming data is provided via API in production.")
    try:
        # Assuming the CSV has a 'Date' and 'Close' column
        # Use lowercase 'date' and 'close' for column names based on common practice
        data = pd.read_csv(filepath, parse_dates=['date'])
        data.set_index('date', inplace=True)
        return data[['close']].sort_index()
    except FileNotFoundError:
        print(f"Error: File not found at {filepath}")
        return None
    except Exception as e:
        print(f"Error loading data from {filepath}: {e}")
        return None

# TODO: Define a function for feature engineering (e.g., log returns)
def create_features(price_data, include_volatility=True, include_technical_indicators=True, include_time_features=False, include_volume_features=False):
    """Creates features for HMM training from OHLCV data.

    Args:
        price_data (pd.DataFrame): DataFrame containing OHLCV data with a DateTimeIndex.
                                   Expected columns: 'open', 'high', 'low', 'close', 'volume'.
        include_volatility (bool): Whether to include volatility features (e.g., ATR).
        include_technical_indicators (bool): Whether to include basic technical indicators (e.g., RSI, MACD).
        include_time_features (bool): Whether to include time-based features (e.g., day of week).
        include_volume_features (bool): Whether to include volume-based features (e.g., OBV).

    Returns:
        np.ndarray or None: NumPy array of features for HMM training, or None if feature creation fails.
                            Features are also implicitly returned as a DataFrame with index preserved.
    """
    if price_data is None or price_data.empty:
        print("Error: No price data provided for feature creation.")
        return None

    processed_df = price_data.copy()

    # Ensure required columns exist for OHLCV-based features
    required_ohlcv_cols = ['open', 'high', 'low', 'close', 'volume']
    if not all(col in processed_df.columns for col in required_ohlcv_cols):
        print("Error: Input DataFrame must contain OHLCV columns ('open', 'high', 'low', 'close', 'volume') for feature engineering.")
        return None

    # Calculate log returns (still useful)
    if len(processed_df) > 1:
       processed_df['log_return'] = np.log(processed_df['close'] / processed_df['close'].shift(1))
    else:
       processed_df['log_return'] = np.nan # Cannot calculate log return for single data point


    # --- Integrate Feature Engineering Modules ---

    # 1. Volatility Metrics (using calculate_volatility_metrics)
    if include_volatility:
        # calculate_volatility_metrics expects 'high', 'low', 'close'
        processed_df = calculate_volatility_metrics(processed_df)

    # 2. Technical Indicators (using calculate_technical_indicators)
    if include_technical_indicators:
        # calculate_technical_indicators expects 'open', 'high', 'low', 'close'
        processed_df = calculate_technical_indicators(processed_df)

    # 3. Time-Based Features (using create_time_based_features)
    if include_time_features:
        # create_time_based_features expects a DateTimeIndex
        processed_df = create_time_based_features(processed_df)

    # 4. Volume-Based Features (using create_volume_features)
    if include_volume_features:
        # create_volume_features expects 'close', 'volume'
        processed_df = create_volume_features(processed_df)

    # TODO: Integrate Data Preprocessing steps BEFORE feature engineering if needed
    # Example: Handle missing values *before* calculating features
    # processed_df = handle_missing_values(processed_df, strategy='mean')
    # Example: Handle outliers *before* or *after* feature engineering
    # processed_df = handle_outliers(processed_df, method='iqr', cap_method='cap')

    # Drop rows with NaN values introduced by shifting, rolling calculations, or merging
    # Also drop the initial log_return NaN
    features_df = processed_df.dropna()

    if features_df.empty:
         print("Error: Feature creation resulted in an empty DataFrame after dropping NaNs.")
         return None

    # Select the feature columns for the HMM.
    # Exclude original OHLCV columns and the temporary 'log_return' column if other features are calculated
    # Keep 'log_return' if it's the only feature or explicitly needed alongside others.
    # For now, let's explicitly select features we want to use for the HMM.
    # This list should be dynamically generated based on the `include_*` flags and what features are actually added.
    # Assuming we want 'log_return', 'ATR', 'RSI', 'MACD', 'rolling_volatility' (if included)

    selected_features_list = ['log_return']
    if include_volatility and 'ATR' in features_df.columns: # Use ATR from calculate_volatility_metrics
        selected_features_list.append('ATR')
    # Add other technical/time/volume features if included and exist in features_df
    if include_technical_indicators:
        # Add specific technical indicator columns you want to use as features
        # Example: add RSI, MACD, etc. Ensure these columns exist in features_df
        tech_cols = ['RSI', 'MACD', 'MACD_Signal', 'MACD_Diff', 'BBP', 'BBHI', 'BBLO'] # Example indicators from feature_engineering
        for col in tech_cols:
            if col in features_df.columns and col not in selected_features_list:
                selected_features_list.append(col)
    if include_time_features:
         time_cols = ['day_of_week', 'day_of_month', 'month', 'year'] # Example time features
         for col in time_cols:
            if col in features_df.columns and col not in selected_features_list:
                selected_features_list.append(col)
    if include_volume_features:
         volume_cols = ['OBV'] # Example volume features
         for col in volume_cols:
            if col in features_df.columns and col not in selected_features_list:
                selected_features_list.append(col)

    # Remove 'rolling_volatility' if ATR is included to avoid redundancy, unless explicitly desired
    if 'ATR' in selected_features_list and 'rolling_volatility' in selected_features_list:
        selected_features_list.remove('rolling_volatility')

    final_features_df = features_df[selected_features_list]

    if final_features_df.empty:
        print("Error: No features selected or final features DataFrame is empty.")
        return None

    # Return features as a NumPy array
    # TODO: Consider returning features_df directly to preserve date index
    return final_features_df.values

# TODO: Define a function to train the HMM model
def train_hmm_model(features, model_params={}):
    """Trains a Gaussian Hidden Markov Model.

    Args:
        features (np.ndarray): NumPy array of features for training.
        model_params (dict): Dictionary of parameters for the HMM model.
            Expected keys: 'n_components' (int), 'covariance_type' (str), etc.

    Returns:
        hmm.GaussianHMM or None: The trained HMM model or None if training fails.
    """
    if features is None or features.size == 0:
        print("Error: No features provided for HMM training.")
        return None

    # Extract model parameters with defaults
    n_components = model_params.get('n_components', 3)
    covariance_type = model_params.get('covariance_type', "diag") # Or "full", "tied", "spherical"
    n_iter = model_params.get('n_iter', 100)
    tol = model_params.get('tol', 1e-4)
    # Add other parameters as needed, e.g., init_params, params

    # Basic validation for parameters
    if not isinstance(n_components, int) or n_components <= 0:
        print(f"Error: Invalid n_components: {n_components}. Must be a positive integer.")
        return None
    if covariance_type not in ["diag", "full", "tied", "spherical"]:
         print(f"Error: Invalid covariance_type: {covariance_type}. Must be one of 'diag', 'full', 'tied', 'spherical'.")
         return None
    if not isinstance(n_iter, int) or n_iter <= 0:
        print(f"Error: Invalid n_iter: {n_iter}. Must be a positive integer.")
        return None
    if not isinstance(tol, (int, float)) or tol <= 0:
         print(f"Error: Invalid tol: {tol}. Must be a positive number.")
         return None

    try:
        # Initialize the HMM model with provided or default parameters
        model = hmm.GaussianHMM(
            n_components=n_components,
            covariance_type=covariance_type,
            n_iter=n_iter,
            tol=tol,
            # TODO: Consider adding random_state for reproducibility
            # TODO: Consider adding init_params='s' if starting from scratch, or 'stmc' if using provided start/trans/means/covars
            # For now, letting hmmlearn initialize parameters automatically
        )
        model.fit(features)
        print(f"HMM model trained successfully with {n_components} components, {covariance_type} covariance, {n_iter} iterations.")
        return model
    except ValueError as ve:
        print(f"Error training HMM model (ValueError): {ve}. This might be due to insufficient data for the chosen covariance_type or number of components.")
        # Provide hints for common ValueErrors related to hmmlearn
        if "Input data needs more samples" in str(ve) or "less than n_components" in str(ve) or "less than number of features" in str(ve):
             print("Hint: The number of data samples might be too small relative to the number of components or features.")
        if "singular covariance matrix" in str(ve):
             print("Hint: Features might be perfectly correlated, or there is not enough data to estimate the covariance matrix for the chosen type.")
        return None
    except Exception as e:
        print(f"Error training HMM model: {e}")
        return None

# TODO: Define a function to save the trained model
def save_model(model, filepath):
    """Saves the trained HMM model to a file using pickle.

    Args:
        model (hmm.GaussianHMM): The trained HMM model.
        filepath (str): The path to save the model file.
    """
    if model is None:
        print("Error: No model provided to save.")
        return

    try:
        with open(filepath, 'wb') as f:
            pickle.dump(model, f)
        print(f"HMM model saved successfully to {filepath}")
    except Exception as e:
        print(f"Error saving model to {filepath}: {e}")

if __name__ == "__main__":
    # Example usage:
    # Define the path to your historical price data CSV and where to save the trained model
    # Ensure you have a sample CSV file with 'date' and 'close' columns
    # data_filepath = './sample_data.csv' # Update with your data file path
    # For testing create a dummy DataFrame with OHLCV structure
    print("Creating dummy OHLCV data for testing...")
    dates = pd.to_datetime(pd.date_range(start='2023-01-01', periods=100, freq='D'))
    np.random.seed(42) # for reproducibility
    # Create dummy price data with some variation
    price_changes = np.random.randn(100) * 0.01
    close_prices = np.cumprod(1 + price_changes) * 100
    # Simple way to generate OHLCV from close - not realistic but serves structure
    open_prices = close_prices * (1 + np.random.randn(100) * 0.005)
    high_prices = np.maximum(open_prices, close_prices) * (1 + np.random.rand(100) * 0.005)
    low_prices = np.minimum(open_prices, close_prices) * (1 - np.random.rand(100) * 0.005)
    volume_data = np.random.randint(100000, 1000000, 100)

    price_data = {'open': open_prices,
                  'high': high_prices,
                  'low': low_prices,
                  'close': close_prices,
                  'volume': volume_data}
    price_data_df = pd.DataFrame(price_data, index=dates)
    print("Dummy OHLCV data head:\n", price_data_df.head())

    model_filepath = './trained_hmm_model_test.pkl'

    print(f"Starting HMM training process with dummy OHLCV data...")

    # 1. Create features (now expects OHLCV and includes more features)
    # Pass include_volatility and include_technical_indicators flags as needed
    features_df = create_features(price_data_df, include_volatility=True, include_technical_indicators=True)

    # The create_features function now returns a DataFrame, convert to numpy array for hmmlearn
    if features_df is not None and not features_df.empty:
        features = features_df.values
        print(f"Created features. Shape: {features.shape}")
        # print("Features head:\n", features[:5]) # Avoid printing large arrays

        # 2. Train model
        # You can adjust n_components, covariance_type, n_iter here using model_params
        model_params = {
            'n_components': 3, # Example with 3 components for Low/Med/High Vol
            'covariance_type': 'diag',
            'n_iter': 200,
            'tol': 1e-5
        }
        trained_model = train_hmm_model(features, model_params=model_params)
        if trained_model is not None:
            print("HMM model training complete.")
            # Print some model parameters to verify
            print("Model means (first 5 rows):\n", trained_model.means_[:5]) # Print only a few rows
            # print("Model covariances:\n", trained_model.covars_) # May be too verbose
            print("Model transition matrix:\n", trained_model.transmat_)

            # 3. Save model
            save_model(trained_model, model_filepath)
            print(f"Model saved to {model_filepath}")
        else:
            print("Model training failed.")
    else:
        print("Feature creation failed or resulted in empty data.")

    print("HMM training process finished.") 