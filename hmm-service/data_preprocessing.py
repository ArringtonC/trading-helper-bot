import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler, StandardScaler # Import scalers

# TODO: Implement functions for data cleaning and preprocessing

def handle_missing_values(processed_df: pd.DataFrame, strategy='mean') -> pd.DataFrame:
    """
    Handle missing values in the DataFrame based on the specified strategy.

    Args:
        processed_df (pd.DataFrame): The input DataFrame with potential missing values.
        strategy (str): The strategy to use for imputation (e.g., 'mean', 'median', 'fillna_zero').

    Returns:
        pd.DataFrame: The DataFrame with missing values handled.
    """
    if strategy == 'mean':
        # Calculate mean only for numeric columns and fillna with those means
        numeric_cols = processed_df.select_dtypes(include=['number'])
        filled_df = processed_df.copy() # Create a copy to avoid modifying the original DataFrame directly
        filled_df[numeric_cols.columns] = numeric_cols.fillna(numeric_cols.mean())
        return filled_df
    elif strategy == 'median':
        # TODO: Implement median imputation
        pass
    elif strategy == 'fillna_zero':
        processed_df = processed_df.fillna(0)
        return processed_df
    else:
        print(f"Warning: Unknown missing value handling strategy: {strategy}. No imputation performed.")
        return processed_df

def handle_outliers(df: pd.DataFrame, method: str = 'iqr', cap_method: str = None) -> pd.DataFrame:
    """Handles outliers in a DataFrame.

    Args:
        df (pd.DataFrame): The input DataFrame.
        method (str): The method to detect outliers ('iqr', 'zscore').
        cap_method (str, optional): The method to handle outliers ('cap', 'remove'). Defaults to 'remove'.

    Returns:
        pd.DataFrame: DataFrame with outliers handled.
        
    Raises:
        ValueError: If an invalid method or cap_method is provided.
    """
    print(f"Handling outliers using {method} method and {cap_method} cap_method...")
    processed_df = df.copy()
    
    if method == 'iqr':
        Q1 = processed_df.quantile(0.25)
        Q3 = processed_df.quantile(0.75)
        IQR = Q3 - Q1

        print("Debug: Inside handle_outliers - Column dtypes before outlier calculation:")
        print(df.dtypes)
        print("Debug: Inside handle_outliers - Q1 dtypes:")
        print(Q1.dtypes)
        print("Debug: Inside handle_outliers - Q3 dtypes:")
        print(Q3.dtypes)
        print("Debug: Inside handle_outliers - IQR dtypes:")
        print(IQR.dtypes)

        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        if cap_method == 'remove' or cap_method is None:
            # Remove outliers
            return processed_df[~((processed_df < lower_bound) | (processed_df > upper_bound)).any(axis=1)]
        elif cap_method == 'cap':
            # Cap outliers
            return processed_df.clip(lower=lower_bound, upper=upper_bound, axis=1)
        else:
            raise ValueError(f"Invalid outlier capping method: {cap_method}. Supported methods: 'remove', 'cap'.")
            
    elif method == 'zscore':
        # TODO: Implement Z-score outlier detection and handling
        print("Z-score outlier handling not yet implemented.")
        return processed_df # Return original for now
        
    else:
        raise ValueError(f"Invalid outlier detection method: {method}. Supported methods: 'iqr', 'zscore'.")

def create_lagged_features(df: pd.DataFrame, lags: int = 5, target_column: str = 'close') -> pd.DataFrame:
    """Creates lagged features for time series data.

    Args:
        df (pd.DataFrame): The input DataFrame (time series).
        lags (int): The number of lag periods to create.
        target_column (str): The name of the column to create lagged features from.

    Returns:
        pd.DataFrame: DataFrame with lagged features.
    
    Raises:
        ValueError: If the target_column is not in the DataFrame.
    """
    print(f"Creating {lags} lagged features for column '{target_column}'...")
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in the DataFrame.")
        
    lagged_df = df.copy()
    for i in range(1, lags + 1):
        lagged_df[f'{target_column}_lag_{i}'] = lagged_df[target_column].shift(i)
    return lagged_df.dropna() # Drop rows with NaN introduced by shifting

