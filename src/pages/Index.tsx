import React, { useState, useEffect, useRef } from 'react';
import { parseCSV, inferDataTypes } from '@/utils/csvParser';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import FileUpload from '@/components/FileUpload';
import DatasetPreview from '@/components/DatasetPreview';
import QueryInput, { SqlDialect } from '@/components/QueryInput';
import SqlDisplay from '@/components/SqlDisplay';
import VisitorStats from '@/components/VisitorStats';
import PredefinedQueries from '@/components/PredefinedQueries';
import UserQueries from '@/components/UserQueries';
import AppHeader from '@/components/AppHeader';
import { toast } from '@/lib/toast';
import { Info } from 'lucide-react';
import { trackPageVisit } from '@/utils/trackPageVisit';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface DatasetFile {
  file: File;
  headers: string[];
  rows: any[][];
  dataTypes: Record<string, string>;
}

const QUERY_LIMIT_USER = 10;

const Index = () => {
  const [datasets, setDatasets] = useState<DatasetFile[]>([]);
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [sqlExplanation, setSqlExplanation] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState<string>('');
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>('postgresql');
  const { user, queryUsage, incrementQueryUsage, getQueryLimit } = useAuth();
  const navigate = useNavigate();
  const sqlDisplayRef = useRef<HTMLDivElement>(null);

  const remainingQueries = getQueryLimit() - queryUsage.count;
  const resetTime = new Date(queryUsage.resetTime);

  useEffect(() => {
    trackPageVisit('/');
  }, []);

  useEffect(() => {
    if (generatedSql && sqlDisplayRef.current) {
      sqlDisplayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedSql]);

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
  
  const handleRemoveDataset = (filename: string) => {
    setDatasets(prev => prev.filter(dataset => dataset.file.name !== filename));
    toast.success(`Removed dataset: ${filename}`);
    
    if (datasets.length <= 1) {
      setGeneratedSql('');
      setSqlExplanation('');
    }
  };
  
  const handleGenerateQuery = async (query: string, dialect: SqlDialect) => {
    if (datasets.length === 0) {
      toast.error('Please upload at least one dataset first');
      return;
    }
    
    if (!incrementQueryUsage()) {
      if (user) {
        toast.error(`You've reached your limit of ${getQueryLimit()} queries per hour. Please try again later.`);
      } else {
        toast.error(`You've reached the guest limit of ${getQueryLimit()} queries per hour. Sign in for higher limits.`);
      }
      return;
    }
    
    setIsGenerating(true);
    setNaturalLanguageQuery(query);
    setSqlDialect(dialect);
    
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
        body: { query, schemaInfo, dialect }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.sql) {
        setGeneratedSql(data.sql);
        setSqlExplanation(data.explanation || '');
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

  const handleSelectPredefinedQuery = (query: string) => {
    setNaturalLanguageQuery(query);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950">
      <AppHeader />
      
      <div className="container px-4 mx-auto max-w-6xl py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img 
              src="/lovable-uploads/0c750f2c-f51d-49ac-bfd3-01fb7d81314a.png" 
              alt="QueryLoom Logo" 
              className="h-8 w-8" 
            />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-blue-500">
              AI QueryLoom
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
            Upload your CSV datasets and get AI-generated SQL queries powered by the 
            <span className="font-semibold text-purple-600 dark:text-purple-400"> Nvidia Llama 3.3 Nemotron Model</span>
          </p>
          
          <div className="mt-2 inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Advanced AI reasoning for precise SQL generation
          </div>
          
          <div className="mt-4 flex flex-col items-center justify-center gap-4">
            <VisitorStats />
            
            <div className="product-hunt-badge">
              <a 
                href="https://www.producthunt.com/posts/ai-sql-query-builder?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-ai&#0045;sql&#0045;query&#0045;builder" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img 
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=949654&theme=light&t=1743802327481" 
                  alt="AI SQL Query Builder - query-craft-ai-web | Product Hunt" 
                  style={{ width: '250px', height: '54px' }} 
                  width="250" 
                  height="54" 
                />
              </a>
            </div>
          </div>
        </div>
        
        {!user && (
          <Alert className="mb-8 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
            <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-300">
              You're currently using the guest tier with {getQueryLimit()} queries per hour. 
              <Button 
                variant="link" 
                className="text-purple-600 dark:text-purple-400 p-0 h-auto font-medium" 
                onClick={() => navigate('/auth')}
              >
                Sign in
              </Button> to get {QUERY_LIMIT_USER} queries per hour.
            </AlertDescription>
          </Alert>
        )}
        
        {remainingQueries === 0 && (
          <Alert className="mb-8 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
            <Info className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-sm text-red-700 dark:text-red-300">
              You've reached your query limit for this hour. Your limit will reset at {resetTime.toLocaleTimeString()}.
              {!user && (
                <span>
                  {' '}
                  <Button 
                    variant="link" 
                    className="text-purple-600 dark:text-purple-400 p-0 h-auto font-medium" 
                    onClick={() => navigate('/auth')}
                  >
                    Sign in
                  </Button> to get more queries.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-8">
          <FileUpload onFilesUploaded={handleFilesUploaded} />
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {datasets.length > 0 && (
                <DatasetPreview 
                  datasets={datasets} 
                  onRemoveDataset={handleRemoveDataset}
                />
              )}
              
              <QueryInput 
                onGenerateQuery={handleGenerateQuery}
                isGenerating={isGenerating}
                initialValue={naturalLanguageQuery}
              />
              
              {generatedSql && (
                <div ref={sqlDisplayRef}>
                  <SqlDisplay 
                    sql={generatedSql} 
                    explanation={sqlExplanation}
                    dialect={sqlDialect}
                  />
                </div>
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
