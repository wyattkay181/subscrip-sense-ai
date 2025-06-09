
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import SubscriptionForm from './SubscriptionForm';

const SubscriptionFormDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubscriptionAdded = () => {
    setIsOpen(false);
    // Dispatch custom event to notify other components about the update
    window.dispatchEvent(new Event('subscriptionsUpdated'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Subscription</DialogTitle>
        </DialogHeader>
        <SubscriptionForm onSuccess={handleSubscriptionAdded} />
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionFormDialog;
