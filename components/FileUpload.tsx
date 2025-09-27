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
        <label htmlFor="target-language" className="block text-sm font-medium text-gray-700 mb-1 text-left">
          Translate To
        </label>
        <select
          id="target-language"
          name="target-language"
          value={targetLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          disabled={disabled}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-800 text-white border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm rounded-md shadow-sm"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'}
          ${isDragActive ? 'border-indigo-600 bg-indigo-100' : ''}`}
      >
        <input {...getInputProps()} />
        <UploadCloudIcon className={`w-16 h-16 mb-4 ${isDragActive ? 'text-indigo-600' : 'text-gray-400'}`} />
        {isDragActive ? (
          <p className="text-lg font-semibold text-indigo-700">Drop the file here ...</p>
        ) : (
          <>
            <p className="text-lg font-semibold text-gray-700">Drag & drop your file here, or click to select</p>
            <p className="text-sm text-gray-500">Supported formats: .pptx, .docx, .xlsx (Max ${MAX_FILE_SIZE / 1024 / 1024}MB)</p>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
};