# Trading Helper Bot - Developer Guide

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Set up the development database:
```bash
yarn seed:db
```
This command will populate the database with sample trades for testing.

## Development

### Running the App
```bash
yarn start
```

### Testing
```bash
# Run all tests
yarn test

# Run Cypress tests
yarn cypress:open

# Run Cypress tests headless
yarn cypress:run
```

### Database Operations
- `yarn seed:db` - Reset and seed the database with test data
- `yarn db:reset` - Clear all data from the database
- `yarn db:backup` - Create a backup of the current database

## Code Structure

- `src/components/` - React components
- `src/services/` - Business logic and data access
- `src/utils/` - Helper functions and utilities
- `src/types/` - TypeScript type definitions
- `src/pages/` - Page components
- `__tests__/` - Test files

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests (`yarn test`)
4. Submit a pull request

## Troubleshooting

If you encounter database issues:
1. Run `yarn db:reset` to clear the database
2. Run `yarn seed:db` to reseed with test data
3. Restart the development server 