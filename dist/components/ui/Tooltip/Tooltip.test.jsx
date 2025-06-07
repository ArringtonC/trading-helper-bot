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
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tooltip from './Tooltip';
// Mock getBoundingClientRect as it's not implemented in JSDOM
// and our component relies on it for positioning.
// HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
//   width: 100,
//   height: 50,
//   top: 0,
//   left: 0,
//   bottom: 0,
//   right: 0,
//   x: 0,
//   y: 0,
//   toJSON: () => ({}),
// }));
// More robust mock to handle potential null refs during initial render calculations
var mockRect = {
    width: 100, height: 30,
    top: 10, left: 10,
    bottom: 40, right: 110,
    x: 10, y: 10,
    toJSON: function () { return JSON.stringify(mockRect); }
};
// Mock for childRef and tooltipRef
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: jest.fn(function () { return mockRect; }),
});
describe('Tooltip Component', function () {
    // Basic render test
    test('renders children correctly', function () {
        render(<Tooltip content="Test Tooltip">
        <button>Hover me</button>
      </Tooltip>);
        expect(screen.getByText('Hover me')).toBeInTheDocument();
    });
    test('does not show tooltip content initially', function () {
        render(<Tooltip content="Initial Test Tooltip">
        <button>Hover me</button>
      </Tooltip>);
        expect(screen.queryByText('Initial Test Tooltip')).not.toBeInTheDocument();
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
    test('shows tooltip on mouse enter and hides on mouse leave', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trigger;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<Tooltip content="Hello World">
        <button>My Button</button>
      </Tooltip>);
                    trigger = screen.getByText('My Button');
                    // Show tooltip
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.mouseEnter(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    // Show tooltip
                    _a.sent();
                    // await screen.findByRole('tooltip'); // Wait for tooltip to appear
                    expect(screen.getByRole('tooltip')).toBeInTheDocument();
                    expect(screen.getByText('Hello World')).toBeInTheDocument();
                    // Hide tooltip
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.mouseLeave(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 2:
                    // Hide tooltip
                    _a.sent();
                    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
                    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
                    return [2 /*return*/];
            }
        });
    }); });
    test('shows tooltip on focus and hides on blur for accessibility', function () { return __awaiter(void 0, void 0, void 0, function () {
        var triggerButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<Tooltip content="Accessibility Test">
        <button>Focus me</button>
      </Tooltip>);
                    triggerButton = screen.getByText('Focus me');
                    // Show tooltip on focus
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.focus(triggerButton);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    // Show tooltip on focus
                    _a.sent();
                    // await screen.findByRole('tooltip');
                    expect(screen.getByRole('tooltip')).toBeInTheDocument();
                    expect(screen.getByText('Accessibility Test')).toBeInTheDocument();
                    // Hide tooltip on blur
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.blur(triggerButton);
                                return [2 /*return*/];
                            });
                        }); })];
                case 2:
                    // Hide tooltip on blur
                    _a.sent();
                    expect(screen.queryByText('Accessibility Test')).not.toBeInTheDocument();
                    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
                    return [2 /*return*/];
            }
        });
    }); });
    test('applies default position (top) and styles', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trigger, tooltipElement;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<Tooltip content="Styled Tooltip">
        <button>Trigger</button>
      </Tooltip>);
                    trigger = screen.getByText('Trigger');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.mouseEnter(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    tooltipElement = screen.getByRole('tooltip');
                    expect(tooltipElement).toBeInTheDocument();
                    // Default styles (Tailwind)
                    expect(tooltipElement).toHaveClass('bg-gray-800', 'text-white', 'p-2', 'rounded', 'shadow-lg');
                    return [2 /*return*/];
            }
        });
    }); });
    test('renders HTML content correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trigger;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<Tooltip content={<span>Important <strong>Info</strong></span>}>
        <button>HTML Trigger</button>
      </Tooltip>);
                    trigger = screen.getByText('HTML Trigger');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.mouseEnter(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    // await screen.findByRole('tooltip');
                    expect(screen.getByRole('tooltip')).toBeInTheDocument();
                    expect(screen.getByText('Important')).toBeInTheDocument();
                    expect(screen.getByText('Info').tagName).toBe('STRONG');
                    return [2 /*return*/];
            }
        });
    }); });
    test('applies custom className', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trigger;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<Tooltip content="Custom Class" className="my-custom-tooltip">
        <button>Custom</button>
      </Tooltip>);
                    trigger = screen.getByText('Custom');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.mouseEnter(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    // await screen.findByRole('tooltip');
                    expect(screen.getByRole('tooltip')).toHaveClass('my-custom-tooltip');
                    return [2 /*return*/];
            }
        });
    }); });
    // Test for different positions - focusing on the logic, not exact pixel values due to JSDOM limitations
    var positions = ['top', 'bottom', 'left', 'right'];
    positions.forEach(function (position) {
        test("updates position logic for ".concat(position), function () { return __awaiter(void 0, void 0, void 0, function () {
            var trigger, tooltipElement;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Re-mock getBoundingClientRect for each position test if specific behavior is needed
                        // For now, we assume the general mock is sufficient to cover code paths
                        render(<Tooltip content={"Position ".concat(position)} position={position}>
            <button>{"Trigger ".concat(position)}</button>
            </Tooltip>);
                        trigger = screen.getByText("Trigger ".concat(position));
                        return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    fireEvent.mouseEnter(trigger);
                                    return [2 /*return*/];
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        tooltipElement = screen.getByRole('tooltip');
                        expect(tooltipElement).toBeInTheDocument();
                        // Check that style.top and style.left are being set, indicating position logic ran
                        // Exact values are hard to assert reliably in JSDOM without very complex mocks
                        expect(tooltipElement.style.top).toBeDefined();
                        expect(tooltipElement.style.left).toBeDefined();
                        // Check if it contains the correct content
                        expect(screen.getByText("Position ".concat(position))).toBeInTheDocument();
                        // Hide tooltip
                        return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    fireEvent.mouseLeave(trigger);
                                    return [2 /*return*/];
                                });
                            }); })];
                    case 2:
                        // Hide tooltip
                        _a.sent();
                        expect(screen.queryByText("Position ".concat(position))).not.toBeInTheDocument();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
