import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PsychologicalTradingSimulator from '../PsychologicalTradingSimulator';

describe('PsychologicalTradingSimulator', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('renders psychological trading simulator', () => {
    render(<PsychologicalTradingSimulator />);
    
    expect(screen.getByText('🧠 Psychological Trading Simulator')).toBeInTheDocument();
    expect(screen.getByText('Practice trading while tracking your emotional patterns and decision-making')).toBeInTheDocument();
  });

  test('displays portfolio summary', () => {
    render(<PsychologicalTradingSimulator />);
    
    expect(screen.getByText('Cash Balance')).toBeInTheDocument();
    expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('Total P&L')).toBeInTheDocument();
    expect(screen.getByText('Total Trades')).toBeInTheDocument();
  });

  test('displays trading interface', () => {
    render(<PsychologicalTradingSimulator />);
    
    expect(screen.getByText('Trading Interface')).toBeInTheDocument();
    expect(screen.getByText('Market Data')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
  });

  test('displays emotional patterns section', () => {
    render(<PsychologicalTradingSimulator />);
    
    expect(screen.getByText('Emotional Trading Patterns')).toBeInTheDocument();
    expect(screen.getByText('Recent Trades')).toBeInTheDocument();
  });

  test('displays market symbols', () => {
    render(<PsychologicalTradingSimulator />);
    
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('TSLA')).toBeInTheDocument();
    expect(screen.getByText('SPY')).toBeInTheDocument();
    expect(screen.getByText('QQQ')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
  });

  test('quantity input works correctly', () => {
    render(<PsychologicalTradingSimulator />);
    
    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    expect(quantityInput).toHaveValue(5);
  });

  test('shows initial cash balance', () => {
    render(<PsychologicalTradingSimulator />);
    
    // Look for cash balance specifically under the "Cash Balance" heading
    const cashBalanceSection = screen.getByText('Cash Balance').closest('div');
    expect(cashBalanceSection).toHaveTextContent('$10000.00');
  });

  test('shows zero initial trades', () => {
    render(<PsychologicalTradingSimulator />);
    
    const tradesSection = screen.getByText('Total Trades').closest('div');
    expect(tradesSection).toHaveTextContent('0');
  });
}); 