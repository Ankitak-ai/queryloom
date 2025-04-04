
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  username: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsernameExistsResult {
  username_exists: boolean;
}

/**
 * Custom wrapper around Supabase RPC calls to handle type assertions
 */
export const rpcCall = async <T>(
  functionName: string, 
  params: Record<string, any> = {}
): Promise<{ data: T | null; error: Error | null }> => {
  // @ts-ignore - Ignore the type checking for rpc function name
  const result = await supabase.rpc(functionName, params);
  return result as { data: T | null; error: Error | null };
};

export const getUserProfile = async (userId: string) => {
  return rpcCall<UserProfile[]>('get_user_profile', { user_id: userId });
};

export const checkUsernameExists = async (username: string, excludeUserId: string) => {
  return rpcCall<UsernameExistsResult[]>('check_username_exists', { 
    username_to_check: username, 
    exclude_user_id: excludeUserId 
  });
};

export const updateUserProfile = async (userId: string, username: string) => {
  return rpcCall<null>('update_user_profile', { 
    user_id: userId, 
    new_username: username 
  });
};
