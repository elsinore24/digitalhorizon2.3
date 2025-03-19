-- Update CORS configuration for the narration-audio bucket
UPDATE storage.buckets
SET cors_origins = ARRAY['*']::text[],
    cors_methods = ARRAY['GET', 'HEAD', 'OPTIONS']::text[],
    cors_headers = ARRAY['Range', 'Content-Type', 'Accept', 'Authorization', 'Origin', 'X-Requested-With']::text[],
    cors_exposed_headers = ARRAY['Content-Range', 'Content-Length', 'Content-Type']::text[]
WHERE name = 'narration-audio';
