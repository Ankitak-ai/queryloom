
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogIn, LogOut, UserPlus, MessageSquare } from 'lucide-react';

const AppHeader: React.FC = () => {
  const { user, displayName, signOut, loading } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!displayName) return 'U';
    
    const parts = displayName.split(' ');
    if (parts.length === 1) {
      return displayName.charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm py-3">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/0c750f2c-f51d-49ac-bfd3-01fb7d81314a.png" 
              alt="QueryLoom Logo" 
              className="h-6 w-6" 
            />
            <span className="font-semibold text-lg">QueryLoom</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Link 
              to="/" 
              className={`text-sm ${location.pathname === '/' ? 'text-purple-600 font-medium' : 'text-gray-600 hover:text-purple-600'}`}
            >
              Home
            </Link>
            <Link 
              to="/reviews" 
              className={`text-sm flex items-center gap-1 ${location.pathname === '/reviews' ? 'text-purple-600 font-medium' : 'text-gray-600 hover:text-purple-600'}`}
            >
              <MessageSquare size={14} />
              <span>Reviews</span>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center">
          {loading ? (
            <div className="h-9 flex items-center">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-24 rounded"></div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span>{displayName || 'User'}</span>
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
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="text-xs flex items-center gap-1"
              >
                <Link to="/auth?tab=signin">
                  <LogIn size={14} />
                  <span>Login</span>
                </Link>
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                asChild
                className="text-xs flex items-center gap-1 bg-purple-700 hover:bg-purple-800"
              >
                <Link to="/auth?tab=signup">
                  <UserPlus size={14} />
                  <span>Sign Up</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
