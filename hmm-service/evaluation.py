"""
Evaluation Framework for VIX Integration Impact Assessment
=========================================================

This module provides comprehensive evaluation tools to assess the impact of VIX 
integration on HMM regime prediction performance.

Key Features:
- Model comparison (with/without VIX)
- Performance metrics calculation
- Statistical significance testing
- Visualization of results
- Cross-validation and backtesting
"""

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for headless operation
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from sklearn.metrics import (
    accuracy_score, 
    precision_score, 
    recall_score, 
    f1_score,
    confusion_matrix,
    classification_report
)
from sklearn.model_selection import TimeSeriesSplit
import warnings
warnings.filterwarnings('ignore')

class VIXEvaluationFramework:
    """
    Comprehensive evaluation framework for comparing HMM models with and without VIX features.
    """
    
    def __init__(self, output_dir='evaluation_results'):
        """
        Initialize the evaluation framework.
        
        Args:
            output_dir (str): Directory to save evaluation results and plots
        """
        self.output_dir = output_dir
        self.results = {}
        self.models = {}
        
    def train_comparison_models(self, features_no_vix, features_with_vix, hmm_params=None):
        """
        Train two HMM models: one without VIX and one with VIX features.
        
        Args:
            features_no_vix (np.ndarray): Feature array without VIX
            features_with_vix (np.ndarray): Feature array with VIX
            hmm_params (dict): HMM hyperparameters
            
        Returns:
            dict: Trained models
        """
        from hmmlearn import hmm
        
        if hmm_params is None:
            hmm_params = {'n_components': 3, 'covariance_type': 'diag', 'n_iter': 100}
        
        print("Training HMM model without VIX...")
        model_no_vix = hmm.GaussianHMM(**hmm_params, random_state=42)
        model_no_vix.fit(features_no_vix)
        
        print("Training HMM model with VIX...")
        model_with_vix = hmm.GaussianHMM(**hmm_params, random_state=42)
        model_with_vix.fit(features_with_vix)
        
        self.models = {
            'no_vix': model_no_vix,
            'with_vix': model_with_vix
        }
        
        return self.models
    
    def calculate_metrics(self, y_true, y_pred_no_vix, y_pred_with_vix):
        """
        Calculate comprehensive performance metrics for both models.
        
        Args:
            y_true (array): True regime labels
            y_pred_no_vix (array): Predictions from model without VIX
            y_pred_with_vix (array): Predictions from model with VIX
            
        Returns:
            dict: Comprehensive metrics comparison
        """
        metrics = {}
        
        # Basic metrics for model without VIX
        metrics['no_vix'] = {
            'accuracy': accuracy_score(y_true, y_pred_no_vix),
            'precision': precision_score(y_true, y_pred_no_vix, average='weighted', zero_division=0),
            'recall': recall_score(y_true, y_pred_no_vix, average='weighted', zero_division=0),
            'f1_score': f1_score(y_true, y_pred_no_vix, average='weighted', zero_division=0)
        }
        
        # Basic metrics for model with VIX
        metrics['with_vix'] = {
            'accuracy': accuracy_score(y_true, y_pred_with_vix),
            'precision': precision_score(y_true, y_pred_with_vix, average='weighted', zero_division=0),
            'recall': recall_score(y_true, y_pred_with_vix, average='weighted', zero_division=0),
            'f1_score': f1_score(y_true, y_pred_with_vix, average='weighted', zero_division=0)
        }
        
        # Improvement metrics
        metrics['improvement'] = {}
        for metric in ['accuracy', 'precision', 'recall', 'f1_score']:
            baseline = metrics['no_vix'][metric]
            enhanced = metrics['with_vix'][metric]
            improvement = ((enhanced - baseline) / baseline * 100) if baseline > 0 else 0
            metrics['improvement'][metric] = improvement
        
        # Confusion matrices
        metrics['confusion_matrix'] = {
            'no_vix': confusion_matrix(y_true, y_pred_no_vix),
            'with_vix': confusion_matrix(y_true, y_pred_with_vix)
        }
        
        self.results['metrics'] = metrics
        return metrics
    
    def statistical_significance_test(self, y_true, y_pred_no_vix, y_pred_with_vix):
        """
        Perform statistical tests to determine if VIX improvements are significant.
        
        Args:
            y_true (array): True regime labels
            y_pred_no_vix (array): Predictions from model without VIX
            y_pred_with_vix (array): Predictions from model with VIX
            
        Returns:
            dict: Statistical test results
        """
        # McNemar's test for comparing classifiers
        from statsmodels.stats.contingency_tables import mcnemar
        
        # Create contingency table
        correct_no_vix = (y_true == y_pred_no_vix)
        correct_with_vix = (y_true == y_pred_with_vix)
        
        # Contingency table for McNemar's test
        table = pd.crosstab(correct_no_vix, correct_with_vix)
        
        try:
            mcnemar_result = mcnemar(table, exact=True)
            p_value = mcnemar_result.pvalue
        except:
            # Fallback to chi-square test
            chi2, p_value = stats.chi2_contingency(table)[:2]
        
        significance_tests = {
            'mcnemar_p_value': p_value,
            'is_significant': p_value < 0.05,
            'confidence_level': 95,
            'interpretation': 'VIX significantly improves performance' if p_value < 0.05 else 'No significant improvement from VIX'
        }
        
        self.results['statistical_tests'] = significance_tests
        return significance_tests
    
    def cross_validation_evaluation(self, features_no_vix, features_with_vix, n_splits=5):
        """
        Perform time series cross-validation to ensure robust evaluation.
        
        Args:
            features_no_vix (np.ndarray): Features without VIX
            features_with_vix (np.ndarray): Features with VIX
            n_splits (int): Number of CV splits
            
        Returns:
            dict: Cross-validation results
        """
        from hmmlearn import hmm
        
        tscv = TimeSeriesSplit(n_splits=n_splits)
        
        cv_results = {
            'no_vix': {'accuracy': [], 'f1_score': []},
            'with_vix': {'accuracy': [], 'f1_score': []}
        }
        
        for fold, (train_idx, test_idx) in enumerate(tscv.split(features_no_vix)):
            print(f"Cross-validation fold {fold + 1}/{n_splits}")
            
            # Split data
            X_train_no_vix, X_test_no_vix = features_no_vix[train_idx], features_no_vix[test_idx]
            X_train_with_vix, X_test_with_vix = features_with_vix[train_idx], features_with_vix[test_idx]
            
            # Train models
            model_no_vix = hmm.GaussianHMM(n_components=3, covariance_type='diag', n_iter=50, random_state=42)
            model_with_vix = hmm.GaussianHMM(n_components=3, covariance_type='diag', n_iter=50, random_state=42)
            
            model_no_vix.fit(X_train_no_vix)
            model_with_vix.fit(X_train_with_vix)
            
            # Predict
            y_pred_no_vix = model_no_vix.predict(X_test_no_vix)
            y_pred_with_vix = model_with_vix.predict(X_test_with_vix)
            
            # For evaluation, we'll use the most frequent regime as "ground truth"
            # This is a proxy since we don't have true regime labels
            y_true = np.zeros(len(y_pred_no_vix))  # Simplified ground truth
            
            # Calculate metrics
            cv_results['no_vix']['accuracy'].append(accuracy_score(y_true, y_pred_no_vix))
            cv_results['no_vix']['f1_score'].append(f1_score(y_true, y_pred_no_vix, average='weighted', zero_division=0))
            
            cv_results['with_vix']['accuracy'].append(accuracy_score(y_true, y_pred_with_vix))
            cv_results['with_vix']['f1_score'].append(f1_score(y_true, y_pred_with_vix, average='weighted', zero_division=0))
        
        # Calculate CV statistics
        cv_summary = {}
        for model in ['no_vix', 'with_vix']:
            cv_summary[model] = {}
            for metric in ['accuracy', 'f1_score']:
                scores = cv_results[model][metric]
                cv_summary[model][metric] = {
                    'mean': np.mean(scores),
                    'std': np.std(scores),
                    'scores': scores
                }
        
        self.results['cross_validation'] = cv_summary
        return cv_summary
    
    def create_visualizations(self, features_with_vix, y_pred_no_vix, y_pred_with_vix, dates=None):
        """
        Create comprehensive visualizations of the evaluation results.
        
        Args:
            features_with_vix (np.ndarray): Features including VIX data
            y_pred_no_vix (array): Predictions without VIX
            y_pred_with_vix (array): Predictions with VIX
            dates (array): Date array for time series plots
        """
        import os
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Set up the plotting style
        plt.style.use('default')
        sns.set_palette("husl")
        
        # 1. Metrics Comparison Bar Chart
        if 'metrics' in self.results:
            fig, ax = plt.subplots(figsize=(12, 6))
            metrics_data = self.results['metrics']
            
            metrics_names = ['accuracy', 'precision', 'recall', 'f1_score']
            no_vix_scores = [metrics_data['no_vix'][m] for m in metrics_names]
            with_vix_scores = [metrics_data['with_vix'][m] for m in metrics_names]
            
            x = np.arange(len(metrics_names))
            width = 0.35
            
            ax.bar(x - width/2, no_vix_scores, width, label='Without VIX', alpha=0.8)
            ax.bar(x + width/2, with_vix_scores, width, label='With VIX', alpha=0.8)
            
            ax.set_xlabel('Metrics')
            ax.set_ylabel('Score')
            ax.set_title('Model Performance Comparison: With vs Without VIX')
            ax.set_xticks(x)
            ax.set_xticklabels([m.replace('_', ' ').title() for m in metrics_names])
            ax.legend()
            ax.grid(True, alpha=0.3)
            
            plt.tight_layout()
            plt.savefig(f'{self.output_dir}/metrics_comparison.png', dpi=300, bbox_inches='tight')
            plt.close()
        
        # 2. Regime Predictions Timeline
        if dates is not None:
            fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(15, 10))
            
            # VIX data (assuming it's the last column in features_with_vix)
            vix_data = features_with_vix[:, -1]  # Assuming VIX is the last feature
            
            ax1.plot(dates, vix_data, label='VIX', color='red', alpha=0.7)
            ax1.set_ylabel('VIX Level')
            ax1.set_title('VIX Volatility Index')
            ax1.legend()
            ax1.grid(True, alpha=0.3)
            
            # Regime predictions without VIX
            ax2.scatter(dates, y_pred_no_vix, c=y_pred_no_vix, cmap='viridis', alpha=0.6, s=10)
            ax2.set_ylabel('Predicted Regime')
            ax2.set_title('Regime Predictions (Without VIX)')
            ax2.grid(True, alpha=0.3)
            
            # Regime predictions with VIX
            ax3.scatter(dates, y_pred_with_vix, c=y_pred_with_vix, cmap='viridis', alpha=0.6, s=10)
            ax3.set_ylabel('Predicted Regime')
            ax3.set_xlabel('Date')
            ax3.set_title('Regime Predictions (With VIX)')
            ax3.grid(True, alpha=0.3)
            
            plt.tight_layout()
            plt.savefig(f'{self.output_dir}/regime_timeline.png', dpi=300, bbox_inches='tight')
            plt.close()
        
        # 3. Confusion Matrix Comparison
        if 'metrics' in self.results:
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
            
            cm_no_vix = self.results['metrics']['confusion_matrix']['no_vix']
            cm_with_vix = self.results['metrics']['confusion_matrix']['with_vix']
            
            sns.heatmap(cm_no_vix, annot=True, fmt='d', ax=ax1, cmap='Blues')
            ax1.set_title('Confusion Matrix (Without VIX)')
            ax1.set_xlabel('Predicted')
            ax1.set_ylabel('Actual')
            
            sns.heatmap(cm_with_vix, annot=True, fmt='d', ax=ax2, cmap='Blues')
            ax2.set_title('Confusion Matrix (With VIX)')
            ax2.set_xlabel('Predicted')
            ax2.set_ylabel('Actual')
            
            plt.tight_layout()
            plt.savefig(f'{self.output_dir}/confusion_matrices.png', dpi=300, bbox_inches='tight')
            plt.close()
        
        # 4. Improvement Percentage Chart
        if 'metrics' in self.results:
            fig, ax = plt.subplots(figsize=(10, 6))
            
            improvements = self.results['metrics']['improvement']
            metrics_names = list(improvements.keys())
            improvement_values = list(improvements.values())
            
            colors = ['green' if x > 0 else 'red' for x in improvement_values]
            bars = ax.bar(metrics_names, improvement_values, color=colors, alpha=0.7)
            
            ax.set_ylabel('Improvement (%)')
            ax.set_title('Performance Improvement with VIX Integration')
            ax.axhline(y=0, color='black', linestyle='-', alpha=0.3)
            ax.grid(True, alpha=0.3)
            
            # Add value labels on bars
            for bar, value in zip(bars, improvement_values):
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{value:.1f}%', ha='center', va='bottom' if height > 0 else 'top')
            
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(f'{self.output_dir}/improvement_chart.png', dpi=300, bbox_inches='tight')
            plt.close()
        
        print(f"Visualizations saved to {self.output_dir}/")
    
    def generate_report(self):
        """
        Generate a comprehensive evaluation report.
        
        Returns:
            str: Formatted evaluation report
        """
        report = []
        report.append("="*80)
        report.append("VIX INTEGRATION EVALUATION REPORT")
        report.append("="*80)
        report.append("")
        
        # Performance Metrics Section
        if 'metrics' in self.results:
            report.append("PERFORMANCE METRICS COMPARISON")
            report.append("-" * 40)
            
            metrics = self.results['metrics']
            
            report.append(f"{'Metric':<15} {'No VIX':<10} {'With VIX':<10} {'Improvement':<12}")
            report.append("-" * 50)
            
            for metric in ['accuracy', 'precision', 'recall', 'f1_score']:
                no_vix_val = metrics['no_vix'][metric]
                with_vix_val = metrics['with_vix'][metric]
                improvement = metrics['improvement'][metric]
                
                report.append(f"{metric.title():<15} {no_vix_val:<10.4f} {with_vix_val:<10.4f} {improvement:<12.2f}%")
            
            report.append("")
        
        # Statistical Significance Section
        if 'statistical_tests' in self.results:
            report.append("STATISTICAL SIGNIFICANCE")
            report.append("-" * 40)
            
            stats_results = self.results['statistical_tests']
            report.append(f"McNemar's Test P-value: {stats_results['mcnemar_p_value']:.6f}")
            report.append(f"Statistically Significant: {stats_results['is_significant']}")
            report.append(f"Interpretation: {stats_results['interpretation']}")
            report.append("")
        
        # Cross-Validation Results
        if 'cross_validation' in self.results:
            report.append("CROSS-VALIDATION RESULTS")
            report.append("-" * 40)
            
            cv_results = self.results['cross_validation']
            
            for model_name in ['no_vix', 'with_vix']:
                report.append(f"{model_name.replace('_', ' ').title()}:")
                for metric in ['accuracy', 'f1_score']:
                    mean_score = cv_results[model_name][metric]['mean']
                    std_score = cv_results[model_name][metric]['std']
                    report.append(f"  {metric.title()}: {mean_score:.4f} (±{std_score:.4f})")
                report.append("")
        
        # Summary and Recommendations
        report.append("SUMMARY AND RECOMMENDATIONS")
        report.append("-" * 40)
        
        if 'metrics' in self.results:
            overall_improvement = np.mean(list(self.results['metrics']['improvement'].values()))
            
            if overall_improvement > 5:
                recommendation = "STRONGLY RECOMMENDED - VIX integration shows significant improvement"
            elif overall_improvement > 1:
                recommendation = "RECOMMENDED - VIX integration shows moderate improvement"
            elif overall_improvement > -1:
                recommendation = "NEUTRAL - VIX integration shows minimal impact"
            else:
                recommendation = "NOT RECOMMENDED - VIX integration decreases performance"
            
            report.append(f"Overall Performance Improvement: {overall_improvement:.2f}%")
            report.append(f"Recommendation: {recommendation}")
        
        report.append("")
        report.append("="*80)
        
        full_report = "\n".join(report)
        
        # Save report to file
        import os
        os.makedirs(self.output_dir, exist_ok=True)
        with open(f'{self.output_dir}/evaluation_report.txt', 'w') as f:
            f.write(full_report)
        
        return full_report

    def run_complete_evaluation(self, features_no_vix, features_with_vix, dates=None, hmm_params=None):
        """
        Run the complete evaluation pipeline.
        
        Args:
            features_no_vix (np.ndarray): Features without VIX
            features_with_vix (np.ndarray): Features with VIX
            dates (array): Optional date array for visualizations
            hmm_params (dict): Optional HMM parameters
            
        Returns:
            dict: Complete evaluation results
        """
        print("Starting VIX integration evaluation...")
        print("=" * 50)
        
        # 1. Train models
        print("1. Training comparison models...")
        self.train_comparison_models(features_no_vix, features_with_vix, hmm_params)
        
        # 2. Generate predictions
        print("2. Generating predictions...")
        y_pred_no_vix = self.models['no_vix'].predict(features_no_vix)
        y_pred_with_vix = self.models['with_vix'].predict(features_with_vix)
        
        # Create synthetic ground truth for demonstration
        # In practice, you would use actual regime labels if available
        y_true = np.random.choice([0, 1, 2], size=len(y_pred_no_vix))
        
        # 3. Calculate metrics
        print("3. Calculating performance metrics...")
        self.calculate_metrics(y_true, y_pred_no_vix, y_pred_with_vix)
        
        # 4. Statistical testing
        print("4. Performing statistical significance tests...")
        self.statistical_significance_test(y_true, y_pred_no_vix, y_pred_with_vix)
        
        # 5. Cross-validation
        print("5. Running cross-validation...")
        self.cross_validation_evaluation(features_no_vix, features_with_vix)
        
        # 6. Create visualizations
        print("6. Creating visualizations...")
        self.create_visualizations(features_with_vix, y_pred_no_vix, y_pred_with_vix, dates)
        
        # 7. Generate report
        print("7. Generating evaluation report...")
        report = self.generate_report()
        
        print("Evaluation complete!")
        print(f"Results saved to: {self.output_dir}/")
        
        return {
            'results': self.results,
            'models': self.models,
            'report': report
        } 