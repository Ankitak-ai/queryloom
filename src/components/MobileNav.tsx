
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, BarChart2, MessageSquare } from "lucide-react";
import SocialLinks from '@/components/SocialLinks';

const MobileNav = () => {
  const location = useLocation();
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        <div className="flex flex-col gap-6 mt-8">
          <nav className="flex flex-col gap-4">
            <Link 
              to="/" 
              className={`flex items-center gap-2 text-sm py-2 px-3 rounded-md ${location.pathname === '/' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
            <Link 
              to="/powerbi" 
              className={`flex items-center gap-2 text-sm py-2 px-3 rounded-md ${location.pathname === '/powerbi' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
            >
              <BarChart2 size={18} />
              <span>Power BI</span>
            </Link>
            <Link 
              to="/reviews" 
              className={`flex items-center gap-2 text-sm py-2 px-3 rounded-md ${location.pathname === '/reviews' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
            >
              <MessageSquare size={18} />
              <span>Reviews</span>
            </Link>
          </nav>
          
          {/* Social links at the bottom of mobile menu */}
          <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-2 px-3 mb-2 text-sm text-gray-500 dark:text-gray-400">
              Follow us:
            </div>
            <div className="px-3">
              <SocialLinks />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
