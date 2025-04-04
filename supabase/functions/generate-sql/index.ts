
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.20.1";

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
    const apiKey = Deno.env.get('api_key');
    if (!apiKey) {
      throw new Error('API key not found');
    }

    const { query, schemaInfo } = await req.json();

    if (!query || !schemaInfo) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: query and schemaInfo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the schema info for the prompt
    const schemaDescription = schemaInfo.map((schema: any) => {
      const columnDetails = schema.columns.map((col: string, index: number) => 
        `${col} ${schema.dataTypes[col] || 'TEXT'}`
      ).join(', ');
      
      return `Table ${schema.tableName}(${columnDetails})`;
    }).join('\n\n');

    // Sample data for context
    const sampleDataSection = schemaInfo.map((schema: any) => {
      if (!schema.sample || schema.sample.length === 0) return '';
      
      const sampleHeader = `Sample data for ${schema.tableName}:`;
      const sampleRows = schema.sample.map((row: any) => {
        return '(' + schema.columns.map((col: string, idx: number) => `${row[idx]}`).join(', ') + ')';
      }).join('\n');
      
      return `${sampleHeader}\n${sampleRows}`;
    }).join('\n\n');

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1"
    });

    console.log("Sending request to OpenAI...");
    const completion = await openai.chat.completions.create({
      model: "deepseek-ai/deepseek-r1",
      messages: [
        {
          role: "user", 
          content: `Using the following table schema:
${schemaDescription}

${sampleDataSection.length > 0 ? sampleDataSection + '\n\n' : ''}

Convert this request into an optimized SQL query: ${query}

Respond ONLY with the SQL query, no explanations or commentary.`
        }
      ],
      temperature: 0.4,
      top_p: 0.7,
      max_tokens: 512
    });

    let generatedSql = completion.choices[0]?.message?.content || '';
    
    // Remove unwanted "<think>" section if present
    generatedSql = generatedSql.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    console.log("Generated SQL:", generatedSql);
    
    return new Response(
      JSON.stringify({ sql: generatedSql }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error generating SQL:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
