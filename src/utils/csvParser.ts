
/**
 * Parse CSV string data into an array of objects
 * @param csvText CSV content as a string
 * @returns Array of objects with column headers as keys
 */
import * as XLSX from 'xlsx';

export const parseCSV = (csvText: string): { headers: string[], rows: any[][] } => {
  try {
    // Split the CSV text into lines
    const lines = csvText.trim().split('\n');
    
    // Extract headers from the first line
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Parse the data rows
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(value => value.trim());
      return values;
    });
    
    // Return only the first 5 rows for preview
    return {
      headers,
      rows: rows.slice(0, 5)
    };
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return { headers: [], rows: [] };
  }
};

/**
 * Parse Excel file data into multiple datasets based on sheets
 * @param file Excel file
 * @returns Promise resolving to an array of sheet datasets
 */
export const parseExcel = async (file: File): Promise<Array<{ 
  sheetName: string, 
  headers: string[], 
  rows: any[][], 
  dataTypes: Record<string, string>
}>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const datasets = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            return {
              sheetName,
              headers: [],
              rows: [],
              dataTypes: {}
            };
          }
          
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1, 6) as any[][]; // Only take first 5 rows for preview
          const dataTypes = inferDataTypes(headers, rows);
          
          return {
            sheetName,
            headers,
            rows,
            dataTypes
          };
        });
        
        resolve(datasets);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Analyzes CSV data to determine the likely data types for each column
 * @param data Parsed CSV data
 * @returns Object mapping column names to their inferred types
 */
export const inferDataTypes = (headers: string[], rows: any[][]): Record<string, string> => {
  const dataTypes: Record<string, string> = {};
  
  // Initialize with 'unknown' types
  headers.forEach(header => {
    dataTypes[header] = 'unknown';
  });
  
  // Check values in each column to infer types
  rows.forEach(row => {
    headers.forEach((header, index) => {
      const value = row[index];
      
      // Skip empty values
      if (value === undefined || value === null || value === '') return;
      
      // If type is already determined, skip
      if (dataTypes[header] !== 'unknown') return;
      
      // Check if it's a number
      if (!isNaN(Number(value))) {
        if (value.includes('.')) {
          dataTypes[header] = 'DECIMAL';
        } else {
          dataTypes[header] = 'INTEGER';
        }
      } 
      // Check if it's a date
      else if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
        dataTypes[header] = 'DATE';
      }
      // Otherwise, it's text
      else {
        dataTypes[header] = 'TEXT';
      }
    });
  });
  
  return dataTypes;
};

/**
 * Generates a basic SQL table schema from CSV data
 * @param fileName The name of the file (used as table name)
 * @param headers Column headers
 * @param dataTypes Inferred data types
 * @returns SQL CREATE TABLE statement
 */
export const generateTableSchema = (fileName: string, headers: string[], dataTypes: Record<string, string>): string => {
  // Clean the file name to make a valid table name
  const tableName = fileName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/\.csv$/i, '');
  
  const columnDefinitions = headers
    .map(header => `  ${header.replace(/[^a-zA-Z0-9_]/g, '_')} ${dataTypes[header] || 'TEXT'}`)
    .join(',\n');
  
  return `CREATE TABLE ${tableName} (\n${columnDefinitions}\n);`;
};
