
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

  // Log full request details for debugging
  console.log('Gmail Callback function called')
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))

  try {
    const url = new URL(req.url)
    console.log('Callback URL received:', url.toString())
    console.log('Search params:', Object.fromEntries(url.searchParams.entries()))
    
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    
    // Handle error from Google OAuth flow
    if (error) {
      console.error('Google OAuth returned an error:', error)
      return new Response(
        JSON.stringify({ error: `Google OAuth error: ${error}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    if (!code) {
      console.error('No authorization code provided in URL params')
      return new Response(
        JSON.stringify({ error: 'No authorization code provided in the callback URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check for required environment variables
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('Environment variable check:')
    console.log('- GOOGLE_CLIENT_ID present:', !!clientId)
    console.log('- GOOGLE_CLIENT_SECRET present:', !!clientSecret) 
    console.log('- GOOGLE_REDIRECT_URI value:', redirectUri)
    console.log('- SUPABASE_URL present:', !!supabaseUrl)
    console.log('- SUPABASE_SERVICE_ROLE_KEY present:', !!supabaseServiceKey)

    if (!clientId || !clientSecret || !redirectUri || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasRedirectUri: !!redirectUri,
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseServiceKey: !!supabaseServiceKey
      })
      throw new Error('Missing required environment variables')
    }

    console.log('Exchanging code for tokens')
    
    // Exchange the authorization code for tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
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

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Token exchange failed:', data)
      throw new Error(`Failed to exchange code: ${data.error}`)
    }

    console.log('Successfully obtained tokens')

    // Store tokens in Supabase using service role key
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    )

    // Create the table directly if it doesn't exist
    console.log('Ensuring gmail_tokens table exists')
    const { error: sqlError } = await supabase.from('_exec_sql').select('*').execute(`
      CREATE TABLE IF NOT EXISTS public.gmail_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      
      ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;
    `)
    
    if (sqlError) {
      console.error('Error creating table directly:', sqlError)
    }

    // Store the tokens
    console.log('Storing tokens in database')
    const { error } = await supabase.from('gmail_tokens').insert({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    })

    if (error) {
      console.error('Error storing tokens:', error)
      throw new Error(`Failed to store tokens: ${error.message}`)
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
    console.error('Error in Gmail callback:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
