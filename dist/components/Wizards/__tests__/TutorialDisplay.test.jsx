var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TutorialDisplay } from '../TutorialDisplay';
import { useTutorial } from '../../../context/TutorialContext';
// Mock dependencies
jest.mock('../../../context/TutorialContext', function () { return ({
    useTutorial: jest.fn(),
}); });
jest.mock('../../ui/MarkdownRenderer/MarkdownRenderer', function () { return ({
    __esModule: true,
    default: function (_a) {
        var markdownContent = _a.markdownContent;
        return <div data-testid="markdown-renderer">{markdownContent}</div>;
    },
}); });
jest.mock('../../ui/Tooltip/Popover', function () { return ({
    __esModule: true,
    default: jest.fn(function (_a) {
        var content = _a.content, children = _a.children, isOpen = _a.isOpen;
        return isOpen ? <div data-testid="popover">{content}{children}</div> : null;
    }),
}); });
var mockStartTutorial = jest.fn();
var mockNextStep = jest.fn();
var mockPrevStep = jest.fn();
var mockGoToStep = jest.fn();
var mockEndTutorial = jest.fn();
var mockTutorial = {
    id: 'test-tutorial',
    title: 'Test Tutorial Title',
    content: 'Test tutorial content.',
    targetElementSelectors: ['.target1', '.target2'],
    filePath: 'test.md',
};
var mockAvailableStepsFromTutorial = function (tutorial) {
    return (tutorial === null || tutorial === void 0 ? void 0 : tutorial.targetElementSelectors) && tutorial.targetElementSelectors.length > 0
        ? tutorial.targetElementSelectors.map(function (selector) { return ({ targetSelector: selector }); })
        : tutorial ? [{ targetSelector: undefined }]
            : [];
};
describe('TutorialDisplay', function () {
    beforeEach(function () {
        // Reset mocks before each test
        jest.clearAllMocks();
        useTutorial.mockReturnValue({
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
    it('renders nothing when tutorial is not active', function () {
        render(<TutorialDisplay />);
        expect(screen.queryByTestId('popover')).not.toBeInTheDocument();
    });
    it('renders popover when tutorial is active', function () {
        useTutorial.mockReturnValueOnce({
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
    it('calls nextStep when Next button is clicked', function () {
        useTutorial.mockReturnValueOnce({
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
    it('calls prevStep when Previous button is clicked', function () {
        useTutorial.mockReturnValueOnce({
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
    it('calls endTutorial when Finish button is clicked', function () {
        useTutorial.mockReturnValueOnce({
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
    it('calls endTutorial when close (x) button is clicked', function () {
        useTutorial.mockReturnValueOnce({
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
    it('attempts to find target element if selector is present', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockElement;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockElement = document.createElement('div');
                    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);
                    mockElement.getBoundingClientRect = jest.fn(function () { return ({
                        left: 50, top: 50, width: 100, height: 20, right: 150, bottom: 70, x: 50, y: 50, toJSON: function () { return ({}); }
                    }); });
                    useTutorial.mockReturnValueOnce({
                        isTutorialActive: true,
                        currentTutorial: mockTutorial,
                        currentStepIndex: 0,
                        availableSteps: mockAvailableStepsFromTutorial(mockTutorial),
                        endTutorial: mockEndTutorial,
                    });
                    render(<TutorialDisplay />);
                    return [4 /*yield*/, waitFor(function () {
                            expect(document.querySelector).toHaveBeenCalledWith('.target1');
                        })];
                case 1:
                    _a.sent();
                    // Popover mock should be rendered (implicitly means targetElement was found or handled)
                    expect(screen.getByTestId('popover')).toBeInTheDocument();
                    return [2 /*return*/];
            }
        });
    }); });
    it('renders modal style popover if no target selector for step', function () {
        var tutorialWithoutSelectors = __assign(__assign({}, mockTutorial), { targetElementSelectors: undefined });
        useTutorial.mockReturnValueOnce({
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
    it('does not show Previous button on first step', function () {
        useTutorial.mockReturnValueOnce({
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
    it('shows Finish button instead of Next on last step', function () {
        useTutorial.mockReturnValueOnce({
            isTutorialActive: true,
            currentTutorial: mockTutorial,
            currentStepIndex: mockTutorial.targetElementSelectors.length - 1, // last step
            availableSteps: mockAvailableStepsFromTutorial(mockTutorial),
            endTutorial: mockEndTutorial,
        });
        render(<TutorialDisplay />);
        expect(screen.queryByText('Next')).not.toBeInTheDocument();
        expect(screen.getByText('Finish')).toBeInTheDocument();
        expect(screen.getByText('Previous')).toBeInTheDocument(); // Assuming more than 1 step
    });
    it('does not show close (x) button for single step tutorial', function () {
        var singleStepTutorial = __assign(__assign({}, mockTutorial), { targetElementSelectors: ['.onlyone'] });
        useTutorial.mockReturnValueOnce({
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
