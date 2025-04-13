
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Reviews from "./pages/Reviews";

// Protected route component that redirects to Index if authenticated
const AuthRoute = ({ element }: { element: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // Show loading state while we determine authentication
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
    </div>;
  }
  
  // If there's a user, redirect to the home page
  return user ? <Navigate to="/" replace /> : element;
};

// SEO component for dynamic canonical URLs
const SEO = () => {
  const location = useLocation();
  const baseUrl = "https://queryloom.fun";
  const canonicalUrl = `${baseUrl}${location.pathname === "/" ? "" : location.pathname}`;
  
  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" href="/lovable-uploads/0c750f2c-f51d-49ac-bfd3-01fb7d81314a.png" />
      <meta name="theme-color" content="#6d28d9" />
      <meta name="google-site-verification" content="o9nQaP1kCVl6QKWRZAhlk13A7GU12Teb9jlzWrO3gvw" />
      
      {/* Rest of your meta tags will be set in page-specific components */}
    </Helmet>
  );
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <SEO />
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthRoute element={<Auth />} />} />
            <Route path="/reviews" element={<Reviews />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  );
};

// Create QueryClient instance outside of the component
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AppRoutes />
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
