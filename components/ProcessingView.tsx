
import React from 'react';

interface ProcessingViewProps {
  progress: number;
  message: string;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({ progress, message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Processing Your Presentation...</h2>
      <p className="text-slate-600 mb-8 max-w-md text-center">{message}</p>
      <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
        <div 
          className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-lg font-semibold text-indigo-600 mt-4">{progress}%</p>
    </div>
  );
};
