
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../gmail-callback/utils.ts";

console.log("Subscription scanner function loaded");

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user } = await getUser(req);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get Gmail tokens for the user
    const tokens = await getGmailTokens(user.id);
    if (!tokens) {
      throw new Error('Gmail not connected');
    }

    // Start scanning emails (this is just a placeholder for now)
    console.log('Starting subscription scan for user:', user.id);

    return new Response(
      JSON.stringify({ message: 'Scan initiated' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

async function getUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing auth header');
  }

  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      ApiKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user');
  }

  return await response.json();
}

async function getGmailTokens(userId: string) {
  const { data, error } = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/gmail_tokens?user_id=eq.${userId}&order=created_at.desc&limit=1`,
    {
      headers: {
        ApiKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
    }
  ).then(res => res.json());

  if (error) throw error;
  return data[0];
}
