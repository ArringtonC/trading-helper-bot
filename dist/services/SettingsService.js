export var loadSetting = function (key) {
    return localStorage.getItem(key);
};
export var saveSetting = function (key, value) {
    return localStorage.setItem(key, value);
};
// Initialize default settings if they don't exist
export var initializeSettings = function () {
    if (loadSetting('showImport') === null) {
        saveSetting('showImport', 'false');
    }
    if (loadSetting('showDirectImport') === null) {
        saveSetting('showDirectImport', 'false');
    }
};
