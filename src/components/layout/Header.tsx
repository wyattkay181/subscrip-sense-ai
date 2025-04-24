
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthButtons from './AuthButtons';
import { useAuth } from '@/providers/AuthProvider';

const Header = () => {
  const { user } = useAuth();
  
  return (
    <header className="border-b px-4 py-3 sm:px-6 md:px-8 lg:px-10 flex items-center justify-between bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:flex" />
        <h1 className="text-xl font-bold hidden sm:block">Wyatt's Subscriptions</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {user && (
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-subscription-red rounded-full"></span>
          </Button>
        )}
        
        <AuthButtons />
      </div>
    </header>
  );
};

export default Header;
