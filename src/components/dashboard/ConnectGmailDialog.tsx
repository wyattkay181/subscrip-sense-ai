
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Mail, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

const ConnectGmailDialog = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Check for successful Gmail connection or errors
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    if (searchParams.get('gmail-connected') === 'true') {
      toast({
        title: "Success!",
        description: "Gmail successfully connected.",
      });
      navigate('/');
    }
    
    const errorParam = searchParams.get('error');
    if (errorParam) {
      toast({
        title: "Connection Error",
        description: `Gmail connection failed: ${errorParam}`,
        variant: "destructive",
      });
      navigate('/');
    }
  }, [location, navigate, toast]);

  const handleConnectGmail = () => {
    if (!user) {
      // Redirect to auth page with a redirect back to current page
      navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    
    setOpen(true);
    setError(null);
  };

  const createGmailTable = async () => {
    try {
      const { error } = await supabase.rpc('create_gmail_tokens_table');
      
      if (error) {
        console.error('Table creation error:', error);
        setError(`Failed to prepare for Gmail connection: ${error.message}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error creating Gmail table:', error);
      setError(`Failed to prepare for Gmail connection: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };

  const initiateOAuthFlow = async () => {
    try {
      if (!user) {
        setError('You must be logged in to connect Gmail');
        toast({
          title: "Authentication Required",
          description: "Please log in to connect your Gmail account.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      const tableCreated = await createGmailTable();
      if (!tableCreated) {
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('https://nggmgtwwosrtwbmjpezi.supabase.co/functions/v1/gmail-auth-url', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setError(`Failed to start authentication: ${errorData.error || response.statusText}`);
        setIsLoading(false);
        return;
      }
      
      const responseData = await response.json();
      
      if (!responseData?.url) {
        console.error('No URL returned:', responseData);
        setError('Failed to get authorization URL from server');
        setIsLoading(false);
        return;
      }
      
      window.location.href = responseData.url;
    } catch (error) {
      console.error('OAuth initiation error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to Gmail. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={handleConnectGmail}
      >
        <Mail size={18} />
        Connect Gmail
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect your Gmail</DialogTitle>
            <DialogDescription>
              To scan your inbox for subscriptions, we'll connect to your Gmail account.
              <br /><br />
              We'll only read emails related to subscriptions and never store your full emails.
              <br /><br />
              <span className="inline-block mt-2 font-medium text-muted-foreground">
                You will be redirected to Google's secure login page.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          {!user && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-4">
              <h4 className="text-sm font-medium flex items-center text-amber-800 mb-1">
                <LogIn className="w-4 h-4 mr-1" />
                Authentication Required
              </h4>
              <p className="text-sm text-amber-700">
                You need to be logged in to connect your Gmail account.
                Please create an account or sign in first.
              </p>
            </div>
          )}
          
          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
              Error: {error}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="default"
              className="w-full"
              onClick={initiateOAuthFlow}
              disabled={isLoading || !user}
            >
              {isLoading ? "Connecting..." : "Continue with Gmail"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConnectGmailDialog;
