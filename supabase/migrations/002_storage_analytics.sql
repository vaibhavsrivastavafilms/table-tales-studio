-- Storage buckets
insert into storage.buckets (id, name, public)
values
  ('project-images', 'project-images', true),
  ('exports', 'exports', false),
  ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

-- Analytics events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_id_idx
  on public.analytics_events (user_id);

alter table public.analytics_events enable row level security;

create policy "analytics_select_own" on public.analytics_events
  for select using (auth.uid() = user_id);

create policy "analytics_insert_own" on public.analytics_events
  for insert with check (auth.uid() = user_id);

-- Storage policies (authenticated users manage own folder)
create policy "project_images_select" on storage.objects
  for select using (bucket_id = 'project-images');

create policy "project_images_insert" on storage.objects
  for insert with check (
    bucket_id = 'project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "project_images_delete" on storage.objects
  for delete using (
    bucket_id = 'project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "thumbnails_select" on storage.objects
  for select using (bucket_id = 'thumbnails');

create policy "thumbnails_insert" on storage.objects
  for insert with check (
    bucket_id = 'thumbnails'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "exports_insert" on storage.objects
  for insert with check (
    bucket_id = 'exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
