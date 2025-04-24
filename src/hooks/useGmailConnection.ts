
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { supabase, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

export const useGmailConnection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    if (searchParams.get('gmail-connected') === 'true') {
      toast({
        title: "Success!",
        description: "Gmail successfully connected.",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    const errorParam = searchParams.get('error');
    if (errorParam) {
      console.error('Gmail connection error:', errorParam);
      toast({
        title: "Connection Error",
        description: `Gmail connection failed: ${errorParam}`,
        variant: "destructive",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location, toast]);

  const handleAuth = () => {
    if (!user) {
      const currentPath = location.pathname + location.search;
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      return false;
    }
    return true;
  };

  const initiateOAuthFlow = async () => {
    try {
      if (!handleAuth()) return;
      
      setIsLoading(true);
      setError(null);
      
      // Create table if it doesn't exist
      const createTableResponse = await fetch('https://nggmgtwwosrtwbmjpezi.supabase.co/functions/v1/create-gmail-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({ user_id: user.id })
      });
      
      if (!createTableResponse.ok) {
        const errorData = await createTableResponse.json();
        throw new Error(`Table creation failed: ${errorData.error || 'Unknown error'}`);
      }
      
      // Get auth URL and redirect
      const response = await fetch('https://nggmgtwwosrtwbmjpezi.supabase.co/functions/v1/gmail-auth-url', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': SUPABASE_PUBLISHABLE_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get auth URL (${response.status})`);
      }
      
      const { url } = await response.json();
      if (!url) {
        throw new Error('No authorization URL received');
      }
      
      window.location.href = url;
    } catch (error) {
      console.error('OAuth initiation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to Gmail');
      toast({
        title: "Error",
        description: "Failed to connect to Gmail. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    setError,
    initiateOAuthFlow,
    isAuthenticated: !!user
  };
};
