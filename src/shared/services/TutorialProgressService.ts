const COMPLETED_TUTORIALS_STORAGE_KEY = 'completedTutorials';

/**
 * Retrieves the list of completed tutorial IDs from localStorage.
 * @returns An array of completed tutorial IDs.
 */
export const getCompletedTutorialIds = (): string[] => {
  try {
    const storedValue = localStorage.getItem(COMPLETED_TUTORIALS_STORAGE_KEY);
    if (storedValue) {
      const ids = JSON.parse(storedValue);
      if (Array.isArray(ids) && ids.every(id => typeof id === 'string')) {
        return ids;
      }
    }
  } catch (error) {
    console.error('Error reading completed tutorials from localStorage:', error);
    // Fallback or re-throw, depending on desired error handling
  }
  return []; // Return empty array if not found or error
};

/**
 * Saves the list of completed tutorial IDs to localStorage.
 * @param ids - An array of tutorial IDs to save.
 */
export const saveCompletedTutorialIds = (ids: string[]): void => {
  try {
    localStorage.setItem(COMPLETED_TUTORIALS_STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Error saving completed tutorials to localStorage:', error);
  }
};

/**
 * Marks a tutorial as completed by adding its ID to localStorage.
 * If the ID already exists, it will not be added again.
 * @param tutorialId - The ID of the tutorial to mark as completed.
 */
export const markTutorialAsCompleted = (tutorialId: string): void => {
  const currentCompletedIds = getCompletedTutorialIds();
  if (!currentCompletedIds.includes(tutorialId)) {
    const updatedIds = [...currentCompletedIds, tutorialId];
    saveCompletedTutorialIds(updatedIds);
  }
}; 