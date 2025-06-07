# Technical Architecture Overview

**Trading Helper Bot - Current Tech Stack & Integration Points**

*Last Updated: January 2025*

---

## 📊 Current Tech Stack

### Frontend Framework
- **React 19.1.0** - Primary UI framework
- **TypeScript** - Type safety across entire codebase
- **React Router DOM 7.6.0** - Client-side routing and navigation
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Ant Design 5.25.1** - Component library for consistent UI
- **Electron** - Desktop application wrapper for cross-platform deployment

### Database & Data Storage
- **SQL.js 1.13.0** - Client-side SQLite database in browser/Electron
  - Primary data store for trades, positions, ML analysis results
  - Schema version management with automatic migrations
  - Comprehensive trading data schema with ML analysis fields
- **IndexedDB** - Browser-native backup and context storage
  - Goal configurations and onboarding progress
  - User context management with TTL expiration
  - Backup/restore functionality
- **File-based storage** - CSV imports and exports

### Charting & Visualization Libraries
- **Recharts 2.15.3** - Primary charting library (React-native charts)
  - Line charts, bar charts, area charts for portfolio analytics
  - Interactive P&L visualizations and cumulative returns
- **Plotly.js 3.0.1 + React-Plotly.js 2.6.0** - Advanced 3D plotting
  - Cumulative P&L charts with time-series data
  - Dynamic imports for code splitting (vendors-plotly chunk)
- **Chart.js 4.4.9 + React-ChartJS-2 5.3.0** - Alternative charting
  - Used in P&L dashboard for specific chart types
- **React Grid Heatmap 1.3.0** - Specialized heatmap visualizations
- **Custom chart components** with lazy loading and Suspense

### File Upload & CSV Processing
- **React-Dropzone 14.3.8** - Drag & drop file upload interface
- **PapaParse 5.5.2** - High-performance CSV parsing
  - Streaming processing for large files (64KB chunks)
  - Worker-based parsing for non-blocking UI
  - Error handling and validation during parsing
- **File-Saver 2.0.5** - Client-side file downloads

### State Management
- **React Context API** - Global state management
  - `GoalSizingContext` for configuration and onboarding
  - Service layer pattern with singleton database instances
- **React Hooks** - Local component state and side effects
- **Custom hooks** for reusable stateful logic
- **EventEmitter pattern** for service-to-service communication

### API Structure & Services
- **Service Layer Architecture** with clear separation:
  - `DatabaseService` - Core data persistence
  - `IBKRService` / `SchwabService` - Broker API integration
  - `SyncService` - Multi-broker data synchronization
  - `StreamingService` - Real-time data streaming
  - `MonitoringService` - Performance monitoring and health checks
  - `VolatilityAnalysisService` - Market analysis and calculations
  - `CsvProcessingService` - File import/export operations

### Broker Data Processing
- **Interactive Brokers (IBKR)** integration
  - `@stoqey/ib` library for TWS API connection
  - Electron main process IPC for secure API calls
  - Real-time position, order, and account data
- **Charles Schwab** integration
  - `schwab-client-js` for API connectivity
  - OAuth 2.0 authentication flow
- **Multi-broker architecture** with unified interfaces
- **Data normalization** to common schema across brokers

### Background Job Processing
- **Node.js EventEmitter** for async operations
- **Sync Service** with configurable intervals
  - Scheduled data synchronization (5-minute default)
  - Retry logic with exponential backoff
  - Concurrent broker operations
- **Streaming Service** for real-time updates
  - WebSocket-based connections
  - Automatic reconnection and failover
- **No dedicated job queue** - relies on service orchestration

### Technical Analysis & ML
- **Black-Scholes 1.1.0** - Options pricing calculations
- **Technical Indicators 3.1.0** - Market analysis functions
- **ML-CART 2.1.1** - Decision tree algorithms
- **Custom HMM service** for volatility regime detection

---

## 🔌 Integration Points

### Data Flow Architecture
```
CSV Import → PapaParse → Validation → DatabaseService → UI Components
     ↓
Browser Files → DropZone → CsvProcessingService → SQL.js → React State

Broker APIs → Service Layer → DatabaseService → Context → Components
     ↓
IBKR/Schwab → SyncService → Data Normalization → SQL.js → UI Updates
```

### File Upload & Storage
- **Local file system** access via Electron file dialogs
- **Drag & drop zones** with CSV validation
- **Preview grids** show first 10 rows before import
- **Streaming processing** for large CSV files (1000+ rows)
- **Error reporting** with line-by-line validation
- **Backup/export** functionality to local files

