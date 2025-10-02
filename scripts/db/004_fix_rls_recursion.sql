-- In scripts/db/004_fix_rls_recursion.sql

-- Creates a secure function to get the current user's role
-- without causing recursion in RLS policies.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
-- In scripts/db/004_fix_rls_recursion.sql
-- (Append this code below the function you just added)

-- Drop all previous, faulty RLS policies for the 'profiles' table
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self_no_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin_strict" ON public.profiles;

-- Create new, non-recursive RLS policies for the 'profiles' table

-- 1. Users can view their own profile, or any profile if they are an admin.
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.get_my_role() = 'admin'
  );

-- 2. Users can insert their own profile, but cannot assign themselves as admin.
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id AND role <> 'admin'
  );

-- 3. Users can update their own profile. Admins can update any profile.
--    Non-admins are prevented from changing their role.
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.get_my_role() = 'admin'
  ) WITH CHECK (
    -- The user is updating their own profile, and they are not trying to change their role.
    (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = id))
    -- Or, the user is an admin.
    OR public.get_my_role() = 'admin'
  );