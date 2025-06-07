"""
Data Source Connectors for Enhanced Data Ingestion Pipeline

This module provides connectors for various data sources including:
- Multiple market data providers (Alpha Vantage, Finnhub, Quandl)
- Economic indicators (FRED, etc.)
- Alternative data sources (news sentiment, social media)
- Real-time websocket feeds
"""

import asyncio
import logging
import json
import time
import websockets
from typing import Dict, List, Optional, Any, AsyncGenerator
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
import aiohttp
import os
from urllib.parse import urlencode

from data_pipeline import DataIngestionPipeline, MarketDataPoint

logger = logging.getLogger(__name__)

class AlphaVantageConnector:
    """Connector for Alpha Vantage API"""
    
    def __init__(self, api_key: str, pipeline: DataIngestionPipeline):
        self.api_key = api_key
        self.pipeline = pipeline
        self.base_url = "https://www.alphavantage.co/query"
        self.rate_limit_delay = 12  # Alpha Vantage free tier: 5 calls per minute
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def fetch_intraday_data(self, symbol: str, interval: str = "1min") -> bool:
        """Fetch intraday data for a symbol"""
        if not self.session:
            return False
            
        params = {
            'function': 'TIME_SERIES_INTRADAY',
            'symbol': symbol,
            'interval': interval,
            'apikey': self.api_key,
            'outputsize': 'compact'
        }
        
        try:
            url = f"{self.base_url}?{urlencode(params)}"
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    time_series_key = f'Time Series ({interval})'
                    if time_series_key in data:
                        time_series = data[time_series_key]
                        
                        for timestamp_str, values in time_series.items():
                            timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                            timestamp = timestamp.replace(tzinfo=timezone.utc)
                            
                            data_point = MarketDataPoint(
                                symbol=symbol,
                                timestamp=timestamp,
                                price=float(values['4. close']),
                                volume=int(values['5. volume']),
                                source='alphavantage',
                                data_type='intraday',
                                metadata={
                                    'open': float(values['1. open']),
                                    'high': float(values['2. high']),
                                    'low': float(values['3. low']),
                                    'interval': interval
                                }
                            )
                            
                            await self.pipeline.ingest_data_point(data_point)
                    
                    # Rate limiting
                    await asyncio.sleep(self.rate_limit_delay)
                    return True
                else:
                    logger.error(f"Alpha Vantage API error: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error fetching Alpha Vantage data for {symbol}: {e}")
            return False
    
    async def fetch_economic_indicator(self, function: str, interval: str = "monthly") -> bool:
        """Fetch economic indicators"""
        if not self.session:
            return False
            
        params = {
            'function': function,
            'interval': interval,
            'apikey': self.api_key
        }
        
        try:
            url = f"{self.base_url}?{urlencode(params)}"
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if 'data' in data:
                        for item in data['data']:
                            timestamp = datetime.strptime(item['date'], '%Y-%m-%d')
                            timestamp = timestamp.replace(tzinfo=timezone.utc)
                            
                            data_point = MarketDataPoint(
                                symbol=function,
                                timestamp=timestamp,
                                price=float(item['value']),
                                volume=0,
                                source='alphavantage',
                                data_type='economic',
                                metadata={'interval': interval}
                            )
                            
                            await self.pipeline.ingest_data_point(data_point)
                    
                    await asyncio.sleep(self.rate_limit_delay)
                    return True
                    
        except Exception as e:
            logger.error(f"Error fetching economic data {function}: {e}")
            return False