### Large Dataset Handling
- **Chunked processing** - 64KB CSV chunks with worker threads
- **Lazy loading** - Chart components loaded on demand
- **Webpack code splitting** - Vendor chunks for optimal loading
  - `vendors-charts` (Recharts, D3)
  - `vendors-plotly` (Plotly.js)
  - `vendors` (Core dependencies)
- **Virtual scrolling** with `@tanstack/react-virtual` for large tables
- **Progressive loading** for historical data

### Shared Components Library
- **Reusable UI components** in `src/components/ui/`
  - `AccessibleTable` - Screen reader compatible data tables
  - `Modal` - Consistent modal dialogs
  - `Toaster` - Notification system with react-toastify
  - `Tooltip` - Contextual help system
  - `ValidationDisplay` - Form validation feedback
- **Chart wrappers** with Suspense and error boundaries
- **Form components** with Zod validation
- **Layout components** for consistent page structure

### Caching Systems
- **Browser memory** - React component state and context
- **SQL.js in-memory** - Database queries cached until app restart
- **IndexedDB** - Persistent browser storage for user preferences
- **No Redis/external cache** - Client-side caching only
- **Context expiration** - TTL-based cache invalidation

### Database Queries for Time-Series Data
- **SQL.js optimized queries** for trade data analysis
- **Indexed columns** on trade dates and symbols
- **Aggregation queries** for P&L calculations
- **Window functions** for cumulative calculations
- **ML analysis results** stored with trade relationships
- **Custom query builders** for complex analytics

### Real-Time Data Integration
- **WebSocket connections** via StreamingService
- **IPC communication** between Electron renderer and main process
- **Event-driven updates** with React state synchronization
- **Broker heartbeat** monitoring for connection health
- **Fallback to polling** when streaming unavailable

---

## 🏗️ Architecture Patterns

### Design Patterns Used
- **Repository Pattern** - DatabaseService abstraction
- **Adapter Pattern** - Multi-broker integration
- **Observer Pattern** - EventEmitter for service communication
- **Strategy Pattern** - Configurable sync and streaming behaviors
- **Factory Pattern** - Service initialization and dependency injection
- **Singleton Pattern** - Database instances and configurations

### Error Handling
- **Service-level error boundaries** with logging
- **User-friendly error messages** in UI components
- **Retry mechanisms** in sync and streaming services
- **Graceful degradation** when services unavailable
- **Error reporting** with context and stack traces

### Performance Optimizations
- **Code splitting** by feature and vendor libraries
- **Lazy component loading** with React.lazy()
- **Memoization** with React.memo and useMemo
- **Debounced inputs** for search and filtering
- **Virtual scrolling** for large data sets
- **Efficient re-renders** with dependency arrays

### Security Considerations
- **Client-side encryption** for sensitive data
- **Credential service** for secure API key storage
- **Input validation** with Zod schemas
- **XSS prevention** through React's built-in protection
- **CORS configuration** for API endpoints
- **No server-side storage** - all data client-controlled

---

## 📱 Current Limitations & Opportunities

### Missing Infrastructure
- ❌ **Dedicated background job queue** (using service coordination)
- ❌ **Server-side caching** (Redis, Memcached)
- ❌ **External database** (PostgreSQL, MongoDB)
- ❌ **Microservices architecture** (monolithic client app)
- ❌ **Container deployment** (Docker, Kubernetes)

### Scaling Opportunities
- 🚀 **WebWorkers** for heavy computations
- 🚀 **Service Workers** for offline functionality
- 🚀 **Database migrations** to external SQL database
- 🚀 **API gateway** for service orchestration
- 🚀 **Message queues** for async processing

---

## 📋 Part 2: Implementation Details & Code Patterns

### 🗄️ Database Implementation

