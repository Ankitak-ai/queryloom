
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Brain, LogIn, LogOut, User, MessageSquare, UserPlus } from 'lucide-react';

const AppHeader: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm py-3">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <span className="font-semibold text-lg">SQL Builder</span>
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
        
        <div className="flex flex-col items-end">
          {loading ? (
            <div className="h-9 flex items-center">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-24 rounded"></div>
            </div>
          ) : user ? (
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
          
          <div className="mt-3">
            <a 
              href="https://www.producthunt.com/posts/ai-sql-query-builder?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-ai&#0045;sql&#0045;query&#0045;builder" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <img 
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=949654&theme=light&t=1743802327481" 
                alt="AI SQL Query Builder - query-craft-ai-web | Product Hunt" 
                style={{ width: '250px', height: '54px' }} 
                width="250" 
                height="54" 
              />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
