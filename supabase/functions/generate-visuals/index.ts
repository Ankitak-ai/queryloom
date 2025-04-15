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

    try {
      console.log("Sending request to NVIDIA LLaMA API");
      
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
Chart Type: [type]
Chart Title: [title]
Description: [description]
Mapped Fields:
- x-axis: [field name]
- y-axis: [field name]
- legend: [field name]
- tooltips: [field names]

DO NOT include the words "Unknown" or phrases like "Below are X chart suggestions" in your response.
DO NOT use markdown formatting like ** or ## in your response.
DO NOT repeat the phrase "Mapped Fields" multiple times.
Keep each field mapping on a single line prefixed with a dash (-).
`;

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
                content: "You are a Power BI visualization expert who provides clean, well-structured suggestions with complete details. Begin your response directly with the first chart suggestion without any introductory text or markdown formatting."
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
        // Fall back to rule-based suggestions instead of throwing an error
        console.log("NVIDIA API failed, falling back to rule-based suggestions");
        return new Response(
          JSON.stringify({ suggestions: generateFallbackSuggestions(datasets) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
    } catch (apiError) {
      console.error('API error:', apiError);
      // Instead of throwing, return fallback suggestions
      return new Response(
        JSON.stringify({ suggestions: generateFallbackSuggestions(datasets) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in generate-visuals function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        suggestions: [] // Return empty suggestions array to prevent frontend errors
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    const headers = dataset.headers || [];
    
    // Categorize fields by data type
    const categoricalFields: string[] = [];
    const numericFields: string[] = [];
    const dateFields: string[] = [];
    
    headers.forEach((header: string) => {
      const type = (dataset.dataTypes[header] || 'TEXT').toUpperCase();
      
      if (type === 'TEXT' || type === 'VARCHAR') {
        categoricalFields.push(header);
      } else if (type === 'INTEGER' || type === 'DECIMAL' || type === 'NUMBER' || type === 'FLOAT') {
        numericFields.push(header);
      } else if (type === 'DATE' || type === 'TIMESTAMP' || type === 'DATETIME') {
        dateFields.push(header);
      }
    });
    
    // Add a table visualization
    fallbackSuggestions.push({
      chart_name: `${datasetName} Table Overview`,
      description: "A comprehensive view of all data points for detailed analysis.",
      visual_type: "Table",
      mapped_fields: { columns: headers.join(', ') }
    });
    
    // Add a basic bar chart if there are category and numeric fields
    if (categoricalFields.length > 0 && numericFields.length > 0) {
      fallbackSuggestions.push({
        chart_name: `${numericFields[0]} by ${categoricalFields[0]}`,
        description: `Compare ${numericFields[0]} values across different ${categoricalFields[0]} categories.`,
        visual_type: "Bar Chart",
        mapped_fields: { 
          "y-axis": categoricalFields[0],
          "x-axis": numericFields[0]
        }
      });
    }
    
    // Add a line chart if there are date and numeric fields
    if (dateFields.length > 0 && numericFields.length > 0) {
      fallbackSuggestions.push({
        chart_name: `${numericFields[0]} Trend Over Time`,
        description: `Track how ${numericFields[0]} changes over time.`,
        visual_type: "Line Chart",
        mapped_fields: { 
          "x-axis": dateFields[0],
          "y-axis": numericFields[0]
        }
      });
    }
    
    // Add a pie chart if there are category and numeric fields
    if (categoricalFields.length > 0 && numericFields.length > 0) {
      fallbackSuggestions.push({
        chart_name: `${numericFields[0]} Distribution`,
        description: `Show the distribution of ${numericFields[0]} across ${categoricalFields[0]} categories.`,
        visual_type: "Pie Chart",
        mapped_fields: { 
          "legend": categoricalFields[0],
          "values": numericFields[0]
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
  
  // Remove markdown formatting like ** or ##
  cleanedText = cleanedText.replace(/(\*\*|##)/g, '');
  
  // Normalize double line breaks to ensure consistent section parsing
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  
  // Replace "Mapped Fields" followed immediately by another "Mapped Fields" (duplicate)
  cleanedText = cleanedText.replace(/Mapped Fields\s+Mapped Fields/g, 'Mapped Fields');
  
  // Remove duplication of chart types like "Bar Chart\nBar Chart"
  cleanedText = cleanedText.replace(/(\w+ Chart)\s+\1/gi, '$1');
  
  // Normalize field mapping lines to always start with "- "
  cleanedText = cleanedText.replace(/Mapped Fields:\s*(?:[-•*]\s*|(\w+):)/gm, function(match, p1) {
    if (p1) return `Mapped Fields:\n- ${p1}:`;
    else return match;
  });
  
  // Make sure there's a dash before each field in mapped fields
  const lines = cleanedText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    // If this is a line after "Mapped Fields:" that doesn't start with a dash
    if (i > 0 && 
        lines[i-1].includes('Mapped Fields:') && 
        !lines[i].trim().startsWith('-') && 
        lines[i].includes(':')) {
      lines[i] = '- ' + lines[i].trim();
    }
  }
  cleanedText = lines.join('\n');
  
  return cleanedText;
}

/**
 * Parses the AI-generated text to extract structured chart suggestions
 */
function parseChartSuggestions(text: string): VisualSuggestion[] {
  const suggestions: VisualSuggestion[] = [];
  
  try {
    // Split the text into sections, each representing a chart suggestion
    const chartSections = text.split(/(?=Chart Type:|(?:^|\n)\w+ Chart(?:\n|:))/gi).filter(Boolean);
    
    for (const section of chartSections) {
      try {
        // Extract chart type
        let visualType = "Unknown";
        const typeMatch = section.match(/Chart Type:?\s*([^\n]+)/i) || 
                        section.match(/\b(Bar Chart|Line Chart|Pie Chart|Area Chart|Scatter Plot|Waterfall Chart|Box Plot|Histogram|Table|Card|Gauge|Stacked Column Chart|Stacked Bar Chart|Treemap|Map)\b/i);
        
        if (typeMatch) {
          visualType = typeMatch[1].trim();
        }
        
        // Extract chart title
        let chartName = "";
        const titleMatch = section.match(/Chart Title:?\s*([^\n]+)/i) ||
                          section.match(/(?:^|\n)(?!Chart Type|Description|Mapped Fields)([^\n:]+)(?=\n|$)/);
        
        if (titleMatch) {
          chartName = titleMatch[1].trim();
        } else {
          // If no title found, use the visual type
          chartName = `${visualType} Visualization`;
        }
        
        // Extract description
        let description = "";
        const descMatch = section.match(/Description:?\s*([^\n]+(?:\n(?!Chart|Mapped Fields)[^\n]+)*)/i);
        
        if (descMatch) {
          description = descMatch[1].trim();
        }
        
        // Extract mapped fields
        const mappedFields: Record<string, string | string[]> = {};
        
        // Find the mapped fields section
        const mappedFieldsMatch = section.match(/Mapped Fields:([^]*?)(?=(?:\n\s*Chart Type|\n\s*Chart Title|$))/i);
        
        if (mappedFieldsMatch) {
          const mappedFieldsText = mappedFieldsMatch[1].trim();
          
          // Extract individual field mappings
          const fieldLines = mappedFieldsText.split('\n').filter(line => line.trim());
          
          for (const line of fieldLines) {
            // Extract field name and value using a regex that captures dash prefix
            const fieldMatch = line.match(/^-?\s*([^:]+):\s*(.+)$/);
            
            if (fieldMatch) {
              const [, fieldName, fieldValue] = fieldMatch;
              const cleanFieldName = fieldName.trim().toLowerCase().replace(/[-\s]+/g, '-');
              
              // Skip empty field names
              if (!cleanFieldName) continue;
              
              // Process field value
              if (fieldValue.includes(',')) {
                // Handle comma-separated lists
                mappedFields[cleanFieldName] = fieldValue.split(',').map(item => item.trim());
              } else {
                mappedFields[cleanFieldName] = fieldValue.trim();
              }
            }
          }
        }
        
        // Only add if we have at least a title or chart type
        if (chartName || visualType !== "Unknown") {
          suggestions.push({
            chart_name: chartName,
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
