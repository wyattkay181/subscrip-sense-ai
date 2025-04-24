
import { serve } from "https://deno.land/std@0.131.0/http/server.ts"

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
    
    // Direct database connection using postgres
    const pgUrl = Deno.env.get('SUPABASE_DB_URL');
    console.log('- SUPABASE_DB_URL present:', !!pgUrl);
    
    if (!pgUrl) {
      throw new Error('Missing Postgres connection URL');
    }
    
    // Use direct PostgreSQL connection for table creation
    console.log('Creating database connection');
    const { Pool } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
    
    const pool = new Pool(pgUrl, 1, true);
    let connection;
    
    try {
      console.log('Acquiring connection from pool');
      connection = await pool.connect();
      
      console.log('Executing table creation SQL directly');
      await connection.queryObject(`
        CREATE TABLE IF NOT EXISTS public.gmail_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE IF EXISTS public.gmail_tokens ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for RLS
        DO $$
        BEGIN
          -- Users can view their own tokens
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'gmail_tokens' AND policyname = 'Users can view their own tokens'
          ) THEN
            CREATE POLICY "Users can view their own tokens" 
              ON public.gmail_tokens FOR SELECT USING (auth.uid() = user_id);
          END IF;
          
          -- Users can insert their own tokens
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'gmail_tokens' AND policyname = 'Users can insert their own tokens'
          ) THEN
            CREATE POLICY "Users can insert their own tokens" 
              ON public.gmail_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
          END IF;
          
          -- Users can update their own tokens
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'gmail_tokens' AND policyname = 'Users can update their own tokens'
          ) THEN
            CREATE POLICY "Users can update their own tokens" 
              ON public.gmail_tokens FOR UPDATE USING (auth.uid() = user_id);
          END IF;
          
          -- Users can delete their own tokens
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'gmail_tokens' AND policyname = 'Users can delete their own tokens'
          ) THEN
            CREATE POLICY "Users can delete their own tokens" 
              ON public.gmail_tokens FOR DELETE USING (auth.uid() = user_id);
          END IF;
        END
        $$;
      `);
      
      console.log('Table creation successful through direct SQL connection');
      
      // Verify the table exists
      const { rows } = await connection.queryObject(`
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'gmail_tokens'
        );
      `);
      
      console.log('Table existence check:', rows[0]);
      
    } catch (pgError) {
      console.error('PostgreSQL Error:', pgError);
      throw pgError;
    } finally {
      if (connection) {
        console.log('Releasing connection back to pool');
        connection.release();
      }
      await pool.end();
    }

    console.log('Table created or verified successfully');
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
