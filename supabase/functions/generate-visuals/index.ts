
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
    
    // Check if OpenAI API key is available - use api_key instead of OPENAI_API_KEY
    const openaiApiKey = Deno.env.get("api_key");
    if (!openaiApiKey) {
      console.error("OpenAI API key not found in Supabase secrets");
      throw new Error("OpenAI API key is not configured. Please set the api_key in your Supabase secrets.");
    }

    // Prepare the prompt for the AI
    const prompt = `
      I have the following datasets:
      ${datasets.map((dataset: any) => `
        Dataset: ${dataset.name}
        Headers: ${dataset.headers.join(', ')}
        Data Types: ${Object.entries(dataset.dataTypes).map(([header, type]) => `${header}: ${type}`).join(', ')}
        Sample Rows: 
        ${dataset.sampleRows.map((row: any) => row.join(', ')).join('\n')}
      `).join('\n\n')}

      As a data visualization expert, suggest the best Power BI visualizations for these datasets. 
      For each suggestion:
      1. Provide a descriptive chart name
      2. Explain why this visualization is appropriate
      3. Specify the type of Power BI visual to use
      4. Map dataset fields to the visual's required fields (e.g., x-axis, y-axis, legend)

      Return your response as a JSON array with each suggestion having these properties:
      - chart_name: string (descriptive name of the chart)
      - description: string (why this chart makes sense for the data)
      - visual_type: string (the Power BI visual type)
      - mapped_fields: object (mapping of field roles to dataset columns)

      Provide at least 5 different visualization suggestions that best represent insights from the data.
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
              content: "You are a data visualization expert specializing in Power BI. Your task is to analyze datasets and suggest the most appropriate visualizations."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
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
      // If that fails, try to extract JSON from a code block
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        suggestions = JSON.parse(jsonMatch[1].trim());
      } else {
        // If still no JSON found, fall back to rule-based suggestions
        throw new Error("Could not parse AI response");
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
