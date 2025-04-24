
import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request with CORS headers')
    return new Response(null, { headers: corsHeaders })
  }
  
  // Log request details to help with debugging
  console.log('Create Gmail Table function called')
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  try {
    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
      throw new Error('Missing required Supabase environment variables');
    }
    
    console.log('Creating Supabase client with service role key');
    
    // Create a Supabase client with the service role key
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    console.log('Attempting to create gmail_tokens table via SQL directly')
    
    // Execute SQL directly instead of using a database function
    const { data, error } = await supabase.from('_exec_sql').select('*').execute(`
      CREATE TABLE IF NOT EXISTS public.gmail_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      
      -- Set up RLS
      ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;
      
      -- Allow read access to authenticated users
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'gmail_tokens' AND policyname = 'Allow read access for authenticated users'
        ) THEN
          CREATE POLICY "Allow read access for authenticated users" 
            ON public.gmail_tokens 
            FOR SELECT 
            TO authenticated 
            USING (true);
        END IF;
      END
      $$;
      
      -- Allow service role to insert, update, delete
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'gmail_tokens' AND policyname = 'Allow service role full access'
        ) THEN
          CREATE POLICY "Allow service role full access" 
            ON public.gmail_tokens
            USING (auth.jwt() IS NOT NULL);
        END IF;
      END
      $$;
    `);
    
    if (error) {
      console.error('Error directly creating table with SQL:', error);
      throw error;
    }

    console.log('Table created or validated successfully via direct SQL');

    return new Response(
      JSON.stringify({ message: 'Table created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-gmail-table function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
