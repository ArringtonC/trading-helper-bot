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
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Popover from './Popover';
// Mock getBoundingClientRect as it's not implemented in JSDOM
var mockRect = {
    width: 150, height: 50, // Popovers might be larger
    top: 10, left: 10,
    bottom: 60, right: 160,
    x: 10, y: 10,
    toJSON: function () { return JSON.stringify(mockRect); }
};
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: jest.fn(function () { return mockRect; }),
});
// Mock addEventListener/removeEventListener for window to test scroll/resize listeners
var eventMap = {};
window.addEventListener = jest.fn(function (event, cb) {
    eventMap[event] = cb;
});
window.removeEventListener = jest.fn(function (event) {
    delete eventMap[event];
});
describe('Popover Component', function () {
    test('renders children correctly', function () {
        render(<Popover content="Test Popover">
        <button>Open Popover</button>
      </Popover>);
        expect(screen.getByText('Open Popover')).toBeInTheDocument();
    });
    test('does not show popover content initially (click trigger default)', function () {
        render(<Popover content="Initial Test Popover">
        <button>Open Popover</button>
      </Popover>);
        expect(screen.queryByText('Initial Test Popover')).not.toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    test('shows popover on click and hides on second click (click trigger)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trigger;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<Popover content="Click Me Popover" title="Test Title">
        <button>Click Trigger</button>
      </Popover>);
                    trigger = screen.getByText('Click Trigger');
                    // Show popover
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.click(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    // Show popover
                    _a.sent();
                    expect(screen.getByRole('dialog')).toBeInTheDocument();
                    expect(screen.getByText('Click Me Popover')).toBeInTheDocument();
                    expect(screen.getByText('Test Title')).toBeInTheDocument();
                    // Hide popover by clicking trigger again
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.click(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 2:
                    // Hide popover by clicking trigger again
                    _a.sent();
                    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
                    return [2 /*return*/];
            }
        });
    }); });
    test('hides popover on clicking close button', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trigger, closeButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<Popover content="Close Button Test">
        <button>Open</button>
      </Popover>);
                    trigger = screen.getByText('Open');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.click(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(screen.getByRole('dialog')).toBeInTheDocument();
                    closeButton = screen.getByLabelText('Close popover');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.click(closeButton);
                                return [2 /*return*/];
                            });
                        }); })];
                case 2:
                    _a.sent();
                    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
                    return [2 /*return*/];
            }
        });
    }); });
    test('hides popover on pressing Escape key', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trigger;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<Popover content="Escape Key Test">
        <button>Open for Escape</button>
      </Popover>);
                    trigger = screen.getByText('Open for Escape');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.click(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(screen.getByRole('dialog')).toBeInTheDocument();
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
                                return [2 /*return*/];
                            });
                        }); })];
                case 2:
                    _a.sent();
                    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
                    return [2 /*return*/];
            }
        });
    }); });
    test('hides popover on clicking outside', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trigger, outsideArea;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<div>
        <Popover content="Click Outside Test">
          <button>Open for Outside</button>
        </Popover>
        <div data-testid="outside-area">Outside</div>
      </div>);
                    trigger = screen.getByText('Open for Outside');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.click(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(screen.getByRole('dialog')).toBeInTheDocument();
                    outsideArea = screen.getByTestId('outside-area');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.mouseDown(outsideArea); // mousedown on document hides it
                                return [2 /*return*/];
                            });
                        }); })];
                case 2:
                    _a.sent();
                    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
                    return [2 /*return*/];
            }
        });
    }); });
    test('shows popover on mouse enter and hides on mouse leave (hover trigger)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trigger;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<Popover content="Hover Popover" trigger="hover">
        <span>Hover Trigger Span</span>
      </Popover>);
                    trigger = screen.getByText('Hover Trigger Span');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.mouseEnter(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(screen.getByRole('dialog')).toBeInTheDocument();
                    expect(screen.getByText('Hover Popover')).toBeInTheDocument();
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.mouseLeave(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('renders title and arrow correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trigger;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<Popover content="Content" title="My Popover Title">
        <button>Trigger</button>
      </Popover>);
                    trigger = screen.getByText('Trigger');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.click(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(screen.getByText('My Popover Title')).toBeInTheDocument();
                    expect(screen.getByTestId('popover-arrow')).toBeInTheDocument();
                    return [2 /*return*/];
            }
        });
    }); });
    test('applies default position (bottom) and styles', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trigger, popoverElement;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<Popover content="Styled Popover">
        <button>Trigger</button>
      </Popover>);
                    trigger = screen.getByText('Trigger');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.click(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    popoverElement = screen.getByRole('dialog');
                    expect(popoverElement).toBeInTheDocument();
                    expect(popoverElement).toHaveClass('bg-white', 'border', 'border-gray-300', 'rounded-lg', 'shadow-xl', 'p-4');
                    // Check that style.top and style.left are being set
                    expect(popoverElement.style.top).toBeDefined();
                    expect(popoverElement.style.left).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    test('applies custom className', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trigger;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<Popover content="Custom Class Popover" className="my-custom-popover">
        <button>Custom</button>
      </Popover>);
                    trigger = screen.getByText('Custom');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.click(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(screen.getByRole('dialog')).toHaveClass('my-custom-popover');
                    return [2 /*return*/];
            }
        });
    }); });
    var positions = ['top', 'bottom', 'left', 'right'];
    positions.forEach(function (pos) {
        test("updates position logic for ".concat(pos), function () { return __awaiter(void 0, void 0, void 0, function () {
            var trigger, popoverElement;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        render(<Popover content={"Position ".concat(pos)} position={pos}>
          <button>{"Trigger ".concat(pos)}</button>
        </Popover>);
                        trigger = screen.getByText("Trigger ".concat(pos));
                        return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    fireEvent.click(trigger);
                                    return [2 /*return*/];
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        popoverElement = screen.getByRole('dialog');
                        expect(popoverElement).toBeInTheDocument();
                        expect(popoverElement.style.top).toBeDefined();
                        expect(popoverElement.style.left).toBeDefined();
                        expect(screen.getByText("Position ".concat(pos))).toBeInTheDocument();
                        return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    fireEvent.click(trigger); // Close it
                                    return [2 /*return*/];
                                });
                            }); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    test('updates position on window scroll and resize when visible', function () { return __awaiter(void 0, void 0, void 0, function () {
        var updatePositionMock, trigger;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    updatePositionMock = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
                    render(<Popover content="Scroll/Resize Test">
            <button>Open</button>
        </Popover>);
                    trigger = screen.getByText('Open');
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.click(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(screen.getByRole('dialog')).toBeInTheDocument();
                    updatePositionMock.mockClear(); // Clear any calls from initial positioning
                    // Simulate scroll
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                eventMap.scroll({}); // Trigger the mocked scroll event listener
                                return [2 /*return*/];
                            });
                        }); })];
                case 2:
                    // Simulate scroll
                    _a.sent();
                    expect(updatePositionMock).toHaveBeenCalled();
                    updatePositionMock.mockClear();
                    // Simulate resize
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                eventMap.resize({}); // Trigger the mocked resize event listener
                                return [2 /*return*/];
                            });
                        }); })];
                case 3:
                    // Simulate resize
                    _a.sent();
                    expect(updatePositionMock).toHaveBeenCalled();
                    // Cleanup: close popover to remove listeners
                    return [4 /*yield*/, act(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                fireEvent.click(trigger);
                                return [2 /*return*/];
                            });
                        }); })];
                case 4:
                    // Cleanup: close popover to remove listeners
                    _a.sent();
                    updatePositionMock.mockRestore();
                    return [2 /*return*/];
            }
        });
    }); });
});
