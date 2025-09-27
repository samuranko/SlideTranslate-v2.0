import React, { useState } from 'react';
import { FileType, SlideData, DocxData, XlsxData, GlossaryTerm } from '../types';
import { PptxPreview } from './PptxPreview';
import { DocxPreview } from './DocxPreview';
import { XlsxPreview } from './XlsxPreview';
import { DownloadIcon, RefreshCwIcon, BookOpenIcon, AlertCircleIcon } from './icons';
import { GlossaryModal } from './GlossaryModal';

interface ResultsViewProps {
  fileType: FileType;
  fileName: string;
  pptxData: SlideData[] | null;
  docxData: DocxData | null;
  xlsxData: XlsxData | null;
  glossary: GlossaryTerm[];
  onUpdatePptx: (data: SlideData[]) => void;
  onUpdateDocx: (data: DocxData) => void;
  onUpdateXlsx: (data: XlsxData) => void;
  onDownload: () => void;
  onReset: () => void;
  onUpdateGlossary: (glossary: GlossaryTerm[]) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  fileType,
  fileName,
  pptxData,
  docxData,
  xlsxData,
  glossary,
  onUpdatePptx,
  onUpdateDocx,
  onUpdateXlsx,
  onDownload,
  onReset,
  onUpdateGlossary,
}) => {
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  const handleAddTerm = (term: GlossaryTerm) => {
    onUpdateGlossary([...glossary, term]);
  };

  const handleDeleteTerm = (index: number) => {
    onUpdateGlossary(glossary.filter((_, i) => i !== index));
  };

  const renderPreview = () => {
    switch (fileType) {
      case 'pptx':
        return pptxData ? <PptxPreview slides={pptxData} onUpdate={onUpdatePptx} /> : <div className="text-center p-8">No PowerPoint data available.</div>;
      case 'docx':
        return docxData ? <DocxPreview data={docxData} onUpdate={onUpdateDocx} /> : <div className="text-center p-8">No Word document data available.</div>;
      case 'xlsx':
        return xlsxData ? <XlsxPreview data={xlsxData} onUpdate={onUpdateXlsx} /> : <div className="text-center p-8">No Excel data available.</div>;
      default:
        return (
            <div className="text-center p-8 text-red-600 flex items-center justify-center gap-2">
                <AlertCircleIcon className="w-6 h-6"/>
                <p>Unsupported file type for preview.</p>
            </div>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800">Translation Results</h2>
          <p className="text-slate-600 truncate">File: <span className="font-medium">{fileName}</span></p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={() => setIsGlossaryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <BookOpenIcon className="w-5 h-5" />
            Glossary ({glossary.length})
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <RefreshCwIcon className="w-5 h-5" />
            New Translation
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <DownloadIcon className="w-5 h-5" />
            Download
          </button>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border">
        {renderPreview()}
      </div>

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        glossary={glossary}
        onAddTerm={handleAddTerm}
        onDeleteTerm={handleDeleteTerm}
      />
    </div>
  );
};
