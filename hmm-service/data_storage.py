import sqlite3
import pandas as pd

# TODO: Define database file path (make configurable)
DATABASE_FILE = '../trading_data.db'

# TODO: Implement function to connect to the database
def create_connection(db_file):
    """Create a database connection to the SQLite database specified by db_file"""
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        print(f"Successfully connected to database: {db_file}")
    except sqlite3.Error as e:
        print(f"Error connecting to database: {e}")
    return conn

# TODO: Implement function to create necessary tables
def create_tables(conn):
    """Create tables for historical data, economic indicators, and sentiment data"""
    # SQL statements to create tables
    historical_data_table = """
    CREATE TABLE IF NOT EXISTS historical_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        date TEXT NOT NULL,
        close REAL NOT NULL,
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
        c.execute(historical_data_table)
        c.execute(economic_data_table)
        c.execute(sentiment_data_table)
        print("Tables created successfully (if they didn't exist).")
    except sqlite3.Error as e:
        print(f"Error creating tables: {e}")

# TODO: Implement function to insert historical data
def insert_historical_data(conn, data: pd.DataFrame, symbol: str):
    """Insert historical data into the database"""
    print(f"Inserting historical data for {symbol}...")
    try:
        # Ensure 'date' is a column for to_sql
        if isinstance(data.index, pd.DatetimeIndex):
            data_to_insert = data.copy().reset_index()
            data_to_insert['date'] = data_to_insert['date'].dt.strftime('%Y-%m-%d') # Format date as string
        else:
             data_to_insert = data.copy()

        data_to_insert['symbol'] = symbol
        
        # Use 'append' to add new rows, 'ignore' to skip duplicates based on UNIQUE constraint
        data_to_insert.to_sql('historical_data', conn, if_exists='append', index=False, method='multi')
        conn.commit() # Commit changes
        print(f"Successfully inserted historical data for {symbol}.")
    except sqlite3.IntegrityError:
         print(f"Duplicate entry found for historical data for {symbol}. Skipping insertion.")
         conn.rollback() # Rollback changes on integrity error
    except Exception as e:
        print(f"Error inserting historical data for {symbol}: {e}")
        conn.rollback() # Rollback changes on other errors

# TODO: Implement function to retrieve historical data
def get_historical_data(conn, symbol: str, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    """Retrieve historical data for a given symbol from the database"""
    print(f"Retrieving historical data for {symbol}...")
    query = f"SELECT date, open, high, low, close, volume FROM historical_data WHERE symbol = ?"
    params = [symbol]
    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)
        
    # Order by date to ensure time series order
    query += " ORDER BY date"

    try:
        historical_df = pd.read_sql_query(query, conn, params=params, parse_dates=['date'])
        historical_df.set_index('date', inplace=True)
        print(f"Successfully retrieved {len(historical_df)} data points for {symbol}.")
        return historical_df
    except pd.io.sql.DatabaseError as e:
         print(f"Error retrieving historical data for {symbol}: {e}")
         return pd.DataFrame()
    except Exception as e:
        print(f"An unexpected error occurred during data retrieval: {e}")
        return pd.DataFrame()

# TODO: Implement functions for inserting and retrieving other data types (economic, sentiment)

def insert_economic_data(conn, data: pd.DataFrame, indicator_name: str):
    """Insert economic indicator data into the database"""
    print(f"Inserting economic data for {indicator_name}...")
    try:
        # Ensure 'date' is a column for to_sql
        if isinstance(data.index, pd.DatetimeIndex):
            data_to_insert = data.copy().reset_index()
            data_to_insert['date'] = data_to_insert['date'].dt.strftime('%Y-%m-%d') # Format date as string
        else:
             data_to_insert = data.copy()

        data_to_insert['indicator_name'] = indicator_name
        
        # Use 'append' to add new rows, 'ignore' to skip duplicates based on UNIQUE constraint
        data_to_insert.to_sql('economic_data', conn, if_exists='append', index=False, method='multi')
        conn.commit() # Commit changes
        print(f"Successfully inserted economic data for {indicator_name}.")
    except sqlite3.IntegrityError:
         print(f"Duplicate entry found for economic data for {indicator_name}. Skipping insertion.")
         conn.rollback() # Rollback changes on integrity error
    except Exception as e:
        print(f"Error inserting economic data for {indicator_name}: {e}")
        conn.rollback() # Rollback changes on other errors

def get_economic_data(conn, indicator_name: str, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    """Retrieve economic indicator data from the database"""
    print(f"Retrieving economic data for {indicator_name}...")
    query = f"SELECT date, value FROM economic_data WHERE indicator_name = ?"
    params = [indicator_name]
    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)
    
    # Order by date
    query += " ORDER BY date"

    try:
        economic_df = pd.read_sql_query(query, conn, params=params, parse_dates=['date'])
        economic_df.set_index('date', inplace=True)
        print(f"Successfully retrieved {len(economic_df)} data points for {indicator_name}.")
        return economic_df
    except pd.io.sql.DatabaseError as e:
         print(f"Error retrieving economic data for {indicator_name}: {e}")
         return pd.DataFrame()
    except Exception as e:
        print(f"An unexpected error occurred during economic data retrieval: {e}")
        return pd.DataFrame()

# TODO: Add a main function for testing

def insert_sentiment_data(conn, data: pd.DataFrame, source: str):
    """Insert sentiment data into the database"""
    print(f"Inserting sentiment data from {source}...")
    try:
        # Ensure 'date' is a column for to_sql
        if isinstance(data.index, pd.DatetimeIndex):
            data_to_insert = data.copy().reset_index()
            data_to_insert['date'] = data_to_insert['date'].dt.strftime('%Y-%m-%d') # Format date as string
        else:
             data_to_insert = data.copy()

        data_to_insert['source'] = source
        
        # Use 'append' to add new rows, 'ignore' to skip duplicates based on UNIQUE constraint
        data_to_insert.to_sql('sentiment_data', conn, if_exists='append', index=False, method='multi')
        conn.commit() # Commit changes
        print(f"Successfully inserted sentiment data from {source}.")
    except sqlite3.IntegrityError:
         print(f"Duplicate entry found for sentiment data from {source}. Skipping insertion.")
         conn.rollback() # Rollback changes on integrity error
    except Exception as e:
        print(f"Error inserting sentiment data from {source}: {e}")
        conn.rollback() # Rollback changes on other errors

def get_sentiment_data(conn, source: str, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    """Retrieve sentiment data for a given source from the database"""
    print(f"Retrieving sentiment data for {source}...")
    query = f"SELECT date, score FROM sentiment_data WHERE source = ?"
    params = [source]
    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)
    
    # Order by date
    query += " ORDER BY date"

    try:
        sentiment_df = pd.read_sql_query(query, conn, params=params, parse_dates=['date'])
        sentiment_df.set_index('date', inplace=True)
        print(f"Successfully retrieved {len(sentiment_df)} data points for {source}.")
        return sentiment_df
    except pd.io.sql.DatabaseError as e:
         print(f"Error retrieving sentiment data for {source}: {e}")
         return pd.DataFrame()
    except Exception as e:
        print(f"An unexpected error occurred during sentiment data retrieval: {e}")
        return pd.DataFrame()

if __name__ == "__main__":
    print("Data storage modules - basic structure created.")
    # Example usage (placeholder):
    # db_connection = create_connection(DATABASE_FILE)
    # if db_connection:
    #    create_tables(db_connection)
    #    # Example of inserting dummy historical data
    #    dummy_historical_data = {'date': pd.to_datetime(['2023-01-01', '2023-01-02', '2023-01-03']),
    #                             'close': [100, 101, 102]}
    #    dummy_historical_df = pd.DataFrame(dummy_historical_data).set_index('date')
    #    insert_historical_data(db_connection, dummy_historical_df, 'TEST')
    #    # Example of retrieving historical data
    #    retrieved_historical_df = get_historical_data(db_connection, 'TEST', start_date='2023-01-01')
    #    print('Retrieved historical data head:\n', retrieved_historical_df.head())
    #    
    #    # Example of inserting dummy economic data
    #    dummy_economic_data = {'date': pd.to_datetime(['2023-01-01', '2023-04-01']),
    #                           'value': [1.5, 1.7]}
    #    dummy_economic_df = pd.DataFrame(dummy_economic_data).set_index('date')
    #    insert_economic_data(db_connection, dummy_economic_df, 'CPI')
    #    # Example of retrieving economic data
    #    retrieved_economic_df = get_economic_data(db_connection, 'CPI', start_date='2023-01-01')
    #    print('Retrieved economic data head:\n', retrieved_economic_df.head())
    #
    #    # Example of inserting dummy sentiment data
    #    dummy_sentiment_data = {'date': pd.to_datetime(['2023-01-01', '2023-01-02']),
    #                            'score': [0.8, -0.5]}
    #    dummy_sentiment_df = pd.DataFrame(dummy_sentiment_data).set_index('date')
    #    insert_sentiment_data(db_connection, dummy_sentiment_df, 'Social Media')
    #    # Example of retrieving sentiment data
    #    retrieved_sentiment_df = get_sentiment_data(db_connection, 'Social Media', start_date='2023-01-01')
    #    print('Retrieved sentiment data head:\n', retrieved_sentiment_df.head())
    #
    #    db_connection.close()
    pass 