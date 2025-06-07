import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
var CsvPreviewGrid = function (_a) {
    var file = _a.file, _b = _a.maxRows, maxRows = _b === void 0 ? 10 : _b, className = _a.className;
    var _c = useState([]), previewHeaders = _c[0], setPreviewHeaders = _c[1];
    var _d = useState([]), previewRows = _d[0], setPreviewRows = _d[1];
    var _e = useState(false), isLoading = _e[0], setIsLoading = _e[1];
    var _f = useState(null), parseError = _f[0], setParseError = _f[1];
    var parseFile = useCallback(function () {
        if (!file) {
            setPreviewHeaders([]);
            setPreviewRows([]);
            setParseError(null);
            return;
        }
        setIsLoading(true);
        setParseError(null);
        Papa.parse(file, {
            header: false, // We'll take the first row as headers manually
            preview: maxRows + 1, // +1 to get headers and maxRows of data
            skipEmptyLines: true,
            complete: function (results) {
                var allRows = results.data;
                if (allRows.length > 0) {
                    setPreviewHeaders(allRows[0]);
                    setPreviewRows(allRows.slice(1, maxRows + 1));
                }
                else {
                    setPreviewHeaders([]);
                    setPreviewRows([]);
                    setParseError('CSV file is empty or could not be parsed correctly.');
                }
                setIsLoading(false);
            },
            error: function (error) {
                console.error('Error parsing CSV:', error);
                setParseError("Error parsing CSV: ".concat(error.message));
                setPreviewHeaders([]);
                setPreviewRows([]);
                setIsLoading(false);
            },
        });
    }, [file, maxRows]);
    useEffect(function () {
        parseFile();
    }, [parseFile]);
    if (!file) {
        return null; // Or a placeholder like <p>No file selected for preview.</p>
    }
    if (isLoading) {
        return <p className={"text-sm text-gray-500 ".concat(className || '')}>Loading preview...</p>;
    }
    if (parseError) {
        return <p className={"text-sm text-red-500 ".concat(className || '')}>{parseError}</p>;
    }
    if (previewRows.length === 0 && previewHeaders.length === 0 && !isLoading) {
        return <p className={"text-sm text-gray-500 ".concat(className || '')}>No data to preview. The file might be empty or not a valid CSV.</p>;
    }
    return (<div className={"overflow-x-auto ".concat(className || '')}>
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {previewHeaders.map(function (header, index) { return (<th key={index} scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {header}
              </th>); })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {previewRows.map(function (row, rowIndex) { return (<tr key={rowIndex}>
              {row.map(function (cell, cellIndex) { return (<td key={cellIndex} className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                  {cell}
                </td>); })}
            </tr>); })}
        </tbody>
      </table>
      {previewRows.length === 0 && !isLoading && !parseError && previewHeaders.length > 0 && (<p className="mt-2 text-sm text-gray-500">No data rows to preview (only headers found).</p>)}
    </div>);
};
export default CsvPreviewGrid;
