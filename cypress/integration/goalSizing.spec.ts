describe('Goal Sizing Wizard', () => {
  beforeEach(() => {
    // Monitor console errors
    cy.window().then((win) => {
      cy.stub(win.console, 'error').as('consoleError');
    });
  });

  it('loads and advances without runtime errors', () => {
    // Navigate to goal sizing wizard
    cy.visit('/goal-sizing');
    
    // Wait for wizard to load
    cy.contains(/Step 1/i).should('be.visible');
    
    // Verify no infinite loop errors occurred during initial load
    cy.get('@consoleError').should('not.have.been.calledWithMatch', /Maximum update depth/);

    // Test basic interaction - select a goal type
    cy.get('input[type="radio"]').first().check();
    
    // Click "Next" to advance to step 2
    cy.contains('button', /next/i).click();
    
    // Should advance to step 2
    cy.contains(/Step 2/i).should('be.visible');
    
    // Fill in some basic values if inputs are available
    cy.get('body').then(($body) => {
      if ($body.find('input[type="number"]').length > 0) {
        cy.get('input[type="number"]').first().clear().type('10000');
      }
    });
    
    // Click "Next" again if available
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Next")').length > 0) {
        cy.contains('button', /next/i).click();
      }
    });
    
    // Should still be on the wizard page
    cy.url().should('include', '/goal-sizing');
    
    // Final check - fail if any runtime loop error hit the console
    cy.get('@consoleError').should('not.have.been.calledWithMatch', /Maximum update depth/);
  });

  it('handles back navigation without errors', () => {
    cy.visit('/goal-sizing');
    cy.contains(/Step 1/i).should('be.visible');

    // Select goal type and advance
    cy.get('input[type="radio"]').first().check();
    cy.contains('button', /next/i).click();
    cy.contains(/Step 2/i).should('be.visible');

    // Go back if back button exists
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Back")').length > 0) {
        cy.contains('button', /back/i).click();
        cy.contains(/Step 1/i).should('be.visible');
      }
    });

    // Check for loop errors
    cy.get('@consoleError').should('not.have.been.calledWithMatch', /Maximum update depth/);
  });

  it('cancel button works without errors', () => {
    cy.visit('/goal-sizing');
    cy.contains(/Step 1/i).should('be.visible');

    // Click cancel if available
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Cancel")').length > 0) {
        cy.contains('button', /cancel/i).click();
        // Should navigate away from goal-sizing
        cy.url().should('not.include', '/goal-sizing');
      }
    });

    // Check for loop errors
    cy.get('@consoleError').should('not.have.been.calledWithMatch', /Maximum update depth/);
  });
}); 