
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/providers/AuthProvider';
import { User, LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthButtons = () => {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <User size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {user.email ? (
              <div className="flex flex-col">
                <span>Account</span>
                <span className="text-xs text-muted-foreground font-normal truncate max-w-[200px]">
                  {user.email}
                </span>
              </div>
            ) : (
              "Account"
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isLoading ? "Signing out..." : "Sign out"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => navigate('/auth')} 
      className="flex items-center gap-2"
    >
      <LogIn size={16} />
      Sign In
    </Button>
  );
};

export default AuthButtons;
