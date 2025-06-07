import { v4 as uuidv4 } from 'uuid';
export function mapToDatabaseTrade(trade) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    // Use the pre-calculated realizedPL from parser
    var realizedPL = (_a = trade.realizedPL) !== null && _a !== void 0 ? _a : 0;
    // For now, unrealizedPL is 0 since we're dealing with closed trades
    var unrealizedPL = 0;
    // Total trade P&L is the sum of realized and unrealized
    var tradePL = realizedPL + unrealizedPL;
    return {
        id: uuidv4(),
        symbol: (_b = trade.symbol) !== null && _b !== void 0 ? _b : '',
        dateTime: (_c = trade.dateTime) !== null && _c !== void 0 ? _c : '',
        quantity: (_d = trade.quantity) !== null && _d !== void 0 ? _d : 0,
        price: (_e = trade.price) !== null && _e !== void 0 ? _e : 0,
        proceeds: (_f = trade.proceeds) !== null && _f !== void 0 ? _f : 0,
        basis: (_g = trade.basis) !== null && _g !== void 0 ? _g : 0,
        commissionFee: (_h = trade.commissionFee) !== null && _h !== void 0 ? _h : 0,
        positionAfter: (_j = trade.positionAfter) !== null && _j !== void 0 ? _j : 0,
        isClose: (_k = trade.isClose) !== null && _k !== void 0 ? _k : false,
        realizedPL: realizedPL,
        unrealizedPL: unrealizedPL,
        tradePL: tradePL
    };
}
// Helper function to calculate total P&L (only from closing trades)
export function calculateTotalPL(trades) {
    return trades.reduce(function (acc, t) { return acc + (t.isClose ? t.realizedPL : 0); }, 0);
}
