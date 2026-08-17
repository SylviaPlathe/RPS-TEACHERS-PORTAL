-- ============================================================
-- Ramanujan Public School – Teacher Duty Portal
-- Supabase schema (Postgres)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ---------- TEACHERS ----------
create table teachers (
  id text primary key,                 -- e.g. 'TCH101'
  name text not null,
  subject text not null,
  department text not null,
  photo_url text,
  auth_user_id uuid references auth.users(id),  -- links to Supabase Auth
  created_at timestamptz default now()
);

-- ---------- ADMINS ----------
create table admins (
  id text primary key,                 -- e.g. 'ADMIN01'
  name text not null,
  role text not null default 'Coordinator' check (role in ('Principal','Headmaster','Coordinator')),
  teacher_id text references teachers(id),  -- set when this admin (e.g. a Coordinator) also teaches
  auth_user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ---------- TIMETABLES ----------
create table timetables (
  id uuid primary key default gen_random_uuid(),
  teacher_id text references teachers(id) on delete cascade,
  day text not null check (day in ('Mon','Tue','Wed','Thu','Fri','Sat')),
  period int not null check (period between 1 and 8),
  class text not null,                 -- e.g. '10 A'
  subject text not null,
  start_time time,
  end_time time,
  unique (teacher_id, day, period)
);

-- ---------- SUBSTITUTIONS ----------
create table substitutions (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  day text not null,
  period int not null,
  class text not null,
  absent_teacher_id text references teachers(id),
  replacement_teacher_id text references teachers(id),
  created_by text references admins(id),
  created_at timestamptz default now()
);

-- ---------- EXAM DUTIES ----------
create table exam_duties (
  id uuid primary key default gen_random_uuid(),
  teacher_id text references teachers(id) on delete cascade,
  exam_name text not null check (exam_name in ('PA 1','PA 2','PA 3','Half Yearly','Annual','Pre-Board')),
  exam_date date not null,
  start_time time,
  end_time time,
  room text,
  class text not null,
  subject text,
  duty_type text default 'Invigilation',
  created_by text references admins(id),
  created_at timestamptz default now()
);
-- Note: Pre-Board should only be selected in the UI for Class 10/12 — enforced client-side
-- (see AdminExamDuties in App.jsx), not by this constraint, since "class" is free text here.

-- ---------- NOTICES ----------
create table notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  priority text not null default 'Normal' check (priority in ('Normal','Important','Urgent')),
  created_by text references admins(id),
  created_at timestamptz default now()
);

-- ---------- QUERIES ----------
create table queries (
  id uuid primary key default gen_random_uuid(),
  teacher_id text references teachers(id) on delete cascade,
  subject text not null,
  message text not null,
  resolved boolean default false,
  created_at timestamptz default now()
);

