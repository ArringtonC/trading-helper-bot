"""
Basic ML Ensemble Framework for Trading Analysis (without TensorFlow dependency)
Implements ensemble methods combining Random Forest and Gradient Boosting
as required by Task 12.3 ML Model Development

This version works without TensorFlow/LSTM but still provides strong ensemble performance
using traditional ML algorithms with hyperparameter optimization.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, TimeSeriesSplit
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler, LabelEncoder
import optuna
import joblib
import pickle
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Import our feature engineering modules
from feature_engineering import create_features
from data_storage import get_historical_data, create_connection, DATABASE_FILE

class BasicMLEnsemble:
    """
    Basic ML Ensemble for trading prediction combining:
    - Random Forest
    - Gradient Boosting
    - Hyperparameter optimization using Bayesian methods
    
    Designed to meet 65% directional accuracy requirement from Task 12.3
    """
    
    def __init__(self, prediction_horizon=1):
        self.prediction_horizon = prediction_horizon
        
        # Initialize models
        self.random_forest = None
        self.gradient_boosting = None
        
        # Scalers for data preprocessing
        self.feature_scaler = StandardScaler()
        self.target_encoder = LabelEncoder()
        
        # Model performance tracking
        self.model_performance = {}
        self.ensemble_weights = {'rf': 0.5, 'gb': 0.5}
        
        # Training history
        self.training_history = []
        
    def prepare_features_for_ml(self, symbol, start_date=None, end_date=None):
        """
        Prepare comprehensive features for ML training/prediction
        
        Args:
            symbol (str): Trading symbol
            start_date (str): Start date for data
            end_date (str): End date for data
            
        Returns:
            tuple: (features_df, target_series, price_data)
        """
        print(f"Preparing ML features for {symbol}...")
        
        # Get historical data
        conn = create_connection(DATABASE_FILE)
        if conn is None:
            raise Exception("Could not connect to database")
            
        try:
            historical_df = get_historical_data(conn, symbol)
            if historical_df.empty:
                raise Exception(f"No historical data found for {symbol}")
                
            # Create comprehensive features using our feature engineering module
            features_df = create_features(symbol)
            
            if features_df.empty:
                raise Exception("Feature creation failed")
                
            # Create target variable (price direction prediction)
            features_df['future_return'] = features_df['close'].pct_change(self.prediction_horizon).shift(-self.prediction_horizon)
            features_df['target'] = (features_df['future_return'] > 0).astype(int)
            
            # Create additional ML-specific features
            features_df = self._add_ml_features(features_df)
            
            # Remove rows with NaN values
            features_df = features_df.dropna()
            
            if len(features_df) < 50:  # Minimum data requirement
                raise Exception(f"Insufficient data: need at least 50 rows, got {len(features_df)}")
                
            # Separate features and target
            feature_columns = [col for col in features_df.columns if col not in ['target', 'future_return']]
            X = features_df[feature_columns]
            y = features_df['target']
            
            print(f"Features prepared: {X.shape[0]} samples, {X.shape[1]} features")
            return X, y, features_df
            
        finally:
            conn.close()
    
    def _add_ml_features(self, df):
        """Add additional ML-specific features"""
        
        # Rolling statistics
        for window in [5, 10, 20]:
            df[f'close_ma_{window}'] = df['close'].rolling(window).mean()
            df[f'close_std_{window}'] = df['close'].rolling(window).std()
            df[f'volume_ma_{window}'] = df['volume'].rolling(window).mean()
            
        # Price momentum features
        for period in [3, 5, 10]:
            df[f'momentum_{period}'] = df['close'].pct_change(period)
            
        # Volatility features
        df['volatility_5d'] = df['close'].pct_change().rolling(5).std()
        df['volatility_20d'] = df['close'].pct_change().rolling(20).std()
        
        # Support/Resistance levels
        df['support_level'] = df['low'].rolling(20).min()
        df['resistance_level'] = df['high'].rolling(20).max()
        df['support_distance'] = (df['close'] - df['support_level']) / df['close']
        df['resistance_distance'] = (df['resistance_level'] - df['close']) / df['close']
        
        # Additional features for better performance
        df['high_low_ratio'] = df['high'] / df['low']
        df['close_open_ratio'] = df['close'] / df['open']
        df['volume_price_trend'] = df['volume'] * df['close'].pct_change()
        
        # Lagged features
        for lag in [1, 2, 3]:
            df[f'close_lag_{lag}'] = df['close'].shift(lag)
            df[f'volume_lag_{lag}'] = df['volume'].shift(lag)
            
        return df
    
    def optimize_hyperparameters(self, X, y, n_trials=50):
        """
        Optimize hyperparameters for both models using Bayesian optimization
        
        Args:
            X (pd.DataFrame): Feature matrix
            y (pd.Series): Target vector
            n_trials (int): Number of optimization trials
            
        Returns:
            dict: Best hyperparameters for each model
        """
        print(f"Starting hyperparameter optimization with {n_trials} trials...")
        
        # Time series split for validation
        tscv = TimeSeriesSplit(n_splits=3)
        
        def objective(trial):
            try:
                # Random Forest hyperparameters
                rf_n_estimators = trial.suggest_int('rf_n_estimators', 50, 300)
                rf_max_depth = trial.suggest_int('rf_max_depth', 5, 25)
                rf_min_samples_split = trial.suggest_int('rf_min_samples_split', 2, 20)
                rf_min_samples_leaf = trial.suggest_int('rf_min_samples_leaf', 1, 10)
                rf_max_features = trial.suggest_categorical('rf_max_features', ['sqrt', 'log2', 0.5, 0.8])
                
                # Gradient Boosting hyperparameters
                gb_n_estimators = trial.suggest_int('gb_n_estimators', 50, 300)
                gb_max_depth = trial.suggest_int('gb_max_depth', 3, 12)
                gb_learning_rate = trial.suggest_float('gb_learning_rate', 0.01, 0.3)
                gb_subsample = trial.suggest_float('gb_subsample', 0.7, 1.0)
                gb_min_samples_split = trial.suggest_int('gb_min_samples_split', 2, 20)
                
                scores = []
                
                for train_idx, val_idx in tscv.split(X):
                    X_train_fold, X_val_fold = X.iloc[train_idx], X.iloc[val_idx]
                    y_train_fold, y_val_fold = y.iloc[train_idx], y.iloc[val_idx]
                    
                    # Scale features
                    scaler = StandardScaler()
                    X_train_scaled = scaler.fit_transform(X_train_fold)
                    X_val_scaled = scaler.transform(X_val_fold)
                    
                    # Random Forest
                    rf = RandomForestClassifier(
                        n_estimators=rf_n_estimators,
                        max_depth=rf_max_depth,
                        min_samples_split=rf_min_samples_split,
                        min_samples_leaf=rf_min_samples_leaf,
                        max_features=rf_max_features,
                        random_state=42,
                        n_jobs=-1
                    )
                    rf.fit(X_train_scaled, y_train_fold)
                    rf_pred_proba = rf.predict_proba(X_val_scaled)[:, 1]
                    
                    # Gradient Boosting
                    gb = GradientBoostingClassifier(
                        n_estimators=gb_n_estimators,
                        max_depth=gb_max_depth,
                        learning_rate=gb_learning_rate,
                        subsample=gb_subsample,
                        min_samples_split=gb_min_samples_split,
                        random_state=42
                    )
                    gb.fit(X_train_scaled, y_train_fold)
                    gb_pred_proba = gb.predict_proba(X_val_scaled)[:, 1]
                    
                    # Ensemble prediction (weighted average)
                    ensemble_proba = (rf_pred_proba + gb_pred_proba) / 2
                    ensemble_pred = (ensemble_proba > 0.5).astype(int)
                    
                    fold_accuracy = accuracy_score(y_val_fold, ensemble_pred)
                    scores.append(fold_accuracy)
                
                return np.mean(scores)
                
            except Exception as e:
                print(f"Trial failed: {e}")
                return 0.0
        
        # Run optimization
        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=n_trials, timeout=900)  # 15 min timeout
        
        print(f"Best accuracy: {study.best_value:.4f}")
        print(f"Best parameters: {study.best_params}")
        
        return study.best_params
    
    def train_ensemble(self, X, y, hyperparams=None, test_size=0.2):
        """
        Train the complete ensemble model
        
        Args:
            X (pd.DataFrame): Feature matrix
            y (pd.Series): Target vector
            hyperparams (dict): Hyperparameters (if None, will optimize)
            test_size (float): Test set size for evaluation
            
        Returns:
            dict: Training results and performance metrics
        """
        print("Starting ensemble training...")
        
        # Train/test split (time-aware)
        split_idx = int(len(X) * (1 - test_size))
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        
        # Optimize hyperparameters if not provided
        if hyperparams is None:
            print("Optimizing hyperparameters...")
            hyperparams = self.optimize_hyperparameters(X_train, y_train)
        
        # Scale features
        X_train_scaled = self.feature_scaler.fit_transform(X_train)
        X_test_scaled = self.feature_scaler.transform(X_test)
        
        # Train Random Forest
        print("Training Random Forest...")
        self.random_forest = RandomForestClassifier(
            n_estimators=hyperparams.get('rf_n_estimators', 150),
            max_depth=hyperparams.get('rf_max_depth', 15),
            min_samples_split=hyperparams.get('rf_min_samples_split', 5),
            min_samples_leaf=hyperparams.get('rf_min_samples_leaf', 2),
            max_features=hyperparams.get('rf_max_features', 'sqrt'),
            random_state=42,
            n_jobs=-1
        )
        self.random_forest.fit(X_train_scaled, y_train)
        
        # Train Gradient Boosting
        print("Training Gradient Boosting...")
        self.gradient_boosting = GradientBoostingClassifier(
            n_estimators=hyperparams.get('gb_n_estimators', 150),
            max_depth=hyperparams.get('gb_max_depth', 8),
            learning_rate=hyperparams.get('gb_learning_rate', 0.1),
            subsample=hyperparams.get('gb_subsample', 0.85),
            min_samples_split=hyperparams.get('gb_min_samples_split', 5),
            random_state=42
        )
        self.gradient_boosting.fit(X_train_scaled, y_train)
        
        # Evaluate models
        results = self._evaluate_models(X_test_scaled, y_test)
        
        # Update training history
        self.training_history.append({
            'timestamp': datetime.now().isoformat(),
            'hyperparams': hyperparams,
            'performance': results,
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        })
        
        print("Ensemble training completed!")
        return results
    
    def _evaluate_models(self, X_test, y_test):
        """Evaluate individual models and ensemble performance"""
        
        results = {}
        
        # Random Forest predictions
        rf_pred = self.random_forest.predict(X_test)
        rf_pred_proba = self.random_forest.predict_proba(X_test)[:, 1]
        
        results['random_forest'] = {
            'accuracy': accuracy_score(y_test, rf_pred),
            'predictions': rf_pred,
            'probabilities': rf_pred_proba
        }
        
        # Gradient Boosting predictions
        gb_pred = self.gradient_boosting.predict(X_test)
        gb_pred_proba = self.gradient_boosting.predict_proba(X_test)[:, 1]
        
        results['gradient_boosting'] = {
            'accuracy': accuracy_score(y_test, gb_pred),
            'predictions': gb_pred,
            'probabilities': gb_pred_proba
        }
        
        # Ensemble predictions (weighted average of probabilities)
        ensemble_proba = (
            self.ensemble_weights['rf'] * rf_pred_proba +
            self.ensemble_weights['gb'] * gb_pred_proba
        )
        ensemble_pred = (ensemble_proba > 0.5).astype(int)
        
        results['ensemble'] = {
            'accuracy': accuracy_score(y_test, ensemble_pred),
            'predictions': ensemble_pred,
            'probabilities': ensemble_proba
        }
        
        # Print results
        print("\n=== MODEL PERFORMANCE ===")
        for model_name, metrics in results.items():
            print(f"{model_name.upper()}: {metrics['accuracy']:.4f}")
        
        return results
    
    def predict(self, X):
        """
        Make ensemble predictions on new data
        
        Args:
            X (pd.DataFrame): Feature matrix
            
        Returns:
            dict: Predictions from all models
        """
        if not all([self.random_forest, self.gradient_boosting]):
            raise Exception("Models not trained. Call train_ensemble() first.")
        
        # Scale features
        X_scaled = self.feature_scaler.transform(X)
        
        # Get predictions from each model
        rf_pred_proba = self.random_forest.predict_proba(X_scaled)[:, 1]
        gb_pred_proba = self.gradient_boosting.predict_proba(X_scaled)[:, 1]
        
        # Ensemble prediction
        ensemble_proba = (
            self.ensemble_weights['rf'] * rf_pred_proba +
            self.ensemble_weights['gb'] * gb_pred_proba
        )
        
        return {
            'random_forest': rf_pred_proba,
            'gradient_boosting': gb_pred_proba,
            'ensemble': ensemble_proba,
            'ensemble_prediction': (ensemble_proba > 0.5).astype(int)
        }
    
    def save_models(self, filepath_base):
        """Save all trained models"""
        
        # Save sklearn models
        joblib.dump(self.random_forest, f"{filepath_base}_rf.pkl")
        joblib.dump(self.gradient_boosting, f"{filepath_base}_gb.pkl")
        joblib.dump(self.feature_scaler, f"{filepath_base}_scaler.pkl")
        
        # Convert training history to JSON-serializable format
        json_safe_history = []
        for record in self.training_history:
            json_safe_record = {}
            for key, value in record.items():
                if key == 'performance':
                    # Convert numpy arrays in performance metrics
                    json_safe_performance = {}
                    for model_name, metrics in value.items():
                        json_safe_metrics = {}
                        for metric_name, metric_value in metrics.items():
                            if isinstance(metric_value, np.ndarray):
                                json_safe_metrics[metric_name] = metric_value.tolist()
                            elif isinstance(metric_value, (np.int64, np.int32, np.float64, np.float32)):
                                json_safe_metrics[metric_name] = float(metric_value)
                            else:
                                json_safe_metrics[metric_name] = metric_value
                        json_safe_performance[model_name] = json_safe_metrics
                    json_safe_record[key] = json_safe_performance
                else:
                    json_safe_record[key] = value
            json_safe_history.append(json_safe_record)
        
        # Save ensemble metadata
        metadata = {
            'ensemble_weights': self.ensemble_weights,
            'prediction_horizon': self.prediction_horizon,
            'training_history': json_safe_history
        }
        
        with open(f"{filepath_base}_metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Models saved to {filepath_base}_*")
    
    def load_models(self, filepath_base):
        """Load all trained models"""
        
        # Load sklearn models
        self.random_forest = joblib.load(f"{filepath_base}_rf.pkl")
        self.gradient_boosting = joblib.load(f"{filepath_base}_gb.pkl")
        self.feature_scaler = joblib.load(f"{filepath_base}_scaler.pkl")
        
        # Load metadata
        with open(f"{filepath_base}_metadata.json", 'r') as f:
            metadata = json.load(f)
            
        self.ensemble_weights = metadata['ensemble_weights']
        self.prediction_horizon = metadata['prediction_horizon']
        self.training_history = metadata['training_history']
        
        print(f"Models loaded from {filepath_base}_*")
    
    def retrain_daily(self, symbol, retrain_window_days=365):
        """
        Daily retraining capability as required by Task 12.3
        
        Args:
            symbol (str): Trading symbol
            retrain_window_days (int): Days of data to use for retraining
        """
        print(f"Starting daily retraining for {symbol}...")
        
        try:
            # Get recent data for retraining
            end_date = datetime.now()
            start_date = end_date - timedelta(days=retrain_window_days)
            
            X, y, _ = self.prepare_features_for_ml(
                symbol, 
                start_date.strftime('%Y-%m-%d'),
                end_date.strftime('%Y-%m-%d')
            )
            
            # Quick retrain with reduced optimization
            results = self.train_ensemble(X, y, hyperparams=None, test_size=0.1)
            
            # Check if performance meets minimum requirement (65% accuracy)
            ensemble_accuracy = results['ensemble']['accuracy']
            
            if ensemble_accuracy >= 0.65:
                print(f"✅ Retraining successful! Ensemble accuracy: {ensemble_accuracy:.4f}")
                
                # Save updated models
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                self.save_models(f"models/basic_ensemble_retrained_{timestamp}")
                
                return True
            else:
                print(f"⚠️ Retraining accuracy below threshold: {ensemble_accuracy:.4f} < 0.65")
                return False
                
        except Exception as e:
            print(f"❌ Daily retraining failed: {e}")
            return False


def main():
    """Example usage of the Basic ML Ensemble system"""
    
    print("=== Basic ML Ensemble System Demo ===")
    
    # Initialize ensemble
    ensemble = BasicMLEnsemble(prediction_horizon=1)
    
    # Example: Train on SPY data
    symbol = "SPY"
    
    try:
        # Prepare data
        X, y, _ = ensemble.prepare_features_for_ml(symbol)
        
        # Train ensemble
        results = ensemble.train_ensemble(X, y)
        
        # Check if minimum accuracy requirement is met
        ensemble_accuracy = results['ensemble']['accuracy']
        
        if ensemble_accuracy >= 0.65:
            print(f"✅ SUCCESS: Ensemble achieves required 65% accuracy: {ensemble_accuracy:.4f}")
        else:
            print(f"⚠️ WARNING: Ensemble below 65% accuracy: {ensemble_accuracy:.4f}")
        
        # Save models
        ensemble.save_models("models/basic_ensemble_latest")
        
        # Demonstrate prediction
        recent_X = X.tail(10)  # Last 10 samples
        predictions = ensemble.predict(recent_X)
        
        print("\n=== Recent Predictions ===")
        for i, pred in enumerate(predictions['ensemble_prediction']):
            confidence = predictions['ensemble'][i]
            direction = "UP" if pred == 1 else "DOWN"
            print(f"Day {i+1}: {direction} (confidence: {confidence:.3f})")
            
    except Exception as e:
        print(f"Error in demo: {e}")
        

if __name__ == "__main__":
    main() 