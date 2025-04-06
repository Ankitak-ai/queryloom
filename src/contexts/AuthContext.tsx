
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

interface QueryUsage {
  count: number;
  resetTime: number; // Timestamp when the count resets
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  queryUsage: QueryUsage;
  incrementQueryUsage: () => boolean; // Returns false if limit reached
  getQueryLimit: () => number;
}

const QUERY_LIMIT_GUEST = 2;
const QUERY_LIMIT_USER = 10;
const RESET_PERIOD = 60 * 60 * 1000; // 1 hour in milliseconds

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [queryUsage, setQueryUsage] = useState<QueryUsage>(() => {
    // Try to load from localStorage
    const savedUsage = localStorage.getItem('queryUsage');
    if (savedUsage) {
      return JSON.parse(savedUsage);
    }
    return {
      count: 0,
      resetTime: Date.now() + RESET_PERIOD
    };
  });

  // Save query usage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('queryUsage', JSON.stringify(queryUsage));
  }, [queryUsage]);

  // Check if we need to reset the query count
  useEffect(() => {
    const checkReset = () => {
      if (Date.now() > queryUsage.resetTime) {
        setQueryUsage({
          count: 0,
          resetTime: Date.now() + RESET_PERIOD
        });
      }
    };

    checkReset();
    const interval = setInterval(checkReset, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [queryUsage.resetTime]);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getQueryLimit = () => {
    return user ? QUERY_LIMIT_USER : QUERY_LIMIT_GUEST;
  };

  const incrementQueryUsage = () => {
    // Check if we've already hit the limit
    if (queryUsage.count >= getQueryLimit()) {
      return false;
    }

    setQueryUsage(prev => ({
      ...prev,
      count: prev.count + 1
    }));
    return true;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth',
      },
    });
    
    if (error) {
      toast.error(`Failed to sign in with Google: ${error.message}`);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider 
      value={{ 
        session, 
        user, 
        loading, 
        signIn, 
        signUp, 
        signInWithGoogle,
        signOut, 
        queryUsage, 
        incrementQueryUsage, 
        getQueryLimit 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
