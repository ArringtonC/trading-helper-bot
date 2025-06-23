import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the Navigation component
jest.mock('./app/layout/Navigation', () => {
  return function Navigation() {
    return require('react').createElement('nav', { 'data-testid': 'navigation' }, 'Navigation Mock');
  };
});

// Mock other components that might cause issues
jest.mock('./shared/components/ui/OnboardingGuide', () => {
  return function OnboardingGuide() {
    return require('react').createElement('div', { 'data-testid': 'onboarding-guide' }, 'Onboarding Guide Mock');
  };
});

jest.mock('./features/goal-setting/components/Wizards/TutorialDisplay', () => ({
  TutorialDisplay: function TutorialDisplay() {
    return require('react').createElement('div', { 'data-testid': 'tutorial-display' }, 'Tutorial Display Mock');
  }
}));

// Import App after mocks
import App from './app/App';

test('renders app navigation', () => {
  render(<App />);
  const navigationElement = screen.getByTestId('navigation');
  expect(navigationElement).toBeInTheDocument();
});
