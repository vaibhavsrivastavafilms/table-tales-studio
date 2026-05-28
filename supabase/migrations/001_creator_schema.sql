-- Table Tales Studio — creator cloud schema

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled Carousel',
  template_id text not null default 'street-food',
  captions jsonb not null default '{}'::jsonb,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  slide_key text not null,
  caption text not null default '',
  image_url text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (project_id, slide_key)
);

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  format text not null default 'jpeg',
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_updated_at_idx on public.projects (updated_at desc);
create index if not exists slides_project_id_idx on public.slides (project_id);
create index if not exists exports_user_id_idx on public.exports (user_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.slides enable row level security;
alter table public.exports enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);

create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id);

create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

create policy "slides_select_own" on public.slides
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "slides_insert_own" on public.slides
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "slides_update_own" on public.slides
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "slides_delete_own" on public.slides
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "exports_select_own" on public.exports
  for select using (auth.uid() = user_id);

create policy "exports_insert_own" on public.exports
  for insert with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
