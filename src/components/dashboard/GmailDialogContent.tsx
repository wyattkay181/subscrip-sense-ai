
import React from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface GmailDialogContentProps {
  error: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  onConnect: () => void;
}

const GmailDialogContent = ({ error, isLoading, isAuthenticated, onConnect }: GmailDialogContentProps) => {
  return (
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
      
      {!isAuthenticated && (
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
          {error}
        </div>
      )}
      
      <DialogFooter>
        <Button 
          variant="default"
          className="w-full"
          onClick={onConnect}
          disabled={isLoading || !isAuthenticated}
        >
          {isLoading ? "Connecting..." : "Continue with Gmail"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default GmailDialogContent;
