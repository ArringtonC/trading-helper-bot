/**
 * Types of trading accounts supported by the system
 */
export var AccountType;
(function (AccountType) {
    AccountType["CASH"] = "Cash";
    AccountType["IBKR"] = "IBKR";
    AccountType["NINJA_TRADER"] = "NinjaTrader";
})(AccountType || (AccountType = {}));
/**
 * Demo account data for initial development
 */
export var DEMO_ACCOUNT = {
    id: "demo1",
    name: "Demo Trading Account",
    type: AccountType.CASH,
    balance: 0,
    lastUpdated: new Date(),
    created: new Date(),
    monthlyDeposit: 100
};
