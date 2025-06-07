"""
Configuration Management for Data Ingestion Pipeline

This module handles configuration loading, validation, and management
for the enhanced data ingestion pipeline system.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from pathlib import Path
import yaml

try:
    from pydantic import BaseModel, ValidationError, Field
    PYDANTIC_AVAILABLE = True
except ImportError:
    PYDANTIC_AVAILABLE = False
    BaseModel = object
    Field = lambda **kwargs: None

logger = logging.getLogger(__name__)

@dataclass
class KafkaConfig:
    """Kafka configuration settings"""
    enabled: bool = False
    bootstrap_servers: str = "localhost:9092"
    compression_type: str = "gzip"
    batch_size: int = 16384
    linger_ms: int = 10
    retries: int = 3
    acks: str = "1"
    
class PostgreSQLConfig:
    """PostgreSQL configuration settings"""
    def __init__(self):
        self.enabled: bool = False
        self.host: str = "localhost"
        self.port: int = 5432
        self.database: str = "trading_data"
        self.user: str = "postgres"
        self.password: str = ""
        self.min_connections: int = 5
        self.max_connections: int = 20

@dataclass
class DataSourceConfig:
    """Generic data source configuration"""
    enabled: bool = False
    api_key: str = ""
    collection_interval: int = 300  # seconds
    symbols: List[str] = None
    rate_limit_delay: float = 1.0
    
    def __post_init__(self):
        if self.symbols is None:
            self.symbols = ["AAPL", "GOOGL", "MSFT", "SPY"]

@dataclass
class PipelineConfig:
    """Main pipeline configuration"""
    batch_size: int = 100
    batch_timeout: float = 1.0
    max_queue_size: int = 10000
    log_level: str = "INFO"
    metrics_enabled: bool = True
    data_retention_days: int = 30

class ConfigurationManager:
    """Manages configuration loading and validation"""
    
    def __init__(self, config_file: Optional[str] = None):
        self.config_file = config_file or "pipeline_config.yaml"
        self.config = {}
        self._load_configuration()
    
    def _load_configuration(self):
        """Load configuration from file and environment variables"""
        # Start with default configuration
        self.config = self._get_default_config()
        
        # Load from file if exists
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    if self.config_file.endswith('.yaml') or self.config_file.endswith('.yml'):
                        file_config = yaml.safe_load(f)
                    else:
                        file_config = json.load(f)
                
                self._merge_config(self.config, file_config)
                logger.info(f"Loaded configuration from {self.config_file}")
                
            except Exception as e:
                logger.error(f"Error loading configuration file: {e}")
        
        # Override with environment variables
        self._load_env_variables()
        
        # Validate configuration
        self._validate_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            'pipeline': {
                'batch_size': 100,
                'batch_timeout': 1.0,
                'max_queue_size': 10000,
                'log_level': 'INFO',
                'metrics_enabled': True,
                'data_retention_days': 30
            },
            'kafka': {
                'enabled': False,
                'bootstrap_servers': 'localhost:9092',
                'compression_type': 'gzip',
                'batch_size': 16384,
                'linger_ms': 10,
                'retries': 3,
                'acks': '1'
            },
            'postgresql': {
                'enabled': False,
                'host': 'localhost',
                'port': 5432,
                'database': 'trading_data',
                'user': 'postgres',
                'password': '',
                'min_connections': 5,
                'max_connections': 20
            },
            'yfinance': {
                'enabled': True,
                'collection_interval': 60,
                'symbols': ['AAPL', 'GOOGL', 'MSFT', 'SPY', 'QQQ'],
                'rate_limit_delay': 0.5
            },
            'alpha_vantage': {
                'enabled': False,
                'api_key': '',
                'collection_interval': 300,
                'symbols': ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
                'rate_limit_delay': 12
            },
            'finnhub': {
                'enabled': False,
                'api_key': '',
                'symbols': ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
                'websocket_enabled': True
            },
            'quandl': {
                'enabled': False,
                'api_key': '',
                'datasets': ['WIKI/AAPL', 'WIKI/GOOGL'],
                'collection_interval': 3600
            },
            'fred': {
                'enabled': False,
                'api_key': '',
                'series': ['GDP', 'UNRATE', 'FEDFUNDS', 'CPIAUCSL'],
                'collection_interval': 3600
            },
            'twitter': {
                'enabled': False,
                'bearer_token': '',
                'symbols': ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
                'collection_interval': 300
            }
        }
    
    def _merge_config(self, base: Dict[str, Any], override: Dict[str, Any]):
        """Recursively merge configuration dictionaries"""
        for key, value in override.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._merge_config(base[key], value)
            else:
                base[key] = value
    
    def _load_env_variables(self):
        """Load configuration from environment variables"""
        env_mappings = {
            # Pipeline settings
            'PIPELINE_BATCH_SIZE': ('pipeline', 'batch_size', int),
            'PIPELINE_BATCH_TIMEOUT': ('pipeline', 'batch_timeout', float),
            'PIPELINE_LOG_LEVEL': ('pipeline', 'log_level', str),
            
            # Kafka settings
            'KAFKA_ENABLED': ('kafka', 'enabled', lambda x: x.lower() == 'true'),
            'KAFKA_BOOTSTRAP_SERVERS': ('kafka', 'bootstrap_servers', str),
            
            # PostgreSQL settings
            'POSTGRES_ENABLED': ('postgresql', 'enabled', lambda x: x.lower() == 'true'),
            'POSTGRES_HOST': ('postgresql', 'host', str),
            'POSTGRES_PORT': ('postgresql', 'port', int),
            'POSTGRES_DATABASE': ('postgresql', 'database', str),
            'POSTGRES_USER': ('postgresql', 'user', str),
            'POSTGRES_PASSWORD': ('postgresql', 'password', str),
            
            # API Keys
            'ALPHA_VANTAGE_API_KEY': ('alpha_vantage', 'api_key', str),
            'FINNHUB_API_KEY': ('finnhub', 'api_key', str),
            'QUANDL_API_KEY': ('quandl', 'api_key', str),
            'FRED_API_KEY': ('fred', 'api_key', str),
            'TWITTER_BEARER_TOKEN': ('twitter', 'bearer_token', str),
        }
        
        for env_var, (section, key, converter) in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                try:
                    converted_value = converter(value)
                    if section not in self.config:
                        self.config[section] = {}
                    self.config[section][key] = converted_value
                except (ValueError, TypeError) as e:
                    logger.warning(f"Invalid environment variable {env_var}: {e}")
    
    def _validate_config(self):
        """Validate configuration settings"""
        # Check required API keys for enabled services
        services_requiring_keys = [
            ('alpha_vantage', 'api_key'),
            ('finnhub', 'api_key'),
            ('quandl', 'api_key'),
            ('fred', 'api_key'),
            ('twitter', 'bearer_token')
        ]
        
        for service, key_field in services_requiring_keys:
            if (self.config.get(service, {}).get('enabled', False) and
                not self.config.get(service, {}).get(key_field)):
                logger.warning(f"{service} is enabled but {key_field} is not provided")
        
        # Validate numerical ranges
        pipeline_config = self.config.get('pipeline', {})
        if pipeline_config.get('batch_size', 100) <= 0:
            logger.error("Pipeline batch_size must be positive")
            pipeline_config['batch_size'] = 100
        
        if pipeline_config.get('batch_timeout', 1.0) <= 0:
            logger.error("Pipeline batch_timeout must be positive")
            pipeline_config['batch_timeout'] = 1.0
    
    def get_config(self) -> Dict[str, Any]:
        """Get the complete configuration"""
        return self.config.copy()
    
    def get_section(self, section: str) -> Dict[str, Any]:
        """Get a specific configuration section"""
        return self.config.get(section, {}).copy()
    
    def update_config(self, section: str, key: str, value: Any):
        """Update a specific configuration value"""
        if section not in self.config:
            self.config[section] = {}
        self.config[section][key] = value
        logger.info(f"Updated {section}.{key} = {value}")
    
    def save_config(self, file_path: Optional[str] = None):
        """Save current configuration to file"""
        output_file = file_path or self.config_file
        
        try:
            with open(output_file, 'w') as f:
                if output_file.endswith('.yaml') or output_file.endswith('.yml'):
                    yaml.dump(self.config, f, default_flow_style=False, indent=2)
                else:
                    json.dump(self.config, f, indent=2)
            
            logger.info(f"Configuration saved to {output_file}")
            
        except Exception as e:
            logger.error(f"Error saving configuration: {e}")
    
    def enable_service(self, service_name: str, api_key: Optional[str] = None):
        """Enable a data source service"""
        if service_name not in self.config:
            logger.error(f"Unknown service: {service_name}")
            return
        
        self.config[service_name]['enabled'] = True
        
        if api_key:
            # Determine the correct key field
            key_field = 'bearer_token' if service_name == 'twitter' else 'api_key'
            self.config[service_name][key_field] = api_key
        
        logger.info(f"Enabled service: {service_name}")
    
    def disable_service(self, service_name: str):
        """Disable a data source service"""
        if service_name not in self.config:
            logger.error(f"Unknown service: {service_name}")
            return
        
        self.config[service_name]['enabled'] = False
        logger.info(f"Disabled service: {service_name}")
    
    def get_enabled_services(self) -> List[str]:
        """Get list of enabled data source services"""
        enabled = []
        for service_name, config in self.config.items():
            if isinstance(config, dict) and config.get('enabled', False):
                enabled.append(service_name)
        return enabled
    
    def validate_api_keys(self) -> Dict[str, bool]:
        """Validate that API keys are provided for enabled services"""
        validation_results = {}
        
        key_mappings = {
            'alpha_vantage': 'api_key',
            'finnhub': 'api_key',
            'quandl': 'api_key',
            'fred': 'api_key',
            'twitter': 'bearer_token'
        }
        
        for service, key_field in key_mappings.items():
            service_config = self.config.get(service, {})
            if service_config.get('enabled', False):
                has_key = bool(service_config.get(key_field))
                validation_results[service] = has_key
                if not has_key:
                    logger.warning(f"{service} is enabled but missing {key_field}")
        
        return validation_results

def create_sample_config_file(file_path: str = "pipeline_config.yaml"):
    """Create a sample configuration file with documentation"""
    config_manager = ConfigurationManager()
    sample_config = config_manager.get_config()
    
    # Add comments/documentation
    config_content = """# Data Ingestion Pipeline Configuration
