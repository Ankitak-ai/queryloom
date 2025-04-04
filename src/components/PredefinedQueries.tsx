
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book } from 'lucide-react';
import { toast } from '@/lib/toast';

interface PredefinedQuery {
  id: string;
  title: string;
  query_text: string;
  description: string | null;
}

interface PredefinedQueriesProps {
  onSelectQuery: (query: string) => void;
}

const PredefinedQueries: React.FC<PredefinedQueriesProps> = ({ onSelectQuery }) => {
  const [queries, setQueries] = useState<PredefinedQuery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredefinedQueries = async () => {
      try {
        // Use type assertion to work around TypeScript limitations
        const { data, error } = await (supabase as any)
          .from('predefined_queries')
          .select('*');
        
        if (error) throw error;
        setQueries(data || []);
      } catch (error: any) {
        console.error('Error fetching predefined queries:', error);
        toast.error('Failed to load predefined queries');
      } finally {
        setLoading(false);
      }
    };

    fetchPredefinedQueries();
  }, []);

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <p className="text-gray-500">Loading predefined queries...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (queries.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Book size={18} className="text-purple-600" />
          Sample Queries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {queries.map((query) => (
            <div key={query.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-sm">{query.title}</h3>
                <Badge variant="outline" className="text-xs">Example</Badge>
              </div>
              {query.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{query.description}</p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSelectQuery(query.query_text)}
                className="text-xs mt-2"
              >
                Use This Query
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PredefinedQueries;
