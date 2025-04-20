
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ConnectGmailDialog = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Handler for connecting Gmail
  const handleConnectGmail = () => {
    setOpen(true);
  };

  // Initiate the OAuth flow
  const initiateOAuthFlow = async () => {
    try {
      setIsLoading(true);
      
      // Call your Supabase Edge Function to get the authorization URL
      const response = await fetch('/api/gmail/auth-url');
      
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }
      
      const { url } = await response.json();
      
      // Redirect to Google's OAuth consent screen
      window.location.href = url;
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
