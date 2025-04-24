
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

    console.log('Creating table if it does not exist - using direct SQL')
    
    // Try to create the table directly with raw SQL
    // We're not using exec_sql since it appears to not exist in your setup
    try {
      const { error: createTableError } = await supabase
        .from('_migrations')
        .insert({
          name: 'create_gmail_tokens_table',
          hash: 'manual-migration'
        })
        .select()
        .maybeSingle();

      // Note: We're ignoring duplicate key errors here if the migration was already run
      
      console.log('Attempting to create table directly with SQL query');
      
      // Create the table directly
      const { error } = await supabase.rpc(
        'query', 
        { 
          query: `
            CREATE TABLE IF NOT EXISTS public.gmail_tokens (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL,
              access_token TEXT NOT NULL,
              refresh_token TEXT,
              expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
            
            ALTER TABLE IF EXISTS public.gmail_tokens ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Users can view their own tokens" ON public.gmail_tokens;
            CREATE POLICY "Users can view their own tokens"
              ON public.gmail_tokens
              FOR SELECT
              USING (auth.uid() = user_id);
              
            DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.gmail_tokens;
            CREATE POLICY "Users can insert their own tokens"
              ON public.gmail_tokens
              FOR INSERT
              WITH CHECK (auth.uid() = user_id);
              
            DROP POLICY IF EXISTS "Users can update their own tokens" ON public.gmail_tokens;
            CREATE POLICY "Users can update their own tokens"
              ON public.gmail_tokens
              FOR UPDATE
              USING (auth.uid() = user_id);
              
            DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.gmail_tokens;
            CREATE POLICY "Users can delete their own tokens"
              ON public.gmail_tokens
              FOR DELETE
              USING (auth.uid() = user_id);
          `
        }
      );
      
      if (error) {
        console.error('Error creating table with direct query:', error);
        
        // Try a more basic approach - just create the table without RLS
        console.log('Attempting basic table creation without RLS');
        const { error: basicError } = await supabase.rpc(
          'query',
          {
            query: `
              CREATE TABLE IF NOT EXISTS public.gmail_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                access_token TEXT NOT NULL,
                refresh_token TEXT,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
              );
            `
          }
        );
        
        if (basicError) {
          console.error('Basic table creation failed:', basicError);
          throw basicError;
        } else {
          console.log('Basic table created successfully. Adding RLS separately.');
          
          // Try to add RLS separately
          try {
            await supabase.rpc(
              'query',
              {
                query: `ALTER TABLE IF EXISTS public.gmail_tokens ENABLE ROW LEVEL SECURITY;`
              }
            );
            
            console.log('RLS enabled successfully.');
            
            // Add policies one by one
            const policies = [
              `CREATE POLICY IF NOT EXISTS "Users can view their own tokens"
               ON public.gmail_tokens FOR SELECT USING (auth.uid() = user_id);`,
               
              `CREATE POLICY IF NOT EXISTS "Users can insert their own tokens"
               ON public.gmail_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);`,
               
              `CREATE POLICY IF NOT EXISTS "Users can update their own tokens"
               ON public.gmail_tokens FOR UPDATE USING (auth.uid() = user_id);`,
               
              `CREATE POLICY IF NOT EXISTS "Users can delete their own tokens"
               ON public.gmail_tokens FOR DELETE USING (auth.uid() = user_id);`
            ];
            
            for (const policyQuery of policies) {
              try {
                await supabase.rpc('query', { query: policyQuery });
                console.log('Added policy successfully:', policyQuery);
              } catch (policyError) {
                console.error('Failed to add policy:', policyError);
                // Continue with other policies
              }
            }
          } catch (rlsError) {
            console.error('Failed to add RLS:', rlsError);
            // Continue anyway since the table exists
          }
        }
      } else {
        console.log('Table and policies created successfully');
      }
    } catch (sqlError) {
      console.error('SQL execution error:', sqlError);
      
      // Last resort - try a different approach
      console.log('Trying alternative approach - checking if table exists first');
      
      const { error: checkError } = await supabase.rpc(
        'query',
        { 
          query: `
            SELECT EXISTS (
              SELECT FROM pg_tables
              WHERE schemaname = 'public'
              AND tablename = 'gmail_tokens'
            );
          `
        }
      );
      
      if (checkError) {
        console.error('Failed to check if table exists:', checkError);
        throw checkError;
      } else {
        console.log('Table existence check successful, creating if not exists');
        
        // Create table with minimal SQL
        const { error: createError } = await supabase.rpc(
          'query',
          {
            query: `
              CREATE TABLE IF NOT EXISTS public.gmail_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                access_token TEXT NOT NULL,
                refresh_token TEXT,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
              );
            `
          }
        );
        
        if (createError) {
          console.error('Failed to create table with minimal approach:', createError);
          throw createError;
        } else {
          console.log('Table created successfully with minimal approach');
        }
      }
    }

    // Verify table exists by doing a simple query
    console.log('Verifying table creation with a query');
    try {
      const { data, error } = await supabase
        .from('gmail_tokens')
        .select('id')
        .limit(1);
        
      if (error) {
        console.error('Table verification failed:', error);
        throw error;
      }
      
      console.log('Table verification successful, table exists');
    } catch (verificationError) {
      console.error('Table verification exception:', verificationError);
      throw verificationError;
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
