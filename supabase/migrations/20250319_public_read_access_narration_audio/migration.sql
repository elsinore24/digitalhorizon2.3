-- Create a policy to allow public read access to all objects in the narration-audio bucket
create policy "Public read access for narration-audio" 
on storage.objects 
for select 
using (bucket_id = 'narration-audio');
