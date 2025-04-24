
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ConnectGmailDialog = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Check for successful Gmail connection or errors
  useEffect(() => {
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
      setIsLoading(true);
      setError(null);
      
      const tableCreated = await createGmailTable();
      if (!tableCreated) {
        setIsLoading(false);
        return;
      }
      
      // Removed unnecessary query that was causing issues
      // We don't need to query the table - just ensure it exists
      
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
      
      // Rename to responseData to avoid duplicate variable name
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
              disabled={isLoading}
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
