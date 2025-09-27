import React, { useState } from 'react';
import { SlideData } from '../types';
import { EditableText } from './EditableText';
import { LayersIcon } from './icons';

interface PptxPreviewProps {
  slides: SlideData[];
  onUpdate: (updatedSlides: SlideData[]) => void;
}

export const PptxPreview: React.FC<PptxPreviewProps> = ({ slides, onUpdate }) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const handleTextChange = (textIndex: number, newText: string) => {
    const updatedSlides = JSON.parse(JSON.stringify(slides));
    updatedSlides[activeSlideIndex].texts[textIndex].translated = newText;
    onUpdate(updatedSlides);
  };

  const handleNoteChange = (noteIndex: number, newText: string) => {
    const updatedSlides = JSON.parse(JSON.stringify(slides));
    updatedSlides[activeSlideIndex].notes[noteIndex].translated = newText;
    onUpdate(updatedSlides);
  };

  if (!slides || slides.length === 0) {
    return <p className="text-center text-gray-500">No content to display.</p>;
  }

  const currentSlide = slides[activeSlideIndex];

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[70vh]">
      <aside className="md:w-1/4 lg:w-1/5 overflow-y-auto border-r pr-3">
        <h3 className="text-lg font-semibold mb-2 sticky top-0 bg-white z-10 p-2 border-b -ml-2">Slides</h3>
        <ul className="space-y-1">
          {slides.map((slide, index) => (
            <li key={slide.slideNumber}>
              <button
                onClick={() => setActiveSlideIndex(index)}
                className={`w-full text-left p-2 rounded-md transition-colors text-sm ${
                  activeSlideIndex === index ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'hover:bg-gray-100'
                }`}
              >
                Slide {slide.slideNumber}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      
      <main className="flex-1 overflow-y-auto">
        {currentSlide ? (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><LayersIcon className="w-6 h-6" /> Slide {currentSlide.slideNumber} Content</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 border-b pb-1">Slide Text</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-1">Original</h4>
                    <div className="space-y-2">
                      {currentSlide.texts.map((text, i) => (
                        <div key={i} className="p-2 bg-gray-100 rounded-md min-h-[2.5rem] whitespace-pre-wrap break-words">{text.original}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-1">Translated (Editable)</h4>
                    <div className="space-y-2">
                      {currentSlide.texts.map((text, i) => (
                        <EditableText
                          key={i}
                          initialValue={text.translated}
                          onSave={(newValue) => handleTextChange(i, newValue)}
                          textarea={text.original.includes('\n') || text.original.length > 80}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {currentSlide.notes.length > 0 && (
                <div className="mt-8 pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2 border-b pb-1">Slide Notes</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-600 mb-1">Original</h4>
                      <div className="space-y-2">
                        {currentSlide.notes.map((note, i) => (
                          <div key={i} className="p-2 bg-gray-100 rounded-md min-h-[2.5rem] whitespace-pre-wrap break-words">{note.original}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-600 mb-1">Translated (Editable)</h4>
                      <div className="space-y-2">
                        {currentSlide.notes.map((note, i) => (
                          <EditableText
                            key={i}
                            initialValue={note.translated}
                            onSave={(newValue) => handleNoteChange(i, newValue)}
                            textarea
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">Select a slide to view its content.</p>
        )}
      </main>
    </div>
  );
};