class FinnhubConnector:
    """Connector for Finnhub API with real-time websocket support"""
    
    def __init__(self, api_key: str, pipeline: DataIngestionPipeline):
        self.api_key = api_key
        self.pipeline = pipeline
        self.websocket_url = f"wss://ws.finnhub.io?token={api_key}"
        self.rest_url = "https://finnhub.io/api/v1"
        self.session = None
        self.websocket = None
        self.subscribed_symbols = set()
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.websocket:
            await self.websocket.close()
        if self.session:
            await self.session.close()
    
    async def start_realtime_feed(self, symbols: List[str]):
        """Start real-time websocket feed for symbols"""
        try:
            self.websocket = await websockets.connect(self.websocket_url)
            
            # Subscribe to symbols
            for symbol in symbols:
                subscribe_msg = json.dumps({'type': 'subscribe', 'symbol': symbol})
                await self.websocket.send(subscribe_msg)
                self.subscribed_symbols.add(symbol)
                logger.info(f"Subscribed to Finnhub real-time feed for {symbol}")
            
            # Listen for messages
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    await self._process_websocket_message(data)
                except Exception as e:
                    logger.error(f"Error processing Finnhub websocket message: {e}")
                    
        except Exception as e:
            logger.error(f"Error with Finnhub websocket: {e}")
    
    async def _process_websocket_message(self, data: Dict[str, Any]):
        """Process incoming websocket messages"""
        if data.get('type') == 'trade':
            for trade in data.get('data', []):
                timestamp = datetime.fromtimestamp(trade['t'] / 1000, tz=timezone.utc)
                
                data_point = MarketDataPoint(
                    symbol=trade['s'],
                    timestamp=timestamp,
                    price=trade['p'],
                    volume=trade['v'],
                    source='finnhub',
                    data_type='realtime_trade',
                    metadata={
                        'conditions': trade.get('c', [])
                    }
                )
                
                await self.pipeline.ingest_data_point(data_point)
    
    async def fetch_company_news(self, symbol: str, from_date: str, to_date: str) -> bool:
        """Fetch company news for sentiment analysis"""
        if not self.session:
            return False
            
        params = {
            'symbol': symbol,
            'from': from_date,
            'to': to_date,
            'token': self.api_key
        }
        
        try:
            url = f"{self.rest_url}/company-news"
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    news_data = await response.json()
                    
                    for article in news_data:
                        timestamp = datetime.fromtimestamp(article['datetime'], tz=timezone.utc)
                        
                        # Simple sentiment scoring (would normally use NLP)
                        sentiment_score = self._simple_sentiment_analysis(
                            article.get('headline', '') + ' ' + article.get('summary', '')
                        )
                        
                        data_point = MarketDataPoint(
                            symbol=symbol,
                            timestamp=timestamp,
                            price=sentiment_score,
                            volume=0,
                            source='finnhub',
                            data_type='news_sentiment',
                            metadata={
                                'headline': article.get('headline'),
                                'summary': article.get('summary'),
                                'url': article.get('url'),
                                'sentiment_score': sentiment_score
                            }
                        )
                        
                        await self.pipeline.ingest_data_point(data_point)
                    
                    return True
                    
        except Exception as e:
            logger.error(f"Error fetching Finnhub news for {symbol}: {e}")
            return False
    
    def _simple_sentiment_analysis(self, text: str) -> float:
        """Simple sentiment analysis (placeholder for actual NLP)"""
        positive_words = ['good', 'great', 'excellent', 'positive', 'growth', 'profit', 'gain']
        negative_words = ['bad', 'poor', 'negative', 'loss', 'decline', 'drop', 'fall']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count + negative_count == 0:
            return 0.0  # Neutral
        
        return (positive_count - negative_count) / (positive_count + negative_count)

class QuandlConnector:
    """Connector for Quandl economic and financial data"""
    
    def __init__(self, api_key: str, pipeline: DataIngestionPipeline):
        self.api_key = api_key
        self.pipeline = pipeline
        self.base_url = "https://www.quandl.com/api/v3"
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def fetch_dataset(self, dataset_code: str, start_date: str = None, end_date: str = None) -> bool:
        """Fetch dataset from Quandl"""
        if not self.session:
            return False
            
        params = {
            'api_key': self.api_key,
            'format': 'json'
        }
        
        if start_date:
            params['start_date'] = start_date
        if end_date:
            params['end_date'] = end_date
            
        try:
            url = f"{self.base_url}/datasets/{dataset_code}/data.json"
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    dataset_data = data.get('dataset_data', {})
                    column_names = dataset_data.get('column_names', [])
                    data_rows = dataset_data.get('data', [])
                    
                    for row in data_rows:
                        if len(row) >= 2:  # At least date and one value
                            timestamp = datetime.strptime(row[0], '%Y-%m-%d')
                            timestamp = timestamp.replace(tzinfo=timezone.utc)
                            
                            # Use first numeric column as price
                            value = row[1] if len(row) > 1 else 0
                            
                            data_point = MarketDataPoint(
                                symbol=dataset_code,
                                timestamp=timestamp,
                                price=float(value) if value is not None else 0.0,
                                volume=0,
                                source='quandl',
                                data_type='economic',
                                metadata={
                                    'columns': column_names,
                                    'raw_data': row
                                }
                            )
                            
                            await self.pipeline.ingest_data_point(data_point)
                    
                    return True
                    
        except Exception as e:
            logger.error(f"Error fetching Quandl dataset {dataset_code}: {e}")
            return False

