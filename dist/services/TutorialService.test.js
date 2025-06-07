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
import { getAllTutorialsMetadata, getTutorialById, getTutorialsByCategory, getTutorialsByTargetSelector } from './TutorialService';
// The MOCK_TUTORIALS_DB is not exported, so we'll define a subset here 
// for comparison, or trust the service's internal logic for now.
// For more thorough tests, one might export the mock DB or use a shared mock data module.
var expectedWelcomeTutorial = {
    id: 'welcome-to-platform',
    title: 'Welcome to Your New Trading Dashboard!',
    category: 'onboarding',
};
var expectedRiskGaugesTutorial = {
    id: 'understanding-risk-gauges',
    title: 'Understanding Your Risk Gauges',
    category: 'onboarding',
};
var expectedGoalWizardTutorial = {
    id: 'using-the-goal-wizard',
    title: 'Setting Up Your Goals with the Wizard',
    category: 'features',
};
describe('TutorialService', function () {
    describe('getAllTutorialsMetadata', function () {
        it('should return metadata for all mock tutorials', function () { return __awaiter(void 0, void 0, void 0, function () {
            var metadata;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getAllTutorialsMetadata()];
                    case 1:
                        metadata = _a.sent();
                        expect(metadata).toBeInstanceOf(Array);
                        expect(metadata.length).toBe(3); // Based on current MOCK_TUTORIALS_DB
                        expect(metadata[0].id).toBe(expectedWelcomeTutorial.id);
                        expect(metadata[1].title).toBe(expectedRiskGaugesTutorial.title);
                        // Check that content is not included
                        expect(metadata[0].content).toBeUndefined();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return objects matching TutorialMetadata structure', function () { return __awaiter(void 0, void 0, void 0, function () {
            var metadata;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getAllTutorialsMetadata()];
                    case 1:
                        metadata = _a.sent();
                        metadata.forEach(function (item) {
                            expect(item).toHaveProperty('id');
                            expect(item).toHaveProperty('title');
                            // sequence, category, targetElementSelectors are optional in type, check if they exist or are undefined
                            expect('sequence' in item || item.sequence === undefined).toBeTruthy();
                            expect('category' in item || item.category === undefined).toBeTruthy();
                            expect('targetElementSelectors' in item || item.targetElementSelectors === undefined).toBeTruthy();
                            expect(item).not.toHaveProperty('content'); // Ensure full content is stripped
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getTutorialById', function () {
        it('should return the correct tutorial with content when found', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tutorial;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getTutorialById('welcome-to-platform')];
                    case 1:
                        tutorial = _a.sent();
                        expect(tutorial).toBeDefined();
                        expect(tutorial === null || tutorial === void 0 ? void 0 : tutorial.id).toBe(expectedWelcomeTutorial.id);
                        expect(tutorial === null || tutorial === void 0 ? void 0 : tutorial.title).toBe(expectedWelcomeTutorial.title);
                        expect(tutorial === null || tutorial === void 0 ? void 0 : tutorial.content).toBeDefined();
                        expect(tutorial === null || tutorial === void 0 ? void 0 : tutorial.content).toContain('# Welcome to the Platform!');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return undefined for a non-existent ID', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tutorial;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getTutorialById('non-existent-id')];
                    case 1:
                        tutorial = _a.sent();
                        expect(tutorial).toBeUndefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getTutorialsByCategory', function () {
        it('should return tutorials for an existing category, sorted by sequence', function () { return __awaiter(void 0, void 0, void 0, function () {
            var onboardingTutorials;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getTutorialsByCategory('onboarding')];
                    case 1:
                        onboardingTutorials = _a.sent();
                        expect(onboardingTutorials).toBeInstanceOf(Array);
                        expect(onboardingTutorials.length).toBe(2);
                        expect(onboardingTutorials[0].id).toBe(expectedWelcomeTutorial.id); // sequence 1
                        expect(onboardingTutorials[1].id).toBe(expectedRiskGaugesTutorial.id); // sequence 2
                        onboardingTutorials.forEach(function (item) {
                            expect(item.category).toBe('onboarding');
                            expect(item).not.toHaveProperty('content');
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return an empty array for a non-existent category', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tutorials;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getTutorialsByCategory('non-existent-category')];
                    case 1:
                        tutorials = _a.sent();
                        expect(tutorials).toEqual([]);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getTutorialsByTargetSelector', function () {
        it('should return tutorials matching a target selector, sorted by sequence', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dashboardTutorials, riskGaugeTutorials;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getTutorialsByTargetSelector('.main-dashboard-area')];
                    case 1:
                        dashboardTutorials = _a.sent();
                        expect(dashboardTutorials).toBeInstanceOf(Array);
                        expect(dashboardTutorials.length).toBe(1);
                        expect(dashboardTutorials[0].id).toBe(expectedWelcomeTutorial.id);
                        dashboardTutorials.forEach(function (item) {
                            expect(item.targetElementSelectors).toContain('.main-dashboard-area');
                            expect(item).not.toHaveProperty('content');
                        });
                        return [4 /*yield*/, getTutorialsByTargetSelector('#risk-gauge-delta')];
                    case 2:
                        riskGaugeTutorials = _a.sent();
                        expect(riskGaugeTutorials.length).toBe(1);
                        expect(riskGaugeTutorials[0].id).toBe(expectedRiskGaugesTutorial.id);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return an empty array if no tutorials match the selector', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tutorials;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getTutorialsByTargetSelector('.non-existent-selector')];
                    case 1:
                        tutorials = _a.sent();
                        expect(tutorials).toEqual([]);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
