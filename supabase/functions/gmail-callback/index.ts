
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

    // Log environment variable presence for debugging
    console.log('Environment variables check:')
    console.log('- GOOGLE_CLIENT_ID present:', !!clientId)
    console.log('- GOOGLE_CLIENT_SECRET present:', !!clientSecret) 
    console.log('- GOOGLE_REDIRECT_URI value:', redirectUri)
    console.log('- SUPABASE_URL present:', !!supabaseUrl)
    console.log('- SUPABASE_SERVICE_ROLE_KEY present:', !!supabaseServiceKey)
    console.log('- SUPABASE_ANON_KEY present:', !!supabaseAnonKey)

    if (!clientId || !clientSecret || !redirectUri || !supabaseUrl || !supabaseServiceKey) {
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

    // Create Supabase client with service role key
    console.log('Creating Supabase client')
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    )

    // Ensure the table exists (call the create-gmail-table function first)
    console.log('Ensuring gmail_tokens table exists')
    try {
      // Try to query the table first to see if it exists
      const { error: tableCheckError } = await supabase
        .from('gmail_tokens')
        .select('id')
        .limit(1)

      if (tableCheckError) {
        console.log('Table might not exist, creating it')
        // Use direct SQL to create the table if it doesn't exist
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.gmail_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            access_token TEXT NOT NULL,
            refresh_token TEXT,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Add RLS policy if it doesn't exist
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
              RAISE NOTICE 'Error creating policies: %', SQLERRM;
          END
          $$;
        `;
        
        // Execute the SQL using service role permissions
        await supabase.rpc('exec_sql', { sql: createTableSQL });
      }
    } catch (tableError) {
      console.error('Error during table creation/check:', tableError);
      // Continue anyway since we're using service role key
    }

    // Try to delete any existing tokens for this user
    console.log('Removing any existing tokens for user')
    try {
      await supabase
        .from('gmail_tokens')
        .delete()
        .eq('user_id', userIdParam)
    } catch (deleteError) {
      console.error('Error deleting existing tokens:', deleteError)
      // Continue anyway
    }

    // Store the tokens
    console.log('Storing new tokens in database')
    const { error: insertError } = await supabase
      .from('gmail_tokens')
      .insert({
        user_id: userIdParam,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      })

    if (insertError) {
      console.error('Error storing tokens:', insertError)
      return new Response(
        null,
        { 
          headers: { 
            ...corsHeaders,
            'Location': '/?error=token_storage_failed'
          },
          status: 302 
        }
      )
    }

    console.log('Successfully stored tokens in database')

    // Redirect back to the frontend with success message
    return new Response(
      null,
      {
        headers: {
          ...corsHeaders,
          'Location': '/?gmail-connected=true'
        },
        status: 302
      }
    )
  } catch (error) {
    // Catch-all error handler
    console.error('Uncaught error in Gmail callback:', error)
    return new Response(
      null,
      { 
        headers: { 
          ...corsHeaders,
          'Location': `/?error=${encodeURIComponent(error.message || 'unknown_error')}`
        },
        status: 302 
      }
    )
  }
})