class FREDConnector:
    """Connector for Federal Reserve Economic Data (FRED)"""
    
    def __init__(self, api_key: str, pipeline: DataIngestionPipeline):
        self.api_key = api_key
        self.pipeline = pipeline
        self.base_url = "https://api.stlouisfed.org/fred"
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def fetch_series(self, series_id: str, start_date: str = None, end_date: str = None) -> bool:
        """Fetch economic series from FRED"""
        if not self.session:
            return False
            
        params = {
            'series_id': series_id,
            'api_key': self.api_key,
            'file_type': 'json'
        }
        
        if start_date:
            params['observation_start'] = start_date
        if end_date:
            params['observation_end'] = end_date
            
        try:
            url = f"{self.base_url}/series/observations"
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    observations = data.get('observations', [])
                    
                    for obs in observations:
                        if obs['value'] != '.':  # FRED uses '.' for missing data
                            timestamp = datetime.strptime(obs['date'], '%Y-%m-%d')
                            timestamp = timestamp.replace(tzinfo=timezone.utc)
                            
                            data_point = MarketDataPoint(
                                symbol=series_id,
                                timestamp=timestamp,
                                price=float(obs['value']),
                                volume=0,
                                source='fred',
                                data_type='economic',
                                metadata={
                                    'realtime_start': obs.get('realtime_start'),
                                    'realtime_end': obs.get('realtime_end')
                                }
                            )
                            
                            await self.pipeline.ingest_data_point(data_point)
                    
                    return True
                    
        except Exception as e:
            logger.error(f"Error fetching FRED series {series_id}: {e}")
            return False

class TwitterSentimentConnector:
    """Connector for Twitter sentiment data (placeholder - requires Twitter API v2)"""
    
    def __init__(self, bearer_token: str, pipeline: DataIngestionPipeline):
        self.bearer_token = bearer_token
        self.pipeline = pipeline
        self.base_url = "https://api.twitter.com/2"
        self.session = None
    
    async def __aenter__(self):
        headers = {"Authorization": f"Bearer {self.bearer_token}"}
        self.session = aiohttp.ClientSession(headers=headers)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def fetch_sentiment_for_symbol(self, symbol: str, count: int = 100) -> bool:
        """Fetch recent tweets about a symbol for sentiment analysis"""
        if not self.session:
            return False
            
        # Search for tweets mentioning the symbol
        query = f"${symbol} -is:retweet lang:en"
        params = {
            'query': query,
            'max_results': min(count, 100),
            'tweet.fields': 'created_at,public_metrics,context_annotations'
        }
        
        try:
            url = f"{self.base_url}/tweets/search/recent"
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    tweets = data.get('data', [])
                    
                    for tweet in tweets:
                        timestamp = datetime.fromisoformat(tweet['created_at'].replace('Z', '+00:00'))
                        
                        # Simple sentiment analysis (placeholder)
                        sentiment_score = self._analyze_tweet_sentiment(tweet['text'])
                        
                        data_point = MarketDataPoint(
                            symbol=symbol,
                            timestamp=timestamp,
                            price=sentiment_score,
                            volume=tweet.get('public_metrics', {}).get('retweet_count', 0),
                            source='twitter',
                            data_type='social_sentiment',
                            metadata={
                                'tweet_id': tweet['id'],
                                'text': tweet['text'],
                                'metrics': tweet.get('public_metrics', {}),
                                'sentiment_score': sentiment_score
                            }
                        )
                        
                        await self.pipeline.ingest_data_point(data_point)
                    
                    return True
                else:
                    logger.error(f"Twitter API error: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error fetching Twitter sentiment for {symbol}: {e}")
            return False
    
    def _analyze_tweet_sentiment(self, text: str) -> float:
        """Simple tweet sentiment analysis (placeholder)"""
        positive_words = ['bullish', 'moon', 'rocket', 'buy', 'long', 'calls', 'green']
        negative_words = ['bearish', 'crash', 'sell', 'short', 'puts', 'red', 'dump']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count + negative_count == 0:
            return 0.0
        
        return (positive_count - negative_count) / (positive_count + negative_count)

