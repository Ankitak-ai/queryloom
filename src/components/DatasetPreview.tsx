
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DatasetFile {
  file: File;
  headers: string[];
  rows: any[][];
  dataTypes: Record<string, string>;
}

interface DatasetPreviewProps {
  datasets: DatasetFile[];
  onRemoveDataset?: (filename: string) => void;
}

const DatasetPreview: React.FC<DatasetPreviewProps> = ({ datasets, onRemoveDataset }) => {
  if (datasets.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dataset Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={datasets[0]?.file.name} className="w-full">
          <TabsList className="mb-4 w-full flex overflow-x-auto">
            {datasets.map((dataset) => (
              <TabsTrigger
                key={dataset.file.name}
                value={dataset.file.name}
                className="flex-shrink-0 group relative"
              >
                {dataset.file.name.length > 15 
                  ? dataset.file.name.substring(0, 15) + '...' 
                  : dataset.file.name}
                
                {onRemoveDataset && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveDataset(dataset.file.name);
                    }}
                    aria-label={`Remove ${dataset.file.name}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {datasets.map((dataset) => (
            <TabsContent key={dataset.file.name} value={dataset.file.name} className="w-full">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {dataset.headers.map((header, index) => (
                        <th 
                          key={`${header}-${index}`} 
                          className="p-2 border border-gray-200 font-medium text-left"
                        >
                          <div className="flex flex-col">
                            <span>{header}</span>
                            <span className="text-xs text-gray-500">
                              {dataset.dataTypes[header] || 'TEXT'}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell, cellIndex) => (
                          <td 
                            key={`${rowIndex}-${cellIndex}`}
                            className="p-2 border border-gray-200"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                <p>Showing first 5 rows of {dataset.file.name}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DatasetPreview;
