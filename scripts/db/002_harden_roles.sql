-- Drop and recreate more secure profiles policies

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;

-- Users can insert their own profile but NOT as admin
create policy "profiles_insert_self_no_admin" on public.profiles
  for insert
  with check (
    auth.uid() = id
    and role <> 'admin'
  );

-- Admins may insert admin profiles (rare, typically bootstrap handles first admin)
create policy "profiles_insert_admin" on public.profiles
  for insert
  with check (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    and role = 'admin'
  );

-- Users can update their own profile fields, but cannot change role unless they are admin
create policy "profiles_update_self_or_admin_strict" on public.profiles
  for update
  using (
    auth.uid() = id
    or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    (
      auth.uid() = id
      and role = old.role -- non-admins cannot change role
    )
    or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
