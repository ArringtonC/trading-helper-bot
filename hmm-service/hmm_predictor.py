import numpy as np
from hmmlearn import hmm
import pickle
import pandas as pd

# Import feature creation logic from hmm_trainer or a shared utility
# Assuming feature creation logic is in hmm_trainer for now, but shared utility is better
# from hmm_trainer import create_features as create_features_for_prediction # Option 1: Direct import
# Option 2: Duplicate/simplify logic (less ideal)

# Import relevant functions from feature_engineering and data_preprocessing for consistent features
from feature_engineering import calculate_technical_indicators, calculate_volatility_metrics, create_time_based_features, create_volume_features
from data_preprocessing import create_lagged_features, normalize_data, handle_missing_values, handle_outliers

# Import create_features from the shared utility module
from features_utils import create_features

# TODO: Refactor data loading and feature creation into a shared utility if needed
# This function might be redundant if data is passed directly from the API endpoint
def load_price_data_for_prediction(filepath):
    """Loads recent historical price data for prediction.
    (Simplified version for prediction context, assumes same structure as training data)
    """
    # This function is likely not needed if data comes via API. Keeping as placeholder.
    print("Warning: load_price_data_for_prediction called. Assuming data is provided via API in production.")
    try:
        data = pd.read_csv(filepath, parse_dates=['date'])
        data.set_index('date', inplace=True)
        # Often prediction uses a smaller window of recent data
        # For simplicity here, we use all data, but this should be adjusted based on need
        return data[['close']].sort_index()
    except FileNotFoundError:
        print(f"Error: File not found at {filepath}")
        return None
    except Exception as e:
        print(f"Error loading data for prediction from {filepath}: {e}")
        return None

# Use the same feature creation logic as in hmm_trainer for consistency
# Copying the logic here for now, but should be refactored to a shared file
# REMOVED: create_features_for_prediction function definition moved to features_utils.py

# TODO: Define a function to load the trained HMM model
def load_model(filepath):
    """Loads a trained HMM model from a file using pickle.

    Args:
        filepath (str): The path to the model file.

    Returns:
        hmm.GaussianHMM or None: The loaded HMM model or None if loading fails.
    """
    try:
        with open(filepath, 'rb') as f:
            model = pickle.load(f)
        print(f"HMM model loaded successfully from {filepath}")
        return model
    except FileNotFoundError:
        print(f"Error: Model file not found at {filepath}")
        return None
    except Exception as e:
        print(f"Error loading model from {filepath}: {e}")
        return None

# TODO: Define a function to predict regimes using the trained model
def predict_regimes(model, features_df, return_probabilities=False):
    """Predicts the most likely sequence of hidden states (regimes) or state probabilities.

    Args:
        model (hmm.GaussianHMM): The trained HMM model.
        features_df (pd.DataFrame): DataFrame of features for prediction with DateTimeIndex.
        return_probabilities (bool): If True, returns state probabilities instead of regime sequence.

    Returns:
        pd.Series or tuple or None: Series of predicted hidden states with DateTimeIndex, or tuple of (states_series, probabilities_df), or None if prediction fails.
    """
    if model is None:
        print("Error: No HMM model provided for prediction.")
        return None
    if features_df is None or features_df.empty:
        print("Error: No features provided for prediction.")
        return None

    try:
        # Get the most likely sequence of hidden states using the Viterbi algorithm
        print("Debug: Inside predict_regimes - Features DataFrame shape before decode:")
        print(features_df.shape)
        print("Debug: Inside predict_regimes - Features DataFrame columns before decode:")
        print(features_df.columns.tolist())
        print("Debug: Inside predict_regimes - Features DataFrame head before decode:\n", features_df.head())

        log_prob, predicted_states = model.decode(features_df.values) # decode expects NumPy array

        print("Debug: Inside predict_regimes - Predicted states shape after decode:")
        print(predicted_states.shape)
        print("Debug: Inside predict_regimes - Predicted states sample after decode:")
        print(predicted_states[:5])

        # Create a pandas Series for predicted states with the original date index
        predicted_states_series = pd.Series(predicted_states, index=features_df.index, name='predicted_state')

        print("Debug: Inside predict_regimes - Predicted states Series shape:")
        print(predicted_states_series.shape)
        print("Debug: Inside predict_regimes - Predicted states Series head:\n", predicted_states_series.head())

        if return_probabilities:
            # Use predict_proba to get state probabilities at each step
            # predict_proba expects NumPy array and returns (n_samples, n_components) array
            print("Debug: Inside predict_regimes - Features DataFrame shape before predict_proba:")
            print(features_df.shape)
            state_probabilities = model.predict_proba(features_df.values)
            print("HMM state probabilities calculated using predict_proba.")

            # Create a pandas DataFrame for state probabilities with the original date index
            # Column names will be the state indices (0, 1, 2...)
            state_probabilities_df = pd.DataFrame(state_probabilities, index=features_df.index)

            print("Debug: Inside predict_regimes - State probabilities DataFrame shape:")
            print(state_probabilities_df.shape)
            print("Debug: Inside predict_regimes - State probabilities DataFrame head:\n", state_probabilities_df.head())

            # Return both the most likely sequence (Series) and state probabilities (DataFrame)
            return predicted_states_series, state_probabilities_df

        else:
            # If only regimes are requested, just return the most likely sequence (Series)
            return predicted_states_series.copy() # Return a copy to potentially avoid unexpected behavior

    except Exception as e:
        print(f"Error predicting regimes: {e}")
        # Return None explicitly on error
        import traceback
        traceback.print_exc()
        return None

