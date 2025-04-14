import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

interface QueryUsage {
  count: number;
  resetTime: number; // Timestamp when the count resets
}

interface PageQueryLimits {
  home: number;
  powerbi: number;
  reviews: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  displayName: string;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  queryUsage: QueryUsage;
  pageQueryLimits: PageQueryLimits;
  getQueryLimit: (page: keyof PageQueryLimits) => number;
  incrementQueryUsage: (page: keyof PageQueryLimits) => boolean;
}

const QUERY_LIMITS_GUEST: PageQueryLimits = {
  home: 2,
  powerbi: 1,
  reviews: 1
};

const QUERY_LIMITS_USER: PageQueryLimits = {
  home: 10,
  powerbi: 1,
  reviews: 5
};

const RESET_PERIOD = 60 * 60 * 1000; // 1 hour in milliseconds

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>('');
  const [queryUsage, setQueryUsage] = useState<QueryUsage>(() => {
    const savedUsage = localStorage.getItem('queryUsage');
    if (savedUsage) {
      return JSON.parse(savedUsage);
    }
    return {
      count: 0,
      resetTime: Date.now() + RESET_PERIOD
    };
  });

  useEffect(() => {
    if (user) {
      let name = '';
      
      if (user.user_metadata) {
        name = user.user_metadata.full_name || 
               user.user_metadata.name || 
               user.user_metadata.user_name || 
               user.user_metadata.preferred_username || '';
      }
      
      if (!name && user.identities && user.identities.length > 0) {
        const identity = user.identities[0];
        if (identity.identity_data) {
          name = identity.identity_data.full_name || 
                 identity.identity_data.name || 
                 identity.identity_data.preferred_username || '';
        }
      }
      
      if (!name && user.email) {
        name = user.email.split('@')[0];
      }
      
      setDisplayName(name);
    } else {
      setDisplayName('');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('queryUsage', JSON.stringify(queryUsage));
  }, [queryUsage]);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          console.log("Auth state change: User signed in", currentSession.user.email);
        } else {
          console.log("Auth state change: No user");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession ? "Session found" : "No session");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getQueryLimit = (page: keyof PageQueryLimits) => {
    return user ? QUERY_LIMITS_USER[page] : QUERY_LIMITS_GUEST[page];
  };

  const incrementQueryUsage = (page: keyof PageQueryLimits): boolean => {
    const limit = getQueryLimit(page);
    
    if (queryUsage.count >= limit) {
      toast.error(`You've reached your limit of ${limit} queries per hour for this page.`);
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
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth'
      }
    });
  };

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/auth'
      }
    });
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
        displayName,
        signIn, 
        signUp,
        signInWithGoogle,
        signInWithGithub,
        signOut, 
        queryUsage, 
        pageQueryLimits: user ? QUERY_LIMITS_USER : QUERY_LIMITS_GUEST,
        getQueryLimit, 
        incrementQueryUsage 
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
