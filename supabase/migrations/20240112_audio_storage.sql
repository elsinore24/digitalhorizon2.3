-- Create storage bucket for narration audio if it doesn't exist
insert into storage.buckets (id, name, public)
values ('narration-audio', 'narration-audio', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist
drop policy if exists "Public can read narration audio" on storage.objects;
drop policy if exists "Authenticated users can upload narration audio" on storage.objects;

-- Create or recreate policies
create policy "Public can read narration audio"
  on storage.objects for select
  using (bucket_id = 'narration-audio');

create policy "Authenticated users can upload narration audio"
  on storage.objects for insert
  with check (
    bucket_id = 'narration-audio' AND
    auth.role() = 'authenticated'
  );
