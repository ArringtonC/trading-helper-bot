import pandas as pd
import sqlite3
from datetime import datetime, timedelta
from data_storage import create_connection, DATABASE_FILE
from data_acquisition import MarketDataAcquisition

def create_enhanced_tables(conn):
    """Create enhanced tables with OHLCV data"""
    # Enhanced historical data table with OHLCV
    historical_data_table = """
    CREATE TABLE IF NOT EXISTS historical_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        date TEXT NOT NULL,
        open REAL NOT NULL,
        high REAL NOT NULL,
        low REAL NOT NULL,
        close REAL NOT NULL,
        volume INTEGER NOT NULL,
        UNIQUE(symbol, date)
    );
    """

    economic_data_table = """
    CREATE TABLE IF NOT EXISTS economic_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        indicator_name TEXT NOT NULL,
        date TEXT NOT NULL,
        value REAL NOT NULL,
        UNIQUE(indicator_name, date)
    );
    """

    sentiment_data_table = """
    CREATE TABLE IF NOT EXISTS sentiment_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        date TEXT NOT NULL,
        score REAL NOT NULL,
        UNIQUE(source, date)
    );
    """

    try:
        c = conn.cursor()
        # Drop existing table if it exists to update schema
        c.execute("DROP TABLE IF EXISTS historical_data")
        c.execute(historical_data_table)
        c.execute(economic_data_table)
        c.execute(sentiment_data_table)
        conn.commit()
        print("Enhanced tables created successfully.")
    except sqlite3.Error as e:
        print(f"Error creating tables: {e}")

def insert_ohlcv_data(conn, data: pd.DataFrame, symbol: str):
    """Insert OHLCV historical data into the database"""
    print(f"Inserting OHLCV data for {symbol}...")
    try:
        # Ensure 'date' is a column for to_sql
        if isinstance(data.index, pd.DatetimeIndex):
            data_to_insert = data.copy().reset_index()
            data_to_insert['date'] = data_to_insert['date'].dt.strftime('%Y-%m-%d')
        else:
            data_to_insert = data.copy()

        data_to_insert['symbol'] = symbol
        
        # Ensure column names are lowercase
        data_to_insert.columns = data_to_insert.columns.str.lower()
        
        # Use 'replace' to overwrite existing data
        data_to_insert.to_sql('historical_data', conn, if_exists='append', index=False, method='multi')
        conn.commit()
        print(f"Successfully inserted OHLCV data for {symbol}.")
    except sqlite3.IntegrityError:
        print(f"Duplicate entry found for {symbol}. Skipping insertion.")
        conn.rollback()
    except Exception as e:
        print(f"Error inserting OHLCV data for {symbol}: {e}")
        conn.rollback()

if __name__ == "__main__":
    symbol = "SPY"
    end_date = datetime.today()
    start_date = end_date - timedelta(days=5*365)
    start_date_str = start_date.strftime('%Y-%m-%d')
    end_date_str = end_date.strftime('%Y-%m-%d')

    print(f"Connecting to database: {DATABASE_FILE}")
    conn = create_connection(DATABASE_FILE)
    if conn is None:
        print("Failed to connect to database.")
        exit(1)

    print("Creating enhanced tables with OHLCV data...")
    create_enhanced_tables(conn)

    print(f"Fetching {symbol} data from {start_date_str} to {end_date_str}...")
    acquirer = MarketDataAcquisition()
    df = acquirer.fetch_historical_data(symbol, start_date_str, end_date_str)
    if df is None or df.empty:
        print("No data fetched. Exiting.")
        exit(1)

    # Handle MultiIndex columns from yfinance and extract all OHLCV
    if isinstance(df.columns, pd.MultiIndex):
        # Extract OHLCV columns
        ohlcv_data = pd.DataFrame()
        for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
            if (col, symbol) in df.columns:
                ohlcv_data[col.lower()] = df[(col, symbol)]
            else:
                print(f"Missing {col} data for {symbol}")
                exit(1)
        ohlcv_data.index.name = 'date'
    else:
        # Assume columns are already properly named
        required_cols = ['open', 'high', 'low', 'close', 'volume']
        available_cols = [col.lower() for col in df.columns]
        
        if all(col in available_cols for col in required_cols):
            df.columns = df.columns.str.lower()
            ohlcv_data = df[required_cols].copy()
            ohlcv_data.index.name = 'date'
        else:
            print(f"Missing required OHLCV columns. Available: {available_cols}")
            exit(1)

    print(f"Inserting {len(ohlcv_data)} rows of OHLCV data into historical_data table...")
    insert_ohlcv_data(conn, ohlcv_data, symbol)
    print("Done.")
    conn.close() 