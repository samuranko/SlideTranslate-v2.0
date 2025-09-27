import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloudIcon } from './icons';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE, SUPPORTED_LANGUAGES } from '../constants';
import { FileType } from '../types';

interface FileUploadProps {
  onFileUpload: (file: File, fileType: FileType) => void;
  disabled: boolean;
  targetLanguage: string;
  onLanguageChange: (languageCode: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled, targetLanguage, onLanguageChange }) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);
    if (disabled) return;

    if (fileRejections.length > 0) {
      const firstRejection = fileRejections[0];
      if (firstRejection.errors[0].code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      } else if (firstRejection.errors[0].code === 'file-invalid-type') {
        setError('Invalid file type. Please upload a .pptx, .docx, or .xlsx file.');
      } else {
        setError(firstRejection.errors[0].message);
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const fileType = SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES] as FileType;
      if (fileType) {
        onFileUpload(file, fileType);
      } else {
        // This case should ideally be caught by accept property, but as a fallback.
        setError('Unsupported file type.');
      }
    }
  }, [onFileUpload, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: disabled,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <label htmlFor="language-select" className="block text-sm font-medium text-slate-700 mb-2">Translate to:</label>
        <select
          id="language-select"
          value={targetLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      <div
        {...getRootProps()}
        className={`relative block w-full border-2 ${isDragActive ? 'border-indigo-600' : 'border-dashed border-gray-300'} rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors cursor-pointer ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
      >
        <input {...getInputProps()} />
        <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
        <span className="mt-2 block text-sm font-semibold text-gray-900">
          {isDragActive ? 'Drop the file here...' : 'Drag & drop a file here, or click to select'}
        </span>
        <span className="mt-1 block text-xs text-gray-500">.pptx, .docx, .xlsx up to {MAX_FILE_SIZE / 1024 / 1024}MB</span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};