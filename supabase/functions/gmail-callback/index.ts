
import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { corsHeaders, getRedirectBaseUrl, createRedirectResponse, validateEnvironmentVariables } from './utils.ts'
import { ensureGmailTokensTable, storeGmailTokens } from './database.ts'

console.log('Gmail Callback function loaded and running')

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(req.url)
    console.log('Request URL:', req.url)
    console.log('Search params:', Object.fromEntries(url.searchParams.entries()))
    
    const redirectBaseUrl = getRedirectBaseUrl(req.url)
    console.log('Redirect base URL:', redirectBaseUrl)
    
    // Check for error parameter first
    const error = url.searchParams.get('error')
    if (error) {
      console.error('Google OAuth returned an error:', error)
      return createRedirectResponse(redirectBaseUrl, { error })
    }
    
    const code = url.searchParams.get('code')
    const userIdParam = url.searchParams.get('state')
    
    if (!code) {
      console.error('No authorization code provided')
      return createRedirectResponse(redirectBaseUrl, { error: 'missing_code' })
    }

    if (!userIdParam) {
      console.error('No user_id provided')
      return createRedirectResponse(redirectBaseUrl, { error: 'missing_user_id' })
    }

    validateEnvironmentVariables()
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI')!
    const pgUrl = Deno.env.get('SUPABASE_DB_URL')!

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

    const data = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', data)
      return createRedirectResponse(redirectBaseUrl, { 
        error: data.error || 'token_exchange_failed'
      })
    }

    try {
      // Ensure table exists and has correct policies
      await ensureGmailTokensTable(pgUrl, userIdParam)
      
      // Store the new tokens
      const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()
      await storeGmailTokens(
        pgUrl,
        userIdParam,
        data.access_token,
        data.refresh_token || null,
        expiresAt
      )
      
      return createRedirectResponse(redirectBaseUrl, { 'gmail-connected': 'true' })
    } catch (dbError) {
      console.error('Database operation error:', dbError)
      return createRedirectResponse(redirectBaseUrl, { 
        error: 'Database error: ' + dbError.message 
      })
    }
  } catch (error) {
    console.error('Uncaught error in Gmail callback:', error)
    return createRedirectResponse(
      getRedirectBaseUrl(req.url), 
      { error: error.message || 'unknown_error' }
    )
  }
})
