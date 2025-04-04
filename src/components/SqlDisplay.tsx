
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
  
  const formatExplanation = (text: string) => {
    if (!text) return null;

    const sections = text.split(/###\s+([\d\.]+\s+[^#\n]+)/g);
    
    if (sections.length > 1) {
      return (
        <div className="space-y-4">
          {sections.map((section, index) => {
            if (index % 2 === 1) {
              return (
                <h3 key={index} className="text-base font-semibold text-purple-700 dark:text-purple-300 mt-6 border-b border-purple-100 dark:border-purple-800 pb-1">
                  {section}
                </h3>
              );
            } 
            else if (index > 0 && section.trim()) {
              const subsections = section.split(/####\s+([a-z]\.+\s+[^#\n]+)/g);
              
              if (subsections.length > 1) {
                return (
                  <div key={index} className="space-y-3">
                    {subsections.map((subsection, subIndex) => {
                      if (subIndex % 2 === 1) {
                        return (
                          <h4 key={`${index}-${subIndex}`} className="text-sm font-semibold text-purple-600 dark:text-purple-400 mt-4">
                            {subsection}
                          </h4>
                        );
                      } 
                      else if (subIndex > 0 && subsection.trim()) {
                        return (
                          <div key={`${index}-${subIndex}`} className="pl-4 border-l-2 border-purple-100 dark:border-purple-900">
                            {formatContent(subsection)}
                          </div>
                        );
                      }
                      else if (subIndex === 0 && subsection.trim()) {
                        return formatContent(subsection, `${index}-${subIndex}`);
                      }
                      return null;
                    })}
                  </div>
                );
              } else {
                return formatContent(section, index);
              }
            }
            return null;
          })}
        </div>
      );
    }
    
    return formatContent(text);
  };
  
  const formatContent = (content: string, key?: string | number) => {
    if (!content.trim()) return null;
    
    const parts = content.split(/```sql\s*([\s\S]*?)```/g);
    
    const processNumberedLists = (text: string) => {
      const listItems = text.split(/(\d+\.\s+)/g);
      if (listItems.length > 2) {
        return (
          <ul className="list-decimal pl-6 space-y-2 my-3">
            {listItems.map((item, idx) => {
              if (idx % 2 === 1) {
                const nextItem = listItems[idx + 1] || '';
                return (
                  <li key={idx} className="pl-1">
                    {formatBoldText(nextItem)}
                  </li>
                );
              }
              else if (idx === 0 && item.trim()) {
                return (
                  <div key={idx} className="mb-2">
                    {formatBoldText(item)}
                  </div>
                );
              }
              return null;
            })}
          </ul>
        );
      }
      return formatBoldText(text);
    };
    
    return (
      <div key={key} className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
        {parts.map((part, partIndex) => {
          if (partIndex % 2 === 1) {
            return (
              <div key={partIndex} className="bg-gray-800 rounded p-3 my-3 text-green-400 font-mono text-xs overflow-x-auto">
                {part.trim()}
              </div>
            );
          } 
          else if (part.trim()) {
            const paragraphs = part.split(/\n\n+/);
            return (
              <div key={partIndex} className="space-y-3">
                {paragraphs.map((para, paraIndex) => {
                  if (para.trim()) {
                    if (/^\d+\.\s+/.test(para)) {
                      return (
                        <div key={paraIndex} className="my-2">
                          {processNumberedLists(para)}
                        </div>
                      );
                    } else if (para.includes('-')) {
                      const bulletItems = para.split(/\n\s*-\s+/);
                      if (bulletItems.length > 1) {
                        return (
                          <ul key={paraIndex} className="list-disc pl-6 space-y-2 my-3">
                            {bulletItems.map((item, itemIdx) => {
                              if (itemIdx === 0 && !item.trim()) return null;
                              return (
                                <li key={itemIdx} className="pl-1">
                                  {formatBoldText(itemIdx === 0 ? item : `${item}`)}
                                </li>
                              );
                            })}
                          </ul>
                        );
                      }
                    }
                    return (
                      <p key={paraIndex} className="leading-relaxed">
                        {formatBoldText(para)}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };
  
  const formatBoldText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
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
    <Card className="w-full border-t-4 border-t-purple-500 shadow-lg mt-6">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-xl">DeepSeek R1 Generated SQL</CardTitle>
        </div>
        <div className="flex gap-2">
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
        <div className="flex items-center gap-2 w-full">
          <p>Powered by DeepSeek R1 Reasoning Model</p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SqlDisplay;
