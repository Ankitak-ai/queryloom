
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserQueriesProps {
  onSelectQuery: (query: string) => void;
  onQueryGenerated: string;
}

const UserQueries: React.FC<UserQueriesProps> = ({ onSelectQuery, onQueryGenerated }) => {
  const { user, queryUsage, getQueryLimit } = useAuth();
  const queryLimit = getQueryLimit();
  const remainingQueries = queryLimit - queryUsage.count;
  const resetTime = new Date(queryUsage.resetTime);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History size={18} className="text-purple-600" />
          Query Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Queries made this session:</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-purple-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min((queryUsage.count / queryLimit) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid gap-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{queryUsage.count}</span> queries made
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{remainingQueries >= 0 ? remainingQueries : 0}</span> queries remaining this hour
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Limit resets at: <span className="font-medium">{resetTime.toLocaleTimeString()}</span>
            </p>
          </div>

          <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {user ? 
                `As a logged-in user, you can make ${queryLimit} SQL queries per hour.` : 
                `Guest users can make ${queryLimit} SQL queries per hour. Sign in for higher limits.`}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserQueries;
