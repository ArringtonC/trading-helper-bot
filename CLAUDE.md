# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm start` - Start development server
- `npm run start:fast` - Start development server with optimizations (no sourcemaps, no ESLint errors)
- `npm run build` - Build production bundle
- `npm test` - Run test suite
- `npm run dev` - Start with Electron in development mode

### Testing
- `npm test` - Run Jest tests
- `npm run cypress:open` - Open Cypress test runner
- `npm run cypress:run` - Run Cypress tests headlessly
- `npm run test:e2e` - Run end-to-end tests

### Electron
- `npm run electron-dev` - Start Electron in development
- `npm run electron-pack` - Build Electron application

## Architecture Overview

This is a **React 19 + TypeScript** trading education and analysis platform with several key architectural patterns:

### Core Technology Stack
- **Frontend**: React 19, TypeScript, Ant Design, TailwindCSS
- **State Management**: React Context API (multiple providers)
- **Database**: SQL.js (client-side SQLite) with comprehensive schema
- **Charts**: Recharts, Plotly.js, Chart.js, Lightweight Charts
- **File Processing**: PapaParse for CSV, React-Dropzone for uploads
- **Broker APIs**: IBKR (@stoqey/ib), Schwab (schwab-client-js)
- **Electron**: Desktop application support

### Multi-Context Architecture
The application uses **5 primary React contexts** for state management:
- `TradesContext` - Trade data and portfolio management
- `WinRateContext` - Performance analytics
- `TutorialContext` - Educational content state
- `GoalSizingContext` - Position sizing and risk management
- `UserFlowContext` - User journey and onboarding

### Service Layer Pattern
**Comprehensive service layer** in `src/services/` with 50+ services:
- `DatabaseService.ts` - SQL.js database operations with full schema
- `IBKRService.ts` / `SchwabService.ts` - Broker integrations
- `VolatilityAnalysisService.ts` - Options and volatility calculations
- `RiskService.ts` - Risk management and position sizing
- `ExportService.ts` - Data export capabilities

### Component Architecture
- **Pages**: Route-level components in `src/pages/`
- **Shared Components**: Reusable UI in `src/components/`
- **Specialized Components**: Trading-specific components organized by domain
- **Progressive Disclosure**: UX pattern for complex financial data

### Database Schema
SQL.js database with comprehensive schema including:
- `trades` table - Normalized trade data across brokers
- `positions` table - Position tracking and P&L
- `goal_sizing_configs` - Risk management settings
- `onboarding_progress` - User education tracking
- Full audit trail and backup capabilities

### Data Processing Pipeline
- **Multi-broker CSV import** with automated broker detection
- **Reconciliation engine** for data validation
- **Rule engine** for trade analysis and risk management
- **Export capabilities** to multiple formats (CSV, NinjaTrader, etc.)

### Key Integration Points
- **IBKR API**: Real-time market data and trade execution
- **Schwab API**: Account integration and data sync
- **File Processing**: Drag-drop CSV import with validation
- **Chart Integration**: Multiple charting libraries for different use cases

### Testing Strategy
- **Jest** for unit tests with comprehensive mocking
- **Cypress** for end-to-end testing
- **React Testing Library** for component testing
- Test files co-located with source code

### Performance Optimizations
- **Lazy loading** for route components with chunk names
- **Virtual scrolling** for large datasets
- **Memoization** for expensive calculations
- **Code splitting** for optimal bundle sizes

## Development Patterns

### File Organization
- Use **domain-driven** folder structure
- Keep **tests co-located** with source files
- Use **index.ts** files for clean exports
- Separate **types** in dedicated files

### Component Patterns
- Use **React Context** for global state
- Implement **progressive disclosure** for complex UIs
- Use **Ant Design** components consistently
- Apply **TailwindCSS** for styling

### Service Integration
- Services are **stateless** and **injectable**
- Use **async/await** patterns consistently
- Implement **error boundaries** for service failures
- Apply **rate limiting** for API calls

### Database Operations
- All database operations are **async**
- Use **prepared statements** for SQL queries
- Implement **transaction support** for complex operations
- Maintain **audit trails** for critical data

## Common Workflows

### Adding New Broker Support
1. Create service in `src/services/` (e.g., `NewBrokerService.ts`)
2. Add types in `src/types/` (e.g., `newBroker.ts`)
3. Update `detectBroker.ts` utility
4. Add CSV parsing logic in `src/utils/`
5. Update database schema if needed
6. Add tests for new broker

### Creating New Educational Content
1. Add component in `src/components/` or `src/pages/learning/`
2. Update `TutorialContext` if needed
3. Add to routing in `App.tsx`
4. Follow progressive disclosure patterns
5. Add to navigation in `Navigation.tsx`

### Implementing New Risk Rules
1. Add rule definition in `src/utils/ruleEngine/`
2. Update `RuleSchema.ts` types
3. Add rule to `RuleEditor.tsx` if user-configurable
4. Update `RiskService.ts` for integration
5. Add comprehensive tests

Remember to run `npm test` before committing changes and ensure all TypeScript errors are resolved.