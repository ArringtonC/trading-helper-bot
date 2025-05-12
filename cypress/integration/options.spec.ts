/// <reference types="cypress" />
/// <reference types="cypress-file-upload" />

describe('Options Trading Dashboard Page', () => {
  beforeEach(() => {
    // Set up initial data in localStorage
    cy.window().then((win: Window) => {
      // Clear existing data
      win.localStorage.clear();

      // Set up a sample account
      const sampleAccount = {
        id: 'demo1',
        name: 'Demo Account',
        type: 'options'
      };
      win.localStorage.setItem('trading-helper-accounts', JSON.stringify([sampleAccount]));

      // Set up sample portfolio data
      const samplePortfolio = {
        id: 'demo1',
        accountId: 'demo1',
        cumulativePL: 1600.32,
        trades: Array.from({ length: 30 }, (_, i) => ({
          id: `trade-${i + 1}`,
          symbol: 'SPY',
          putCall: i % 2 === 0 ? 'CALL' : 'PUT',
          strike: 470 + i,
          expiry: '2024-05-17',
          quantity: 1,
          premium: 2.45,
          openDate: `2024-04-${15 + Math.floor(i / 10)}`,
          strategy: 'Day Trade',
          commission: 1.30,
          tradePL: 53.34
        }))
      };
      win.localStorage.setItem('options_portfolios', JSON.stringify({
        'demo1': samplePortfolio
      }));
    });
  });

  it('loads and shows the heading', () => {
    // Visit the "options" route
    cy.visit('/options');

    // Assert the heading is present
    cy.get('[data-testid="options-heading"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Options Trading Dashboard');

    // Assert the main container exists
    cy.get('[data-testid="options-container"]')
      .should('exist');
  });

  it('imports trades from CSV file', () => {
    // Visit the options dashboard first
    cy.visit('/options');

    // Wait for the dashboard to load
    cy.get('[data-testid="options-heading"]', { timeout: 10000 })
      .should('be.visible');

    // Click the import link
    cy.contains('Import Account Data')
      .should('be.visible')
      .click();

    // The CSV picker should be visible
    cy.get('[data-testid="import-csv-input"]', { timeout: 10000 })
      .should('exist')
      .attachFile('sample.csv');

    // Click the Import button to run the parser
    cy.get('[data-testid="btn-import-trades"]')
      .should('not.be.disabled')
      .click();

    // Wait for import to complete and verify success message
    cy.contains('Import completed successfully', { timeout: 10000 })
      .should('be.visible');

    // Wait for a moment to ensure the import is complete
    cy.wait(2000);

    // Wait for trades table to be visible
    cy.get('[data-testid="trades-table"]', { timeout: 10000 })
      .should('be.visible');

    // Wait for and assert the real summary P&L and counts
    cy.get('[data-testid="total-pl"]', { timeout: 10000 })
      .should('be.visible')
      .invoke('text')
      .should('include', '$1,600.32');

    cy.get('[data-testid="win-rate"]')
      .should('be.visible')
      .invoke('text')
      .should('include', '0%');

    cy.get('[data-testid="trade-count"]')
      .should('be.visible')
      .invoke('text')
      .should('include', '30 open / 0 closed');

    // Verify the trades table is populated
    cy.get('[data-testid="trades-table"] tbody tr')
      .should('have.length', 30);

    // Spot-check a couple of P&L cells
    cy.get('[data-testid="trade-pl"]')
      .first()
      .should('contain', '$53.34');
  });
}); 