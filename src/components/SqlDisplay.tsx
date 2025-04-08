
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Database, Copy, Check, Files } from 'lucide-react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from '@/lib/toast';
import { Badge } from '@/components/ui/badge';
import type { SqlDialect } from '@/components/QueryInput';

interface SqlDisplayProps {
  sql: string;
  explanation: string;
  dialect?: SqlDialect;
}

const SqlDisplay: React.FC<SqlDisplayProps> = ({ sql, explanation, dialect = 'postgresql' }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    toast.success('SQL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const dialectLabels = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    sqlserver: 'SQL Server'
  };

  // Format tables and add spacing after headings in explanation
  const formattedExplanation = explanation
    .replace(/\|\s*(.*?)\s*\|/g, (match) => `\n\n${match}\n\n`)
    .replace(/#+\s+(.*?)\n/g, (match) => `${match}\n`); // Add extra newline after headings

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Files size={18} className="text-purple-600" />
          Generated SQL Query
          {dialect && (
            <Badge variant="outline" className="ml-2 text-xs font-normal">
              {dialectLabels[dialect]}
            </Badge>
          )}
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          onClick={copyToClipboard}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sql" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sql" className="flex items-center gap-1">
              <Database size={14} />
              SQL
            </TabsTrigger>
            <TabsTrigger value="explanation" className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              Explanation
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sql">
            <div className="rounded-md overflow-hidden">
              <SyntaxHighlighter
                language="sql"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              >
                {sql}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
          <TabsContent value="explanation">
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm 
              prose-headings:font-semibold prose-headings:text-purple-700 dark:prose-headings:text-purple-400 
              prose-headings:mt-6 prose-headings:mb-4
              prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:my-3
              prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-a:font-medium 
              prose-strong:text-gray-800 dark:prose-strong:text-gray-200 
              prose-code:text-purple-600 dark:prose-code:text-purple-400 
              prose-code:bg-purple-50 dark:prose-code:bg-purple-900/30 
              prose-code:px-1 prose-code:py-0.5 prose-code:rounded 
              prose-code:before:content-[''] prose-code:after:content-['']
              prose-table:border-collapse prose-table:w-full prose-table:my-4
              prose-th:border prose-th:border-slate-300 dark:prose-th:border-slate-700 prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-th:p-2 prose-th:text-left
              prose-td:border prose-td:border-slate-300 dark:prose-td:border-slate-700 prose-td:p-2">
              <Markdown>
                {formattedExplanation}
              </Markdown>
              
              {explanation.includes('SQL Server') && (
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-3">SQL Server Optimization Tips</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Consider adding indexes on frequently queried columns</li>
                    <li>Use appropriate data types to improve query performance</li>
                    <li>Regularly update statistics for better query plans</li>
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SqlDisplay;
