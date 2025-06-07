import React, { createContext, useContext, useState } from 'react';
var TradesContext = createContext(undefined);
export var TradesProvider = function (_a) {
    var children = _a.children;
    var _b = useState([]), trades = _b[0], setTrades = _b[1];
    return (<TradesContext.Provider value={{ trades: trades, setTrades: setTrades }}>
      {children}
    </TradesContext.Provider>);
};
export var useTrades = function () {
    var ctx = useContext(TradesContext);
    if (!ctx)
        throw new Error('useTrades must be used within a TradesProvider');
    return ctx;
};
