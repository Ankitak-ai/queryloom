
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';

interface UserQueriesProps {
  onSelectQuery: (query: string) => void;
  onQueryGenerated: string;
}

const UserQueries: React.FC<UserQueriesProps> = ({ onSelectQuery, onQueryGenerated }) => {
  const { user, queryUsage, getQueryLimit } = useAuth();
  const remainingQueries = getQueryLimit() - queryUsage.count;
  const resetTime = new Date(queryUsage.resetTime);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History size={18} className="text-purple-600" />
          Query Limits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Usage this hour:</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-purple-600 h-2.5 rounded-full" 
                style={{ width: `${(queryUsage.count / getQueryLimit()) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid gap-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{remainingQueries}</span> of <span className="font-medium">{getQueryLimit()}</span> queries remaining
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Limit resets at: <span className="font-medium">{resetTime.toLocaleTimeString()}</span>
            </p>
            {!user && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                Sign in to increase your query limit from 2 to 10 per hour
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserQueries;
