-- Run this in your Supabase SQL editor

create table themes (
  id serial primary key,
  slug text unique not null,
  name text not null,
  name_tr text not null,
  script_format text not null,  -- describes the output format for Gemini
  language text not null default 'en'  -- 'en' or 'tr'
);

create table questions (
  id serial primary key,
  theme_id integer references themes(id) on delete cascade,
  order_num integer not null,
  text text not null
);

create table shows (
  id uuid primary key default gen_random_uuid(),
  theme_id integer references themes(id),
  code text unique not null,  -- short code for QR URL e.g. "ABC123"
  is_active boolean default true,
  created_at timestamptz default now()
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows(id) on delete cascade,
  question_id integer references questions(id),
  text text not null,
  submitted_at timestamptz default now()
);

create table scripts (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows(id) on delete cascade,
  content text not null,
  generated_at timestamptz default now()
);

-- Enable realtime for answers
alter publication supabase_realtime add table answers;

-- Allow anonymous reads/inserts for audience
alter table shows enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table themes enable row level security;
alter table scripts enable row level security;

create policy "Public read shows" on shows for select using (true);
create policy "Public read questions" on questions for select using (true);
create policy "Public read themes" on themes for select using (true);
create policy "Public insert answers" on answers for insert with check (true);
create policy "Public read answers" on answers for select using (true);
create policy "Public read scripts" on scripts for select using (true);
create policy "Public insert scripts" on scripts for insert with check (true);
create policy "Public update scripts" on scripts for update using (true);
