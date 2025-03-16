-- Create game saves table
create table game_saves (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  save_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS policies
alter table game_saves enable row level security;

create policy "Users can read their own saves"
  on game_saves for select
  using (auth.uid() = user_id);

create policy "Users can insert their own saves"
  on game_saves for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own saves"
  on game_saves for update
  using (auth.uid() = user_id);
