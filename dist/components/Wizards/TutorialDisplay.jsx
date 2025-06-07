import React, { useEffect, useState } from 'react';
import { useTutorial } from '../../context/TutorialContext';
import Popover from '../ui/Tooltip/Popover';
import MarkdownRenderer from '../ui/MarkdownRenderer/MarkdownRenderer';
export var TutorialDisplay = function () {
    var _a = useTutorial(), currentTutorial = _a.currentTutorial, currentStepIndex = _a.currentStepIndex, nextStep = _a.nextStep, prevStep = _a.prevStep, endTutorial = _a.endTutorial, isTutorialActive = _a.isTutorialActive, availableSteps = _a.availableSteps;
    var _b = useState(null), targetElement = _b[0], setTargetElement = _b[1];
    useEffect(function () {
        if (isTutorialActive && currentTutorial && availableSteps[currentStepIndex]) {
            var selector = availableSteps[currentStepIndex].targetSelector;
            if (selector) {
                var element = document.querySelector(selector);
                setTargetElement(element);
            }
            else {
                setTargetElement(null); // No specific target, might be a general tutorial step
            }
        }
        else {
            setTargetElement(null);
        }
    }, [isTutorialActive, currentTutorial, availableSteps, currentStepIndex]);
    if (!isTutorialActive || !currentTutorial) {
        return null;
    }
    var currentStepDetails = availableSteps[currentStepIndex];
    if (!currentStepDetails) {
        return null;
    }
    var tutorialTitle = currentTutorial.title;
    var tutorialContent = currentTutorial.content;
    var handleEndTutorial = function () {
        if (endTutorial) {
            endTutorial();
        }
    };
    var handleNext = function () {
        if (nextStep) {
            nextStep();
        }
    };
    var handlePrev = function () {
        if (prevStep) {
            prevStep();
        }
    };
    var popoverContent = (<div className="p-4 max-w-sm">
      {tutorialTitle && <h3 className="text-lg font-semibold mb-2">{tutorialTitle}</h3>}
      <MarkdownRenderer markdownContent={tutorialContent}/>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Step {currentStepIndex + 1} of {availableSteps.length}
        </span>
        <div>
          {currentStepIndex > 0 && (<button onClick={handlePrev} className="mr-2 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded text-gray-700">
              Previous
            </button>)}
          {currentStepIndex < availableSteps.length - 1 ? (<button onClick={handleNext} className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded">
              Next
            </button>) : (<button onClick={handleEndTutorial} className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded">
              Finish
            </button>)}
        </div>
      </div>
       {availableSteps.length > 1 && (<button onClick={handleEndTutorial} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl" aria-label="Close tutorial">
            &times;
          </button>)}
    </div>);
    if (targetElement) {
        return (<Popover content={popoverContent} position="bottom" isOpen={true} onClose={handleEndTutorial} clickable={true} arrow={true}>
        <div style={{
                position: 'fixed',
                left: targetElement.getBoundingClientRect().left + targetElement.offsetWidth / 2,
                top: targetElement.getBoundingClientRect().top + targetElement.offsetHeight / 2,
                width: 0,
                height: 0,
            }}/>
      </Popover>);
    }
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Popover content={popoverContent} isOpen={true} onClose={handleEndTutorial} clickable={true} arrow={false} className="bg-white rounded-lg shadow-xl">
            <div></div>
        </Popover>
    </div>);
};
