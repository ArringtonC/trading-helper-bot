/**
 * @fileoverview Secure Drag & Drop File Upload Component for IBKR Statements
 * 
 * This component provides a secure, accessible drag-and-drop file upload interface
 * specifically designed for IBKR (Interactive Brokers) activity statements.
 * 
 * Security Features:
 * - File type validation (CSV, TXT only)
 * - File size limits (configurable, default 10MB)
 * - Filename sanitization and dangerous pattern detection
 * - Control character filtering and hidden file protection
 * - Directory traversal prevention
 * 
 * Accessibility Features:
 * - Full keyboard navigation support (Enter/Space)
 * - ARIA labels and semantic HTML structure
 * - Screen reader compatible with descriptive labels
 * - Clear visual feedback for all states
 * 
 * UX Features:
 * - Animated upload progress with smooth transitions
 * - Real-time validation feedback
 * - Drag state visual feedback
 * - Error handling with actionable messages
 * 
 * @author Trading Helper Bot Team
 * @version 1.2.0
 * @since 2024-Q4
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

/**
 * Props interface for SecureDragDropUpload component.
 * Defines the contract for parent-child communication and event handling.
 * 
 * @interface SecureDragDropUploadProps
 */
interface SecureDragDropUploadProps {
  /** Currently selected file (null if no file selected) */
  file: File | null;
  /** Indicates if parsing operation is in progress */
  parsing: boolean;
  /** Error message from parent component (e.g., parsing errors) */
  error: string | null;
  /** Callback fired when file selection changes */
  onFileChange: (file: File | null) => void;
  /** Callback fired when user initiates file parsing */
  onParse: () => void;
  /** Optional callback fired when user clears the file */
  onClear?: () => void;
}

/**
 * File validation result interface.
 * Contains validation status and optional error message.
 * 
 * @interface ValidationResult
 */
