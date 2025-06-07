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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { createContext, useReducer, useContext, useCallback, useEffect } from 'react';
import { getTutorialById } from '../services/TutorialService';
import { getCompletedTutorialIds, markTutorialAsCompleted as markTutorialCompletedInStorage, } from '../services/TutorialProgressService';
var initialState = {
    isTutorialActive: false,
    currentTutorial: null,
    currentTutorialId: null,
    currentStepIndex: 0,
    availableSteps: [],
    error: null,
    isLoading: false,
    completedTutorialIds: [], // Will be loaded from storage on provider mount
    hasCheckedInitialTutorial: false,
};
// 3. Reducer Function
var tutorialReducer = function (state, action) {
    switch (action.type) {
        case 'LOAD_COMPLETED_TUTORIALS':
            return __assign(__assign({}, state), { completedTutorialIds: action.payload.ids });
        case 'START_TUTORIAL_REQUEST':
            return __assign(__assign({}, initialState), { completedTutorialIds: state.completedTutorialIds, hasCheckedInitialTutorial: state.hasCheckedInitialTutorial, isLoading: true, currentTutorialId: action.payload.tutorialId });
        case 'START_TUTORIAL_SUCCESS':
            var tutorial = action.payload.tutorial;
            var steps = tutorial.targetElementSelectors && tutorial.targetElementSelectors.length > 0
                ? tutorial.targetElementSelectors.map(function (selector) { return ({ targetSelector: selector }); })
                : [{ targetSelector: undefined }]; // If no selectors, assume one general step
            return __assign(__assign({}, state), { isLoading: false, isTutorialActive: true, currentTutorial: tutorial, currentStepIndex: 0, availableSteps: steps, error: null });
        case 'START_TUTORIAL_FAILURE':
            return __assign(__assign({}, state), { isLoading: false, error: action.payload.error, isTutorialActive: false, currentTutorial: null, currentTutorialId: null });
        case 'NEXT_STEP':
            if (state.currentTutorial && state.currentStepIndex < state.availableSteps.length - 1) {
                return __assign(__assign({}, state), { currentStepIndex: state.currentStepIndex + 1 });
            }
            return state;
        case 'PREV_STEP':
            if (state.currentTutorial && state.currentStepIndex > 0) {
                return __assign(__assign({}, state), { currentStepIndex: state.currentStepIndex - 1 });
            }
            return state;
        case 'GO_TO_STEP':
            if (state.currentTutorial && action.payload.stepIndex >= 0 && action.payload.stepIndex < state.availableSteps.length) {
                return __assign(__assign({}, state), { currentStepIndex: action.payload.stepIndex });
            }
            return state;
        case 'END_TUTORIAL':
            // completedTutorialIds are preserved, initial check is preserved
            return __assign(__assign({}, initialState), { completedTutorialIds: state.completedTutorialIds, hasCheckedInitialTutorial: state.hasCheckedInitialTutorial });
        case 'MARK_TUTORIAL_COMPLETED':
            if (!state.completedTutorialIds.includes(action.payload.tutorialId)) {
                return __assign(__assign({}, state), { completedTutorialIds: __spreadArray(__spreadArray([], state.completedTutorialIds, true), [action.payload.tutorialId], false) });
            }
            return state;
        case 'SET_INITIAL_CHECK_DONE':
            return __assign(__assign({}, state), { hasCheckedInitialTutorial: true });
        default:
            return state;
    }
};
var TutorialContext = createContext(undefined);
// 5. Provider Component
var WELCOME_TUTORIAL_ID = '01-welcome';
export var TutorialProvider = function (_a) {
    var children = _a.children;
    var _b = useReducer(tutorialReducer, initialState), state = _b[0], dispatch = _b[1];
    useEffect(function () {
        var loadedCompletedIds = getCompletedTutorialIds();
        dispatch({ type: 'LOAD_COMPLETED_TUTORIALS', payload: { ids: loadedCompletedIds } });
    }, []);
    // Auto-start welcome tutorial if not completed and not already checked this session
    useEffect(function () {
        if (!state.isLoading && state.completedTutorialIds.length > 0 && !state.hasCheckedInitialTutorial) { // Ensure loaded and not checked
            if (!state.completedTutorialIds.includes(WELCOME_TUTORIAL_ID) && !state.isTutorialActive) {
                console.log('Auto-starting welcome tutorial');
                startTutorial(WELCOME_TUTORIAL_ID);
            }
            dispatch({ type: 'SET_INITIAL_CHECK_DONE' });
        }
        // Special case: if completedTutorialIds is empty when loaded AND we haven't checked, means first ever load potentially
        if (!state.isLoading && state.completedTutorialIds.length === 0 && !state.hasCheckedInitialTutorial) {
            console.log('Auto-starting welcome tutorial (no completed tutorials found)');
            startTutorial(WELCOME_TUTORIAL_ID);
            dispatch({ type: 'SET_INITIAL_CHECK_DONE' });
        }
    }, [state.completedTutorialIds, state.isLoading, state.isTutorialActive, state.hasCheckedInitialTutorial]); // Added dependencies
    var startTutorial = useCallback(function (tutorialId_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([tutorialId_1], args_1, true), void 0, function (tutorialId, forceRestart) {
            var tutorialData, err_1;
            if (forceRestart === void 0) { forceRestart = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (state.completedTutorialIds.includes(tutorialId) && !forceRestart) {
                            // Optionally, prompt user if they want to restart, or just do nothing.
                            // For now, just console log and don't start.
                            console.log("Tutorial \"".concat(tutorialId, "\" already completed. Use forceRestart to view again."));
                            return [2 /*return*/];
                        }
                        dispatch({ type: 'START_TUTORIAL_REQUEST', payload: { tutorialId: tutorialId } });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, getTutorialById(tutorialId)];
                    case 2:
                        tutorialData = _a.sent();
                        if (tutorialData) {
                            dispatch({ type: 'START_TUTORIAL_SUCCESS', payload: { tutorial: tutorialData } });
                        }
                        else {
                            dispatch({ type: 'START_TUTORIAL_FAILURE', payload: { error: "Tutorial with ID \"".concat(tutorialId, "\" not found.") } });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        dispatch({ type: 'START_TUTORIAL_FAILURE', payload: { error: 'Failed to fetch tutorial.' } });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }, [state.completedTutorialIds]); // Added dependency
    var nextStep = useCallback(function () { return dispatch({ type: 'NEXT_STEP' }); }, []);
    var prevStep = useCallback(function () { return dispatch({ type: 'PREV_STEP' }); }, []);
    var goToStep = useCallback(function (stepIndex) { return dispatch({ type: 'GO_TO_STEP', payload: { stepIndex: stepIndex } }); }, []);
    var endTutorialAndMarkCompleted = useCallback(function () {
        if (state.currentTutorialId) {
            markTutorialCompletedInStorage(state.currentTutorialId);
            dispatch({ type: 'MARK_TUTORIAL_COMPLETED', payload: { tutorialId: state.currentTutorialId } });
        }
        dispatch({ type: 'END_TUTORIAL' });
    }, [state.currentTutorialId]);
    var isTutorialCompleted = useCallback(function (tutorialId) {
        return state.completedTutorialIds.includes(tutorialId);
    }, [state.completedTutorialIds]);
    return (<TutorialContext.Provider value={__assign(__assign({}, state), { startTutorial: startTutorial, nextStep: nextStep, prevStep: prevStep, goToStep: goToStep, endTutorial: endTutorialAndMarkCompleted, // Use the new wrapper function
            isTutorialCompleted: isTutorialCompleted })}>
      {children}
    </TutorialContext.Provider>);
};
// Custom Hook to use the context
export var useTutorial = function () {
    var context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};
