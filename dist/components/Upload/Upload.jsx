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
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { handleUpload } from '../../utils/handleUpload'; // Import the refactored handleUpload
import ReconciliationReport from '../Reconciliation/ReconciliationReport'; // Import the report component
var Upload = function () {
    var _a = useState([]), trades = _a[0], setTrades = _a[1];
    var _b = useState([]), positions = _b[0], setPositions = _b[1];
    var _c = useState({ trades: 0, positions: 0, open: 0, closed: 0, realizedPL: 0 }), summary = _c[0], setSummary = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useState(false), isLoading = _e[0], setIsLoading = _e[1];
    // State for reconciliation results
    var _f = useState(null), reconciliationResult = _f[0], setReconciliationResult = _f[1];
    var onDrop = useCallback(function (acceptedFiles) { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (acceptedFiles.length === 0) {
                        setError('Please select a file.');
                        return [2 /*return*/];
                    }
                    // Reset reconciliation result before new upload
                    setReconciliationResult(null);
                    return [4 /*yield*/, handleUpload(acceptedFiles, setTrades, setPositions, setSummary, setError, setIsLoading)];
                case 1:
                    result = _a.sent();
                    // Store the returned reconciliation result
                    setReconciliationResult(result);
                    return [2 /*return*/];
            }
        });
    }); }, []); // Empty dependency array means this doesn't rely on component state/props
    var _g = useDropzone({
        onDrop: onDrop,
        accept: {
            'text/csv': ['.csv'],
        },
        multiple: true, // Allow multiple files for reconciliation
    }), getRootProps = _g.getRootProps, getInputProps = _g.getInputProps, isDragActive = _g.isDragActive;
    return (<div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Upload Trade/Position Data</h1>

      <div {...getRootProps()} className={"p-10 border-2 border-dashed rounded-lg text-center cursor-pointer \n                    ".concat(isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50', "\n                    hover:border-gray-400 transition-colors")}>
        <input {...getInputProps()}/>
        {isDragActive ?
            <p className="text-blue-600">Drop the files here ...</p> :
            <p className="text-gray-600">Drag 'n' drop trade/position CSV files here, or click to select files. (Optional: Drop authoritative P&L CSV as the second file for reconciliation)</p>}
      </div>

      {isLoading && (<div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="ml-2 text-gray-600">Processing files...</p>
        </div>)}

      {error && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>)}

      {/* Display Summary - Conditionally show based on trades or positions */} 
      {(summary.trades > 0 || summary.positions > 0) && !isLoading && !error && (<div className="p-4 border rounded shadow-md bg-white">
              <h2 className="text-lg font-semibold mb-2">Import Summary</h2>
              <p>Trades Imported: {summary.trades}</p>
              <p>Positions Imported: {summary.positions}</p>
              {/* Only show trade counts if trades were imported */}
              {summary.trades > 0 && (<>
                      <p>Open Trades: {summary.open}</p>
                      <p>Closed Trades: {summary.closed}</p>
                      <p>Realized P&L: ${summary.realizedPL.toFixed(2)}</p>
                  </>)}
          </div>)}

      {/* Conditionally render Reconciliation Report */} 
      <ReconciliationReport result={reconciliationResult} isLoading={false} // Loading is handled above for the whole upload process
     error={null} // Errors specific to the report generation aren't handled here yet
    />

      {/* Optionally display raw trades/positions (for debugging) */}
      {/* ... */}

    </div>);
};
export default Upload;
