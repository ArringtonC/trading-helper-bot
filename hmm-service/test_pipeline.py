"""
Test Script for Enhanced Data Ingestion Pipeline

This script tests the data ingestion pipeline components including:
- Core pipeline functionality
- Data quality validation
- Performance benchmarks (1000+ data points/second, <50ms latency)
- Data source connectors
- Configuration management
- Error handling and recovery
"""

import asyncio
import logging
import time
import statistics
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
import json
import sys
import os

# Add current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_pipeline import (
    DataIngestionPipeline, MarketDataPoint, DataQualityValidator,
    KafkaStreamer, PostgreSQLStorage, YFinanceConnector
)
from pipeline_config import ConfigurationManager
from data_connectors import DataConnectorManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PipelineTestSuite:
    """Comprehensive test suite for the data ingestion pipeline"""
    
    def __init__(self):
        self.test_results = {}
        self.performance_metrics = {}
        
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all pipeline tests"""
        logger.info("Starting comprehensive pipeline test suite...")
        
        # Configuration tests
        await self.test_configuration_management()
        
        # Core pipeline tests
        await self.test_data_quality_validation()
        await self.test_pipeline_core_functionality()
        
        # Performance tests
        await self.test_throughput_performance()
        await self.test_latency_performance()
        
        # Data source tests
        await self.test_yfinance_connector()
        
        # Integration tests
        await self.test_full_pipeline_integration()
        
        # Error handling tests
        await self.test_error_recovery()
        
        # Generate test report
        self.generate_test_report()
        
        return self.test_results
    
    async def test_configuration_management(self):
        """Test configuration loading and validation"""
        logger.info("Testing configuration management...")
        
        try:
            # Test configuration loading
            config_manager = ConfigurationManager()
            config = config_manager.get_config()
            
            # Validate required sections
            required_sections = ['pipeline', 'yfinance', 'kafka', 'postgresql']
            for section in required_sections:
                assert section in config, f"Missing required config section: {section}"
            
            # Test configuration updates
            config_manager.update_config('pipeline', 'batch_size', 200)
            updated_config = config_manager.get_config()
            assert updated_config['pipeline']['batch_size'] == 200
            
            # Test service management
            config_manager.enable_service('alpha_vantage', 'test_key')
            assert config_manager.get_config()['alpha_vantage']['enabled'] == True
            
            config_manager.disable_service('alpha_vantage')
            assert config_manager.get_config()['alpha_vantage']['enabled'] == False
            
            self.test_results['config_management'] = {
                'status': 'PASSED',
                'message': 'Configuration management working correctly'
            }
            
        except Exception as e:
            self.test_results['config_management'] = {
                'status': 'FAILED',
                'message': f'Configuration test failed: {e}'
            }
            logger.error(f"Configuration test failed: {e}")
    
    async def test_data_quality_validation(self):
        """Test data quality validation functionality"""
        logger.info("Testing data quality validation...")
        
        try:
            validator = DataQualityValidator()
            
            # Test valid data point
            valid_data = MarketDataPoint(
                symbol="AAPL",
                timestamp=datetime.now(timezone.utc),
                price=150.0,
                volume=1000,
                source="test"
            )
            assert validator.validate_price_data(valid_data) == True
            
            # Test invalid price
            invalid_price_data = MarketDataPoint(
                symbol="AAPL",
                timestamp=datetime.now(timezone.utc),
                price=-10.0,  # Invalid negative price
                volume=1000,
                source="test"
            )
            assert validator.validate_price_data(invalid_price_data) == False
            
            # Test invalid volume
            invalid_volume_data = MarketDataPoint(
                symbol="AAPL",
                timestamp=datetime.now(timezone.utc),
                price=150.0,
                volume=-100,  # Invalid negative volume
                source="test"
            )
            assert validator.validate_price_data(invalid_volume_data) == False
            
            # Test anomaly detection (after building some history)
            base_price = 100.0
            for i in range(15):
                data_point = MarketDataPoint(
                    symbol="TEST",
                    timestamp=datetime.now(timezone.utc),
                    price=base_price + (i * 0.1),  # Gradual price increase
                    volume=1000,
                    source="test"
                )
                validator.validate_price_data(data_point)
            
            # Now test anomaly detection with price spike
            anomaly_data = MarketDataPoint(
                symbol="TEST",
                timestamp=datetime.now(timezone.utc),
                price=base_price * 2,  # 100% price spike
                volume=1000,
                source="test"
            )
            # Should still validate but log warning
            assert validator.validate_price_data(anomaly_data) == True
            
            self.test_results['data_quality'] = {
                'status': 'PASSED',
                'message': 'Data quality validation working correctly'
            }
            
        except Exception as e:
            self.test_results['data_quality'] = {
                'status': 'FAILED',
                'message': f'Data quality test failed: {e}'
            }
            logger.error(f"Data quality test failed: {e}")
    
    async def test_pipeline_core_functionality(self):
        """Test core pipeline functionality"""
        logger.info("Testing core pipeline functionality...")
        
        try:
            # Create pipeline with test configuration
            test_config = {
                'batch_size': 10,
                'batch_timeout': 0.5,
                'kafka': {'enabled': False},
                'postgresql': {'enabled': False}
            }
            
            pipeline = DataIngestionPipeline(test_config)
            await pipeline.start()
            
            # Test data ingestion
            test_data_points = []
            for i in range(5):
                data_point = MarketDataPoint(
                    symbol=f"TEST{i}",
                    timestamp=datetime.now(timezone.utc),
                    price=100.0 + i,
                    volume=1000 + i,
                    source="test"
                )
                test_data_points.append(data_point)
                result = await pipeline.ingest_data_point(data_point)
                assert result == True, f"Failed to ingest data point {i}"
            
            # Wait for batch processing
            await asyncio.sleep(1.0)
            
            # Check metrics
            metrics = pipeline.get_metrics()
            assert metrics['total_processed'] == 5
            assert metrics['valid_points'] == 5
            assert metrics['rejected_points'] == 0
            
            pipeline.stop()
            
            self.test_results['core_functionality'] = {
                'status': 'PASSED',
                'message': 'Core pipeline functionality working correctly',
                'metrics': metrics
            }
            
        except Exception as e:
            self.test_results['core_functionality'] = {
                'status': 'FAILED',
                'message': f'Core functionality test failed: {e}'
            }
            logger.error(f"Core functionality test failed: {e}")
    
    async def test_throughput_performance(self):
        """Test pipeline throughput (target: 1000+ data points/second)"""
        logger.info("Testing throughput performance (target: 1000+ data points/second)...")
        
        try:
            test_config = {
                'batch_size': 100,
                'batch_timeout': 0.1,
                'kafka': {'enabled': False},
                'postgresql': {'enabled': False}
            }
            
            pipeline = DataIngestionPipeline(test_config)
            await pipeline.start()
            
            # Generate test data
            num_data_points = 2000  # Test with 2000 data points
            start_time = time.time()
            
            tasks = []
            for i in range(num_data_points):
                data_point = MarketDataPoint(
                    symbol=f"PERF{i % 10}",  # Use 10 different symbols
                    timestamp=datetime.now(timezone.utc),
                    price=100.0 + (i % 50),
                    volume=1000,
                    source="performance_test"
                )
                tasks.append(pipeline.ingest_data_point(data_point))
            
            # Execute all ingestion tasks
            results = await asyncio.gather(*tasks)
            end_time = time.time()
            
            # Calculate throughput
            duration = end_time - start_time
            throughput = num_data_points / duration
            
            # Wait for batch processing to complete
            await asyncio.sleep(1.0)
            
            # Get final metrics
            metrics = pipeline.get_metrics()
            pipeline.stop()
            
            # Validate performance
            throughput_target = 1000  # 1000 data points per second
            throughput_passed = throughput >= throughput_target
            
            self.performance_metrics['throughput'] = {
                'data_points': num_data_points,
                'duration_seconds': duration,
                'throughput_per_second': throughput,
                'target_throughput': throughput_target,
                'passed': throughput_passed
            }
            
            self.test_results['throughput_performance'] = {
                'status': 'PASSED' if throughput_passed else 'FAILED',
                'message': f'Throughput: {throughput:.1f} data points/second (target: {throughput_target})',
                'metrics': self.performance_metrics['throughput']
            }
            
        except Exception as e:
            self.test_results['throughput_performance'] = {
                'status': 'FAILED',
                'message': f'Throughput test failed: {e}'
            }
            logger.error(f"Throughput test failed: {e}")
    
    async def test_latency_performance(self):
        """Test pipeline latency (target: <50ms average)"""
        logger.info("Testing latency performance (target: <50ms average)...")
        
        try:
            test_config = {
                'batch_size': 1,  # Process individually for latency test
                'batch_timeout': 0.01,
                'kafka': {'enabled': False},
                'postgresql': {'enabled': False}
            }
            
            pipeline = DataIngestionPipeline(test_config)
            await pipeline.start()
            
            # Measure latency for individual data points
            latencies = []
            num_tests = 100
            
            for i in range(num_tests):
                data_point = MarketDataPoint(
                    symbol=f"LAT{i}",
                    timestamp=datetime.now(timezone.utc),
                    price=100.0 + i,
                    volume=1000,
                    source="latency_test"
                )
                
                start_time = time.time()
                await pipeline.ingest_data_point(data_point)
                end_time = time.time()
                
                latency_ms = (end_time - start_time) * 1000
                latencies.append(latency_ms)
                
                # Small delay between tests
                await asyncio.sleep(0.01)
            
            pipeline.stop()
            
            # Calculate latency statistics
            avg_latency = statistics.mean(latencies)
            max_latency = max(latencies)
            min_latency = min(latencies)
            p95_latency = statistics.quantiles(latencies, n=20)[18]  # 95th percentile
            
            # Validate performance
            latency_target = 50.0  # 50ms target
            latency_passed = avg_latency < latency_target
            
            self.performance_metrics['latency'] = {
                'num_tests': num_tests,
                'avg_latency_ms': avg_latency,
                'max_latency_ms': max_latency,
                'min_latency_ms': min_latency,
                'p95_latency_ms': p95_latency,
                'target_latency_ms': latency_target,
                'passed': latency_passed
            }
            
            self.test_results['latency_performance'] = {
                'status': 'PASSED' if latency_passed else 'FAILED',
                'message': f'Average latency: {avg_latency:.2f}ms (target: <{latency_target}ms)',
                'metrics': self.performance_metrics['latency']
            }
            
        except Exception as e:
            self.test_results['latency_performance'] = {
                'status': 'FAILED',
                'message': f'Latency test failed: {e}'
            }
            logger.error(f"Latency test failed: {e}")
    
    async def test_yfinance_connector(self):
        """Test Yahoo Finance data connector"""
        logger.info("Testing Yahoo Finance connector...")
        
        try:
            test_config = {
                'batch_size': 10,
                'batch_timeout': 1.0,
                'kafka': {'enabled': False},
                'postgresql': {'enabled': False}
            }
            
            pipeline = DataIngestionPipeline(test_config)
            await pipeline.start()
            
            # Test yfinance connector
            symbols = ["AAPL", "GOOGL"]
            connector = YFinanceConnector(symbols, pipeline)
            
            # Start streaming for a short period
            streaming_task = asyncio.create_task(
                connector.start_streaming(interval=1.0)
            )
            
            # Let it run for 5 seconds
            await asyncio.sleep(5.0)
            
            # Stop streaming
            connector.stop()
            streaming_task.cancel()
            
            # Check if data was ingested
            metrics = pipeline.get_metrics()
            pipeline.stop()
            
            # Should have received some data
            data_received = metrics['total_processed'] > 0
            
            self.test_results['yfinance_connector'] = {
                'status': 'PASSED' if data_received else 'WARNING',
                'message': f'YFinance connector processed {metrics["total_processed"]} data points',
                'metrics': metrics
            }
            
        except Exception as e:
            self.test_results['yfinance_connector'] = {
                'status': 'FAILED',
                'message': f'YFinance connector test failed: {e}'
            }
            logger.error(f"YFinance connector test failed: {e}")
    
    async def test_full_pipeline_integration(self):
        """Test full pipeline integration with multiple components"""
        logger.info("Testing full pipeline integration...")
        
        try:
            # Create comprehensive test configuration
            config_manager = ConfigurationManager()
            config = config_manager.get_config()
            
            # Ensure only yfinance is enabled for testing
            config['yfinance']['enabled'] = True
            config['yfinance']['symbols'] = ['AAPL', 'MSFT']
            config['yfinance']['collection_interval'] = 2
            
            # Disable other services for testing
            for service in ['alpha_vantage', 'finnhub', 'quandl', 'fred', 'twitter']:
                config[service]['enabled'] = False
            
            # Create pipeline
            pipeline = DataIngestionPipeline(config)
            await pipeline.start()
            
            # Create connector manager
            connector_manager = DataConnectorManager(pipeline, config)
            
            # Start data collection for a short period
            collection_task = asyncio.create_task(
                connector_manager.start_data_collection()
            )
            
            # Let it run for 10 seconds
            await asyncio.sleep(10.0)
            
            # Stop collection
            connector_manager.stop()
            collection_task.cancel()
            
            # Get final metrics
            metrics = pipeline.get_metrics()
            pipeline.stop()
            
            # Validate integration
            integration_success = (
                metrics['total_processed'] > 0 and
                metrics['rejected_points'] == 0 and
                metrics['throughput_per_sec'] > 0
            )
            
            self.test_results['full_integration'] = {
                'status': 'PASSED' if integration_success else 'WARNING',
                'message': f'Full integration processed {metrics["total_processed"]} data points',
                'metrics': metrics
            }
            
        except Exception as e:
            self.test_results['full_integration'] = {
                'status': 'FAILED',
                'message': f'Full integration test failed: {e}'
            }
            logger.error(f"Full integration test failed: {e}")
    
    async def test_error_recovery(self):
        """Test error handling and recovery mechanisms"""
        logger.info("Testing error handling and recovery...")
        
        try:
            test_config = {
                'batch_size': 5,
                'batch_timeout': 0.5,
                'kafka': {'enabled': False},
                'postgresql': {'enabled': False}
            }
            
            pipeline = DataIngestionPipeline(test_config)
            await pipeline.start()
            
            # Test with mixed valid and invalid data
            test_scenarios = [
                # Valid data
                MarketDataPoint("VALID1", datetime.now(timezone.utc), 100.0, 1000, source="test"),
                # Invalid price
                MarketDataPoint("INVALID1", datetime.now(timezone.utc), -50.0, 1000, source="test"),
                # Invalid volume
                MarketDataPoint("INVALID2", datetime.now(timezone.utc), 100.0, -500, source="test"),
                # Valid data
                MarketDataPoint("VALID2", datetime.now(timezone.utc), 105.0, 1500, source="test"),
            ]
            
            # Ingest all test data
            for data_point in test_scenarios:
                await pipeline.ingest_data_point(data_point)
            
            # Wait for processing
            await asyncio.sleep(1.0)
            
            # Check metrics
            metrics = pipeline.get_metrics()
            pipeline.stop()
            
            # Should have 2 valid and 2 rejected
            error_handling_success = (
                metrics['valid_points'] == 2 and
                metrics['rejected_points'] == 2
            )
            
            self.test_results['error_recovery'] = {
                'status': 'PASSED' if error_handling_success else 'FAILED',
                'message': f'Error handling: {metrics["valid_points"]} valid, {metrics["rejected_points"]} rejected',
                'metrics': metrics
            }
            
        except Exception as e:
            self.test_results['error_recovery'] = {
                'status': 'FAILED',
                'message': f'Error recovery test failed: {e}'
            }
            logger.error(f"Error recovery test failed: {e}")
    
    def generate_test_report(self):
        """Generate comprehensive test report"""
        logger.info("Generating test report...")
        
        # Count test results
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result['status'] == 'PASSED')
        failed_tests = sum(1 for result in self.test_results.values() if result['status'] == 'FAILED')
        warning_tests = sum(1 for result in self.test_results.values() if result['status'] == 'WARNING')
        
        # Create summary
        summary = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'total_tests': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'warnings': warning_tests,
            'success_rate': (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        }
        
        # Create full report
        report = {
            'summary': summary,
            'test_results': self.test_results,
            'performance_metrics': self.performance_metrics
        }
        
        # Save report to file
        report_file = f"pipeline_test_report_{int(time.time())}.json"
        try:
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2, default=str)
            logger.info(f"Test report saved to: {report_file}")
        except Exception as e:
            logger.error(f"Failed to save test report: {e}")
        
        # Print summary to console
        print("\n" + "="*60)
        print("DATA INGESTION PIPELINE TEST REPORT")
        print("="*60)
        print(f"Test Summary:")
        print(f"  Total Tests: {total_tests}")
        print(f"  Passed: {passed_tests}")
        print(f"  Failed: {failed_tests}")
        print(f"  Warnings: {warning_tests}")
        print(f"  Success Rate: {summary['success_rate']:.1f}%")
        print()
        
        # Print performance metrics if available
        if 'throughput' in self.performance_metrics:
            throughput = self.performance_metrics['throughput']
            print(f"Performance Metrics:")
            print(f"  Throughput: {throughput['throughput_per_second']:.1f} data points/sec (target: {throughput['target_throughput']})")
            
            if 'latency' in self.performance_metrics:
                latency = self.performance_metrics['latency']
                print(f"  Average Latency: {latency['avg_latency_ms']:.2f}ms (target: <{latency['target_latency_ms']}ms)")
                print(f"  95th Percentile Latency: {latency['p95_latency_ms']:.2f}ms")
            print()
        
        # Print individual test results
        print("Individual Test Results:")
        for test_name, result in self.test_results.items():
            status_symbol = "✅" if result['status'] == 'PASSED' else "❌" if result['status'] == 'FAILED' else "⚠️"
            print(f"  {status_symbol} {test_name}: {result['message']}")
        
        print("="*60)
        
        return report

async def main():
    """Main test execution function"""
    print("Enhanced Data Ingestion Pipeline Test Suite")
    print("Testing pipeline performance, functionality, and integration")
    print("-" * 60)
    
    # Run test suite
    test_suite = PipelineTestSuite()
    results = await test_suite.run_all_tests()
    
    # Return exit code based on results
    failed_tests = sum(1 for result in results.values() if result['status'] == 'FAILED')
    return 0 if failed_tests == 0 else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code) 