create table query_replies (
  id uuid primary key default gen_random_uuid(),
  query_id uuid references queries(id) on delete cascade,
  from_role text not null check (from_role in ('Admin','Teacher')),
  text text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table teachers enable row level security;
alter table admins enable row level security;
alter table timetables enable row level security;
alter table substitutions enable row level security;
alter table exam_duties enable row level security;
alter table notices enable row level security;
alter table queries enable row level security;
alter table query_replies enable row level security;

-- Everyone signed in can read shared reference data (notices, own timetable, etc.)
create policy "Authenticated read teachers" on teachers for select using (auth.role() = 'authenticated');
create policy "Authenticated read timetables" on timetables for select using (auth.role() = 'authenticated');
create policy "Authenticated read substitutions" on substitutions for select using (auth.role() = 'authenticated');
create policy "Authenticated read exam_duties" on exam_duties for select using (auth.role() = 'authenticated');
create policy "Authenticated read notices" on notices for select using (auth.role() = 'authenticated');

-- Teachers can only see and create their own queries/replies
create policy "Teacher reads own queries" on queries for select
  using (teacher_id = (select id from teachers where auth_user_id = auth.uid()));
create policy "Teacher inserts own queries" on queries for insert
  with check (teacher_id = (select id from teachers where auth_user_id = auth.uid()));
create policy "Read replies to own queries" on query_replies for select
  using (query_id in (select id from queries where teacher_id = (select id from teachers where auth_user_id = auth.uid())));

-- Admin-only writes (checked via admins table membership)
create policy "Admins manage teachers" on teachers for all
  using (auth.uid() in (select auth_user_id from admins)) with check (auth.uid() in (select auth_user_id from admins));
create policy "Admins manage timetables" on timetables for all
  using (auth.uid() in (select auth_user_id from admins)) with check (auth.uid() in (select auth_user_id from admins));
create policy "Admins manage substitutions" on substitutions for all
  using (auth.uid() in (select auth_user_id from admins)) with check (auth.uid() in (select auth_user_id from admins));
create policy "Admins manage exam_duties" on exam_duties for all
  using (auth.uid() in (select auth_user_id from admins)) with check (auth.uid() in (select auth_user_id from admins));
create policy "Admins manage notices" on notices for all
  using (auth.uid() in (select auth_user_id from admins)) with check (auth.uid() in (select auth_user_id from admins));
create policy "Admins manage all queries" on queries for all
  using (auth.uid() in (select auth_user_id from admins)) with check (auth.uid() in (select auth_user_id from admins));
create policy "Admins manage replies" on query_replies for all
  using (auth.uid() in (select auth_user_id from admins)) with check (auth.uid() in (select auth_user_id from admins));

-- ============================================================
-- REALTIME (so substitutions/notices push to teacher devices)
-- ============================================================
alter publication supabase_realtime add table substitutions;
alter publication supabase_realtime add table notices;
alter publication supabase_realtime add table exam_duties;
alter publication supabase_realtime add table query_replies;

-- ============================================================
-- DEMO SEED DATA
-- ============================================================
insert into teachers (id, name, subject, department) values
  ('TCH101', 'Ms. Manisha Gupta', 'Mathematics', 'Mathematics'),
  ('TCH102', 'Ms. Shadma Zulfekar', 'English', 'Languages'),
  ('TCH103', 'Ms. Tanushree Banarjee', 'Biology', 'Science'),
  ('TCH104', 'Ms. Shivanki Srivastava', 'Chemistry', 'Science'),
  ('TCH105', 'Ms. Manju Mishra', 'Hindi', 'Languages'),
  ('TCH106', 'Ms. Ritu', 'Physics', 'Science'),
  ('TCH107', 'Ms. Innama', 'Social Science', 'Social Science'),
  ('TCH108', 'Ms. Afreen', 'Geography', 'Social Science'),
  ('TCH109', 'Ms. Arfeen', 'History', 'Social Science'),
  ('TCH110', 'Ms. Ayushi', 'Computer Science', 'Computer Science'),
  ('TCH111', 'Ms. Kirti Singh', 'Economics', 'Commerce'),
  ('TCH112', 'Mr. Shivm Srivastava', 'Mathematics', 'Mathematics'),
  ('TCH113', 'Mr. Om Tiwari', 'Sanskrit', 'Languages'),
  ('TCH115', 'Mr. Aman', 'Physics', 'Science'),
  ('TCH116', 'Mr. Amulya Malviya', 'Chemistry', 'Science'),
  ('TCH117', 'Mr. Anmol', 'Computer Science', 'Computer Science'),
  ('TCH118', 'Mr. Pankaj Saran', 'Accountancy', 'Commerce'),
  ('TCH119', 'Mr. Akash Srivastava', 'Biology', 'Science'),
  ('TCH120', 'Mr. Omsi', 'English', 'Languages'),
  ('TCH121', 'Mr. Sanjay', 'Political Science', 'Social Science'),
  ('TCH122', 'Mr. Mayank', 'Hindi', 'Languages'),
  ('TCH123', 'Mr. Kartikey', 'Mathematics', 'Mathematics'),
  ('TCH124', 'Mr. Ankit Paul', 'Physical Education', 'Sports');

insert into admins (id, name, role, teacher_id) values
  ('ADMIN01', 'Ms. Ipsita Chaudhary', 'Principal', null),
  ('ADMIN02', 'Mr. Umang Mehrotra', 'Headmaster', null),
  ('ADMIN03', 'Mr. Ankit Paul', 'Coordinator', 'TCH124');
-- Note: Mr. Ankit Paul is both a Coordinator (admin login ADMIN03) and a teacher (TCH124) —
-- the Principal and Headmaster are admin-only and have no matching teachers row.

insert into notices (title, priority, created_by) values
  ('Independence Day flag hoisting at 8:00 AM sharp', 'Important', 'ADMIN01'),
  ('Staff meeting in the conference room after last period', 'Normal', 'ADMIN01'),
  ('Mid-term exam datesheet released — check the noticeboard', 'Urgent', 'ADMIN01'),
  ('Submit unit-test marks on the portal by Friday', 'Important', 'ADMIN01'),
  ('Annual sports day practice begins next Monday', 'Normal', 'ADMIN01');

insert into exam_duties (teacher_id, exam_name, exam_date, start_time, end_time, room, class, subject, duty_type, created_by) values
  ('TCH101', 'PA 2', current_date + 1, '09:00', '12:00', 'Room 204', '10 A', 'Mathematics', 'Invigilation', 'ADMIN01'),
  ('TCH102', 'PA 2', current_date + 1, '09:00', '12:00', 'Room 105', '9 B', 'Science', 'Invigilation', 'ADMIN01'),
  ('TCH104', 'Pre-Board', current_date + 7, '09:00', '12:00', 'Room 301', '12 Science', 'Chemistry', 'Subject Expert', 'ADMIN01'),
  ('TCH107', 'Half Yearly', current_date + 7, '13:00', '16:00', 'Room 108', '11 Science', 'Biology', 'Invigilation', 'ADMIN01');

-- NOTE: Teacher/admin login (Teacher ID + password) should be implemented via
-- Supabase Auth using each teacher's ID mapped to a fake email, e.g.
-- 'tch101@ramanujan-portal.local', with the password set as their portal password.
-- Then set teachers.auth_user_id / admins.auth_user_id to the resulting auth.users.id.
-- See PROJECT_GUIDE.md → "Auth setup" for the exact steps.
