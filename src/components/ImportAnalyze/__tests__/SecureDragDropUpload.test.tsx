import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SecureDragDropUpload from '../SecureDragDropUpload';

// Mock the icons from Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  CloudArrowUpIcon: ({ className }: { className: string }) => <div data-testid="cloud-icon" className={className} />,
  DocumentIcon: ({ className }: { className: string }) => <div data-testid="document-icon" className={className} />,
  ExclamationTriangleIcon: ({ className }: { className: string }) => <div data-testid="error-icon" className={className} />,
  CheckCircleIcon: ({ className }: { className: string }) => <div data-testid="success-icon" className={className} />,
  XMarkIcon: ({ className }: { className: string }) => <div data-testid="x-icon" className={className} />
}));

// Helper to create mock files
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Helper to create drag event
const createDragEvent = (type: string, files: File[] = []) => {
  const event = new Event(type, { bubbles: true }) as any;
  event.dataTransfer = {
    files,
    items: files.map(file => ({ kind: 'file', type: file.type })),
    types: ['Files']
  };
  return event;
};

describe('SecureDragDropUpload', () => {
  const defaultProps = {
    file: null,
    parsing: false,
    error: null,
    onFileChange: jest.fn(),
    onParse: jest.fn(),
    onClear: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial Render', () => {
    it('renders upload zone with correct initial state', () => {
      render(<SecureDragDropUpload {...defaultProps} />);
      
      expect(screen.getByText('Upload IBKR Statement')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop your file here, or click to browse')).toBeInTheDocument();
      expect(screen.getByTestId('cloud-icon')).toBeInTheDocument();
      expect(screen.getByText(/Supported: CSV, TXT/)).toBeInTheDocument();
    });

    it('has proper accessibility attributes', () => {
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const uploadArea = screen.getByRole('button');
      expect(uploadArea).toHaveAttribute('aria-label', 'Upload area for IBKR statement files');
      expect(uploadArea).toHaveAttribute('tabIndex', '0');
      
      const fileInput = screen.getByLabelText('Upload IBKR statement file');
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', '.csv,.txt');
    });

    it('shows security notice', () => {
      render(<SecureDragDropUpload {...defaultProps} />);
      
      expect(screen.getByText('Secure Upload')).toBeInTheDocument();
      expect(screen.getByText(/Files are processed locally/)).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('accepts valid CSV file', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const validFile = createMockFile('statement.csv', 1024, 'text/csv');
      const fileInput = screen.getByLabelText('Upload IBKR statement file');
      
      await user.upload(fileInput, validFile);
      jest.advanceTimersByTime(1000);
      
      expect(defaultProps.onFileChange).toHaveBeenCalledWith(validFile);
    });

    it('accepts valid TXT file', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const validFile = createMockFile('statement.txt', 1024, 'text/plain');
      const fileInput = screen.getByLabelText('Upload IBKR statement file');
      
      await user.upload(fileInput, validFile);
      jest.advanceTimersByTime(1000);
      
      expect(defaultProps.onFileChange).toHaveBeenCalledWith(validFile);
    });

    it('rejects file that is too large', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const largeFile = createMockFile('large.csv', 11 * 1024 * 1024, 'text/csv'); // 11MB
      const fileInput = screen.getByLabelText('Upload IBKR statement file');
      
      await user.upload(fileInput, largeFile);
      
      expect(screen.getByText('Upload Error')).toBeInTheDocument();
      expect(screen.getByText(/File size.*exceeds limit/)).toBeInTheDocument();
      expect(defaultProps.onFileChange).not.toHaveBeenCalled();
    });

    it('rejects empty file', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const emptyFile = createMockFile('empty.csv', 0, 'text/csv');
      const fileInput = screen.getByLabelText('Upload IBKR statement file');
      
      await user.upload(fileInput, emptyFile);
      
      expect(screen.getByText('File is empty')).toBeInTheDocument();
      expect(defaultProps.onFileChange).not.toHaveBeenCalled();
    });

    it('rejects unsupported file type', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const unsupportedFile = createMockFile('document.pdf', 1024, 'application/pdf');
      const fileInput = screen.getByLabelText('Upload IBKR statement file');
      
      await user.upload(fileInput, unsupportedFile);
      
      expect(screen.getByText(/File type not supported/)).toBeInTheDocument();
      expect(defaultProps.onFileChange).not.toHaveBeenCalled();
    });

    it('rejects file with dangerous filename characters', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const dangerousFile = createMockFile('file<script>.csv', 1024, 'text/csv');
      const fileInput = screen.getByLabelText('Upload IBKR statement file');
      
      await user.upload(fileInput, dangerousFile);
      
      expect(screen.getByText('Invalid characters in filename')).toBeInTheDocument();
      expect(defaultProps.onFileChange).not.toHaveBeenCalled();
    });

    it('rejects hidden files', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const hiddenFile = createMockFile('.hidden.csv', 1024, 'text/csv');
      const fileInput = screen.getByLabelText('Upload IBKR statement file');
      
      await user.upload(fileInput, hiddenFile);
      
      expect(screen.getByText('Invalid characters in filename')).toBeInTheDocument();
      expect(defaultProps.onFileChange).not.toHaveBeenCalled();
    });

    it('rejects file with directory traversal attempt', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const maliciousFile = createMockFile('../../../etc/passwd.csv', 1024, 'text/csv');
      const fileInput = screen.getByLabelText('Upload IBKR statement file');
      
      await user.upload(fileInput, maliciousFile);
      
      expect(screen.getByText('Invalid characters in filename')).toBeInTheDocument();
      expect(defaultProps.onFileChange).not.toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag enter correctly', () => {
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const dropZone = screen.getByRole('button');
      const dragEvent = createDragEvent('dragenter');
      
      fireEvent(dropZone, dragEvent);
      
      expect(screen.getByText('Drop your file here')).toBeInTheDocument();
    });

    it('handles drag leave correctly', () => {
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const dropZone = screen.getByRole('button');
      
      // Enter drag state
      fireEvent(dropZone, createDragEvent('dragenter'));
      expect(screen.getByText('Drop your file here')).toBeInTheDocument();
      
      // Leave drag state
      const dragLeaveEvent = createDragEvent('dragleave');
      Object.defineProperty(dragLeaveEvent, 'relatedTarget', { value: null });
      fireEvent(dropZone, dragLeaveEvent);
      
      expect(screen.getByText('Upload IBKR Statement')).toBeInTheDocument();
    });

    it('handles valid file drop', async () => {
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const dropZone = screen.getByRole('button');
      const validFile = createMockFile('statement.csv', 1024, 'text/csv');
      const dropEvent = createDragEvent('drop', [validFile]);
      
      fireEvent(dropZone, dropEvent);
      jest.advanceTimersByTime(1000);
      
      expect(defaultProps.onFileChange).toHaveBeenCalledWith(validFile);
    });

    it('handles multiple files drop (should reject)', () => {
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const dropZone = screen.getByRole('button');
      const file1 = createMockFile('file1.csv', 1024, 'text/csv');
      const file2 = createMockFile('file2.csv', 1024, 'text/csv');
      const dropEvent = createDragEvent('drop', [file1, file2]);
      
      fireEvent(dropZone, dropEvent);
      
      expect(screen.getByText('Please select only one file')).toBeInTheDocument();
      expect(defaultProps.onFileChange).not.toHaveBeenCalled();
    });
  });

  describe('File Display and Actions', () => {
    it('displays selected file information', () => {
      const selectedFile = createMockFile('statement.csv', 2048, 'text/csv');
      render(<SecureDragDropUpload {...defaultProps} file={selectedFile} />);
      
      expect(screen.getByText('statement.csv')).toBeInTheDocument();
      expect(screen.getByText(/2.00 KB/)).toBeInTheDocument();
      expect(screen.getByText('Ready to parse')).toBeInTheDocument();
      expect(screen.getByTestId('success-icon')).toBeInTheDocument();
      expect(screen.getByTestId('document-icon')).toBeInTheDocument();
    });

    it('shows parse and remove buttons when file is selected', () => {
      const selectedFile = createMockFile('statement.csv', 1024, 'text/csv');
      render(<SecureDragDropUpload {...defaultProps} file={selectedFile} />);
      
      expect(screen.getByText('Parse Statement')).toBeInTheDocument();
      expect(screen.getByText('Remove')).toBeInTheDocument();
    });

    it('calls onParse when parse button is clicked', async () => {
      const user = userEvent.setup();
      const selectedFile = createMockFile('statement.csv', 1024, 'text/csv');
      render(<SecureDragDropUpload {...defaultProps} file={selectedFile} />);
      
      const parseButton = screen.getByText('Parse Statement');
      await user.click(parseButton);
      
      expect(defaultProps.onParse).toHaveBeenCalled();
    });

    it('calls onFileChange with null when remove button is clicked', async () => {
      const user = userEvent.setup();
      const selectedFile = createMockFile('statement.csv', 1024, 'text/csv');
      render(<SecureDragDropUpload {...defaultProps} file={selectedFile} />);
      
      const removeButton = screen.getByText('Remove');
      await user.click(removeButton);
      
      expect(defaultProps.onFileChange).toHaveBeenCalledWith(null);
    });

    it('disables parse button when parsing', () => {
      const selectedFile = createMockFile('statement.csv', 1024, 'text/csv');
      render(<SecureDragDropUpload {...defaultProps} file={selectedFile} parsing={true} />);
      
      const parseButton = screen.getByText('Parsing...');
      expect(parseButton).toBeDisabled();
    });
  });

  describe('Progress and Loading States', () => {
    it('shows upload progress overlay', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const validFile = createMockFile('statement.csv', 1024, 'text/csv');
      const fileInput = screen.getByLabelText('Upload IBKR statement file');
      
      await user.upload(fileInput, validFile);
      
      // Should show progress during upload simulation
      expect(screen.getByText(/Uploading\.\.\./)).toBeInTheDocument();
      
      // Fast forward through progress simulation
      jest.advanceTimersByTime(1000);
      
      // Progress should be complete
      expect(defaultProps.onFileChange).toHaveBeenCalledWith(validFile);
    });
  });

  describe('Error Handling', () => {
    it('displays external error', () => {
      render(<SecureDragDropUpload {...defaultProps} error="Failed to parse file" />);
      
      expect(screen.getByText('Upload Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to parse file')).toBeInTheDocument();
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    it('clears validation error when valid file is selected', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SecureDragDropUpload {...defaultProps} />);
      
      // First upload invalid file
      const invalidFile = createMockFile('document.pdf', 1024, 'application/pdf');
      const fileInput = screen.getByLabelText('Upload IBKR statement file');
      
      await user.upload(fileInput, invalidFile);
      expect(screen.getByText(/File type not supported/)).toBeInTheDocument();
      
      // Then upload valid file
      const validFile = createMockFile('statement.csv', 1024, 'text/csv');
      await user.upload(fileInput, validFile);
      jest.advanceTimersByTime(1000);
      
      // Error should be cleared
      expect(screen.queryByText(/File type not supported/)).not.toBeInTheDocument();
      expect(defaultProps.onFileChange).toHaveBeenCalledWith(validFile);
    });
  });

  describe('Keyboard Accessibility', () => {
    it('handles Enter key to open file dialog', async () => {
      const user = userEvent.setup();
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const dropZone = screen.getByRole('button');
      
      // Focus and press Enter
      dropZone.focus();
      await user.keyboard('[Enter]');
      
      // This would normally open file dialog, but we can't test that in jsdom
      // We can verify the dropZone received focus and key event was processed
      expect(dropZone).toHaveFocus();
    });

    it('handles Space key to open file dialog', async () => {
      const user = userEvent.setup();
      render(<SecureDragDropUpload {...defaultProps} />);
      
      const dropZone = screen.getByRole('button');
      
      // Focus and press Space
      dropZone.focus();
      await user.keyboard('[Space]');
      
      expect(dropZone).toHaveFocus();
    });
  });

  describe('File Size Formatting', () => {
    it('formats file sizes correctly', () => {
      const testCases = [
        { file: createMockFile('test.csv', 0, 'text/csv'), expected: '0 Bytes' },
        { file: createMockFile('test.csv', 1024, 'text/csv'), expected: '1.00 KB' },
        { file: createMockFile('test.csv', 1048576, 'text/csv'), expected: '1.00 MB' },
        { file: createMockFile('test.csv', 2560, 'text/csv'), expected: '2.50 KB' }
      ];

      testCases.forEach(({ file, expected }) => {
        const { rerender } = render(<SecureDragDropUpload {...defaultProps} file={file} />);
        expect(screen.getByText(new RegExp(expected))).toBeInTheDocument();
        rerender(<SecureDragDropUpload {...defaultProps} file={null} />);
      });
    });
  });
}); 
 
 
 