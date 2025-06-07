import numpy as np
import pandas as pd
from feature_engineering import calculate_technical_indicators, calculate_volatility_metrics, create_time_based_features, create_volume_features
from data_preprocessing import create_lagged_features, normalize_data, handle_missing_values, handle_outliers

def create_features(
    price_data,
    include_volatility=True,
    include_technical_indicators=True,
    include_time_features=False,
    include_volume_features=False,
    include_vix=False
):
    """Creates features from OHLCV data for HMM training and prediction.

    Args:
        price_data (pd.DataFrame): DataFrame containing OHLCV data with a DateTimeIndex.
                                   Expected columns: 'open', 'high', 'low', 'close', 'volume'.
        include_volatility (bool): Whether to include volatility features (e.g., ATR).
        include_technical_indicators (bool): Whether to include basic technical indicators (e.g., RSI, MACD).
        include_time_features (bool): Whether to include time-based features (e.g., day of week).
        include_volume_features (bool): Whether to include volume-based features (e.g., OBV).
        include_vix (bool): Whether to include VIX data as a feature (if available in input data).

    Returns:
        pd.DataFrame or None: DataFrame of features with preserved index, or None if feature creation fails.
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
        processed_df = calculate_volatility_metrics(processed_df)

    # 2. Technical Indicators (using calculate_technical_indicators)
    if include_technical_indicators:
        processed_df = calculate_technical_indicators(processed_df)

    # 3. Time-Based Features (using create_time_based_features)
    if include_time_features:
        processed_df = create_time_based_features(processed_df)

    # 4. Volume-Based Features (using create_volume_features)
    if include_volume_features:
        processed_df = create_volume_features(processed_df)
    
    # 5. VIX Features (if VIX data is available in the input)
    if include_vix and 'vix' in processed_df.columns:
        print("Including VIX as a feature")
        # VIX is already in the data, we can add derived features
        processed_df['vix_change'] = processed_df['vix'].pct_change()
        processed_df['vix_normalized'] = (processed_df['vix'] - processed_df['vix'].rolling(20).mean()) / processed_df['vix'].rolling(20).std()
        
        # VIX regime classification (low/medium/high volatility)
        vix_20_percentile = processed_df['vix'].quantile(0.2)
        vix_80_percentile = processed_df['vix'].quantile(0.8)
        processed_df['vix_regime'] = processed_df['vix'].apply(
            lambda x: 0 if x < vix_20_percentile else (2 if x > vix_80_percentile else 1)
        )
    elif include_vix and 'vix' not in processed_df.columns:
        print("Warning: VIX feature requested but VIX data not available in input DataFrame")

    # TODO: Integrate Data Preprocessing steps BEFORE feature engineering if needed
    # processed_df = handle_missing_values(processed_df, strategy='mean')
    # processed_df = handle_outliers(processed_df, method='iqr', cap_method='cap')

    # Handle NaN values more selectively for technical indicators
    print("Debug: Inside create_features - Shape before handling NaNs:")
    print(processed_df.shape)
    print("Debug: Inside create_features - NaN counts per column before handling NaNs:")
    print(processed_df.isnull().sum())
    
    # Instead of dropping all NaN rows, be more selective
    # Keep rows where at least the log_return is valid (most important feature)
    if 'log_return' in processed_df.columns:
        # Start with rows that have valid log_return
        valid_log_return_mask = processed_df['log_return'].notna()
        features_df = processed_df[valid_log_return_mask].copy()
        
        # Fill NaN technical indicators with median values from non-NaN entries
        tech_columns = ['ATR', 'SMA', 'RSI', 'MACD', 'MACD_Signal', 'MACD_Diff', 'BBP', 'BBHI', 'BBLO']
        vix_columns = ['vix', 'vix_change', 'vix_normalized', 'vix_regime']
        
        all_indicator_columns = tech_columns + vix_columns
        
        for col in all_indicator_columns:
            if col in features_df.columns:
                if features_df[col].notna().any():
                    # Fill NaN with median of existing values
                    median_val = features_df[col].median()
                    features_df[col] = features_df[col].fillna(median_val)
                    print(f"Filled {col} NaNs with median: {median_val}")
                else:
                    # If all values are NaN, fill with a default
                    if col == 'RSI':
                        features_df[col] = features_df[col].fillna(50.0)  # Neutral RSI
                    elif col == 'ATR':
                        features_df[col] = features_df[col].fillna(features_df['close'].std() * 0.1)  # 10% of price std
                    elif col == 'vix':
                        features_df[col] = features_df[col].fillna(20.0)  # Typical VIX neutral value
                    elif col == 'vix_change':
                        features_df[col] = features_df[col].fillna(0.0)  # No change
                    elif col == 'vix_normalized':
                        features_df[col] = features_df[col].fillna(0.0)  # Neutral normalized value
                    elif col == 'vix_regime':
                        features_df[col] = features_df[col].fillna(1)  # Medium volatility regime
                    else:
                        features_df[col] = features_df[col].fillna(0.0)  # Default to 0
                    print(f"Filled all NaN values in {col} with default values")
    else:
        # Fallback if no log_return
        features_df = processed_df.dropna()

    print("Debug: Inside create_features - Columns after handling NaNs:")
    print(features_df.columns.tolist())
    print("Debug: Inside create_features - Shape after handling NaNs:")
    print(features_df.shape)
    print("Debug: Inside create_features - NaN counts after handling:")
    print(features_df.isnull().sum())

    if features_df.empty:
         print("Error: Feature creation resulted in an empty DataFrame after handling NaNs.")
         print("Debug: This usually happens when there's insufficient data for any indicators.")
         
         # Final fallback: use only log_return which requires minimal data
         if 'log_return' in processed_df.columns:
             fallback_df = processed_df[['log_return']].dropna()
             if not fallback_df.empty:
                 print(f"Using final fallback: only log_return feature. Shape: {fallback_df.shape}")
                 return fallback_df
         
         return None

    # Select the feature columns for the HMM.
    # Exclude original OHLCV columns and the temporary 'log_return' column if other features are calculated
    # Keep 'log_return' if it's the only feature or explicitly needed alongside others.
    # Explicitly select features we want to use, consistent with hmm_trainer.
    selected_features_list = ['log_return']
    if include_volatility and 'ATR' in features_df.columns:
        selected_features_list.append('ATR')
    if include_technical_indicators:
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
    
    if include_vix:
         vix_cols = ['vix', 'vix_change', 'vix_normalized', 'vix_regime'] # VIX features
         for col in vix_cols:
            if col in features_df.columns and col not in selected_features_list:
                selected_features_list.append(col)

    if 'ATR' in selected_features_list and 'rolling_volatility' in selected_features_list:
        selected_features_list.remove('rolling_volatility')

    final_features_df = features_df[selected_features_list]

    print("Debug: Inside create_features - Final selected features list:")
    print(selected_features_list)
    print("Debug: Inside create_features - Final features DataFrame columns:")
    print(final_features_df.columns.tolist())
    print("Debug: Inside create_features - Final features DataFrame shape:")
    print(final_features_df.shape)

    if final_features_df.empty:
        print("Error: No features selected or final features DataFrame is empty.")
        return None

    # Return features as a DataFrame to preserve date index
    return final_features_df 