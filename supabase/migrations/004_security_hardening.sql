-- Phase 9.1: tighten export ownership and storage upsert paths

drop policy if exists "exports_insert_own" on public.exports;

create policy "exports_insert_own" on public.exports
  for insert with check (
    auth.uid() = user_id
    and (
      project_id is null
      or exists (
        select 1 from public.projects p
        where p.id = project_id and p.user_id = auth.uid()
      )
    )
  );

-- Storage upsert requires update on objects
drop policy if exists "project_images_update" on storage.objects;
create policy "project_images_update" on storage.objects
  for update using (
    bucket_id = 'project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "thumbnails_update" on storage.objects;
create policy "thumbnails_update" on storage.objects
  for update using (
    bucket_id = 'thumbnails'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "exports_select_own" on storage.objects;
create policy "exports_select_own" on storage.objects
  for select using (
    bucket_id = 'exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
