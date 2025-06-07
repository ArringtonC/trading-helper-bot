import React, { createContext, useContext, useState } from 'react';
var WinRateContext = createContext(undefined);
export var WinRateProvider = function (_a) {
    var children = _a.children;
    var _b = useState(null), winRate = _b[0], setWinRate = _b[1];
    return (<WinRateContext.Provider value={{ winRate: winRate, setWinRate: setWinRate }}>
      {children}
    </WinRateContext.Provider>);
};
export var useWinRate = function () {
    var context = useContext(WinRateContext);
    if (!context) {
        throw new Error('useWinRate must be used within a WinRateProvider');
    }
    return context;
};