interface ValidationResult {
  /** Whether the file passed all validation checks */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Security configuration for file upload validation.
 * All limits and patterns are designed to prevent common attack vectors
 * while maintaining usability for legitimate IBKR statement files.
 * 
 * @constant {Object} SECURITY_CONFIG
 */
const SECURITY_CONFIG = {
  /** Maximum file size in bytes (10MB - sufficient for large IBKR statements) */
  maxFileSize: 10 * 1024 * 1024,
  /** Allowed MIME types for uploaded files */
  allowedTypes: ['text/csv', 'text/plain', 'application/csv'],
  /** Allowed file extensions (lowercase) */
  allowedExtensions: ['.csv', '.txt'],
  /** Maximum filename length to prevent buffer overflow attacks */
  maxFilenameLength: 255,
  /** 
   * Dangerous filename patterns that could indicate malicious files.
   * Includes Windows invalid chars, control characters, hidden files, and path traversal.
   */
  dangerousPatterns: [
    /[<>:"|?*]/g, // Windows invalid chars
    // eslint-disable-next-line no-control-regex
    /[\x00-\x1f\x7f]/g, // Control characters
    /^\./,            // Hidden files
    /\.\./,           // Directory traversal
  ]
};

/**
 * SecureDragDropUpload Component
 * 
 * A comprehensive file upload component with security validation, accessibility support,
 * and enhanced UX features. Designed specifically for IBKR statement processing with
 * robust error handling and user feedback.
 * 
 * @component
 * @param {SecureDragDropUploadProps} props - Component props
 * @returns {JSX.Element} The rendered upload component
 * 
 * @example
 * ```tsx
 * <SecureDragDropUpload
 *   file={selectedFile}
 *   parsing={isProcessing}
 *   error={errorMessage}
 *   onFileChange={handleFileChange}
 *   onParse={handleParse}
 *   onClear={handleClear}
 * />
 * ```
 */
const SecureDragDropUpload: React.FC<SecureDragDropUploadProps> = ({
  file,
  parsing,
  error,
  onFileChange,
  onParse,
  onClear
}) => {
  // ===== STATE MANAGEMENT =====
  /** Tracks drag over state for visual feedback */
  const [isDragOver, setIsDragOver] = useState(false);
  /** Client-side validation error (separate from server errors) */
  const [validationError, setValidationError] = useState<string | null>(null);
  /** Upload progress percentage (null when not uploading) */
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // ===== REFS =====
  /** Reference to the hidden file input element */
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Reference to progress animation interval */
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  /** Reference to upload completion timeout */
  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ===== CLEANUP EFFECT =====
  /**
   * Cleanup effect to prevent memory leaks.
   * Clears all intervals and timeouts when component unmounts.
   */
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, []);

  // ===== VALIDATION LOGIC =====
  
  /**
   * Comprehensive file validation function.
   * Performs security checks including size, type, filename, and content validation.
   * 
   * @param {File} file - The file to validate
   * @returns {ValidationResult} Validation result with status and error message
   * 
   * Security Checks:
   * 1. File size validation (prevents DoS via large files)
   * 2. Empty file detection (prevents processing errors)
   * 3. Filename length validation (prevents buffer overflow)
   * 4. Dangerous pattern detection (prevents path traversal, etc.)
   * 5. File extension validation (whitelist approach)
   * 6. MIME type validation (defense in depth)
   */
  const validateFile = useCallback((file: File): ValidationResult => {
    // Size validation
    if (file.size > SECURITY_CONFIG.maxFileSize) {
      return {
        isValid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit of ${SECURITY_CONFIG.maxFileSize / 1024 / 1024}MB`
      };
    }

    // Empty file check
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty'
      };
    }

    // Filename validation
    if (file.name.length > SECURITY_CONFIG.maxFilenameLength) {
      return {
        isValid: false,
        error: 'Filename is too long'
      };
    }

    // Check for dangerous patterns in filename
    for (const pattern of SECURITY_CONFIG.dangerousPatterns) {
      if (pattern.test(file.name)) {
        return {
          isValid: false,
          error: 'Invalid characters in filename'
        };
      }
    }

    // File extension validation
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SECURITY_CONFIG.allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File type not supported. Allowed: ${SECURITY_CONFIG.allowedExtensions.join(', ')}`
      };
    }

    // MIME type validation
    if (!SECURITY_CONFIG.allowedTypes.includes(file.type) && file.type !== '') {
      return {
        isValid: false,
        error: `Invalid file type. Expected CSV or TXT file.`
      };
    }

    return { isValid: true };
  }, []);

  // ===== FILE HANDLING =====
  
  /**
   * Handles file selection from both drag-drop and click events.
   * Performs validation and simulates upload progress for better UX.
   * 
   * @param {File} selectedFile - The file selected by the user
   * 
   * Process Flow:
   * 1. Clear existing validation errors and progress
   * 2. Cleanup any ongoing animations
   * 3. Validate file against security criteria
   * 4. Simulate upload progress for visual feedback
   * 5. Complete upload and notify parent component
   */
  const handleFileSelection = useCallback((selectedFile: File) => {
    setValidationError(null);
    setUploadProgress(null);

    // Clear any existing intervals/timeouts
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
    }

    const validation = validateFile(selectedFile);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid file');
      return;
    }

    // Simulate upload progress for UX
    setUploadProgress(0);
    let currentProgress = 0;
    
    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 95) {
        setUploadProgress(100);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      } else {
        setUploadProgress(currentProgress);
      }
    }, 100);

    // Complete the upload after a short delay
    uploadTimeoutRef.current = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setUploadProgress(null);
      onFileChange(selectedFile);
      uploadTimeoutRef.current = null;
    }, 800);
  }, [validateFile, onFileChange]);

  // ===== DRAG EVENT HANDLERS =====
  
  /**
   * Handles drag enter events for visual feedback.
   * Updates component state to show drag-over styling.
   * 
   * @param {React.DragEvent} e - The drag event
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  /**
   * Handles drag leave events with proper boundary detection.
   * Only clears drag state when actually leaving the drop zone.
   * 
   * @param {React.DragEvent} e - The drag event
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragOver to false if we're leaving the drop zone itself
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  /**
   * Handles drag over events to enable drop functionality.
   * Required to prevent default browser behavior and enable drop.
   * 
   * @param {React.DragEvent} e - The drag event
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handles file drop events with validation.
   * Processes dropped files and validates single file selection.
   * 
   * @param {React.DragEvent} e - The drop event
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    if (files.length > 1) {
      setValidationError('Please select only one file');
      return;
    }

    handleFileSelection(files[0]);
  }, [handleFileSelection]);

  // ===== INPUT HANDLERS =====
  
  /**
   * Handles manual file selection via file input click.
   * Processes files selected through the file dialog.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  /**
   * Clears the current file selection and resets component state.
   * Stops any ongoing animations and notifies parent component.
   */
  const handleClearFile = useCallback(() => {
    // Clear any ongoing progress
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
      uploadTimeoutRef.current = null;
    }
    
    setValidationError(null);
    setUploadProgress(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClear) {
      onClear();
    }
  }, [onFileChange, onClear]);

  /**
   * Opens the file dialog programmatically.
   * Triggered by click or keyboard interaction on the drop zone.
   */
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ===== UI STATE HELPERS =====
  
  /** Computed state: whether a file is currently selected */
  const hasFile = file !== null;
  /** Computed state: whether there are any errors to display */
  const hasError = error || validationError;
  /** Computed state: whether any processing is occurring */
  const isProcessing = parsing || uploadProgress !== null;

  /**
   * Generates dynamic CSS classes for the drop zone based on current state.
   * Provides visual feedback for different interaction states.
   * 
   * @returns {string} CSS class string for the drop zone
   */
  const getDropZoneClassName = () => {
    const baseClasses = "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer";
    
    if (hasError) {
      return `${baseClasses} border-red-300 bg-red-50 hover:border-red-400`;
    }
    
    if (hasFile && !isProcessing) {
      return `${baseClasses} border-green-300 bg-green-50 hover:border-green-400`;
    }
    
    if (isDragOver) {
      return `${baseClasses} border-blue-400 bg-blue-50 scale-105`;
    }
    
    if (isProcessing) {
      return `${baseClasses} border-blue-300 bg-blue-50`;
    }
    
    return `${baseClasses} border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100`;
  };

  /**
   * Formats file size in human-readable format.
   * Converts bytes to appropriate units (Bytes, KB, MB).
   * 
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size string
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={SECURITY_CONFIG.allowedExtensions.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Upload IBKR statement file"
      />

      {/* Drop zone */}
      <div
        className={getDropZoneClassName()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        role="button"
        tabIndex={0}
        aria-label="Upload area for IBKR statement files"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFileDialog();
          }
        }}
      >
        {/* Progress overlay */}
        {uploadProgress !== null && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2">
                <svg className="animate-spin w-16 h-16 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                </svg>
              </div>
              <p className="text-sm font-medium text-blue-600">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="space-y-4">
          {/* Icon */}
          <div className="mx-auto w-16 h-16">
            {hasError ? (
              <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />
            ) : hasFile ? (
              <CheckCircleIcon className="w-16 h-16 text-green-500" />
            ) : (
              <CloudArrowUpIcon className="w-16 h-16 text-gray-400" />
            )}
          </div>

          {/* Text content */}
          <div>
            {hasFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <DocumentIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                    {file.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)} • Ready to parse
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {isDragOver ? 'Drop your file here' : 'Upload IBKR Statement'}
                </h3>
                <p className="text-sm text-gray-500 mb-1">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Supported: CSV, TXT • Max size: {SECURITY_CONFIG.maxFileSize / 1024 / 1024}MB
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File actions */}
      {hasFile && !isProcessing && (
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onParse();
            }}
            disabled={parsing}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            {parsing ? 'Parsing...' : 'Parse Statement'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClearFile();
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <XMarkIcon className="w-4 h-4" />
            <span>Remove</span>
          </button>
        </div>
      )}

      {/* Error display */}
      {hasError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Upload Error</h4>
              <p className="text-sm text-red-700 mt-1">
                {validationError || error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security notice */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Secure Upload</h4>
            <p className="text-xs text-blue-700 mt-1">
              Files are processed locally and not stored on our servers. Your data remains private.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureDragDropUpload; 
 
 
 