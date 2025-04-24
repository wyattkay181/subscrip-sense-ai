
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Mail } from "lucide-react";
import { useGmailConnection } from "@/hooks/useGmailConnection";
import GmailDialogContent from "./GmailDialogContent";

const ConnectGmailDialog = () => {
  const [open, setOpen] = useState(false);
  const { isLoading, error, initiateOAuthFlow, isAuthenticated } = useGmailConnection();

  const handleConnectGmail = () => {
    setOpen(true);
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
        <GmailDialogContent
          error={error}
          isLoading={isLoading}
          isAuthenticated={isAuthenticated}
          onConnect={initiateOAuthFlow}
        />
      </Dialog>
    </>
  );
};

export default ConnectGmailDialog;