#### Exact SQL.js Schema Creation Code
```typescript
// From src/services/DatabaseService.ts - Main schema initialization
const existingDb = new SQL.Database();
existingDb.run(`
  CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    importTimestamp TEXT NOT NULL,
    broker TEXT NOT NULL,
    accountId TEXT,
    tradeDate TEXT NOT NULL,
    settleDate TEXT,
    symbol TEXT NOT NULL,
    dateTime TEXT,
    description TEXT,
    assetCategory TEXT NOT NULL,
    action TEXT,
    quantity REAL NOT NULL, 
    tradePrice REAL NOT NULL,
    currency TEXT NOT NULL,
    proceeds REAL,
    cost REAL,
    commission REAL,
    fees REAL,
    netAmount REAL NOT NULL,
    openCloseIndicator TEXT,
    costBasis REAL,
    optionSymbol TEXT,
    expiryDate TEXT,
    strikePrice REAL,
    putCall TEXT,
    multiplier REAL,
    orderID TEXT,
    executionID TEXT,
    notes TEXT,
    rawCsvRowJson TEXT,
    
    -- Version 2 Fields (added for ML analysis)
    openDelta REAL,
    openGamma REAL,
    -- ... (all ML fields)
  );
  
  CREATE TABLE IF NOT EXISTS summary (
    id INTEGER PRIMARY KEY,
    cumulativePL REAL
  );
  
  CREATE TABLE IF NOT EXISTS ml_analysis_results (
    result_id TEXT PRIMARY KEY,
    trade_id TEXT NOT NULL,
    analysis_timestamp TEXT NOT NULL,
    model_name TEXT NOT NULL,
    market_regime TEXT,
    identified_pattern TEXT,
    sizing_recommendation REAL,
    prediction_confidence REAL,
    FOREIGN KEY (trade_id) REFERENCES trades(id)
  );
`);
```

#### Database Migration Handling Location
- **Migration Logic**: `src/services/DatabaseService.ts` lines 828-962
- **Version Management**: `LATEST_SCHEMA_VERSION = 2` constant
- **Migration Functions**: `runMigrations()` and `migrateToV2()` functions
- **Transaction Safety**: BEGIN/COMMIT/ROLLBACK pattern for atomicity

#### Adding sp500_prices and market_news Tables
```typescript
// Add to migration function in DatabaseService.ts
function migrateToV3(db: Database) {
  console.log('[DEBUG migrateToV3] Adding market data tables...');
  
  // S&P 500 historical prices
  db.exec(`
    CREATE TABLE IF NOT EXISTS sp500_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      open REAL NOT NULL,
      high REAL NOT NULL,
      low REAL NOT NULL,
      close REAL NOT NULL,
      volume INTEGER,
      adjusted_close REAL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_sp500_date ON sp500_prices(date);
  `);
  
  // Market news storage
  db.exec(`
    CREATE TABLE IF NOT EXISTS market_news (
      id TEXT PRIMARY KEY,
      headline TEXT NOT NULL,
      summary TEXT,
      published_at TEXT NOT NULL,
      source TEXT NOT NULL,
      sentiment_score REAL,
      relevance_score REAL,
      symbols TEXT, -- JSON array of related symbols
      url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_news_published ON market_news(published_at);
    CREATE INDEX IF NOT EXISTS idx_news_source ON market_news(source);
  `);
}
```

#### Database Index Pattern
```typescript
// Exact pattern from HistoricalIVDatabaseService.ts
CREATE INDEX IF NOT EXISTS idx_tablename_column ON table_name(column_name);
CREATE INDEX IF NOT EXISTS idx_tablename_multi ON table_name(col1, col2);

// Composite index for time-series queries
CREATE INDEX IF NOT EXISTS idx_trades_symbol_date ON trades(symbol, tradeDate);
CREATE INDEX IF NOT EXISTS idx_trades_date_broker ON trades(tradeDate, broker);
```

#### Time-Series Query Optimization Examples
```typescript
// From DatabaseService.ts - Optimized queries with indexes
export async function getTrades(filters?: TradeFilters): Promise<NormalizedTradeData[]> {
  const db = await getDb();
  
  // Use indexed columns in WHERE clauses
  let query = `
    SELECT * FROM trades 
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (filters?.symbol) {
    query += ` AND symbol = ?`; // Uses idx_trades_symbol_date
    params.push(filters.symbol);
  }
  
  if (filters?.dateRange) {
    query += ` AND tradeDate BETWEEN ? AND ?`; // Uses date index
    params.push(filters.dateRange.start, filters.dateRange.end);
  }
  
  // Order by indexed column for performance
  query += ` ORDER BY tradeDate DESC, id DESC`;
  
  const stmt = db.prepare(query);
  const results = stmt.getAsObject(params);
  stmt.free();
  
  return results;
}
```

---

### 🔌 Service Integration Details

#### MarketDataService Class Structure Following Existing Patterns
```typescript
// Following StreamingService.ts and SyncService.ts patterns
import { EventEmitter } from 'events';
import { MonitoringService } from './MonitoringService';
import { ErrorHandlingService } from './ErrorHandlingService';

export interface MarketDataConfiguration {
  updateIntervalMs: number;
  enableRealTime: boolean;
  dataSources: string[];
  cacheTimeoutMs: number;
  maxRetries: number;
}

export class MarketDataService extends EventEmitter {
  private monitoring: MonitoringService;
  private errorHandling: ErrorHandlingService;
  private config: MarketDataConfiguration;
  private isRunning: boolean = false;
  private cache: Map<string, any> = new Map();

