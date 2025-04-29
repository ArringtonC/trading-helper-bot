# Tasklist: Options Trading Dashboard — SQLite Integration

## Implementation Tasks

- [x] T1: Create SQLite schema
- [x] T2: Implement CSV → DB import
- [x] T3: Refactor UI to read from DB
- [ ] T4: Cypress database seeding
- [ ] T5: Remove old CSV handling in UI
- [x] T6: Update PRD docs

## Acceptance Criteria

- [x] AC1: Upload valid CSV → 30 trades inserted (30 trades in DB)
- [x] AC2: UI shows correct Total P&L (matches DB summary)
- [x] AC3: Win Rate is calculated correctly (matches number of profitable trades)
- [ ] AC4: Cypress tests run against seeded database (pass 95% without retries)
- [x] AC5: Errors are visible in Debug section if bad CSV is uploaded (errors appear correctly)

## Additional Steps

- [x] Ensure UI header cards (Total P&L, Win Rate, Positions) read from DB
- [x] Ensure trades table is fetched and sorted by dateTime from DB
- [x] Ensure Debug Panel fetches and displays errors from DB
- [ ] Optimize import performance (10k rows < 500ms)
- [ ] Optimize DB query performance (50ms response)
- [ ] Ensure full Cypress suite runs in <2 minutes 

## Recently Completed

- [x] Implement accurate P&L calculation using running totals per symbol
- [x] Fix type issues with getTrades() function
- [x] Update win rate calculation based on closed trades
- [x] Add proper type assertions for database operations 