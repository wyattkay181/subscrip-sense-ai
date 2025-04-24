
import { serve } from "https://deno.land/std@0.131.0/http/server.ts"

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
  console.log('Gmail Auth URL function called')
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))

  try {
    // Extract user ID from request if possible
    let userId = null;
    const authHeader = req.headers.get('authorization');
    
    // Check for API key as well (important for public functions)
    const apiKey = req.headers.get('apikey');
    console.log('API key present:', !!apiKey);

    if (authHeader) {
      try {
        // Try to parse the JWT to get the user ID
        const token = authHeader.replace('Bearer ', '')
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        
        const payload = JSON.parse(jsonPayload)
        userId = payload.sub
        console.log('Authenticated user ID:', userId)
      } catch (error) {
        console.error('Error extracting user ID from token:', error)
        throw new Error('Invalid authentication token')
      }
    } else {
      throw new Error('Missing authorization header')
    }

    if (!userId) {
      throw new Error('Could not determine user ID from token')
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI')
    
    console.log('Environment variable check:')
    console.log('- GOOGLE_CLIENT_ID present:', !!clientId)
    console.log('- GOOGLE_REDIRECT_URI value:', redirectUri)
    
    if (!clientId || !redirectUri) {
      throw new Error('Missing required environment variables')
    }

    console.log('Generating Google OAuth URL with client ID and redirect URI')

    // Generate the Google OAuth URL
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.searchParams.append('client_id', clientId)
    url.searchParams.append('redirect_uri', redirectUri)
    url.searchParams.append('response_type', 'code')
    
    // Add the user ID as state parameter
    url.searchParams.append('state', userId)
    
    // Updated scopes for comprehensive access
    url.searchParams.append('scope', 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile')
    
    url.searchParams.append('access_type', 'offline')
    url.searchParams.append('prompt', 'consent')
    
    // Allow testing without full verification
    url.searchParams.append('include_granted_scopes', 'true')

    console.log('Generated OAuth URL:', url.toString())

    return new Response(
      JSON.stringify({ url: url.toString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in gmail-auth-url function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
