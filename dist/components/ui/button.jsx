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
var Button = function (_a) {
    var _b = _a.variant, variant = _b === void 0 ? 'default' : _b, _c = _a.className, className = _c === void 0 ? '' : _c, props = __rest(_a, ["variant", "className"]);
    var base = 'px-4 py-2 rounded font-medium focus:outline-none transition';
    var variants = {
        default: 'bg-blue-600 text-white hover:bg-blue-700',
        outline: 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50',
    };
    return (<button className={"".concat(base, " ").concat(variants[variant], " ").concat(className)} {...props}/>);
};
export { Button };
