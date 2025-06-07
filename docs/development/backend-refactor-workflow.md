# Best Practices for Backend Refactor & Optimization Tasks

## Purpose
- Perform backend refactors to improve maintainability, performance, and extensibility before major releases or after significant feature growth.
- Ensure all changes are testable, revertible, and well-documented.

## Documentation Outline
1. **Process Overview**
   - Why and when to refactor
   - Goals and expected outcomes
2. **Step-by-Step Workflow**
   - Planning and code review
   - Implementation and testing
   - Deployment and post-release monitoring
3. **Coding and Architectural Best Practices**
   - Abstraction, modularity, and code reuse
   - Performance and scalability
   - Error handling and logging
4. **Risk Assessment and Rollback Planning**
   - Identifying risks
   - Creating rollback plans
   - Communication protocols
5. **Artifact Checklist**
   - Design docs
   - Test plans
   - Benchmarks and performance reports
6. **Actionable Examples**
   - Taskmaster commands for each workflow step
   - Code snippets and templates
7. **Review and Feedback**
   - Peer review process
   - Incorporating feedback
8. **Maintenance and Ownership**
   - Assigning documentation ownership
   - Schedule for regular updates
   - Feedback loop for continuous improvement

## Preparation
- Audit current backend code: services, data models, feature logic.
- Identify pain points: code duplication, performance bottlenecks, unclear abstractions, outdated patterns.
- Use Taskmaster to create a parent "Backend Refactor" task and expand it into subtasks (audit, refactor, optimize, test, document).

## Taskmaster Workflow
- **Expand the parent task** into actionable subtasks (e.g., "Audit Data Models," "Refactor Feature Calculation," "Optimize Database Access," "Increase Test Coverage," "Update Documentation").
- **Log a detailed plan** for each subtask before starting work (file paths, functions, intended changes, risks).
- **Set status** to "in-progress" when working, and "done" when complete.
- **Iteratively update** subtask details with findings, decisions, and code snippets.

## Implementation
- Make incremental, testable changes.
- Run and update tests after each change.
- Use version control for all changes; commit with detailed messages referencing the Taskmaster subtask.
- Remove only code that is proven redundant or harmful; otherwise, prefer refactoring over deletion.

## Review & Handoff
- Ensure all changes are covered by tests and documented.
- Update or create rules if new patterns emerge.
- Summarize key changes and decisions in the documentation for future reference.
- Conduct peer review and gather feedback.
- Assign documentation maintenance ownership and schedule regular reviews.

## Actionable Examples

### Taskmaster Commands for Each Workflow Step

- **Create a new backend refactor task:**
  ```sh
  task-master add-task --prompt "Comprehensive Backend Refactor and Optimization Prior to Final Release" --priority=high
  ```
- **Expand a parent task into subtasks:**
  ```sh
  task-master expand --id=<parentTaskId> --num=5 --prompt "Break down the backend refactor into actionable subtasks."
  ```
- **Mark a task or subtask as in-progress or done:**
  ```sh
  task-master set-status --id=<taskId> --status=in-progress
  task-master set-status --id=<taskId> --status=done
  ```
- **Log a detailed plan or progress for a subtask:**
  ```sh
  task-master update-subtask --id=<parentId.subtaskId> --prompt="Detailed plan or progress update."
  ```
- **Show next task to work on:**
  ```sh
  task-master next
  ```
- **Show details for a specific task or subtask:**
  ```sh
  task-master show <taskId>
  ```
- **Validate and fix dependencies:**
  ```sh
  task-master validate-dependencies
  task-master fix-dependencies
  ```
- **Generate individual task files:**
  ```sh
  task-master generate
  ```

### Code Snippets and Templates

