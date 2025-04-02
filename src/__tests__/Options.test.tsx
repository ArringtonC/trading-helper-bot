import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Options from '../pages/Options';
import { AccountService } from '../services/AccountService';
import { OptionService } from '../services/OptionService';

// Mock the services
jest.mock('../services/AccountService');
jest.mock('../services/OptionService');

// Sample test data
const sampleTrades = [
  {
    id: '1',
    symbol: "AAPL",
    putCall: "CALL",
    strike: 222.5,
    expiry: new Date("2025-05-19"),
    quantity: 2,
    premium: 1.54,
    openDate: new Date("2025-04-01"),
    strategy: "LONG_CALL",
    notes: "Earnings play"
  },
  {
    id: '2',
    symbol: "SPY",
    putCall: "PUT",
    strike: 560,
    expiry: new Date("2025-04-30"),
    quantity: -1,
    premium: 3.25,
    openDate: new Date("2025-04-05"),
    strategy: "SHORT_PUT",
    notes: "Income strategy"
  }
];

const sampleAccount = {
  id: '1',
  name: 'Test Options Account',
  type: 'Cash',
  balance: 10000,
  currency: 'USD'
};

describe('Options Module', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (AccountService.getAccounts as jest.Mock).mockReturnValue([sampleAccount]);
    (OptionService.getOpenPositions as jest.Mock).mockReturnValue([]);
    (OptionService.getClosedPositions as jest.Mock).mockReturnValue([]);
  });

  const renderOptions = () => {
    return render(
      <BrowserRouter>
        <Options />
      </BrowserRouter>
    );
  };

  describe('Basic Functionality', () => {
    test('renders account selector and empty state', () => {
      renderOptions();
      
      // Check for account selector
      expect(screen.getByLabelText('Select Account')).toBeInTheDocument();
      
      // Check for empty state message
      expect(screen.getByText('No positions found')).toBeInTheDocument();
    });

    test('adds a new trade', async () => {
      renderOptions();
      
      // Select account
      const accountSelect = screen.getByLabelText('Select Account');
      fireEvent.change(accountSelect, { target: { value: sampleAccount.id } });
      
      // Click "New Trade" button
      fireEvent.click(screen.getByText('New Trade'));
      
      // Fill in the form
      const symbolInput = screen.getByPlaceholderText('AAPL');
      const strikeInput = screen.getByPlaceholderText('0.00');
      const quantityInput = screen.getByDisplayValue('1');
      const premiumInput = screen.getByPlaceholderText('0.00');
      const expiryInput = screen.getByDisplayValue('2025-05-01');
      const openDateInput = screen.getByDisplayValue('2025-04-01');
      const strategySelect = screen.getByRole('combobox');
      
      fireEvent.change(symbolInput, { target: { value: sampleTrades[0].symbol } });
      fireEvent.change(strikeInput, { target: { value: sampleTrades[0].strike } });
      fireEvent.change(quantityInput, { target: { value: sampleTrades[0].quantity } });
      fireEvent.change(premiumInput, { target: { value: sampleTrades[0].premium } });
      fireEvent.change(expiryInput, { target: { value: sampleTrades[0].expiry.toISOString().split('T')[0] } });
      fireEvent.change(openDateInput, { target: { value: sampleTrades[0].openDate.toISOString().split('T')[0] } });
      fireEvent.change(strategySelect, { target: { value: sampleTrades[0].strategy } });
      
      // Click CALL button for option type
      fireEvent.click(screen.getByText('CALL'));
      
      // Submit the form
      fireEvent.click(screen.getByText('Add Trade'));
      
      // Verify the trade was added
      await waitFor(() => {
        expect(OptionService.addTrade).toHaveBeenCalledWith(
          sampleAccount.id,
          expect.objectContaining({
            symbol: sampleTrades[0].symbol,
            putCall: 'CALL',
            strike: sampleTrades[0].strike,
            quantity: sampleTrades[0].quantity,
            premium: sampleTrades[0].premium,
            expiry: sampleTrades[0].expiry,
            openDate: sampleTrades[0].openDate,
            strategy: sampleTrades[0].strategy
          })
        );
      });
    });

    test('closes a position', async () => {
      // Setup mock to return one open position
      (OptionService.getOpenPositions as jest.Mock).mockReturnValue([sampleTrades[0]]);
      
      renderOptions();
      
      // Select account
      const accountSelect = screen.getByLabelText('Select Account');
      fireEvent.change(accountSelect, { target: { value: sampleAccount.id } });
      
      // Click close button
      fireEvent.click(screen.getByText('Close'));
      
      // Fill in close form
      const closePremiumInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(closePremiumInput, { target: { value: '2.50' } });
      
      // Submit close form
      fireEvent.click(screen.getByText('Close Position'));
      
      // Verify the position was closed
      await waitFor(() => {
        expect(OptionService.closeTrade).toHaveBeenCalledWith(
          sampleAccount.id,
          sampleTrades[0].id,
          expect.objectContaining({
            closePremium: 2.50
          })
        );
      });
    });
  });

  describe('View Modes', () => {
    test('switches between table and calendar views', () => {
      renderOptions();
      
      // Select account
      const accountSelect = screen.getByLabelText('Select Account');
      fireEvent.change(accountSelect, { target: { value: sampleAccount.id } });
      
      // Switch to calendar view
      fireEvent.click(screen.getByText('Calendar'));
      expect(screen.getByText('Calendar')).toHaveClass('bg-blue-600');
      
      // Switch back to table view
      fireEvent.click(screen.getByText('Table'));
      expect(screen.getByText('Table')).toHaveClass('bg-blue-600');
    });
  });

  describe('Position Details', () => {
    test('opens position detail view', () => {
      // Setup mock to return one open position
      (OptionService.getOpenPositions as jest.Mock).mockReturnValue([sampleTrades[0]]);
      
      renderOptions();
      
      // Select account
      const accountSelect = screen.getByLabelText('Select Account');
      fireEvent.change(accountSelect, { target: { value: sampleAccount.id } });
      
      // Click on position row
      fireEvent.click(screen.getByText(sampleTrades[0].symbol));
      
      // Verify detail view opens
      expect(screen.getByText('Position Details')).toBeInTheDocument();
      expect(screen.getByText(sampleTrades[0].symbol)).toBeInTheDocument();
      expect(screen.getByText(sampleTrades[0].putCall)).toBeInTheDocument();
    });
  });

  describe('Analysis Features', () => {
    test('displays options analysis card', () => {
      renderOptions();
      
      // Select account
      const accountSelect = screen.getByLabelText('Select Account');
      fireEvent.change(accountSelect, { target: { value: sampleAccount.id } });
      
      // Verify analysis card is present
      expect(screen.getByText('Options Analysis')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles expired options', () => {
      const expiredTrade = {
        ...sampleTrades[0],
        expiry: new Date('2024-01-01') // Past date
      };
      
      // Setup mock to return expired position
      (OptionService.getOpenPositions as jest.Mock).mockReturnValue([expiredTrade]);
      
      renderOptions();
      
      // Select account
      const accountSelect = screen.getByLabelText('Select Account');
      fireEvent.change(accountSelect, { target: { value: sampleAccount.id } });
      
      // Verify expired position is marked
      const daysCell = screen.getByText('0');
      expect(daysCell).toHaveClass('text-red-600');
    });

    test('handles no accounts', () => {
      // Setup mock to return no accounts
      (AccountService.getAccounts as jest.Mock).mockReturnValue([]);
      
      renderOptions();
      
      // Verify no accounts message
      expect(screen.getByText('No accounts found. You need to create an account or import from IBKR before using the Options module.')).toBeInTheDocument();
    });
  });
}); 