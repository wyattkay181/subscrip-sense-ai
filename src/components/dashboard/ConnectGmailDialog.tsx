
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
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Check for successful Gmail connection
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('gmail-connected') === 'true') {
      toast({
        title: "Success!",
        description: "Gmail successfully connected.",
      });
      navigate('/'); // Remove the query parameter
    }
  }, [location, navigate, toast]);

  // Handler for connecting Gmail
  const handleConnectGmail = () => {
    setOpen(true);
  };

  // Initiate the OAuth flow
  const initiateOAuthFlow = async () => {
    try {
      setIsLoading(true);
      
      console.log('Invoking gmail-auth-url function');
      
      // Call the Supabase Edge Function to get the authorization URL
      const { data, error } = await supabase.functions.invoke('gmail-auth-url');
      
      if (error) {
        console.error('Error invoking function:', error);
        throw error;
      }
      
      if (!data?.url) {
        console.error('No URL returned from function:', data);
        throw new Error('Failed to get authorization URL');
      }
      
      console.log('Redirecting to Google auth URL:', data.url);
      
      // Redirect to Google's OAuth consent screen
      window.location.href = data.url;
    } catch (error) {
      console.error('OAuth initiation error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to Gmail. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
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
