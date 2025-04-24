
import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request with CORS headers')
    return new Response(null, { headers: corsHeaders })
  }
  
  // Log request details to help with debugging
  console.log('Create Gmail Table function called')
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  try {
    // Create a Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('Attempting to create gmail_tokens table via database function')
    
    // Create the table using the database function
    const { error } = await supabase.rpc('create_gmail_tokens_table')
    
    if (error) {
      console.error('Error creating table:', error)
      throw error
    }

    console.log('Table created or validated successfully')

    return new Response(
      JSON.stringify({ message: 'Table created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in create-gmail-table function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
