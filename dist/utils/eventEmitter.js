var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var eventEmitter = (function () {
    var events = {};
    var on = function (eventName, callback) {
        if (!events[eventName]) {
            events[eventName] = [];
        }
        events[eventName].push(callback);
        // Return an unsubscribe function
        return function () {
            events[eventName] = events[eventName].filter(function (cb) { return cb !== callback; });
            if (events[eventName].length === 0) {
                delete events[eventName];
            }
        };
    };
    var off = function (eventName, callback) {
        if (!events[eventName])
            return;
        events[eventName] = events[eventName].filter(function (cb) { return cb !== callback; });
        if (events[eventName].length === 0) {
            delete events[eventName];
        }
    };
    var dispatch = function (eventName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!events[eventName])
            return;
        // Create a copy of the callbacks array in case a callback unsubscribes itself
        var callbacks = __spreadArray([], events[eventName], true);
        callbacks.forEach(function (callback) {
            callback.apply(void 0, args);
        });
    };
    return {
        on: on,
        off: off,
        dispatch: dispatch,
    };
})();
export default eventEmitter;
