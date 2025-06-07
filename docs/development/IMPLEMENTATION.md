# Implementation Guide for Cursor

## Project Overview

This guide provides instructions for implementing the Trading Helper Bot using the provided project structure. As the engineering partner (cursor), you'll be focusing on building this application based on the architecture plan.

## First Demo Goal

The first demo should deliver a working dashboard that:
1. Shows account information
2. Displays a chart showing $100 monthly deposits through December
3. Has placeholder navigation to Options and Futures modules
4. Allows basic account customization in Settings
5. Runs as a desktop application on macOS

## Implementation Tasks

### 1. Project Setup (1-2 hours)
- [x] Create React + TypeScript project
- [x] Set up Electron
- [x] Configure Tailwind CSS
- [x] Set up folder structure

### 2. Core Components (3-4 hours)
- [ ] Implement Account models
- [ ] Create projection calculation service
- [ ] Build UI components:
  - [ ] Navigation
  - [ ] Account Card
  - [ ] Projection Chart
  - [ ] Projection Summary

### 3. Pages (2-3 hours)
- [ ] Dashboard page
- [ ] Options placeholder page
- [ ] Futures placeholder page
- [ ] Settings page

### 4. Data Storage (1-2 hours)
- [ ] Implement local storage for account data
- [ ] Create account service

### 5. Electron Integration (1-2 hours)
- [ ] Configure Electron for desktop app
- [ ] Set up build process for macOS

### 6. Testing & Polishing (2-3 hours)
- [ ] Verify all features work correctly
- [ ] Polish UI for demo presentation
- [ ] Test on macOS

## Implementation Notes

### Account Data Structure
Use the provided Account model:
```typescript
interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  lastUpdated: Date;
  monthlyDeposit?: number;
}
```

### Projection Calculation
Follow this algorithm for calculating monthly projections:
1. Start with current account balance
2. Add monthly deposit for each month remaining in 2025
3. Store month name and balance in projection array
4. Display in chart component

### Local Storage
Store account data in browser localStorage to persist between sessions.

### UI Guidelines
- Use Tailwind CSS for styling
- Follow the provided UI mockups
- Ensure responsive design for different window sizes

## Testing Points
1. Account creation and update
2. Monthly deposit addition
3. Projection calculations
4. Chart rendering
5. Navigation between pages
6. Settings persistence

## Preparing for the Demo
1. Create a simple installer or executable
2. Prepare a demonstration script
3. Create sample account with initial data
4. Prepare to show chart updating with monthly deposits

## Future Integration Notes
- Plan for C# compatibility with NinjaTrader
- Design modules with future AI strategy integration in mind
- Document APIs for integration points

## Questions?
If you need clarification on any aspect of the implementation, please ask before making significant architecture changes to avoid scope creep. 