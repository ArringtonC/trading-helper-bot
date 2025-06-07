import React, { useRef, useState } from 'react';
var DropZone = function (_a) {
    var onFileUpload = _a.onFileUpload, _b = _a.disabled, disabled = _b === void 0 ? false : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    var _d = useState(false), isDragging = _d[0], setIsDragging = _d[1];
    var _e = useState(null), fileName = _e[0], setFileName = _e[1];
    var inputRef = useRef(null);
    var handleDragOver = function (e) {
        e.preventDefault();
        if (!disabled)
            setIsDragging(true);
    };
    var handleDragLeave = function (e) {
        e.preventDefault();
        setIsDragging(false);
    };
    var handleDrop = function (e) {
        e.preventDefault();
        setIsDragging(false);
        if (disabled)
            return;
        var file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            console.log('[DEBUG] File selected:', file);
            onFileUpload(file);
            setFileName(file.name);
        }
    };
    var handleInputChange = function (e) {
        var _a;
        var file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file && file.name.endsWith('.csv')) {
            console.log('[DEBUG] File selected:', file);
            onFileUpload(file);
            setFileName(file.name);
        }
    };
    var handleClick = function () {
        var _a;
        if (!disabled)
            (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.click();
    };
    return (<div className={"border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ".concat(isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white', " ").concat(disabled ? 'opacity-50 cursor-not-allowed' : '', " ").concat(className)} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleClick} tabIndex={0} role="button" aria-disabled={disabled}>
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleInputChange} disabled={disabled}/>
      <div className="flex flex-col items-center justify-center">
        <span className="text-2xl mb-2" role="img" aria-label="upload">📄</span>
        <span className="font-medium text-gray-700">{fileName ? "Selected: ".concat(fileName) : 'Drag & drop or click to select a CSV file'}</span>
        <span className="text-xs text-gray-400 mt-1">Only .csv files are supported</span>
      </div>
    </div>);
};
export default DropZone;
