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

- **Data Export**
  - Export portfolio data in various formats
  - Customizable export options
  - Historical data tracking

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
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

## Development

1. Start the development server:
   ```bash
   npm start
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Build for production:
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
