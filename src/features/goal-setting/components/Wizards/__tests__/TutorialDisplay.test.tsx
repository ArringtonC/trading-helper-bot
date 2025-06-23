import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TutorialDisplay } from '../TutorialDisplay';
import { useTutorial } from '../../../../../context/TutorialContext';
import { Tutorial } from '../../../../../types/Tutorial';

// Mock dependencies
jest.mock('../../../../../context/TutorialContext', () => ({
  useTutorial: jest.fn(),
}));

jest.mock('../../ui/MarkdownRenderer/MarkdownRenderer', () => ({
  __esModule: true,
  default: ({ markdownContent }: { markdownContent: string }) => <div data-testid="markdown-renderer">{markdownContent}</div>,
}));

jest.mock('../../ui/Tooltip/Popover', () => ({
  __esModule: true,
  default: jest.fn(({ content, children, isOpen }) => isOpen ? <div data-testid="popover">{content}{children}</div> : null),
}));

const mockStartTutorial = jest.fn();
const mockNextStep = jest.fn();
const mockPrevStep = jest.fn();
const mockGoToStep = jest.fn();
const mockEndTutorial = jest.fn();

const mockTutorial: Tutorial = {
  id: 'test-tutorial',
  title: 'Test Tutorial Title',
  content: 'Test tutorial content.',
  targetElementSelectors: ['.target1', '.target2'],
  filePath: 'test.md',
};

const mockAvailableStepsFromTutorial = (tutorial: Tutorial | null) => 
    tutorial?.targetElementSelectors && tutorial.targetElementSelectors.length > 0
    ? tutorial.targetElementSelectors.map(selector => ({ targetSelector: selector }))
    : tutorial ? [{ targetSelector: undefined }]
    : [];