def normalize_data(df: pd.DataFrame, method: str = 'minmax') -> pd.DataFrame:
    """Normalizes data in a DataFrame.

    Args:
        df (pd.DataFrame): The input DataFrame.
        method (str): The normalization method ('minmax', 'standardize').

    Returns:
        pd.DataFrame: Normalized DataFrame.
        
    Raises:
        ValueError: If an invalid method is provided.
    """
    print(f"Normalizing data using {method} method...")
    processed_df = df.copy()
    
    if method == 'minmax':
        scaler = MinMaxScaler()
        # Fit and transform the data
        # Need to handle potential single column DataFrames vs multiple
        if processed_df.shape[1] > 0:
             normalized_data = scaler.fit_transform(processed_df)
             return pd.DataFrame(normalized_data, columns=processed_df.columns, index=processed_df.index)
        else:
            return processed_df # Return empty if input is empty

    elif method == 'standardize':
        scaler = StandardScaler()
         # Fit and transform the data
        if processed_df.shape[1] > 0:
            standardized_data = scaler.fit_transform(processed_df)
            return pd.DataFrame(standardized_data, columns=processed_df.columns, index=processed_df.index)
        else:
            return processed_df # Return empty if input is empty
    else:
        raise ValueError(f"Invalid normalization method: {method}. Supported methods: 'minmax', 'standardize'.")

def create_train_val_test_splits(df: pd.DataFrame, train_size: float = 0.7, val_size: float = 0.15) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Splits the dataframe into training, validation, and test sets chronologically.

    Args:
        df (pd.DataFrame): The input DataFrame with a datetime index.
        train_size (float): The proportion of the data to use for training.
        val_size (float): The proportion of the data to use for validation.
        (The remaining data will be used for testing.)

    Returns:
        tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]: A tuple containing the
        training, validation, and test DataFrames.
        
    Raises:
        ValueError: If train_size and val_size do not sum to less than 1.
    """
    if train_size + val_size >= 1.0:
        raise ValueError("train_size and val_size must sum to less than 1.0")

    total_records = len(df)
    train_end_index = int(total_records * train_size)
    val_end_index = int(total_records * (train_size + val_size))

    train_df = df.iloc[:train_end_index]
    val_df = df.iloc[train_end_index:val_end_index]
    test_df = df.iloc[val_end_index:]

    print(f"Data split into: Train ({len(train_df)} records), Validation ({len(val_df)} records), Test ({len(test_df)} records)")
    return train_df, val_df, test_df

# TODO: Add a main execution block for testing preprocessing steps if needed
if __name__ == "__main__":
    print("Data preprocessing modules - basic structure created.")
    # Example usage (placeholder):
    # Sample data (replace with actual loaded data)
    # data = {'date': pd.to_datetime(['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05']),
    #         'close': [100, 101, np.nan, 103, 150]}
    # sample_df = pd.DataFrame(data).set_index('date')
    # print('Original DataFrame:\n', sample_df)

    # Handled missing values
    # df_cleaned = handle_missing_values(sample_df, strategy='mean')
    # print('DataFrame after handling missing values:\n', df_cleaned)

    # Handled outliers (using the cleaned data)
    # df_no_outliers = handle_outliers(df_cleaned, method='iqr')
    # print('DataFrame after handling outliers:\n', df_no_outliers)

    # Created lagged features
    # df_lagged = create_lagged_features(df_no_outliers, lags=2)
    # print('DataFrame with lagged features:\n', df_lagged)

    # Normalized data
    # df_normalized = normalize_data(df_lagged, method='minmax')
    # print('Normalized DataFrame:\n', df_normalized)
    pass 