# 
# This file configures the enhanced data ingestion pipeline for the
# ML-powered Trade Analysis System.

# Pipeline Core Settings
pipeline:
  batch_size: 100              # Number of data points to batch before storage
  batch_timeout: 1.0           # Maximum time to wait before flushing batch (seconds)
  max_queue_size: 10000        # Maximum queue size for data points
  log_level: "INFO"            # Logging level (DEBUG, INFO, WARNING, ERROR)
  metrics_enabled: true        # Enable performance metrics collection
  data_retention_days: 30      # Number of days to retain data

# Apache Kafka Configuration (for real-time streaming)
kafka:
  enabled: false               # Enable Kafka streaming
  bootstrap_servers: "localhost:9092"
  compression_type: "gzip"
  batch_size: 16384
  linger_ms: 10
  retries: 3
  acks: "1"

# PostgreSQL Configuration (for data storage)
postgresql:
  enabled: false               # Enable PostgreSQL storage
  host: "localhost"
  port: 5432
  database: "trading_data"
  user: "postgres"
  password: ""                 # Set via POSTGRES_PASSWORD env var
  min_connections: 5
  max_connections: 20

# Yahoo Finance (Free, no API key required)
yfinance:
  enabled: true                # Enable yfinance data source
  collection_interval: 60     # Collection interval in seconds
  symbols: ["AAPL", "GOOGL", "MSFT", "SPY", "QQQ"]
  rate_limit_delay: 0.5

