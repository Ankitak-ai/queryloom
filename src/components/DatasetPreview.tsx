
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';

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
    <Card className="w-full max-w-full">
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
              <div className="w-full overflow-hidden">
                <ScrollArea className="w-full rounded-md border h-[360px]">
                  <div className="inline-block min-w-full">
                    <Table className="w-auto">
                      <TableHeader>
                        <TableRow>
                          {dataset.headers.map((header, index) => (
                            <TableHead 
                              key={`${header}-${index}`}
                              className="whitespace-nowrap"
                            >
                              <div className="flex flex-col">
                                <span>{header}</span>
                                <span className="text-xs text-muted-foreground">
                                  {dataset.dataTypes[header] || 'TEXT'}
                                </span>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataset.rows.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <TableCell 
                                key={`${rowIndex}-${cellIndex}`}
                                className="whitespace-nowrap"
                              >
                                {cell}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
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
