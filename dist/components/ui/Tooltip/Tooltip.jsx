var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import React, { useState, useRef, useEffect } from 'react';
var Tooltip = function (_a) {
    var content = _a.content, children = _a.children, _b = _a.position, position = _b === void 0 ? 'top' : _b, _c = _a.className, className = _c === void 0 ? '' : _c, _d = _a.offset, offset = _d === void 0 ? 8 : _d;
    var _e = useState(false), isVisible = _e[0], setIsVisible = _e[1];
    var _f = useState({ top: 0, left: 0 }), tooltipPosition = _f[0], setTooltipPosition = _f[1];
    var childRef = useRef(null);
    var tooltipRef = useRef(null);
    var handleMouseEnter = function () {
        var _a;
        if (childRef.current) {
            var childRect = childRef.current.getBoundingClientRect();
            var tooltipRect = (_a = tooltipRef.current) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
            var top_1 = 0;
            var left = 0;
            switch (position) {
                case 'top':
                    top_1 = childRect.top - ((tooltipRect === null || tooltipRect === void 0 ? void 0 : tooltipRect.height) || 0) - offset;
                    left = childRect.left + childRect.width / 2 - ((tooltipRect === null || tooltipRect === void 0 ? void 0 : tooltipRect.width) || 0) / 2;
                    break;
                case 'bottom':
                    top_1 = childRect.bottom + offset;
                    left = childRect.left + childRect.width / 2 - ((tooltipRect === null || tooltipRect === void 0 ? void 0 : tooltipRect.width) || 0) / 2;
                    break;
                case 'left':
                    top_1 = childRect.top + childRect.height / 2 - ((tooltipRect === null || tooltipRect === void 0 ? void 0 : tooltipRect.height) || 0) / 2;
                    left = childRect.left - ((tooltipRect === null || tooltipRect === void 0 ? void 0 : tooltipRect.width) || 0) - offset;
                    break;
                case 'right':
                    top_1 = childRect.top + childRect.height / 2 - ((tooltipRect === null || tooltipRect === void 0 ? void 0 : tooltipRect.height) || 0) / 2;
                    left = childRect.right + offset;
                    break;
            }
            // Adjust for scroll position
            top_1 += window.scrollY;
            left += window.scrollX;
            setTooltipPosition({ top: top_1, left: left });
        }
        setIsVisible(true);
    };
    var handleMouseLeave = function () {
        setIsVisible(false);
    };
    // Attach refs
    var isDOMElement = typeof children.type === 'string';
    var childrenWithRef = React.isValidElement(children)
        ? React.cloneElement(children, __assign({}, (isDOMElement ? { ref: childRef,
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            onFocus: handleMouseEnter,
            onBlur: handleMouseLeave } : {})))
        : children;
    // Re-calculate position if content changes and tooltip is visible
    useEffect(function () {
        if (isVisible && childRef.current && tooltipRef.current) {
            var childRect = childRef.current.getBoundingClientRect();
            var tooltipRect = tooltipRef.current.getBoundingClientRect();
            var top_2 = 0;
            var left = 0;
            switch (position) {
                case 'top':
                    top_2 = childRect.top - tooltipRect.height - offset;
                    left = childRect.left + childRect.width / 2 - tooltipRect.width / 2;
                    break;
                case 'bottom':
                    top_2 = childRect.bottom + offset;
                    left = childRect.left + childRect.width / 2 - tooltipRect.width / 2;
                    break;
                case 'left':
                    top_2 = childRect.top + childRect.height / 2 - tooltipRect.height / 2;
                    left = childRect.left - tooltipRect.width - offset;
                    break;
                case 'right':
                    top_2 = childRect.top + childRect.height / 2 - tooltipRect.height / 2;
                    left = childRect.right + offset;
                    break;
            }
            top_2 += window.scrollY;
            left += window.scrollX;
            // Boundary detection (simple version, can be expanded)
            if (left < 0)
                left = offset;
            if (top_2 < 0)
                top_2 = offset;
            if (tooltipRect && left + tooltipRect.width > window.innerWidth) {
                left = window.innerWidth - tooltipRect.width - offset;
            }
            if (tooltipRect && top_2 + tooltipRect.height > window.innerHeight + window.scrollY) {
                // If it overflows bottom, try to reposition to top if original position was bottom
                if (position === 'bottom') {
                    top_2 = childRect.top - tooltipRect.height - offset + window.scrollY;
                }
                else {
                    // For other positions, just cap it at the bottom of the viewport
                    top_2 = window.innerHeight + window.scrollY - tooltipRect.height - offset;
                }
            }
            setTooltipPosition({ top: top_2, left: left });
        }
    }, [isVisible, content, position, offset]);
    return (<>
      {childrenWithRef}
      {isVisible && (<div ref={tooltipRef} role="tooltip" style={{
                position: 'absolute',
                top: "".concat(tooltipPosition.top, "px"),
                left: "".concat(tooltipPosition.left, "px"),
                zIndex: 1000, // Ensure tooltip is on top
            }} className={"bg-gray-800 text-white text-sm p-2 rounded shadow-lg ".concat(className)}>
          {content}
        </div>)}
    </>);
};
export default Tooltip;
