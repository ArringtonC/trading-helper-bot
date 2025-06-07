import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';

interface CsvPreviewGridProps {
  file: File | null;
  maxRows?: number;
  className?: string;
}

const CsvPreviewGrid: React.FC<CsvPreviewGridProps> = ({ file, maxRows = 10, className }) => {
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const parseFile = useCallback(() => {
    if (!file) {
      setPreviewHeaders([]);
      setPreviewRows([]);
      setParseError(null);
      return;
    }

    setIsLoading(true);
    setParseError(null);

    Papa.parse(file, {
      header: false, // We'll take the first row as headers manually
      preview: maxRows + 1, // +1 to get headers and maxRows of data
      skipEmptyLines: true,
      complete: (results) => {
        const allRows = results.data as string[][];
        if (allRows.length > 0) {
          setPreviewHeaders(allRows[0]);
          setPreviewRows(allRows.slice(1, maxRows + 1));
        } else {
          setPreviewHeaders([]);
          setPreviewRows([]);
          setParseError('CSV file is empty or could not be parsed correctly.');
        }
        setIsLoading(false);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setParseError(`Error parsing CSV: ${error.message}`);
        setPreviewHeaders([]);
        setPreviewRows([]);
        setIsLoading(false);
      },
    });
  }, [file, maxRows]);

  useEffect(() => {
    parseFile();
  }, [parseFile]);

  if (!file) {
    return null; // Or a placeholder like <p>No file selected for preview.</p>
  }

  if (isLoading) {
    return <p className={`text-sm text-gray-500 ${className || ''}`}>Loading preview...</p>;
  }

  if (parseError) {
    return <p className={`text-sm text-red-500 ${className || ''}`}>{parseError}</p>;
  }

  if (previewRows.length === 0 && previewHeaders.length === 0 && !isLoading) {
     return <p className={`text-sm text-gray-500 ${className || ''}`}>No data to preview. The file might be empty or not a valid CSV.</p>;
  }
  
  return (
    <div className={`overflow-x-auto ${className || ''}`}>
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {previewHeaders.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {previewRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {previewRows.length === 0 && !isLoading && !parseError && previewHeaders.length > 0 && (
        <p className="mt-2 text-sm text-gray-500">No data rows to preview (only headers found).</p>
      )}
    </div>
  );
};

export default CsvPreviewGrid; 