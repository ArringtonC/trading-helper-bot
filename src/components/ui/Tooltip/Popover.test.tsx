import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Popover from './Popover';

// Mock getBoundingClientRect as it's not implemented in JSDOM
const mockRect = { 
    width: 150, height: 50, // Popovers might be larger
    top: 10, left: 10, 
    bottom: 60, right: 160, 
    x:10, y:10, 
    toJSON: () => JSON.stringify(mockRect) 
};

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: jest.fn(() => mockRect),
});

// Mock addEventListener/removeEventListener for window to test scroll/resize listeners
const eventMap: { [key: string]: any } = {};
window.addEventListener = jest.fn((event, cb) => {
  eventMap[event] = cb;
});
window.removeEventListener = jest.fn((event) => {
  delete eventMap[event];
});


describe('Popover Component', () => {
  test('renders children correctly', () => {
    render(
      <Popover content="Test Popover">
        <button>Open Popover</button>
      </Popover>
    );
    expect(screen.getByText('Open Popover')).toBeInTheDocument();
  });

  test('does not show popover content initially (click trigger default)', () => {
    render(
      <Popover content="Initial Test Popover">
        <button>Open Popover</button>
      </Popover>
    );
    expect(screen.queryByText('Initial Test Popover')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('shows popover on click and hides on second click (click trigger)', async () => {
    render(
      <Popover content="Click Me Popover" title="Test Title">
        <button>Click Trigger</button>
      </Popover>
    );
    const trigger = screen.getByText('Click Trigger');

    // Show popover
    await act(async () => {
      fireEvent.click(trigger);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Click Me Popover')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();

    // Hide popover by clicking trigger again
    await act(async () => {
      fireEvent.click(trigger);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('hides popover on clicking close button', async () => {
    render(
      <Popover content="Close Button Test">
        <button>Open</button>
      </Popover>
    );
    const trigger = screen.getByText('Open');
    await act(async () => {
      fireEvent.click(trigger);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close popover');
    await act(async () => {
      fireEvent.click(closeButton);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('hides popover on pressing Escape key', async () => {
    render(
      <Popover content="Escape Key Test">
        <button>Open for Escape</button>
      </Popover>
    );
    const trigger = screen.getByText('Open for Escape');
    await act(async () => {
      fireEvent.click(trigger);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('hides popover on clicking outside', async () => {
    render(
      <div>
        <Popover content="Click Outside Test">
          <button>Open for Outside</button>
        </Popover>
        <div data-testid="outside-area">Outside</div>
      </div>
    );
    const trigger = screen.getByText('Open for Outside');
    await act(async () => {
      fireEvent.click(trigger);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const outsideArea = screen.getByTestId('outside-area');
    await act(async () => {
      fireEvent.mouseDown(outsideArea); // mousedown on document hides it
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('shows popover on mouse enter and hides on mouse leave (hover trigger)', async () => {
    render(
      <Popover content="Hover Popover" trigger="hover">
        <span>Hover Trigger Span</span>
      </Popover>
    );
    const trigger = screen.getByText('Hover Trigger Span');

    await act(async () => {
      fireEvent.mouseEnter(trigger);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Hover Popover')).toBeInTheDocument();

    await act(async () => {
      fireEvent.mouseLeave(trigger);
    });
    await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('renders title and arrow correctly', async () => {
    render(
      <Popover content="Content" title="My Popover Title">
        <button>Trigger</button>
      </Popover>
    );
    const trigger = screen.getByText('Trigger');
    await act(async () => {
      fireEvent.click(trigger);
    });
    expect(screen.getByText('My Popover Title')).toBeInTheDocument();
    expect(screen.getByTestId('popover-arrow')).toBeInTheDocument();
  });

  test('applies default position (bottom) and styles', async () => {
    render(
      <Popover content="Styled Popover">
        <button>Trigger</button>
      </Popover>
    );
    const trigger = screen.getByText('Trigger');
    await act(async () => {
      fireEvent.click(trigger);
    });
    const popoverElement = screen.getByRole('dialog');
    expect(popoverElement).toBeInTheDocument();
    expect(popoverElement).toHaveClass('bg-white', 'border', 'border-gray-300', 'rounded-lg', 'shadow-xl', 'p-4');
    // Check that style.top and style.left are being set
    expect(popoverElement.style.top).toBeDefined();
    expect(popoverElement.style.left).toBeDefined();
  });

  test('applies custom className', async () => {
    render(
      <Popover content="Custom Class Popover" className="my-custom-popover">
        <button>Custom</button>
      </Popover>
    );
    const trigger = screen.getByText('Custom');
    await act(async () => {
      fireEvent.click(trigger);
    });
    expect(screen.getByRole('dialog')).toHaveClass('my-custom-popover');
  });

  const positions: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];
  positions.forEach(pos => {
    test(`updates position logic for ${pos}`, async () => {
      render(
        <Popover content={`Position ${pos}`} position={pos}>
          <button>{`Trigger ${pos}`}</button>
        </Popover>
      );
      const trigger = screen.getByText(`Trigger ${pos}`);
      await act(async () => {
        fireEvent.click(trigger);
      });
      const popoverElement = screen.getByRole('dialog');
      expect(popoverElement).toBeInTheDocument();
      expect(popoverElement.style.top).toBeDefined();
      expect(popoverElement.style.left).toBeDefined();
      expect(screen.getByText(`Position ${pos}`)).toBeInTheDocument();
      await act(async () => {
        fireEvent.click(trigger); // Close it
      });
    });
  });

  test('updates position on window scroll and resize when visible', async () => {
    const updatePositionMock = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    
    render(
        <Popover content="Scroll/Resize Test">
            <button>Open</button>
        </Popover>
    );
    const trigger = screen.getByText('Open');
    await act(async () => {
        fireEvent.click(trigger);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    updatePositionMock.mockClear(); // Clear any calls from initial positioning

    // Simulate scroll
    await act(async () => {
        eventMap.scroll({} as Event); // Trigger the mocked scroll event listener
    });
    expect(updatePositionMock).toHaveBeenCalled();

    updatePositionMock.mockClear();

    // Simulate resize
    await act(async () => {
        eventMap.resize({} as Event); // Trigger the mocked resize event listener
    });
    expect(updatePositionMock).toHaveBeenCalled();

    // Cleanup: close popover to remove listeners
    await act(async () => {
      fireEvent.click(trigger);
    });
    updatePositionMock.mockRestore();
  });

}); 