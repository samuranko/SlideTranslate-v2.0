import React, { useState } from 'react';
import { XlsxData } from '../types';
import { EditableText } from './EditableText';

interface XlsxPreviewProps {
  data: XlsxData;
  onUpdate: (updatedData: XlsxData) => void;
}

export const XlsxPreview: React.FC<XlsxPreviewProps> = ({ data, onUpdate }) => {
  const [activeSheet, setActiveSheet] = useState(0);

  const handleTextChange = (sheetIndex: number, rowIndex: number, cellIndex: number, newText: string) => {
    const updatedData = JSON.parse(JSON.stringify(data));
    updatedData.sheets[sheetIndex].rows[rowIndex].cells[cellIndex].translated = newText;
    onUpdate(updatedData);
  };

  const currentSheet = data.sheets[activeSheet];

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {data.sheets.map((sheet, index) => (
            <button
              key={sheet.sheetName}
              onClick={() => setActiveSheet(index)}
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
                ${activeSheet === index
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
              }
            >
              {sheet.sheetName}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-auto mt-4">
        <table className="min-w-full border-collapse border border-gray-300">
          <tbody>
            {currentSheet.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="divide-x divide-gray-200">
                {row.cells.map((cell, cellIndex) => (
                  <td key={cellIndex} className="p-1 text-sm align-top border border-gray-200">
                    <div className="p-1 bg-gray-50 rounded-sm text-xs break-words text-gray-600">
                        {cell.original}
                    </div>
                    {(cell.original && isNaN(Number(cell.original))) ? (
                        <EditableText
                            initialValue={cell.translated}
                            onSave={(newValue) => handleTextChange(activeSheet, rowIndex, cellIndex, newValue)}
                            className="text-sm"
                        />
                    ) : (
                        <div className="p-1 text-sm break-words min-h-[2.5rem]">{cell.translated}</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
