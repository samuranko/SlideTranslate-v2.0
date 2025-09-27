import React from 'react';
import { DocxData, DocxPartContent } from '../types';
import { EditableText } from './EditableText';

interface DocxPreviewProps {
  data: DocxData;
  onUpdate: (updatedData: DocxData) => void;
}

const PartPreview: React.FC<{ 
    part: DocxPartContent; 
    onUpdate: (updatedTexts: {original: string, translated: string}[]) => void;
    title: string;
}> = ({ part, onUpdate, title }) => {

    const handleTextChange = (index: number, newText: string) => {
        const updatedTexts = [...part.texts];
        updatedTexts[index] = { ...updatedTexts[index], translated: newText };
        onUpdate(updatedTexts);
    };

    if (!part || part.texts.length === 0) return null;
    
    return (
        <div className="mt-6 pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2 border-b pb-1 text-slate-700">{title}</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {part.texts.map((pair, index) => (
                <React.Fragment key={index}>
                    <div className="p-2 bg-gray-100 rounded-md min-h-[2.5rem] whitespace-pre-wrap break-words">
                    {pair.original}
                    </div>
                    <div>
                    <EditableText
                        initialValue={pair.translated}
                        onSave={(newValue) => handleTextChange(index, newValue)}
                        textarea={pair.original.includes('\n') || pair.original.length > 80}
                    />
                    </div>
                </React.Fragment>
                ))}
            </div>
        </div>
    );
}

export const DocxPreview: React.FC<DocxPreviewProps> = ({ data, onUpdate }) => {

    const handlePartUpdate = (partType: keyof DocxData, partIndex: number | null, updatedTexts: any) => {
        const updatedData = JSON.parse(JSON.stringify(data));
        if (partType === 'body') {
            updatedData.body.texts = updatedTexts;
        } else if (partType === 'headers' && partIndex !== null) {
            updatedData.headers[partIndex].texts = updatedTexts;
        } else if (partType === 'footers' && partIndex !== null) {
            updatedData.footers[partIndex].texts = updatedTexts;
        } else if (partType === 'comments') {
            updatedData.comments.texts = updatedTexts;
        }
        onUpdate(updatedData);
    };

    const hasContent = data.body.texts.length > 0 || data.headers.length > 0 || data.footers.length > 0 || data.comments;

  return (
    <div className="h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-x-6">
        <h3 className="text-lg font-semibold mb-2 border-b pb-1 sticky top-0 bg-white z-10 p-2 -ml-2">Original Text</h3>
        <h3 className="text-lg font-semibold mb-2 border-b pb-1 sticky top-0 bg-white z-10 p-2 -ml-2">Translated Text (Editable)</h3>
      </div>
      
      <PartPreview 
        part={data.body} 
        onUpdate={(texts) => handlePartUpdate('body', null, texts)}
        title="Document Body"
      />
      
      {data.headers.map((header, index) => (
          <PartPreview 
            key={header.fileName}
            part={header}
            onUpdate={(texts) => handlePartUpdate('headers', index, texts)}
            title={`Header (${header.fileName.split('/').pop()})`}
          />
      ))}

      {data.footers.map((footer, index) => (
          <PartPreview 
            key={footer.fileName}
            part={footer}
            onUpdate={(texts) => handlePartUpdate('footers', index, texts)}
            title={`Footer (${footer.fileName.split('/').pop()})`}
          />
      ))}

      {data.comments && (
          <PartPreview 
            part={data.comments}
            onUpdate={(texts) => handlePartUpdate('comments', null, texts)}
            title="Comments"
          />
      )}

      {!hasContent && (
        <p className="col-span-2 text-center text-gray-500 mt-4">No content to display.</p>
      )}
    </div>
  );
};