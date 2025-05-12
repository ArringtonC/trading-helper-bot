// Import commands.js using ES2015 syntax:
import './commands';
import 'cypress-file-upload';

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      // Add custom commands here
      intercept(method: string, url: string, response: any): Chainable<null>
    }
  }
}

// Prevent uncaught exception warnings from failing tests
Cypress.on('uncaught:exception', (err) => {
  // returning false here prevents Cypress from failing the test
  return false;
});

// Add any other custom commands or global configuration here 