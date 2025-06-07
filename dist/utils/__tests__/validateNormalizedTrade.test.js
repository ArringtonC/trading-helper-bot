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
import { validateNormalizedTradeData } from '../validateNormalizedTrade';
import { BrokerType } from '../../types/trade';
import { v4 as uuidv4 } from 'uuid';
var createValidTrade = function (overrides) {
    if (overrides === void 0) { overrides = {}; }
    return (__assign({ id: uuidv4(), importTimestamp: new Date().toISOString(), broker: BrokerType.IBKR, tradeDate: '2023-10-26', symbol: 'AAPL', assetCategory: 'STK', quantity: 100, tradePrice: 150.00, currency: 'USD', netAmount: -15000.00 }, overrides));
};
describe('validateNormalizedTradeData', function () {
    it('should return no errors for a valid trade object', function () {
        var trade = createValidTrade();
        expect(validateNormalizedTradeData(trade)).toEqual([]);
    });
    it('should return an error if trade object is null', function () {
        expect(validateNormalizedTradeData(null)).toEqual(['Trade object is null or undefined.']);
    });
    // Test Essential Fields
    it('should detect missing or invalid id', function () {
        expect(validateNormalizedTradeData(createValidTrade({ id: '' }))).toContain('Missing or invalid trade ID.');
    });
    it('should detect missing or invalid importTimestamp', function () {
        expect(validateNormalizedTradeData(createValidTrade({ importTimestamp: 'invalid-date' }))).toContain('Missing or invalid import timestamp.');
    });
    it('should detect missing or invalid broker', function () {
        expect(validateNormalizedTradeData(createValidTrade({ broker: 'INVALID_BROKER' }))).toContain('Missing or invalid broker.');
    });
    it('should detect missing or invalid tradeDate format', function () {
        expect(validateNormalizedTradeData(createValidTrade({ tradeDate: '2023/10/26' }))).toContain('Invalid tradeDate format: 2023/10/26. Expected YYYY-MM-DD.');
        expect(validateNormalizedTradeData(createValidTrade({ tradeDate: 'invalid-date' }))).toContain('Invalid tradeDate format: invalid-date. Expected YYYY-MM-DD.');
    });
    it('should detect missing or invalid symbol', function () {
        expect(validateNormalizedTradeData(createValidTrade({ symbol: '' }))).toContain('Missing or invalid symbol.');
    });
    it('should detect missing or invalid assetCategory', function () {
        expect(validateNormalizedTradeData(createValidTrade({ assetCategory: 'INVALID_ASSET' }))).toContain('Missing or invalid asset category.');
    });
    it('should detect non-numeric quantity', function () {
        expect(validateNormalizedTradeData(createValidTrade({ quantity: 'abc' }))).toContain('Missing or invalid quantity.');
    });
    it('should detect non-numeric tradePrice', function () {
        expect(validateNormalizedTradeData(createValidTrade({ tradePrice: 'xyz' }))).toContain('Missing or invalid trade price.');
    });
    it('should detect invalid currency code', function () {
        expect(validateNormalizedTradeData(createValidTrade({ currency: 'US' }))).toContain('Missing or invalid currency code (must be 3 letters).');
    });
    it('should detect non-numeric netAmount', function () {
        expect(validateNormalizedTradeData(createValidTrade({ netAmount: ' πολλά' }))).toContain('Missing or invalid net amount.');
    });
    // Test Optional Field Formats
    it('should detect invalid settleDate format', function () {
        expect(validateNormalizedTradeData(createValidTrade({ settleDate: '26/10/2023' }))).toContain('Invalid settleDate format: 26/10/2023. Expected YYYY-MM-DD.');
    });
    it('should detect invalid commission type', function () {
        expect(validateNormalizedTradeData(createValidTrade({ commission: 'not-a-number' }))).toContain('Invalid commission type, must be a number or null/undefined.');
    });
    // Option Specific Validations
    it('should require option fields if assetCategory is OPT', function () {
        var optTrade = createValidTrade({
            assetCategory: 'OPT',
            expiryDate: undefined,
            strikePrice: undefined,
            putCall: undefined,
            multiplier: undefined
        });
        var errors = validateNormalizedTradeData(optTrade);
        expect(errors).toContain('Options require a valid expiryDate (YYYY-MM-DD): undefined.');
        expect(errors).toContain('Options require a valid positive strikePrice.');
        expect(errors).toContain('Options require a valid putCall indicator (P or C).');
        expect(errors).toContain('Options require a valid positive multiplier.');
    });
    it('should validate correct option fields', function () {
        var optTrade = createValidTrade({
            assetCategory: 'OPT',
            expiryDate: '2024-01-19',
            strikePrice: 150,
            putCall: 'C',
            multiplier: 100,
        });
        expect(validateNormalizedTradeData(optTrade)).toEqual([]);
    });
    it('should flag invalid putCall for options', function () {
        var optTrade = createValidTrade({ assetCategory: 'OPT', expiryDate: '2024-01-19', strikePrice: 150, multiplier: 100, putCall: 'X' });
        expect(validateNormalizedTradeData(optTrade)).toContain('Options require a valid putCall indicator (P or C).');
    });
});
