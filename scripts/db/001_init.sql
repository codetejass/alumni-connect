-- Enable extensions if needed
-- create extension if not exists "uuid-ossp";
-- create extension if not exists pgcrypto;

-- Profiles table (1:1 to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student','alumni','recruiter','admin')),
  admission_id text unique,
  recruiter_registration_id text unique,
  institute_email text unique,
  full_name text,
  course text,
  specialization text,
  interests jsonb default '[]'::jsonb,
  mentorship_enabled boolean default false,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_admission on public.profiles(admission_id);

-- Alumni document verification (OCR/manual)
create table if not exists public.alumni_verifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_url text,
  ocr_text text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

create index if not exists idx_alumni_verifications_user on public.alumni_verifications(user_id);
create index if not exists idx_alumni_verifications_status on public.alumni_verifications(status);

-- Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_id uuid references public.profiles(id) on delete set null,
  scope text not null default 'global' check (scope in ('global','students','alumni','recruiters')),
  approved boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists idx_announcements_scope on public.announcements(scope);
create index if not exists idx_announcements_approved on public.announcements(approved);

-- Mentorships
create table if not exists public.mentorships (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  mentee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested','accepted','completed','declined')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_mentorships_mentor on public.mentorships(mentor_id);
create index if not exists idx_mentorships_mentee on public.mentorships(mentee_id);
create unique index if not exists uniq_mentorship_pair on public.mentorships(mentor_id, mentee_id);

-- Messages (simple realtime chat scoped to mentorship)
create table if not exists public.messages (
  id bigserial primary key,
  mentorship_id uuid not null references public.mentorships(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);
create index if not exists idx_messages_mentorship on public.messages(mentorship_id);
create index if not exists idx_messages_sender on public.messages(sender_id);

-- Recruiter job posts
create table if not exists public.recruiter_posts (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  location text,
  job_type text,
  approved boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists idx_recruiter_posts_recruiter on public.recruiter_posts(recruiter_id);
create index if not exists idx_recruiter_posts_approved on public.recruiter_posts(approved);

-- Applications to posts
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.recruiter_posts(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'applied' check (status in ('applied','shortlisted','rejected','hired')),
  created_at timestamptz default now()
);
create index if not exists idx_applications_post on public.applications(post_id);
create unique index if not exists uniq_app_per_post on public.applications(post_id, applicant_id);

-- Fundraising
create table if not exists public.fundraising_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  goal_amount numeric(12,2) not null,
  raised_amount numeric(12,2) not null default 0,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.fundraising_campaigns(id) on delete cascade,
  donor_id uuid references public.profiles(id) on delete set null,
  amount numeric(12,2) not null,
  payment_status text not null default 'pending' check (payment_status in ('pending','succeeded','failed')),
  created_at timestamptz default now()
);
create index if not exists idx_donations_campaign on public.donations(campaign_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.alumni_verifications enable row level security;
alter table public.announcements enable row level security;
alter table public.mentorships enable row level security;
alter table public.messages enable row level security;
alter table public.recruiter_posts enable row level security;
alter table public.applications enable row level security;
alter table public.fundraising_campaigns enable row level security;
alter table public.donations enable row level security;

-- Profiles: owner can read/update self, admins can read all
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (
    auth.uid() = id
    or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "profiles_update_self_or_admin" on public.profiles
  for update using (
    auth.uid() = id
    or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

-- Alumni verifications: owner read/insert, admin manage
create policy "alumni_verif_owner_select" on public.alumni_verifications
  for select using (auth.uid() = user_id or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

create policy "alumni_verif_owner_insert" on public.alumni_verifications
  for insert with check (auth.uid() = user_id);

create policy "alumni_verif_admin_update" on public.alumni_verifications
  for update using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- Announcements: admin full, alumni can insert pending, everyone can read approved
create policy "ann_select_approved" on public.announcements
  for select using (approved = true or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

create policy "ann_insert_alumni_admin" on public.announcements
  for insert with check (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('alumni','admin'))
  );

create policy "ann_update_admin" on public.announcements
  for update using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- Mentorships: involved users read, mentee can create with mentor who has mentorship_enabled, mentor/admin can update status
create policy "mentor_read_involved" on public.mentorships
  for select using (auth.uid() = mentor_id or auth.uid() = mentee_id or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

create policy "mentee_insert_req" on public.mentorships
  for insert with check (
    auth.uid() = mentee_id and
    exists(select 1 from public.profiles mp where mp.id = mentor_id and mp.mentorship_enabled = true)
  );

create policy "mentor_update_status" on public.mentorships
  for update using (auth.uid() = mentor_id or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- Messages: participants of mentorship
create policy "messages_read_write" on public.messages
  for all using (
    exists(
      select 1 from public.mentorships m
      where m.id = messages.mentorship_id and (m.mentor_id = auth.uid() or m.mentee_id = auth.uid())
    )
  )
  with check (
    exists(
      select 1 from public.mentorships m
      where m.id = mentorship_id and (m.mentor_id = auth.uid() or m.mentee_id = auth.uid())
    )
  );

-- Recruiter posts: recruiter can insert own; admin approves; everyone reads approved
create policy "recruiter_posts_select" on public.recruiter_posts
  for select using (approved = true or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin') or recruiter_id = auth.uid());

create policy "recruiter_posts_insert" on public.recruiter_posts
  for insert with check (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='recruiter'));

create policy "recruiter_posts_update_admin" on public.recruiter_posts
  for update using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin' or p.id = recruiter_id));

-- Applications
create policy "applications_read_owner_recruiter" on public.applications
  for select using (
    applicant_id = auth.uid()
    or exists(
      select 1 from public.recruiter_posts rp
      where rp.id = applications.post_id and rp.recruiter_id = auth.uid()
    )
    or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin')
  );

create policy "applications_insert_self" on public.applications
  for insert with check (applicant_id = auth.uid());

create policy "applications_update_recruiter" on public.applications
  for update using (
    exists(
      select 1 from public.recruiter_posts rp
      where rp.id = applications.post_id and rp.recruiter_id = auth.uid()
    ) or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin')
  );

-- Fundraising: everyone reads active campaigns, donors insert their donations
create policy "campaigns_select_active" on public.fundraising_campaigns
  for select using (active = true or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

create policy "campaigns_insert_admin" on public.fundraising_campaigns
  for insert with check (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

create policy "campaigns_update_admin" on public.fundraising_campaigns
  for update using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

create policy "donations_select_self_admin" on public.donations
  for select using (donor_id = auth.uid() or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

create policy "donations_insert_self" on public.donations
  for insert with check (donor_id = auth.uid());

-- Updated timestamps
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();