- **Refactor Example (TypeScript):**
  ```typescript
  // Before: Duplicated logic
  export function calculatePnl(trade) {
    // ... logic ...
  }
  export function calculateWinRate(trades) {
    // ... similar logic ...
  }

  // After: Shared utility
  function getTradeStats(trades) {
    // ... shared logic ...
  }
  export function calculatePnl(trade) {
    return getTradeStats([trade]).pnl;
  }
  export function calculateWinRate(trades) {
    return getTradeStats(trades).winRate;
  }
  ```

- **Test Plan Template:**
  ```markdown
  ## Test Plan
  - [ ] Unit tests for all refactored functions
  - [ ] Integration tests for data flow
  - [ ] Performance benchmarks before/after
  - [ ] Manual QA checklist
  ```

- **Rollback Plan Example:**
  ```markdown
  ## Rollback Plan
  - Keep previous release branch available
  - Document all changes in CHANGELOG.md
  - Automated tests must pass before merge
  - If critical bug found, revert to previous release and notify team
  ```

# Backend Architecture Overview for AI-Assisted Refactoring

## Purpose
This section provides a structured overview of the backend architecture, key modules, and conventions for the trading-helper-bot project. It is designed to help AI agents (and human developers) safely and effectively plan and execute backend refactors.

## Key Backend Folders & Responsibilities
- **`src/services/`**: Core backend services, including:
  - `DatabaseService.ts`: Handles all database access and queries.
  - `AnalyticsDataService.ts`: Provides normalized trade data and analytics.
- **`src/features/`**: Feature engineering pipeline.
  - `core/computeFeaturesForBatch.ts`: Main entry for batch feature computation.
  - Additional feature modules for specific analytics (e.g., RSI, MACD, win/loss streaks).
- **`src/models/`**: TypeScript types and interfaces for trades, features, and analytics data.
- **`src/utils/`**: Utility functions, including helpers for rule engines and data normalization.
- **`hmm-service/models/`**: Specialized models for HMM or advanced analytics (if used).

## Data Flow
1. **Data Ingestion**: Raw trade data is imported (see `import/` and `public/` for sample CSVs).
2. **Normalization**: `AnalyticsDataService` processes and normalizes data.
3. **Feature Calculation**: `computeFeaturesForBatch` and related functions compute features for each trade or batch.
4. **Storage/Access**: Results are stored or made available via services for UI and ML scripts.

## Coding Conventions & Patterns
- All feature functions should be **pure** and **batch-aware**.
- Services should be **stateless** where possible and use dependency injection for testability.
- Type safety is enforced via interfaces in `src/models/`.
- Use **Taskmaster** to log all planned refactors, with detailed plans and file references.

## Example: Adding a New Feature
1. Create a new feature module in `src/features/`.
2. Update `computeFeaturesForBatch.ts` to include the new feature.
3. Add/update types in `src/models/` as needed.
4. Write unit tests in `src/__tests__/` or `src/features/__tests__/`.
5. Log the change as a Taskmaster subtask, referencing all affected files.

## For AI Agents: How to Use This Doc
- **Reference actual file paths and function names** when planning or making changes.
- **Update this documentation** if you introduce new patterns, modules, or conventions.
- **Log all refactor plans and decisions** in Taskmaster, including before/after code snippets and reasoning.
- **Check for related rules** in `.roo/rules/` and update as needed.
- **Ask for human review** if a change affects core data flow or service contracts.

# Backend Architecture Overview and Data Flow

## High-Level Architecture

```mermaid
graph TD
    A[Data Import (import/)] --> B[Preprocessing & Feature Engineering (hmm-service/ & src/features/)]
    B --> C[Database Storage (src/services/DatabaseService.ts)]
    C --> D[Analytics & Model Training (scripts/, src/services/AnalyticsDataService.ts)]
    D --> E[UI/API Consumption (src/pages/, src/components/)]
```

