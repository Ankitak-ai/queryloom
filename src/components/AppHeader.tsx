
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Brain, LogIn, LogOut, User } from 'lucide-react';

const AppHeader: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

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
              <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                <User size={14} className="mr-1" />
                <span className="hidden sm:inline">{user.email}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="text-xs flex items-center gap-1"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </Button>
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
