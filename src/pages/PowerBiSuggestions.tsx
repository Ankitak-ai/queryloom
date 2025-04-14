
import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import FileUpload from '@/components/FileUpload';
import { DatasetFile, VisualSuggestion, VisualAIRequest } from '@/types/powerbi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import DatasetPreview from '@/components/DatasetPreview';
import VisualSuggestionsList from '@/components/VisualSuggestions';
import { trackPageVisit } from '@/utils/trackPageVisit';
import { generateVisualSuggestions } from '@/utils/visualSuggestions';
import { ScrollArea } from '@/components/ui/scroll-area';

const PowerBiSuggestions = () => {
  const { user, incrementQueryUsage } = useAuth();
  const [datasets, setDatasets] = useState<DatasetFile[]>([]);
  const [visualSuggestions, setVisualSuggestions] = useState<VisualSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    trackPageVisit('/powerbi');
  }, []);

  const handleFilesUploaded = async (files: File[]) => {
    const newDatasets: DatasetFile[] = [];

    for (const file of files) {
      const dataset: DatasetFile = {
        file,
        name: file.name,
        type: file.type,
        size: file.size
      };
      newDatasets.push(dataset);
    }

    setDatasets(newDatasets);
  };

  const generateAISuggestions = async () => {
    // Use the new page-specific query limit check for 'powerbi'
    if (!incrementQueryUsage('powerbi')) {
      return [];
    }

    setIsLoading(true);
    
    try {
      const request: VisualAIRequest = {
        files: datasets.map(d => d.file)
      };

      const suggestions = await generateVisualSuggestions(request);
      setVisualSuggestions(suggestions);
      
      return suggestions;
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      toast.error('Failed to generate AI suggestions');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
        <div className="flex flex-col space-y-4">
          <FileUpload 
            onFilesUploaded={handleFilesUploaded} 
            multiple 
            accept=".csv,.xlsx,.xls" 
          />
          {datasets.length > 0 && (
            <ScrollArea className="h-full">
              {datasets.map((dataset, index) => (
                <DatasetPreview 
                  key={index} 
                  file={dataset} 
                />
              ))}
            </ScrollArea>
          )}
        </div>
        
        <div className="flex flex-col space-y-4">
          <Button 
            onClick={generateAISuggestions} 
            disabled={datasets.length === 0 || isLoading}
            className="w-full"
          >
            {isLoading ? 'Generating Suggestions...' : 'Generate AI Visualizations'}
          </Button>
          
          {visualSuggestions.length > 0 && (
            <ScrollArea className="h-full">
              <VisualSuggestionsList suggestions={visualSuggestions} />
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
};

export default PowerBiSuggestions;
