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
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '../ui/Modal/Modal'; // Import the Modal component
import { solveFixedFractionalF, calculateKellyFraction } from '../../utils/sizingSolvers'; // Import solvers
var Tooltip = function (_a) {
    var text = _a.text, children = _a.children;
    var _b = useState(false), isVisible = _b[0], setIsVisible = _b[1];
    var tooltipRef = useRef(null);
    return (<div className="relative inline-block" onMouseEnter={function () { return setIsVisible(true); }} onMouseLeave={function () { return setIsVisible(false); }} onFocus={function () { return setIsVisible(true); }} // For keyboard accessibility
     onBlur={function () { return setIsVisible(false); }} // For keyboard accessibility
     tabIndex={0} // Make it focusable
    >
      {children}
      {isVisible && (<div ref={tooltipRef} className="absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm tooltip dark:bg-gray-700" style={{ bottom: '125%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }} // Basic positioning
         role="tooltip">
          {text}
          <div className="tooltip-arrow" data-popper-arrow style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '-4px' }}></div>
        </div>)}
    </div>);
};
// --- End Tooltip Component ---
// Define the total number of steps in the wizard (adjust as needed)
var TOTAL_STEPS = 7; // Increased for Review & Finalize step (0-Intro, 1-Goal, 2-CapObj, 3-Stats, 4-GoalParams, 5-Sizing, 6-Review)
var LOCAL_STORAGE_KEY = "goalSizingWizardState"; // For saving progress
var ONBOARDING_VIEWED_KEY = "goalSizingWizardOnboardingViewed";
var HIGH_F_THRESHOLD = 0.20; // Warn if suggested f is > 20%
var GoalSizingWizard = function (_a) {
    var _b;
    var isOpen = _a.isOpen, onClose = _a.onClose, onComplete = _a.onComplete, initialConfig = _a.initialConfig, _c = _a.isFirstTimeUser, isFirstTimeUser = _c === void 0 ? false : _c;
    var defaultConfig = useMemo(function () { return ({
        goalType: null, // Corrected: Was undefined, should be null or a GoalType
        goalParameters: {
            targetReturn: 10,
            timeFrame: 12,
            riskTolerance: "moderate",
            drawdownTolerance: 5,
            incomeTarget: 1000,
        },
        capitalObjectiveParameters: {
            currentBalance: 10000,
            targetBalance: 12000,
            timeHorizon: 1, // years
        },
        tradeStatistics: {
            winRate: 50, // %
            payoffRatio: 1.5, // R:R
            numTrades: 100, // per timeHorizon
        },
        sizingRules: {
            baseMethod: "fixedFractional",
            baseSizePercentage: 1,
            maxPositionSize: 2, // Default updated
            minPositionSize: 0.5,
            maxTotalExposure: 50, // Default updated
            volatilityAdjustment: {
                enabled: false,
                atrPeriod: 14,
                atrMultiplier: 1,
            },
            kellyFraction: "half",
            equityTrendFilter: {
                enabled: false,
                maPeriod: 20,
                allocationAboveMa: 100,
                allocationBelowMa: 50,
            },
        },
    }); }, []);
    // State to manage the current step
    var _d = useState(1), currentStep = _d[0], setCurrentStep = _d[1];
    // State to hold the configuration data being built throughout the wizard
    var _e = useState(initialConfig ? __assign(__assign({}, defaultConfig), initialConfig) : defaultConfig), config = _e[0], setConfig = _e[1];
    // State to manage validation errors per step (basic example)
    var _f = useState({}), errors = _f[0], setErrors = _f[1];
    var _g = useState({}), touched = _g[0], setTouched = _g[1];
    var _h = useState(false), showIntro = _h[0], setShowIntro = _h[1];
    var _j = useState({}), suggestedFractions = _j[0], setSuggestedFractions = _j[1]; // New state for suggestions
    var _k = useState(null), sizingWarning = _k[0], setSizingWarning = _k[1]; // New state for high f warning
    // --- Persistence Logic (Subtask 3.3) & Onboarding (Subtask 3.4) ---
    useEffect(function () {
        if (isOpen) {
            // Determine if onboarding/intro should be shown
            var onboardingViewed = localStorage.getItem(ONBOARDING_VIEWED_KEY);
            if (isFirstTimeUser && !onboardingViewed) { // Corrected: use isFirstTimeUser prop directly
                setShowIntro(true);
                setCurrentStep(0); // Set to an "intro" step index
            }
            else {
                setShowIntro(false);
                // Potentially load saved state from local storage if not first time
                // For now, just ensures wizard starts at step 1 if no intro
                var savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (savedState) {
                    try {
                        var _a = JSON.parse(savedState), savedStep = _a.step, savedData = _a.config;
                        if (savedStep && savedData) {
                            setConfig(savedData);
                            setCurrentStep(savedStep);
                        }
                        else {
                            // If part of the saved state is missing, reset
                            setConfig(defaultConfig);
                            setCurrentStep(1);
                        }
                    }
                    catch (error) {
                        console.error("Failed to parse saved wizard state:", error);
                        setConfig(defaultConfig);
                        setCurrentStep(1);
                        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
                    }
                }
                else {
                    // No saved state and no initial config, start fresh
                    setConfig(defaultConfig);
                    setCurrentStep(1);
                }
            }
        }
    }, [isOpen, isFirstTimeUser, initialConfig, defaultConfig]);
    // Save current config and step to local storage
    useEffect(function () {
        if (isOpen && !showIntro) { // Only save if wizard is open and not in intro mode
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ step: currentStep, config: config }));
                console.log('Saved wizard state to local storage.', { step: currentStep, config: config });
            }
            catch (error) {
                console.error('Failed to save wizard config to local storage:', error);
            }
        }
    }, [currentStep, config, isOpen, showIntro]);
    // useEffect to calculate suggested fractions when relevant parameters change
    useEffect(function () {
        if (config.goalType === 'capitalObjective' &&
            config.capitalObjectiveParameters &&
            config.tradeStatistics) {
            var _a = config.capitalObjectiveParameters, currentBalance = _a.currentBalance, targetBalance = _a.targetBalance, timeHorizon = _a.timeHorizon;
            var _b = config.tradeStatistics, winRate = _b.winRate, payoffRatio = _b.payoffRatio, numTrades = _b.numTrades;
            var newSizingWarning = null;
            if (currentBalance && currentBalance > 0 &&
                targetBalance && targetBalance > currentBalance &&
                timeHorizon && timeHorizon > 0 &&
                winRate !== undefined && winRate >= 0 && winRate <= 1 &&
                payoffRatio !== undefined && payoffRatio > 0 &&
                numTrades !== undefined && numTrades > 0 && Number.isInteger(numTrades)) {
                var targetCapitalRatio = targetBalance / currentBalance;
                var ffF = solveFixedFractionalF({
                    targetCapitalRatio: targetCapitalRatio,
                    winRate: winRate,
                    payoffRatio: payoffRatio,
                    numTrades: numTrades,
                });
                var kellyF = calculateKellyFraction({ winRate: winRate, payoffRatio: payoffRatio });
                var halfKellyF = kellyF !== null ? kellyF / 2 : null;
                setSuggestedFractions({
                    fixedFractional: ffF,
                    fullKelly: kellyF,
                    halfKelly: halfKellyF,
                });
                if (ffF !== null && ffF > HIGH_F_THRESHOLD) {
                    newSizingWarning = "Warning: The calculated Fixed Fractional risk per trade (".concat((ffF * 100).toFixed(1), "%) to meet your objective is high. Consider re-evaluating your inputs or using a more conservative approach.");
                }
                else if (kellyF !== null && kellyF > HIGH_F_THRESHOLD) {
                    // Only show Kelly warning if FF was not already high, or make it a combined warning
                    newSizingWarning = "Warning: The calculated Full Kelly risk per trade (".concat((kellyF * 100).toFixed(1), "%) is high. Consider using a smaller fraction of Kelly or re-evaluating your inputs.");
                }
                console.log('Calculated Suggested Fractions:', {
                    fixedFractional: ffF,
                    fullKelly: kellyF,
                    halfKelly: halfKellyF,
                    params: {
                        targetCapitalRatio: targetCapitalRatio,
                        winRate: winRate,
                        payoffRatio: payoffRatio,
                        numTrades: numTrades
                    }
                });
            }
            else {
                setSuggestedFractions({});
            }
            setSizingWarning(newSizingWarning);
        }
        else {
            setSuggestedFractions({});
            setSizingWarning(null);
        }
    }, [config.goalType, config.capitalObjectiveParameters, config.tradeStatistics]);
    // Effect to reset parts of the config when goalType changes
    useEffect(function () {
        if (config.goalType && !showIntro && currentStep !== 0) { // Only run if not in intro and a goal type is set
            var preservedCapitalObjectiveParams_1 = config.goalType === 'capitalObjective'
                ? config.capitalObjectiveParameters
                : defaultConfig.capitalObjectiveParameters;
            var preservedTradeStatistics_1 = config.goalType === 'capitalObjective'
                ? config.tradeStatistics
                : defaultConfig.tradeStatistics;
            setConfig(function (prevConfig) {
                var _a, _b;
                return (__assign(__assign({}, defaultConfig), { goalType: prevConfig.goalType, goalParameters: __assign(__assign({}, defaultConfig.goalParameters), { riskTolerance: prevConfig.goalType === 'growth' ? prevConfig.goalParameters.riskTolerance || "moderate" : undefined }), capitalObjectiveParameters: preservedCapitalObjectiveParams_1, tradeStatistics: preservedTradeStatistics_1, sizingRules: __assign(__assign({}, defaultConfig.sizingRules), { baseMethod: prevConfig.goalType === 'capitalObjective' ? "fixedFractional" : prevConfig.sizingRules.baseMethod || "fixedFractional", maxPositionSize: prevConfig.goalType === 'capitalObjective' ? 5 : ((_a = prevConfig.sizingRules.maxPositionSize) !== null && _a !== void 0 ? _a : 2), maxTotalExposure: prevConfig.goalType === 'capitalObjective' ? 5 : ((_b = prevConfig.sizingRules.maxTotalExposure) !== null && _b !== void 0 ? _b : 50) }) }));
            });
            setErrors({});
            setTouched({});
            setSuggestedFractions({}); // Clear any previous suggestions
        }
    }, [config.goalType, defaultConfig, showIntro, currentStep, setConfig]);
    // New useEffect to dynamically update position limits based on risk tolerance for 'growth' goal
    useEffect(function () {
        var _a, _b, _c;
        // Only apply this logic if the goal is 'growth' and risk tolerance is set.
        if (config.goalType === 'growth' && ((_a = config.goalParameters) === null || _a === void 0 ? void 0 : _a.riskTolerance)) {
            // Start with current values, so if no specific rule matches, they don't change to undefined
            var newMaxPositionSize_1 = (_b = config.sizingRules) === null || _b === void 0 ? void 0 : _b.maxPositionSize;
            var newMaxTotalExposure_1 = (_c = config.sizingRules) === null || _c === void 0 ? void 0 : _c.maxTotalExposure;
            var risk = config.goalParameters.riskTolerance;
            if (risk === 'conservative') {
                newMaxPositionSize_1 = 2;
                newMaxTotalExposure_1 = 20;
            }
            else if (risk === 'moderate') {
                newMaxPositionSize_1 = 5;
                newMaxTotalExposure_1 = 50;
            }
            else if (risk === 'aggressive') {
                newMaxPositionSize_1 = 10;
                newMaxTotalExposure_1 = 60;
            }
            // Only update if the calculated values are different from current ones
            // and ensure sizingRules is defined before comparing/setting.
            if (config.sizingRules &&
                (newMaxPositionSize_1 !== config.sizingRules.maxPositionSize ||
                    newMaxTotalExposure_1 !== config.sizingRules.maxTotalExposure)) {
                setConfig(function (prevConfig) { return (__assign(__assign({}, prevConfig), { sizingRules: __assign(__assign({}, prevConfig.sizingRules), { maxPositionSize: newMaxPositionSize_1, maxTotalExposure: newMaxTotalExposure_1 }) })); });
            }
        }
        // If goalType is not 'growth', these suggestions are not actively applied by this effect,
        // and the values would remain as set by other logic (e.g., radio button onChange or defaultConfig reset).
    }, [config.goalType, (_b = config.goalParameters) === null || _b === void 0 ? void 0 : _b.riskTolerance, config.sizingRules, setConfig]);
    // Dependencies:
    // - config.goalType: to trigger when goal type changes to/from 'growth'.
    // - config.goalParameters?.riskTolerance: to trigger when risk tolerance for growth changes.
    // - config.sizingRules: its properties (maxPositionSize, maxTotalExposure) are read for comparison.
    // - setConfig: as it's used to update state.
    // Placeholder validation functions for each step
    var validateStep = function (step) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        console.log("Validating Step ".concat(step, " (actual step: ").concat(step === 0 ? 'Intro' : step, ")"));
        var stepErrors = null;
        if (step === 0)
            return true; // No validation for intro step
        // --- Validation Logic (Part of Subtask 3.2, refining placeholders) ---
        switch (step) {
            case 1:
                // Validation for Step 1: Choose Goal Type
                if (!config.goalType) {
                    stepErrors = 'Please select a goal type.';
                }
                break;
            case 2: // New Step: Capital Objective
                if (config.goalType === 'capitalObjective') {
                    if (!((_a = config.capitalObjectiveParameters) === null || _a === void 0 ? void 0 : _a.currentBalance) || config.capitalObjectiveParameters.currentBalance <= 0) {
                        stepErrors = 'Please enter a valid current balance (must be > 0).';
                    }
                    else if (!((_b = config.capitalObjectiveParameters) === null || _b === void 0 ? void 0 : _b.targetBalance) || config.capitalObjectiveParameters.targetBalance <= 0) {
                        stepErrors = 'Please enter a valid target balance (must be > 0).';
                    }
                    else if (((_c = config.capitalObjectiveParameters) === null || _c === void 0 ? void 0 : _c.targetBalance) <= (((_d = config.capitalObjectiveParameters) === null || _d === void 0 ? void 0 : _d.currentBalance) || 0)) {
                        stepErrors = 'Target balance must be greater than current balance.';
                    }
                    else if (!((_e = config.capitalObjectiveParameters) === null || _e === void 0 ? void 0 : _e.timeHorizon) || config.capitalObjectiveParameters.timeHorizon <= 0) {
                        stepErrors = 'Please enter a valid time horizon in years (must be > 0).';
                    }
                }
                // If not capitalObjective, this step might be skipped or have different validation,
                // but for now, we assume other goal types bypass this step's specific inputs.
                // The main goalType check should ensure we only validate these if 'capitalObjective' is selected.
                break;
            case 3: // New Step: Trade Statistics (only if goalType is 'capitalObjective')
                if (config.goalType === 'capitalObjective') {
                    if (((_f = config.tradeStatistics) === null || _f === void 0 ? void 0 : _f.winRate) === undefined || config.tradeStatistics.winRate < 0 || config.tradeStatistics.winRate > 1) {
                        stepErrors = 'Please enter a valid win rate (between 0.0 and 1.0).';
                    }
                    else if (((_g = config.tradeStatistics) === null || _g === void 0 ? void 0 : _g.payoffRatio) === undefined || config.tradeStatistics.payoffRatio <= 0) {
                        stepErrors = 'Please enter a valid payoff ratio (must be > 0).';
                    }
                    else if (((_h = config.tradeStatistics) === null || _h === void 0 ? void 0 : _h.numTrades) === undefined || config.tradeStatistics.numTrades <= 0 || !Number.isInteger(config.tradeStatistics.numTrades)) {
                        stepErrors = 'Please enter a valid number of trades (must be a positive integer).';
                    }
                }
                // If goalType is not 'capitalObjective', this step should be skipped by flow logic, so no validation needed here for other types.
                break;
            case 4: // Previously Step 2 (now 3 for non-capitalObj): Set Goal Parameters (for growth, drawdown, income)
                if (config.goalType === 'growth') {
                    if (!config.goalParameters.targetAnnualReturn) {
                        stepErrors = 'Please enter your target annual return percentage.';
                    }
                    else if (!config.goalParameters.riskTolerance) {
                        stepErrors = 'Please select your risk tolerance level.';
                    }
                }
                else if (config.goalType === 'drawdown') {
                    if (!config.goalParameters.maxDrawdown) {
                        stepErrors = 'Please enter your maximum acceptable drawdown percentage.';
                    }
                    else if (!config.goalParameters.volatilityTarget) {
                        stepErrors = 'Please enter your portfolio volatility target.';
                    }
                }
                else if (config.goalType === 'income') {
                    if (!config.goalParameters.targetMonthlyIncome) {
                        stepErrors = 'Please enter your target monthly income.';
                    }
                    else if (!config.goalParameters.minPremium) {
                        stepErrors = 'Please enter your minimum premium per trade.';
                    }
                    else if (!config.goalParameters.tradeFrequency) {
                        stepErrors = 'Please select your preferred trade frequency.';
                    }
                }
                // No validation here if goalType is 'capitalObjective' as those params are in step 2
                break;
            case 5: // Previously Step 3 (now 4 for non-capitalObj, or 4 for capitalObj): Configure Sizing Rules
                if (!config.sizingRules.baseMethod) {
                    stepErrors = 'Please select a base sizing method.';
                }
                else {
                    // Validate method-specific parameters
                    if (config.sizingRules.baseMethod === 'fixed-percent' && !config.sizingRules.baseSize) {
                        stepErrors = 'Please enter your base position size percentage.';
                    }
                    else if (config.sizingRules.baseMethod === 'kelly-criterion') {
                        if (!config.sizingRules.kellyFraction) {
                            stepErrors = 'Please enter your Kelly Criterion fraction.';
                        }
                        else if (!config.sizingRules.winRateWindow) {
                            stepErrors = 'Please enter your win rate estimation window.';
                        }
                    }
                    else if (config.sizingRules.baseMethod === 'volatility-based') {
                        if (!config.sizingRules.volatilityPeriod) {
                            stepErrors = 'Please enter your volatility lookback period.';
                        }
                        else if (!config.sizingRules.riskPerVol) {
                            stepErrors = 'Please enter your risk per unit of volatility.';
                        }
                    }
                    // Validate position limits (required for all methods)
                    if (!config.sizingRules.maxPositionSize) {
                        stepErrors = 'Please enter your maximum position size limit.';
                    }
                    else if (!config.sizingRules.maxTotalExposure) {
                        stepErrors = 'Please enter your maximum total exposure limit.';
                    }
                }
                break;
            default:
                break; // No validation for unknown steps
        }
        setErrors(function (prevErrors) {
            var _a;
            return (__assign(__assign({}, prevErrors), (_a = {}, _a[step] = stepErrors, _a)));
        });
        return stepErrors === null;
    };
    // Handle moving to the next step
    var handleNext = function () {
        if (showIntro) {
            setShowIntro(false);
            setCurrentStep(1); // Move to the actual first step
            localStorage.setItem(ONBOARDING_VIEWED_KEY, 'true'); // Mark onboarding as viewed
            console.log('Onboarding intro finished, proceeding to step 1.');
            return;
        }
        if (validateStep(currentStep)) {
            var nextStepNumber = -1;
            if (currentStep === 1) {
                nextStepNumber = (config.goalType === 'capitalObjective') ? 2 : 4;
            }
            else if (currentStep === 2 && config.goalType === 'capitalObjective') {
                nextStepNumber = 3;
            }
            else if (currentStep === 3 && config.goalType === 'capitalObjective') {
                nextStepNumber = 5;
            }
            else if (currentStep === 4 && config.goalType !== 'capitalObjective') {
                nextStepNumber = 5;
            }
            else if (currentStep === 5) { // Advancing from Configure Sizing Rules
                nextStepNumber = 6; // Go to Review & Finalize step
            }
            // Step 6 (Review & Finalize) is the last content step.
            if (nextStepNumber === 5 && !config.sizingRules.baseMethod) {
                setConfig(function (prevConfig) { return (__assign(__assign({}, prevConfig), { sizingRules: __assign(__assign({}, prevConfig.sizingRules), { baseMethod: 'fixed-percent' }) })); });
            }
            // TOTAL_STEPS = 7. Last content step is 6.
            if (currentStep === 6) { // If current step IS the last content step (Review & Finalize)
                // onComplete is effectively the "Finish" action from the modal on this step
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Or handle profile saving here
                onComplete(config);
                onClose();
                setCurrentStep(1);
                setConfig({ goalType: null, capitalObjectiveParameters: {}, tradeStatistics: {}, goalParameters: {}, sizingRules: {} });
                setErrors({});
                setSizingWarning(null);
                setSuggestedFractions({});
            }
            else if (nextStepNumber !== -1) {
                setCurrentStep(nextStepNumber);
                setErrors(function (prevErrors) {
                    var _a;
                    return (__assign(__assign({}, prevErrors), (_a = {}, _a[currentStep] = null, _a)));
                });
            }
            else {
                console.error("Error in handleNext: nextStepNumber not determined for currentStep:", currentStep, "config:", config);
            }
        }
        else {
            console.log("Validation failed for Step ".concat(currentStep, ". Errors:"), errors[currentStep]);
        }
    };
    // Handle moving back to the previous step
    var handleBack = function () {
        if (showIntro)
            return;
        var prevStepNumber = -1;
        if (currentStep === 6) { // Currently on Review & Finalize
            prevStepNumber = 5; // Go back to Configure Sizing Rules
        }
        else if (currentStep === 5) {
            prevStepNumber = (config.goalType === 'capitalObjective') ? 3 : 4;
        }
        else if (currentStep === 4 && config.goalType !== 'capitalObjective') {
            prevStepNumber = 1;
        }
        else if (currentStep === 3 && config.goalType === 'capitalObjective') {
            prevStepNumber = 2;
        }
        else if (currentStep === 2 && config.goalType === 'capitalObjective') {
            prevStepNumber = 1;
        }
        if (prevStepNumber !== -1 && prevStepNumber >= 1) {
            setCurrentStep(prevStepNumber);
            setErrors(function (prevErrors) {
                var _a;
                return (__assign(__assign({}, prevErrors), (_a = {}, _a[currentStep] = null, _a[prevStepNumber] = null, _a)));
            });
        }
        else if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setErrors(function (prevErrors) {
                var _a;
                return (__assign(__assign({}, prevErrors), (_a = {}, _a[currentStep] = null, _a[currentStep - 1] = null, _a)));
            });
        }
    };
    // Handle cancelling the wizard
    var handleCancel = function () {
        // If cancelling from intro, still mark as viewed to avoid showing it again immediately
        if (showIntro) {
            localStorage.setItem(ONBOARDING_VIEWED_KEY, 'true');
        }
        onClose();
        // Resetting state on cancel to provide a clean slate if reopened, unless resuming is desired.
        // The local storage would still hold the last saved state for resuming if not cleared here.
        // setShowIntro(false); // Handled by isOpen effect
        // setCurrentStep(1); // Handled by isOpen effect
        // setConfig({ goalType: null, capitalObjectiveParameters: {}, goalParameters: {}, sizingRules: {} });
        // setErrors({});
    };
    // Render the content for the current step (placeholder - will be replaced by step components)
    var renderStepContent = function () {
        var _a, _b, _c, _d, _e, _f, _g;
        if (showIntro) {
            return (<div>
          <h3 className="text-xl font-semibold mb-2">Welcome to the Goal-Driven Sizing Wizard!</h3>
          <p className="my-2 text-gray-600">This wizard will guide you through setting up personalized position sizing rules based on your trading objectives.</p>
          <p className="my-2 text-gray-600">You'll define your primary goal (like Growth, Drawdown Protection, or Income), set specific parameters for that goal, and then configure how your trade sizes will be determined.</p>
          <p className="text-gray-600">Click 'Get Started' to begin.</p>
        </div>);
        }
        switch (currentStep) {
            case 1:
                return (<div>
            <h3 className="text-lg font-medium mb-3">Step 1: Choose Your Primary Trading Goal</h3>
            <p className="text-sm text-gray-600 mb-2">What is the main objective you want to achieve with your position sizing strategy?</p>
            <div className="space-y-2 mt-4">
              <label className="flex items-center">
                <input type="radio" name="goalType" value="capitalObjective" checked={config.goalType === 'capitalObjective'} onChange={function () { return setConfig(__assign(__assign({}, config), { goalType: 'capitalObjective', capitalObjectiveParameters: { currentBalance: 10000, targetBalance: 20000, timeHorizon: 1 }, tradeStatistics: { winRate: 0.5, payoffRatio: 1.5, numTrades: 100 }, goalParameters: {}, sizingRules: {
                            maxPositionSize: 5, // Set to 5 for capital objective
                            maxTotalExposure: 5, // Set to 5 for capital objective
                            baseMethod: config.sizingRules.baseMethod || 'fixed-percent'
                        } })); }} className="form-radio h-4 w-4 text-blue-600"/>
                <span className="ml-2 text-gray-700">Achieve a Specific Capital Objective</span>
                <Tooltip text="Define a target capital amount you want to reach within a specific timeframe.">
                  <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                </Tooltip>
              </label>
              <label className="flex items-center">
                <input type="radio" name="goalType" value="growth" checked={config.goalType === 'growth'} onChange={function () { return setConfig(__assign(__assign({}, config), { goalType: 'growth', goalParameters: { targetAnnualReturn: 15, riskTolerance: 'moderate' }, capitalObjectiveParameters: {}, tradeStatistics: {}, sizingRules: {
                            maxPositionSize: 5, // Default Max Position Size
                            maxTotalExposure: 5, // Default Max Total Exposure
                            baseMethod: config.sizingRules.baseMethod || 'fixed-percent' // Preserve or set default baseMethod
                        } })); }} className="form-radio h-4 w-4 text-blue-600"/>
                <span className="ml-2 text-gray-700">Maximize Growth</span>
                <Tooltip text="Focus on strategies that aim for the highest possible returns, potentially with higher risk.">
                  <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                </Tooltip>
              </label>
              <label className="flex items-center">
                <input type="radio" name="goalType" value="drawdown" checked={config.goalType === 'drawdown'} onChange={function () { return setConfig(__assign(__assign({}, config), { goalType: 'drawdown', goalParameters: { maxDrawdown: 10, volatilityTarget: 5 }, capitalObjectiveParameters: {}, tradeStatistics: {}, sizingRules: {
                            maxPositionSize: 5, // Default Max Position Size
                            maxTotalExposure: 5, // Default Max Total Exposure
                            baseMethod: config.sizingRules.baseMethod || 'fixed-percent' // Preserve or set default baseMethod
                        } })); }} className="form-radio h-4 w-4 text-blue-600"/>
                <span className="ml-2 text-gray-700">Protect Capital (Minimize Drawdown)</span>
                <Tooltip text="Prioritize capital preservation by limiting potential losses, even if it means lower potential gains.">
                  <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                </Tooltip>
              </label>
              <label className="flex items-center">
                <input type="radio" name="goalType" value="income" checked={config.goalType === 'income'} onChange={function () { return setConfig(__assign(__assign({}, config), { goalType: 'income', goalParameters: { targetMonthlyIncome: 500, minPremium: 5, tradeFrequency: 'weekly' }, capitalObjectiveParameters: {}, tradeStatistics: {}, sizingRules: {
                            maxPositionSize: 5, // Default Max Position Size
                            maxTotalExposure: 5, // Default Max Total Exposure
                            baseMethod: config.sizingRules.baseMethod || 'fixed-percent' // Preserve or set default baseMethod
                        } })); }} className="form-radio h-4 w-4 text-blue-600"/>
                <span className="ml-2 text-gray-700">Generate Consistent Income</span>
                <Tooltip text="Aim for regular, stable returns, often suited for strategies that generate cash flow (e.g., options selling).">
                  <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                </Tooltip>
              </label>
            </div>
          </div>);
            case 2: // Step 2: Define Your Capital Objective (if goalType is 'capitalObjective')
                if (config.goalType !== 'capitalObjective') {
                    // This step should be skipped by flow logic if not 'capitalObjective'
                    return <p className="text-gray-500 italic">Loading...</p>;
                }
                return (<div>
            <h3 className="text-lg font-medium mb-3">Step 2: Define Your Capital Objective</h3>
            <p className="text-sm text-gray-600 mb-4">Specify your current capital, target capital, and the timeframe to achieve it.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="currentBalance">Current Account Balance ($)</label>
                <input id="currentBalance" type="number" min="1" // Assuming balance must be positive
                 step="100" value={((_a = config.capitalObjectiveParameters) === null || _a === void 0 ? void 0 : _a.currentBalance) || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { capitalObjectiveParameters: __assign(__assign({}, config.capitalObjectiveParameters), { currentBalance: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="targetBalance">Target Account Balance ($)</label>
                <input id="targetBalance" type="number" min="1" // Assuming target must be positive
                 step="100" value={((_b = config.capitalObjectiveParameters) === null || _b === void 0 ? void 0 : _b.targetBalance) || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { capitalObjectiveParameters: __assign(__assign({}, config.capitalObjectiveParameters), { targetBalance: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="timeHorizon">Time Horizon (Years)</label>
                <input id="timeHorizon" type="number" min="0.1" // Min 1/10th of a year
                 max="50" // Max 50 years
                 step="0.1" value={((_c = config.capitalObjectiveParameters) === null || _c === void 0 ? void 0 : _c.timeHorizon) || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { capitalObjectiveParameters: __assign(__assign({}, config.capitalObjectiveParameters), { timeHorizon: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
              </div>
            </div>
          </div>);
            case 3: // New Step 3: Collect Trade Statistics (if goalType is 'capitalObjective')
                if (config.goalType !== 'capitalObjective') {
                    // This step should be skipped by flow logic if not 'capitalObjective'
                    return <p className="text-gray-500 italic">Loading...</p>;
                }
                return (<div>
            <h3 className="text-lg font-medium mb-3">Step 3: Provide Your Typical Trade Statistics</h3>
            <p className="text-sm text-gray-600 mb-4">These statistics help in calculating realistic position sizes for your capital objective.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="winRate">Estimated Win Rate (e.g., 0.55 for 55%)</label>
                <input id="winRate" type="number" min="0.01" max="1.00" step="0.01" value={((_d = config.tradeStatistics) === null || _d === void 0 ? void 0 : _d.winRate) === undefined ? '' : config.tradeStatistics.winRate} onChange={function (e) { return setConfig(__assign(__assign({}, config), { tradeStatistics: __assign(__assign({}, config.tradeStatistics), { winRate: parseFloat(e.target.value) || undefined }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g., 0.55"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="payoffRatio">Average Payoff Ratio (e.g., 1.5 for 1.5:1 Win/Loss)</label>
                <input id="payoffRatio" type="number" min="0.01" // Technically > 0
                 step="0.1" value={((_e = config.tradeStatistics) === null || _e === void 0 ? void 0 : _e.payoffRatio) === undefined ? '' : config.tradeStatistics.payoffRatio} onChange={function (e) { return setConfig(__assign(__assign({}, config), { tradeStatistics: __assign(__assign({}, config.tradeStatistics), { payoffRatio: parseFloat(e.target.value) || undefined }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g., 1.5"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="numTrades">Expected Number of Trades (over your chosen time horizon)</label>
                <input id="numTrades" type="number" min="1" step="1" value={((_f = config.tradeStatistics) === null || _f === void 0 ? void 0 : _f.numTrades) === undefined ? '' : config.tradeStatistics.numTrades} onChange={function (e) {
                        var val = parseInt(e.target.value);
                        setConfig(__assign(__assign({}, config), { tradeStatistics: __assign(__assign({}, config.tradeStatistics), { numTrades: isNaN(val) ? undefined : val }) }));
                    }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g., 250"/>
              </div>
            </div>
          </div>);
            case 4: // Step 4: Set Goal Parameters (if goalType is NOT 'capitalObjective')
                if (config.goalType === 'capitalObjective') {
                    // This step should be skipped by flow logic if 'capitalObjective'
                    return <p className="text-gray-500 italic">Loading...</p>;
                }
                // Original content for Step 2 (now Step 3 for non-cap-obj path, and labeled Step 4 here)
                return (<div>
            <h3 className="text-lg font-medium mb-3">Step 4: Set Goal Parameters</h3>
            <p className="text-sm text-gray-600 mb-2">Define specific parameters for your chosen goal: <span className="font-semibold">{config.goalType || 'N/A'}</span>.</p>
            
            {/* Growth Goal Parameters */}
            {config.goalType === 'growth' && (<div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="targetAnnualReturn">Target Annual Return (%)</label>
                  <input id="targetAnnualReturn" type="number" min="1" max="1000" step="0.1" value={config.goalParameters.targetAnnualReturn || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { goalParameters: __assign(__assign({}, config.goalParameters), { targetAnnualReturn: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="riskTolerance">Risk Tolerance Level</label>
                  <select id="riskTolerance" value={config.goalParameters.riskTolerance || 'moderate'} onChange={function (e) { return setConfig(__assign(__assign({}, config), { goalParameters: __assign(__assign({}, config.goalParameters), { riskTolerance: e.target.value }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    <option value="conservative">Conservative (1-2% per trade)</option>
                    <option value="moderate">Moderate (2-5% per trade)</option>
                    <option value="aggressive">Aggressive (5-10% per trade)</option>
                  </select>
                </div>
              </div>)}

            {/* Drawdown Protection Parameters */}
            {config.goalType === 'drawdown' && (<div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Acceptable Drawdown (%)
                    <Tooltip text="The maximum percentage loss you're willing to accept in your portfolio. This helps set strict position size limits.">
                      <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                    </Tooltip>
                  </label>
                  <input type="number" min="1" max="100" step="0.1" value={config.goalParameters.maxDrawdown || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { goalParameters: __assign(__assign({}, config.goalParameters), { maxDrawdown: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portfolio Volatility Target (%)
                    <Tooltip text="Your target portfolio volatility. Lower values result in more conservative position sizing.">
                      <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                    </Tooltip>
                  </label>
                  <input type="number" min="1" max="100" step="0.1" value={config.goalParameters.volatilityTarget || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { goalParameters: __assign(__assign({}, config.goalParameters), { volatilityTarget: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                </div>
              </div>)}

            {/* Income Goal Parameters */}
            {config.goalType === 'income' && (<div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Monthly Income ($)
                    <Tooltip text="Your desired monthly income from trading. This helps determine minimum position sizes and frequency.">
                      <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                    </Tooltip>
                  </label>
                  <input type="number" min="100" step="100" value={config.goalParameters.targetMonthlyIncome || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { goalParameters: __assign(__assign({}, config.goalParameters), { targetMonthlyIncome: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Premium Per Trade ($)
                    <Tooltip text="The minimum premium you want to collect per trade. Helps ensure trades are worth the effort.">
                      <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                    </Tooltip>
                  </label>
                  <input type="number" min="1" step="1" value={config.goalParameters.minPremium || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { goalParameters: __assign(__assign({}, config.goalParameters), { minPremium: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trade Frequency
                    <Tooltip text="How often you plan to place trades. This helps calculate required position sizes to meet income goals.">
                      <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                    </Tooltip>
                  </label>
                  <select value={config.goalParameters.tradeFrequency || 'weekly'} onChange={function (e) { return setConfig(__assign(__assign({}, config), { goalParameters: __assign(__assign({}, config.goalParameters), { tradeFrequency: e.target.value }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    <option value="daily">Daily (20+ trades/month)</option>
                    <option value="weekly">Weekly (4-8 trades/month)</option>
                    <option value="monthly">Monthly (1-3 trades/month)</option>
                  </select>
                </div>
              </div>)}

            {!config.goalType && (<p className="text-red-500">Please select a goal in Step 1 first.</p>)}
          </div>);
            case 5: // Step 5: Configure Sizing Rules (all paths lead here eventually)
                var capitalObjectiveInfo = null;
                if (config.goalType === 'capitalObjective' && config.capitalObjectiveParameters) {
                    var _h = config.capitalObjectiveParameters, currentBalance_1 = _h.currentBalance, targetBalance = _h.targetBalance, timeHorizon = _h.timeHorizon;
                    if (currentBalance_1 && targetBalance && timeHorizon && currentBalance_1 > 0 && timeHorizon > 0 && targetBalance > currentBalance_1) {
                        var totalReturnNeeded = (targetBalance / currentBalance_1) - 1;
                        var annualReturnNeeded = Math.pow((targetBalance / currentBalance_1), (1 / timeHorizon)) - 1;
                        capitalObjectiveInfo = (<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-semibold text-blue-700 mb-1">Capital Objective Summary:</h4>
                <p className="text-xs text-blue-600">
                  Target: Grow from <span className="font-medium">${currentBalance_1.toLocaleString()}</span> to <span className="font-medium">${targetBalance.toLocaleString()}</span> in <span className="font-medium">{timeHorizon} {timeHorizon === 1 ? 'year' : 'years'}</span>.
                </p>
                <p className="text-xs text-blue-600">
                  Total Return Needed: <span className="font-medium">{(totalReturnNeeded * 100).toFixed(2)}%</span>
                </p>
                <p className="text-xs text-blue-600">
                  Equivalent Annual Return: <span className="font-medium">{(annualReturnNeeded * 100).toFixed(2)}%</span>
                </p>
              </div>);
                    }
                }
                // Variable to hold the fixed fractional recommendation UI
                var fixedFractionalRecommendation = null;
                if (config.goalType === 'capitalObjective' &&
                    config.sizingRules.baseMethod === 'fixed-percent' &&
                    suggestedFractions.fixedFractional !== undefined &&
                    suggestedFractions.fixedFractional !== null &&
                    suggestedFractions.fixedFractional > 0) {
                    fixedFractionalRecommendation = (<div className="mt-1 mb-2 p-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md">
              <span className="font-semibold">Suggestion:</span> To meet your capital objective, consider a base size of approximately <span className="font-bold">{(suggestedFractions.fixedFractional * 100).toFixed(2)}%</span> per trade.
              Adjust based on your strategy's specifics and risk tolerance.
            </div>);
                }
                // Variable to hold the Kelly recommendations UI
                var kellyRecommendations = null;
                if (config.goalType === 'capitalObjective' &&
                    config.sizingRules.baseMethod === 'kelly-criterion' &&
                    suggestedFractions.fullKelly !== undefined &&
                    suggestedFractions.fullKelly !== null && suggestedFractions.fullKelly > 0
                // We can assume halfKelly will also be valid if fullKelly is
                ) {
                    kellyRecommendations = (<div className="mt-1 mb-2 p-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
              <p className="font-semibold">Calculated Kelly Values (based on your trade stats):</p>
              <ul className="list-disc list-inside ml-2">
                <li>Full Kelly: <span className="font-bold">{(suggestedFractions.fullKelly * 100).toFixed(2)}%</span> risk per trade</li>
                {suggestedFractions.halfKelly !== undefined && suggestedFractions.halfKelly !== null && (<li>Half Kelly: <span className="font-bold">{(suggestedFractions.halfKelly * 100).toFixed(2)}%</span> risk per trade</li>)}
              </ul>
              <p className="mt-1">Use the 'Kelly Fraction' input below to apply one of these, or a custom fraction (e.g., 0.25 for Quarter Kelly).</p>
            </div>);
                }
                return (<div>
            <h3 className="text-lg font-medium mb-3">Step 5: Configure Sizing Rules</h3>
            {capitalObjectiveInfo}
            {/* Display Sizing Warning if present */}
            {sizingWarning && (<div className="my-3 p-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-300 rounded-md" role="alert">
                <span className="font-medium">Heads up!</span> {sizingWarning}
              </div>)}
            <p className="text-sm text-gray-600 mb-2">Set up how your position sizes will be determined based on your goals and parameters.</p>
            
            <div className="space-y-4">
              {/* Base Sizing Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Sizing Method
                  <Tooltip text="The primary method used to calculate your position sizes. This forms the foundation of your sizing strategy.">
                    <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                  </Tooltip>
                </label>
                <select value={config.sizingRules.baseMethod || 'fixed-percent'} onChange={function (e) { return setConfig(__assign(__assign({}, config), { sizingRules: __assign(__assign({}, config.sizingRules), { baseMethod: e.target.value, 
                            // Reset method-specific params when baseMethod changes
                            baseSize: config.sizingRules.baseMethod === 'fixed-percent' ? config.sizingRules.baseSize : undefined, kellyFraction: config.sizingRules.baseMethod === 'kelly-criterion' ? config.sizingRules.kellyFraction : undefined, winRateWindow: config.sizingRules.baseMethod === 'kelly-criterion' ? config.sizingRules.winRateWindow : undefined, volatilityPeriod: config.sizingRules.baseMethod === 'volatility-based' ? config.sizingRules.volatilityPeriod : undefined, riskPerVol: config.sizingRules.baseMethod === 'volatility-based' ? config.sizingRules.riskPerVol : undefined }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="fixed-percent">Fixed Percentage of Account</option>
                  <option value="kelly-criterion">Kelly Criterion</option>
                  <option value="volatility-based">Volatility-Based Sizing</option>
                </select>
              </div>

              {/* Fixed Percentage Settings */}
              {config.sizingRules.baseMethod === 'fixed-percent' && (<div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Position Size (% of Account)
                    <Tooltip text="The standard percentage of your account to risk on each trade before adjustments.">
                      <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                    </Tooltip>
                  </label>
                  {fixedFractionalRecommendation}
                  <input type="number" min="0.1" max="100" step="0.1" value={config.sizingRules.baseSize || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { sizingRules: __assign(__assign({}, config.sizingRules), { baseSize: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                </div>)}

              {/* Kelly Criterion Settings */}
              {config.sizingRules.baseMethod === 'kelly-criterion' && (<div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kelly Fraction (0-1)
                      <Tooltip text="Fraction of the full Kelly bet to use. Lower values are more conservative. 0.5 is 'Half Kelly'.">
                        <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                      </Tooltip>
                    </label>
                    {kellyRecommendations}
                    <input type="number" min="0.1" max="1" step="0.1" value={config.sizingRules.kellyFraction || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { sizingRules: __assign(__assign({}, config.sizingRules), { kellyFraction: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Win Rate Estimation Window (trades)
                      <Tooltip text="Number of recent trades to use for win rate calculation in Kelly formula.">
                        <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                      </Tooltip>
                    </label>
                    <input type="number" min="10" max="1000" step="10" value={config.sizingRules.winRateWindow || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { sizingRules: __assign(__assign({}, config.sizingRules), { winRateWindow: parseInt(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                  </div>
                </div>)}

              {/* Volatility-Based Settings */}
              {config.sizingRules.baseMethod === 'volatility-based' && (<div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Volatility Lookback Period (days)
                      <Tooltip text="Number of days to look back for calculating volatility. Longer periods are more stable but less responsive.">
                        <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                      </Tooltip>
                    </label>
                    <input type="number" min="5" max="252" step="1" value={config.sizingRules.volatilityPeriod || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { sizingRules: __assign(__assign({}, config.sizingRules), { volatilityPeriod: parseInt(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Risk Per Unit of Volatility (%)
                      <Tooltip text="How much to risk for each unit of volatility. Lower values create smaller positions in volatile markets.">
                        <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                      </Tooltip>
                    </label>
                    <input type="number" min="0.1" max="10" step="0.1" value={config.sizingRules.riskPerVol || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { sizingRules: __assign(__assign({}, config.sizingRules), { riskPerVol: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                  </div>
                </div>)}

              {/* Common Adjustments for All Methods */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Adjustments</h4>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" checked={config.sizingRules.useMarketCap || false} onChange={function (e) { return setConfig(__assign(__assign({}, config), { sizingRules: __assign(__assign({}, config.sizingRules), { useMarketCap: e.target.checked }) })); }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                      <span className="ml-2 text-sm text-gray-700">
                        Adjust for Market Cap
                        <Tooltip text="Reduce position sizes for small-cap stocks and increase for large-caps.">
                          <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                        </Tooltip>
                      </span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" checked={config.sizingRules.useEarnings || false} onChange={function (e) { return setConfig(__assign(__assign({}, config), { sizingRules: __assign(__assign({}, config.sizingRules), { useEarnings: e.target.checked }) })); }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                      <span className="ml-2 text-sm text-gray-700">
                        Reduce Size Near Earnings
                        <Tooltip text="Automatically reduce position sizes for trades held through earnings announcements.">
                          <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                        </Tooltip>
                      </span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" checked={config.sizingRules.useCorrelation || false} onChange={function (e) { return setConfig(__assign(__assign({}, config), { sizingRules: __assign(__assign({}, config.sizingRules), { useCorrelation: e.target.checked }) })); }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                      <span className="ml-2 text-sm text-gray-700">
                        Account for Position Correlation
                        <Tooltip text="Adjust sizes based on correlation with existing positions to manage portfolio risk.">
                          <span className="ml-1 text-blue-500 cursor-help">(?)</span>
                        </Tooltip>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Position Limits */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Position Limits</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="maxPositionSize">Maximum Position Size (% of Account)</label>
                    <input id="maxPositionSize" type="number" min="1" max="100" step="1" value={config.sizingRules.maxPositionSize || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { sizingRules: __assign(__assign({}, config.sizingRules), { maxPositionSize: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="maxTotalExposure">Maximum Total Exposure (% of Account)</label>
                    <input id="maxTotalExposure" type="number" min="1" max="200" step="1" value={config.sizingRules.maxTotalExposure || ''} onChange={function (e) { return setConfig(__assign(__assign({}, config), { sizingRules: __assign(__assign({}, config.sizingRules), { maxTotalExposure: parseFloat(e.target.value) || 0 }) })); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                  </div>
                </div>
              </div>
            </div>
          </div>);
            case 6: // New Step: Review & Finalize
                var goalType = config.goalType, capitalObjectiveParameters = config.capitalObjectiveParameters, tradeStatistics = config.tradeStatistics, goalParameters = config.goalParameters, sizingRules_1 = config.sizingRules;
                var renderSizingRuleDetails = function () {
                    if (!sizingRules_1.baseMethod)
                        return <p className="text-sm text-gray-500">No sizing method configured.</p>;
                    var details = [];
                    details.push(<li key="base"><strong>Base Method:</strong> {formatEnumValue_1(sizingRules_1.baseMethod)}</li>);
                    if (sizingRules_1.baseMethod === 'fixed-percent' && sizingRules_1.baseSize !== undefined) {
                        details.push(<li key="fp-size">Base Size: {sizingRules_1.baseSize}% of account</li>);
                    }
                    if (sizingRules_1.baseMethod === 'kelly-criterion') {
                        if (sizingRules_1.kellyFraction !== undefined)
                            details.push(<li key="kc-fraction">Kelly Fraction: {sizingRules_1.kellyFraction}</li>);
                        if (sizingRules_1.winRateWindow !== undefined)
                            details.push(<li key="kc-window">Win Rate Window: {sizingRules_1.winRateWindow} trades</li>);
                    }
                    if (sizingRules_1.baseMethod === 'volatility-based') {
                        if (sizingRules_1.volatilityPeriod !== undefined)
                            details.push(<li key="vb-period">Volatility Period: {sizingRules_1.volatilityPeriod} days</li>);
                        if (sizingRules_1.riskPerVol !== undefined)
                            details.push(<li key="vb-risk">Risk Per Volatility Unit (%): {sizingRules_1.riskPerVol}</li>);
                    }
                    details.push(<li key="adj-mc">Market Cap Adjustment: {sizingRules_1.useMarketCap ? 'Enabled' : 'Disabled'}</li>);
                    details.push(<li key="adj-earn">Earnings Adjustment: {sizingRules_1.useEarnings ? 'Enabled' : 'Disabled'}</li>);
                    details.push(<li key="adj-corr">Correlation Adjustment: {sizingRules_1.useCorrelation ? 'Enabled' : 'Disabled'}</li>);
                    if (sizingRules_1.maxPositionSize !== undefined)
                        details.push(<li key="limit-pos">Max Position Size (%): {sizingRules_1.maxPositionSize}</li>);
                    if (sizingRules_1.maxTotalExposure !== undefined)
                        details.push(<li key="limit-exp">Max Total Exposure (%): {sizingRules_1.maxTotalExposure}</li>);
                    return <ul className="list-disc list-inside space-y-1 text-sm">{details}</ul>;
                };
                var formatEnumValue_1 = function (value) {
                    if (!value)
                        return 'N/A';
                    return value.split('-').map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1); }).join(' ');
                };
                // Calculate dollar values for position limits if possible
                var currentBalance = capitalObjectiveParameters === null || capitalObjectiveParameters === void 0 ? void 0 : capitalObjectiveParameters.currentBalance;
                var maxPositionSizePct = sizingRules_1 === null || sizingRules_1 === void 0 ? void 0 : sizingRules_1.maxPositionSize;
                var maxTotalExposurePct = sizingRules_1 === null || sizingRules_1 === void 0 ? void 0 : sizingRules_1.maxTotalExposure;
                var maxPositionSizeDollar = (currentBalance && maxPositionSizePct)
                    ? ((maxPositionSizePct / 100) * currentBalance)
                    : null;
                var maxTotalExposureDollar = (currentBalance && maxTotalExposurePct)
                    ? ((maxTotalExposurePct / 100) * currentBalance)
                    : null;
                return (<div>
            <h3 className="text-lg font-medium mb-1">Step 6: Review & Finalize Configuration</h3>
            <p className="text-xs text-gray-500 mb-4">Please review your complete Goal Sizing Profile. Click 'Finish' to complete.</p>

            <div className="space-y-4 text-sm">
                <div>
                    <h4 className="font-semibold text-gray-700">Primary Goal:</h4>
                    <p className="text-gray-600">{formatEnumValue_1(goalType)}</p>
                </div>

                {goalType === 'capitalObjective' && capitalObjectiveParameters && (<>
                        <div>
                            <h4 className="font-semibold text-gray-700">Capital Objective:</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                                {capitalObjectiveParameters.currentBalance !== undefined && <li>Current Balance: ${capitalObjectiveParameters.currentBalance.toLocaleString()}</li>}
                                {capitalObjectiveParameters.targetBalance !== undefined && <li>Target Balance: ${capitalObjectiveParameters.targetBalance.toLocaleString()}</li>}
                                {capitalObjectiveParameters.timeHorizon !== undefined && <li>Time Horizon: {capitalObjectiveParameters.timeHorizon} {capitalObjectiveParameters.timeHorizon === 1 ? 'year' : 'years'}</li>}
                                {capitalObjectiveParameters.currentBalance && capitalObjectiveParameters.targetBalance && capitalObjectiveParameters.timeHorizon && (<>
                                        <li>Total Return Needed: {((capitalObjectiveParameters.targetBalance / capitalObjectiveParameters.currentBalance) - 1 * 100).toFixed(2)}%</li>
                                        <li>Annual Return Needed: {(Math.pow(capitalObjectiveParameters.targetBalance / capitalObjectiveParameters.currentBalance, 1 / capitalObjectiveParameters.timeHorizon) - 1 * 100).toFixed(2)}%</li>
                                    </>)}
                            </ul>
                        </div>
                        {tradeStatistics && (<div>
                                <h4 className="font-semibold text-gray-700">Trade Statistics:</h4>
                                <ul className="list-disc list-inside space-y-1 text-gray-600">
                                    {tradeStatistics.winRate !== undefined && <li>Win Rate: {(tradeStatistics.winRate * 100).toFixed(1)}%</li>}
                                    {tradeStatistics.payoffRatio !== undefined && <li>Payoff Ratio: {tradeStatistics.payoffRatio}:1</li>}
                                    {tradeStatistics.numTrades !== undefined && <li>Number of Trades: {tradeStatistics.numTrades}</li>}
                                </ul>
                            </div>)}
                        {Object.keys(suggestedFractions).length > 0 && (<div>
                                <h4 className="font-semibold text-gray-700">Suggested Sizing Fractions (Risk % per trade):</h4>
                                <ul className="list-disc list-inside space-y-1 text-gray-600">
                                    {suggestedFractions.fixedFractional !== null && suggestedFractions.fixedFractional !== undefined && <li>Fixed Fractional: {(suggestedFractions.fixedFractional * 100).toFixed(2)}%</li>}
                                    {suggestedFractions.fullKelly !== null && suggestedFractions.fullKelly !== undefined && <li>Full Kelly: {(suggestedFractions.fullKelly * 100).toFixed(2)}%</li>}
                                    {suggestedFractions.halfKelly !== null && suggestedFractions.halfKelly !== undefined && <li>Half Kelly: {(suggestedFractions.halfKelly * 100).toFixed(2)}%</li>}
                                    {(suggestedFractions.fixedFractional === null && suggestedFractions.fullKelly === null) && <li>Could not calculate suggestions with current inputs.</li>}
                                </ul>
                            </div>)}
                    </>)}

                {goalType === 'growth' && goalParameters.targetAnnualReturn !== undefined && (<div><h4 className="font-semibold text-gray-700">Growth Parameters:</h4> <p className="text-gray-600">Target Annual Return: {goalParameters.targetAnnualReturn}%, Risk Tolerance: {formatEnumValue_1(goalParameters.riskTolerance)}</p></div>)}
                {goalType === 'drawdown' && goalParameters.maxDrawdown !== undefined && (<div><h4 className="font-semibold text-gray-700">Drawdown Parameters:</h4> <p className="text-gray-600">Max Drawdown: {goalParameters.maxDrawdown}%, Volatility Target: {goalParameters.volatilityTarget}%</p></div>)}
                {goalType === 'income' && goalParameters.targetMonthlyIncome !== undefined && (<div><h4 className="font-semibold text-gray-700">Income Parameters:</h4> <p className="text-gray-600">Target Monthly Income: ${goalParameters.targetMonthlyIncome.toLocaleString()}, Min Premium: ${(_g = goalParameters.minPremium) === null || _g === void 0 ? void 0 : _g.toLocaleString()}, Trade Frequency: {formatEnumValue_1(goalParameters.tradeFrequency)}</p></div>)}

                <div>
                    <h4 className="font-semibold text-gray-700">Configured Sizing Rules:</h4>
                    {renderSizingRuleDetails()}
                    {/* Show dollar values for position limits if available */}
                    {(maxPositionSizeDollar !== null || maxTotalExposureDollar !== null) && (<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start space-x-3">
                        <div className="pt-1">
                          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 8v8m8-8a8 8 0 11-16 0 8 8 0 0116 0z"/></svg>
                        </div>
                        <div>
                          <div className="font-semibold text-blue-700 mb-1">Position Sizing Limits (in Dollars)</div>
                          <div className="text-sm text-blue-800">
                            {maxPositionSizeDollar !== null && (<div className="mb-1 flex items-baseline">
                                <span className="w-44">Max Position Size:</span>
                                <span className="font-bold text-lg tabular-nums">${maxPositionSizeDollar.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                <span className="ml-2 text-xs text-blue-600">({maxPositionSizePct}% of account)</span>
                              </div>)}
                            {maxTotalExposureDollar !== null && (<div className="flex items-baseline">
                                <span className="w-44">Max Total Exposure:</span>
                                <span className="font-bold text-lg tabular-nums">${maxTotalExposureDollar.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                <span className="ml-2 text-xs text-blue-600">({maxTotalExposurePct}% of account)</span>
                              </div>)}
                          </div>
                          <div className="text-xs text-blue-500 mt-2">Calculated using your initial account balance and selected limits.</div>
                        </div>
                      </div>)}
                </div>
            </div>
          </div>);
            default:
                return <div>Error: Invalid Step</div>;
        }
    };
    // Function to handle saving profile (placeholder)
    var handleSaveProfile = function () {
        console.log('Save Profile Clicked. Current Config:', config);
        // Here you could implement saving to localStorage with a profile name
        // or sending to a backend.
        alert('Profile configuration logged to console.');
    };
    // Function to handle CSV export
    var handleExportCsv = function () {
        var csvContent = "data:text/csv;charset=utf-8,";
        // Headers
        csvContent += "Parameter,Value\r\n";
        // Goal Type
        csvContent += "Goal Type,".concat(formatEnumValue(config.goalType), "\r\n");
        // Capital Objective Parameters
        if (config.goalType === 'capitalObjective' && config.capitalObjectiveParameters) {
            var _a = config.capitalObjectiveParameters, currentBalance = _a.currentBalance, targetBalance = _a.targetBalance, timeHorizon = _a.timeHorizon;
            csvContent += "Current Balance,".concat(currentBalance || 'N/A', "\r\n");
            csvContent += "Target Balance,".concat(targetBalance || 'N/A', "\r\n");
            csvContent += "Time Horizon (Years),".concat(timeHorizon || 'N/A', "\r\n");
            if (currentBalance && targetBalance && timeHorizon) {
                csvContent += "Total Return Needed (%),".concat((((targetBalance / currentBalance) - 1) * 100).toFixed(2), "\r\n");
                csvContent += "Annual Return Needed (%),".concat(((Math.pow(targetBalance / currentBalance, 1 / timeHorizon) - 1) * 100).toFixed(2), "\r\n");
            }
        }
        // Trade Statistics
        if (config.goalType === 'capitalObjective' && config.tradeStatistics) {
            var _b = config.tradeStatistics, winRate = _b.winRate, payoffRatio = _b.payoffRatio, numTrades = _b.numTrades;
            csvContent += "Win Rate,".concat(winRate !== undefined ? (winRate * 100).toFixed(1) + '%' : 'N/A', "\r\n");
            csvContent += "Payoff Ratio,".concat(payoffRatio !== undefined ? payoffRatio + ':1' : 'N/A', "\r\n");
            csvContent += "Number of Trades,".concat(numTrades || 'N/A', "\r\n");
        }
        // Suggested Fractions
        if (config.goalType === 'capitalObjective' && Object.keys(suggestedFractions).length > 0) {
            csvContent += "Suggested Fixed Fractional (%),".concat(suggestedFractions.fixedFractional !== null && suggestedFractions.fixedFractional !== undefined ? (suggestedFractions.fixedFractional * 100).toFixed(2) : 'N/A', "\r\n");
            csvContent += "Suggested Full Kelly (%),".concat(suggestedFractions.fullKelly !== null && suggestedFractions.fullKelly !== undefined ? (suggestedFractions.fullKelly * 100).toFixed(2) : 'N/A', "\r\n");
            csvContent += "Suggested Half Kelly (%),".concat(suggestedFractions.halfKelly !== null && suggestedFractions.halfKelly !== undefined ? (suggestedFractions.halfKelly * 100).toFixed(2) : 'N/A', "\r\n");
        }
        // Other Goal Parameters (Growth, Drawdown, Income)
        if (config.goalType === 'growth' && config.goalParameters) {
            csvContent += "Target Annual Return (%),".concat(config.goalParameters.targetAnnualReturn || 'N/A', "\r\n");
            csvContent += "Risk Tolerance,".concat(formatEnumValue(config.goalParameters.riskTolerance), "\r\n");
        }
        if (config.goalType === 'drawdown' && config.goalParameters) {
            csvContent += "Max Drawdown (%),".concat(config.goalParameters.maxDrawdown || 'N/A', "\r\n");
            csvContent += "Volatility Target (%),".concat(config.goalParameters.volatilityTarget || 'N/A', "\r\n");
        }
        if (config.goalType === 'income' && config.goalParameters) {
            csvContent += "Target Monthly Income ($),".concat(config.goalParameters.targetMonthlyIncome || 'N/A', "\r\n");
            csvContent += "Min Premium ($),".concat(config.goalParameters.minPremium || 'N/A', "\r\n");
            csvContent += "Trade Frequency,".concat(formatEnumValue(config.goalParameters.tradeFrequency), "\r\n");
        }
        // Sizing Rules
        if (config.sizingRules) {
            csvContent += "Base Sizing Method,".concat(formatEnumValue(config.sizingRules.baseMethod), "\r\n");
            if (config.sizingRules.baseMethod === 'fixed-percent') {
                csvContent += "Base Position Size (%),".concat(config.sizingRules.baseSize || 'N/A', "\r\n");
            }
            if (config.sizingRules.baseMethod === 'kelly-criterion') {
                csvContent += "Kelly Fraction,".concat(config.sizingRules.kellyFraction || 'N/A', "\r\n");
                csvContent += "Win Rate Window (trades),".concat(config.sizingRules.winRateWindow || 'N/A', "\r\n");
            }
            if (config.sizingRules.baseMethod === 'volatility-based') {
                csvContent += "Volatility Period (days),".concat(config.sizingRules.volatilityPeriod || 'N/A', "\r\n");
                csvContent += "Risk Per Volatility Unit (%),".concat(config.sizingRules.riskPerVol || 'N/A', "\r\n");
            }
            csvContent += "Market Cap Adjustment,".concat(config.sizingRules.useMarketCap ? 'Enabled' : 'Disabled', "\r\n");
            csvContent += "Earnings Adjustment,".concat(config.sizingRules.useEarnings ? 'Enabled' : 'Disabled', "\r\n");
            csvContent += "Correlation Adjustment,".concat(config.sizingRules.useCorrelation ? 'Enabled' : 'Disabled', "\r\n");
            csvContent += "Max Position Size (%),".concat(config.sizingRules.maxPositionSize || 'N/A', "\r\n");
            csvContent += "Max Total Exposure (%),".concat(config.sizingRules.maxTotalExposure || 'N/A', "\r\n");
        }
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "goal_sizing_profile.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Export CSV Clicked. Config:', config);
    };
    // Helper function to format enum-like values for display
    var formatEnumValue = function (value) {
        if (!value)
            return 'N/A';
        return value.split('-').map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1); }).join(' ');
    };
    // Determine button visibility and disabled state based on current step and validation errors
    var showBackButton = !showIntro && currentStep > 1;
    var showNextButton = true; // Next button is always shown (becomes "Get Started" or "Finish")
    var showCancelButton = true; // Always allow cancelling
    // Next button is disabled if there are validation errors for the current step
    var isNextDisabled = !showIntro && !!errors[currentStep];
    // Back button is disabled on the first step
    var isBackDisabled = showIntro || currentStep <= 1;
    // --- Modal Props Logic ---
    var modalTitle = showIntro ? "Welcome!" : "Goal-Driven Sizing Wizard";
    var actualCurrentStepForModal = showIntro ? undefined : currentStep; // Don't show step count for intro
    var actualTotalStepsForModal = showIntro ? undefined : (config.goalType === 'capitalObjective' ? 5 : 4 // CapObj: Intro->1->2->3->5->6 (5 content), Other: Intro->1->4->5->6 (4 content)
    );
    // Recalculate current actual step for display
    var displayStepNumber = actualCurrentStepForModal;
    if (!showIntro && actualCurrentStepForModal) {
        if (config.goalType === 'capitalObjective') {
            if (actualCurrentStepForModal === 1)
                displayStepNumber = 1; // Choose Goal
            else if (actualCurrentStepForModal === 2)
                displayStepNumber = 2; // Cap Obj Params
            else if (actualCurrentStepForModal === 3)
                displayStepNumber = 3; // Trade Stats
            else if (actualCurrentStepForModal === 5)
                displayStepNumber = 4; // Sizing Rules
            else if (actualCurrentStepForModal === 6)
                displayStepNumber = 5; // Review
        }
        else { // Non-Capital Objective Path
            if (actualCurrentStepForModal === 1)
                displayStepNumber = 1; // Choose Goal
            else if (actualCurrentStepForModal === 4)
                displayStepNumber = 2; // Goal Params
            else if (actualCurrentStepForModal === 5)
                displayStepNumber = 3; // Sizing Rules
            else if (actualCurrentStepForModal === 6)
                displayStepNumber = 4; // Review
        }
    }
    var nextButtonText = showIntro ? 'Get Started' : (currentStep === 6 ? 'Finish' : 'Next');
    return (<Modal isOpen={isOpen} onClose={handleCancel} onCancel={handleCancel} onBack={showBackButton ? handleBack : undefined} onNext={showNextButton ? handleNext : undefined} title={modalTitle} showBack={showBackButton} showNext={showNextButton} showCancel={showCancelButton} isNextDisabled={isNextDisabled} isBackDisabled={isBackDisabled} currentStep={displayStepNumber} // Use calculated displayStepNumber
     totalSteps={actualTotalStepsForModal}>
      {/* Display validation error message if exists for the current step */}
      {errors[currentStep] && !showIntro && (<div className="text-red-500 text-sm mb-4">{errors[currentStep]}</div>)}
      {/* Render the content specific to the current step */}
      {renderStepContent()}
    </Modal>);
};
export default GoalSizingWizard;
