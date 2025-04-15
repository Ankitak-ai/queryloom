
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { Upload, FileSpreadsheet } from "lucide-react";
import { parseExcel } from '@/utils/csvParser';

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
  onExcelSheetsUploaded?: (file: File, sheets: Array<{ 
    sheetName: string, 
    headers: string[], 
    rows: any[][],
    dataTypes: Record<string, string>
  }>) => void;
}

const FileUpload = ({ onFilesUploaded, onExcelSheetsUploaded }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  }, [onFilesUploaded, onExcelSheetsUploaded]);
  
  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      await processFiles(filesArray);
    }
  }, [onFilesUploaded, onExcelSheetsUploaded]);
  
  const processFiles = async (files: File[]) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const csvFiles = files.filter(file => file.name.toLowerCase().endsWith('.csv'));
      const excelFiles = files.filter(file => 
        file.name.toLowerCase().endsWith('.xlsx') || 
        file.name.toLowerCase().endsWith('.xls')
      );
      
      if (csvFiles.length === 0 && excelFiles.length === 0) {
        toast.error('Please upload CSV or Excel files only');
        setIsProcessing(false);
        return;
      }
      
      // Handle CSV files normally
      if (csvFiles.length > 0) {
        onFilesUploaded(csvFiles);
        toast.success(`${csvFiles.length} CSV file(s) uploaded successfully`);
      }
      
      // Process Excel files if handler provided
      if (excelFiles.length > 0 && onExcelSheetsUploaded) {
        toast.info(`Processing ${excelFiles.length} Excel file(s)...`);
        let successCount = 0;
        let failCount = 0;
        
        for (const excelFile of excelFiles) {
          try {
            console.log(`Processing Excel file: ${excelFile.name}`);
            const sheets = await parseExcel(excelFile);
            
            if (sheets && sheets.length > 0) {
              // Clean sheet names before passing them to the handler
              const cleanedSheets = sheets.map(sheet => {
                // Create a cleaned version of the sheet name
                const cleanedName = sheet.sheetName
                  .replace(/[^a-zA-Z0-9_\s-]/g, '') // Remove special characters
                  .trim()
                  .substring(0, 20); // Limit to 20 characters
                
                return {
                  ...sheet,
                  sheetName: cleanedName
                };
              });
              
              onExcelSheetsUploaded(excelFile, cleanedSheets);
              toast.success(`Excel file "${excelFile.name}" with ${sheets.length} sheet(s) processed successfully`);
              successCount++;
              
              // Log sheet info for debugging
              console.log(`Excel file ${excelFile.name} sheets:`, 
                cleanedSheets.map(s => ({
                  name: s.sheetName,
                  headerCount: s.headers.length,
                  rowCount: s.rows.length
                }))
              );
            } else {
              toast.warning(`Excel file "${excelFile.name}" contains no valid sheets`);
              failCount++;
            }
          } catch (error: any) {
            console.error(`Error processing Excel file ${excelFile.name}:`, error);
            toast.error(`Failed to process Excel file "${excelFile.name}": ${error.message}`);
            failCount++;
          }
        }
        
        if (successCount > 0 && failCount > 0) {
          toast.info(`Processed ${successCount} Excel files successfully, ${failCount} failed`);
        }
      } else if (excelFiles.length > 0) {
        // If Excel files are provided but no handler, just pass them to the normal handler
        onFilesUploaded(excelFiles);
        toast.success(`${excelFiles.length} Excel file(s) uploaded successfully`);
      }
    } catch (error: any) {
      console.error("Error processing files:", error);
      toast.error(`An error occurred while processing the files: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBoxClick = () => {
    document.getElementById('fileInput')?.click();
  };
  
  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBoxClick}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="bg-blue-100 p-4 rounded-full">
          <Upload size={32} className="text-blue-500" />
        </div>
        <h3 className="text-lg font-medium">Drag and drop CSV or Excel files here</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Excel files will be processed sheet by sheet</span>
        </div>
        <p className="text-sm text-gray-500">or</p>
        <input
          type="file"
          id="fileInput"
          multiple
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileInputChange}
          onClick={(e) => e.stopPropagation()} // Prevent double-trigger of click events
        />
        <Button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent double-trigger
            document.getElementById('fileInput')?.click();
          }}
          className="bg-blue-500 hover:bg-blue-600"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Browse Files'}
        </Button>
        <p className="text-xs text-gray-400 mt-2">Upload CSV or Excel files to analyze</p>
      </div>
    </div>
  );
};

export default FileUpload;
