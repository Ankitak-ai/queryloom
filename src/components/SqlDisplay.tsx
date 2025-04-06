
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Database, Copy, Check, FileSql } from 'lucide-react';
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

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSql size={18} className="text-purple-600" />
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
            <div className="prose prose-sm dark:prose-invert max-w-none overflow-auto p-4 rounded-md bg-gray-50 dark:bg-gray-900">
              <Markdown>{explanation}</Markdown>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SqlDisplay;
