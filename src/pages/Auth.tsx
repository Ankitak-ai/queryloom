import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/lib/toast';
import { Brain, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user is already authenticated, redirect to main page immediately
    if (user) {
      navigate('/');
      return;
    }
    
    // Check if we have hash params from email confirmation
    const hash = location.hash;
    if (hash) {
      // Handle auth redirect with tokens in URL
      if (hash.includes('access_token') || hash.includes('error')) {
        if (hash.includes('error')) {
          const params = new URLSearchParams(hash.substring(1));
          const error = params.get('error_description') || 'Authentication failed';
          toast.error(decodeURIComponent(error));
        } else {
          // If we have an access token, it means the authentication was successful
          // Supabase client will automatically handle the token
          toast.success('Email confirmed successfully!');
          // Navigate to home page after successful email confirmation
          navigate('/');
        }
      }
    }
  }, [location, user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Successfully signed in!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        // Show registration complete message instead of redirecting
        setRegistrationComplete(true);
        toast.success('Registration successful! Please check your email for confirmation.');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  // If user is already logged in, don't show the login form at all
  // This is redundant with the redirect in useEffect, but adds an extra layer of protection
  if (user) {
    return null;
  }

  // Show registration complete message
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl">Account Created!</CardTitle>
            <CardDescription>Your account has been created successfully.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-300">
                You may see a localhost error while confirming your email. If this happens, please come back and login with your credentials.
              </AlertDescription>
            </Alert>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Please check your email for a confirmation link. After confirming your email, you can log in to your account.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-purple-700 hover:bg-purple-800" 
              onClick={() => setRegistrationComplete(false)}
            >
              Return to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If we're processing the redirect, don't show the login form
  if (location.hash && (location.hash.includes('access_token') || location.hash.includes('error'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl">Processing Authentication</CardTitle>
            <CardDescription>Please wait while we confirm your authentication...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Brain className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">AI SQL Query Builder</CardTitle>
          <CardDescription>Sign in to save your queries</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-purple-700 hover:bg-purple-800" type="submit" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In with Email'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <p className="text-xs text-gray-500">
                    Password must be at least 6 characters long
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-purple-700 hover:bg-purple-800" type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account with Email'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
