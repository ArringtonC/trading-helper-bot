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
import { z } from 'zod';
// Define the base URL for the HMM microservice
// TODO: Make this configurable (e.g., via environment variables)
var HMM_MICROSERVICE_BASE_URL = 'http://127.0.0.1:5000'; // Assuming default Flask port
// Define Zod schemas for request and response data validation
// Schema for the /train request payload
var TrainRequestSchema = z.object({
    symbol: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    model_params: z.record(z.string(), z.any()).optional(), // Optional HMM model parameters
    market_data_filepath: z.string().optional(), // Optional path to market data CSV
    trade_data: z.string().optional(), // Optional raw trade data as a string
    nComponents: z.number().optional(),
    nIter: z.number().optional(),
    covarianceType: z.string().optional(),
});
// Schema for the /train response body
var TrainResponseSchema = z.object({
    message: z.string(),
    modelFile: z.string(), // Expects this now
});
// Schema for the /predict request payload
var PredictRequestSchema = z.object({
    symbol: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    return_probabilities: z.boolean().optional(), // Optional flag to return probabilities
    market_data_filepath: z.string().optional(), // Optional path to market data CSV
    trade_data: z.string().optional(), // Optional raw trade data as a string
    tradeDataFilepath: z.string().optional(),
    marketDataFilepath: z.string().optional(),
});
// Schema for the /predict response body (simplified for now)
// The actual response includes dates, predicted_states, predicted_regime_labels, and optionally state_probabilities
var PredictResponseSchema = z.object({
    regimeHistory: z.array(z.object({
        date: z.string(),
        regime: z.string(),
    })),
});
/**
 * Sends a request to the HMM microservice to train a model.
 * @param data The training parameters.
 * @returns A promise resolving with the training response.
 * @throws An error if the request fails or the response is invalid.
 */
export var trainHMMModel = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response, errorText, responseData, validatedData, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "".concat(HMM_MICROSERVICE_BASE_URL, "/train");
                console.log("Sending training request to ".concat(url, " with data:"), data);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, , 7]);
                return [4 /*yield*/, fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    })];
            case 2:
                response = _a.sent();
                if (!!response.ok) return [3 /*break*/, 4];
                return [4 /*yield*/, response.text()];
            case 3:
                errorText = _a.sent();
                throw new Error("Training failed: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
            case 4: return [4 /*yield*/, response.json()];
            case 5:
                responseData = _a.sent();
                validatedData = TrainResponseSchema.parse(responseData);
                console.log('Training response received:', validatedData);
                return [2 /*return*/, validatedData];
            case 6:
                error_1 = _a.sent();
                console.error('Error during HMM model training:', error_1);
                throw error_1; // Re-throw the error for the calling component to handle
            case 7: return [2 /*return*/];
        }
    });
}); };
/**
 * Sends a request to the HMM microservice to predict regimes.
 * @param data The prediction parameters.
 * @returns A promise resolving with the prediction response.
 * @throws An error if the request fails or the response is invalid.
 */
export var predictHMMRegimes = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response, errorText, responseData, validatedData, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "".concat(HMM_MICROSERVICE_BASE_URL, "/predict");
                console.log("Sending prediction request to ".concat(url, " with data:"), data);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, , 7]);
                return [4 /*yield*/, fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    })];
            case 2:
                response = _a.sent();
                if (!!response.ok) return [3 /*break*/, 4];
                return [4 /*yield*/, response.text()];
            case 3:
                errorText = _a.sent();
                throw new Error("Prediction failed: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
            case 4: return [4 /*yield*/, response.json()];
            case 5:
                responseData = _a.sent();
                validatedData = PredictResponseSchema.parse(responseData);
                console.log('Prediction response received:', validatedData);
                return [2 /*return*/, validatedData];
            case 6:
                error_2 = _a.sent();
                console.error('Error during HMM regime prediction:', error_2);
                throw error_2; // Re-throw the error for the calling component to handle
            case 7: return [2 /*return*/];
        }
    });
}); };
// You can add other functions here for future HMM-related interactions
// For example: loading model parameters, checking service status, etc. 
