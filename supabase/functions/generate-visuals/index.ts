
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
1. Chart Type (specify the exact visualization type in Power BI)
2. Chart Title (be descriptive and specific)
3. Description of Insight (explain what insights can be gained)
4. Mapped Fields (specify how to configure the visualization in Power BI)

Format each visualization suggestion as follows:
### Chart Title
* Chart Type: [type]
* Description: [description]
* Mapped Fields:
  - x-axis: [field name]
  - y-axis: [field name]
  - legend: [field name]
  - tooltips: [field names]

DO NOT include the words "Unknown" or phrases like "Below are X chart suggestions" in your response.
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
              content: "You are a Power BI visualization expert who provides clear, well-structured suggestions with complete details. Begin your response directly with the first chart suggestion without any introductory text."
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
    console.log("AI response content received");
    
    // Parse the response into structured suggestions
    let suggestions: VisualSuggestion[] = [];
    
    try {
      // Clean the response text before parsing
      const cleanedResponse = cleanResponseText(aiResponse);
      
      // Attempt to extract chart suggestions from the cleaned response text
      suggestions = parseChartSuggestions(cleanedResponse);
      console.log(`Successfully parsed ${suggestions.length} chart suggestions`);
    } catch (error) {
      console.error("Error parsing chart suggestions:", error);
      // Provide a fallback suggestion if parsing fails
      suggestions = generateFallbackSuggestions(datasets);
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
 * Generates fallback suggestions when parsing fails
 */
function generateFallbackSuggestions(datasets: any[]): VisualSuggestion[] {
  const fallbackSuggestions: VisualSuggestion[] = [];
  
  // Generate basic suggestions for each dataset
  datasets.forEach((dataset) => {
    const datasetName = dataset.name;
    
    // Add a table visualization
    fallbackSuggestions.push({
      chart_name: `${datasetName} Table Overview`,
      description: "A comprehensive view of all data points for detailed analysis.",
      visual_type: "Table",
      mapped_fields: { columns: "All available fields" }
    });
    
    // Add a basic bar chart if there are headers
    if (dataset.headers && dataset.headers.length >= 2) {
      fallbackSuggestions.push({
        chart_name: `${datasetName} Basic Analysis`,
        description: "Basic comparison of values across categories.",
        visual_type: "Bar Chart",
        mapped_fields: { 
          "x-axis": dataset.headers[0],
          "y-axis": dataset.headers[1]
        }
      });
    }
  });
  
  return fallbackSuggestions;
}

/**
 * Cleans the response text by removing problematic patterns and irrelevant text
 */
function cleanResponseText(text: string): string {
  // Remove the "Unknown" text that sometimes appears at the beginning
  let cleanedText = text.replace(/^Unknown\s+/i, '');
  
  // Remove phrases like "Below are 6 to 8 insightful chart suggestions" that sometimes appear
  cleanedText = cleanedText.replace(/Below are \d+ to \d+ insightful chart suggestions.+?formatted as requested:?\s*/i, '');
  
  // Remove any duplicate sections of "ful chart suggestions..."
  cleanedText = cleanedText.replace(/ful chart suggestions.+?formatted as requested:?\s*/gi, '');
  
  // Remove any remaining prefixes like "Here are the chart suggestions:"
  cleanedText = cleanedText.replace(/^(Here are|Following are)\s+the\s+chart suggestions:?\s*/i, '');
  
  // Remove any markdown-style list numbering
  cleanedText = cleanedText.replace(/^\d+\.\s+/gm, '');
  
  // Normalize double line breaks to ensure consistent section parsing
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  
  // Replace "Mapped Fields" followed immediately by another "Mapped Fields" (duplicate)
  cleanedText = cleanedText.replace(/Mapped Fields\s+Mapped Fields/g, 'Mapped Fields');
  
  // Remove duplication of chart types like "Bar Chart\nBar Chart"
  cleanedText = cleanedText.replace(/(\w+ Chart)\s+\1/gi, '$1');
  
  return cleanedText;
}

/**
 * Parses the AI-generated text to extract structured chart suggestions
 */
function parseChartSuggestions(text: string): VisualSuggestion[] {
  const suggestions: VisualSuggestion[] = [];
  
  try {
    // Look for sections starting with ### or Chart Title patterns
    const sectionRegex = /(?:###\s*([^#\n]+)|(?:^|\n)(?:\*\s*Chart Type:|\d+\.\s*)[^\n]*\n[^\n]*Chart Title[^\n]*:\s*([^\n]+))/gi;
    let sectionMatch;
    let sections: Array<{title: string, content: string}> = [];
    let lastIndex = 0;
    
    // Find all section headers
    while ((sectionMatch = sectionRegex.exec(text)) !== null) {
      const title = sectionMatch[1] || sectionMatch[2];
      const startIndex = sectionMatch.index;
      
      // If this isn't the first match, capture the previous section content
      if (lastIndex > 0) {
        const previousSection = sections[sections.length - 1];
        previousSection.content = text.substring(lastIndex, startIndex).trim();
      }
      
      sections.push({ title: title.trim(), content: "" });
      lastIndex = startIndex + sectionMatch[0].length;
    }
    
    // Capture the content of the last section
    if (sections.length > 0) {
      sections[sections.length - 1].content = text.substring(lastIndex).trim();
    }
    
    // If no sections were found using headers, try splitting by "Mapped Fields"
    if (sections.length === 0) {
      const parts = text.split(/(?:\n|^)Mapped Fields(?:\n|$)/gi);
      
      // If we have at least 2 parts (meaning at least one "Mapped Fields" was found)
      if (parts.length > 1) {
        for (let i = 0; i < parts.length - 1; i++) {
          // Extract title from the content before "Mapped Fields"
          const titleMatch = parts[i].match(/(?:^|\n)(?:\*\s*Chart Title:|\d+\.\s*)?([^\n]+)$/);
          const title = titleMatch ? titleMatch[1].trim() : `Chart Suggestion ${i + 1}`;
          
          // The content is the part after "Mapped Fields"
          const content = "Mapped Fields" + parts[i + 1];
          
          sections.push({ title, content });
        }
      }
    }
    
    // Process each section to extract chart details
    for (const section of sections) {
      try {
        // Extract chart type
        let visualType = "Unknown";
        const typeMatch = section.content.match(/\*\s*Chart Type:?\s*([^\n]+)/i) || 
                        section.content.match(/\b(Bar Chart|Line Chart|Pie Chart|Area Chart|Scatter Plot|Waterfall Chart|Box Plot|Histogram|Table|Card|Gauge|Stacked Column Chart|Stacked Bar Chart|Treemap|Map)\b/i);
        
        if (typeMatch) {
          visualType = typeMatch[1].trim();
        }
        
        // Extract description
        let description = "";
        const descMatch = section.content.match(/\*\s*Description:?\s*([^\n]+)/i) ||
                        section.content.match(/(?:^|\n)(?!Mapped Fields)([^\n]+)(?=\n|$)/);
        
        if (descMatch) {
          description = descMatch[1].trim();
        }
        
        // Extract mapped fields
        const mappedFields: Record<string, string | string[]> = {};
        
        // Look for field mappings patterns like "* x-axis: field_name" or "- x-axis: field_name"
        const fieldMatches = section.content.matchAll(/[*\-•]\s*([^:*\n]+?):\s*([^\n]+)/g);
        
        let hasFields = false;
        for (const match of fieldMatches) {
          const fieldName = match[1].trim().toLowerCase().replace(/[-\s]+/g, '-');
          let fieldValue = match[2].trim();
          
          // Skip title and description fields that might get matched
          if (fieldName === 'chart-type' || fieldName === 'description' || fieldName === 'chart-title') {
            continue;
          }
          
          hasFields = true;
          
          // Remove backticks and formatting
          fieldValue = fieldValue.replace(/`/g, '').replace(/\*\*/g, '');
          
          // Handle comma-separated lists
          if (fieldValue.includes(',')) {
            mappedFields[fieldName] = fieldValue.split(',').map(item => item.trim());
          } else {
            mappedFields[fieldName] = fieldValue;
          }
        }
        
        // If no fields were extracted using the pattern above, look for simple field lists
        if (!hasFields) {
          const fieldsSection = section.content.split(/Mapped Fields/i)[1];
          if (fieldsSection) {
            // Try a simpler approach - just look for lines with colons
            const simpleFields = fieldsSection.match(/([^:\n]+):\s*([^\n]+)/g);
            if (simpleFields) {
              for (const field of simpleFields) {
                const [name, value] = field.split(':').map(part => part.trim());
                const fieldName = name.toLowerCase().replace(/[-\s]+/g, '-');
                
                if (value.includes(',')) {
                  mappedFields[fieldName] = value.split(',').map(item => item.trim());
                } else {
                  mappedFields[fieldName] = value;
                }
                hasFields = true;
              }
            }
          }
        }
        
        // Only add if we have at least a title or chart type
        if (section.title || visualType !== "Unknown") {
          suggestions.push({
            chart_name: section.title || `${visualType} Visualization`,
            description: description || `A ${visualType.toLowerCase()} visualization.`,
            visual_type: visualType,
            mapped_fields: Object.keys(mappedFields).length > 0 ? 
              mappedFields : 
              { fields: "Recommended fields would depend on your specific data structure" }
          });
        }
      } catch (e) {
        console.error("Error parsing section:", e);
      }
    }
  } catch (error) {
    console.error("Error in initial parsing:", error);
  }
  
  // Deduplicate suggestions by chart name
  const uniqueSuggestions: VisualSuggestion[] = [];
  const seen = new Set<string>();
  
  for (const suggestion of suggestions) {
    if (!seen.has(suggestion.chart_name)) {
      seen.add(suggestion.chart_name);
      uniqueSuggestions.push(suggestion);
    }
  }
  
  // If no suggestions were found, provide a basic fallback
  if (uniqueSuggestions.length === 0) {
    console.log("No suggestions parsed, returning fallback");
    return [{
      chart_name: "Data Overview",
      description: "A general overview of the dataset based on available fields.",
      visual_type: "Table",
      mapped_fields: { columns: "All available fields" }
    }];
  }
  
  return uniqueSuggestions;
}
