# Trading Helper Bot

A comprehensive trading assistant application that helps you manage and analyze your options trading portfolio. Built with React, TypeScript, and modern web technologies.

## Features

- **Options Portfolio Management**
  - Track open and closed options positions
  - Detailed position analysis and P&L tracking
  - Calendar view for expiration dates
  - Position details with trade history

- **IBKR Integration**
  - Import trades directly from Interactive Brokers
  - Parse activity statements automatically
  - Convert IBKR trades to internal format

- **Portfolio Analysis**
  - Real-time P&L calculations
  - Portfolio statistics and metrics
  - Risk analysis and position sizing recommendations

- **HMM Regime Prediction with VIX Integration**
  - Advanced Hidden Markov Model for market regime prediction
  - VIX (Volatility Index) integration for enhanced accuracy
  - Real-time volatility analysis and stress detection
  - Comprehensive evaluation framework with statistical validation

- **Data Export**
  - Export portfolio data in various formats
  - Customizable export options
  - Historical data tracking

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Python 3.8+ (for HMM service)
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ArringtonC/trading-helper-bot.git
   cd trading-helper-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   REACT_APP_API_URL=http://localhost:3000
   ```

4. Set up the HMM service:
   ```bash
   cd hmm-service
   pip install -r requirements.txt
   ```

5. (Optional) Add VIX data file:
   ```bash
   # Place your VIX CSV file in the data directory
   cp /path/to/your/vix_data.csv data/vix.csv
   ```
   
   See [VIX Integration Guide](docs/VIX_INTEGRATION.md) for detailed setup instructions.

## Development

1. Start the development server:
   ```bash
   npm start
   ```

2. Start the HMM service (in a separate terminal):
   ```bash
   cd hmm-service
   python3 app.py
   ```

3. Run tests:
     ```bash
     npm test
     ```

4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── options/       # Options-specific components
│   └── ...
├── pages/             # Page components
├── services/          # Business logic and API services
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── __tests__/         # Test files
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App

## Testing

The application uses Jest and React Testing Library for testing. Run the test suite with:

```bash
npm test
```

For coverage reports:
```bash
npm test -- --coverage
```

## Documentation

🎯 **[Complete App Overview & Demo Guide](docs/APP_OVERVIEW_AND_DEMO.md)** - **NEW!** Comprehensive feature walkthrough

📚 **[Complete Documentation Index](docs/README.md)** - Organized documentation by category

All project documentation has been organized into the `docs/` folder by category:

- **🔌 API Documentation** (`docs/api/`) - IBKR API integration guides
- **💻 Development** (`docs/development/`) - Setup, implementation, and architecture docs
- **📋 Planning** (`docs/planning/`) - PRDs, task lists, and improvement plans
- **🧪 Testing** (`docs/testing/`) - Test plans, status, and validation summaries
- **🎓 Tutorials** (`docs/tutorials/`) - User flows and tutorial documentation
- **🚀 Deployment** (`docs/deployment/`) - Security and deployment guides

### Quick Links
- **[Developer Setup Guide](docs/development/README_DEV.md)** - Start here for development setup
- **[Product Requirements](docs/planning/PRD.md)** - Current product specifications
- **[API Integration](docs/api/IBKR_API_DEMO_GUIDE.md)** - IBKR API implementation guide
- **[Task Status](docs/planning/tasklist.md)** - Current project tasks and priorities
- **[Test Status](docs/testing/test-status.md)** - Testing status and results

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React and the React team
- TypeScript team
- All contributors and users of this project

## Trade Table Sorting

The trade table supports sorting by the following fields:

- `symbol`: Sort by ticker symbol
- `type`: Sort by option type (PUT/CALL)
- `strike`: Sort by strike price
- `expiry`: Sort by expiration date
- `quantity`: Sort by position size
- `premium`: Sort by option premium
- `openDate`: Sort by trade open date
- `closeDate`: Sort by trade close date
- `pl`/`pnl`: Sort by profit/loss

Click any column header to sort by that field. Click again to reverse the sort order.

### Sorting Tests

The sorting functionality is thoroughly tested:

1. Unit tests in `src/__tests__/sorting.test.ts`:
   - Basic sorting functionality
   - Edge cases (null values, ties)
   - Performance with large datasets

2. UI tests in `cypress/integration/sorting.spec.ts`:
   - Column header click behavior
   - Sort direction toggle
   - Filtering and grouping interaction
   - Edge cases (empty lists, data updates)

To run sorting tests specifically:

```bash
# Run unit tests
npm test sorting

