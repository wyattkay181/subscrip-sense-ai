
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
      
      // First check if the table already exists
      const tableCheck = await connection.queryObject(`
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'gmail_tokens'
        );
      `);
      
      const tableExists = tableCheck.rows[0].exists;
      console.log('Table exists:', tableExists);

      if (!tableExists) {
        console.log('Table does not exist, creating it now');
        
        // Create the table
        await connection.queryObject(`
          CREATE TABLE public.gmail_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            access_token TEXT NOT NULL,
            refresh_token TEXT,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Enable RLS
          ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;
        `);
        
        console.log('Table created successfully');
        
        // Check for existing policies before creating them
        const existingPolicies = await connection.queryObject(`
          SELECT policyname FROM pg_policies 
          WHERE tablename = 'gmail_tokens' AND schemaname = 'public';
        `);
        
        if (existingPolicies.rows.length === 0) {
          console.log('No policies exist, creating them now');
          
          try {
            // Create all policies in a single transaction for better error handling
            await connection.queryObject('BEGIN;');
            
            await connection.queryObject(`
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
            `);
            
            await connection.queryObject('COMMIT;');
            console.log('All policies created successfully');
          } catch (policyError) {
            console.error('Error creating policies:', policyError);
            await connection.queryObject('ROLLBACK;');
            // Continue execution - the table exists, which is the most important part
          }
        } else {
          console.log('Policies already exist:', existingPolicies.rows);
        }
      } else {
        console.log('Table already exists, checking policy configuration');
        
        // Check existing policies
        const existingPolicies = await connection.queryObject(`
          SELECT policyname FROM pg_policies 
          WHERE tablename = 'gmail_tokens' AND schemaname = 'public';
        `);
        
        console.log('Existing policies:', existingPolicies.rows);
      }
      
      // Verify the table structure
      const columns = await connection.queryObject(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gmail_tokens'
        ORDER BY ordinal_position;
      `);
      
      console.log('Table structure verification:', columns.rows);
      
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
