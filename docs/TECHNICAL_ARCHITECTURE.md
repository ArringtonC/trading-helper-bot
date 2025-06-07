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

*This document reflects the current architecture as of January 2025. For implementation details, see individual service documentation in the `/docs` directory.* 