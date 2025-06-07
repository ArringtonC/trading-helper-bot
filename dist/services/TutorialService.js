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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
// --- Mock Data Store ---
// In a real Node.js environment, this data would be dynamically loaded 
// by reading .md files from a directory (e.g., 'content/tutorials/')
// and parsing their frontmatter (e.g., using a library like gray-matter).
var MOCK_TUTORIALS_DB = [
    {
        id: 'welcome-to-platform',
        title: 'Welcome to Your New Trading Dashboard!',
        sequence: 1,
        category: 'onboarding',
        targetElementSelectors: ['.main-dashboard-area'],
        filePath: 'content/tutorials/01-welcome.md',
        content: "\n# Welcome to the Platform!\n\nThis is your central hub for options trading analytics. Let's take a quick tour.\n\n## Key Areas:\n\n*   **Dashboard Overview:** See your P&L at a glance.\n*   **Risk Gauges:** Monitor your greeks in real-time.\n*   **Strategy Visualizer:** Understand your trade setups.\n\nWe hope you find these tools valuable!\n    ",
    },
    {
        id: 'understanding-risk-gauges',
        title: 'Understanding Your Risk Gauges',
        sequence: 2,
        category: 'onboarding',
        targetElementSelectors: ['#risk-gauge-delta', '#risk-gauge-theta'],
        filePath: 'content/tutorials/02-risk-gauges.md',
        content: "\n# Understanding Your Risk Gauges\n\nReal-time risk gauges are crucial for managing your options positions.\n\n*   **Delta:** Shows your directional exposure.\n*   **Theta:** Indicates time decay.\n*   **Gamma:** Measures the rate of change of Delta.\n*   **Vega:** Reflects sensitivity to implied volatility.\n\nKeep an eye on these, especially for 0DTE trades!\n    ",
    },
    {
        id: 'using-the-goal-wizard',
        title: 'Setting Up Your Goals with the Wizard',
        category: 'features',
        sequence: 1,
        targetElementSelectors: ['.goal-sizing-wizard-button'],
        filePath: 'content/tutorials/03-goal-wizard.md',
        content: "\n# Using the Goal Sizing Wizard\n\nThe Goal Sizing Wizard helps you align your trading with your financial objectives.\n\n1.  **Define Your Capital Objective:** How much do you want to grow your account?\n2.  **Set Risk Tolerance:** Conservative, Moderate, or Aggressive?\n3.  **Input Trade Statistics:** Average win rate, win/loss ratio.\n\nThe wizard will then suggest appropriate position sizes.\n    ",
    },
];
// --- TutorialService Implementation ---
/**
 * Simulates fetching all tutorial metadata.
 * In a real implementation, this would scan a directory of Markdown files,
 * parse their frontmatter, and return the metadata.
 */
export var getAllTutorialsMetadata = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // Simulate async operation
            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
            case 1:
                // Simulate async operation
                _a.sent();
                // In a real scenario: iterate over MOCK_TUTORIALS_DB or read from file system
                // For now, we map the mock DB, excluding the full content for metadata.
                return [2 /*return*/, MOCK_TUTORIALS_DB.map(function (_a) {
                        var content = _a.content, metadata = __rest(_a, ["content"]);
                        return metadata;
                    })];
        }
    });
}); };
/**
 * Simulates fetching a single tutorial by its ID, including its content.
 * In a real implementation, this would read a specific Markdown file by ID/slug,
 * parse its frontmatter and content.
 * @param id The unique ID of the tutorial.
 */
export var getTutorialById = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var tutorial;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // Simulate async operation
            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
            case 1:
                // Simulate async operation
                _a.sent();
                tutorial = MOCK_TUTORIALS_DB.find(function (t) { return t.id === id; });
                // In a real scenario, if not found in a cache or DB, you might try to read 
                // `content/tutorials/${id}.md`, parse it, and return.
                return [2 /*return*/, tutorial];
        }
    });
}); };
/**
 * Simulates fetching tutorials by category.
 */
export var getTutorialsByCategory = function (category) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
            case 1:
                _a.sent();
                return [2 /*return*/, MOCK_TUTORIALS_DB
                        .filter(function (t) { return t.category === category; })
                        .map(function (_a) {
                        var content = _a.content, metadata = __rest(_a, ["content"]);
                        return metadata;
                    })
                        .sort(function (a, b) { return (a.sequence || 0) - (b.sequence || 0); })];
        }
    });
}); };
/**
 * Simulates fetching tutorials by a target element selector.
 * This could be used to find relevant tutorials for a specific UI element.
 */
export var getTutorialsByTargetSelector = function (selector) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
            case 1:
                _a.sent();
                return [2 /*return*/, MOCK_TUTORIALS_DB
                        .filter(function (t) { var _a; return (_a = t.targetElementSelectors) === null || _a === void 0 ? void 0 : _a.includes(selector); })
                        .map(function (_a) {
                        var content = _a.content, metadata = __rest(_a, ["content"]);
                        return metadata;
                    })
                        .sort(function (a, b) { return (a.sequence || 0) - (b.sequence || 0); })];
        }
    });
}); };
// Potential future functions:
// - searchTutorials(query: string): Promise<TutorialMetadata[]>
// - getTutorialSeries(seriesId: string): Promise<TutorialMetadata[]>
// Note on actual implementation:
// For a production environment using local Markdown files:
// 1. Use Node.js `fs.readdir` to list files in `content/tutorials/`.
// 2. For each file, use `fs.readFile` to get its content.
// 3. Use a library like `gray-matter` to parse the YAML frontmatter and Markdown body.
// 4. Implement caching (e.g., in-memory on server start, or a more robust solution)
//    to avoid re-reading and parsing files on every request.
// 5. If running in a purely client-side environment (like Create React App without SSR/SSG for this part),
//    you might need to use a build step to convert .md files to .json or .js modules,
//    or use dynamic imports with raw-loader if an HTTP server serves the content files. 