class DataConnectorManager:
    """Manages multiple data connectors and orchestrates data collection"""
    
    def __init__(self, pipeline: DataIngestionPipeline, config: Dict[str, Any]):
        self.pipeline = pipeline
        self.config = config
        self.connectors = {}
        self.running = False
        
        # Initialize available connectors based on config
        self._initialize_connectors()
    
    def _initialize_connectors(self):
        """Initialize connectors based on configuration"""
        
        # Alpha Vantage
        av_config = self.config.get('alpha_vantage', {})
        if av_config.get('enabled', False) and av_config.get('api_key'):
            self.connectors['alpha_vantage'] = AlphaVantageConnector(
                av_config['api_key'], self.pipeline
            )
        
        # Finnhub
        fh_config = self.config.get('finnhub', {})
        if fh_config.get('enabled', False) and fh_config.get('api_key'):
            self.connectors['finnhub'] = FinnhubConnector(
                fh_config['api_key'], self.pipeline
            )
        
        # Quandl
        ql_config = self.config.get('quandl', {})
        if ql_config.get('enabled', False) and ql_config.get('api_key'):
            self.connectors['quandl'] = QuandlConnector(
                ql_config['api_key'], self.pipeline
            )
        
        # FRED
        fred_config = self.config.get('fred', {})
        if fred_config.get('enabled', False) and fred_config.get('api_key'):
            self.connectors['fred'] = FREDConnector(
                fred_config['api_key'], self.pipeline
            )
        
        # Twitter
        twitter_config = self.config.get('twitter', {})
        if twitter_config.get('enabled', False) and twitter_config.get('bearer_token'):
            self.connectors['twitter'] = TwitterSentimentConnector(
                twitter_config['bearer_token'], self.pipeline
            )
    
    async def start_data_collection(self):
        """Start data collection from all configured sources"""
        self.running = True
        logger.info("Starting data collection from all sources...")
        
        tasks = []
        
        # Start periodic data collection tasks
        if 'alpha_vantage' in self.connectors:
            tasks.append(asyncio.create_task(self._alpha_vantage_collection()))
        
        if 'finnhub' in self.connectors:
            tasks.append(asyncio.create_task(self._finnhub_collection()))
        
        if 'quandl' in self.connectors:
            tasks.append(asyncio.create_task(self._quandl_collection()))
        
        if 'fred' in self.connectors:
            tasks.append(asyncio.create_task(self._fred_collection()))
        
        if 'twitter' in self.connectors:
            tasks.append(asyncio.create_task(self._twitter_collection()))
        
        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            logger.error(f"Error in data collection: {e}")
    
    async def _alpha_vantage_collection(self):
        """Alpha Vantage data collection task"""
        symbols = self.config.get('alpha_vantage', {}).get('symbols', ['AAPL', 'GOOGL'])
        interval = self.config.get('alpha_vantage', {}).get('collection_interval', 300)  # 5 minutes
        
        async with self.connectors['alpha_vantage'] as connector:
            while self.running:
                for symbol in symbols:
                    await connector.fetch_intraday_data(symbol)
                
                await asyncio.sleep(interval)
    
    async def _finnhub_collection(self):
        """Finnhub data collection task"""
        symbols = self.config.get('finnhub', {}).get('symbols', ['AAPL', 'GOOGL'])
        
        async with self.connectors['finnhub'] as connector:
            # Start real-time feed
            await connector.start_realtime_feed(symbols)
    
    async def _quandl_collection(self):
        """Quandl data collection task"""
        datasets = self.config.get('quandl', {}).get('datasets', ['WIKI/AAPL'])
        interval = self.config.get('quandl', {}).get('collection_interval', 3600)  # 1 hour
        
        async with self.connectors['quandl'] as connector:
            while self.running:
                for dataset in datasets:
                    await connector.fetch_dataset(dataset)
                
                await asyncio.sleep(interval)
    
    async def _fred_collection(self):
        """FRED data collection task"""
        series = self.config.get('fred', {}).get('series', ['GDP', 'UNRATE'])
        interval = self.config.get('fred', {}).get('collection_interval', 3600)  # 1 hour
        
        async with self.connectors['fred'] as connector:
            while self.running:
                for series_id in series:
                    await connector.fetch_series(series_id)
                
                await asyncio.sleep(interval)
    
    async def _twitter_collection(self):
        """Twitter sentiment collection task"""
        symbols = self.config.get('twitter', {}).get('symbols', ['AAPL', 'GOOGL'])
        interval = self.config.get('twitter', {}).get('collection_interval', 300)  # 5 minutes
        
        async with self.connectors['twitter'] as connector:
            while self.running:
                for symbol in symbols:
                    await connector.fetch_sentiment_for_symbol(symbol)
                
                await asyncio.sleep(interval)
    
    def stop(self):
        """Stop all data collection"""
        self.running = False
        logger.info("Stopping data collection...")

# Example configuration for all connectors
EXAMPLE_CONFIG = {
    'alpha_vantage': {
        'enabled': False,
        'api_key': 'YOUR_ALPHA_VANTAGE_API_KEY',
        'symbols': ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
        'collection_interval': 300  # 5 minutes
    },
    'finnhub': {
        'enabled': False,
        'api_key': 'YOUR_FINNHUB_API_KEY',
        'symbols': ['AAPL', 'GOOGL', 'MSFT', 'TSLA']
    },
    'quandl': {
        'enabled': False,
        'api_key': 'YOUR_QUANDL_API_KEY',
        'datasets': ['WIKI/AAPL', 'WIKI/GOOGL'],
        'collection_interval': 3600  # 1 hour
    },
    'fred': {
        'enabled': False,
        'api_key': 'YOUR_FRED_API_KEY',
        'series': ['GDP', 'UNRATE', 'FEDFUNDS', 'CPIAUCSL'],
        'collection_interval': 3600  # 1 hour
    },
    'twitter': {
        'enabled': False,
        'bearer_token': 'YOUR_TWITTER_BEARER_TOKEN',
        'symbols': ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
        'collection_interval': 300  # 5 minutes
    }
} 