# Trading Helper Bot

A desktop application for tracking and analyzing trading strategies, with support for options and futures trading.

## Features

### Current Features (First Demo)
- Account dashboard with balance tracking
- Monthly deposit simulation
- Balance projections through December 2025
- Basic chart visualization
- Navigation to placeholder modules

### Upcoming Features
- IBKR account import
- Options trade tracking
- Futures scenario bots
- NinjaTrader export
- AI strategy development
- GPU performance comparison

## Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/trading-helper-bot.git
cd trading-helper-bot
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm start
# or
yarn start
```

4. To run as an Electron app
```bash
npm run electron-dev
# or
yarn electron-dev
```

## Development

### Starting Development
1. Start the React development server:
```bash
npm start
```

2. In a separate terminal, start Electron:
```bash
npm run electron-dev
```

### Troubleshooting
If you encounter any issues with the Electron setup:

- Make sure the `main` field in package.json points to `electron.js`
- Check that all dependencies are installed correctly
- Verify that the `electron-dev` script is configured properly in package.json

### Building for Production
When ready to build the app for the demo:
```bash
npm run electron-pack
```
This will generate distributable files in the `/dist` directory.

## Project Structure

- `/src` - Source code
  - `/components` - Reusable UI components
  - `/pages` - Screen components
  - `/models` - Data models and interfaces
  - `/services` - Business logic
  - `/utils` - Helper functions
  - `/styles` - CSS styles

## Development Roadmap

See the project timeline document for detailed development plans from March through December.

## Avoiding Scope Creep

The project follows strict scope management guidelines:
- Focus on completing the defined features for each monthly demo
- Catalog and prioritize new feature requests separately
- Update UML diagrams to reflect the current state of the system
- Export current capabilities list at the end of each month

## License

This project is licensed under the MIT License - see the LICENSE file for details.
