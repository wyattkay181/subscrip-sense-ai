
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Mail } from "lucide-react";

const ConnectGmailDialog = () => {
  const [open, setOpen] = useState(false);

  // Placeholder handler for connecting Gmail
  const handleConnectGmail = () => {
    // Here you will kick off the actual OAuth flow with Gmail
    // For now: just show the modal
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect your Gmail</DialogTitle>
            <DialogDescription>
              To scan your inbox for subscriptions, we'll connect to your Gmail account.
              <br /><br />
              Press the button below to proceed.<br />
              <span className="inline-block mt-2 font-medium text-warning">
                Note: You will be redirected to Google's secure login page.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="default"
              className="w-full"
              onClick={() => {
                // Placeholder for real OAuth flow!
                window.open("https://mail.google.com", "_blank");
              }}
            >
              Continue with Gmail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConnectGmailDialog;