## Major Backend Components
- **`import/`**: Raw trade and market data files (CSV, etc.) are placed here for ingestion.
- **`hmm-service/`**: Python service for advanced preprocessing, feature engineering, and HMM-based analytics. Handles data ingestion, transformation, and model training.
- **`src/features/`**: TypeScript feature engineering pipeline for batch and real-time feature computation.
- **`src/services/DatabaseService.ts`**: Centralized database access and management. Handles normalized trade storage and queries.
- **`src/services/AnalyticsDataService.ts`**: Provides analytics-ready data to the UI and scripts.
- **`data/`**: Stores derived features, model outputs, and analytics artifacts (e.g., features.json).
- **`scripts/`**: Automation scripts for exporting features, training models, and data management.

## Data Flow Narrative
1. **Data Ingestion**: Raw trade/market data is placed in `import/` (or uploaded via UI).
2. **Preprocessing & Feature Engineering**: Data is processed by `hmm-service/` (Python) and/or `src/features/` (TypeScript) to compute features and clean data.
3. **Database Storage**: Processed, normalized data is stored via `DatabaseService.ts`.
4. **Analytics & Model Training**: Scripts in `scripts/` and services like `AnalyticsDataService.ts` access the database, compute analytics, and train models. Outputs are saved in `data/`.
5. **UI/API Consumption**: The UI (React components/pages) and APIs consume analytics data for visualization and user interaction.

> **Note for AI Agents:**
> - Always trace the data lineage from `import/` through feature engineering to `data/` and the database.
> - Refactor with awareness of cross-language boundaries (Python ↔ TypeScript) and shared data schemas.
> - Update this section if new services, data flows, or major refactors are introduced.

# Backend Coding Conventions and Design Patterns

## Stateless Services
- Services in `src/services/` (e.g., `DatabaseService.ts`, `AnalyticsDataService.ts`) are designed to be stateless where possible.
- Avoid storing mutable state in service instances; use function parameters and return values for data flow.

## Dependency Injection
- Pass dependencies (e.g., database clients, config) as function arguments or constructor parameters.
- Example:
  ```typescript
  // src/services/DatabaseService.ts
  export class DatabaseService {
    constructor(private dbClient: DBClient) {}
    // ...
  }
  ```

## Error Handling & Logging
- Use try/catch blocks for async operations and log errors with context.
- Keep `console.log` and debug statements during development (see `.roo/rules/examples/console_log.mdc`).
- Remove or replace with production logging before release.
- Example:
  ```typescript
  try {
    const result = await db.query(...);
    return result;
  } catch (err) {
    console.log('Database query failed:', err);
    throw err;
  }
  ```

## Type Safety
- All data models and service interfaces are defined in `src/models/`.
- Use TypeScript interfaces/types for all function signatures and data structures.
- Example:
  ```typescript
  // src/models/Trade.ts
  export interface Trade {
    id: string;
    symbol: string;
    entryTime: Date;
    // ...
  }
  ```

## Feature Function Purity
- Feature functions in `src/features/` should be pure (no side effects, deterministic output).
- Batch-aware: Accept arrays of trades and return arrays of features.
- Example:
  ```typescript
  // src/features/core/computeFeaturesForBatch.ts
  export function computeFeaturesForBatch(trades: Trade[]): Feature[] {
    // ...
  }
  ```

## Rule Maintenance
- When new patterns or conventions are established, update or add rules in `.roo/rules/`.
- Reference [roo_rules.md](mdc:.roo/rules/roo_rules.md) and [self_improve.md](mdc:.roo/rules/self_improve.md) for rule authoring guidelines.

# AI-Specific Refactoring Guidelines

## Step-by-Step Process for AI Agents

1. **Analyze Folder Structure and Data Flow**
   - Review the latest backend documentation sections: architecture overview, data flow, and folder mapping.
   - Use the `src/services/`, `src/features/`, `hmm-service/`, and `data/` directories as starting points.
   - Trace the flow of data from ingestion (`import/`, `hmm-service/`) through feature engineering (`src/features/`) to analytics and storage (`src/services/`, `data/`).

