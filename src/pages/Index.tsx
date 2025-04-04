import React, { useState, useEffect } from 'react';
import { parseCSV, inferDataTypes } from '@/utils/csvParser';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import FileUpload from '@/components/FileUpload';
import DatasetPreview from '@/components/DatasetPreview';
import QueryInput from '@/components/QueryInput';
import SqlDisplay from '@/components/SqlDisplay';
import VisitorStats from '@/components/VisitorStats';
import PredefinedQueries from '@/components/PredefinedQueries';
import UserQueries from '@/components/UserQueries';
import AppHeader from '@/components/AppHeader';
import { toast } from '@/lib/toast';
import { Brain } from 'lucide-react';
import { trackPageVisit } from '@/utils/trackPageVisit';

interface DatasetFile {
  file: File;
  headers: string[];
  rows: any[][];
  dataTypes: Record<string, string>;
}

const Index = () => {
  const [datasets, setDatasets] = useState<DatasetFile[]>([]);
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [sqlExplanation, setSqlExplanation] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    // Track page visit when component mounts
    trackPageVisit('/');
  }, []);

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
    setNaturalLanguageQuery(query);
    
    try {
      const schemaInfo = datasets.map(dataset => {
        return {
          tableName: dataset.file.name.replace(/\.csv$/, ''),
          columns: dataset.headers,
          dataTypes: dataset.dataTypes,
          sample: dataset.rows.slice(0, 3)
        };
      });
      
      const { data, error } = await supabase.functions.invoke('generate-sql', {
        body: { query, schemaInfo }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.sql) {
        setGeneratedSql(data.sql);
        setSqlExplanation(data.explanation || '');
        
        // Save query to user's history if logged in
        if (user) {
          await saveUserQuery(query);
        }
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Failed to generate SQL query');
      }
    } catch (error: any) {
      console.error('Error generating SQL query:', error);
      toast.error(`Failed to generate SQL query: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveUserQuery = async (queryText: string) => {
    try {
      await (supabase as any).from('user_queries').insert({
        user_id: user?.id,
        query_text: queryText
      });
    } catch (error) {
      console.error('Error saving user query:', error);
      // Don't show a toast error for this since it's a background operation
    }
  };

  const handleSelectPredefinedQuery = (query: string) => {
    setNaturalLanguageQuery(query);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950">
      <AppHeader />
      
      <div className="container px-4 mx-auto max-w-6xl py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-blue-500">
              AI SQL Query Builder
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
            Upload your CSV datasets and get AI-generated SQL queries powered by the 
            <span className="font-semibold text-purple-600 dark:text-purple-400"> DeepSeek R1 Reasoning Model</span>
          </p>
          <div className="mt-2 inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Advanced AI reasoning for precise SQL generation
          </div>
          
          {/* Add visitor stats */}
          <div className="mt-4 flex justify-center">
            <VisitorStats />
          </div>
        </div>
        
        <div className="grid gap-8">
          <FileUpload onFilesUploaded={handleFilesUploaded} />
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {datasets.length > 0 && (
                <DatasetPreview datasets={datasets} />
              )}
              
              <QueryInput 
                onGenerateQuery={handleGenerateQuery}
                isGenerating={isGenerating}
                initialValue={naturalLanguageQuery}
              />
              
              {generatedSql && (
                <SqlDisplay 
                  sql={generatedSql} 
                  explanation={sqlExplanation}
                />
              )}
            </div>
            
            <div className="space-y-6">
              <PredefinedQueries onSelectQuery={handleSelectPredefinedQuery} />
              <UserQueries 
                onSelectQuery={handleSelectPredefinedQuery} 
                onQueryGenerated={naturalLanguageQuery}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
