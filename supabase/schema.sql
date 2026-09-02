-- rayidali.com · run once in the Supabase SQL editor
create extension if not exists pgcrypto;

-- first-party event log (page views, section dwell, clicks, resume opens, ref hits)
create table if not exists public.events (
  id         bigserial primary key,
  ts         timestamptz not null default now(),
  event      text not null,
  path       text,
  sid        text,
  ref        text,
  props      jsonb not null default '{}'::jsonb,
  ua         text,
  referrer   text,
  country    text,
  city       text,
  ip_hash    text
);
create index if not exists events_ts_idx  on public.events (ts desc);
create index if not exists events_ref_idx on public.events (ref);
create index if not exists events_sid_idx on public.events (sid);

-- one opaque code per application / recruiter / channel
create table if not exists public.ref_codes (
  code            text primary key,
  label           text not null,
  company         text,
  channel         text,
  resume_variant  text not null default 'default',
  hits            integer not null default 0,
  created_at      timestamptz not null default now()
);

-- résumé variants (files live in the public "resumes" storage bucket)
create table if not exists public.resumes (
  id         uuid primary key default gen_random_uuid(),
  variant    text not null default 'default',
  label      text not null,
  file_url   text not null,
  active     boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists resumes_one_active_per_variant on public.resumes (variant) where active;

-- kept for a future contact form
create table if not exists public.contact_submissions (
  id         uuid primary key default gen_random_uuid(),
  ts         timestamptz not null default now(),
  name       text, email text, message text, ref text, ip_hash text
);

create or replace function public.bump_ref_hits(p_code text) returns void language sql as
$$ update public.ref_codes set hits = hits + 1 where code = p_code; $$;

-- lock everything down: the site writes with the service role, the admin reads with it too
alter table public.events              enable row level security;
alter table public.ref_codes           enable row level security;
alter table public.resumes             enable row level security;
alter table public.contact_submissions enable row level security;

-- public storage bucket for résumé PDFs
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', true)
  on conflict (id) do nothing;
create policy "resumes are public to read" on storage.objects for select using (bucket_id = 'resumes');

-- a starting résumé row pointing at the file shipped with the site
insert into public.resumes (variant, label, file_url, active)
  values ('default', 'General', '/resume.pdf', true)
  on conflict do nothing;
