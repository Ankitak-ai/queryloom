
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import { Brain, User, Save } from 'lucide-react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username must be less than 50 characters")
});

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<{id: string, username: string | null}>({
    id: '',
    username: null
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setProfile(data);
          form.reset({
            username: data.username || '',
          });
        }
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load profile information');
      }
    };

    fetchUserProfile();
  }, [user, navigate, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Check if username is already taken (except by the current user)
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', values.username)
        .neq('id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;
      
      if (existingUser) {
        form.setError('username', { 
          type: 'manual', 
          message: 'This username is already taken' 
        });
        return;
      }

      // Update the user profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          username: values.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully');
      setProfile(prev => ({...prev, username: values.username}));
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  // If the user is not logged in, don't render the settings page
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950">
      <AppHeader />
      
      <div className="container px-4 mx-auto max-w-3xl py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-blue-500">
              Account Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
            Update your account settings and preferences
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Update your profile information
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                  <p>Email</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{user.email}</p>
                </div>
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose a unique username" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your public display name visible to other users
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-purple-700 hover:bg-purple-800 flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Save size={16} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
