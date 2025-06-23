import React, { useState, useCallback, useRef } from 'react';

interface CsvDropzoneProps {
  onFileDrop: (file: File) => void;
  className?: string;
}

const CsvDropzone: React.FC<CsvDropzoneProps> = ({ onFileDrop, className }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Check if the mouse is leaving to an outside element
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation(); // Necessary to allow drop
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDraggingOver(false);

      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0];
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          onFileDrop(file);
        } else {
          // Optional: Handle incorrect file type (e.g., show an alert or message)
          console.warn('Incorrect file type. Please upload a CSV file.');
        }
        event.dataTransfer.clearData();
      }
    },
    [onFileDrop]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
       if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onFileDrop(file);
      } else {
        console.warn('Incorrect file type. Please upload a CSV file.');
      }
    }
  };

  const baseClasses = 'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer';
  const inactiveClasses = 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100';
  const activeClasses = 'border-blue-500 bg-blue-50';

  return (
    <div
      className={`${baseClasses} ${isDraggingOver ? activeClasses : inactiveClasses} ${className || ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && handleClick()} // Accessibility for keyboard
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,text/csv"
        className="hidden"
      />
      <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
      <p className="mb-2 text-sm text-gray-500">
        <span className="font-semibold">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-gray-500">CSV files only</p>
    </div>
  );
};

export default CsvDropzone; 