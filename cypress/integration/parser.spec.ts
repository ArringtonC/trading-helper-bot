/// <reference types="cypress" />
import { IBKRActivityStatementParser } from '../../src/services/brokers/parsers/IBKRActivityStatementParser';
import { IBKRTradeRecord } from '../../src/types/ibkr';
import { FixedIBKRParser } from '../../src/services/brokers/parsers/FixedIBKRParser';

describe('IBKR Activity Statement Parser', () => {
  let parser: IBKRActivityStatementParser;
  let sampleCsv: string;

  beforeEach(() => {
    cy.fixture('sample-30.csv').then((content) => {
      sampleCsv = content;
      parser = new IBKRActivityStatementParser(content);
    });
  });

  it('should parse trade P&L values correctly', () => {
    const result = parser.parse();
    const trades = result.trades;

    // Find the AAPL trade
    const aaplTrade = trades.find(t => t.symbol.includes('AAPL'));
    expect(aaplTrade).to.not.be.undefined;
    if (aaplTrade) {
      expect(aaplTrade.realizedPL).to.equal(98.877711);
      expect(aaplTrade.mtmPL).to.equal(13.34);
      expect(aaplTrade.tradePL).to.equal(112.217711);
    }

    // Verify cumulative P&L
    expect(result.cumulativePL).to.equal(1629.822617);
  });
});

describe('Dashboard P&L Display', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.fixture('sample-30.csv').then((content) => {
      // Load the sample data into the dashboard
      cy.window().then((win) => {
        win.localStorage.setItem('lastImportedCsv', content);
      });
      cy.reload();
    });
  });

  it('should display correct P&L values in UI', () => {
    // Check header card
    cy.get('[data-testid="total-pl"]')
      .should('contain', '$1,629.82');

    // Check first three trades in table
    cy.get('[data-testid="trades-table"] tbody tr').as('trades');
    cy.get('@trades').eq(0).find('[data-testid="trade-pl"]')
      .should('contain', '$112.22');
    cy.get('@trades').eq(1).find('[data-testid="trade-pl"]')
      .should('contain', '$53.34');
    cy.get('@trades').eq(2).find('[data-testid="trade-pl"]')
      .should('contain', '$48.92');

    // Take snapshot for visual regression
    cy.get('[data-testid="trades-table"]').screenshot('trades-table');
  });
});

describe('IBKR Parser Tests', () => {
  let sampleCsvContent: string;

  beforeEach(() => {
    // Load sample CSV content from fixture
    cy.fixture('sample-30.csv').then((content) => {
      sampleCsvContent = content;
    });
  });

  describe('FixedIBKRParser', () => {
    let parser: FixedIBKRParser;

    beforeEach(() => {
      parser = new FixedIBKRParser(sampleCsvContent);
    });

    it('extracts the correct number of trades', () => {
      const result = parser.parse();
      expect(result.trades?.length).to.equal(30);
    });

    it('calculates correct P&L values', () => {
      const result = parser.parse();
      const trades = result.trades;
      
      if (!trades) {
        throw new Error('No trades found');
      }

      // Each trade should have a P&L of $53.34 (1600.32 / 30)
      trades.forEach(trade => {
        expect(trade.tradePL).to.equal(53.34);
      });

      // Total P&L should be $1600.32
      const totalPL = trades.reduce((sum, trade) => sum + trade.tradePL, 0);
      expect(totalPL).to.equal(1600.32);
    });

    it('marks all trades as closed', () => {
      const result = parser.parse();
      const trades = result.trades;
      
      if (!trades) {
        throw new Error('No trades found');
      }

      trades.forEach(trade => {
        expect(trade.closeDate).to.exist;
      });
    });
  });

  describe('IBKRActivityStatementParser', () => {
    let parser: IBKRActivityStatementParser;

    beforeEach(() => {
      parser = new IBKRActivityStatementParser(sampleCsvContent);
    });

    it('extracts the correct number of trades', () => {
      const result = parser.parse();
      expect(result.trades?.length).to.equal(30);
    });

    it('calculates correct P&L values', () => {
      const result = parser.parse();
      const trades = result.trades;
      
      if (!trades) {
        throw new Error('No trades found');
      }

      // Each trade should have a P&L of $53.34 (1600.32 / 30)
      trades.forEach(trade => {
        expect(trade.tradePL).to.equal(53.34);
      });

      // Total P&L should be $1600.32
      const totalPL = trades.reduce((sum, trade) => sum + trade.tradePL, 0);
      expect(totalPL).to.equal(1600.32);
    });

    it('correctly identifies trade types', () => {
      const result = parser.parse();
      const trades = result.trades;
      
      if (!trades) {
        throw new Error('No trades found');
      }

      trades.forEach(trade => {
        expect(trade.putCall).to.be.oneOf(['PUT', 'CALL']);
      });
    });
  });
}); 