-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Players table
create table players (
  id uuid references auth.users primary key,
  username text unique not null,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Game saves table
create table game_saves (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references players(id) not null,
  save_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Achievements table
create table achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references players(id) not null,
  achievement_id text not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, achievement_id)
);

-- RLS Policies
alter table players enable row level security;
alter table game_saves enable row level security;
alter table achievements enable row level security;

-- Players policies
create policy "Users can read their own profile"
  on players for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on players for update
  using (auth.uid() = id);

-- Game saves policies
create policy "Users can read their own saves"
  on game_saves for select
  using (auth.uid() = user_id);

create policy "Users can create their own saves"
  on game_saves for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own saves"
  on game_saves for update
  using (auth.uid() = user_id);

create policy "Users can delete their own saves"
  on game_saves for delete
  using (auth.uid() = user_id);

-- Achievements policies
create policy "Users can read their own achievements"
  on achievements for select
  using (auth.uid() = user_id);

create policy "Users can unlock achievements"
  on achievements for insert
  with check (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public) values 
  ('game-assets', 'game-assets', true),
  ('user-content', 'user-content', false);

-- Storage policies
create policy "Public read access for game assets"
  on storage.objects for select
  using (bucket_id = 'game-assets');

create policy "Users can access their own content"
  on storage.objects for all
  using (
    bucket_id = 'user-content' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );
