/// <reference types="cypress" />

import { OptionStrategy } from '../../src/types/options';

declare global {
  namespace Cypress {
    interface Window {
      localStorage: Storage;
    }
  }
}

describe('Trade Table Sorting', () => {
  beforeEach(() => {
    // Load edge case fixture
    cy.fixture('edge-case-trades.json').then((fixture: { trades: any[] }) => {
      // Mock localStorage
      cy.window().then((win: Cypress.Window) => {
        win.localStorage.setItem('options_portfolios', JSON.stringify({
          'test-account': {
            id: 'test-portfolio',
            accountId: 'test-account',
            trades: fixture.trades
          }
        }));
        win.localStorage.setItem('trading-helper-accounts', JSON.stringify([
          {
            id: 'test-account',
            name: 'Test Account'
          }
        ]));
      });
    });

    // Visit the options page
    cy.visit('/options');
  });

  describe('Column Sorting', () => {
    it('sorts by symbol when clicking the Symbol header', () => {
      // Click the Symbol header
      cy.get('[data-testid="header-symbol"]').click();

      // Check ascending order (empty string should be first)
      cy.get('[data-testid^="symbol-"]').then(($symbols: JQuery<HTMLElement>) => {
        const symbols = $symbols.toArray().map(el => el.textContent || '');
        expect(symbols).to.deep.equal(['', 'AAPL', 'SPY']);
      });

      // Click again for descending order
      cy.get('[data-testid="header-symbol"]').click();

      // Check descending order (empty string should be last)
      cy.get('[data-testid^="symbol-"]').then(($symbols: JQuery<HTMLElement>) => {
        const symbols = $symbols.toArray().map(el => el.textContent || '');
        expect(symbols).to.deep.equal(['SPY', 'AAPL', '']);
      });
    });

    it('sorts by P&L when clicking the P&L header', () => {
      // Click the P&L header
      cy.get('[data-testid="header-pl"]').click();

      // Check ascending order
      cy.get('[data-testid^="pl-"]').then(($pls: JQuery<HTMLElement>) => {
        const pls = $pls.toArray().map(el => parseFloat((el.textContent || '0').replace('$', '')));
        expect(pls).to.deep.equal([-50, 100, 100]);
      });

      // Click again for descending order
      cy.get('[data-testid="header-pl"]').click();

      // Check descending order
      cy.get('[data-testid^="pl-"]').then(($pls: JQuery<HTMLElement>) => {
        const pls = $pls.toArray().map(el => parseFloat((el.textContent || '0').replace('$', '')));
        expect(pls).to.deep.equal([100, 100, -50]);
      });
    });

    it('handles null values in premium sorting', () => {
      // Click the Premium header
      cy.get('[data-testid="header-premium"]').click();

      // Check ascending order (null/0 should be first)
      cy.get('[data-testid^="premium-"]').then(($premiums: JQuery<HTMLElement>) => {
        const premiums = $premiums.toArray().map(el => {
          const text = el.textContent || '';
          return text === '-' ? 0 : parseFloat(text);
        });
        expect(premiums).to.deep.equal([0, 0, 5.25]);
      });
    });
  });

  describe('Filtering and Grouping', () => {
    it('filters trades by search text', () => {
      // Type in search box
      cy.get('input[placeholder="Search trades..."]').type('SPY');

      // Verify only SPY trades are shown
      cy.get('[data-testid^="symbol-"]').should('have.length', 1);
      cy.get('[data-testid^="symbol-"]').should('contain', 'SPY');
    });

    it('groups trades by symbol', () => {
      // Select symbol grouping
      cy.get('select').select('Group by Symbol');

      // Verify group headers exist (including empty symbol group)
      cy.contains('(Empty) (1)').should('exist');
      cy.contains('AAPL (1)').should('exist');
      cy.contains('SPY (1)').should('exist');

      // Click to expand a group
      cy.contains('AAPL (1)').click();

      // Verify trade is shown in group
      cy.get('[data-testid^="symbol-"]').should('contain', 'AAPL');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty trade list gracefully', () => {
      // Clear trades
      cy.window().then((win: Cypress.Window) => {
        win.localStorage.setItem('options_portfolios', JSON.stringify({
          'test-account': {
            id: 'test-portfolio',
            accountId: 'test-account',
            trades: []
          }
        }));
      });

      // Reload page
      cy.reload();

      // Verify empty state is shown
      cy.contains('No trades found').should('exist');
    });

    it('maintains sort order when trades are updated', () => {
      // Sort by symbol ascending
      cy.get('[data-testid="header-symbol"]').click();

      // Add new trade
      cy.window().then((win: Cypress.Window) => {
        const portfolios = JSON.parse(win.localStorage.getItem('options_portfolios')!);
        portfolios['test-account'].trades.push({
          id: '4',
          symbol: 'MSFT',
          putCall: 'CALL',
          strike: 300,
          expiry: new Date('2024-12-20').toISOString(),
          quantity: 1,
          premium: 4.50,
          openDate: new Date('2024-01-03').toISOString(),
          strategy: OptionStrategy.LONG_CALL,
          commission: 0.65,
          tradePL: 75
        });
        win.localStorage.setItem('options_portfolios', JSON.stringify(portfolios));
      });

      // Verify sort order is maintained
      cy.get('[data-testid^="symbol-"]').then(($symbols: JQuery<HTMLElement>) => {
        const symbols = $symbols.toArray().map(el => el.textContent || '');
        expect(symbols).to.deep.equal(['', 'AAPL', 'MSFT', 'SPY']);
      });
    });
  });
}); 