  constructor(
    monitoring: MonitoringService,
    errorHandling: ErrorHandlingService,
    config?: Partial<MarketDataConfiguration>
  ) {
    super();
    this.monitoring = monitoring;
    this.errorHandling = errorHandling;
    this.config = {
      updateIntervalMs: 60000, // 1 minute
      enableRealTime: true,
      dataSources: ['yahoo', 'alpha_vantage'],
      cacheTimeoutMs: 300000, // 5 minutes
      maxRetries: 3,
      ...config
    };
    
    this.setupEventHandlers();
  }

  public async initialize(): Promise<void> {
    const span = this.monitoring.startSpan('market_data_initialize');
    try {
      console.log('MarketDataService: Initializing...');
      await this.validateDataSources();
      this.isRunning = true;
      this.emit('service:initialized');
      span?.setStatus({ code: 0, message: 'Initialized successfully' });
    } catch (error) {
      span?.setStatus({ code: 1, message: `Initialization failed: ${error}` });
      throw error;
    } finally {
      span?.finish();
    }
  }

  private setupEventHandlers(): void {
    this.on('data:updated', (data) => {
      this.monitoring.recordMetric('market_data_updates', 1, {
        symbol: data.symbol,
        source: data.source
      });
    });
  }
}
```

#### Service Registration with Existing Container
```typescript
// Add to service initialization (following SyncService pattern)
// In main service orchestrator or App.tsx initialization

class ServiceContainer {
  private services: Map<string, any> = new Map();

  async initializeServices(): Promise<void> {
    // Initialize monitoring first (dependency for others)
    const monitoring = new MonitoringService();
    await monitoring.initialize();
    this.services.set('monitoring', monitoring);

    // Initialize error handling
    const errorHandling = new ErrorHandlingService(monitoring, errorConfig);
    this.services.set('errorHandling', errorHandling);

    // Initialize market data service
    const marketData = new MarketDataService(monitoring, errorHandling);
    await marketData.initialize();
    this.services.set('marketData', marketData);

    // Register service events
    marketData.on('data:updated', (data) => {
      this.broadcast('market:data:updated', data);
    });
  }

  getService<T>(name: string): T {
    return this.services.get(name);
  }
}
```

#### EventEmitter Pattern for Service-to-Service Communication
```typescript
// Exact pattern from ErrorHandlingService.ts and SyncService.ts
export class MarketDataService extends EventEmitter {
  
  // Emit events with standardized naming
  private notifyDataUpdate(symbol: string, data: any): void {
    this.emit('data:updated', { symbol, data, timestamp: new Date() });
    this.emit('market:data:updated', { symbol, data });
    this.emit(`symbol:${symbol}:updated`, data);
  }

  // Listen to other service events
  private setupServiceIntegration(syncService: SyncService): void {
    // Listen to sync events
    syncService.on('sync:completed', (result) => {
      console.log('MarketDataService: Received sync completion');
      this.refreshMarketData(result.symbols);
    });

    // Emit to monitoring service
    this.on('error', (error) => {
      this.monitoring.recordMetric('market_data_errors', 1, {
        error_type: error.type,
        service: 'market_data'
      });
    });
  }
}

