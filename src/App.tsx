
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component that redirects to Auth if not authenticated
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  // We'll use a session check from localStorage as a quick check before the full auth context loads
  const hasSession = !!localStorage.getItem('supabase.auth.token');
  
  // If there's no session, redirect to the auth page
  return hasSession ? element : <Navigate to="/auth" replace />;
};

// Auth route component that redirects to Index if authenticated
const AuthRoute = ({ element }: { element: React.ReactNode }) => {
  // We'll use a session check from localStorage as a quick check before the full auth context loads
  const hasSession = !!localStorage.getItem('supabase.auth.token');
  
  // If there's a session, redirect to the home page
  return hasSession ? <Navigate to="/" replace /> : element;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthRoute element={<Auth />} />} />
            <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
