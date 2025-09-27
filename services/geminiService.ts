import { GoogleGenAI, Type } from "@google/genai";
import { GlossaryTerm, SlideData, DocxData, XlsxData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getTranslationPrompt = (texts: string[], targetLanguage: string, glossary: GlossaryTerm[], fileType: string): string => {
  const glossaryPrompt = glossary.length > 0
    ? `
Use the following glossary for consistent translation. Do not translate the glossary terms themselves, but use the target term where the source term appears.
Glossary:
${glossary.map(term => `- ${term.source}: ${term.target}`).join('\n')}
`
    : '';

  const formatInstruction = `
Respond with a JSON array of strings, where each string is a translation of the corresponding input text.
The JSON array should have exactly ${texts.length} elements.
For example, if the input is ["Hello", "World"], the output should be ["Hola", "Mundo"].
Do not include any other text or explanations in your response. Only the JSON array.
`;

  return `
Translate the following texts from English to ${targetLanguage}.
This text is from a ${fileType} document. Maintain the original tone and formatting cues (like line breaks) as much as possible.
${glossaryPrompt}
${formatInstruction}

Texts to translate:
${JSON.stringify(texts)}
`;
};


export const translatePresentation = async (
  slides: SlideData[],
  targetLanguage: string,
  glossary: GlossaryTerm[],
  onProgress: (progress: number) => void
): Promise<SlideData[]> => {
  const translatedSlides: SlideData[] = JSON.parse(JSON.stringify(slides));
  const totalItems = translatedSlides.reduce((sum, slide) => sum + (slide.texts.length > 0 ? 1 : 0) + (slide.notes.length > 0 ? 1 : 0), 0);
  if (totalItems === 0) {
    onProgress(100);
    return translatedSlides;
  }
  let processedItems = 0;

  for (const slide of translatedSlides) {
    if (slide.texts.length > 0) {
      const originalTexts = slide.texts.map(t => t.original);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: getTranslationPrompt(originalTexts, targetLanguage, glossary, 'presentation'),
        config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
        }
      });

      const responseText = response.text;
      
      try {
        const translatedTexts = JSON.parse(responseText);
        if (Array.isArray(translatedTexts) && translatedTexts.length === slide.texts.length) {
          slide.texts.forEach((text, i) => {
            text.translated = translatedTexts[i] || text.original;
          });
        }
      } catch (error) {
        console.error("Failed to parse Gemini response:", error, responseText);
        // Fallback: keep original text if translation fails for this chunk
        slide.texts.forEach(text => text.translated = text.original);
      }
      processedItems++;
      onProgress(Math.round((processedItems / totalItems) * 100));
    }

    if (slide.notes.length > 0) {
        const originalNotes = slide.notes.map(n => n.original);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: getTranslationPrompt(originalNotes, targetLanguage, glossary, 'presentation notes'),
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
            }
          });

        const responseText = response.text;
        
        try {
            const translatedNotes = JSON.parse(responseText);
            if (Array.isArray(translatedNotes) && translatedNotes.length === slide.notes.length) {
                slide.notes.forEach((note, i) => {
                    note.translated = translatedNotes[i] || note.original;
                });
            }
        } catch (error) {
            console.error("Failed to parse Gemini response for notes:", error, responseText);
            slide.notes.forEach(note => note.translated = note.original);
        }
        processedItems++;
        onProgress(Math.round((processedItems / totalItems) * 100));
    }
  }
  return translatedSlides;
};

const translateTextChunks = async (
  chunks: string[],
  targetLanguage: string,
  glossary: GlossaryTerm[],
  fileType: string
): Promise<string[]> => {
  if (chunks.length === 0) return [];
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: getTranslationPrompt(chunks, targetLanguage, glossary, fileType),
    config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
    }
  });

  const responseText = response.text;
  
  try {
    const translatedTexts = JSON.parse(responseText);
    if (Array.isArray(translatedTexts) && translatedTexts.length === chunks.length) {
      return translatedTexts;
    }
    console.error("Translated array length mismatch.");
    return chunks; // Return original chunks on mismatch
  } catch (error) {
    console.error("Failed to parse Gemini response:", error, responseText);
    return chunks; // Return original chunks on error
  }
};

export const translateDocx = async (
  docData: DocxData,
  targetLanguage: string,
  glossary: GlossaryTerm[],
  onProgress: (progress: number) => void
): Promise<DocxData> => {
  const translatedDocData: DocxData = JSON.parse(JSON.stringify(docData));
  
  const allOriginalTexts: string[] = [];
  translatedDocData.body.texts.forEach(t => allOriginalTexts.push(t.original));
  translatedDocData.headers.forEach(h => h.texts.forEach(t => allOriginalTexts.push(t.original)));
  translatedDocData.footers.forEach(f => f.texts.forEach(t => allOriginalTexts.push(t.original)));
  if (translatedDocData.comments) {
    translatedDocData.comments.texts.forEach(t => allOriginalTexts.push(t.original));
  }
  
  if (allOriginalTexts.length === 0) {
      onProgress(100);
      return translatedDocData;
  }

  onProgress(10);
  const allTranslatedTexts = await translateTextChunks(allOriginalTexts, targetLanguage, glossary, 'document');
  onProgress(90);

  let textIndex = 0;
  const assignTranslations = (texts: { original: string; translated: string }[]) => {
    texts.forEach(textPair => {
      textPair.translated = allTranslatedTexts[textIndex] || textPair.original;
      textIndex++;
    });
  };

  assignTranslations(translatedDocData.body.texts);
  translatedDocData.headers.forEach(h => assignTranslations(h.texts));
  translatedDocData.footers.forEach(f => assignTranslations(f.texts));
  if (translatedDocData.comments) {
    assignTranslations(translatedDocData.comments.texts);
  }
  
  onProgress(100);
  return translatedDocData;
};

export const translateXlsx = async (
  xlsxData: XlsxData,
  targetLanguage: string,
  glossary: GlossaryTerm[],
  onProgress: (progress: number) => void
): Promise<XlsxData> => {
  const translatedXlsxData: XlsxData = JSON.parse(JSON.stringify(xlsxData));
  
  const allTexts: string[] = [];
  xlsxData.sheets.forEach(sheet => {
    sheet.rows.forEach(row => {
      row.cells.forEach(cell => {
        if (cell.original && isNaN(Number(cell.original))) { // Simple check to avoid translating numbers
          allTexts.push(cell.original);
        }
      });
    });
  });

  if (allTexts.length === 0) {
    onProgress(100);
    return translatedXlsxData;
  }

  onProgress(10);
  const translatedTexts = await translateTextChunks(allTexts, targetLanguage, glossary, 'spreadsheet');
  onProgress(90);

  let textIndex = 0;
  translatedXlsxData.sheets.forEach(sheet => {
    sheet.rows.forEach(row => {
      row.cells.forEach(cell => {
        if (cell.original && isNaN(Number(cell.original))) {
          cell.translated = translatedTexts[textIndex] || cell.original;
          textIndex++;
        } else {
          cell.translated = cell.original;
        }
      });
    });
  });

  onProgress(100);
  return translatedXlsxData;
};