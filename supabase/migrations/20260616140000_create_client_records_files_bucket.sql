-- Vytvorenie storage bucketu pre súbory a fotky k diagnostike
insert into storage.buckets (id, name, public)
values ('client_records_files', 'client_records_files', true)
on conflict (id) do nothing;

-- RLS pre client_records_files bucket

-- Každý môže čítať verejné súbory (lebo je to public bucket a URL budeme zobrazovať v UI)
create policy "Public access to client_records_files"
  on storage.objects for select
  using ( bucket_id = 'client_records_files' );

-- Iba špecialisti a admini môžu nahrávať fotky k záznamom
create policy "Specialists can upload client_records_files"
  on storage.objects for insert
  with check ( bucket_id = 'client_records_files' and public.is_specialist(auth.uid()) );

-- Iba špecialisti a admini môžu mazať
create policy "Specialists can delete client_records_files"
  on storage.objects for delete
  using ( bucket_id = 'client_records_files' and public.is_specialist(auth.uid()) );
