
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
    
    // Get the OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get("api_key");
    if (!openaiApiKey) {
      console.error("OpenAI API key not found in Supabase secrets");
      throw new Error("OpenAI API key is not configured. Please set the api_key in your Supabase secrets.");
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

    // Create a more structured prompt based on the example
    const prompt = `
You are a data visualization expert specializing in Power BI. Based on the following dataset schema and samples, suggest 6 to 8 insightful charts that can be created in Power BI.

${datasetDescriptions}

Provide each suggestion with:
- Chart Type
- Chart Title
- Description of Insight
- Mapped Fields: (x-axis, y-axis, legend, tooltips, filters, etc.)

Ensure the chart types are appropriate for the data types and uncover trends, comparisons, or insights effectively.
Return the suggestions as a well-formatted JSON array with each suggestion having these properties:
- chart_name: string (descriptive name of the chart)
- description: string (why this chart makes sense for the data)
- visual_type: string (the Power BI visual type)
- mapped_fields: object (mapping of field roles to dataset columns)
`;

    console.log("Sending request to OpenAI API");
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a data visualization expert specializing in Power BI. Your task is to analyze datasets and suggest the most appropriate visualizations formatted as a JSON array."
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
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("Received response from OpenAI API");

    // Extract suggestions from the AI response
    const aiResponse = data.choices[0].message.content;
    
    // Extract JSON from the response (handling possible markdown code blocks)
    let suggestions: VisualSuggestion[] = [];
    try {
      // Try to parse the entire response as JSON
      suggestions = JSON.parse(aiResponse);
    } catch (e) {
      console.log("Failed to parse JSON response directly, attempting to extract from markdown");
      // If that fails, try to extract JSON from a code block
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          suggestions = JSON.parse(jsonMatch[1].trim());
        } catch (e2) {
          console.error("Failed to parse JSON from markdown code block:", e2);
          throw new Error("Could not parse AI response as JSON");
        }
      } else {
        // If no obvious JSON pattern is found, attempt to convert the response to structured format
        console.log("No JSON code block found, attempting to structure the response");
        suggestions = convertTextToStructuredFormat(aiResponse);
      }
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
 * Attempts to convert a text-based chart suggestion response to structured format
 * when JSON parsing fails
 */
function convertTextToStructuredFormat(text: string): VisualSuggestion[] {
  const suggestions: VisualSuggestion[] = [];
  
  // Look for numbered sections like "1." or "1:" or "Chart 1:" etc.
  const sections = text.split(/(?:\n|^)(?:\d+[\.:)]|Chart \d+:)\s+/g).filter(s => s.trim().length > 0);
  
  for (const section of sections) {
    try {
      // Extract chart type and title
      const typeMatch = section.match(/(?:Chart Type|Type):\s*([^\n]+)/i);
      const titleMatch = section.match(/(?:Chart Title|Title):\s*([^\n]+)/i);
      const descMatch = section.match(/(?:Description|Description of Insight):\s*([^\n]+(?:\n[^\n]+)*?)(?:\n\s*(?:-|•|\*|\d+\.)|\n\s*Mapped Fields|\n\s*$)/i);
      
      // If we can't find these basic elements, skip this section
      if (!typeMatch && !titleMatch) continue;
      
      const chartType = typeMatch ? typeMatch[1].trim() : "Unknown Chart";
      const chartName = titleMatch ? titleMatch[1].trim() : "Untitled Chart";
      const description = descMatch ? descMatch[1].trim() : "";
      
      // Extract mapped fields - this is more complex as it can span multiple lines
      const mappedFields: Record<string, string | string[]> = {};
      const fieldsSection = section.match(/Mapped Fields:?\s*([\s\S]+?)(?:\n\s*$|\n\s*\n|$)/i);
      
      if (fieldsSection) {
        const fieldLines = fieldsSection[1].split('\n');
        for (const line of fieldLines) {
          // Look for patterns like "X-axis: OrderDate" or "- X-axis: OrderDate"
          const fieldMatch = line.match(/(?:-|\*|•)?\s*(?:([^:]+):\s*(.+))/);
          if (fieldMatch) {
            const [, fieldName, fieldValue] = fieldMatch;
            if (fieldName && fieldValue) {
              const fieldKey = fieldName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
              mappedFields[fieldKey] = fieldValue.trim();
            }
          }
        }
      }
      
      suggestions.push({
        chart_name: chartName,
        description: description,
        visual_type: chartType,
        mapped_fields: mappedFields
      });
    } catch (e) {
      console.error("Error parsing section:", e);
      continue; // Skip this section if there's an error
    }
  }
  
  // If we couldn't extract any suggestions, create a fallback
  if (suggestions.length === 0) {
    console.log("Could not extract structured suggestions from text, using fallback");
    suggestions.push({
      chart_name: "Data Overview",
      description: "A general overview of the dataset based on available fields.",
      visual_type: "Table",
      mapped_fields: { columns: "All available fields" }
    });
  }
  
  return suggestions;
}