2. **Identify Safe Refactoring Boundaries**
   - Limit changes to one module or service at a time (e.g., only `DatabaseService.ts` or a single feature module).
   - Avoid cross-language refactors (Python ↔ TypeScript) unless explicitly planned and reviewed.
   - Do not change public interfaces (types in `src/models/`, service method signatures) without updating all dependents and documenting the change.

3. **Log Plans and Decisions in Taskmaster**
   - Before making changes, create or update a Taskmaster subtask with a detailed plan:
     - List affected files and functions.
     - Describe intended changes and reasoning.
     - Note any risks or required test updates.
   - Example:
     ```sh
     task-master update-subtask --id=26.4 --prompt="Plan: Refactor DatabaseService to use async/await. Update all service consumers."
     ```

4. **Request Human Review for Risky Changes**
   - If a change affects core data flow, shared models, or cross-language boundaries, set the subtask status to `review` and request human input.
   - Example:
     ```sh
     task-master set-status --id=26.4 --status=review
     ```
   - Add a note in the documentation and Taskmaster log describing why review is needed.

5. **Update Documentation and Rules**
   - After completing a refactor, update this documentation and any relevant rules in `.roo/rules/` to reflect new patterns or conventions.
   - Reference actual file paths and code snippets in your updates.
   - Example:
     ```sh
     # Update backend-refactor-workflow.md and add a new rule in .roo/rules/
     ```

## Example: Safe Refactor Workflow
1. Propose refactor in Taskmaster with detailed plan.
2. Make incremental, testable changes in a single module.
3. Run and update tests in `src/__tests__/` or relevant test folders.
4. Log progress and findings in Taskmaster.
5. Request review if needed.
6. Update documentation and rules after completion.

# Backend Data Access & Preprocessing: Audit and Test Coverage Log (2024-06)

## Audit Summary
- **Reviewed Modules:**
  - `src/services/ExportService.ts`, `AccountService.ts`, `NinjaTraderExportService.ts`, `ImportToDatabaseService.ts`, `IBKRIntegrationService.ts`, `AnalyticsDataService.ts`
  - `src/features/` (feature pipeline, feature definitions)
  - `src/utils/` (utility functions for parsing, validation, formatting)

## Test Coverage Findings
- **Tested:**
  - Feature functions (`tradeDuration`, `tradePL`) via `src/features/core/tradeFeatures.test.ts`
  - Utility validation and mapping via `src/utils/__tests__/`
  - Database and reconciliation via `src/services/__tests__/`
- **Needs More Tests:**
  - `ExportService` (all static methods)
  - `NinjaTraderExportService` (export logic)
  - `ImportToDatabaseService` (import logic, error handling)
  - `IBKRIntegrationService` (integration and batch import)
  - All feature definitions and async features (e.g., `marketRegimeFeature`)
  - Analytics data preprocessing in `AnalyticsDataService`

## Lessons Learned
- **Centralize test files** for each service/feature in a `__tests__` folder for discoverability.
- **Ensure every exported function/class** has at least one unit test covering normal, edge, and error cases.
- **Use Jest** for all TypeScript modules; target 90%+ coverage.
- **Log coverage results** and update this section after each audit.
- **Document new patterns** in `.roo/rules/` if new conventions or best practices emerge during refactoring.

## Next Steps
- Scaffold missing Jest test files for uncovered modules.
- Run the test suite and update this log with coverage results.
- Repeat audit after major refactors or before releases.

## Test Scaffolding Log (2024-06)
- Scaffolded Jest test files for all uncovered backend modules:
  - `ExportService`, `NinjaTraderExportService`, `ImportToDatabaseService`, `IBKRIntegrationService`, `AnalyticsDataService`, and all feature definitions (including async features).
- Each test file includes stubs for all exported functions/classes, with TODOs for normal, edge, and error cases.
- Next step: Implement the tests and run the suite to measure and improve coverage. 