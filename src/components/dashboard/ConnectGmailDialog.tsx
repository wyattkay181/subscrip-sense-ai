
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Mail, Loader2 } from "lucide-react";
import { useGmailConnection } from "@/hooks/useGmailConnection";
import { useToast } from "@/hooks/use-toast";
import GmailDialogContent from "./GmailDialogContent";
import { supabase } from "@/integrations/supabase/client";

const ConnectGmailDialog = () => {
  const [open, setOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const { isLoading, error, initiateOAuthFlow, isAuthenticated } = useGmailConnection();

  const handleConnectGmail = () => {
    setOpen(true);
  };

  const startSubscriptionScan = async () => {
    try {
      setIsScanning(true);
      const { data, error } = await supabase.functions.invoke('scan-subscriptions', {
        body: { action: 'start-scan' }
      });

      if (error) throw error;

      toast({
        title: "Scan Started",
        description: "We're scanning your emails for subscriptions. This may take a few minutes.",
      });
    } catch (err) {
      console.error('Scan error:', err);
      toast({
        title: "Scan Failed",
        description: "Failed to start subscription scan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
      setOpen(false);
    }
  };

  useEffect(() => {
    // Check URL parameters for successful connection
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail-connected') === 'true') {
      startSubscriptionScan();
      // Clean up URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={handleConnectGmail}
        disabled={isLoading || isScanning}
      >
        {isScanning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail size={18} />
        )}
        {isScanning ? "Scanning Emails..." : "Connect Gmail"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <GmailDialogContent
          error={error}
          isLoading={isLoading}
          isAuthenticated={isAuthenticated}
          onConnect={initiateOAuthFlow}
          isScanning={isScanning}
        />
      </Dialog>
    </>
  );
};

export default ConnectGmailDialog;
