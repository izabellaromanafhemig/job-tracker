-- Job Tracker: initial schema
-- Run this once in the Supabase dashboard (SQL Editor).

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
create table public.applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company     text not null check (length(trim(company)) > 0),
  position    text not null check (length(trim(position)) > 0),
  status      text not null default 'applied'
              check (status in ('applied', 'interviewing', 'offer', 'rejected')),
  applied_on  date not null,
  notes       text,
  created_at  timestamptz not null default now(),
  -- Lets tasks reference (id, user_id) so a task can only point at
  -- an application owned by the same user.
  unique (id, user_id)
);

create index applications_user_id_idx on public.applications (user_id);

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  application_id  uuid not null,
  title           text not null check (length(trim(title)) > 0),
  due_date        date,
  done            boolean not null default false,
  created_at      timestamptz not null default now(),
  foreign key (application_id, user_id)
    references public.applications (id, user_id) on delete cascade
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_application_id_idx on public.tasks (application_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: each user can only read and write their own rows.
-- ---------------------------------------------------------------------------
alter table public.applications enable row level security;
alter table public.tasks enable row level security;

create policy "Users can read their own applications"
  on public.applications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own applications"
  on public.applications for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own applications"
  on public.applications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own applications"
  on public.applications for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own tasks"
  on public.tasks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own tasks"
  on public.tasks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Logged-in users may use these tables (RLS above still limits them to their
-- own rows). Anonymous visitors get no access.
grant select, insert, update, delete on public.applications to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
revoke all on public.applications from anon;
revoke all on public.tasks from anon;
