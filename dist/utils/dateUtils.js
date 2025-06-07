import { format, parseISO } from 'date-fns';
/**
 * Safely parse a date string or Date object into a Date
 * @param dateStringOrDate The date string or Date object to parse
 * @returns A Date object or null if parsing fails
 */
export function safeParseDate(dateStringOrDate) {
    if (!dateStringOrDate) {
        return null;
    }
    if (dateStringOrDate instanceof Date) {
        return dateStringOrDate;
    }
    try {
        // Try to parse as ISO string first
        return parseISO(dateStringOrDate);
    }
    catch (error) {
        // If that fails, try to create a new Date
        var date = new Date(dateStringOrDate);
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateStringOrDate);
            return null;
        }
        return date;
    }
}
/**
 * Format a date for display
 * @param date The date to format
 * @param formatStr The format string to use
 * @returns A formatted date string or an empty string if the date is invalid
 */
export function formatDateForDisplay(date, formatStr) {
    if (formatStr === void 0) { formatStr = 'MMM d, yyyy'; }
    var parsedDate = safeParseDate(date);
    if (!parsedDate) {
        return '';
    }
    return format(parsedDate, formatStr);
}
/**
 * Calculate days between two dates
 * @param startDate The start date
 * @param endDate The end date
 * @returns The number of days between the dates
 */
export function daysBetween(startDate, endDate) {
    var start = safeParseDate(startDate);
    var end = safeParseDate(endDate);
    if (!start || !end) {
        return 0;
    }
    var diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
/**
 * Calculate days until a future date
 * @param futureDate The future date
 * @param currentDate The current date (defaults to now)
 * @returns The number of days until the future date
 */
export function daysUntil(futureDate, currentDate) {
    if (currentDate === void 0) { currentDate = new Date(); }
    var future = safeParseDate(futureDate);
    if (!future) {
        return 0;
    }
    var diffTime = future.getTime() - currentDate.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}
