
import React, { useState } from 'react';
import { parseCSV, inferDataTypes, generateTableSchema } from '@/utils/csvParser';
import FileUpload from '@/components/FileUpload';
import DatasetPreview from '@/components/DatasetPreview';
import QueryInput from '@/components/QueryInput';
import SqlDisplay from '@/components/SqlDisplay';
import { toast } from '@/lib/toast';

interface DatasetFile {
  file: File;
  headers: string[];
  rows: any[][];
  dataTypes: Record<string, string>;
}

const Index = () => {
  const [datasets, setDatasets] = useState<DatasetFile[]>([]);
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleFilesUploaded = async (files: File[]) => {
    const newDatasets: DatasetFile[] = [];
    
    for (const file of files) {
      try {
        const text = await file.text();
        const { headers, rows } = parseCSV(text);
        const dataTypes = inferDataTypes(headers, rows);
        
        newDatasets.push({
          file,
          headers,
          rows,
          dataTypes
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        toast.error(`Failed to process ${file.name}. Please check the file format.`);
      }
    }
    
    // Add new datasets or replace existing ones with same filename
    setDatasets(prev => {
      const existing = [...prev];
      
      for (const newDataset of newDatasets) {
        const index = existing.findIndex(d => d.file.name === newDataset.file.name);
        if (index >= 0) {
          existing[index] = newDataset;
        } else {
          existing.push(newDataset);
        }
      }
      
      return existing;
    });
  };
  
  const handleGenerateQuery = async (query: string) => {
    if (datasets.length === 0) {
      toast.error('Please upload at least one dataset first');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Extract schema information for each dataset
      const schemaInfo = datasets.map(dataset => {
        return {
          tableName: dataset.file.name.replace(/\.csv$/, ''),
          columns: dataset.headers,
          dataTypes: dataset.dataTypes,
          sample: dataset.rows.slice(0, 3) // Include a few sample rows for context
        };
      });
      
      // For now, we'll just generate a placeholder SQL query
      // When the AI integration is provided later, this will be replaced
      const placeholderSql = generatePlaceholderSql(query, schemaInfo);
      
      // Small delay to simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGeneratedSql(placeholderSql);
    } catch (error) {
      console.error('Error generating SQL query:', error);
      toast.error('Failed to generate SQL query');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // This function will be replaced with the actual AI-based SQL generator
  const generatePlaceholderSql = (query: string, schemaInfo: any[]) => {
    // Generate a schema string to show what tables are available
    const schemaString = schemaInfo.map(schema => {
      return generateTableSchema(
        schema.tableName, 
        schema.columns, 
        schema.dataTypes
      );
    }).join('\n\n');
    
    return `-- This is a placeholder SQL query based on your input
-- When the AI integration is provided, this will be replaced with the actual generated query
-- Available tables and their schema:

${schemaString}

-- Based on your query: "${query}"
-- A sample SQL query might be:

SELECT 
  *
FROM 
  ${schemaInfo[0]?.tableName} 
WHERE 
  -- Conditions based on your natural language query would be here
  1=1
LIMIT 10;`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">AI SQL Query Builder</h1>
          <p className="text-gray-600 mt-2">
            Upload your CSV datasets and get AI-generated SQL queries from natural language descriptions
          </p>
        </div>
        
        <div className="grid gap-8">
          <FileUpload onFilesUploaded={handleFilesUploaded} />
          
          {datasets.length > 0 && (
            <DatasetPreview datasets={datasets} />
          )}
          
          <QueryInput 
            onGenerateQuery={handleGenerateQuery}
            isGenerating={isGenerating}
          />
          
          {generatedSql && (
            <SqlDisplay sql={generatedSql} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