def map_states_to_regimes(predicted_states_series, model, regime_labels=None):
    """Maps predicted HMM states to meaningful market regime labels.

    Args:
        predicted_states_series (pd.Series): Series of predicted hidden states (integers) with DateTimeIndex.
        model (hmm.GaussianHMM): The trained HMM model (needed to potentially order states).
        regime_labels (list, optional): A list of string labels for the regimes.
                                       If None, uses default labels based on state index.
                                       Example: ['LowVol', 'MediumVol', 'HighVol'].

    Returns:
        pd.Series or None: A Series of string labels corresponding to the predicted states with DateTimeIndex, or None if mapping fails.
    """
    if predicted_states_series is None or model is None:
        return None

    # Determine a robust way to map states to labels based on learned means.
    # This assumes states correspond to different market regimes based on feature values.
    # A common approach for volatility regimes is to sort states by the mean of a volatility-related feature.

    # TODO: Make the feature index used for sorting configurable or determined automatically.
    # Assuming the feature DataFrame used during training had 'log_return' at index 0 and 'ATR' at index 1
    # We will sort states based on the mean of the 'ATR' feature (index 1) as higher ATR correlates with higher volatility.
    # This assumes the feature order is consistent between training and prediction.
    volatility_feature_index = 1 # Index of the volatility feature (e.g., ATR) in the features array

    if model.means_.shape[1] > volatility_feature_index:
        try:
            # Sort state indices based on the mean of the specified volatility feature
            # This assumes higher mean in this feature corresponds to higher volatility regime
            sorted_state_indices = np.argsort(model.means_[:, volatility_feature_index]) # Sort by mean of volatility feature

            # Define default regime labels based on expected order after sorting by volatility mean
            # Assumes sorted states from lowest mean to highest mean map to LowVol, MediumVol, HighVol, etc.
            default_regime_labels = ['LowVol', 'MediumVol', 'HighVol']
            # Extend default labels if more components than the base labels
            if model.n_components > len(default_regime_labels):
                default_regime_labels.extend([f'Regime{i+1}' for i in range(len(default_regime_labels), model.n_components)])

            # Use provided labels or default ones, ensure length matches n_components
            labels_to_use = regime_labels if regime_labels and len(regime_labels) == model.n_components else default_regime_labels[:model.n_components]

            # Create the mapping from original state index to ordered label based on sorted means
            state_to_label_mapping = {original_idx: labels_to_use[sorted_rank] for sorted_rank, original_idx in enumerate(sorted_state_indices)}

            # Map the predicted states in the Series using the created mapping
            regime_sequence_series = predicted_states_series.map(state_to_label_mapping).fillna('UnknownState') # Handle potential missing maps
            return regime_sequence_series

        except IndexError:
            print("Error: Could not sort states by volatility mean for mapping. Check feature dimensions or volatility_feature_index.")
            # Fallback to simple index-based mapping if sorting by volatility fails
            pass # Continue to simple mapping below
        except Exception as e:
            print(f"Error during state mapping based on means: {e}")
            pass # Continue to simple mapping below

    # Fallback: Simple mapping based on state index if robust mapping is not possible or fails
    print("Warning: Falling back to simple state index-based mapping for regimes. Consider implementing a more robust mapping based on state characteristics.")
    default_regime_labels = [f'Regime{i+1}' for i in range(model.n_components)] # Default: Regime1, Regime2, ...
    labels_to_use = regime_labels if regime_labels and len(regime_labels) == model.n_components else default_regime_labels

    # Ensure labels_to_use has enough elements for all possible state indices
    if len(labels_to_use) < model.n_components:
        labels_to_use.extend([f'Regime{i+1}' for i in range(len(labels_to_use), model.n_components)])

    regime_sequence_series = predicted_states_series.map(lambda state: labels_to_use[state] if state < len(labels_to_use) else f'UnknownState{state}').fillna('UnknownState') # Handle potential missing maps
    return regime_sequence_series

