import pandas as pd
import numpy as np
# Import the ta library for technical indicators
import ta
from ta import add_all_ta_features  # If using ta-lib
import yfinance as yf               # If fetching data

# Assuming data_storage is available in the same directory
from data_storage import get_historical_data, get_economic_data, get_sentiment_data, create_connection, DATABASE_FILE

# TODO: Implement functions for feature creation

def calculate_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculates technical indicators from historical price data."""
    print("Calculating technical indicators...")
    processed_df = df.copy()
    
    # Ensure the index is a datetime index, which is often required by ta
    if not isinstance(processed_df.index, pd.DatetimeIndex):
        processed_df.index = pd.to_datetime(processed_df.index)

    # Simple Moving Average (SMA)
    window_size = 10 # TODO: Make window size configurable
    processed_df['SMA'] = processed_df['close'].rolling(window=window_size).mean()
    
    # Relative Strength Index (RSI)
    processed_df['RSI'] = ta.momentum.RSIIndicator(processed_df['close'], window=14).rsi()
    
    # Moving Average Convergence Divergence (MACD)
    macd = ta.trend.MACD(processed_df['close'])
    processed_df['MACD'] = macd.macd()
    processed_df['MACD_Signal'] = macd.macd_signal()
    processed_df['MACD_Diff'] = macd.macd_diff()
    
    # Bollinger Bands
    bollinger = ta.volatility.BollingerBands(processed_df['close'])
    processed_df['BBP'] = bollinger.bollinger_pband()
    processed_df['BBHI'] = bollinger.bollinger_hband_indicator()
    processed_df['BBLO'] = bollinger.bollinger_lband_indicator()
    
    # TODO: Add more indicators like Stochastic Oscillator, etc.
    
    # Instead of dropping all NaN rows, only drop if ALL technical indicators are NaN
    # This allows us to keep rows where at least some indicators are calculated
    original_shape = processed_df.shape[0]
    
    # Drop rows only where ALL technical indicator columns are NaN
    tech_columns = ['SMA', 'RSI', 'MACD', 'MACD_Signal', 'MACD_Diff', 'BBP', 'BBHI', 'BBLO']
    existing_tech_columns = [col for col in tech_columns if col in processed_df.columns]
    
    if existing_tech_columns:
        # Keep rows where at least one tech indicator is not NaN
        mask = processed_df[existing_tech_columns].notna().any(axis=1)
        processed_df = processed_df[mask]
        print(f"Technical indicators: kept {processed_df.shape[0]} of {original_shape} rows")
    else:
        print("No technical indicators calculated, keeping all rows")
    
    return processed_df

def incorporate_external_data(df: pd.DataFrame, conn) -> pd.DataFrame:
    """Incorporates economic indicators and sentiment data."""
    print("Incorporating external data...")
    processed_df = df.copy()
    
    # TODO: Fetch and merge economic data (example for CPI)
    economic_df = get_economic_data(conn, 'CPI') # TODO: Make indicator name configurable
    if not economic_df.empty:
        # Merge requires careful handling of dates. Use merge_asof for nearest date match if needed, or reindex.
        # For simplicity, let's reindex the economic data to match the price data index
        # This might introduce NaNs if dates don't align perfectly - handle as part of preprocessing later.
        # Ensure economic_df index is also datetime for proper merging
        if not isinstance(economic_df.index, pd.DatetimeIndex):
            economic_df.index = pd.to_datetime(economic_df.index)
            
        processed_df = processed_df.merge(economic_df.rename(columns={'value': 'CPI'}), left_index=True, right_index=True, how='left')

    # TODO: Fetch and merge sentiment data (example for Social Media)
    sentiment_df = get_sentiment_data(conn, 'Social Media') # TODO: Make source name configurable
    if not sentiment_df.empty:
         # Ensure sentiment_df index is also datetime
        if not isinstance(sentiment_df.index, pd.DatetimeIndex):
             sentiment_df.index = pd.to_datetime(sentiment_df.index)

        processed_df = processed_df.merge(sentiment_df.rename(columns={'score': 'Sentiment_SocialMedia'}), left_index=True, right_index=True, how='left')

    # TODO: Handle NaNs introduced by merging (can be done here or in a dedicated preprocessing step)
    # For now, let's just return the merged DataFrame

    return processed_df

def create_features(symbol: str) -> pd.DataFrame:
    """Loads raw data, calculates features, and returns a combined DataFrame."""
    print(f"Creating features for {symbol}...")
    conn = create_connection(DATABASE_FILE)
    if conn is None:
        return pd.DataFrame()

    try:
        historical_df = get_historical_data(conn, symbol)
        if historical_df.empty:
            print(f"No historical data found for {symbol}.")
            return pd.DataFrame()

        # Calculate technical indicators
        features_df = calculate_technical_indicators(historical_df)

        # Incorporate external data
        final_features_df = incorporate_external_data(features_df, conn)

        # TODO: Add any other necessary feature transformations or combinations

        return final_features_df
    finally:
        if conn:
            conn.close()

def create_time_based_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extracts time-based features from the DataFrame's datetime index."""
    print("Creating time-based features...")
    processed_df = df.copy()
    
    # Ensure the index is a datetime index
    if not isinstance(processed_df.index, pd.DatetimeIndex):
        processed_df.index = pd.to_datetime(processed_df.index)
        
    processed_df['day_of_week'] = processed_df.index.dayofweek # Monday=0, Sunday=6
    processed_df['day_of_month'] = processed_df.index.day
    processed_df['month'] = processed_df.index.month
    processed_df['year'] = processed_df.index.year
    # If data is intraday, add hour, minute, etc.
    # processed_df['hour'] = processed_df.index.hour
    
    return processed_df

