/**
 * Utility functions for logging
 */
/**
 * Saves logs to a file and triggers a download
 * @param logs Array of log messages to save
 * @param filename Optional filename (defaults to 'ibkr-import-logs.txt')
 */
export var saveLogsToFile = function (logs, filename) {
    if (filename === void 0) { filename = 'ibkr-import-logs.txt'; }
    // Create a blob with the logs
    var logContent = logs.join('\n');
    var blob = new Blob([logContent], { type: 'text/plain' });
    // Create a URL for the blob
    var url = URL.createObjectURL(blob);
    // Create a link element
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    // Append to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Clean up the URL
    URL.revokeObjectURL(url);
};
