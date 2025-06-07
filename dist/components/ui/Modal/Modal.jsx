import React, { useEffect } from 'react';
var Modal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, onCancel = _a.onCancel, onBack = _a.onBack, onNext = _a.onNext, children = _a.children, title = _a.title, _b = _a.showBack, showBack = _b === void 0 ? false : _b, _c = _a.showNext, showNext = _c === void 0 ? false : _c, _d = _a.showCancel, showCancel = _d === void 0 ? false : _d, _e = _a.isNextDisabled, isNextDisabled = _e === void 0 ? false : _e, _f = _a.isBackDisabled, isBackDisabled = _f === void 0 ? false : _f, currentStep = _a.currentStep, totalSteps = _a.totalSteps;
    // Close modal on Escape key press
    useEffect(function () {
        var handleEscape = function (event) {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return function () {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);
    if (!isOpen) {
        return null;
    }
    return (
    // Overlay
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={onClose} // Close on overlay click
     aria-modal="true" role="dialog">
      {/* Modal Content */}
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={function (e) { return e.stopPropagation(); }} // Prevent closing when clicking inside modal
    >
        {/* Header */}
        {/* Only show header div if there's a title, otherwise just show close button if needed */}
        {title && (<div className="flex justify-between items-center border-b pb-3 mb-3">
            <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close">
              &times;
            </button>
          </div>)}

        {/* Progress Indicator */}
        {(currentStep !== undefined && totalSteps !== undefined) && (<div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "".concat((currentStep / totalSteps) * 100, "%") }}></div>
            </div>)}

        {/* Body */}
        <div className="modal-body mb-4 text-gray-700">
          {children}
        </div>

        {/* Footer with Navigation */}
        {(showBack || showNext || showCancel || (currentStep !== undefined && totalSteps !== undefined)) && (<div className="flex justify-between items-center border-t pt-3 mt-3">

            {/* Step Indicator */}
            {(currentStep !== undefined && totalSteps !== undefined) && (<span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>)}

            <div className="flex-grow">{/* Spacer */}</div>

            {/* Navigation Buttons */}
            <div className="flex space-x-2">
                {showCancel && onCancel && (<button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Cancel
                    </button>)}
                {showBack && onBack && (<button onClick={onBack} disabled={isBackDisabled} className={"px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ".concat(isBackDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600')}>
                        Back
                    </button>)}
                {showNext && onNext && (<button onClick={onNext} disabled={isNextDisabled} className={"px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ".concat(isNextDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600')}>
                        Next
                    </button>)}
            </div>
          </div>)}

      </div>
    </div>);
};
export default Modal;
