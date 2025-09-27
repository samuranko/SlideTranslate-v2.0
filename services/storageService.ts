import { GlossaryTerm } from '../types';

const GLOSSARY_STORAGE_PREFIX = 'powerTranslateGlossary_';

export const getGlossary = (languageCode: string): GlossaryTerm[] => {
  try {
    const storedGlossary = localStorage.getItem(`${GLOSSARY_STORAGE_PREFIX}${languageCode}`);
    if (storedGlossary) {
      const parsed = JSON.parse(storedGlossary);
      // Basic validation to ensure it's an array of glossary terms
      if (Array.isArray(parsed) && parsed.every(item => typeof item.source === 'string' && typeof item.target === 'string')) {
        return parsed;
      }
    }
  } catch (error) {
    console.error(`Failed to retrieve or parse glossary for language '${languageCode}':`, error);
  }
  return []; // Return empty array if not found or on error
};

export const saveGlossary = (languageCode: string, glossary: GlossaryTerm[]): void => {
  try {
    const glossaryJson = JSON.stringify(glossary);
    localStorage.setItem(`${GLOSSARY_STORAGE_PREFIX}${languageCode}`, glossaryJson);
  } catch (error) {
    console.error(`Failed to save glossary for language '${languageCode}':`, error);
    // Optionally, alert the user that settings could not be saved
  }
};
