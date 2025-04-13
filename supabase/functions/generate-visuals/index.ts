
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
- Chart Type (specify the exact visualization type in Power BI)
- Chart Title (be descriptive and specific)
- Description of Insight (explain what insights can be gained)
- Mapped Fields (specify how to configure the visualization in Power BI)

For Mapped Fields, list each field with its corresponding target in this format:
* x-axis: [field name]
* y-axis: [field name]
* legend: [field name]
* tooltips: [field names]

Format each visualization suggestion clearly with headings and ensure the mapped fields are properly structured.
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
              content: "You are a Power BI visualization expert who provides clear, well-structured suggestions with complete details."
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
    console.log("AI response content:", aiResponse);
    
    // Parse the response into structured suggestions
    let suggestions: VisualSuggestion[] = [];
    
    try {
      // Attempt to extract chart suggestions from the response text
      suggestions = parseChartSuggestions(aiResponse);
      console.log(`Successfully parsed ${suggestions.length} chart suggestions`);
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
  
  try {
    // First try to find numbered chart sections
    const regex = /(?:\d+\.\s+|###\s*|##\s*|\*\*Chart\s+\d+\*\*:\s*|\*\*\d+\.\s*)/i;
    const chartSections = text.split(regex).filter(section => section && section.trim().length > 10);
    
    if (chartSections.length <= 1) {
      // If we don't find chart sections, try a different approach
      console.log("Didn't find expected chart sections, trying alternative parsing");
      
      // Look for chart types as section headers
      const chartTypeRegex = /(?:Bar Chart|Line Chart|Pie Chart|Area Chart|Scatter Chart|Waterfall Chart|Box Plot|Histogram|Table|Card|Gauge)/gi;
      let match;
      let lastIndex = 0;
      const matches = [];
      
      while ((match = chartTypeRegex.exec(text)) !== null) {
        const sectionStart = match.index;
        
        // If this isn't the first match, add the previous section
        if (lastIndex > 0) {
          const section = text.substring(lastIndex, sectionStart).trim();
          if (section.length > 0) {
            matches.push(section);
          }
        }
        
        lastIndex = sectionStart;
      }
      
      // Add the last section
      if (lastIndex > 0 && lastIndex < text.length) {
        const section = text.substring(lastIndex).trim();
        if (section.length > 0) {
          matches.push(section);
        }
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
      console.log(`Found ${chartSections.length} chart sections`);
      // Process each chart section we found
      for (const section of chartSections) {
        if (section.trim().length > 0) {
          parseSection(section, suggestions);
        }
      }
    }
  } catch (error) {
    console.error("Error in initial parsing:", error);
  }
  
  // If no suggestions were found, provide a basic fallback
  if (suggestions.length === 0) {
    console.log("No suggestions parsed, returning fallback");
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
    console.log("Parsing section:", section.substring(0, 100) + "...");
    
    // Extract chart type
    let visualType = "Unknown";
    const typeMatch = section.match(/(?:Chart Type|Type)(?:\*\*)?\s*:?\s*([^\n]+)/i) ||
                      section.match(/^\s*(Bar Chart|Line Chart|Pie Chart|Area Chart|Scatter Chart|Waterfall Chart|Box Plot|Histogram|Table|Card|Gauge)/i);
    
    if (typeMatch) {
      visualType = typeMatch[1].trim();
    }
    
    // Extract chart name/title
    let chartName = "Untitled Chart";
    const titleMatch = section.match(/(?:Chart Title|Title)(?:\*\*)?\s*:?\s*([^\n]+)/i) ||
                      section.match(/^\s*(?:\*\*)?([^:*\n]+)(?:\*\*)?(?=\s*(?:\n|$|:))/m);
    
    if (titleMatch) {
      chartName = titleMatch[1].trim();
    }
    
    // Extract description
    let description = "";
    const descMatch = section.match(/(?:Description(?:\s+of\s+Insight)?|Insight)(?:\*\*)?\s*:?\s*([^\n]+(?:\n[^*#\n]+)*)/i);
    
    if (descMatch) {
      description = descMatch[1].trim();
    }
    
    // Extract mapped fields
    const mappedFields: Record<string, string | string[]> = {};
    
    // Look for a "Mapped Fields" section
    const fieldsSectionMatch = section.match(/Mapped Fields(?:\*\*)?\s*:?\s*([\s\S]+?)(?=(?:\n\s*(?:Chart Type|Type|Title|Description|Insight)|$))/i);
    
    if (fieldsSectionMatch) {
      const fieldsSection = fieldsSectionMatch[1];
      
      // Extract field mappings like "x-axis: field_name"
      const fieldMatches = fieldsSection.matchAll(/(?:[•*-]\s*)?(?:\*\*)?([^:*\n]+?)(?:\*\*)?\s*:\s*([^\n]+)/gi);
      
      for (const match of fieldMatches) {
        const [, fieldName, fieldValue] = match;
        if (fieldName && fieldValue) {
          const cleanFieldName = fieldName.trim().toLowerCase()
            .replace(/[-\s]+/g, '-');
          
          let cleanFieldValue = fieldValue.trim()
            .replace(/^\*\*|\*\*$/g, '');
          
          // Handle comma-separated lists
          if (cleanFieldValue.includes(',')) {
            mappedFields[cleanFieldName] = cleanFieldValue.split(',')
              .map(item => item.trim());
          } else {
            mappedFields[cleanFieldName] = cleanFieldValue;
          }
        }
      }
    }
    
    // Bullet point parsing for mapped fields, if the previous method found nothing
    if (Object.keys(mappedFields).length === 0) {
      const bulletMatches = section.matchAll(/[•*-]\s*([^:]+):\s*([^\n]+)/g);
      
      for (const match of bulletMatches) {
        const [, fieldName, fieldValue] = match;
        if (fieldName && fieldValue) {
          const cleanFieldName = fieldName.trim().toLowerCase()
            .replace(/[-\s]+/g, '-');
          
          let cleanFieldValue = fieldValue.trim();
          
          if (cleanFieldValue.includes(',')) {
            mappedFields[cleanFieldName] = cleanFieldValue.split(',')
              .map(item => item.trim());
          } else {
            mappedFields[cleanFieldName] = cleanFieldValue;
          }
        }
      }
    }
    
    // If we still have no mapped fields but there's a chart name, add a default mapping
    if (Object.keys(mappedFields).length === 0 && chartName !== "Untitled Chart") {
      if (visualType.toLowerCase().includes('bar') || visualType.toLowerCase().includes('column')) {
        mappedFields['x-axis'] = 'Category Field';
        mappedFields['y-axis'] = 'Value Field';
      } else if (visualType.toLowerCase().includes('line')) {
        mappedFields['x-axis'] = 'Time Field';
        mappedFields['y-axis'] = 'Value Field';
      } else if (visualType.toLowerCase().includes('pie')) {
        mappedFields['legend'] = 'Category Field';
        mappedFields['values'] = 'Value Field';
      } else {
        mappedFields['fields'] = 'Relevant Fields';
      }
    }
    
    // Add the suggestion if we have at least a chart name
    if (chartName !== "Untitled Chart") {
      suggestions.push({
        chart_name: chartName,
        description: description || `A ${visualType} visualization.`,
        visual_type: visualType,
        mapped_fields: mappedFields
      });
      console.log(`Added suggestion: ${chartName} (${visualType})`);
    }
  } catch (e) {
    console.error("Error parsing section:", e);
  }
}
