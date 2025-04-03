
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface QueryInputProps {
  onGenerateQuery: (query: string) => void;
  isGenerating: boolean;
}

const QueryInput: React.FC<QueryInputProps> = ({ onGenerateQuery, isGenerating }) => {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      onGenerateQuery(query);
    }
  };
  
  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Natural Language Query</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe what you want to query from the data in plain English. For example: 'Find all customers who made purchases last month' or 'Show me the average sales by product category'"
            className="min-h-[120px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-600"
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
