import { SlideData } from '../types';

declare const JSZip: any;

const getTextFromNodes = (nodes: NodeListOf<Element> | HTMLCollectionOf<Element>): string[] => {
  const texts: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.textContent) {
      texts.push(node.textContent);
    }
  }
  return texts;
};

const replaceTextInNodes = (nodes: NodeListOf<Element> | HTMLCollectionOf<Element>, translatedTexts: string[]) => {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (translatedTexts[i] !== undefined) {
      node.textContent = translatedTexts[i];
    }
  }
};

export const extractSlideData = async (file: File): Promise<SlideData[]> => {
  let zip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch (e) {
    console.error("Failed to load presentation file:", e);
    throw new Error("Could not read the file. It may be corrupted or not a valid .pptx file.");
  }
  
  const slideFiles = zip.file(/ppt\/slides\/slide\d+\.xml/);
  if (!slideFiles || slideFiles.length === 0) {
      throw new Error("No slides could be found in the presentation file.");
  }

  const slideData: SlideData[] = [];
  const slidePromises: Promise<void>[] = [];

  const parser = new DOMParser();

  slideFiles.forEach((slideFile: any) => {
    const slideNumberMatch = slideFile.name.match(/(\d+)\.xml$/);
    if (!slideNumberMatch) return; // Safely skip files with unexpected names
    const slideNumber = parseInt(slideNumberMatch[1], 10);
    
    const slidePromise = (async () => {
        const slideXml = await slideFile.async('string');
        const slideDoc = parser.parseFromString(slideXml, 'application/xml');
        const slideTextNodes = slideDoc.getElementsByTagName('a:t');
        const originalTexts = getTextFromNodes(slideTextNodes);

        // Find corresponding notes slide
        let originalNotes: string[] = [];
        const relsFile = zip.file(`ppt/slides/_rels/slide${slideNumber}.xml.rels`);
        if (relsFile) {
            const relsXml = await relsFile.async('string');
            const relsDoc = parser.parseFromString(relsXml, 'application/xml');
            const noteRel = relsDoc.querySelector('Relationship[Type*="notesSlide"]');
            if (noteRel) {
                const notePath = `ppt/notesSlides/${noteRel.getAttribute('Target').split('/').pop()}`;
                const notesFile = zip.file(notePath);
                if (notesFile) {
                    const notesXml = await notesFile.async('string');
                    const notesDoc = parser.parseFromString(notesXml, "application/xml");
                    const notesTextNodes = notesDoc.getElementsByTagName('a:t');
                    originalNotes = getTextFromNodes(notesTextNodes);
                }
            }
        }

        if (originalTexts.length > 0 || originalNotes.length > 0) {
            slideData.push({
                slideNumber,
                texts: originalTexts.map(t => ({ original: t, translated: '' })),
                notes: originalNotes.map(t => ({ original: t, translated: '' })),
            });
        }
    })();
    slidePromises.push(slidePromise);
  });

  await Promise.all(slidePromises);

  return slideData.sort((a, b) => a.slideNumber - b.slideNumber);
};

export const reassemblePptx = async (originalFile: File, translatedSlides: SlideData[]): Promise<string> => {
  const zip = await JSZip.loadAsync(originalFile);
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const reassemblyPromises: Promise<void>[] = [];

  for (const slide of translatedSlides) {
    const slidePath = `ppt/slides/slide${slide.slideNumber}.xml`;
    const slideFile = zip.file(slidePath);

    if (slideFile) {
      const reassembleSlidePromise = (async () => {
        const slideXml = await slideFile.async('string');
        const slideDoc = parser.parseFromString(slideXml, 'application/xml');
        const slideTextNodes = slideDoc.getElementsByTagName('a:t');
        replaceTextInNodes(slideTextNodes, slide.texts.map(t => t.translated));
        const newSlideXml = serializer.serializeToString(slideDoc);
        zip.file(slidePath, newSlideXml);
      })();
      reassemblyPromises.push(reassembleSlidePromise);
    }

    if (slide.notes.length > 0) {
      const reassembleNotesPromise = (async () => {
        const relsFile = zip.file(`ppt/slides/_rels/slide${slide.slideNumber}.xml.rels`);
        if(relsFile) {
          const relsXml = await relsFile.async('string');
          const relsDoc = parser.parseFromString(relsXml, "application/xml");
          const noteRel = relsDoc.querySelector('Relationship[Type*="notesSlide"]');
          if (noteRel) {
            const notePath = `ppt/notesSlides/${noteRel.getAttribute('Target').split('/').pop()}`;
            const notesFile = zip.file(notePath);
            if (notesFile) {
              const notesXml = await notesFile.async('string');
              const notesDoc = parser.parseFromString(notesXml, "application/xml");
              const notesTextNodes = notesDoc.getElementsByTagName('a:t');
              replaceTextInNodes(notesTextNodes, slide.notes.map(n => n.translated));
              const newNotesXml = serializer.serializeToString(notesDoc);
              zip.file(notePath, newNotesXml);
            }
          }
        }
      })();
      reassemblyPromises.push(reassembleNotesPromise);
    }
  }
  
  await Promise.all(reassemblyPromises);

  const blob = await zip.generateAsync({ type: 'blob' });
  return URL.createObjectURL(blob);
};