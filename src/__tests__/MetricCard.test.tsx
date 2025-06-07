import React from 'react';
import { render, screen } from '@testing-library/react';
import MetricCard from '../components/Dashboard/MetricCard';
import '@testing-library/jest-dom';

describe('MetricCard', () => {
  test('renders correctly with title and value', () => {
    render(<MetricCard title="Test Metric" value={123.45} />);
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('123.45')).toBeInTheDocument();
  });

  test('renders with unit', () => {
    render(<MetricCard title="Test Metric" value={100} unit="%" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  test('renders with null value as N/A', () => {
    render(<MetricCard title="Test Metric" value={null} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  test('renders with undefined value as N/A', () => {
    render(<MetricCard title="Test Metric" value={undefined} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  test('renders loading state', () => {
    render(<MetricCard title="Test Metric" value={100} isLoading={true} />);
    // We expect to see the loading skeleton/animation element
    const loadingElement = screen.getByRole('status'); // Assuming the loading indicator has role="status"
    expect(loadingElement).toBeInTheDocument();
    // We should not see the value when loading
    expect(screen.queryByText('100')).not.toBeInTheDocument();
  });

  // TODO: Add tests for different color props if implemented
  // TODO: Add tests for responsiveness (requires more advanced testing setup)
  // TODO: Add tests for animations (requires more advanced testing setup)
}); 