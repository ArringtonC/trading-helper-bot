/// <reference types="cypress" />
/// <reference types="cypress-file-upload" />

describe('Fixed Import Page – Direct Flow', () => {
  beforeEach(() => {
    // Set up initial data in localStorage
    cy.window().then((win) => {
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

  it('loads the fixed import page and renders parsed data', () => {
    // 1) Visit the fixed-import URL directly
    cy.visit('/import/fixed-import');

    // 2) The CSV picker should be visible
    cy.get('[data-testid="import-csv-input"]')
      .should('exist')
      .attachFile('sample.csv');

    // 3) Click the Import button to run the parser
    cy.get('[data-testid="btn-import-trades"]')
      .should('not.be.disabled')
      .click();

    // 4) Wait for import to complete and verify success message
    cy.contains('Import completed successfully', { timeout: 10000 })
      .should('be.visible');

    // 5) Visit the dashboard
    cy.visit('/');

    // 6) Wait for the dashboard to load
    cy.get('h1')
      .contains('Dashboard', { timeout: 10000 })
      .should('be.visible');

    // 7) Wait for loading to complete
    cy.contains('Loading accounts...', { timeout: 10000 })
      .should('not.exist');

    // 8) Wait for and assert the real summary P&L and counts
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

    // 9) Verify the trades table is populated
    cy.get('[data-testid="trades-table"] tbody tr')
      .should('have.length', 30);

    // 10) Spot-check a couple of P&L cells
    cy.get('[data-testid="trade-pl"]')
      .first()
      .should('contain', '$53.34');
  });
}); 