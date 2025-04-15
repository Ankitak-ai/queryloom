
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { Upload } from "lucide-react";
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
    const csvFiles = files.filter(file => file.name.toLowerCase().endsWith('.csv'));
    const excelFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.xlsx') || 
      file.name.toLowerCase().endsWith('.xls')
    );
    
    if (csvFiles.length === 0 && excelFiles.length === 0) {
      toast.error('Please upload CSV or Excel files only');
      return;
    }
    
    // Handle CSV files normally
    if (csvFiles.length > 0) {
      onFilesUploaded(csvFiles);
      toast.success(`${csvFiles.length} CSV file(s) uploaded successfully`);
    }
    
    // Process Excel files if handler provided
    if (excelFiles.length > 0 && onExcelSheetsUploaded) {
      for (const excelFile of excelFiles) {
        try {
          const sheets = await parseExcel(excelFile);
          if (sheets.length > 0) {
            onExcelSheetsUploaded(excelFile, sheets);
            toast.success(`Excel file "${excelFile.name}" with ${sheets.length} sheet(s) processed successfully`);
          } else {
            toast.warning(`Excel file "${excelFile.name}" contains no valid sheets`);
          }
        } catch (error) {
          console.error(`Error processing Excel file ${excelFile.name}:`, error);
          toast.error(`Failed to process Excel file "${excelFile.name}". Please check the file format.`);
        }
      }
    } else if (excelFiles.length > 0) {
      // If Excel files are provided but no handler, just pass them to the normal handler
      onFilesUploaded(excelFiles);
      toast.success(`${excelFiles.length} Excel file(s) uploaded successfully`);
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
        >
          Browse Files
        </Button>
        <p className="text-xs text-gray-400 mt-2">Upload CSV or Excel files to analyze</p>
      </div>
    </div>
  );
};

export default FileUpload;
