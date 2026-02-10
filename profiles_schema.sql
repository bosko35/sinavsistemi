-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  tc_no text unique not null,
  full_name text,
  role text check (role in ('admin', 'worker')) default 'worker',
  is_first_login boolean default true,
  updated_at timestamp with time zone,

  constraint tc_no_length check (char_length(tc_no) = 11)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, tc_no, full_name, role)
  values (
    new.id, 
    split_part(new.email, '@', 1), -- Extract TC from email (TC@...)
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'worker')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