# Run Cypress sorting tests
npm run cypress:open
# Then select sorting.spec.ts
```

## Recent Development Highlights

The conversation documents a comprehensive, iterative development and debugging process for a trading helper bot, focusing on a dynamic rule engine and its integration with a React UI. Here's a detailed summary:

### **1. GoalSizingWizard Enhancements**
- The user enhanced the `GoalSizingWizard.tsx` to support dynamic position sizing rules based on trading objectives (Growth, Drawdown, Income, Capital Objective).
- Added new steps for "Capital Objective" (inputs: `currentBalance`, `targetBalance`, `timeHorizon`, etc.) and trade statistics.
- Implemented sizing solvers (`solveFixedFractionalF`, `calculateKellyFraction`) and displayed solver recommendations.
- Added best-practice suggestions for "Max Position Size" and "Max Total Exposure" based on risk tolerance.
- Developed and debugged component tests using React Testing Library and Jest, resolving issues with test discovery, JSX transformation, and label associations.
- Improved the UI/UX for the summary step, including dollar value calculations and a visually enhanced summary card.
- Updated the PRD with an "Accomplishments" section summarizing these features.

### **2. Taskmaster Workflow**
- The user used Taskmaster to manage tasks, subtasks, and workflow, following a structured process for breaking down, expanding, and updating tasks.
- Moved through tasks related to building a dynamic size-throttle rule engine, including schema design, evaluation logic, and implementation subtasks.

### **3. Rule Engine Development**
- Designed a flexible JSON rule schema and implemented it as a TypeScript interface.
- Built the Action Executor module (`executeAction`) with support for multiple action types and robust error handling, and wrote unit tests for it.
- Developed the Condition Evaluator (`evaluateCondition`) to handle simple and compound conditions, supporting all relevant operators.
- Scaffolded the Rule Engine Core (`evaluateAndExecuteRules`), integrating the condition evaluator and action executor, and added advanced features:
  - Event emitter and structured logging hooks.
  - Scheduling support via `executeAt`.
  - Type safety and extensibility.
- Fixed linter errors and ensured robust type checking throughout.

### **4. UI Integration and Demo**
- Created a new page, `RuleEngineDemo.tsx`, to demonstrate the rule engine in action.
- Connected the demo to real trading data from the OptionsDB page using a global TradesContext.
- Allowed users to select a trade or use manual input, and evaluate rules with computed context (consecutive losses, account balance).
- Added logs and debug statements to trace evaluation and button state.
- Enhanced the demo with:
  - Spinner/progress indicator during evaluation.
  - Disabled inputs during evaluation.
  - Batch evaluation mode with a results table showing which trades triggered rules and what actions were taken.
  - Clear log button and summary of batch results.
  - UI polish for clarity and feedback.

### **5. Testing and Quality**
- Outlined and began implementing a comprehensive, long-term test plan:
  - Unit tests for condition evaluator, action executor, and rule engine core.
  - Integration tests for end-to-end rule evaluation.
  - Performance and regression tests.
  - Test skeletons and initial cases were scaffolded for all major modules.

### **6. Debugging and Issue Resolution**
- Addressed issues with button state, React state updates, and UI interactivity.
- Used console logs and browser dev tools to confirm correct state transitions and DOM updates.
- Ensured the button was re-enabled after evaluation and that the UI responded as expected.

### **7. Next Steps**
- The user confirmed satisfaction with the current state of the rule engine demo and batch evaluation features.
- Moved on to the next subtask: creating comprehensive unit and integration tests for the rule engine, following the best long-term plan for maintainability and coverage.

**Overall, the conversation demonstrates a thorough, best-practice approach to building, testing, and integrating a dynamic rule engine in a trading application, with strong attention to UX, code quality, and maintainability.**