if __name__ == "__main__":
    # Example usage:
    # Define the path to the trained model file and sample data for prediction
    # Ensure you have a trained model file and sample data (can use dummy data)
    model_filepath = './trained_hmm_model_test.pkl' # Update with your model file path

    print("Starting HMM prediction process...")

    # Create dummy data for prediction (ensure it has enough data points for feature calculation)
    print("Creating dummy data for prediction testing...")
    dates = pd.to_datetime(pd.date_range(start='2023-04-01', periods=100, freq='D')) # Use 100 periods for enough data
    np.random.seed(99) # Different seed for prediction data
    # Create dummy price data with some variation
    price_changes = np.random.randn(100) * 0.015
    # Introduce some periods of higher/lower volatility for testing
    price_changes[20:40] *= 0.5 # Lower volatility period
    price_changes[60:80] *= 2.0 # Higher volatility period
    # Create dummy OHLCV data for prediction
    close_prices = np.cumprod(1 + price_changes) * 110
    open_prices = close_prices * (1 + np.random.randn(100) * 0.005)
    high_prices = np.maximum(open_prices, close_prices) * (1 + np.random.rand(100) * 0.005)
    low_prices = np.minimum(open_prices, close_prices) * (1 - np.random.rand(100) * 0.005)
    volume_data = np.random.randint(100000, 1000000, 100)

    price_data = {'open': open_prices,
                  'high': high_prices,
                  'low': low_prices,
                  'close': close_prices,
                  'volume': volume_data}
    price_data_for_prediction_df = pd.DataFrame(price_data, index=dates)
    print("Dummy prediction data head:\n", price_data_for_prediction_df.head())

    # 1. Load the trained model
    # Ensure you have run hmm_trainer.py (or the /train endpoint) to create this file
    trained_model = load_model(model_filepath)

    if trained_model is not None:
        print(f"Loaded model from {model_filepath}")

        # 2. Load or create new data features for prediction
        # Use the consistent feature creation logic
        # Pass include_volatility=True if it was used during training
        # The create_features function now returns a DataFrame with index
        features_for_prediction_df = create_features(price_data_for_prediction_df, include_volatility=True, include_technical_indicators=True)

        if features_for_prediction_df is not None and not features_for_prediction_df.empty:
            print(f"Created features for prediction. Shape: {features_for_prediction_df.shape}")
            print("Features for prediction head:\n", features_for_prediction_df.head())

            # 3. Predict regimes (most likely sequence)
            print("Predicting regimes (most likely sequence)...")
            # Pass the features DataFrame to predict_regimes
            predicted_regimes_sequence_series = predict_regimes(trained_model, features_for_prediction_df, return_probabilities=False)

            if predicted_regimes_sequence_series is not None:
                print("Predicted Regimes (hidden states - sequence):")
                print(predicted_regimes_sequence_series)

                # Map states to labels
                # Example: assuming 3 components, and states sorted by volatility mean correspond to Low, Medium, High
                regime_labels = ['LowVol', 'MediumVol', 'HighVol'] # Example labels
                # Pass the predicted_states_series to map_states_to_regimes
                predicted_regime_labels_series = map_states_to_regimes(predicted_regimes_sequence_series, trained_model, regime_labels)
                print("Predicted Regime Labels (mapped):")
                print(predicted_regime_labels_series)

            else:
                print("Regime sequence prediction failed.")

            # 4. Predict regimes with probabilities
            print("\nPredicting regimes and fetching probabilities...")
            # Pass the features DataFrame to predict_regimes with return_probabilities=True
            predicted_states_and_probs = predict_regimes(trained_model, features_for_prediction_df, return_probabilities=True)

            if predicted_states_and_probs is not None:
                predicted_regimes_prob_sequence_series, state_probabilities_df = predicted_states_and_probs
                print("Predicted Regimes (hidden states - sequence from decode): ")
                print(predicted_regimes_prob_sequence_series)
                print("State Probabilities (from predict_proba): ")
                print(state_probabilities_df.head())

                # Map states to labels for the sequence from decode
                predicted_regime_labels_from_decode_series = map_states_to_regimes(predicted_regimes_prob_sequence_series, trained_model, regime_labels)
                print("Predicted Regime Labels (from decode sequence mapped):")
                print(predicted_regime_labels_from_decode_series)

                # TODO: Associate probabilities with dates/time index if needed for output

            else:
                 print("Regime prediction with probabilities failed.")

        else:
            print("Feature creation for prediction failed or resulted in empty data.")
    else:
        print("Model loading failed. Please ensure the trained model file exists.")

    print("HMM prediction process finished.") 