
import { supabase } from '@/integrations/supabase/client';

export const trackPageVisit = async (pagePath: string = '/') => {
  try {
    // Get the client's IP address (this will be the server's IP in development)
    // In production, this would normally come from request headers or a service
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip } = await response.json();
    
    // Insert the page visit
    // Using type assertion to work around type checking for the new table
    await (supabase.from('page_visits') as any).insert({
      page_path: pagePath,
      ip_address: ip,
      user_agent: navigator.userAgent || null
    }).select();
    
    console.log('Page visit tracked successfully');
  } catch (error) {
    console.error('Error tracking page visit:', error);
  }
};
