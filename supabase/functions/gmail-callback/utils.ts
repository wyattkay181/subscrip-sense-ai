
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const getRedirectBaseUrl = (requestUrl: string) => {
  const baseUrl = new URL(requestUrl).origin.replace('nggmgtwwosrtwbmjpezi.supabase.co', 'lovableproject.com');
  return baseUrl;
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
