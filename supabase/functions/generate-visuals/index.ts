
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define types locally for the edge function
interface VisualSuggestion {
  chart_name: string;
  description: string;
  visual_type: string;
  mapped_fields: Record<string, string | string[]>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { datasets } = await req.json();
    
    // Get the API key from Supabase secrets
    const apiKey = Deno.env.get("api_key");
    if (!apiKey) {
      console.error("API key not found in Supabase secrets");
      throw new Error("API key is not configured. Please set the api_key in your Supabase secrets.");
    }

    // Format dataset schema for the prompt
    const datasetDescriptions = datasets.map((dataset: any) => {
      const schema = Object.entries(dataset.dataTypes)
        .map(([col, type]) => `${col}: ${type}`)
        .join('\n');
      
      const sampleData = dataset.sampleRows.slice(0, 5);
      
      return `
Dataset: ${dataset.name}
Schema:
${schema}

Sample Data:
${JSON.stringify(sampleData, null, 2)}
      `;
    }).join('\n\n');

    // Create a prompt similar to the Python example
    const prompt = `
You are a data visualization expert. Based on the following dataset schema and samples, suggest 6 to 8 insightful charts that can be created in Power BI.

${datasetDescriptions}

Provide each suggestion with:
- Chart Type
- Chart Title
- Description of Insight
- Mapped Fields: (x-axis, y-axis, legend, tooltips, filters, etc.)

Ensure the chart types are appropriate for the data types and uncover trends, comparisons, or insights effectively.
`;

    console.log("Sending request to NVIDIA LLaMA API");
    
    // Call the NVIDIA LLaMA API
    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "nvidia/llama-3.3-nemotron-super-49b-v1",
          messages: [
            {
              role: "system",
              content: "You are a Power BI visualization expert."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.6,
          top_p: 0.7,
          max_tokens: 2048,
          frequency_penalty: 0,
          presence_penalty: 0
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('NVIDIA API error:', JSON.stringify(errorData));
      throw new Error(`NVIDIA API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("Received response from NVIDIA API");

    // Extract suggestions from the AI response
    const aiResponse = data.choices[0].message.content;
    
    // Parse the response into structured suggestions
    let suggestions: VisualSuggestion[] = [];
    
    try {
      // Attempt to extract chart suggestions from the response text
      suggestions = parseChartSuggestions(aiResponse);
    } catch (error) {
      console.error("Error parsing chart suggestions:", error);
      // Provide a fallback suggestion if parsing fails
      suggestions = [
        {
          chart_name: "Data Overview",
          description: "A general overview of the dataset based on available fields.",
          visual_type: "Table",
          mapped_fields: { columns: "All available fields" }
        }
      ];
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-visuals function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Parses the AI-generated text to extract structured chart suggestions
 */
function parseChartSuggestions(text: string): VisualSuggestion[] {
  const suggestions: VisualSuggestion[] = [];
  
  // First attempt to find numbered chart sections (e.g., "1. Monthly Order Amount Trend")
  const chartSections = text.split(/(?:###\s*\d+\.|\d+\.\s+)/g)
    .filter(section => section.trim().length > 0);
  
  if (chartSections.length <= 1) {
    // If we don't find chart sections using numbers, try with chart headings
    const regex = /(?:###\s*|##\s*|#\s*|[*]{3}\s*)([^#\n]+)(?:\r?\n|\r)[\s\S]*?(?=(?:###\s*|##\s*|#\s*|[*]{3}\s*)|$)/g;
    let match;
    const matches = [];
    
    let textCopy = text;
    while ((match = regex.exec(textCopy)) !== null) {
      matches.push(match[0]);
    }
    
    if (matches.length > 0) {
      for (const section of matches) {
        parseSection(section, suggestions);
      }
    } else {
      // If we still don't find sections, try to parse the whole text
      parseSection(text, suggestions);
    }
  } else {
    // Process each chart section we found
    for (const section of chartSections) {
      parseSection(section, suggestions);
    }
  }
  
  // If no suggestions were found, return a default one
  if (suggestions.length === 0) {
    return [{
      chart_name: "Data Overview",
      description: "A general overview of the dataset based on available fields.",
      visual_type: "Table",
      mapped_fields: { columns: "All available fields" }
    }];
  }
  
  return suggestions;
}

/**
 * Parse an individual chart section and add it to suggestions
 */
function parseSection(section: string, suggestions: VisualSuggestion[]): void {
  try {
    // Extract chart name (title)
    const titleMatch = section.match(/(?:\*\*)?Chart Title(?:\*\*)?\s*:\s*([^\n]+)/i) || 
                      section.match(/(?:\*\*)?Title(?:\*\*)?\s*:\s*([^\n]+)/i) ||
                      section.match(/^(?:\*\*)?([^*\n]+)(?:\*\*)?/m);
    
    if (!titleMatch) return;
    const chartName = titleMatch[1].trim();
    
    // Extract chart type
    const typeMatch = section.match(/(?:\*\*)?Chart Type(?:\*\*)?\s*:\s*([^\n]+)/i) ||
                     section.match(/(?:\*\*)?Type(?:\*\*)?\s*:\s*([^\n]+)/i);
    const visualType = typeMatch ? typeMatch[1].trim() : "Unknown";
    
    // Extract description
    const descMatch = section.match(/(?:\*\*)?Description(?:\*\*)?\s*:?\s*([^\n]+(?:\n[^-\n*#]+)*)/i) ||
                     section.match(/(?:\*\*)?Description of Insight(?:\*\*)?\s*:?\s*([^\n]+(?:\n[^-\n*#]+)*)/i) ||
                     section.match(/(?:\*\*)?Insight(?:\*\*)?\s*:?\s*([^\n]+(?:\n[^-\n*#]+)*)/i);
    const description = descMatch ? descMatch[1].trim() : "";
    
    // Extract mapped fields
    const mappedFields: Record<string, string | string[]> = {};
    
    // Find the mapped fields section
    const fieldsSection = section.match(/(?:\*\*)?Mapped Fields(?:\*\*)?\s*:?\s*([\s\S]+?)(?=(?:\*\*[^*]+\*\*:|$))/i);
    
    if (fieldsSection) {
      // Look for field mappings like "X-axis: Order Date"
      const fieldLines = fieldsSection[1].split('\n');
      
      for (const line of fieldLines) {
        const fieldMatch = line.match(/[•-]\s*(?:\*\*)?([^:]+)(?:\*\*)?\s*:\s*(.+)/i) ||
                          line.match(/(?:\*\*)?([^:]+)(?:\*\*)?\s*:\s*(.+)/i);
        
        if (fieldMatch) {
          const [, fieldName, fieldValue] = fieldMatch;
          if (fieldName && fieldValue) {
            // Clean up field names for consistent mapping
            const cleanFieldName = fieldName.trim().toLowerCase()
              .replace(/[\s-]+/g, '-');
            
            // Handle cases where field values are marked with **bold**
            let cleanFieldValue = fieldValue.trim()
              .replace(/^\*\*|\*\*$/g, '');
            
            // Check if the field value is a list
            if (cleanFieldValue.includes(',')) {
              mappedFields[cleanFieldName] = cleanFieldValue.split(',')
                .map(item => item.trim());
            } else {
              mappedFields[cleanFieldName] = cleanFieldValue;
            }
          }
        }
      }
    }
    
    // Add this chart suggestion to our results
    if (chartName) {
      suggestions.push({
        chart_name: chartName,
        description: description,
        visual_type: visualType,
        mapped_fields: mappedFields
      });
    }
  } catch (e) {
    console.error("Error parsing section:", e);
  }
}
