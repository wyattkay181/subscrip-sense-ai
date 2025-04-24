
import { Pool } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';
import { corsHeaders } from './utils.ts';

export async function ensureGmailTokensTable(pgUrl: string, userId: string) {
  const pool = new Pool(pgUrl, 1, true);
  let connection;
  
  try {
    connection = await pool.connect();
    
    const tableCheck = await connection.queryObject(`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'gmail_tokens'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      await connection.queryObject(`
        CREATE TABLE IF NOT EXISTS public.gmail_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;
      `);
    }
    
    // Check and create policies
    const existingPolicies = await connection.queryObject(`
      SELECT policyname FROM pg_policies 
      WHERE tablename = 'gmail_tokens' AND schemaname = 'public';
    `);
    
    const requiredPolicies = [
      { 
        name: "Users can view their own tokens", 
        command: "SELECT", 
        using: "auth.uid() = user_id" 
      },
      { 
        name: "Users can insert their own tokens", 
        command: "INSERT", 
        check: "auth.uid() = user_id" 
      },
      { 
        name: "Users can update their own tokens", 
        command: "UPDATE", 
        using: "auth.uid() = user_id" 
      },
      { 
        name: "Users can delete their own tokens", 
        command: "DELETE", 
        using: "auth.uid() = user_id" 
      }
    ];
    
    const existingPolicyNames = existingPolicies.rows.map(row => row.policyname);
    
    for (const policy of requiredPolicies) {
      if (!existingPolicyNames.includes(policy.name)) {
        if (policy.command === "INSERT") {
          await connection.queryObject(`
            CREATE POLICY "${policy.name}" 
            ON public.gmail_tokens 
            FOR ${policy.command} 
            WITH CHECK (${policy.check});
          `);
        } else {
          await connection.queryObject(`
            CREATE POLICY "${policy.name}" 
            ON public.gmail_tokens 
            FOR ${policy.command} 
            USING (${policy.using});
          `);
        }
      }
    }
    
    // Delete existing tokens for this user
    await connection.queryObject(`
      DELETE FROM public.gmail_tokens 
      WHERE user_id = $1
    `, [userId]);
    
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

export async function storeGmailTokens(
  pgUrl: string,
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: string
) {
  const pool = new Pool(pgUrl, 1, true);
  let connection;
  
  try {
    connection = await pool.connect();
    await connection.queryObject(`
      INSERT INTO public.gmail_tokens (user_id, access_token, refresh_token, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [userId, accessToken, refreshToken, expiresAt]);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}
