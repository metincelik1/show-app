create table if not exists themes (
  id serial primary key,
  slug text unique not null,
  name text not null,
  name_tr text not null,
  script_format text not null,
  language text not null default 'en'
);

create table if not exists questions (
  id serial primary key,
  theme_id integer references themes(id) on delete cascade,
  order_num integer not null,
  text text not null
);

create table if not exists shows (
  id uuid primary key default gen_random_uuid(),
  theme_id integer references themes(id),
  code text unique not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows(id) on delete cascade,
  question_id integer references questions(id),
  text text not null,
  submitted_at timestamptz default now()
);

create table if not exists scripts (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows(id) on delete cascade,
  content text not null,
  generated_at timestamptz default now()
);

alter table shows enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table themes enable row level security;
alter table scripts enable row level security;

create policy if not exists "Public read shows" on shows for select using (true);
create policy if not exists "Public read questions" on questions for select using (true);
create policy if not exists "Public read themes" on themes for select using (true);
create policy if not exists "Public insert answers" on answers for insert with check (true);
create policy if not exists "Public read answers" on answers for select using (true);
create policy if not exists "Public read scripts" on scripts for select using (true);
create policy if not exists "Public insert scripts" on scripts for insert with check (true);
create policy if not exists "Public update scripts" on scripts for update using (true);

alter publication supabase_realtime add table answers;
