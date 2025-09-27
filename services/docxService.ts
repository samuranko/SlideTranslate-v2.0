import { DocxData, DocxPartContent } from '../types';

declare const JSZip: any;

const extractTextsFromXml = async (xmlFile: any): Promise<string[]> => {
  if (!xmlFile) return [];
  const content = await xmlFile.async('string');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'application/xml');
  const textNodes = xmlDoc.getElementsByTagName('w:t');
  
  const texts: string[] = [];
  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];
    if (node.textContent) {
      texts.push(node.textContent);
    }
  }
  return texts;
};

export const extractDocxData = async (file: File): Promise<DocxData> => {
  try {
    const zip = await JSZip.loadAsync(file);

    // Body
    const bodyFile = zip.file('word/document.xml');
    if (!bodyFile) throw new Error('word/document.xml not found.');
    const bodyTexts = await extractTextsFromXml(bodyFile);
    const body: DocxPartContent = {
        fileName: 'word/document.xml',
        texts: bodyTexts.map(t => ({ original: t, translated: '' })),
    };
    
    // Headers
    const headerFiles = zip.file(/word\/header\d+\.xml/);
    const headers: DocxPartContent[] = await Promise.all(
        headerFiles.map(async (hf: any) => {
            const texts = await extractTextsFromXml(hf);
            return { fileName: hf.name, texts: texts.map(t => ({ original: t, translated: '' })) };
        })
    );

    // Footers
    const footerFiles = zip.file(/word\/footer\d+\.xml/);
    const footers: DocxPartContent[] = await Promise.all(
        footerFiles.map(async (ff: any) => {
            const texts = await extractTextsFromXml(ff);
            return { fileName: ff.name, texts: texts.map(t => ({ original: t, translated: '' })) };
        })
    );

    // Comments
    const commentsFile = zip.file('word/comments.xml');
    let comments: DocxPartContent | null = null;
    if (commentsFile) {
        const texts = await extractTextsFromXml(commentsFile);
        if (texts.length > 0) {
            comments = { fileName: 'word/comments.xml', texts: texts.map(t => ({ original: t, translated: '' })) };
        }
    }

    return { body, headers, footers, comments };

  } catch (e) {
    console.error("Failed to load or parse .docx file:", e);
    throw new Error("Could not read the file. It may be corrupted or not a valid .docx file.");
  }
};

const reassemblePart = async (zip: any, part: DocxPartContent) => {
    const xmlFile = zip.file(part.fileName);
    if (!xmlFile) return;

    const content = await xmlFile.async('string');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'application/xml');
    const textNodes = xmlDoc.getElementsByTagName('w:t');

    let translatedTextIndex = 0;
    const allTranslatedTexts = part.texts.map(p => p.translated);

    for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        if (node.textContent && translatedTextIndex < allTranslatedTexts.length) {
            node.textContent = allTranslatedTexts[translatedTextIndex];
            translatedTextIndex++;
        }
    }

    const serializer = new XMLSerializer();
    const newContent = serializer.serializeToString(xmlDoc);
    zip.file(part.fileName, newContent);
};

export const reassembleDocx = async (originalFile: File, translatedData: DocxData): Promise<string> => {
    const zip = await JSZip.loadAsync(originalFile);
    
    await reassemblePart(zip, translatedData.body);
    await Promise.all(translatedData.headers.map(h => reassemblePart(zip, h)));
    await Promise.all(translatedData.footers.map(f => reassemblePart(zip, f)));
    if (translatedData.comments) {
        await reassemblePart(zip, translatedData.comments);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    return URL.createObjectURL(blob);
};