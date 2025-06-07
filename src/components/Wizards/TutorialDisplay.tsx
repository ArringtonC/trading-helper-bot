import React, { useEffect, useState } from 'react';
import { useTutorial } from '../../context/TutorialContext';
import Popover from '../ui/Tooltip/Popover';
import MarkdownRenderer from '../ui/MarkdownRenderer/MarkdownRenderer';

interface TutorialDisplayProps {
  // Props can be added here if needed for customization
}

export const TutorialDisplay: React.FC<TutorialDisplayProps> = () => {
  const {
    currentTutorial,
    currentStepIndex,
    nextStep,
    prevStep,
    endTutorial,
    isTutorialActive,
    availableSteps,
  } = useTutorial();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isTutorialActive && currentTutorial && availableSteps[currentStepIndex]) {
      const selector = availableSteps[currentStepIndex].targetSelector;
      if (selector) {
        const element = document.querySelector(selector) as HTMLElement | null;
        setTargetElement(element);
      } else {
        setTargetElement(null); // No specific target, might be a general tutorial step
      }
    } else {
      setTargetElement(null);
    }
  }, [isTutorialActive, currentTutorial, availableSteps, currentStepIndex]);

  if (!isTutorialActive || !currentTutorial) {
    return null;
  }

  const currentStepDetails = availableSteps[currentStepIndex];
  if (!currentStepDetails) {
    return null;
  }

  const tutorialTitle = currentTutorial.title;
  const tutorialContent = currentTutorial.content;

  const handleEndTutorial = () => {
    if (endTutorial) {
      endTutorial();
    }
  };

  const handleNext = () => {
    if (nextStep) {
        nextStep();
    }
  };

  const handlePrev = () => {
    if (prevStep) {
        prevStep();
    }
  }

  const popoverContent = (
    <div className="p-4 max-w-sm">
      {tutorialTitle && <h3 className="text-lg font-semibold mb-2">{tutorialTitle}</h3>}
      <MarkdownRenderer markdownContent={tutorialContent} />
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Step {currentStepIndex + 1} of {availableSteps.length}
        </span>
        <div>
          {currentStepIndex > 0 && (
            <button
              onClick={handlePrev}
              className="mr-2 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
            >
              Previous
            </button>
          )}
          {currentStepIndex < availableSteps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleEndTutorial}
              className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Finish
            </button>
          )}
        </div>
      </div>
       {availableSteps.length > 1 && (
         <button
            onClick={handleEndTutorial}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Close tutorial"
          >
            &times;
          </button>
       )}
    </div>
  );

  if (targetElement) {
    return (
      <Popover
        content={popoverContent}
        position="bottom"
        isOpen={true}
        onClose={handleEndTutorial}
        clickable={true}
        arrow={true}
      >
        <div
            style={{
                position: 'fixed',
                left: targetElement.getBoundingClientRect().left + targetElement.offsetWidth / 2,
                top: targetElement.getBoundingClientRect().top + targetElement.offsetHeight / 2,
                width: 0,
                height: 0,
            }}
        />
      </Popover>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Popover
            content={popoverContent}
            isOpen={true}
            onClose={handleEndTutorial}
            clickable={true}
            arrow={false}
            className="bg-white rounded-lg shadow-xl"
        >
            <div></div>
        </Popover>
    </div>
  );
}; 