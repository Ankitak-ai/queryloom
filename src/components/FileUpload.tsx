
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { Upload } from "lucide-react";

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
}

const FileUpload = ({ onFilesUploaded }: FileUploadProps) => {
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
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const csvFiles = droppedFiles.filter(file => file.name.toLowerCase().endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      toast.error('Please upload CSV files only');
      return;
    }
    
    onFilesUploaded(csvFiles);
    toast.success(`${csvFiles.length} file(s) uploaded successfully`);
  }, [onFilesUploaded]);
  
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const csvFiles = filesArray.filter(file => file.name.toLowerCase().endsWith('.csv'));
      
      if (csvFiles.length === 0) {
        toast.error('Please upload CSV files only');
        return;
      }
      
      onFilesUploaded(csvFiles);
      toast.success(`${csvFiles.length} file(s) uploaded successfully`);
    }
  }, [onFilesUploaded]);
  
  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="bg-blue-100 p-4 rounded-full">
          <Upload size={32} className="text-blue-500" />
        </div>
        <h3 className="text-lg font-medium">Drag and drop CSV files here</h3>
        <p className="text-sm text-gray-500">or</p>
        <input
          type="file"
          id="fileInput"
          multiple
          accept=".csv"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <Button 
          onClick={() => document.getElementById('fileInput')?.click()}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Browse Files
        </Button>
        <p className="text-xs text-gray-400 mt-2">Upload multiple CSV files to analyze</p>
      </div>
    </div>
  );
};

export default FileUpload;