# TODO: Implement functions for price pattern features
def identify_price_patterns(df: pd.DataFrame) -> pd.DataFrame:
    """Identifies common price patterns (e.g., bullish/bearish engulfing, doji)."""
    print("Identifying price patterns...")
    processed_df = df.copy()
    
    # Ensure required columns exist
    if not all(col in processed_df.columns for col in ['open', 'high', 'low', 'close']):
        print("Warning: OHLC columns not found. Skipping price pattern identification.")
        return processed_df
        
    # TODO: Implement price pattern detection logic.
    # This often requires using a dedicated library like `talib`.
    # Example placeholders for basic patterns (require shift(1) which introduces NaNs):
    
    # Example: Bullish Engulfing Pattern
    # Criteria: Current candle closes higher than open, previous candle closes lower than open,
    #           Current candle's body engulfs the previous candle's body.
    # processed_df['Bullish_Engulfing'] = ((processed_df['close'] > processed_df['open']) &
    #                                     (processed_df['close'].shift(1) < processed_df['open'].shift(1)) &
    #                                     (processed_df['close'] > processed_df['open'].shift(1)) &
    #                                     (processed_df['open'] < processed_df['close'].shift(1))).astype(int)
                                          
    # Example: Doji (Open and Close are very close)
    # processed_df['Doji'] = (abs(processed_df['open'] - processed_df['close']) < (processed_df['high'] - processed_df['low']) * 0.1).astype(int)

    # For now, return the dataframe without implemented patterns
    return processed_df.dropna() # Drop rows with NaNs from potential shift operations

# TODO: Implement functions for volatility metrics
def calculate_volatility_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Calculates volatility-related metrics (e.g., Average True Range)."""
    print("Calculating volatility metrics...")
    processed_df = df.copy()
    
    # Ensure the index is a datetime index for ta functions
    if not isinstance(processed_df.index, pd.DatetimeIndex):
        processed_df.index = pd.to_datetime(processed_df.index)
        
    # Average True Range (ATR)
    # ta library requires 'high', 'low', and 'close' columns
    # Check if these columns exist before calculating ATR
    if all(col in processed_df.columns for col in ['high', 'low', 'close']):
        atr = ta.volatility.AverageTrueRange(processed_df['high'], processed_df['low'], processed_df['close'])
        processed_df['ATR'] = atr.average_true_range()
        print("Calculated ATR.")
    else:
        print("Warning: 'high', 'low', or 'close' columns not found. Skipping ATR calculation.")
    
    # TODO: Add other volatility metrics like Parkinson Volatility, Garman-Klass Volatility, etc.
    
    # Keep rows selectively instead of dropping all NaN rows
    original_shape = processed_df.shape[0]
    
    # For volatility metrics, only drop rows where volatility columns are ALL NaN
    volatility_columns = ['ATR']  # Add more as we implement them
    existing_vol_columns = [col for col in volatility_columns if col in processed_df.columns]
    
    if existing_vol_columns:
        # Keep rows where at least one volatility indicator is not NaN
        mask = processed_df[existing_vol_columns].notna().any(axis=1)
        processed_df = processed_df[mask]
        print(f"Volatility metrics: kept {processed_df.shape[0]} of {original_shape} rows")
    else:
        print("No volatility metrics calculated, keeping all rows")
    
    return processed_df

# TODO: Implement functions for volume-based features
def create_volume_features(df: pd.DataFrame) -> pd.DataFrame:
    """Creates volume-based features (e.g., On-Balance Volume)."""
    print("Creating volume-based features...")
    processed_df = df.copy()
    
    # Ensure the index is a datetime index for ta functions
    if not isinstance(processed_df.index, pd.DatetimeIndex):
        processed_df.index = pd.to_datetime(processed_df.index)
        
    # On-Balance Volume (OBV)
    # ta library requires 'close' and 'volume' columns
    if all(col in processed_df.columns for col in ['close', 'volume']):
        obv = ta.volume.OnBalanceVolume(processed_df['close'], processed_df['volume'])
        processed_df['OBV'] = obv.on_balance_volume()
        print("Calculated OBV.")
    else:
        print("Warning: 'close' or 'volume' columns not found. Skipping OBV calculation.")
        
    # TODO: Add other volume-based indicators like Volume Moving Average, Volume Profile, etc.
    
    # Drop rows with NaN values introduced by calculations
    processed_df = processed_df.dropna()
    
    return processed_df

# TODO: Add a main execution block for testing preprocessing steps if needed
if __name__ == "__main__":
    print("Feature engineering module - basic structure created.")
    # Example usage (placeholder):
    # # Assume 'TEST' data is in the database from previous steps
    # features = create_features('TEST')
    # print("Generated features head:\n", features.head())
    pass