import React from 'react';
var Progress = function (_a) {
    var value = _a.value, _b = _a.className, className = _b === void 0 ? '' : _b;
    return (<div className={"w-full bg-gray-200 rounded h-3 ".concat(className)}>
    <div className="bg-blue-500 h-3 rounded transition-all" style={{ width: "".concat(Math.max(0, Math.min(100, value)), "%") }}/>
  </div>);
};
export { Progress };
