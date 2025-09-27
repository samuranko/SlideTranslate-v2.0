import React, { useState, FormEvent } from 'react';
import { GlossaryTerm } from '../types';
import { XIcon, Trash2Icon, BookOpenIcon } from './icons';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  glossary: GlossaryTerm[];
  onAddTerm: (term: GlossaryTerm) => void;
  onDeleteTerm: (index: number) => void;
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose, glossary, onAddTerm, onDeleteTerm }) => {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (source.trim() && target.trim()) {
      onAddTerm({ source: source.trim(), target: target.trim() });
      setSource('');
      setTarget('');
    }
  };

  const handleDeleteWithConfirm = (term: GlossaryTerm, index: number) => {
    if (window.confirm(`Are you sure you want to delete the term "${term.source}"? This action cannot be undone.`)) {
      onDeleteTerm(index);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg m-4 transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">Custom Glossary</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors" aria-label="Close modal">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="w-full">
              <label htmlFor="source-term" className="sr-only">Source Term</label>
              <input
                id="source-term"
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Source Term (e.g., Q1)"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                required
              />
            </div>
            <div className="w-full">
              <label htmlFor="target-term" className="sr-only">Target Term</label>
              <input
                id="target-term"
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Target Term (e.g., Trimestre 1)"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto flex-shrink-0 transition-colors"
            >
              Add
            </button>
          </form>

          <div className="max-h-60 overflow-y-auto pr-2 border rounded-md">
            {glossary.length === 0 ? (
              <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                <BookOpenIcon className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="font-semibold text-gray-700">Your glossary is empty</h3>
                <p className="text-sm">Add custom terms above to ensure translation consistency.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {glossary.map((term, index) => (
                  <li key={index} className="flex items-center justify-between p-3 transition-colors duration-150 hover:bg-gray-50">
                    <div>
                      <span className="font-medium text-gray-800">{term.source}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className="font-medium text-indigo-600">{term.target}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteWithConfirm(term, index)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                      aria-label={`Delete term ${term.source}`}
                    >
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t text-right rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};