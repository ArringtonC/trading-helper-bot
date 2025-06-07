import pandas as pd
import numpy as np
import io # Import the io module

def load_and_parse_trades(filepath: str | None = None, trade_data: str | None = None) -> pd.DataFrame | None:
    """Loads and parses the 'Trades' section from an Interactive Brokers activity statement CSV.

    Args:
        filepath (str, optional): The path to the CSV file. Defaults to None.
        trade_data (str, optional): Raw trade data as a string (e.g., CSV content). Defaults to None.

    Returns:
        pd.DataFrame | None: A DataFrame containing the trade data, or None if parsing fails.
    """
    if trade_data is not None:
        print("Parsing trade data from provided string...")
        # Use io.StringIO to treat the string data as a file
        data_source = io.StringIO(trade_data)
    elif filepath:
        print(f"Loading and parsing trade data from {filepath}...")
        # Open the file if a filepath is provided
        try:
            data_source = open(filepath, 'r')
        except FileNotFoundError:
            print(f"Error: File not found at {filepath}")
            return None
        except Exception as e:
            print(f"Error opening trade data file {filepath}: {e}")
            return None
    else:
        print("Error: No trade data or filepath provided.")
        return None

    trades_data = []
    is_trades_section = False
    trades_header = None

    # Use the data_source (StringIO or file handle) in the loop
    try:
        for line in data_source:
            # Strip whitespace and split by comma
            row = [item.strip() for item in line.strip().split(',')]

            # Check for the start of the Trades section
            if len(row) > 1 and row[0] == 'Trades' and row[1] == 'Header':
                is_trades_section = True
                trades_header = [h.strip() for h in line.strip().split(',')[2:]] # Capture header fields
                print(f"Found Trades section header: {trades_header}")
                continue # Skip the header row itself

            # If we are in the Trades section, process data rows
            if is_trades_section:
                # Stop if we hit the next section header or a blank line
                if len(row) <= 1 or (len(row) > 1 and row[1] == 'Header'):
                    print("Reached end of Trades section.")
                    break

                # Process data rows (where DataDiscriminator is 'Data' or 'Order')
                # The actual trade data rows start with 'Trades,Data,Order,...'
                if len(row) > 2 and row[0] == 'Trades' and row[1] == 'Data' and row[2] == 'Order':
                     # Extract data starting from the 3rd column (after 'Trades', 'Data', 'Order')
                     trade_row_data = row[3:]
                     if len(trade_row_data) == len(trades_header):
                          trades_data.append(trade_row_data)
                     else:
                          print(f"Warning: Skipping row with mismatched columns ({len(trade_row_data)} vs {len(trades_header)}): {line.strip()}")

        if not trades_header or not trades_data:
             print("Error: Could not find or parse 'Trades' section.")
             return None

        # Create DataFrame
        trades_df = pd.DataFrame(trades_data, columns=trades_header)

        # Convert data types
        # Date/Time needs careful parsing
        trades_df['Date/Time'] = pd.to_datetime(trades_df['Date/Time'])

        # Columns that should be numeric
        numeric_cols = ['Quantity', 'T. Price', 'C. Price', 'Proceeds', 'Comm/Fee', 'Basis', 'Realized P/L', 'MTM P/L']
        for col in numeric_cols:
            if col in trades_df.columns:
                # Attempt to convert to numeric, coercing errors (turning invalid parsing into NaN)
                trades_df[col] = pd.to_numeric(trades_df[col], errors='coerce')
            else:
                 print(f"Warning: Numeric column '{col}' not found in trades data.")

        # Set Date/Time as index if desired, or keep as a column
        # Setting as index is useful for time-series operations
        trades_df.set_index('Date/Time', inplace=True)
        trades_df.sort_index(inplace=True) # Ensure chronological order

        print(f"Successfully parsed {len(trades_df)} trade records.")
        return trades_df

    except Exception as e:
        # Close the file handle if it was opened
        if filepath and data_source:
            data_source.close()
        # Catch specific errors first
        if isinstance(e, ValueError):
             print(f"ValueError during trade data parsing: {e}")
        else:
             print(f"Unexpected error during trade data parsing: {e}")
        print("Error parsing trade data: Could not parse trades section.")
        return None

def engineer_trade_features(trades_df: pd.DataFrame, freq: str = 'D') -> pd.DataFrame | None:
    """Engineers time-series features from raw trade data by resampling.

    Args:
        trades_df (pd.DataFrame): DataFrame containing raw trade data with DateTimeIndex.
        freq (str): The frequency for resampling (e.g., 'D' for daily, 'W' for weekly).

    Returns:
        pd.DataFrame | None: DataFrame of engineered trade features, or None if input is invalid.
    """
    if trades_df is None or trades_df.empty:
        print("Error: No trade data provided for feature engineering.")
        return None

    print(f"Engineering trade features at {freq} frequency...")

    # Ensure the index is a DateTimeIndex
    if not isinstance(trades_df.index, pd.DatetimeIndex):
        print("Error: Trade data index is not a DateTimeIndex.")
        return None

    # Calculate features per resampling period
    try:
        # Example features:
        # 1. Daily Trade Count
        daily_trade_count = trades_df.resample(freq).size().rename('trade_count')

        # 2. Daily Total Realized P/L
        # Fill NaN P/L with 0 before summing, as missing P/L might mean no P/L for that trade
        daily_realized_pl = trades_df['Realized P/L'].fillna(0).resample(freq).sum().rename('total_realized_pl')

        # TODO: Add more relevant features, e.g.:
        # - Average P/L per trade
        # - Win rate (requires tracking wins/losses)
        # - Total Volume traded
        # - Holding period metrics (requires matching entry/exit trades)
        # - Features per symbol if trading multiple assets

        # Combine features into a single DataFrame
        trade_features_df = pd.concat([daily_trade_count, daily_realized_pl], axis=1)

        # Fill NaN values created by resampling (periods with no trades)
        # For count, fill with 0. For sums/averages, fill with 0 or ffill/bfill depending on interpretation.
        # Let's fill all with 0 for simplicity for now.
        trade_features_df.fillna(0, inplace=True)

        print(f"Successfully engineered trade features. Shape: {trade_features_df.shape}")
        return trade_features_df

    except Exception as e:
        print(f"Error engineering trade features: {e}")
        return None

if __name__ == "__main__":
    # Example usage for testing
    # Replace with the path to your actual CSV file
    test_filepath = 'U5922405_20250203_20250425 (1).csv' # <--- UPDATE THIS PATH
    print(f"Testing load_and_parse_trades and engineer_trade_features with {test_filepath}")
    trade_data = load_and_parse_trades(test_filepath)

    if trade_data is not None:
        print("Raw Trade Data Head:\n", trade_data.head())

        # Engineer daily features
        daily_trade_features = engineer_trade_features(trade_data, freq='D')

        if daily_trade_features is not None:
            print("\nDaily Trade Features Head:\n", daily_trade_features.head())
            print("\nDaily Trade Features Info:\n")
            daily_trade_features.info()
        else:
            print("Failed to engineer daily trade features.")

    else:
        print("Failed to load raw trade data.") 