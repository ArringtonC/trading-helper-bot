import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IBKRConnectionStatusIndicator } from '../ui/IBKRConnectionStatusIndicator';
import type { RequestMetrics } from '../../services/IBKRAPIRateLimiter';

const mockMetrics: RequestMetrics = {
  totalRequests: 1234,
  successfulRequests: 1200,
  failedRequests: 34,
  averageResponseTime: 150,
  errorRate: 2.8,
  requestsPerSecond: 25,
  queueLength: 5,
  circuitState: 'CLOSED'
};

describe('IBKRConnectionStatusIndicator', () => {
  const defaultProps = {
    connectionStatus: 'connected' as const,
    metrics: mockMetrics,
    refreshInterval: 1000,
    showDetails: false,
    onToggleDetails: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders connection status correctly', () => {
    render(<IBKRConnectionStatusIndicator {...defaultProps} />);
    
    expect(screen.getByText(/Connected/)).toBeInTheDocument();
  });

  it('handles different connection statuses', () => {
    const { rerender } = render(<IBKRConnectionStatusIndicator {...defaultProps} />);
    expect(screen.getByText(/Connected/)).toBeInTheDocument();

    rerender(<IBKRConnectionStatusIndicator {...defaultProps} connectionStatus="degraded" />);
    expect(screen.getByText(/Degraded/)).toBeInTheDocument();

    rerender(<IBKRConnectionStatusIndicator {...defaultProps} connectionStatus="disconnected" />);
    expect(screen.getByText(/Disconnected/)).toBeInTheDocument();

    rerender(<IBKRConnectionStatusIndicator {...defaultProps} connectionStatus="connecting" />);
    expect(screen.getByText(/Connecting/)).toBeInTheDocument();
  });

  it('displays metrics when expanded', () => {
    render(<IBKRConnectionStatusIndicator {...defaultProps} showDetails={true} />);
    
    // Should show performance indicators when details are expanded
    expect(screen.getByText(/Performance/)).toBeInTheDocument();
  });

  it('handles missing metrics gracefully', () => {
    render(<IBKRConnectionStatusIndicator {...defaultProps} metrics={undefined} />);
    
    expect(screen.getByText(/Connected/)).toBeInTheDocument();
  });

  it('shows circuit breaker alerts when circuit is open', () => {
    const openCircuitMetrics: RequestMetrics = {
      ...mockMetrics,
      circuitState: 'OPEN'
    };
    
    render(<IBKRConnectionStatusIndicator {...defaultProps} metrics={openCircuitMetrics} showDetails={true} />);
    
    // Use getAllByText since there are multiple elements with this text
    const circuitBreakerElements = screen.getAllByText('Circuit Breaker Open');
    expect(circuitBreakerElements).toHaveLength(2); // Should have at least one element
  });

  it('shows high error rate alerts', () => {
    const highErrorMetrics: RequestMetrics = {
      ...mockMetrics,
      errorRate: 85
    };
    
    render(<IBKRConnectionStatusIndicator {...defaultProps} metrics={highErrorMetrics} showDetails={true} />);
    
    // Should show performance issues
    expect(screen.getByText(/Performance/)).toBeInTheDocument();
  });

  it('toggles details when button is clicked', () => {
    const mockToggle = jest.fn();
    render(<IBKRConnectionStatusIndicator {...defaultProps} onToggleDetails={mockToggle} />);
    
    const toggleButton = screen.getByText('Show Details');
    fireEvent.click(toggleButton);
    
    expect(mockToggle).toHaveBeenCalled();
  });

  it('shows last update time', () => {
    render(<IBKRConnectionStatusIndicator {...defaultProps} />);
    
    expect(screen.getByText(/Last update:/)).toBeInTheDocument();
  });

  it('handles different performance levels', () => {
    // Test excellent performance (low error rate, fast response)
    const excellentMetrics: RequestMetrics = {
      ...mockMetrics,
      errorRate: 1,
      averageResponseTime: 50,
      queueLength: 2
    };
    
    render(<IBKRConnectionStatusIndicator {...defaultProps} metrics={excellentMetrics} />);
    expect(screen.getByText(/Excellent Performance/)).toBeInTheDocument();
  });

  it('shows performance badges correctly', () => {
    // Test degraded performance
    const degradedMetrics: RequestMetrics = {
      ...mockMetrics,
      errorRate: 15,
      averageResponseTime: 3000,
      queueLength: 75
    };
    
    render(<IBKRConnectionStatusIndicator {...defaultProps} metrics={degradedMetrics} />);
    expect(screen.getByText(/Performance/)).toBeInTheDocument();
  });
}); 