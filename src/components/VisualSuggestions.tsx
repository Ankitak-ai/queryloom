
import React from 'react';
import { VisualSuggestion } from '@/types/powerbi';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, BarChart2, LineChart, PieChart, Map, AlertTriangle, ScatterChart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisualSuggestionsProps {
  suggestions: VisualSuggestion[];
}

const VisualSuggestions: React.FC<VisualSuggestionsProps> = ({ suggestions }) => {
  // Get the appropriate icon based on the visual type
  const getVisualIcon = (visualType: string) => {
    const type = visualType.toLowerCase();
    
    if (type.includes('bar') || type.includes('column')) {
      return <BarChart className="h-6 w-6" />;
    } else if (type.includes('line')) {
      return <LineChart className="h-6 w-6" />;
    } else if (type.includes('pie') || type.includes('donut')) {
      return <PieChart className="h-6 w-6" />;
    } else if (type.includes('map')) {
      return <Map className="h-6 w-6" />;
    } else if (type.includes('scatter')) {
      return <ScatterChart className="h-6 w-6" />;
    } else {
      return <BarChart2 className="h-6 w-6" />;
    }
  };

  // Get background color based on visual type
  const getCardColor = (visualType: string) => {
    const type = visualType.toLowerCase();
    
    if (type.includes('bar') || type.includes('column')) {
      return 'bg-blue-50 dark:bg-blue-950';
    } else if (type.includes('line')) {
      return 'bg-green-50 dark:bg-green-950';
    } else if (type.includes('pie') || type.includes('donut')) {
      return 'bg-purple-50 dark:bg-purple-950';
    } else if (type.includes('map')) {
      return 'bg-amber-50 dark:bg-amber-950';
    } else if (type.includes('scatter')) {
      return 'bg-cyan-50 dark:bg-cyan-950';
    } else {
      return 'bg-gray-50 dark:bg-gray-900';
    }
  };

  // Helper to check if mapped fields has actual content
  const hasMappedFields = (mappedFields: Record<string, string | string[]>) => {
    // Check if there are any fields
    if (Object.keys(mappedFields).length === 0) {
      return false;
    }
    
    // Check if the only field is "fields" with value "Relevant Fields"
    if (
      Object.keys(mappedFields).length === 1 && 
      Object.keys(mappedFields)[0] === 'fields' && 
      mappedFields['fields'] === 'Relevant Fields'
    ) {
      return false;
    }
    
    return true;
  };

  // Clean up visual type if needed
  const cleanVisualType = (visualType: string) => {
    return visualType === 'Unknown' ? 'Visualization' : visualType;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5 text-purple-600" />
          <span>Visualization Suggestions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {suggestions.map((suggestion, index) => (
            <Card 
              key={index} 
              className={cn("overflow-hidden", getCardColor(suggestion.visual_type))}
            >
              <CardHeader className={cn("pb-2")}>
                <Badge variant="outline" className="self-start mb-2">
                  {cleanVisualType(suggestion.visual_type)}
                </Badge>
                <div className="flex items-center gap-3">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                    {getVisualIcon(suggestion.visual_type)}
                  </div>
                  <CardTitle className="text-base">{suggestion.chart_name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground mb-3">
                  {suggestion.description}
                </p>
                
                {hasMappedFields(suggestion.mapped_fields) ? (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="fields">
                      <AccordionTrigger className="text-sm py-2">
                        Mapped Fields
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-sm space-y-1">
                          {Object.entries(suggestion.mapped_fields).map(([key, value], i) => (
                            <div key={i} className="grid grid-cols-3 gap-2">
                              <span className="font-medium">{key}:</span>
                              <span className="col-span-2">
                                {Array.isArray(value) ? value.join(', ') : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <div className="text-sm flex items-center text-amber-600 gap-2 mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Recommended fields would depend on your specific data structure</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualSuggestions;
