
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { trackPageVisit } from '@/utils/trackPageVisit';

const Index = () => {
  const { user, incrementQueryUsage } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    trackPageVisit('/');
  }, []);

  const handleHomeAction = async () => {
    // Use the new page-specific query limit check for 'home'
    if (!incrementQueryUsage('home')) {
      return;
    }

    setIsLoading(true);
    try {
      // Placeholder for any home page specific action
      toast.success('Action performed successfully');
    } catch (error) {
      toast.error('Failed to perform action');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col justify-center items-center text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to QueryLoom</h1>
        <p className="text-xl mb-8">Weaving natural language into SQL queries seamlessly</p>
        
        <Button 
          onClick={handleHomeAction}
          disabled={isLoading}
          className="w-64"
        >
          {isLoading ? 'Processing...' : 'Explore Features'}
        </Button>
      </main>
    </div>
  );
};

export default Index;
