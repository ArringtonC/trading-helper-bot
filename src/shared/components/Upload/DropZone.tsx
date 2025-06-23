import React, { useRef, useState } from 'react';

interface DropZoneProps {
  onFileUpload: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

const DropZone: React.FC<DropZoneProps> = ({ onFileUpload, disabled = false, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      console.log('[DEBUG] File selected:', file);
      onFileUpload(file);
      setFileName(file.name);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      console.log('[DEBUG] File selected:', file);
      onFileUpload(file);
      setFileName(file.name);
    }
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
      <div className="flex flex-col items-center justify-center">
        <span className="text-2xl mb-2" role="img" aria-label="upload">📄</span>
        <span className="font-medium text-gray-700">{fileName ? `Selected: ${fileName}` : 'Drag & drop or click to select a CSV file'}</span>
        <span className="text-xs text-gray-400 mt-1">Only .csv files are supported</span>
      </div>
    </div>
  );
};

export default DropZone; 