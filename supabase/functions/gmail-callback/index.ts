
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
    console.log('Token data:', {
      access_token: data.access_token ? '***redacted***' : null,
      refresh_token: data.refresh_token ? '***redacted***' : null,
      expires_in: data.expires_in,
      token_type: data.token_type
    })

    // Create Supabase client with service role key
    console.log('Creating Supabase client')
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    )

    // Ensure the gmail_tokens table exists
    console.log('Making sure gmail_tokens table exists before proceeding')
    try {
      // Create table if it doesn't exist using rpc query
      const { error: tableError } = await supabase.rpc(
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
            
            -- Create policies if they don't exist
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gmail_tokens' AND policyname = 'Users can view their own tokens') THEN
                CREATE POLICY "Users can view their own tokens" ON public.gmail_tokens FOR SELECT USING (auth.uid() = user_id);
              END IF;
              
              IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gmail_tokens' AND policyname = 'Users can insert their own tokens') THEN
                CREATE POLICY "Users can insert their own tokens" ON public.gmail_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
              END IF;
              
              IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gmail_tokens' AND policyname = 'Users can update their own tokens') THEN
                CREATE POLICY "Users can update their own tokens" ON public.gmail_tokens FOR UPDATE USING (auth.uid() = user_id);
              END IF;
              
              IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gmail_tokens' AND policyname = 'Users can delete their own tokens') THEN
                CREATE POLICY "Users can delete their own tokens" ON public.gmail_tokens FOR DELETE USING (auth.uid() = user_id);
              END IF;
            END
            $$;
          `
        }
      );
      
      if (tableError) {
        console.error('Error ensuring table exists:', tableError);
        // Try a simpler approach without DO block
        const { error: simpleCreateError } = await supabase.rpc(
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
        
        if (simpleCreateError) {
          console.error('Simple table creation failed:', simpleCreateError);
        } else {
          console.log('Basic table created successfully');
        }
      } else {
        console.log('Table and policies created or verified successfully');
      }
    } catch (tableSetupError) {
      console.error('Exception during table setup:', tableSetupError);
      // Continue anyway and try to use the table
    }

    // Verify table exists with a simple query
    try {
      console.log('Verifying gmail_tokens table exists');
      const { error: verifyError } = await supabase
        .from('gmail_tokens')
        .select('id')
        .limit(1);
        
      if (verifyError) {
        console.error('Table verification failed, table may not exist:', verifyError);
        throw new Error(`Table verification failed: ${verifyError.message}`);
      } else {
        console.log('Table verification successful');
      }
    } catch (verifyError) {
      console.error('Exception during table verification:', verifyError);
      return new Response(
        null,
        { 
          headers: { 
            ...corsHeaders,
            'Location': `/?error=${encodeURIComponent('Failed to verify tokens table: ' + verifyError.message)}`
          },
          status: 302 
        }
      );
    }

    // Delete any existing tokens for this user
    console.log('Removing any existing tokens for user:', userIdParam)
    try {
      const { error: deleteError } = await supabase
        .from('gmail_tokens')
        .delete()
        .eq('user_id', userIdParam)
      
      if (deleteError) {
        console.error('Error deleting existing tokens:', deleteError)
        // Continue anyway since this might be a first-time setup
      } else {
        console.log('Successfully deleted any existing tokens')
      }
    } catch (deleteError) {
      console.error('Exception during token deletion:', deleteError)
      // Continue anyway since this might be a first-time setup
    }

    // Store the tokens
    console.log('Storing new tokens in database for user:', userIdParam)
    try {
      const tokenData = {
        user_id: userIdParam,
        access_token: data.access_token,
        refresh_token: data.refresh_token || null,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      }
      
      console.log('Token data being stored:', {
        user_id: tokenData.user_id,
        access_token: '***redacted***',
        refresh_token: tokenData.refresh_token ? '***redacted***' : null,
        expires_at: tokenData.expires_at
      })
      
      // Log the insert operation and response in detail
      console.log('Attempting to insert token data into gmail_tokens table');
      
      const { data: insertData, error: insertError } = await supabase
        .from('gmail_tokens')
        .insert(tokenData)
        .select()
      
      console.log('Insert operation complete');

      if (insertError) {
        console.error('Error storing tokens:', insertError);
        console.error('Error details:', JSON.stringify(insertError));
        
        // Try an alternative approach with rpc query
        console.log('Attempting alternative direct SQL insert');
        try {
          const { error: directInsertError } = await supabase.rpc(
            'query',
            {
              query: `
                INSERT INTO public.gmail_tokens (user_id, access_token, refresh_token, expires_at)
                VALUES ('${userIdParam}', '${data.access_token.replace(/'/g, "''")}', 
                ${data.refresh_token ? `'${data.refresh_token.replace(/'/g, "''")}'` : 'NULL'},
                '${new Date(Date.now() + data.expires_in * 1000).toISOString()}');
              `
            }
          );
          
          if (directInsertError) {
            console.error('Direct SQL insert failed:', directInsertError);
            throw directInsertError;
          } else {
            console.log('Successfully inserted tokens using direct SQL');
          }
        } catch (directInsertError) {
          console.error('Exception during direct SQL insert:', directInsertError);
          throw directInsertError;
        }
      } else {
        console.log('Successfully stored tokens in database');
        console.log('Inserted data:', insertData);
      }
    } catch (insertError) {
      console.error('Exception during token insertion:', insertError);
      return new Response(
        null,
        { 
          headers: { 
            ...corsHeaders,
            'Location': `/?error=${encodeURIComponent('Exception storing tokens: ' + insertError.message)}`
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
