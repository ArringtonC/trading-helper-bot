/**
 * Utility functions for logging
 */

/**
 * Saves logs to a file and triggers a download
 * @param logs Array of log messages to save
 * @param filename Optional filename (defaults to 'ibkr-import-logs.txt')
 */
export const saveLogsToFile = (logs: string[], filename: string = 'ibkr-import-logs.txt'): void => {
  // Create a blob with the logs
  const logContent = logs.join('\n');
  const blob = new Blob([logContent], { type: 'text/plain' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to the document, click it, and remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  URL.revokeObjectURL(url);
}; 