describe('TutorialDisplay', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (useTutorial as jest.Mock).mockReturnValue({
      isTutorialActive: false,
      currentTutorial: null,
      currentStepIndex: 0,
      availableSteps: [],
      error: null,
      isLoading: false,
      startTutorial: mockStartTutorial,
      nextStep: mockNextStep,
      prevStep: mockPrevStep,
      goToStep: mockGoToStep,
      endTutorial: mockEndTutorial,
    });
    // Mock document.querySelector
    global.document.querySelector = jest.fn();
  });

  it('renders nothing when tutorial is not active', () => {
    render(<TutorialDisplay />);
    expect(screen.queryByTestId('popover')).not.toBeInTheDocument();
  });

  it('renders popover when tutorial is active', () => {
    (useTutorial as jest.Mock).mockReturnValueOnce({
      isTutorialActive: true,
      currentTutorial: mockTutorial,
      currentStepIndex: 0,
      availableSteps: mockAvailableStepsFromTutorial(mockTutorial),
      nextStep: mockNextStep,
      prevStep: mockPrevStep,
      endTutorial: mockEndTutorial,
    });
    render(<TutorialDisplay />);
    expect(screen.getByTestId('popover')).toBeInTheDocument();
    expect(screen.getByText('Test Tutorial Title')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-renderer')).toHaveTextContent('Test tutorial content.');
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  });

  it('calls nextStep when Next button is clicked', () => {
    (useTutorial as jest.Mock).mockReturnValueOnce({
      isTutorialActive: true,
      currentTutorial: mockTutorial,
      currentStepIndex: 0,
      availableSteps: mockAvailableStepsFromTutorial(mockTutorial),
      nextStep: mockNextStep,
      endTutorial: mockEndTutorial,
    });
    render(<TutorialDisplay />);
    fireEvent.click(screen.getByText('Next'));
    expect(mockNextStep).toHaveBeenCalledTimes(1);
  });

  it('calls prevStep when Previous button is clicked', () => {
    (useTutorial as jest.Mock).mockReturnValueOnce({
      isTutorialActive: true,
      currentTutorial: mockTutorial,
      currentStepIndex: 1, // On step 2 to show Previous button
      availableSteps: mockAvailableStepsFromTutorial(mockTutorial),
      prevStep: mockPrevStep,
      endTutorial: mockEndTutorial,
    });
    render(<TutorialDisplay />);
    fireEvent.click(screen.getByText('Previous'));
    expect(mockPrevStep).toHaveBeenCalledTimes(1);
  });

  it('calls endTutorial when Finish button is clicked', () => {
    (useTutorial as jest.Mock).mockReturnValueOnce({
      isTutorialActive: true,
      currentTutorial: mockTutorial,
      currentStepIndex: 1, // Last step
      availableSteps: mockAvailableStepsFromTutorial(mockTutorial),
      nextStep: mockNextStep, // Next shouldn't be called, endTutorial should
      endTutorial: mockEndTutorial,
    });
    render(<TutorialDisplay />);
    fireEvent.click(screen.getByText('Finish'));
    expect(mockEndTutorial).toHaveBeenCalledTimes(1);
    expect(mockNextStep).not.toHaveBeenCalled();
  });

  it('calls endTutorial when close (x) button is clicked', () => {
    (useTutorial as jest.Mock).mockReturnValueOnce({
        isTutorialActive: true,
        currentTutorial: mockTutorial, // Assumes more than 1 step to show close button
        currentStepIndex: 0,
        availableSteps: mockAvailableStepsFromTutorial(mockTutorial),
        endTutorial: mockEndTutorial,
      });
      render(<TutorialDisplay />);
      fireEvent.click(screen.getByLabelText('Close tutorial'));
      expect(mockEndTutorial).toHaveBeenCalledTimes(1);
  });

  it('attempts to find target element if selector is present', async () => {
    const mockElement = document.createElement('div');
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);
    mockElement.getBoundingClientRect = jest.fn(() => ({
        left: 50, top: 50, width: 100, height: 20, right: 150, bottom: 70, x:50, y:50, toJSON: ()=>({})
    }));

    (useTutorial as jest.Mock).mockReturnValueOnce({
      isTutorialActive: true,
      currentTutorial: mockTutorial,
      currentStepIndex: 0,
      availableSteps: mockAvailableStepsFromTutorial(mockTutorial),
      endTutorial: mockEndTutorial,
    });

    render(<TutorialDisplay />);
    
    await waitFor(() => {
        expect(document.querySelector).toHaveBeenCalledWith('.target1');
    });
    // Popover mock should be rendered (implicitly means targetElement was found or handled)
    expect(screen.getByTestId('popover')).toBeInTheDocument();
  });

  it('renders modal style popover if no target selector for step', () => {
    const tutorialWithoutSelectors: Tutorial = {
      ...mockTutorial,
      targetElementSelectors: undefined,
    };
    (useTutorial as jest.Mock).mockReturnValueOnce({
      isTutorialActive: true,
      currentTutorial: tutorialWithoutSelectors,
      currentStepIndex: 0,
      availableSteps: mockAvailableStepsFromTutorial(tutorialWithoutSelectors),
      endTutorial: mockEndTutorial,
    });
    render(<TutorialDisplay />);
    // Check if popover is rendered (modal style is a class/structure detail, core rendering is key)
    expect(screen.getByTestId('popover')).toBeInTheDocument();
    // document.querySelector should not have been called if no selector
    expect(document.querySelector).not.toHaveBeenCalled();
  });

   it('does not show Previous button on first step', () => {
    (useTutorial as jest.Mock).mockReturnValueOnce({
        isTutorialActive: true,
        currentTutorial: mockTutorial,
        currentStepIndex: 0,
        availableSteps: mockAvailableStepsFromTutorial(mockTutorial),
        endTutorial: mockEndTutorial,
      });
      render(<TutorialDisplay />);
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
   });

   it('shows Finish button instead of Next on last step', () => {
    (useTutorial as jest.Mock).mockReturnValueOnce({
        isTutorialActive: true,
        currentTutorial: mockTutorial,
        currentStepIndex: mockTutorial.targetElementSelectors!.length -1, // last step
        availableSteps: mockAvailableStepsFromTutorial(mockTutorial),
        endTutorial: mockEndTutorial,
      });
      render(<TutorialDisplay />);
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
      expect(screen.getByText('Finish')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument(); // Assuming more than 1 step
   });

   it('does not show close (x) button for single step tutorial', () => {
    const singleStepTutorial: Tutorial = {
        ...mockTutorial,
        targetElementSelectors: ['.onlyone'], // Only one step
    };
    (useTutorial as jest.Mock).mockReturnValueOnce({
        isTutorialActive: true,
        currentTutorial: singleStepTutorial,
        currentStepIndex: 0,
        availableSteps: mockAvailableStepsFromTutorial(singleStepTutorial),
        endTutorial: mockEndTutorial,
      });
      render(<TutorialDisplay />);
      expect(screen.queryByLabelText('Close tutorial')).not.toBeInTheDocument();
   });

}); 