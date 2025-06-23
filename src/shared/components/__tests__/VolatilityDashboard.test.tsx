import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VolatilityDashboard } from '../Dashboard/VolatilityDashboard';

// Mock recharts to avoid rendering issues in tests
jest.mock('../visualizations/ChartComponents', () => ({
  LineChartWrapper: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChartWrapper: ({ children }: any) => <div data-testid="area-chart">{children}</div>
}));

jest.mock('recharts', () => ({
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  ReferenceLine: () => <div data-testid="reference-line" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />
}));

describe('VolatilityDashboard', () => {
  const defaultProps = {
    symbols: ['AAPL'],
    onExport: jest.fn(),
    onSettingsChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders volatility dashboard with header', async () => {
    render(<VolatilityDashboard {...defaultProps} />);
    
    // Wait for initial data load
    await waitFor(() => {
      expect(screen.getByText('Volatility Dashboard')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('displays symbol selector with provided symbols', async () => {
    render(<VolatilityDashboard {...defaultProps} symbols={['AAPL', 'TSLA']} />);
    
    await waitFor(() => {
      expect(screen.getByText('Volatility Dashboard')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('renders time frame selector buttons', async () => {
    render(<VolatilityDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Volatility Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('1 Day')).toBeInTheDocument();
    expect(screen.getByText('1 Week')).toBeInTheDocument();
    expect(screen.getByText('1 Month')).toBeInTheDocument();
    expect(screen.getByText('3 Months')).toBeInTheDocument();
    expect(screen.getByText('1 Year')).toBeInTheDocument();
  });

  it('displays export buttons', async () => {
    render(<VolatilityDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Export PNG')).toBeInTheDocument();
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });
  });

  it('shows IV Percentile chart by default', async () => {
    render(<VolatilityDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('IV Percentile')).toBeInTheDocument();
    });
  });

  it('shows ATR chart by default', async () => {
    render(<VolatilityDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Average True Range/)).toBeInTheDocument();
    });
  });

  it('shows Bollinger Bands chart by default', async () => {
    render(<VolatilityDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Bollinger Bands & Price Action')).toBeInTheDocument();
    });
  });

  it('shows VIX correlation chart by default', async () => {
    render(<VolatilityDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('VIX Correlation')).toBeInTheDocument();
    });
  });

  it('displays volatility summary section', async () => {
    render(<VolatilityDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Volatility Summary')).toBeInTheDocument();
      expect(screen.getByText('Implied Volatility')).toBeInTheDocument();
      expect(screen.getByText('Historical Volatility')).toBeInTheDocument();
      expect(screen.getByText('Current Zone')).toBeInTheDocument();
    });
  });

  it('handles export PNG button click', async () => {
    const mockOnExport = jest.fn();
    render(<VolatilityDashboard {...defaultProps} onExport={mockOnExport} />);
    
    await waitFor(() => {
      expect(screen.getByText('Export PNG')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Export PNG'));
    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledWith('png', expect.any(Array));
    });
  });

  it('handles export CSV button click', async () => {
    const mockOnExport = jest.fn();
    render(<VolatilityDashboard {...defaultProps} onExport={mockOnExport} />);
    
    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Export CSV'));
    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledWith('csv', expect.any(Array));
    });
  });

  it('toggles real-time updates', async () => {
    render(<VolatilityDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('● Live')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('● Live'));
    
    await waitFor(() => {
      expect(screen.getByText('○ Paused')).toBeInTheDocument();
    });
  });

  it('handles time frame changes', async () => {
    const mockOnSettingsChange = jest.fn();
    render(<VolatilityDashboard {...defaultProps} onSettingsChange={mockOnSettingsChange} />);
    
    await waitFor(() => {
      expect(screen.getByText('1 Week')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1 Week'));
    
    await waitFor(() => {
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          timeFrame: '1W'
        })
      );
    });
  });
}); 