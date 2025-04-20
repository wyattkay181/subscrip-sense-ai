
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Calendar, 
  ChartPie, 
  Bell, 
  Plus, 
  Users 
} from 'lucide-react';

const AppSidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Calendar, label: 'Renewals', path: '/renewals' },
    { icon: ChartPie, label: 'Analytics', path: '/analytics' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Plus, label: 'Add Subscription', path: '/add' },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="py-6 px-3">
        <div className="flex items-center gap-2 px-2">
          <div className="bg-white rounded-md p-1 w-8 h-8 flex items-center justify-center">
            <div className="text-subscription-purple font-bold text-xl">S</div>
          </div>
          <span className="font-semibold text-lg text-white">SubscripSense</span>
        </div>
        <SidebarTrigger className="absolute right-3 top-6" />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
                    <Link to={item.path}>
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="py-4">
        <div className="px-4 py-2 mx-3 rounded-lg bg-sidebar-accent flex items-center gap-2">
          <Users size={16} />
          <span className="text-sm">Support</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
