
-- Function to get a user's profile by user_id
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE (id UUID, username TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT id, username, created_at, updated_at
  FROM profiles
  WHERE id = user_id;
$$;

-- Function to check if a username already exists (excluding the current user)
CREATE OR REPLACE FUNCTION public.check_username_exists(username_to_check TEXT, exclude_user_id UUID)
RETURNS TABLE (exists BOOLEAN)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE username = username_to_check
    AND id != exclude_user_id
  );
$$;

-- Function to update a user's profile
CREATE OR REPLACE FUNCTION public.update_user_profile(user_id UUID, new_username TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    username = new_username,
    updated_at = now()
  WHERE id = user_id;
END;
$$;
