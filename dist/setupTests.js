// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// Mock the localStorage
var localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
    removeItem: jest.fn(),
    length: 0,
    key: jest.fn()
};
global.localStorage = localStorageMock;
// Mock the fetch API
global.fetch = jest.fn(function () {
    return Promise.resolve({
        json: function () { return Promise.resolve({}); },
    });
});
