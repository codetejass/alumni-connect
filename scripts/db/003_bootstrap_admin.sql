-- Replace the placeholder email below before running this script.

-- Ensure a profile row exists for the user (if not, insert)
insert into public.profiles (id, role, institute_email, full_name, verified)
select u.id, 'admin', u.email, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), true
from auth.users u
where lower(u.email) = lower('admin@your-domain.com') -- TODO: replace with your email
on conflict (id) do update set role = 'admin';

-- Optional: confirm result
-- select id, role, institute_email from public.profiles where lower(institute_email) = lower('admin@your-domain.com');
