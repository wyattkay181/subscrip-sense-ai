
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';

const Header = () => {
  return (
    <header className="border-b px-4 py-3 sm:px-6 md:px-8 lg:px-10 flex items-center justify-between bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:flex" />
        <h1 className="text-xl font-bold hidden sm:block">Subscription Manager</h1>
      </div>
    </header>
  );
};

export default Header;
