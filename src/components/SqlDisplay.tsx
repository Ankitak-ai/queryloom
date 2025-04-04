
import React, { useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Brain, Code } from 'lucide-react';
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
    <Card className="w-full border-t-4 border-t-purple-500 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-xl">DeepSeek R1 Generated SQL</CardTitle>
        </div>
        <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy SQL" className="hover:bg-purple-100 dark:hover:bg-purple-900">
          <Copy className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="bg-gray-900 rounded-md p-4 overflow-x-auto shadow-inner border border-purple-200 dark:border-purple-900">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 font-mono">
            <Code className="h-4 w-4" />
            <span>SQL Query</span>
          </div>
          <pre ref={codeRef} className="text-green-400 font-mono text-sm whitespace-pre-wrap">
            {sql}
          </pre>
        </div>
        
        {explanation && (
          <div className="mt-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-md p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">AI Reasoning Explanation</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{explanation}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-gray-500 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
        <div className="flex items-center gap-2 w-full justify-between">
          <p>Powered by DeepSeek R1 Reasoning Model</p>
          <p className="italic">AI-generated SQL query ready for your database</p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SqlDisplay;
