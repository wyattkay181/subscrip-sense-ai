
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const SUPABASE_URL = "https://nggmgtwwosrtwbmjpezi.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZ21ndHd3b3NydHdibWpwZXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxODUzMjEsImV4cCI6MjA2MDc2MTMyMX0.zdR-7PHgRB7l7NGrPh2XPj9x4pxgcHUKrDb-rqyFh24";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
