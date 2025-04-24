
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const getRedirectBaseUrl = (requestUrl: string) => {
  // Extract the domain from the URL using URL object
  const url = new URL(requestUrl);
  
  // Get the origin (scheme + hostname + port)
  const origin = url.origin;
  
  // Replace Supabase function URL with user app domain
  // This handles different Supabase URLs and production vs development environments
  if (origin.includes('.supabase.co')) {
    const appDomain = origin.split('.supabase.co')[0].split('://')[1];
    // For lovable projects, use lovableproject.com domain
    if (appDomain.includes('nggmgtwwosrtwbmjpezi')) {
      // Return the actual app domain
      return 'https://preview--subscrip-sense-ai.lovable.app';
    }
  }
  
  // Fallback to origin if we can't determine the app domain
  return origin;
};

export const createRedirectResponse = (redirectBaseUrl: string, params: Record<string, string>) => {
  const searchParams = new URLSearchParams(params);
  return new Response(
    null,
    {
      headers: {
        ...corsHeaders,
        'Location': `${redirectBaseUrl}/?${searchParams.toString()}`
      },
      status: 302
    }
  );
};

export const validateEnvironmentVariables = () => {
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_DB_URL',
  ];

  const missingVars = requiredEnvVars.filter(varName => !Deno.env.get(varName));
  
  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }
};
