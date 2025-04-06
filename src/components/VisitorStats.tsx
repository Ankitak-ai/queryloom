
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface VisitorStatsProps {
  className?: string;
}

const VisitorStats: React.FC<VisitorStatsProps> = ({ className }) => {
  const [stats, setStats] = useState<{ unique_visitors: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Using type assertion to work around type checking for the new function
        const { data, error } = await (supabase.rpc('get_visitor_stats') as any);
        if (error) throw error;
        setStats(data[0]);
      } catch (error) {
        console.error('Error fetching visitor stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div className="flex items-center">
        <Users className="h-4 w-4 text-purple-500 mr-1" />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {loading ? 'Loading stats...' : (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              {stats?.unique_visitors || 0} unique visitors
            </Badge>
          )}
        </span>
      </div>
    </div>
  );
};

export default VisitorStats;
