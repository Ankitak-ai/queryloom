import React, { useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Brain, Code, ExternalLink, List } from 'lucide-react';
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

  const openInSupabase = () => {
    // Encode the SQL query for URL
    const encodedSql = encodeURIComponent(sql);
    
    // Open Supabase SQL Editor with the pre-filled query
    window.open(`https://supabase.com/dashboard/project/vsevsjvtrshgeiudrnth/sql/new?query=${encodedSql}`, '_blank');
    
    toast.success('Opening SQL Editor in Supabase');
  };
  
  const formatExplanation = (text: string) => {
    if (!text) return null;

    // Split by numbered points if they exist
    const sections = text.split(/(\d+\.\s+\*\*[\w\s]+:?\*\*)/g);
    
    if (sections.length > 1) {
      return (
        <div className="space-y-4">
          {sections.map((section, index) => {
            if (section.match(/^\d+\.\s+\*\*[\w\s]+:?\*\*/)) {
              // This is a section header
              return (
                <h4 key={index} className="text-base font-semibold text-purple-700 dark:text-purple-300 mt-4">
                  {section.replace(/\*\*/g, '')}
                </h4>
              );
            } else if (section.trim()) {
              // This is content
              return (
                <p key={index} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-4 border-l-2 border-purple-200 dark:border-purple-800">
                  {formatBoldText(section)}
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }
    
    // If no numbered sections, check for dash-prefixed bullet points
    const bulletPoints = text.split(/(-\s+\*\*[\w\s]+:?\*\*)/g);
    if (bulletPoints.length > 1) {
      return (
        <div className="space-y-2">
          {bulletPoints.map((point, index) => {
            if (point.match(/-\s+\*\*[\w\s]+:?\*\*/)) {
              return (
                <div key={index} className="flex items-start gap-2 mt-2">
                  <List className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                  <h4 className="text-base font-semibold text-purple-700 dark:text-purple-300">
                    {point.replace(/-\s+\*\*|\*\*/g, '')}
                  </h4>
                </div>
              );
            } else if (point.trim()) {
              return (
                <p key={index} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-6 ml-4">
                  {formatBoldText(point)}
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }
    
    // Otherwise, just apply paragraph styling with some enhancements
    return (
      <div className="space-y-4">
        {text.split('\n\n').map((paragraph, index) => (
          <p key={index} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {formatBoldText(paragraph)}
          </p>
        ))}
      </div>
    );
  };
  
  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-purple-800 dark:text-purple-300">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={openInSupabase} 
            title="Run in Supabase" 
            className="hover:bg-purple-100 dark:hover:bg-purple-900"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={copyToClipboard} 
            title="Copy SQL" 
            className="hover:bg-purple-100 dark:hover:bg-purple-900"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
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
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">AI Reasoning Explanation</h3>
            </div>
            {formatExplanation(explanation)}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-gray-500 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
        <div className="flex items-center gap-2 w-full justify-between">
          <p>Powered by DeepSeek R1 Reasoning Model</p>
          <div className="flex items-center gap-1">
            <Button 
              variant="link" 
              className="h-auto p-0 text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
              onClick={openInSupabase}
            >
              <span className="inline-flex items-center">
                Run in Supabase SQL Editor
                <ExternalLink className="ml-1 h-3 w-3" />
              </span>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SqlDisplay;
