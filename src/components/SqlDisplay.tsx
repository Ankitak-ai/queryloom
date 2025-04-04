
import React, { useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from '@/lib/toast';

interface SqlDisplayProps {
  sql: string;
  explanation?: string;
}

const SqlDisplay: React.FC<SqlDisplayProps> = ({ sql, explanation }) => {
  const codeRef = useRef<HTMLPreElement>(null);
  
  const copyToClipboard = () => {
    if (sql) {
      navigator.clipboard.writeText(sql);
      toast.success('SQL query copied to clipboard');
    }
  };
  
  if (!sql) {
    return null;
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Generated SQL Query</CardTitle>
        <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy SQL">
          <Copy className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-900 rounded-md p-4 overflow-x-auto">
          <pre ref={codeRef} className="text-green-400 font-mono text-sm whitespace-pre-wrap">
            {sql}
          </pre>
        </div>
        
        {explanation && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="text-sm font-medium mb-2">Explanation</h3>
            <p className="text-gray-700 text-sm">{explanation}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        <p>You can copy this query and run it directly in your SQL database client</p>
      </CardFooter>
    </Card>
  );
};

export default SqlDisplay;
