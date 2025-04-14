
import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import FileUpload from '@/components/FileUpload';
import { parseCSV, inferDataTypes } from '@/utils/csvParser';
import { toast } from '@/lib/toast';
import { trackPageVisit } from '@/utils/trackPageVisit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VisualSuggestions from '@/components/VisualSuggestions';
import { Button } from '@/components/ui/button';
import { Info, Database, BarChart, Clock } from 'lucide-react';
import { DatasetFile, VisualSuggestion, VisualAIRequest } from '@/types/powerbi';
import { generateVisualSuggestions } from '@/utils/visualSuggestions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DatasetPreview from '@/components/DatasetPreview';
import { Helmet } from 'react-helmet-async';

const PowerBiSuggestions = () => {
  const [datasets, setDatasets] = useState<DatasetFile[]>([]);
  const [visualSuggestions, setVisualSuggestions] = useState<VisualSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingAI, setIsUsingAI] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const { user, queryUsage, incrementQueryUsage, getQueryLimit } = useAuth();

  // Track page visit
  React.useEffect(() => {
    trackPageVisit('/powerbi');
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
    
    setDatasets(newDatasets);
    setVisualSuggestions([]);
    setApiError(null);
  };

  const generateAISuggestions = async () => {
    if (!incrementQueryUsage()) {
      if (user) {
        toast.error(`You've reached your limit of ${getQueryLimit()} queries per hour. Please try again later.`);
      } else {
        toast.error(`You've reached the guest limit of ${getQueryLimit()} queries per hour. Sign in for higher limits.`);
      }
      return [];
    }

    try {
      const request: VisualAIRequest = {
        datasets: datasets.map(dataset => ({
          name: dataset.file.name.replace(/\.csv$/, ''),
          headers: dataset.headers,
          dataTypes: dataset.dataTypes,
          sampleRows: dataset.rows.slice(0, 5)
        }))
      };

      const { data, error } = await supabase.functions.invoke('generate-visuals', {
        body: request
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate visualization suggestions');
      }

      if (data && data.suggestions) {
        setApiError(null);
        return data.suggestions;
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Failed to generate visualization suggestions');
      }
    } catch (error: any) {
      setApiError(error.message);
      throw error;
    }
  };

  const handleGenerateSuggestions = async () => {
    if (datasets.length === 0) {
      toast.error('Please upload at least one dataset first');
      return;
    }

    setIsLoading(true);
    setApiError(null);
    
    try {
      let allSuggestions: VisualSuggestion[] = [];
      
      if (isUsingAI) {
        // Use AI to generate suggestions
        try {
          allSuggestions = await generateAISuggestions();
        } catch (error: any) {
          console.error('Error generating AI suggestions:', error);
          toast.error(`AI suggestion failed: ${error.message}`);
          
          // Fallback to rule-based logic if AI fails
          if (isUsingAI) {
            toast.info('Falling back to basic suggestion logic');
            setIsUsingAI(false);
            
            // Generate rule-based suggestions
            datasets.forEach(dataset => {
              const suggestions = generateVisualSuggestions(dataset);
              allSuggestions.push(...suggestions);
            });
          }
        }
      } else {
        // Use rule-based logic to generate suggestions
        datasets.forEach(dataset => {
          const suggestions = generateVisualSuggestions(dataset);
          allSuggestions.push(...suggestions);
        });
      }
      
      setVisualSuggestions(allSuggestions);
      if (allSuggestions.length > 0) {
        toast.success(`Generated ${allSuggestions.length} visualization suggestions`);
      } else {
        toast.warning('No visualization suggestions could be generated');
      }
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast.error(`Failed to generate visualization suggestions: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDataset = (filename: string) => {
    setDatasets(prev => prev.filter(dataset => dataset.file.name !== filename));
    setVisualSuggestions([]);
    setApiError(null);
    toast.success(`Removed dataset: ${filename}`);
  };

  const toggleAIMode = () => {
    setIsUsingAI(!isUsingAI);
    toast.info(isUsingAI 
      ? 'Switched to rule-based visualization suggestions' 
      : 'Switched to AI-powered visualization suggestions');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950">
      <Helmet>
        <title>Power BI Visualization Suggestions - QueryLoom</title>
        <meta name="description" content="Upload your CSV datasets and get AI-powered Power BI visualization suggestions based on your data." />
        <link rel="canonical" href="https://queryloom.fun/powerbi" />
      </Helmet>
      
      <AppHeader />
      
      <div className="container px-4 mx-auto max-w-6xl py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart className="h-8 w-8 text-purple-700" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-blue-500">
              Power BI Visualization Suggestions
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
            Upload your CSV datasets and get {isUsingAI ? 'AI-generated' : ''} Power BI visualization suggestions based on your data.
          </p>
          <div className="mt-2 flex justify-center">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs"
              onClick={toggleAIMode}
            >
              {isUsingAI ? 'Using AI Suggestions' : 'Using Basic Suggestions'}
            </Button>
          </div>
        </div>
        
        <div className="grid gap-8">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" /> 
                <span>Upload Your Dataset</span>
              </CardTitle>
              <CardDescription>
                Upload CSV files to analyze and get visualization suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onFilesUploaded={handleFilesUploaded} />
            </CardContent>
          </Card>
          
          {apiError && (
            <Card className="border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  <span>Error from AI Service</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 dark:text-red-400">{apiError}</p>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  The application has automatically switched to basic suggestions. 
                  Please try again later or contact support if the issue persists.
                </p>
              </CardContent>
            </Card>
          )}
          
          {datasets.length > 0 && (
            <DatasetPreview datasets={datasets} onRemoveDataset={handleRemoveDataset} />
          )}
          
          {datasets.length > 0 && (
            <div className="flex justify-center mt-2 mb-6">
              <Button
                onClick={handleGenerateSuggestions}
                className="bg-purple-700 hover:bg-purple-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart className="mr-2 h-4 w-4" />
                    Generate {isUsingAI ? 'AI' : ''} Visualization Suggestions
                  </>
                )}
              </Button>
            </div>
          )}
          
          {visualSuggestions.length > 0 && (
            <VisualSuggestions suggestions={visualSuggestions} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PowerBiSuggestions;
