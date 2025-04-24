
import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

console.log('Gmail Callback function loaded and running')

serve(async (req) => {
  // Start with initial logging to confirm the function is called
  console.log('Gmail Callback function invoked')
  
  try {
    // Handle CORS preflight requests first
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request with CORS headers')
      return new Response(null, { headers: corsHeaders })
    }

    // Log all request information for debugging
    console.log('Request URL:', req.url)
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    const url = new URL(req.url)
    console.log('Full URL received:', url.toString())
    console.log('Search params:', Object.fromEntries(url.searchParams.entries()))
    
    // Check for error parameter first - Google OAuth might return an error
    const error = url.searchParams.get('error')
    if (error) {
      console.error('Google OAuth returned an error:', error)
      // Redirect to frontend with error message
      return new Response(
        null,
        {
          headers: {
            ...corsHeaders,
            'Location': `/?error=${encodeURIComponent(error)}`
          },
          status: 302
        }
      )
    }
    
    // Extract important parameters
    const code = url.searchParams.get('code')
    const userIdParam = url.searchParams.get('state') // Google returns user_id as state parameter
    
    // Validate required parameters
    if (!code) {
      console.error('No authorization code provided in URL params')
      return new Response(
        null,
        { 
          headers: { 
            ...corsHeaders,
            'Location': '/?error=missing_code'
          },
          status: 302 
        }
      )
    }

    if (!userIdParam) {
      console.error('No user_id provided in URL params')
      return new Response(
        null,
        { 
          headers: { 
            ...corsHeaders,
            'Location': '/?error=missing_user_id'
          },
          status: 302 
        }
      )
    }

    console.log('User ID from state param:', userIdParam)
    console.log('Auth code received, proceeding to exchange for tokens')

    // Check for required environment variables
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const pgUrl = Deno.env.get('SUPABASE_DB_URL')

    // Log environment variable presence for debugging
    console.log('Environment variables check:')
    console.log('- GOOGLE_CLIENT_ID present:', !!clientId)
    console.log('- GOOGLE_CLIENT_SECRET present:', !!clientSecret) 
    console.log('- GOOGLE_REDIRECT_URI value:', redirectUri)
    console.log('- SUPABASE_URL present:', !!supabaseUrl)
    console.log('- SUPABASE_SERVICE_ROLE_KEY present:', !!supabaseServiceKey)
    console.log('- SUPABASE_ANON_KEY present:', !!supabaseAnonKey)
    console.log('- SUPABASE_DB_URL present:', !!pgUrl)

    if (!clientId || !clientSecret || !redirectUri || !supabaseUrl || !supabaseServiceKey || !pgUrl) {
      console.error('Missing required environment variables')
      return new Response(
        null,
        { 
          headers: { 
            ...corsHeaders,
            'Location': '/?error=missing_environment_variables'
          },
          status: 302 
        }
      )
    }

    console.log('Exchanging code for tokens')
    
    // Exchange the authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    // Log the token response status
    console.log('Token exchange response status:', tokenResponse.status)
    
    const data = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', data)
      return new Response(
        null,
        { 
          headers: { 
            ...corsHeaders,
            'Location': `/?error=${encodeURIComponent(data.error || 'token_exchange_failed')}`
          },
          status: 302 
        }
      )
    }

    console.log('Successfully obtained tokens')
    console.log('Token data:', {
      access_token: data.access_token ? '***redacted***' : null,
      refresh_token: data.refresh_token ? '***redacted***' : null,
      expires_in: data.expires_in,
      token_type: data.token_type
    })

    // Create Supabase client with service role key for some operations
    console.log('Creating Supabase client')
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    )

    // Use direct PostgreSQL connection for database operations
    console.log('Ensuring gmail_tokens table exists before proceeding')
    
    try {
      // Use direct PostgreSQL connection for table creation
      console.log('Creating direct database connection');
      const { Pool } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
      
      const pool = new Pool(pgUrl, 1, true);
      let connection;
      
      try {
        console.log('Acquiring connection from pool');
        connection = await pool.connect();
        
        // Create table if it doesn't exist
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
        `);
        
        console.log('Table created or exists already');
        
        // Create RLS policies with correct syntax - fixing the issues
        console.log('Creating or updating RLS policies');
        
        // Users can view their own tokens
        try {
          await connection.queryObject(`
            CREATE POLICY IF NOT EXISTS "Users can view their own tokens" 
            ON public.gmail_tokens 
            FOR SELECT 
            USING (auth.uid() = user_id);
          `);
          console.log('SELECT policy created successfully');
        } catch (policyError) {
          console.error('Error creating SELECT policy:', policyError);
          // Continue anyway since this might just mean the policy already exists
        }
        
        // Users can insert their own tokens
        try {
          await connection.queryObject(`
            CREATE POLICY IF NOT EXISTS "Users can insert their own tokens" 
            ON public.gmail_tokens 
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
          `);
          console.log('INSERT policy created successfully');
        } catch (policyError) {
          console.error('Error creating INSERT policy:', policyError);
          // Continue anyway since this might just mean the policy already exists
        }
        
        // Users can update their own tokens
        try {
          await connection.queryObject(`
            CREATE POLICY IF NOT EXISTS "Users can update their own tokens" 
            ON public.gmail_tokens 
            FOR UPDATE 
            USING (auth.uid() = user_id);
          `);
          console.log('UPDATE policy created successfully');
        } catch (policyError) {
          console.error('Error creating UPDATE policy:', policyError);
          // Continue anyway since this might just mean the policy already exists
        }
        
        // Users can delete their own tokens
        try {
          await connection.queryObject(`
            CREATE POLICY IF NOT EXISTS "Users can delete their own tokens" 
            ON public.gmail_tokens 
            FOR DELETE 
            USING (auth.uid() = user_id);
          `);
          console.log('DELETE policy created successfully');
        } catch (policyError) {
          console.error('Error creating DELETE policy:', policyError);
          // Continue anyway since this might just mean the policy already exists
        }
        
        console.log('Policies created or updated successfully');
        
        // Verify the table exists
        const { rows } = await connection.queryObject(`
          SELECT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'gmail_tokens'
          );
        `);
        
        console.log('Table existence check:', rows[0]);
        
        // Delete any existing tokens for this user
        console.log('Removing any existing tokens for user:', userIdParam);
        try {
          await connection.queryObject(`
            DELETE FROM public.gmail_tokens 
            WHERE user_id = $1
          `, [userIdParam]);
          console.log('Successfully deleted any existing tokens');
        } catch (deleteError) {
          console.error('Error deleting existing tokens:', deleteError);
          // Continue anyway since this might be a first-time setup
        }
        
        // Store the new tokens
        console.log('Storing new tokens in database for user:', userIdParam);
        try {
          const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
          
          console.log('Token data being stored:', {
            user_id: userIdParam,
            access_token: '***redacted***',
            refresh_token: data.refresh_token ? '***redacted***' : null,
            expires_at: expiresAt
          });
          
          await connection.queryObject(`
            INSERT INTO public.gmail_tokens (user_id, access_token, refresh_token, expires_at)
            VALUES ($1, $2, $3, $4)
          `, [userIdParam, data.access_token, data.refresh_token || null, expiresAt]);
          
          console.log('Successfully stored tokens in database');
        } catch (insertError) {
          console.error('Error storing tokens:', insertError);
          throw insertError;
        }
        
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
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return new Response(
        null,
        { 
          headers: { 
            ...corsHeaders,
            'Location': `/?error=${encodeURIComponent('Database error: ' + dbError.message)}`
          },
          status: 302 
        }
      );
    }

    // Redirect back to the frontend with success message
    console.log('Redirecting back to frontend with success');
    return new Response(
      null,
      {
        headers: {
          ...corsHeaders,
          'Location': '/?gmail-connected=true'
        },
        status: 302
      }
    );
  } catch (error) {
    // Catch-all error handler
    console.error('Uncaught error in Gmail callback:', error);
    return new Response(
      null,
      { 
        headers: { 
          ...corsHeaders,
          'Location': `/?error=${encodeURIComponent(error.message || 'unknown_error')}`
        },
        status: 302 
      }
    );
  }
})
