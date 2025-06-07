/**
 * Progressive Disclosure Navigation Test Suite
 * Tests the adaptive navigation based on user experience level
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navigation from '../Navigation';
import { loadSetting } from '../../services/SettingsService';

// Mock the settings service
jest.mock('../../services/SettingsService', () => ({
  loadSetting: jest.fn(() => 'true')
}));

// Mock the UX controllers
jest.mock('../../utils/ux/UXLayersController', () => ({
  UXLayersController: jest.fn().mockImplementation(() => ({
    getAdaptiveMenuConfig: () => ({
      primary: ['Dashboard', 'Position Sizing'],
      secondary: ['Settings'],
      advanced: []
    }),
    shouldShowFeature: () => true
  })),
  UserExperienceLevel: {}
}));

const mockLoadSetting = loadSetting as jest.MockedFunction<typeof loadSetting>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Wrapper component for testing
const NavigationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Progressive Disclosure Navigation', () => {
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Default settings
    mockLoadSetting.mockImplementation((key: string) => {
      switch (key) {
        case 'showImport': return 'true';
        case 'showDirectImport': return 'true';
        case 'showHelpPage': return 'true';
        case 'showRuleEngine': return 'true';
        case 'showUnifiedDashboard': return 'true';
        case 'enableAdvancedFeatures': return 'true';
        case 'enableDebugMode': return 'true';
        case 'userExperienceLevel': return 'intermediate';
        default: return 'false';
      }
    });
  });

  describe('User Level Indicator', () => {
    
    it('should display user level selector with correct default', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      const levelSelector = screen.getByDisplayValue('📈 Intermediate');
      expect(levelSelector).toBeInTheDocument();
      expect(screen.getByText('📈')).toBeInTheDocument();
    });

    it('should change user level when selector is changed', async () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      const levelSelector = screen.getByDisplayValue('📈 Intermediate');
      
      // Change to beginner level
      fireEvent.change(levelSelector, { target: { value: 'beginner' } });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('🌱 Beginner')).toBeInTheDocument();
        expect(screen.getByText('🌱')).toBeInTheDocument();
      });
      
      // Verify localStorage was called
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userExperienceLevel', 'beginner');
    });

    it('should display correct icons for each level', async () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      const levelSelector = screen.getByRole('combobox');
      
      // Test beginner level
      fireEvent.change(levelSelector, { target: { value: 'beginner' } });
      await waitFor(() => {
        expect(screen.getByText('🌱')).toBeInTheDocument();
      });
      
      // Test advanced level
      fireEvent.change(levelSelector, { target: { value: 'advanced' } });
      await waitFor(() => {
        expect(screen.getByText('🚀')).toBeInTheDocument();
      });
    });
  });

  describe('Progressive Feature Visibility', () => {
    
    it('should show core features for all levels', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      // Core features should always be visible
      expect(screen.getByText('🎮 Interactive Tutorial')).toBeInTheDocument();
      expect(screen.getByText('🎯 Position Sizing')).toBeInTheDocument();
    });

    it('should show appropriate features for beginner level', async () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      const levelSelector = screen.getByRole('combobox');
      fireEvent.change(levelSelector, { target: { value: 'beginner' } });
      
      await waitFor(() => {
        // Should show beginner-appropriate features
        expect(screen.getByText('📈 Strategy Visualizer')).toBeInTheDocument();
        
        // Should NOT show advanced features
        expect(screen.queryByText('💼 IBKR Connection')).not.toBeInTheDocument();
        expect(screen.queryByText('🤖 AI Analysis')).not.toBeInTheDocument();
      });
    });

    it('should show intermediate features for intermediate level', async () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      const levelSelector = screen.getByRole('combobox');
      fireEvent.change(levelSelector, { target: { value: 'intermediate' } });
      
      await waitFor(() => {
        // Should show intermediate features
        expect(screen.getByText('📊 Options Trading')).toBeInTheDocument();
        expect(screen.getByText('📊 Interactive Analytics')).toBeInTheDocument();
        expect(screen.getByText('🔄 Unified Dashboard')).toBeInTheDocument();
        
        // Should NOT show advanced-only features
        expect(screen.queryByText('💼 IBKR Connection')).not.toBeInTheDocument();
        expect(screen.queryByText('🤖 AI Analysis')).not.toBeInTheDocument();
      });
    });

    it('should show all features for advanced level', async () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      const levelSelector = screen.getByRole('combobox');
      fireEvent.change(levelSelector, { target: { value: 'advanced' } });
      
      await waitFor(() => {
        // Should show all features including advanced ones
        expect(screen.getByText('💼 IBKR Connection')).toBeInTheDocument();
        expect(screen.getByText('🤖 AI Analysis')).toBeInTheDocument();
        expect(screen.getByText('⚙️ Rule Engine')).toBeInTheDocument();
        expect(screen.getByText('📥 Import & Analyze')).toBeInTheDocument();
        expect(screen.getByText('🔧 Legacy Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Feature Flag Integration', () => {
    
    it('should respect feature flags even with progressive disclosure', async () => {
      // Disable some features
      mockLoadSetting.mockImplementation((key: string) => {
        switch (key) {
          case 'showRuleEngine': return 'false';
          case 'enableAdvancedFeatures': return 'false';
          case 'enableDebugMode': return 'false';
          case 'userExperienceLevel': return 'advanced';
          default: return 'true';
        }
      });
      
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      const levelSelector = screen.getByRole('combobox');
      fireEvent.change(levelSelector, { target: { value: 'advanced' } });
      
      await waitFor(() => {
        // Features should be hidden due to feature flags
        expect(screen.queryByText('⚙️ Rule Engine')).not.toBeInTheDocument();
        expect(screen.queryByText('🔧 Legacy Dashboard')).not.toBeInTheDocument();
        
        // Other advanced features should still be visible
        expect(screen.getByText('💼 IBKR Connection')).toBeInTheDocument();
        expect(screen.getByText('🤖 AI Analysis')).toBeInTheDocument();
      });
    });

    it('should show import features based on level and flags', async () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      const levelSelector = screen.getByRole('combobox');
      
      // Intermediate level should show basic import
      fireEvent.change(levelSelector, { target: { value: 'intermediate' } });
      await waitFor(() => {
        expect(screen.getByText('📥 Import')).toBeInTheDocument();
        expect(screen.queryByText('🔧 Direct Parser')).not.toBeInTheDocument();
      });
      
      // Advanced level should show both import features
      fireEvent.change(levelSelector, { target: { value: 'advanced' } });
      await waitFor(() => {
        expect(screen.getByText('📥 Import')).toBeInTheDocument();
        expect(screen.getByText('🔧 Direct Parser')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Behavior', () => {
    
    it('should maintain navigation functionality with progressive disclosure', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      // All navigation links should be clickable
      const tutorialLink = screen.getByText('🎮 Interactive Tutorial');
      const positionSizingLink = screen.getByText('🎯 Position Sizing');
      
      expect(tutorialLink.closest('a')).toHaveAttribute('href', '/tutorial');
      expect(positionSizingLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('should show help button when enabled', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      expect(screen.getByText('Help')).toBeInTheDocument();
    });

    it('should always show settings link', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    
    it('should apply whitespace-nowrap to prevent text wrapping', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      const tutorialLink = screen.getByText('🎮 Interactive Tutorial');
      expect(tutorialLink).toHaveClass('whitespace-nowrap');
    });

    it('should have overflow-x-auto for horizontal scrolling', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      const navContainer = screen.getByText('🎮 Interactive Tutorial').closest('div');
      expect(navContainer).toHaveClass('overflow-x-auto');
    });
  });

  describe('Accessibility', () => {
    
    it('should have proper ARIA labels', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      const levelSelector = screen.getByRole('combobox');
      expect(levelSelector).toHaveAttribute('title', 'Change experience level to show/hide features');
      
      const helpButton = screen.getByLabelText('Open tutorials list');
      expect(helpButton).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      const levelSelector = screen.getByRole('combobox');
      expect(levelSelector).toHaveAttribute('tabIndex');
    });
  });

  describe('Performance', () => {
    
    it('should not recreate UX controller unnecessarily', async () => {
      const { rerender } = render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      // Rerender without changing props
      rerender(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );
      
      // Should still work correctly
      expect(screen.getByText('🎮 Interactive Tutorial')).toBeInTheDocument();
    });
  });
}); 