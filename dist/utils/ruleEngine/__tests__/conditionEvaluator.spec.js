import { evaluateCondition } from '../conditionEvaluator';
describe('ConditionEvaluator', function () {
    var consoleErrorSpy;
    beforeEach(function () {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(function () { });
    });
    afterEach(function () {
        consoleErrorSpy.mockRestore();
    });
    it('evaluates == operator', function () {
        expect(evaluateCondition({ field: 'a', operator: '==', value: 1 }, { a: 1 })).toBe(true);
        expect(evaluateCondition({ field: 'a', operator: '==', value: 2 }, { a: 1 })).toBe(false);
    });
    it('evaluates != operator', function () {
        expect(evaluateCondition({ field: 'a', operator: '!=', value: 1 }, { a: 2 })).toBe(true);
        expect(evaluateCondition({ field: 'a', operator: '!=', value: 1 }, { a: 1 })).toBe(false);
    });
    it('evaluates >, <, >=, <= operators', function () {
        expect(evaluateCondition({ field: 'a', operator: '>', value: 1 }, { a: 2 })).toBe(true);
        expect(evaluateCondition({ field: 'a', operator: '<', value: 2 }, { a: 1 })).toBe(true);
        expect(evaluateCondition({ field: 'a', operator: '>=', value: 2 }, { a: 2 })).toBe(true);
        expect(evaluateCondition({ field: 'a', operator: '<=', value: 2 }, { a: 2 })).toBe(true);
    });
    it('evaluates in and not in operators', function () {
        expect(evaluateCondition({ field: 'a', operator: 'in', value: [1, 2, 3] }, { a: 2 })).toBe(true);
        expect(evaluateCondition({ field: 'a', operator: 'not in', value: [1, 2, 3] }, { a: 4 })).toBe(true);
    });
    it('evaluates AND/OR logic', function () {
        expect(evaluateCondition({ and: [
                { field: 'a', operator: '==', value: 1 },
                { field: 'b', operator: '==', value: 2 }
            ] }, { a: 1, b: 2 })).toBe(true);
        expect(evaluateCondition({ or: [
                { field: 'a', operator: '==', value: 1 },
                { field: 'b', operator: '==', value: 2 }
            ] }, { a: 0, b: 2 })).toBe(true);
    });
    it('evaluates deeply nested AND/OR logic', function () {
        expect(evaluateCondition({
            and: [
                { field: 'a', operator: '==', value: 1 },
                { or: [
                        { field: 'b', operator: '==', value: 2 },
                        { field: 'c', operator: '!=', value: 3 }
                    ] }
            ]
        }, { a: 1, b: 2, c: 4 })).toBe(true);
        expect(evaluateCondition({
            and: [
                { field: 'a', operator: '==', value: 1 },
                { or: [
                        { field: 'b', operator: '==', value: 2 },
                        { field: 'c', operator: '!=', value: 3 }
                    ] }
            ]
        }, { a: 1, b: 3, c: 3 })).toBe(false);
    });
    it('handles missing fields in context gracefully', function () {
        // Field missing, should evaluate to false
        expect(evaluateCondition({ field: 'nonExistent', operator: '==', value: 1 }, { a: 1 })).toBe(false);
        // Field exists but is null/undefined
        expect(evaluateCondition({ field: 'b', operator: '==', value: 1 }, { a: 1, b: null })).toBe(false);
        expect(evaluateCondition({ field: 'c', operator: '==', value: 1 }, { a: 1 })).toBe(false); // c is undefined
    });
    it('throws on invalid operator', function () {
        expect(function () { return evaluateCondition({ field: 'a', operator: 'invalid', value: 1 }, { a: 1 }); }).toThrow();
    });
    it('evaluates contains operator', function () {
        expect(evaluateCondition({ field: 'a', operator: 'contains', value: 'foo' }, { a: 'foobar' })).toBe(true);
        expect(evaluateCondition({ field: 'a', operator: 'contains', value: 'baz' }, { a: 'foobar' })).toBe(false);
        expect(evaluateCondition({ field: 'a', operator: 'contains', value: 'foo' }, { a: 123 })).toBe(false);
    });
    it('evaluates startsWith operator', function () {
        expect(evaluateCondition({ field: 'a', operator: 'startsWith', value: 'foo' }, { a: 'foobar' })).toBe(true);
        expect(evaluateCondition({ field: 'a', operator: 'startsWith', value: 'bar' }, { a: 'foobar' })).toBe(false);
        expect(evaluateCondition({ field: 'a', operator: 'startsWith', value: 'foo' }, { a: 123 })).toBe(false);
    });
    it('evaluates matches operator (regex)', function () {
        expect(evaluateCondition({ field: 'a', operator: 'matches', value: '^foo' }, { a: 'foobar' })).toBe(true);
        expect(evaluateCondition({ field: 'a', operator: 'matches', value: 'bar$' }, { a: 'foobar' })).toBe(true);
        expect(evaluateCondition({ field: 'a', operator: 'matches', value: 'baz' }, { a: 'foobar' })).toBe(false);
        expect(evaluateCondition({ field: 'a', operator: 'matches', value: /foo/ }, { a: 'foobar' })).toBe(true);
        expect(evaluateCondition({ field: 'a', operator: 'matches', value: /baz/ }, { a: 'foobar' })).toBe(false);
        expect(evaluateCondition({ field: 'a', operator: 'matches', value: 'foo[' }, { a: 'foobar' })).toBe(false); // invalid regex
        expect(evaluateCondition({ field: 'a', operator: 'matches', value: '^foo' }, { a: 123 })).toBe(false);
    });
});
