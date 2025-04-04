import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';

interface UserQuery {
  id: string;
  query_text: string;
  created_at: string;
}

interface UserQueriesProps {
  onSelectQuery: (query: string) => void;
  onQueryGenerated: string; // We need to change this to a string to match how it's being used
}

const UserQueries: React.FC<UserQueriesProps> = ({ onSelectQuery, onQueryGenerated }) => {
  const [queries, setQueries] = useState<UserQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setQueries([]);
      setLoading(false);
      return;
    }

    const fetchUserQueries = async () => {
      try {
        // Use type assertion to work around TypeScript limitations
        const { data, error } = await (supabase as any)
          .from('user_queries')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setQueries(data || []);
      } catch (error: any) {
        console.error('Error fetching user queries:', error);
        toast.error('Failed to load your saved queries');
      } finally {
        setLoading(false);
      }
    };

    fetchUserQueries();
  }, [user, onQueryGenerated]);

  if (!user) return null;

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (queries.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <History size={18} className="text-purple-600" />
            Your Queries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            You haven't saved any queries yet. Generated queries will be saved automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History size={18} className="text-purple-600" />
          Your Queries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {queries.map((query) => (
            <div key={query.id} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs text-gray-500">
                  {new Date(query.created_at).toLocaleString()}
                </p>
              </div>
              <p className="text-sm line-clamp-2 mb-2">{query.query_text}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSelectQuery(query.query_text)}
                className="text-xs"
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

export default UserQueries;
