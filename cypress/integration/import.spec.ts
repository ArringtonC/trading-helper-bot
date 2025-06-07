/// <reference types="cypress" />
/// <reference types="cypress-file-upload" />

interface TestWindow extends Window {
  localStorage: Storage;
}

describe('Options Trading Dashboard – Import Flow', () => {
  beforeEach(() => {
    // Set up sample data in localStorage
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

    // Visit the dashboard URL
    cy.visit('http://localhost:3000');

    // Wait for loading to complete
    cy.get('div').contains('Loading accounts...').should('not.exist');

    // Wait for the dashboard to be ready
    cy.get('h1').contains('Dashboard').should('be.visible');
  });

  it('navigates to the dashboard and clicks the Import button', () => {
    // Visit the dashboard
    cy.visit('/');

    // Wait for loading to complete
    cy.get('[data-testid="loading"]').should('not.exist');

    // Look for the import link and click it
    cy.contains('Import Account Data').click();

    // Wait for the import form to appear
    cy.get('[data-testid="import-form"]').should('be.visible');

    // Get the file input and attach the CSV file
    cy.get('[data-testid="file-input"]')
      .attachFile('sample_statement.csv');

    // Click the import button
    cy.get('[data-testid="btn-import-trades"]').click();

    // Verify successful import
    cy.contains('Import successful').should('be.visible');

    // Verify we're back on the dashboard
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
}); 