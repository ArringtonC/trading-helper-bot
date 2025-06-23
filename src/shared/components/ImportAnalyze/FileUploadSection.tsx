/**
 * @fileoverview File Upload Section Component - Simple Bootstrap File Input
 * 
 * This component provides a basic file upload interface using Bootstrap styling
 * for IBKR statement processing. It serves as a simpler alternative to the secure
 * drag-and-drop component, offering traditional HTML file input functionality
 * without advanced security features or drag-and-drop capability.
 * 
 * Key Features:
 * - Standard HTML file input with Bootstrap styling
 * - Basic file type filtering via accept attribute
 * - Simple error display with Bootstrap alert styling
 * - Loading state management for parse operations
 * - Traditional form-based user experience
 * 
 * Limitations compared to SecureDragDropUpload:
 * - No drag-and-drop functionality
 * - No client-side security validation
 * - No file size checking or filename sanitization
 * - Basic error handling without detailed validation messages
 * - No upload progress indication
 * - No accessibility enhancements
 * 
 * Use Cases:
 * - Legacy browser compatibility
 * - Simple file upload without security requirements
 * - Bootstrap-based UI consistency
 * - Minimal implementation for prototyping
 * - Environments where drag-and-drop is not desired
 * 
 * Integration Points:
 * - Import & Analyze Page: Alternative file input method
 * - Bootstrap Theme: Consistent with Bootstrap-styled applications
 * - Legacy Systems: Compatible with older UI frameworks
 * 
 * @author Trading Helper Bot Team
 * @version 1.0.0
 * @since 2024-Q4
 */

import React from 'react';

/**
 * Props interface for the FileUploadSection component.
 * Defines the minimal contract for basic file upload functionality.
 * 
 * @interface FileUploadSectionProps
 */
interface FileUploadSectionProps {
  /** Currently selected file (null if no file selected) */
  file: File | null;
  /** Indicates if parsing operation is in progress */
  parsing: boolean;
  /** Error message from parent component (e.g., parsing errors) */
  error: string | null;
  /** Callback fired when file selection changes via input element */
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback fired when user initiates file parsing */
  onParse: () => void;
}

/**
 * FileUploadSection Component
 * 
 * A basic file upload component that provides traditional HTML file input
 * functionality with Bootstrap styling. Designed for simplicity and 
 * compatibility rather than advanced features or security.
 * 
 * The component follows standard HTML form patterns with Bootstrap CSS
 * classes for consistent styling within Bootstrap-themed applications.
 * Error handling is basic but functional for typical use cases.
 * 
 * This component is ideal when advanced security features, drag-and-drop
 * functionality, or custom styling are not required and Bootstrap
 * consistency is preferred.
 * 
 * @component
 * @param {FileUploadSectionProps} props - Component props
 * @returns {JSX.Element} The rendered file upload section
 * 
 * @example
 * ```tsx
 * <FileUploadSection
 *   file={selectedFile}
 *   parsing={isProcessing}
 *   error={errorMessage}
 *   onFileChange={handleFileInputChange}
 *   onParse={handleParseClick}
 * />
 * ```
 */
const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  file,
  parsing,
  error,
  onFileChange,
  onParse
}) => {
  return (
    // Bootstrap card container for consistent styling with other components
    <div className="card mb-4">
      <div className="card-body">
        {/* Form label with accessibility support */}
        <label htmlFor="ibkr-file" className="form-label">
          Upload IBKR Activity Statement (CSV or TXT)
        </label>
        
        {/* 
          Standard HTML file input with Bootstrap styling
          - Accept attribute provides basic file type filtering
          - Bootstrap form-control class for consistent appearance
          - Connected to label via htmlFor/id relationship
        */}
        <input
          type="file"
          className="form-control mb-2"
          id="ibkr-file"
          accept=".csv,.txt"
          onChange={onFileChange}
        />
        
        {/* 
          Parse action button with state management
          - Disabled when no file selected or parsing in progress
          - Dynamic text based on parsing state
          - Bootstrap button styling for consistency
        */}
        <button 
          className="btn btn-primary" 
          onClick={onParse} 
          disabled={!file || parsing}
        >
          {parsing ? 'Parsing...' : 'Parse Statement'}
        </button>
        
        {/* 
          Error display section
          - Only rendered when error exists
          - Bootstrap alert styling for visual prominence
          - Margin top for spacing from button
        */}
        {error && (
          <div className="alert alert-danger mt-3">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadSection; 
 
 
 