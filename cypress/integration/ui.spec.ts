/// <reference types="cypress" />
import { IBKRTradeRecord } from '../../src/types/ibkr';

interface TestWindow extends Window {
  localStorage: Storage;
}

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      intercept(method: string, url: string, response: any): Chainable<null>
    }
  }
}

describe('Options Trading Dashboard UI', () => {
  beforeEach(() => {
    // Set up sample data in localStorage
    cy.window().then((win: Window) => {
      // Set up a sample account
      const sampleAccount = {
        id: 'demo1',
        name: 'Demo Account',
        type: 'options'
      };
      win.localStorage.setItem('trading-helper-accounts', JSON.stringify([sampleAccount]));

      // Set up sample portfolio data with cumulative P&L
      const samplePortfolio = {
        id: 'demo1',
        accountId: 'demo1',
        cumulativePL: 1629.82,
        trades: [
          {
            id: '1',
            symbol: 'SPY',
            putCall: 'CALL',
            strike: 470,
            expiry: '2024-05-17',
            quantity: 1,
            premium: 2.45,
            openDate: '2024-04-15',
            closeDate: '2024-04-16',
            strategy: 'Day Trade',
            commission: 1.30,
            tradePL: 53.34
          },
          {
            id: '2',
            symbol: 'SPY',
            putCall: 'PUT',
            strike: 465,
            expiry: '2024-05-17',
            quantity: 1,
            premium: 1.95,
            openDate: '2024-04-15',
            strategy: 'Day Trade',
            commission: 1.30,
            tradePL: 0
          }
        ]
      };
      win.localStorage.setItem('options_portfolios', JSON.stringify({
        'demo1': samplePortfolio
      }));
    });

    // Visit the dashboard
    cy.visit('/');
    
    // Debug: Log the initial state
    cy.window().then((win: Window) => {
      // Verify that localStorage has been set up correctly
      const accounts = JSON.parse(win.localStorage.getItem('trading-helper-accounts') || '[]');
      const portfolios = JSON.parse(win.localStorage.getItem('options_portfolios') || '{}');
      
      cy.log('Initial state:');
      cy.log('Accounts: ' + JSON.stringify(accounts));
      cy.log('Portfolios: ' + JSON.stringify(portfolios));
      
      expect(accounts).to.have.length(1);
      expect(accounts[0].id).to.equal('demo1');
      expect(portfolios['demo1']).to.exist;
      expect(portfolios['demo1'].cumulativePL).to.equal(1629.82);
    });
    
    // Wait for loading to complete
    cy.get('div').contains('Loading accounts...').should('not.exist');
    
    // Debug: Log elements with data-testid attributes
    cy.get('[data-testid]').then(($elements) => {
      cy.log('Found elements with data-testid:');
      $elements.each((i, el) => {
        cy.log(`${i + 1}. ${el.getAttribute('data-testid')}`);
      });
    });
    
    // Wait for data to be loaded by checking for the P&L value
    cy.get('[data-testid="total-pl"]', { timeout: 30000 })
      .should('exist')
      .and('contain', '$1,629.82');
    
    // Now wait for the trades table
    cy.get('[data-testid="trades-table"]', { timeout: 30000 }).should('exist');
  });

  it('displays correct cumulative P&L and position counts from activity statement', () => {
    // Check the header card P&L
    cy.get('[data-testid="total-pl"]')
      .should('contain', '$1,629.82');

    // Check the debug export panel P&L
    cy.get('[data-testid="debug-total-pl"]')
      .should('contain', 'Total P&L: $1,629.82');

    // Check position counts
    cy.get('[data-testid="trade-count"]')
      .should('contain', '1 open / 1 closed');
  });

  it('displays correct values from options-debug.csv', () => {
    // Set up the options-debug.csv data
    cy.window().then((win: Window) => {
      const debugPortfolio = {
        id: 'demo1',
        accountId: 'demo1',
        cumulativePL: -63.74,
        trades: [
          {
            id: '3',
            symbol: 'SPY',
            putCall: 'CALL',
            strike: 472.5,
            expiry: '2024-05-17',
            quantity: 1,
            premium: 1.75,
            openDate: '2024-04-15',
            strategy: 'Day Trade',
            commission: 1.30,
            tradePL: 0
          }
        ]
      };
      win.localStorage.setItem('options_portfolios', JSON.stringify({
        'demo1': debugPortfolio
      }));

      // Reload the page to see the new data
      cy.reload();

      // Wait for loading to complete
      cy.get('div').contains('Loading accounts...').should('not.exist');

      // Wait for data to be loaded
      cy.get('[data-testid="total-pl"]', { timeout: 30000 })
        .should('exist')
        .and('contain', '-$63.74');

      // Wait for trades table
      cy.get('[data-testid="trades-table"]', { timeout: 30000 }).should('exist');

      // Check position counts
      cy.get('[data-testid="trade-count"]')
        .should('contain', '1 open / 0 closed');
    });
  });

  it('renders the correct header cards', () => {
    // Total P&L
    cy.get('[data-testid="total-pl"]')
      .should('contain', '$1,600.32');

    // Win Rate
    cy.get('[data-testid="win-rate"]')
      .should('contain', '100%');

    // Trade Count
    cy.get('[data-testid="trade-count"]')
      .should('contain', '3 closed / 0 open');
  });

  it('renders the trades table with correct P&L values', () => {
    // First row
    cy.get('[data-testid="trades-table"] tbody tr').eq(0)
      .find('[data-testid="trade-pl"]')
      .should('contain', '$53.34');

    // Second row
    cy.get('[data-testid="trades-table"] tbody tr').eq(1)
      .find('[data-testid="trade-pl"]')
      .should('contain', '$53.34');

    // Third row
    cy.get('[data-testid="trades-table"] tbody tr').eq(2)
      .find('[data-testid="trade-pl"]')
      .should('contain', '$53.34');
  });

  it('displays correct column headers', () => {
    const expectedHeaders = [
      'Symbol',
      'Type',
      'Strike',
      'Expiry',
      'Quantity',
      'Premium',
      'Open Date',
      'Close Date',
      'P&L'
    ];

    expectedHeaders.forEach(header => {
      cy.get('[data-testid="trades-table"] thead')
        .should('contain', header);
    });
  });

  it('calculates cumulative P&L correctly', () => {
    // Get all P&L values and verify they sum to total
    cy.get('[data-testid="trade-pl"]').then(($cells: JQuery<HTMLElement>) => {
      const values = Array.from($cells)
        .map(cell => parseFloat(cell.textContent?.replace('$', '').replace(',', '') || '0'));
      const sum = values.reduce((acc, val) => acc + val, 0);
      // Use Cypress assertion with tolerance for floating point
      expect(Math.round(sum * 100) / 100).to.equal(160.02); // 3 trades * $53.34
    });
  });
}); 