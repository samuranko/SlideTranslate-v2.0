import { XlsxData } from '../types';

declare const XLSX: any;

export const extractXlsxData = async (file: File): Promise<XlsxData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheets: XlsxData['sheets'] = [];

    workbook.SheetNames.forEach((sheetName: string) => {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
      
      sheets.push({
        sheetName,
        rows: jsonData.map((row: any[]) => ({
          cells: row.map(cell => ({
            original: cell ? String(cell) : '',
            translated: '',
          })),
        })),
      });
    });

    return { sheets };
  } catch (e) {
    console.error("Failed to load or parse .xlsx file:", e);
    throw new Error("Could not read the file. It may be corrupted or not a valid .xlsx file.");
  }
};

export const reassembleXlsx = (translatedData: XlsxData): string => {
  const workbook = XLSX.utils.book_new();

  translatedData.sheets.forEach(sheetData => {
    const translatedSheetData = sheetData.rows.map(row => 
      row.cells.map(cell => cell.translated)
    );
    const worksheet = XLSX.utils.aoa_to_sheet(translatedSheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetData.sheetName);
  });

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  return URL.createObjectURL(blob);
};
