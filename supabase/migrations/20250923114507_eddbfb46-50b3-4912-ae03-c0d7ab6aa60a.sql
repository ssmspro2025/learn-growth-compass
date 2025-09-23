-- Fix infinite recursion in users table policies
-- Remove all existing policies on users table
DROP POLICY IF EXISTS "Super Admins can modify users" ON users;
DROP POLICY IF EXISTS "Super Admins can read all users" ON users;  
DROP POLICY IF EXISTS "Super admin can access all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "users_simple_access_v2" ON users;
DROP POLICY IF EXISTS "users_simple_policy" ON users;

-- Create simple, non-recursive policies for users table
CREATE POLICY "Users can view their own profile" ON users
FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users  
FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Super admin access" ON users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.auth_user_id = auth.uid() 
    AND u.role = 'super_admin'
    AND u.auth_user_id IS NOT NULL
  )
);

-- Update helper functions to avoid recursion by using simpler queries
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE auth_user_id = user_uuid LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid DEFAULT auth.uid())  
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role = 'super_admin' FROM users WHERE auth_user_id = user_uuid LIMIT 1), false);
$$;

CREATE OR REPLACE FUNCTION public.get_user_school(user_uuid uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM users WHERE auth_user_id = user_uuid LIMIT 1;
$$;