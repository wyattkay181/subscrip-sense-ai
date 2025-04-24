
import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

console.log('Create Gmail Table function loaded and running')

serve(async (req) => {
  console.log('Create Gmail Table function invoked')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request with CORS headers')
    return new Response(null, { headers: corsHeaders })
  }
  
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    console.log('Environment variables check:')
    console.log('- SUPABASE_URL present:', !!supabaseUrl)
    console.log('- SUPABASE_SERVICE_ROLE_KEY present:', !!supabaseServiceKey)
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    console.log('Creating Supabase client')
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    console.log('Creating table if it does not exist')
    
    // Use direct SQL to create the table and policies with service role
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.gmail_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      
      -- Add RLS policy if it doesn't exist (wrapped in anonymous DO block)
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'gmail_tokens' 
          AND policyname = 'Users can view their own tokens'
        ) THEN
          ALTER TABLE IF EXISTS public.gmail_tokens ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can view their own tokens"
            ON public.gmail_tokens
            FOR SELECT
            USING (auth.uid() = user_id);
            
          CREATE POLICY "Users can insert their own tokens"
            ON public.gmail_tokens
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
            
          CREATE POLICY "Users can update their own tokens"
            ON public.gmail_tokens
            FOR UPDATE
            USING (auth.uid() = user_id);
            
          CREATE POLICY "Users can delete their own tokens"
            ON public.gmail_tokens
            FOR DELETE
            USING (auth.uid() = user_id);
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error but don't fail
          RAISE NOTICE 'Error creating policies: %', SQLERRM;
      END
      $$;
    `;
    
    console.log('Executing SQL to create table and policies')
    // Execute the SQL using service role permissions
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('Table creation error:', error);
      throw error;
    }

    console.log('Table created or verified successfully')
    return new Response(
      JSON.stringify({ success: true, message: 'Table created or verified successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in create-gmail-table function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
