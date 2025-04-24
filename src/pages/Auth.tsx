
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Mail, Key, User, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if already logged in
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        // If we have a redirect URL, go there, otherwise go to home
        if (redirectUrl) {
          navigate(redirectUrl);
        } else {
          navigate('/');
        }
      }
    };
    
    // Check for redirect params in URL
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      setRedirectUrl(decodeURIComponent(redirect));
    }
    
    checkAuth();
  }, [navigate, location, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
        });
        
        if (error) {
          throw error;
        }
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (error) {
          throw error;
        }
        
        toast({
          title: "Logged in successfully!",
          description: "Welcome back to SubscripSense.",
        });
        
        // Navigate to redirect URL or home
        if (redirectUrl) {
          navigate(redirectUrl);
        } else {
          navigate('/');
        }
      }
    } catch (error: any) {
      toast({
        title: "Authentication error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/40 px-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 flex items-center gap-2"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Button>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'login' 
              ? 'Enter your email to sign in to your account' 
              : 'Enter your email to create an account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  placeholder="your@email.com" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  placeholder="••••••••" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === 'login' ? (
                    <>
                      <User size={18} />
                      Sign In
                    </>
                  ) : (
                    <>
                      <User size={18} />
                      Create Account
                    </>
                  )}
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-center text-sm mt-2">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button 
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
