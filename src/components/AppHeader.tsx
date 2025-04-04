
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Brain, LogIn, LogOut, User, Settings } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

const AppHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  useEffect(() => {
    if (user) {
      const fetchUsername = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          setUsername(data.username);
        }
      };
      
      fetchUsername();
    }
  }, [user]);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm py-3">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <span className="font-semibold text-lg">SQL Builder</span>
        </Link>
        
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarFallback className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {username ? username.substring(0, 2).toUpperCase() : user.email?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
                      {username || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings size={14} />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer">
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="text-xs flex items-center gap-1"
            >
              <Link to="/auth">
                <LogIn size={14} />
                <span>Sign In</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