// Usage in other services
const marketData = serviceContainer.getService<MarketDataService>('marketData');
marketData.on('data:updated', (event) => {
  console.log(`New market data for ${event.symbol}`);
  // Update local cache or trigger UI updates
});
```

#### Integration with Existing SyncService
```typescript
// Add market data sync to SyncService.ts
public async syncMarketData(): Promise<BrokerSyncResult> {
  const span = this.monitoring.startSpan('sync_market_data');
  const startTime = Date.now();
  
  try {
    // Get market data service
    const marketData = this.serviceContainer.getService('marketData');
    
    // Sync S&P 500 data
    const sp500Data = await marketData.fetchSP500Data();
    await this.databaseService.insertSP500Data(sp500Data);
    
    // Sync market news
    const newsData = await marketData.fetchMarketNews();
    await this.databaseService.insertMarketNews(newsData);
    
    const result: BrokerSyncResult = {
      brokerId: 'market_data',
      success: true,
      syncedAt: new Date(),
      duration: Date.now() - startTime,
      recordsUpdated: sp500Data.length + newsData.length,
      recordsSkipped: 0,
      errors: [],
      warnings: [],
      dataTypes: ['sp500_prices', 'market_news']
    };
    
    this.emit('sync:market_data:completed', result);
    return result;
    
  } catch (error) {
    span?.setStatus({ code: 1, message: error.message });
    throw error;
  } finally {
    span?.finish();
  }
}
```

#### Error Handling Pattern from Other Services
```typescript
// Following ErrorHandlingService.ts pattern
public async fetchMarketData(symbol: string): Promise<MarketData> {
  return this.errorHandling.executeWithErrorHandling(
    async () => {
      const span = this.monitoring.startSpan('fetch_market_data', {
        tags: { symbol }
      });
      
      try {
        const data = await this.dataProvider.getQuote(symbol);
        return this.normalizeMarketData(data);
      } finally {
        span?.finish();
      }
    },
    {
      operation: 'fetch_market_data',
      brokerId: 'market_data',
      context: { symbol }
    },
    {
      retryConfig: { maxAttempts: 3, delayMs: 1000 },
      fallbackKey: 'market_data_cache'
    }
  );
}
```

---

### 🏗️ Component Architecture

#### File Structure for Market Data Components
```
src/components/MarketData/
├── index.tsx                          // Main export
├── MarketDataDashboard.tsx            // Main dashboard
├── MarketDataContext.tsx              // React Context
├── hooks/
│   ├── useMarketData.tsx              // Custom hook
│   ├── useMarketDataSync.tsx          // Sync integration
│   └── useRealTimeQuotes.tsx          // Real-time updates
├── components/
│   ├── PriceChart.tsx                 // Price visualization
│   ├── NewsWidget.tsx                 // News display
│   ├── MarketOverview.tsx             // Summary widget
│   └── QuoteTable.tsx                 // Tabular data
├── types/
│   └── marketData.ts                  // TypeScript interfaces
└── __tests__/
    ├── MarketDataDashboard.test.tsx
    └── useMarketData.test.tsx
```

#### React Context Following GoalSizingContext Pattern
```typescript
// src/components/MarketData/MarketDataContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { MarketDataService } from '../../services/MarketDataService';
import { ServiceContainer } from '../../services/ServiceContainer';

interface MarketDataContextValue {
  quotes: Map<string, Quote>;
  isLoading: boolean;
  error: string | null;
  subscribeToSymbol: (symbol: string) => Promise<void>;
  unsubscribeFromSymbol: (symbol: string) => void;
  getHistoricalData: (symbol: string, period: string) => Promise<HistoricalData[]>;
  refreshData: () => Promise<void>;
}

const MarketDataContext = createContext<MarketDataContextValue | undefined>(undefined);

