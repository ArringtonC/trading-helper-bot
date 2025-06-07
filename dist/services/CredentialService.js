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
import { safeStorage } from 'electron';
import Store from 'electron-store';
var CredentialService = /** @class */ (function () {
    function CredentialService() {
        // Initialize electron-store.
        this.store = new Store({ name: 'credentials' });
        if (!safeStorage.isEncryptionAvailable()) {
            console.warn('Warning: Encryption is not available on this system. Credentials will be stored in plaintext by electron-store if not otherwise protected. This is NOT secure for production.');
            // Potentially throw an error or prevent app from storing sensitive data
            // For Linux, check safeStorage.getSelectedStorageBackend() to see if it's 'basic_text'
        }
    }
    CredentialService.prototype.getStoreKey = function (broker, key) {
        return "".concat(broker, ".").concat(key);
    };
    CredentialService.prototype.saveCredential = function (broker, key, value) {
        return __awaiter(this, void 0, void 0, function () {
            var encryptedValue;
            return __generator(this, function (_a) {
                if (!value) {
                    console.warn("CredentialService: Attempted to save empty value for ".concat(broker, ".").concat(key));
                    return [2 /*return*/];
                }
                if (!safeStorage.isEncryptionAvailable()) {
                    // Handle insecure storage case - perhaps by refusing to store or logging a severe warning
                    console.error('CredentialService: Encryption not available. Refusing to store sensitive credential in plaintext.');
                    // Or, if you decide to store it (NOT RECOMMENDED FOR SENSITIVE DATA):
                    // this.store.set(this.getStoreKey(broker, key), value); // Plaintext storage
                    // console.warn(`CredentialService: Stored ${broker}.${key} in plaintext due to unavailable encryption.`);
                    return [2 /*return*/]; // Or throw new Error('Encryption not available');
                }
                try {
                    encryptedValue = safeStorage.encryptString(value);
                    // electron-store needs a string, but encryptString returns a Buffer.
                    // Convert Buffer to a string representation (e.g., base64) for storage.
                    this.store.set(this.getStoreKey(broker, key), encryptedValue.toString('base64'));
                    console.log("CredentialService: Securely saved credential for ".concat(broker, ".").concat(key));
                }
                catch (error) {
                    console.error("CredentialService: Failed to save credential for ".concat(broker, ".").concat(key), error);
                    throw error; // Re-throw or handle appropriately
                }
                return [2 /*return*/];
            });
        });
    };
    CredentialService.prototype.getCredential = function (broker, key) {
        return __awaiter(this, void 0, void 0, function () {
            var storeKey, storedValue, encryptedBuffer, decryptedValue;
            return __generator(this, function (_a) {
                storeKey = this.getStoreKey(broker, key);
                storedValue = this.store.get(storeKey);
                if (!storedValue) {
                    console.log("CredentialService: No credential found for ".concat(broker, ".").concat(key));
                    return [2 /*return*/, null];
                }
                if (!safeStorage.isEncryptionAvailable()) {
                    // Handle insecure retrieval case
                    console.error('CredentialService: Encryption not available. Assuming stored value is plaintext if retrieved.');
                    // return storedValue; // Assuming it was stored as plaintext
                    return [2 /*return*/, null]; // Or better, don't return potentially sensitive plaintext
                }
                try {
                    encryptedBuffer = Buffer.from(storedValue, 'base64');
                    decryptedValue = safeStorage.decryptString(encryptedBuffer);
                    console.log("CredentialService: Securely retrieved credential for ".concat(broker, ".").concat(key));
                    return [2 /*return*/, decryptedValue];
                }
                catch (error) {
                    console.error("CredentialService: Failed to retrieve or decrypt credential for ".concat(broker, ".").concat(key), error);
                    // This could happen if the encryption key changed (e.g., OS reinstall, user change)
                    // or if the data is corrupted or was not actually encrypted.
                    // Consider deleting the corrupted/unreadable credential:
                    // this.deleteCredential(broker, key);
                    return [2 /*return*/, null];
                }
                return [2 /*return*/];
            });
        });
    };
    CredentialService.prototype.deleteCredential = function (broker, key) {
        return __awaiter(this, void 0, void 0, function () {
            var storeKey;
            return __generator(this, function (_a) {
                storeKey = this.getStoreKey(broker, key);
                if (this.store.has(storeKey)) {
                    this.store.delete(storeKey);
                    console.log("CredentialService: Deleted credential for ".concat(broker, ".").concat(key));
                }
                else {
                    console.log("CredentialService: No credential found to delete for ".concat(broker, ".").concat(key));
                }
                return [2 /*return*/];
            });
        });
    };
    // Example of how to check if a broker is configured (e.g., has an API key stored)
    CredentialService.prototype.isBrokerConfigured = function (broker_1) {
        return __awaiter(this, arguments, void 0, function (broker, primaryKey) {
            var credential;
            if (primaryKey === void 0) { primaryKey = 'apiKey'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCredential(broker, primaryKey)];
                    case 1:
                        credential = _a.sent();
                        return [2 /*return*/, !!credential];
                }
            });
        });
    };
    return CredentialService;
}());
// Export a singleton instance if this service is meant to be a global provider
// Or export the class if it needs to be instantiated, possibly with configuration.
// For a main process service often used globally, a singleton is common.
var instance = null;
export var getCredentialService = function () {
    if (!instance) {
        instance = new CredentialService();
    }
    return instance;
};
// Alternatively, just export the class:
// export default CredentialService; 
