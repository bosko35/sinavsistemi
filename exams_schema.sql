-- Create table for exams
create table exams (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references modules(id) on delete cascade not null,
  title text not null,
  description text,
  passing_score integer default 70,
  duration_minutes integer, -- optimize null for unlimited
  created_at timestamp with time zone default now()
);

-- Create table for questions
create table questions (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references exams(id) on delete cascade not null,
  question_text text not null,
  question_type text check (question_type in ('multiple_choice', 'true_false')) default 'multiple_choice',
  points integer default 10,
  image_url text, -- For questions with images (stored in S3)
  "order" integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Create table for answers/options
create table question_options (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references questions(id) on delete cascade not null,
  option_text text not null,
  is_correct boolean default false,
  "order" integer default 0
);

-- Create table for user exam attempts
create table user_exam_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  exam_id uuid references exams(id) not null,
  score integer,
  passed boolean,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  
  unique(user_id, exam_id, started_at) -- Allow multiple attempts but tracked by time
);

-- Create table for user answers to specific questions in an attempt
create table user_exam_answers (
  id uuid default gen_random_uuid() primary key,
  attempt_id uuid references user_exam_attempts(id) on delete cascade not null,
  question_id uuid references questions(id) not null,
  selected_option_id uuid references question_options(id), -- Null if skipped or distinct answer type
  is_correct boolean,
  created_at timestamp with time zone default now()
);

-- RLS Policies

alter table exams enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table user_exam_attempts enable row level security;
alter table user_exam_answers enable row level security;

-- Read policies (Authenticated users can read exams/questions)
create policy "Exams viewable by authenticated users" on exams for select using (auth.role() = 'authenticated');
create policy "Questions viewable by authenticated users" on questions for select using (auth.role() = 'authenticated');
create policy "Options viewable by authenticated users" on question_options for select using (auth.role() = 'authenticated');

-- User attempts policies
create policy "Users can view own attempts" on user_exam_attempts for select using (auth.uid() = user_id);
create policy "Users can insert own attempts" on user_exam_attempts for insert with check (auth.uid() = user_id);
create policy "Users can update own attempts" on user_exam_attempts for update using (auth.uid() = user_id);

create policy "Users can view own answers" on user_exam_answers 
  for select using (
    exists (
      select 1 from user_exam_attempts 
      where user_exam_attempts.id = user_exam_answers.attempt_id 
      and user_exam_attempts.user_id = auth.uid()
    )
  );

create policy "Users can insert own answers" on user_exam_answers 
  for insert with check (
    exists (
      select 1 from user_exam_attempts 
      where user_exam_attempts.id = attempt_id 
      and user_exam_attempts.user_id = auth.uid()
    )
  );
