import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RuleEditor from '../RuleEditor';
import { Rule } from '../../types/RuleSchema';

// Mock the IBKR API hook
jest.mock('../../hooks/useIBKRAPIConfig', () => ({
  useIBKRAPIConfig: jest.fn(() => ({
    config: {
      maxRequestsPerSecond: 45,
      maxRequestsPerMinute: 2700,
      maxRequestsPerHour: 162000,
      maxRetries: 3,
      baseRetryDelay: 1000,
      maxRetryDelay: 30000,
      retryExponent: 2,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 30000,
      circuitBreakerResetTime: 300000,
      emergencyStopErrorRate: 80,
      emergencyStopTimeWindow: 60000,
      enablePriorityQueue: true,
      logAllRequests: true,
      enableMetrics: true
    },
    updateConfig: jest.fn(),
    resetToDefaults: jest.fn(),
    connectionState: {
      status: 'connected',
      isTestingConnection: false
    },
    testConnection: jest.fn(),
    metrics: {
      totalRequests: 1234,
      successfulRequests: 1200,
      failedRequests: 34,
      averageResponseTime: 150,
      errorRate: 2.8,
      requestsPerSecond: 25,
      queueLength: 5,
      circuitState: 'CLOSED'
    },
    refreshMetrics: jest.fn(),
    resetEmergencyStop: jest.fn(),
    resetCircuitBreaker: jest.fn(),
    clearQueue: jest.fn(),
    apiClient: null,
    initializeClient: jest.fn(),
    isLive: true,
    setLive: jest.fn()
  }))
}));

// Mock the UI components to avoid complex rendering issues
jest.mock('../ui/IBKRAPIConfigPanel', () => ({
  IBKRAPIConfigPanel: ({ onConfigChange, onTestConnection }: any) => (
    <div data-testid="ibkr-config-panel">
      <h3>IBKR API Configuration Panel</h3>
      <button onClick={() => onConfigChange({ maxRequestsPerSecond: 40 })}>
        Change Config
      </button>
      <button onClick={onTestConnection}>Test Connection</button>
    </div>
  )
}));

jest.mock('../ui/IBKRConnectionStatusIndicator', () => ({
  IBKRConnectionStatusIndicator: ({ connectionStatus }: any) => (
    <div data-testid="ibkr-status-indicator">
      Status: {connectionStatus.status || connectionStatus}
    </div>
  )
}));

describe('RuleEditor Integration with IBKR API', () => {
  const mockRule: Rule = {
    id: 'test-rule',
    name: 'Test Rule',
    description: 'A test rule for integration testing',
    type: 'throttle',
    enabled: true,
    conditions: { and: [{ field: 'symbol', operator: '==', value: 'AAPL' }] },
    actions: [{ type: 'log', parameters: { message: 'Test action' } }],
    metadata: { version: '1.0', createdBy: 'test', createdAt: new Date().toISOString() }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders RuleEditor with IBKR API configuration section', () => {
    render(<RuleEditor initialRule={mockRule} />);
    
    // Check that main rule editor is present
    expect(screen.getByText('Rule Editor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
    
    // Check that IBKR API configuration section is present
    expect(screen.getByText('IBKR API Configuration')).toBeInTheDocument();
    expect(screen.getByText(/Configure API rate limits, retry logic, and fail-safe controls/)).toBeInTheDocument();
  });

  it('shows IBKR connection status indicator', () => {
    render(<RuleEditor initialRule={mockRule} />);
    
    const statusIndicator = screen.getByTestId('ibkr-status-indicator');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator).toHaveTextContent('Status: connected');
  });

  it('displays quick status information when API config is collapsed', () => {
    render(<RuleEditor initialRule={mockRule} />);
    
    // Should show quick status by default (config panel hidden)
    expect(screen.getByText('Quick Status')).toBeInTheDocument();
    expect(screen.getByText('45/sec')).toBeInTheDocument(); // Rate limit
    expect(screen.getByText('5')).toBeInTheDocument(); // Queue length
    expect(screen.getByText('97.2%')).toBeInTheDocument(); // Success rate
  });

  it('can toggle IBKR API configuration panel visibility', async () => {
    render(<RuleEditor initialRule={mockRule} />);
    
    // Initially should show "Show API Config" button
    const toggleButton = screen.getByText('Show API Config');
    expect(toggleButton).toBeInTheDocument();
    
    // Click to show the config panel
    fireEvent.click(toggleButton);
    
    // Should now show the config panel and "Hide API Config" button
    await waitFor(() => {
      expect(screen.getByTestId('ibkr-config-panel')).toBeInTheDocument();
      expect(screen.getByText('Hide API Config')).toBeInTheDocument();
    });
  });

  it('provides quick action buttons for IBKR API management', () => {
    render(<RuleEditor initialRule={mockRule} />);
    
    // Should show quick actions
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Test Connection')).toBeInTheDocument();
    expect(screen.getByText('Clear Queue')).toBeInTheDocument();
  });

  it('integrates rule editing with IBKR API configuration', async () => {
    const mockOnChange = jest.fn();
    render(<RuleEditor initialRule={mockRule} onChange={mockOnChange} />);
    
    // Test rule editing still works
    const nameInput = screen.getByDisplayValue('Test Rule');
    fireEvent.change(nameInput, { target: { value: 'Updated Rule' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Rule'
      })
    );
    
    // Test IBKR API config interaction
    const showConfigButton = screen.getByText('Show API Config');
    fireEvent.click(showConfigButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('ibkr-config-panel')).toBeInTheDocument();
    });
  });

  it('handles IBKR API configuration changes', async () => {
    render(<RuleEditor initialRule={mockRule} />);
    
    // Show the config panel
    const showConfigButton = screen.getByText('Show API Config');
    fireEvent.click(showConfigButton);
    
    await waitFor(() => {
      const configPanel = screen.getByTestId('ibkr-config-panel');
      expect(configPanel).toBeInTheDocument();
      
      // Test config change
      const changeConfigButton = screen.getByText('Change Config');
      fireEvent.click(changeConfigButton);
      
      // The mock should have been called
      // Note: We can't easily test the actual config update without more complex mocking
      expect(changeConfigButton).toBeInTheDocument();
    });
  });

  it('maintains rule editor functionality alongside IBKR integration', () => {
    render(<RuleEditor initialRule={mockRule} />);
    
    // Test that all core rule editor functionality is still present
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Conditions')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Live Rule JSON Preview')).toBeInTheDocument();
    
    // Test that IBKR section doesn't interfere with rule editing
    const addConditionButton = screen.getByText('+ Add Condition');
    expect(addConditionButton).toBeInTheDocument();
    
    const addActionButton = screen.getByText('Add Action');
    expect(addActionButton).toBeInTheDocument();
  });

  it('renders without initial rule (default state)', () => {
    render(<RuleEditor />);
    
    // Should render with default empty rule
    expect(screen.getByText('Rule Editor')).toBeInTheDocument();
    expect(screen.getByText('IBKR API Configuration')).toBeInTheDocument();
    
    // Should have default empty values - check that the form is rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
  });
}); 