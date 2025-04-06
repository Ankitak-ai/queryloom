
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Database } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type SqlDialect = 'postgresql' | 'mysql' | 'sqlserver';

interface QueryInputProps {
  onGenerateQuery: (query: string, dialect: SqlDialect) => void;
  isGenerating: boolean;
  initialValue?: string;
}

const QueryInput: React.FC<QueryInputProps> = ({ onGenerateQuery, isGenerating, initialValue = '' }) => {
  const [query, setQuery] = useState(initialValue);
  const [dialect, setDialect] = useState<SqlDialect>('postgresql');
  
  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      onGenerateQuery(query, dialect);
    }
  };
  
  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain size={18} className="text-purple-600" />
            Natural Language Query
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe what you want to query from the data in plain English. For example: 'Find all customers who made purchases last month' or 'Show me the average sales by product category'"
            className="min-h-[120px] focus-visible:ring-purple-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-gray-500" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm text-gray-500">SQL Dialect:</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose the SQL dialect for your generated query</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Select
              value={dialect}
              onValueChange={(value) => setDialect(value as SqlDialect)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select SQL dialect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="sqlserver">SQL Server</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="bg-purple-600 hover:bg-purple-700"
            disabled={query.trim().length === 0 || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate SQL Query'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default QueryInput;
