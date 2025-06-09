
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import CategoryBreakdown from '@/components/dashboard/CategoryBreakdown';
import SpendingTrend from '@/components/dashboard/SpendingTrend';
import UsageInsights from '@/components/dashboard/UsageInsights';
import SubscriptionList from '@/components/dashboard/SubscriptionList';
import OptimizationSuggestions from '@/components/dashboard/OptimizationSuggestions';
import SubscriptionFormDialog from '@/components/dashboard/SubscriptionFormDialog';
import AIAssistant from '@/components/dashboard/AIAssistant';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const Index = () => {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  
  return (
    <AppLayout>
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Subscription Dashboard</h1>
          <p className="text-muted-foreground">Track and optimize your recurring payments</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="hidden md:flex" 
            onClick={() => setIsAIAssistantOpen(true)}
          >
            Ask AI Assistant
          </Button>
          <SubscriptionFormDialog />
        </div>
      </div>
      
      <div className="space-y-6">
        <DashboardStats />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UsageInsights />
          <CategoryBreakdown />
          <SpendingTrend />
        </div>
        
        <SubscriptionList />
        
        <OptimizationSuggestions />
        
        <Dialog open={isAIAssistantOpen} onOpenChange={setIsAIAssistantOpen}>
          <DialogContent className="sm:max-w-[600px] p-0">
            <AIAssistant />
          </DialogContent>
        </Dialog>
        
        <Button 
          className="md:hidden fixed bottom-4 right-4 rounded-full w-12 h-12 p-0 shadow-lg"
          onClick={() => setIsAIAssistantOpen(true)}
        >
          <span className="sr-only">Open AI Assistant</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-6 h-6"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </Button>
      </div>
    </AppLayout>
  );
};

export default Index;
