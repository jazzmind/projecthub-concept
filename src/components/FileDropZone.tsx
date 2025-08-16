'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onUploadProgress?: (progress: number) => void;
  disabled?: boolean;
  className?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  uploadedCount: number;
  totalCount: number;
  currentFile?: string;
}

export default function FileDropZone({ 
  onFilesSelected, 
  onUploadProgress,
  disabled = false,
  className = ""
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    uploadedCount: 0,
    totalCount: 0
  });
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): string | null => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    // Also check file extension as fallback
    const validExtensions = ['.pdf', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      return `File type not supported: ${file.name}. Please upload PDF or DOCX documents only.`;
    }
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return `File too large: ${file.name}. Maximum size is 50MB.`;
    }
    
    return null;
  };

  const processFiles = async (files: FileList | File[]) => {
    if (disabled || !user) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate all files first
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    // Show validation errors
    if (errors.length > 0) {
      alert(`Upload errors:\n${errors.join('\n')}`);
    }

    // Process valid files
    if (validFiles.length > 0) {
      setUploadState({
        isUploading: true,
        progress: 0,
        uploadedCount: 0,
        totalCount: validFiles.length,
        currentFile: validFiles[0]?.name
      });

      try {
        await uploadFiles(validFiles);
        onFilesSelected(validFiles);
      } catch (error) {
        console.error('Upload failed:', error);
        alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setUploadState({
          isUploading: false,
          progress: 0,
          uploadedCount: 0,
          totalCount: 0
        });
      }
    }
  };

  const uploadFiles = async (files: File[]) => {
    const organizationId = user?.currentContext.organizationId || 'default-org';
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadState(prev => ({
        ...prev,
        currentFile: file.name,
        uploadedCount: i,
        progress: (i / files.length) * 50 // Reserve 50% for each file's processing
      }));

      // Convert file to buffer for API call
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Use streaming endpoint for real-time progress
      const response = await fetch('/api/projects/extract-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBuffer: Array.from(buffer), // Convert buffer to array for JSON serialization
          originalFilename: file.name,
          organizationId: organizationId,
          quality: quality,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to process ${file.name}: ${error}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          
          if (value) {
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'progress') {
                    // Update progress for current file
                    const fileProgress = (i / files.length) * 100 + (data.progress / files.length);
                    setUploadState(prev => ({
                      ...prev,
                      progress: fileProgress,
                      currentFile: `${file.name} - ${data.stage}`
                    }));
                    onUploadProgress?.(fileProgress);
                  } else if (data.type === 'error') {
                    throw new Error(`Failed to process ${file.name}: ${data.error}`);
                  } else if (data.type === 'success') {
                    // File processed successfully
                    console.log(`Successfully processed ${file.name}:`, data.project);
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming response:', parseError);
                }
              }
            }
          }
        }
      }

      // Update progress for completed file
      const progress = ((i + 1) / files.length) * 100;
      setUploadState(prev => ({
        ...prev,
        uploadedCount: i + 1,
        progress
      }));
      onUploadProgress?.(progress);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFiles(files);
    }
  }, [disabled, user]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
    // Clear input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger file selection if clicking on the quality selector
    if ((e.target as HTMLElement).closest('.quality-selector')) {
      return;
    }
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (uploadState.isUploading) {
    return (
      <div className={`border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 ${className}`}>
        <div className="space-y-4">
          <div className="text-lg font-medium text-blue-600 dark:text-blue-400">
            Processing Documents with AI...
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {uploadState.currentFile && (
              <div>Processing: {uploadState.currentFile}</div>
            )}
            <div>
              {uploadState.uploadedCount} of {uploadState.totalCount} files completed
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Analyzing content and generating projects...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }
        `}
      >
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400 dark:text-gray-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Drop project documents here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              or click to browse files
            </p>
          </div>
          
          {/* Quality Selector */}
          <div className="quality-selector flex items-center justify-center gap-3 py-3 border-t border-gray-200 dark:border-gray-600">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Processing Quality:
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled || uploadState.isUploading}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="low">Fast (Basic extraction)</option>
              <option value="medium">Balanced (Recommended)</option>
              <option value="high">Detailed (Thorough analysis)</option>
            </select>
          </div>
          
          <div className="text-xs text-gray-400 dark:text-gray-500">
            <div>Supported formats: PDF, Word (.docx)</div>
            <div>Maximum file size: 50MB per file</div>
            <div className="mt-2 font-medium text-blue-600 dark:text-blue-400">
              ✨ AI will automatically extract project details and generate images
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
