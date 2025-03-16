-- Create storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('narration-audio', 'narration-audio', true, 52428800, array['audio/mpeg', 'audio/mp3']),
  ('game-assets', 'game-assets', true, 104857600, array['image/png', 'image/jpeg', 'image/webp', 'video/mp4']),
  ('user-content', 'user-content', false, 10485760, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

-- Set up storage policies for narration-audio bucket
create policy "Public can read narration audio"
  on storage.objects for select
  using (bucket_id = 'narration-audio');

-- Set up storage policies for game-assets bucket
create policy "Public can read game assets"
  on storage.objects for select
  using (bucket_id = 'game-assets');

-- Set up storage policies for user-content bucket
create policy "Users can read their own content"
  on storage.objects for select
  using (
    bucket_id = 'user-content' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload their own content"
  on storage.objects for insert
  with check (
    bucket_id = 'user-content' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own content"
  on storage.objects for update
  using (
    bucket_id = 'user-content' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own content"
  on storage.objects for delete
  using (
    bucket_id = 'user-content' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
