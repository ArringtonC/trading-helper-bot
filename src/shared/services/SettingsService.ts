export const loadSetting = (key: string): string | null =>
  localStorage.getItem(key);

export const saveSetting = (key: string, value: string): void =>
  localStorage.setItem(key, value);

// Initialize default settings if they don't exist
export const initializeSettings = (): void => {
  if (loadSetting('showImport') === null) {
    saveSetting('showImport', 'false');
  }
  if (loadSetting('showDirectImport') === null) {
    saveSetting('showDirectImport', 'false');
  }
}; 