export const MarketDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketDataService] = useState(() => ServiceContainer.getInstance().getService<MarketDataService>('marketData'));

  // Initialize service connection
  useEffect(() => {
    const initializeMarketData = async () => {
      try {
        setIsLoading(true);
        await marketDataService.initialize();
        
        // Set up event listeners following GoalSizingContext pattern
        marketDataService.on('data:updated', (event) => {
          setQuotes(prev => {
            const newQuotes = new Map(prev);
            newQuotes.set(event.symbol, event.data);
            return newQuotes;
          });
        });

        marketDataService.on('error', (error) => {
          setError(error.message);
        });

      } catch (error) {
        console.error('Failed to initialize market data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMarketData();
  }, [marketDataService]);

  const subscribeToSymbol = useCallback(async (symbol: string) => {
    try {
      await marketDataService.subscribeToQuotes([symbol]);
    } catch (error) {
      console.error(`Failed to subscribe to ${symbol}:`, error);
      setError(error.message);
    }
  }, [marketDataService]);

  const value = {
    quotes,
    isLoading,
    error,
    subscribeToSymbol,
    unsubscribeFromSymbol: useCallback((symbol: string) => {
      marketDataService.unsubscribeFromQuotes([symbol]);
    }, [marketDataService]),
    getHistoricalData: useCallback(async (symbol: string, period: string) => {
      return marketDataService.getHistoricalData(symbol, period);
    }, [marketDataService]),
    refreshData: useCallback(async () => {
      await marketDataService.refreshAllData();
    }, [marketDataService])
  };

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  );
};

export const useMarketData = () => {
  const context = useContext(MarketDataContext);
  if (context === undefined) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
};
```

#### Lazy Loading Import Syntax for Chart Components
```typescript
// Following ChartComponents.tsx pattern
import React, { lazy, Suspense } from 'react';

// Loading component
const ChartLoading = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy load chart libraries with webpack chunk names
const TradingViewChart = lazy(() => import(
  /* webpackChunkName: "vendors-tradingview" */
  './TradingViewChart'
));

const D3PriceChart = lazy(() => import(
  /* webpackChunkName: "vendors-d3-charts" */
  './D3PriceChart'
));

const CandlestickChart = lazy(() => import(
  /* webpackChunkName: "vendors-charts" */
  'recharts'
).then(module => ({ 
  default: () => <module.ComposedChart>/* Candlestick implementation */</module.ComposedChart>
})));

// Wrapper components with Suspense
export const TradingViewWrapper: React.FC<ChartProps> = (props) => (
  <Suspense fallback={<ChartLoading />}>
    <TradingViewChart {...props} />
  </Suspense>
);

export const PriceChartWrapper: React.FC<ChartProps> = (props) => (
  <Suspense fallback={<ChartLoading />}>
    <D3PriceChart {...props} />
  </Suspense>
);
```

#### Ant Design Component Pattern for Consistent Styling
```typescript
// Following existing Ant Design patterns in the codebase
import React from 'react';
import { Card, Table, Button, Space, Typography, Statistic, Row, Col } from 'antd';
import { LineChartOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const MarketDataDashboard: React.FC = () => {
  const { quotes, isLoading, refreshData } = useMarketData();

  return (
    <div className="p-6 space-y-6">
      {/* Header following Ant Design pattern */}
      <div className="flex justify-between items-center">
        <Title level={2}>Market Data Dashboard</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            loading={isLoading}
            onClick={refreshData}
          >
            Refresh Data
          </Button>
        </Space>
      </div>

      {/* Statistics Cards in Grid */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Active Symbols" 
              value={quotes.size}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        {/* More stat cards... */}
      </Row>

      {/* Data Table with Ant Design styling */}
      <Card title="Live Quotes" bordered={false}>
        <Table 
          dataSource={Array.from(quotes.values())}
          columns={[
            { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
            { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => `$${price.toFixed(2)}` },
            { title: 'Change', dataIndex: 'change', key: 'change' }
          ]}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>
    </div>
  );
};
```

#### Adding Market Data to Main Navigation Structure
```typescript
// Following Navigation.tsx pattern
// Add to src/components/Navigation.tsx

const navigationItems = [
  // Existing items...
  {
    path: '/market-data',
    label: '📊 Market Data',
    category: 'trading',
    minLevel: 'import' as UserExperienceLevel,
    feature: 'market-data'
  },
  // In the navigation controller
  {
    id: 'market-data',
    label: '📊 Market Data',
    path: '/market-data',
    category: 'trading',
    minLevel: 'import',
    description: 'Real-time market data and analysis'
  }
];

// Add to App.tsx routes
const MarketDataDashboard = React.lazy(() => import(
  /* webpackChunkName: "page-market-data" */
  './pages/trading/MarketDataDashboard'
));

// In Routes component
<Route path="/market-data" element={<MarketDataDashboard />} />
```

---

### 📁 File Processing Implementation

#### CsvProcessingService Extension Pattern
```typescript
// Following existing CsvProcessingService.ts pattern
import Papa from 'papaparse';
import { MarketDataRecord, OHLCVData } from '../types/marketData';

export class MarketDataCsvService extends CsvProcessingService {
  
  public processMarketDataCsv(
    file: File,
    onProgressUpdate: (stats: StreamProcessingStats) => void,
    onChunkProcessed: (results: ProcessedChunkResult) => void,
    onStreamComplete: (finalStats: StreamProcessingStats, data: MarketDataRecord[]) => void,
    onStreamError: (error: Error) => void
  ): void {
    
    let totalRowsProcessed = 0;
    let successfulRows = 0;
    let allValidRecords: MarketDataRecord[] = [];

    Papa.parse(file as any, {
      header: false,
      skipEmptyLines: true,
      chunkSize: 1024 * 64, // 64KB chunks (same as existing pattern)
      
      step: (results: ParseResult<string[]>, parser) => {
        const row = results.data[0];
        
        try {
          const validated = this.validateAndNormalizeMarketData(row, totalRowsProcessed);
          if (validated) {
            allValidRecords.push(validated);
            successfulRows++;
          }
        } catch (error) {
          onChunkProcessed({
            data: [],
            errors: [{
              rowIndexInFile: totalRowsProcessed,
              message: error.message,
              rawRow: row
            }],
            warnings: []
          });
        }
        
        totalRowsProcessed++;
        
        // Progress update following existing pattern
        onProgressUpdate({
          totalRowsProcessed,
          successfulRows,
          errorCount: totalRowsProcessed - successfulRows,
          warningCount: 0,
          progressPercent: Math.min(100, (totalRowsProcessed / 1000) * 100),
          currentStatusMessage: `Processing market data... ${totalRowsProcessed} rows`
        });
      },
      
      complete: () => {
        onStreamComplete({
          totalRowsProcessed,
          successfulRows,
          errorCount: totalRowsProcessed - successfulRows,
          warningCount: 0,
          progressPercent: 100,
          currentStatusMessage: 'Market data import complete.'
        }, allValidRecords);
      },
      
      error: (error) => {
        onStreamError(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  }
}
```

#### OHLCV Validation for CSV Processing
```typescript
// Add to validation utilities
import { z } from 'zod';

const OHLCVSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  open: z.number().min(0, 'Open price must be positive'),
  high: z.number().min(0, 'High price must be positive'),
  low: z.number().min(0, 'Low price must be positive'),
  close: z.number().min(0, 'Close price must be positive'),
  volume: z.number().min(0, 'Volume must be non-negative').optional(),
  adjustedClose: z.number().min(0, 'Adjusted close must be positive').optional()
});

export function validateAndNormalizeMarketData(
  row: string[], 
  rowIndex: number
): MarketDataRecord | null {
  if (row.length < 6) {
    throw new Error(`Row ${rowIndex}: Expected at least 6 columns (symbol, date, open, high, low, close), got ${row.length}`);
  }

  const rawData = {
    symbol: row[0]?.trim(),
    date: row[1]?.trim(),
    open: parseFloat(row[2]),
    high: parseFloat(row[3]),
    low: parseFloat(row[4]),
    close: parseFloat(row[5]),
    volume: row[6] ? parseInt(row[6]) : undefined,
    adjustedClose: row[7] ? parseFloat(row[7]) : undefined
  };

  // Validate with Zod schema
  const result = OHLCVSchema.safeParse(rawData);
  if (!result.success) {
    throw new Error(`Row ${rowIndex}: ${result.error.errors.map(e => e.message).join(', ')}`);
  }

  // Business logic validation
  if (result.data.high < result.data.low) {
    throw new Error(`Row ${rowIndex}: High price (${result.data.high}) cannot be less than low price (${result.data.low})`);
  }

  if (result.data.open > result.data.high || result.data.open < result.data.low) {
    throw new Error(`Row ${rowIndex}: Open price (${result.data.open}) must be between high and low`);
  }

  return {
    ...result.data,
    id: `${result.data.symbol}_${result.data.date}`,
    importTimestamp: new Date().toISOString()
  };
}
```

#### React-Dropzone Integration Code
```typescript
// Following Upload.tsx pattern
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export const MarketDataUpload: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsProcessing(true);
    
    const csvService = new MarketDataCsvService();
    
    csvService.processMarketDataCsv(
      file,
      (stats) => {
        setProgress(stats.progressPercent);
      },
      (chunk) => {
        console.log('Chunk processed:', chunk);
      },
      (finalStats, data) => {
        console.log('Import complete:', finalStats, data);
        setIsProcessing(false);
        setProgress(100);
      },
      (error) => {
        console.error('Import failed:', error);
        setIsProcessing(false);
      }
    );
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div
      {...getRootProps()}
      className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer 
                  ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                  transition-colors`}
    >
      <input {...getInputProps()} />
      {isProcessing ? (
        <div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Processing... {Math.round(progress)}%</p>
        </div>
      ) : (
        <div>
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop the market data CSV here' : 'Drag & drop market data CSV, or click to select'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Expected format: Symbol, Date, Open, High, Low, Close, Volume (optional)
          </p>
        </div>
      )}
    </div>
  );
};
```

#### File-Saver Export Pattern for Market Data
```typescript
// Following existing File-Saver pattern from codebase
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

export class MarketDataExportService {
  
  public exportMarketDataToCsv(
    data: MarketDataRecord[], 
    filename: string = 'market_data_export.csv'
  ): void {
    // Prepare data for CSV export
    const csvData = data.map(record => ({
      Symbol: record.symbol,
      Date: record.date,
      Open: record.open,
      High: record.high,
      Low: record.low,
      Close: record.close,
      Volume: record.volume || '',
      'Adjusted Close': record.adjustedClose || ''
    }));

    // Convert to CSV using PapaParse
    const csv = Papa.unparse(csvData, {
      header: true,
      delimiter: ',',
      newline: '\n'
    });

    // Create blob and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
  }

  public exportQuotesToJson(
    quotes: Map<string, Quote>,
    filename: string = 'quotes_export.json'
  ): void {
    const quotesArray = Array.from(quotes.entries()).map(([symbol, quote]) => ({
      symbol,
      ...quote,
      exportedAt: new Date().toISOString()
    }));

    const jsonString = JSON.stringify(quotesArray, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, filename);
  }
}
```

---

### ⚡ Performance & Integration

#### Code Splitting Pattern for New Chart Libraries
```typescript
// Add to config-overrides.js following existing pattern
config.optimization.splitChunks = {
  chunks: 'all',
  cacheGroups: {
    // Existing cache groups...
    tradingview: {
      test: /[\\/]node_modules[\\/](tradingview-charting-library)[\\/]/,
      name: 'vendors-tradingview',
      chunks: 'all',
      priority: 25,
      enforce: true,
    },
    d3Charts: {
      test: /[\\/]node_modules[\\/](d3|d3-scale|d3-axis|d3-selection)[\\/]/,
      name: 'vendors-d3',
      chunks: 'all',
      priority: 22,
      enforce: true,
    },
    // Update existing charts group
    charts: {
      test: /[\\/]node_modules[\\/](recharts|plotly\.js|chart\.js)[\\/]/,
      name: 'vendors-charts',
      chunks: 'all',
      priority: 20,
      enforce: true,
    }
  }
};
```

#### TradingView Lightweight Charts Webpack Config
```javascript
// Add to config-overrides.js
const path = require('path');

module.exports = function override(config, env) {
  // Existing configuration...

  // Add alias for TradingView library
  config.resolve.alias = {
    ...config.resolve.alias,
    'lightweight-charts': path.resolve(__dirname, 'node_modules/lightweight-charts')
  };

  // Add specific handling for TradingView charts
  config.module.rules.push({
    test: /\.worker\.js$/,
    use: { loader: 'worker-loader' }
  });

  return config;
};
```

#### Suspense Wrapper Pattern for Chart Components
```typescript
// Following existing ChartComponents.tsx pattern
import React, { Suspense, lazy } from 'react';

const ChartLoading = () => (
  <div className="flex items-center justify-center min-h-[300px] bg-gray-50 rounded-lg border">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-sm text-gray-600 mt-2">Loading chart...</p>
    </div>
  </div>
);

const TradingViewChart = lazy(() => import(
  /* webpackChunkName: "vendors-tradingview" */
  './TradingViewChart'
));

export const TradingViewWrapper: React.FC<ChartProps> = (props) => (
  <Suspense fallback={<ChartLoading />}>
    <TradingViewChart {...props} />
  </Suspense>
);

// Error boundary for chart failures
export const ChartErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-[300px] bg-red-50 rounded-lg border border-red-200">
          <div className="text-center text-red-600">
            <p className="font-medium">Chart failed to load</p>
            <p className="text-sm mt-1">Please refresh the page or try again later</p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
```

#### Virtual Scrolling Integration for Large Datasets
```typescript
// Following @tanstack/react-virtual pattern from codebase
import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export const VirtualizedMarketDataTable: React.FC<{
  data: MarketDataRecord[];
  height: number;
}> = ({ data, height }) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // Row height
    overscan: 10, // Render extra items for smooth scrolling
  });

  return (
    <div
      ref={parentRef}
      className="overflow-auto border rounded-lg"
      style={{ height: `${height}px` }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const record = data[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="flex items-center px-4 border-b hover:bg-gray-50"
            >
              <div className="flex-1">{record.symbol}</div>
              <div className="flex-1">{record.date}</div>
              <div className="flex-1">${record.close.toFixed(2)}</div>
              {/* More columns... */}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

#### IndexedDB Backup Integration Pattern
```typescript
// Following IndexedDBService.ts pattern
export class MarketDataIndexedDBService extends IndexedDBService {

  async backupMarketData(data: MarketDataRecord[]): Promise<string> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const backupData = {
      marketData: data,
      metadata: {
        exportedAt: new Date().toISOString(),
        recordCount: data.length,
        version: '1.0'
      }
    };

    const backupId = await this.createBackup(backupData, 'market_data');
    
    // Update backup metadata in SQLite
    const dbService = new DatabaseService();
    await dbService.init();
    dbService.saveBackupMetadata('default', 'market_data', 
      JSON.stringify(backupData).length, 
      await this.calculateChecksum(backupData)
    );

    return backupId;
  }

  async restoreMarketData(backupId: string): Promise<MarketDataRecord[]> {
    const backup = await this.getBackup(backupId);
    if (!backup || backup.type !== 'market_data') {
      throw new Error('Market data backup not found');
    }

    return backup.data.marketData;
  }

  private async calculateChecksum(data: any): Promise<string> {
    const text = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

---

*Part 2 provides complete implementation patterns and code examples based on existing codebase architecture. These patterns ensure consistency with current development practices and maintain performance optimization strategies.* 