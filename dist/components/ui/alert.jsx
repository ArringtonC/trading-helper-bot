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
import React from 'react';
var Alert = function (_a) {
    var _b = _a.variant, variant = _b === void 0 ? 'default' : _b, _c = _a.className, className = _c === void 0 ? '' : _c, props = __rest(_a, ["variant", "className"]);
    var base = 'p-4 rounded flex items-start gap-2';
    var variants = {
        default: 'bg-yellow-50 border border-yellow-300 text-yellow-800',
        destructive: 'bg-red-50 border border-red-300 text-red-800',
    };
    return <div className={"".concat(base, " ").concat(variants[variant], " ").concat(className)} {...props}/>;
};
var AlertTitle = function (_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, props = __rest(_a, ["className"]);
    return (<div className={"font-semibold text-base ".concat(className)} {...props}/>);
};
var AlertDescription = function (_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, props = __rest(_a, ["className"]);
    return (<div className={"text-sm ".concat(className)} {...props}/>);
};
export { Alert, AlertTitle, AlertDescription };
