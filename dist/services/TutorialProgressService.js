var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var COMPLETED_TUTORIALS_STORAGE_KEY = 'completedTutorials';
/**
 * Retrieves the list of completed tutorial IDs from localStorage.
 * @returns An array of completed tutorial IDs.
 */
export var getCompletedTutorialIds = function () {
    try {
        var storedValue = localStorage.getItem(COMPLETED_TUTORIALS_STORAGE_KEY);
        if (storedValue) {
            var ids = JSON.parse(storedValue);
            if (Array.isArray(ids) && ids.every(function (id) { return typeof id === 'string'; })) {
                return ids;
            }
        }
    }
    catch (error) {
        console.error('Error reading completed tutorials from localStorage:', error);
        // Fallback or re-throw, depending on desired error handling
    }
    return []; // Return empty array if not found or error
};
/**
 * Saves the list of completed tutorial IDs to localStorage.
 * @param ids - An array of tutorial IDs to save.
 */
export var saveCompletedTutorialIds = function (ids) {
    try {
        localStorage.setItem(COMPLETED_TUTORIALS_STORAGE_KEY, JSON.stringify(ids));
    }
    catch (error) {
        console.error('Error saving completed tutorials to localStorage:', error);
    }
};
/**
 * Marks a tutorial as completed by adding its ID to localStorage.
 * If the ID already exists, it will not be added again.
 * @param tutorialId - The ID of the tutorial to mark as completed.
 */
export var markTutorialAsCompleted = function (tutorialId) {
    var currentCompletedIds = getCompletedTutorialIds();
    if (!currentCompletedIds.includes(tutorialId)) {
        var updatedIds = __spreadArray(__spreadArray([], currentCompletedIds, true), [tutorialId], false);
        saveCompletedTutorialIds(updatedIds);
    }
};