# Alpha Vantage (Requires API key)
alpha_vantage:
  enabled: false               # Enable Alpha Vantage data source
  api_key: ""                  # Set via ALPHA_VANTAGE_API_KEY env var
  collection_interval: 300     # 5 minutes (free tier limit)
  symbols: ["AAPL", "GOOGL", "MSFT", "TSLA"]
  rate_limit_delay: 12         # 12 seconds between calls

# Finnhub (Requires API key)
finnhub:
  enabled: false               # Enable Finnhub data source
  api_key: ""                  # Set via FINNHUB_API_KEY env var
  symbols: ["AAPL", "GOOGL", "MSFT", "TSLA"]
  websocket_enabled: true      # Enable real-time websocket feed

# Quandl (Requires API key)
quandl:
  enabled: false               # Enable Quandl data source
  api_key: ""                  # Set via QUANDL_API_KEY env var
  datasets: ["WIKI/AAPL", "WIKI/GOOGL"]
  collection_interval: 3600    # 1 hour

# Federal Reserve Economic Data (Requires API key)
fred:
  enabled: false               # Enable FRED data source
  api_key: ""                  # Set via FRED_API_KEY env var
  series: ["GDP", "UNRATE", "FEDFUNDS", "CPIAUCSL"]
  collection_interval: 3600    # 1 hour

# Twitter Sentiment (Requires Bearer Token)
twitter:
  enabled: false               # Enable Twitter sentiment analysis
  bearer_token: ""             # Set via TWITTER_BEARER_TOKEN env var
  symbols: ["AAPL", "GOOGL", "MSFT", "TSLA"]
  collection_interval: 300     # 5 minutes
"""
    
    try:
        with open(file_path, 'w') as f:
            f.write(config_content)
        logger.info(f"Sample configuration created: {file_path}")
    except Exception as e:
        logger.error(f"Error creating sample config: {e}")

def create_env_template(file_path: str = ".env.pipeline"):
    """Create a template .env file for environment variables"""
    env_template = """# Data Ingestion Pipeline Environment Variables
# Copy this file to .env and fill in your API keys

# Database Configuration
POSTGRES_ENABLED=false
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=trading_data
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password

# Kafka Configuration
KAFKA_ENABLED=false
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Pipeline Settings
PIPELINE_BATCH_SIZE=100
PIPELINE_BATCH_TIMEOUT=1.0
PIPELINE_LOG_LEVEL=INFO

# API Keys (obtain from respective providers)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
FINNHUB_API_KEY=your_finnhub_api_key
QUANDL_API_KEY=your_quandl_api_key
FRED_API_KEY=your_fred_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
"""
    
    try:
        with open(file_path, 'w') as f:
            f.write(env_template)
        logger.info(f"Environment template created: {file_path}")
    except Exception as e:
        logger.error(f"Error creating env template: {e}")

if __name__ == "__main__":
    # Create sample configuration files
    create_sample_config_file()
    create_env_template()
    
    # Test configuration loading
    config_manager = ConfigurationManager()
    config = config_manager.get_config()
    
    print("Configuration loaded successfully:")
    print(f"Enabled services: {config_manager.get_enabled_services()}")
    print(f"API key validation: {config_manager.validate_api_keys()}") 