-- Procurement document storage buckets (PDFs, OCR JSON, credit notes)
insert into storage.buckets (id, name, public)
values
  ('procurement-documents', 'procurement-documents', true),
  ('ocr-json', 'ocr-json', true),
  ('credit-notes', 'credit-notes', true)
on conflict (id) do nothing;

create policy "procurement_documents_select" on storage.objects
  for select using (bucket_id = 'procurement-documents');

create policy "procurement_documents_insert" on storage.objects
  for insert with check (
    bucket_id = 'procurement-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "ocr_json_select" on storage.objects
  for select using (bucket_id = 'ocr-json');

create policy "ocr_json_insert" on storage.objects
  for insert with check (
    bucket_id = 'ocr-json'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "credit_notes_select" on storage.objects
  for select using (bucket_id = 'credit-notes');

create policy "credit_notes_insert" on storage.objects
  for insert with check (
    bucket_id = 'credit-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
