import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ProcessingView } from './components/ProcessingView';
import { ResultsView } from './components/ResultsView';
import { GlossaryModal } from './components/GlossaryModal';
import { AlertCircleIcon, BookOpenIcon } from './components/icons';
import { AppState, FileType, SlideData, DocxData, XlsxData, GlossaryTerm } from './types';
import { SUPPORTED_LANGUAGES } from './constants';
import { extractSlideData, reassemblePptx } from './services/pptxService';
import { extractDocxData, reassembleDocx } from './services/docxService';
import { extractXlsxData, reassembleXlsx } from './services/xlsxService';
import { translatePresentation, translateDocx, translateXlsx } from './services/geminiService';
import { getGlossary, saveGlossary } from './services/storageService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('initial');
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>(null);
  const [targetLanguage, setTargetLanguage] = useState(SUPPORTED_LANGUAGES[1].code); // Default to Spanish
  const [glossary, setGlossary] = useState<GlossaryTerm[]>(() => getGlossary(targetLanguage));
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [pptxData, setPptxData] = useState<SlideData[] | null>(null);
  const [docxData, setDocxData] = useState<DocxData | null>(null);
  const [xlsxData, setXlsxData] = useState<XlsxData | null>(null);

  useEffect(() => {
    saveGlossary(targetLanguage, glossary);
  }, [glossary, targetLanguage]);

  const handleLanguageChange = (newLanguageCode: string) => {
    setTargetLanguage(newLanguageCode);
    setGlossary(getGlossary(newLanguageCode));
  };
  
  const resetState = () => {
    setAppState('initial');
    setFile(null);
    setFileType(null);
    setError(null);
    setProgress(0);
    setProgressMessage('');
    setPptxData(null);
    setDocxData(null);
    setXlsxData(null);
  };

  const handleFileUpload = useCallback(async (uploadedFile: File, type: FileType) => {
    resetState();
    setFile(uploadedFile);
    setFileType(type);
    setAppState('processing');

    try {
      let extractedData: any;
      setProgressMessage('Extracting text from your file...');
      setProgress(10);
      switch (type) {
        case 'pptx':
          extractedData = await extractSlideData(uploadedFile);
          setPptxData(extractedData);
          break;
        case 'docx':
          extractedData = await extractDocxData(uploadedFile);
          setDocxData(extractedData);
          break;
        case 'xlsx':
          extractedData = await extractXlsxData(uploadedFile);
          setXlsxData(extractedData);
          break;
        default:
          throw new Error('Unsupported file type for processing.');
      }
      setProgress(30);

      setProgressMessage('Translating content with Gemini AI...');
      const onProgress = (p: number) => setProgress(30 + Math.round(p * 0.6));

      let translatedData: any;
      switch (type) {
        case 'pptx':
          translatedData = await translatePresentation(extractedData, targetLanguage, glossary, onProgress);
          setPptxData(translatedData);
          break;
        case 'docx':
          translatedData = await translateDocx(extractedData, targetLanguage, glossary, onProgress);
          setDocxData(translatedData);
          break;
        case 'xlsx':
          translatedData = await translateXlsx(extractedData, targetLanguage, glossary, onProgress);
          setXlsxData(translatedData);
          break;
      }
      
      setProgress(100);
      setProgressMessage('Translation complete!');
      setAppState('results');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred during processing.');
      setAppState('error');
    }
  }, [targetLanguage, glossary]);

  const handleDownload = async () => {
    if (!file || !fileType) return;
    try {
        let downloadUrl = '';
        if (fileType === 'pptx' && pptxData) {
            downloadUrl = await reassemblePptx(file, pptxData);
        } else if (fileType === 'docx' && docxData) {
            downloadUrl = await reassembleDocx(file, docxData);
        } else if (fileType === 'xlsx' && xlsxData) {
            downloadUrl = reassembleXlsx(xlsxData);
        }

        if (downloadUrl) {
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `translated_${file.name}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        }
    } catch(e) {
        console.error("Failed to reassemble and download file:", e);
        setError("Could not generate the downloadable file.");
        setAppState('error');
    }
  };

  const handleAddGlossaryTerm = (term: GlossaryTerm) => {
    setGlossary(prev => [...prev, term]);
  };
  
  const handleDeleteGlossaryTerm = (index: number) => {
    setGlossary(prev => prev.filter((_, i) => i !== index));
  };


  const renderContent = () => {
    switch (appState) {
      case 'initial':
        return (
            <FileUpload 
                onFileUpload={handleFileUpload} 
                disabled={false}
                targetLanguage={targetLanguage}
                onLanguageChange={handleLanguageChange}
            />
        );
      case 'processing':
        return <ProcessingView progress={progress} message={progressMessage} />;
      case 'results':
        return (
          <ResultsView
            fileType={fileType}
            fileName={file?.name || 'file'}
            pptxData={pptxData}
            docxData={docxData}
            xlsxData={xlsxData}
            glossary={glossary}
            onUpdatePptx={setPptxData}
            onUpdateDocx={setDocxData}
            onUpdateXlsx={setXlsxData}
            onDownload={handleDownload}
            onReset={resetState}
            onUpdateGlossary={setGlossary}
          />
        );
      case 'error':
        return (
            <div className="text-center p-8">
                <AlertCircleIcon className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">An Error Occurred</h2>
                <p className="text-red-600 bg-red-100 p-3 rounded-md max-w-lg mx-auto">{error}</p>
                <button
                    onClick={resetState}
                    className="mt-6 px-6 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
      default:
        return null;
    }
  };

  const backgroundStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(rgba(10, 20, 40, 0.6), rgba(10, 20, 40, 0.6)), url('data:image/jpeg;base64,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')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  };

  return (
    <div 
        className="flex flex-col min-h-screen font-sans text-slate-900"
        style={backgroundStyle}
    >
      <Header />
      <main className="flex-grow container mx-auto p-4 flex flex-col items-center justify-center">
        <div className="w-full bg-white rounded-lg shadow-xl p-6 md:p-8 my-8">
            {renderContent()}
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-slate-200">
        <button onClick={() => setIsGlossaryOpen(true)} className="flex items-center gap-2 mx-auto text-indigo-300 hover:text-indigo-100 font-medium transition-colors">
            <BookOpenIcon className="w-5 h-5"/> Manage Custom Glossary
        </button>
        <p className="mt-2">Powered by Google Gemini</p>
        <p className="mt-2">Copyright 2025 - Scott Muranko. All rights reserved</p>
      </footer>
      <GlossaryModal 
        isOpen={isGlossaryOpen} 
        onClose={() => setIsGlossaryOpen(false)}
        glossary={glossary}
        onAddTerm={handleAddGlossaryTerm}
        onDeleteTerm={handleDeleteGlossaryTerm}
      />
    </div>
  );
};

export default App;
