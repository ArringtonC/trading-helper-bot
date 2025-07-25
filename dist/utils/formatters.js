/**
 * Format a number as currency
 * @param value The number to format
 * @returns Formatted currency string
 */
export var formatCurrency = function (value) {
    return "$".concat(value.toFixed(2));
};
/**
 * Format a date as a string
 * @param date The date to format
 * @returns Formatted date string
 */
export var formatDate = function (date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};
/**
 * Format a number as USD currency
 * @param value The number to format
 * @returns Formatted currency string
 */
export var fmtUsd = function (value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};
/**
 * Format a date as a string
 * @param value The date string to format
 * @returns Formatted date string
 */
export var fmtDate = function (value) {
    var date = new Date(value);
    if (isNaN(date.getTime()))
        return '–';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    }).format(date);
};
