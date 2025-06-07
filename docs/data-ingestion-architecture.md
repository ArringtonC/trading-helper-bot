## Data Ingestion Pipeline Architecture

This document outlines the architecture for the data ingestion pipeline within the trading-helper-bot application, focusing on providing clean, normalized data for the ML-powered trade analysis system.

### 1. Data Sources

The pipeline is designed to handle data from the following primary sources:

*   **Broker Data:**
    *   Imported trade history (CSV files).
    *   Real-time and historical data from broker APIs (Interactive Brokers, Schwab): Completed Trades, Current Positions, Account Balances/Summaries.

*   **Market Data:** (Potential Future Sources)
    *   External APIs for: Historical End-of-Day Prices, Historical Intraday Prices, Real-time Quotes/Prices, Historical and Real-time Volatility Data (like VIX), Fundamental Data.

### 2. Data Flow

The data flows through the following stages:

1.  **Data Acquisition:** Fetching data from Broker APIs (polling/streaming) or reading from uploaded files. Handled primarily in the Electron main process, potentially with the Python microservice for external market data.
2.  **Initial Processing & Validation:** Cleaning raw data, validating format, handling basic errors using parsing functions and data structure validation against types/interfaces.
3.  **Data Normalization:** Transforming data from diverse sources into a consistent internal format, handled by dedicated mapping logic.
4.  **Feature Engineering (Initial):** Creating basic features required for storage and initial analysis (e.g., calculating P&L). More advanced feature engineering occurs closer to the ML models.
5.  **Data Storage:** Persisting processed data into the SQLite database (or potentially other databases for scalability). Requires dedicated tables for different data types (trades, positions, market data, etc.). Handled by the `DatabaseService`.
6.  **Data Access Layer:** Providing standardized APIs/functions for the UI and ML components to retrieve stored data. Exposed via IPC for the UI and potentially direct access/API for the Python microservice.

**Conceptual Data Flow Diagram:**

```mermaid
graph TD
    A[Broker APIs] --> B[Electron Main Process]
    C[CSV Uploads] --> B
    D[Market Data APIs] --> E[Electron Main Process / Python Microservice]

    B --> F[Ingestion]
    E --> F

    F --> G[Processing & Validation]
    G --> H[Normalization]
    H --> I[Initial Feature Engineering]

    I --> J[Data Storage (SQLite DB)]

    J --> K[Data Access Layer]

    K --> L[UI (Renderer Process)]
    K --> M[ML System (Python Microservice)]
```

### 3. Key Considerations

*   **Error Handling & Validation:** Implement robust error handling at each stage (acquisition, parsing, normalization, storage). Use logging for tracking and issue identification. Implement validation rules for data integrity.
*   **Throughput & Scalability:** The current SQLite/Electron architecture is suitable for current needs. Future real-time, high-volume market data would require consideration of more performant databases, dedicated ingestion services, message queuing, and distributed processing.
*   **Technology Stack:** Leverage existing technologies (TypeScript, Node.js/Electron, Python) and integrate libraries for API interaction, data parsing, and potentially message queuing if real-time streaming is implemented later.

### 4. Component Interactions

*   Broker-specific services (`IBKRIntegrationService`, `SchwabService`) handle acquisition from APIs.
*   Parsing utilities handle file uploads.
*   A normalization layer transforms data into universal formats.
*   The `DatabaseService` manages storage.
*   Data access functions retrieve data for the UI and ML components.
*   The Sync Service (Task 9.4) could orchestrate polling/webhook mechanisms for continuous data updates.
*   The Python microservice will handle advanced ML and potentially market data ingestion and feature engineering.

This architecture provides a foundation for building the data ingestion pipeline to support the ML analysis system. Specific implementation details for each stage will be addressed in subsequent tasks. 
 
 
 
 
 