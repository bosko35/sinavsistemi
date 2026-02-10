-- Create table for training modules
create table modules (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  "order" integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Create table for videos within modules
create table videos (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references modules(id) on delete cascade not null,
  title text not null,
  description text, -- Added description field
  video_url text not null,
  duration integer not null, -- duration in seconds
  "order" integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Create table to track user progress on videos
create table user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  video_id uuid references videos(id) on delete cascade not null,
  status text check (status in ('started', 'completed')) default 'started',
  last_watched_at timestamp with time zone default now(),
  
  unique(user_id, video_id)
);

-- RLS Policies

-- Modules: Readable by everyone (authenticated)
alter table modules enable row level security;
create policy "Modules viewable by authenticated users" on modules
  for select using (auth.role() = 'authenticated');

-- Videos: Readable by everyone (authenticated)
alter table videos enable row level security;
create policy "Videos viewable by authenticated users" on videos
  for select using (auth.role() = 'authenticated');

-- User Progress: Users can view and update their own progress
alter table user_progress enable row level security;

create policy "Users can view own progress" on user_progress
  for select using (auth.uid() = user_id);

create policy "Users can insert own progress" on user_progress
  for insert with check (auth.uid() = user_id);

create policy "Users can update own progress" on user_progress
  for update using (auth.uid() = user_id);

-- Seed Data (Optional - for testing)
insert into modules (title, description, "order") values
('İSG Temel Eğitimi', 'İş Sağlığı ve Güvenliği Temel Bilgileri', 1),
('Yangın Eğitimi', 'Yangın anında yapılması gerekenler', 2);
