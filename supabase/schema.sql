-- Enable RLS (Row Level Security)
alter table auth.users enable row level security;

-- Create user_profiles table
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on user_profiles
alter table public.user_profiles enable row level security;

-- Create RLS policies for user_profiles
create policy "Users can view own profile" on public.user_profiles
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on public.user_profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.user_profiles
  for update using (auth.uid() = id);

-- Create game_sessions table
create table if not exists public.game_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  character_name text not null,
  character_class text not null check (character_class in ('warrior', 'mage', 'rogue', 'cleric', 'ranger', 'paladin')),
  game_state jsonb not null default '{
    "level": 1,
    "health": 100,
    "maxHealth": 100,
    "experience": 0,
    "currentScene": 0,
    "inventory": [],
    "stats": {
      "strength": 10,
      "dexterity": 10,
      "intelligence": 10,
      "wisdom": 10,
      "constitution": 10,
      "charisma": 10
    }
  }'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on game_sessions
alter table public.game_sessions enable row level security;

-- Create RLS policies for game_sessions
create policy "Users can view own game sessions" on public.game_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own game sessions" on public.game_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own game sessions" on public.game_sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete own game sessions" on public.game_sessions
  for delete using (auth.uid() = user_id);

-- Create scenes table
create table if not exists public.scenes (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.game_sessions(id) on delete cascade not null,
  narrative text not null,
  choices text[] not null default '{}',
  player_choice text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on scenes
alter table public.scenes enable row level security;

-- Create RLS policies for scenes
create policy "Users can view scenes from own sessions" on public.scenes
  for select using (
    exists (
      select 1 from public.game_sessions
      where game_sessions.id = scenes.session_id
      and game_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert scenes to own sessions" on public.scenes
  for insert with check (
    exists (
      select 1 from public.game_sessions
      where game_sessions.id = scenes.session_id
      and game_sessions.user_id = auth.uid()
    )
  );

create policy "Users can update scenes from own sessions" on public.scenes
  for update using (
    exists (
      select 1 from public.game_sessions
      where game_sessions.id = scenes.session_id
      and game_sessions.user_id = auth.uid()
    )
  );

-- Create function to automatically update updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for game_sessions updated_at
create trigger handle_game_sessions_updated_at
  before update on public.game_sessions
  for each row execute function public.handle_updated_at();

-- Create function to create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();