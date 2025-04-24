
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
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

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
    
    // Execute the SQL using service role permissions
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('Table creation error:', error);
      throw error;
    }

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
