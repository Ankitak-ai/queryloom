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
  
  return cleanedText;
}

/**
 * Parses the AI-generated text to extract structured chart suggestions
 */
function parseChartSuggestions(text: string): VisualSuggestion[] {
  const suggestions: VisualSuggestion[] = [];
  
  try {
    // First try to find chart sections by visual type + chart name pattern
    const visualTypeRegex = /(Bar Chart|Line Chart|Pie Chart|Area Chart|Scatter Chart|Waterfall Chart|Box Plot|Histogram|Table|Card|Gauge|Stacked Column Chart|Stacked Bar Chart|Treemap|Map|Scatter Plot)/gi;
    
    // Split by chart type headers
    const chartSections = text.split(visualTypeRegex);
    
    // If we found chart sections using the regex
    if (chartSections.length > 1) {
      const visualTypes = text.match(visualTypeRegex) || [];
      
      for (let i = 0; i < visualTypes.length; i++) {
        // The section content follows the chart type in the split array
        const sectionContent = chartSections[i + 1];
        
        if (sectionContent && sectionContent.trim()) {
          try {
            const suggestion = parseSingleChartSection(visualTypes[i], sectionContent);
            if (suggestion) {
              suggestions.push(suggestion);
            }
          } catch (e) {
            console.error(`Error parsing section with visual type ${visualTypes[i]}:`, e);
          }
        }
      }
    } else {
      // Fallback to looking for "Mapped Fields" as section separators
      const mappedFieldsRegex = /Mapped Fields/gi;
      const sections = text.split(mappedFieldsRegex);
      
      // Skip the first section if it doesn't contain useful information
      const startIndex = sections[0].trim().length < 10 ? 1 : 0;
      
      for (let i = startIndex; i < sections.length; i++) {
        const section = (i === startIndex && startIndex > 0) ? sections[i] : "Mapped Fields" + sections[i];
        
        try {
          const suggestion = parseUnstructuredSection(section);
          if (suggestion) {
            suggestions.push(suggestion);
          }
        } catch (e) {
          console.error(`Error parsing unstructured section ${i}:`, e);
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
 * Parses a single chart section when we know the visual type
 */
function parseSingleChartSection(visualType: string, sectionContent: string): VisualSuggestion | null {
  try {
    // Extract chart name/title - it's usually the first line after the chart type
    const chartNameMatch = sectionContent.match(/^([^\n]+)/);
    const chartName = chartNameMatch ? chartNameMatch[1].trim() : "Untitled Chart";
    
    // Extract description - it's usually between the chart name and mapped fields
    let description = "";
    const descMatch = sectionContent.match(/\n(.*?)(?=\n\s*Mapped Fields|$)/s);
    if (descMatch) {
      description = descMatch[1].trim();
    }
    
    // Extract mapped fields section
    const mappedFields: Record<string, string | string[]> = {};
    
    // Look for field mappings patterns like "* x-axis: field_name" or "x-axis: field_name"
    const fieldRegex = /[*•-]?\s*([^:*\n]+?):\s*([^\n]+)/g;
    let fieldMatch;
    
    while ((fieldMatch = fieldRegex.exec(sectionContent)) !== null) {
      const fieldName = fieldMatch[1].trim().toLowerCase().replace(/[-\s]+/g, '-');
      let fieldValue = fieldMatch[2].trim().replace(/^\s*`|`\s*$/g, '');
      
      // Handle comma-separated lists
      if (fieldValue.includes(',')) {
        mappedFields[fieldName] = fieldValue.split(',').map(item => item.trim().replace(/^\s*`|`\s*$/g, ''));
      } else {
        mappedFields[fieldName] = fieldValue;
      }
    }
    
    // Only return if we have at least a chart name
    if (chartName !== "Untitled Chart") {
      return {
        chart_name: chartName,
        description: description || `A ${visualType} visualization.`,
        visual_type: visualType.trim(),
        mapped_fields: mappedFields
      };
    }
  } catch (e) {
    console.error("Error parsing chart section:", e);
  }
  
  return null;
}

/**
 * Parses an unstructured section when the format is less predictable
 */
function parseUnstructuredSection(section: string): VisualSuggestion | null {
  try {
    // First look for a visual type
    let visualType = "Unknown";
    const typeMatch = section.match(/\b(Bar Chart|Line Chart|Pie Chart|Area Chart|Scatter Chart|Waterfall Chart|Box Plot|Histogram|Table|Card|Gauge|Stacked Column Chart|Stacked Bar Chart|Treemap|Map|Scatter Plot)\b/i);
    
    if (typeMatch) {
      visualType = typeMatch[1];
    }
    
    // Look for a chart name - usually a sentence or phrase before "Mapped Fields"
    let chartName = "Untitled Chart";
    const titleMatch = section.match(/\*\*([^*\n]+?)\*\*/);
    
    if (titleMatch) {
      chartName = titleMatch[1].trim();
    } else {
      // Try to find the first sentence as a title
      const firstLineMatch = section.match(/^([^\n.]+)/);
      if (firstLineMatch) {
        chartName = firstLineMatch[1].trim();
      }
    }
    
    // Look for a description
    let description = "";
    
    // If we have "insight" or "description" in the section, extract that part
    const descMatch = section.match(/\b(?:insight|description)\b:?\s*([^\n]+)/i);
    
    if (descMatch) {
      description = descMatch[1].trim();
    } else {
      // Otherwise, try to extract a sentence that could be a description
      const potentialDesc = section.match(/\n([^*\n][^\n]+?)(?=\n|$)/);
      if (potentialDesc) {
        description = potentialDesc[1].trim();
      }
    }
    
    // Extract mapped fields
    const mappedFields: Record<string, string | string[]> = {};
    
    // Look for field mappings like "field: value" or "* field: value"
    const fieldMatches = section.matchAll(/(?:^|\n)\s*(?:[*•-]\s*)?(?:([^:*\n]+?):\s*([^\n]+))/g);
    
    for (const match of fieldMatches) {
      const fieldName = match[1].trim().toLowerCase().replace(/[-\s]+/g, '-');
      let fieldValue = match[2].trim().replace(/^\s*`|`\s*$/g, '');
      
      // Skip if the field name contains common chart titles or is too long
      if (fieldName.includes('chart') || fieldName.includes('visualization') || 
          fieldName.length > 30 || fieldName === 'mapped fields') {
        continue;
      }
      
      // Handle comma-separated lists
      if (fieldValue.includes(',')) {
        mappedFields[fieldName] = fieldValue.split(',').map(item => item.trim().replace(/^\s*`|`\s*$/g, ''));
      } else {
        mappedFields[fieldName] = fieldValue;
      }
    }
    
    // Only return if we have at least a chart name
    if (chartName !== "Untitled Chart") {
      return {
        chart_name: chartName,
        description: description || `A ${visualType} visualization.`,
        visual_type: visualType,
        mapped_fields: mappedFields
      };
    }
  } catch (e) {
    console.error("Error parsing unstructured section:", e);
  }
  
  return null;
}
