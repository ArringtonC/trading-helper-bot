import React from 'react';
import { render } from '@testing-library/react';

/**
 * Renders `ui` and fails the test if React logs
 * "Maximum update depth exceeded".
 */
export function renderWithLoopGuard(ui: React.ReactElement) {
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation((...args) => {
      const msg = args.join(' ');
      if (msg.includes('Maximum update depth exceeded')) {
        throw new Error('❌ Infinite render loop detected');
      }
    });

  const utils = render(ui);
  consoleError.mockRestore();
  return utils;
} 