import React, { useState, useRef, useEffect, useCallback } from 'react';
var Popover = function (_a) {
    var content = _a.content, children = _a.children, title = _a.title, _b = _a.position, position = _b === void 0 ? 'bottom' : _b, _c = _a.className, className = _c === void 0 ? '' : _c, _d = _a.offset, offset = _d === void 0 ? 12 : _d, _e = _a.trigger, trigger = _e === void 0 ? 'click' : _e, controlledIsOpen = _a.isOpen, onClose = _a.onClose, _f = _a.clickable, clickable = _f === void 0 ? false : _f, _g = _a.arrow, arrow = _g === void 0 ? true : _g;
    var _h = useState(false), internalIsVisible = _h[0], setInternalIsVisible = _h[1];
    var popoverPosition = useRef({ top: 0, left: 0 });
    var childRef = useRef(null);
    var popoverRef = useRef(null);
    var ARROW_SIZE = 8;
    var isControlled = typeof controlledIsOpen === 'boolean';
    var isVisible = isControlled ? controlledIsOpen : internalIsVisible;
    var closePopover = useCallback(function () {
        if (onClose) {
            onClose();
        }
        if (!isControlled) {
            setInternalIsVisible(false);
        }
    }, [onClose, isControlled]);
    var updatePosition = useCallback(function () {
        if (!childRef.current || !popoverRef.current)
            return;
        var childRect = childRef.current.getBoundingClientRect();
        var popoverRect = popoverRef.current.getBoundingClientRect();
        var top = 0;
        var left = 0;
        switch (position) {
            case 'top':
                top = childRect.top - popoverRect.height - offset;
                left = childRect.left + childRect.width / 2 - popoverRect.width / 2;
                break;
            case 'bottom':
                top = childRect.bottom + offset;
                left = childRect.left + childRect.width / 2 - popoverRect.width / 2;
                break;
            case 'left':
                top = childRect.top + childRect.height / 2 - popoverRect.height / 2;
                left = childRect.left - popoverRect.width - offset;
                break;
            case 'right':
                top = childRect.top + childRect.height / 2 - popoverRect.height / 2;
                left = childRect.right + offset;
                break;
        }
        top += window.scrollY;
        left += window.scrollX;
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight + window.scrollY;
        if (left < ARROW_SIZE)
            left = ARROW_SIZE;
        if (top < ARROW_SIZE + window.scrollY)
            top = ARROW_SIZE + window.scrollY;
        if (left + popoverRect.width > viewportWidth - ARROW_SIZE) {
            left = viewportWidth - popoverRect.width - ARROW_SIZE;
        }
        if (top + popoverRect.height > viewportHeight - ARROW_SIZE) {
            if (position === 'bottom' || position === 'top') {
                if (childRect.top - popoverRect.height - offset + window.scrollY > ARROW_SIZE + window.scrollY) {
                    top = childRect.top - popoverRect.height - offset + window.scrollY;
                }
                else {
                    top = viewportHeight - popoverRect.height - ARROW_SIZE;
                }
            }
            else {
                top = viewportHeight - popoverRect.height - ARROW_SIZE;
            }
        }
        popoverPosition.current = { top: top, left: left };
        if (popoverRef.current) {
            popoverRef.current.style.top = "".concat(top, "px");
            popoverRef.current.style.left = "".concat(left, "px");
        }
    }, [position, offset, ARROW_SIZE]);
    useEffect(function () {
        if (isVisible && (childRef.current || !children)) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return function () {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible, updatePosition, children]);
    var handleTriggerInteraction = function (e) {
        if (isControlled)
            return;
        e.stopPropagation();
        if (trigger === 'click') {
            setInternalIsVisible(function (prev) { return !prev; });
        }
        else if (trigger === 'hover') {
            // For hover, onMouseEnter sets true, onMouseLeave sets false
            // This specific handler might be more for click if we combine logic
        }
    };
    var handleMouseEnter = function () {
        if (isControlled || trigger !== 'hover')
            return;
        setInternalIsVisible(true);
    };
    var handleMouseLeave = function () {
        if (isControlled || trigger !== 'hover')
            return;
        setInternalIsVisible(false);
    };
    var handleClickOutside = useCallback(function (event) {
        if (isVisible &&
            popoverRef.current &&
            !popoverRef.current.contains(event.target) &&
            (!childRef.current || !childRef.current.contains(event.target)) &&
            !clickable) {
            closePopover();
        }
    }, [closePopover, clickable, isVisible]);
    var handleEscapeKey = useCallback(function (event) {
        if (isVisible && event.key === 'Escape') {
            closePopover();
        }
    }, [closePopover, isVisible]);
    useEffect(function () {
        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }
        return function () {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isVisible, handleClickOutside, handleEscapeKey]);
    var childrenProps = {
        ref: childRef,
        'aria-haspopup': 'dialog',
        'aria-expanded': isVisible,
    };
    if (!isControlled) {
        if (trigger === 'click') {
            childrenProps.onClick = handleTriggerInteraction;
        }
        else if (trigger === 'hover') {
            childrenProps.onMouseEnter = handleMouseEnter;
            childrenProps.onMouseLeave = handleMouseLeave;
            childrenProps.onFocus = handleMouseEnter;
            childrenProps.onBlur = handleMouseLeave;
        }
    }
    var childrenWithProps = children ? React.cloneElement(children, childrenProps) : null;
    var getArrowStyles = useCallback(function () {
        var _a;
        var styles = {
            position: 'absolute',
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: "".concat(ARROW_SIZE, "px"),
        };
        var popoverRect = (_a = popoverRef.current) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
        if (!popoverRect)
            return styles;
        var arrowHalf = ARROW_SIZE;
        switch (position) {
            case 'top':
                styles.borderColor = '#fff transparent transparent transparent';
                styles.top = '100%';
                styles.left = "".concat(popoverRect.width / 2 - arrowHalf, "px");
                break;
            case 'bottom':
                styles.borderColor = 'transparent transparent #fff transparent';
                styles.bottom = '100%';
                styles.left = "".concat(popoverRect.width / 2 - arrowHalf, "px");
                break;
            case 'left':
                styles.borderColor = 'transparent transparent transparent #fff';
                styles.left = '100%';
                styles.top = "".concat(popoverRect.height / 2 - arrowHalf, "px");
                break;
            case 'right':
                styles.borderColor = 'transparent #fff transparent transparent';
                styles.right = '100%';
                styles.top = "".concat(popoverRect.height / 2 - arrowHalf, "px");
                break;
        }
        return styles;
    }, [position, ARROW_SIZE]);
    var renderPopover = function () { return (<div ref={popoverRef} role="dialog" aria-modal="false" aria-labelledby={title ? 'popover-title' : undefined} style={{
            position: 'absolute',
            top: "".concat(popoverPosition.current.top, "px"),
            left: "".concat(popoverPosition.current.left, "px"),
            zIndex: 1050,
            visibility: isVisible ? 'visible' : 'hidden',
        }} className={"bg-white border border-gray-300 rounded-lg shadow-xl p-4 min-w-[200px] max-w-xs ".concat(className)}>
        {arrow && <div style={getArrowStyles()} data-testid="popover-arrow"/>}
        {title && (<h3 id="popover-title" className="text-lg font-semibold mb-2 border-b pb-2">
            {title}
          </h3>)}
        <button onClick={closePopover} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close popover">
          &times;
        </button>
        <div className="text-sm text-gray-700">
            {content}
        </div>
      </div>); };
    if (!childrenWithProps && isControlled && isVisible) {
        return renderPopover();
    }
    return (<>
      {childrenWithProps}
      {isVisible && renderPopover()}
    </>);
};
export default Popover;
