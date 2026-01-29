-- Exercises: global seed data + user-created custom exercises
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_custom boolean default false,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Tags: global (user_id = null) or user-created
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6b7280',
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Unique index on global tag names (user_id IS NULL)
create unique index idx_tags_global_name on tags (lower(name)) where user_id is null;

-- Unique index on user tag names per user
create unique index idx_tags_user_name on tags (user_id, lower(name)) where user_id is not null;

-- Junction table for exercise <-> tag many-to-many
create table exercise_tags (
  exercise_id uuid not null references exercises(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (exercise_id, tag_id)
);

-- Workouts: named sessions with a date
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  date date not null default current_date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sets: individual sets tied to a workout + exercise
create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  set_number integer not null,
  reps integer not null,
  weight numeric(7,2) not null,
  created_at timestamptz default now()
);

-- Bodyweight log
create table bodyweight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  weight numeric(5,1) not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Indexes
create index idx_workouts_user_date on workouts(user_id, date desc);
create index idx_workout_sets_workout on workout_sets(workout_id);
create index idx_workout_sets_exercise on workout_sets(exercise_id);
create index idx_bodyweight_user_date on bodyweight_entries(user_id, date desc);
create index idx_exercise_tags_tag on exercise_tags(tag_id);

-- Enable RLS
alter table exercises enable row level security;
alter table tags enable row level security;
alter table exercise_tags enable row level security;
alter table workouts enable row level security;
alter table workout_sets enable row level security;
alter table bodyweight_entries enable row level security;

-- Exercises RLS: visible if global (is_custom = false) or owned by user
create policy "Exercises are viewable by everyone if global or owned"
  on exercises for select
  using (is_custom = false or user_id = auth.uid());

create policy "Users can insert their own custom exercises"
  on exercises for insert
  with check (user_id = auth.uid() and is_custom = true);

create policy "Users can update their own custom exercises"
  on exercises for update
  using (user_id = auth.uid() and is_custom = true);

create policy "Users can delete their own custom exercises"
  on exercises for delete
  using (user_id = auth.uid() and is_custom = true);

-- Tags RLS: visible if global (user_id IS NULL) or owned by user
create policy "Tags are viewable if global or owned"
  on tags for select
  using (user_id is null or user_id = auth.uid());

create policy "Users can insert their own tags"
  on tags for insert
  with check (user_id = auth.uid());

create policy "Users can update their own tags"
  on tags for update
  using (user_id = auth.uid());

create policy "Users can delete their own tags"
  on tags for delete
  using (user_id = auth.uid());

-- Exercise tags RLS: visible if the exercise is accessible
create policy "Exercise tags are viewable if exercise is accessible"
  on exercise_tags for select
  using (exists (
    select 1 from exercises
    where exercises.id = exercise_tags.exercise_id
    and (exercises.is_custom = false or exercises.user_id = auth.uid())
  ));

create policy "Users can manage tags on their own exercises"
  on exercise_tags for insert
  with check (exists (
    select 1 from exercises
    where exercises.id = exercise_tags.exercise_id
    and exercises.user_id = auth.uid() and exercises.is_custom = true
  ));

create policy "Users can remove tags from their own exercises"
  on exercise_tags for delete
  using (exists (
    select 1 from exercises
    where exercises.id = exercise_tags.exercise_id
    and exercises.user_id = auth.uid() and exercises.is_custom = true
  ));

-- Workouts RLS
create policy "Users can view their own workouts"
  on workouts for select
  using (user_id = auth.uid());

create policy "Users can insert their own workouts"
  on workouts for insert
  with check (user_id = auth.uid());

create policy "Users can update their own workouts"
  on workouts for update
  using (user_id = auth.uid());

create policy "Users can delete their own workouts"
  on workouts for delete
  using (user_id = auth.uid());

-- Workout sets RLS: check via the parent workout's user_id
create policy "Users can view sets of their own workouts"
  on workout_sets for select
  using (exists (
    select 1 from workouts where workouts.id = workout_sets.workout_id and workouts.user_id = auth.uid()
  ));

create policy "Users can insert sets into their own workouts"
  on workout_sets for insert
  with check (exists (
    select 1 from workouts where workouts.id = workout_sets.workout_id and workouts.user_id = auth.uid()
  ));

create policy "Users can update sets of their own workouts"
  on workout_sets for update
  using (exists (
    select 1 from workouts where workouts.id = workout_sets.workout_id and workouts.user_id = auth.uid()
  ));

create policy "Users can delete sets of their own workouts"
  on workout_sets for delete
  using (exists (
    select 1 from workouts where workouts.id = workout_sets.workout_id and workouts.user_id = auth.uid()
  ));

-- Bodyweight entries RLS
create policy "Users can view their own bodyweight entries"
  on bodyweight_entries for select
  using (user_id = auth.uid());

create policy "Users can insert their own bodyweight entries"
  on bodyweight_entries for insert
  with check (user_id = auth.uid());

create policy "Users can update their own bodyweight entries"
  on bodyweight_entries for update
  using (user_id = auth.uid());

create policy "Users can delete their own bodyweight entries"
  on bodyweight_entries for delete
  using (user_id = auth.uid());

-- Seed global tags (11 tags with colors)
insert into tags (name, color, user_id) values
  ('chest',     '#ef4444', null),
  ('back',      '#3b82f6', null),
  ('shoulders', '#f97316', null),
  ('biceps',    '#8b5cf6', null),
  ('triceps',   '#ec4899', null),
  ('legs',      '#22c55e', null),
  ('core',      '#eab308', null),
  ('compound',  '#14b8a6', null),
  ('isolation', '#6b7280', null),
  ('push',      '#f43f5e', null),
  ('pull',      '#6366f1', null);

-- Seed exercises (no category column)
insert into exercises (name, is_custom, user_id) values
  ('Bench Press', false, null),
  ('Overhead Press', false, null),
  ('Incline Bench Press', false, null),
  ('Dumbbell Shoulder Press', false, null),
  ('Dips', false, null),
  ('Push-ups', false, null),
  ('Tricep Pushdown', false, null),
  ('Lateral Raise', false, null),
  ('Chest Fly', false, null),
  ('Skull Crushers', false, null),
  ('Deadlift', false, null),
  ('Barbell Row', false, null),
  ('Pull-ups', false, null),
  ('Lat Pulldown', false, null),
  ('Seated Cable Row', false, null),
  ('Face Pull', false, null),
  ('Barbell Curl', false, null),
  ('Dumbbell Curl', false, null),
  ('Hammer Curl', false, null),
  ('Chin-ups', false, null);

-- Seed exercise_tags (tag each exercise with appropriate tags)
-- Use a DO block to look up IDs by name
do $$
declare
  -- tag IDs
  t_chest uuid;
  t_back uuid;
  t_shoulders uuid;
  t_biceps uuid;
  t_triceps uuid;
  t_legs uuid;
  t_core uuid;
  t_compound uuid;
  t_isolation uuid;
  t_push uuid;
  t_pull uuid;
  -- exercise IDs
  e_bench uuid;
  e_ohp uuid;
  e_incline uuid;
  e_db_shoulder uuid;
  e_dips uuid;
  e_pushups uuid;
  e_tri_push uuid;
  e_lat_raise uuid;
  e_chest_fly uuid;
  e_skull uuid;
  e_deadlift uuid;
  e_bb_row uuid;
  e_pullups uuid;
  e_lat_pull uuid;
  e_cable_row uuid;
  e_face_pull uuid;
  e_bb_curl uuid;
  e_db_curl uuid;
  e_hammer uuid;
  e_chinups uuid;
begin
  -- Look up tag IDs
  select id into t_chest from tags where name = 'chest' and user_id is null;
  select id into t_back from tags where name = 'back' and user_id is null;
  select id into t_shoulders from tags where name = 'shoulders' and user_id is null;
  select id into t_biceps from tags where name = 'biceps' and user_id is null;
  select id into t_triceps from tags where name = 'triceps' and user_id is null;
  select id into t_legs from tags where name = 'legs' and user_id is null;
  select id into t_core from tags where name = 'core' and user_id is null;
  select id into t_compound from tags where name = 'compound' and user_id is null;
  select id into t_isolation from tags where name = 'isolation' and user_id is null;
  select id into t_push from tags where name = 'push' and user_id is null;
  select id into t_pull from tags where name = 'pull' and user_id is null;

  -- Look up exercise IDs
  select id into e_bench from exercises where name = 'Bench Press';
  select id into e_ohp from exercises where name = 'Overhead Press';
  select id into e_incline from exercises where name = 'Incline Bench Press';
  select id into e_db_shoulder from exercises where name = 'Dumbbell Shoulder Press';
  select id into e_dips from exercises where name = 'Dips';
  select id into e_pushups from exercises where name = 'Push-ups';
  select id into e_tri_push from exercises where name = 'Tricep Pushdown';
  select id into e_lat_raise from exercises where name = 'Lateral Raise';
  select id into e_chest_fly from exercises where name = 'Chest Fly';
  select id into e_skull from exercises where name = 'Skull Crushers';
  select id into e_deadlift from exercises where name = 'Deadlift';
  select id into e_bb_row from exercises where name = 'Barbell Row';
  select id into e_pullups from exercises where name = 'Pull-ups';
  select id into e_lat_pull from exercises where name = 'Lat Pulldown';
  select id into e_cable_row from exercises where name = 'Seated Cable Row';
  select id into e_face_pull from exercises where name = 'Face Pull';
  select id into e_bb_curl from exercises where name = 'Barbell Curl';
  select id into e_db_curl from exercises where name = 'Dumbbell Curl';
  select id into e_hammer from exercises where name = 'Hammer Curl';
  select id into e_chinups from exercises where name = 'Chin-ups';

  -- Bench Press: chest, triceps, compound, push
  insert into exercise_tags values (e_bench, t_chest), (e_bench, t_triceps), (e_bench, t_compound), (e_bench, t_push);
  -- Overhead Press: shoulders, triceps, compound, push
  insert into exercise_tags values (e_ohp, t_shoulders), (e_ohp, t_triceps), (e_ohp, t_compound), (e_ohp, t_push);
  -- Incline Bench Press: chest, shoulders, triceps, compound, push
  insert into exercise_tags values (e_incline, t_chest), (e_incline, t_shoulders), (e_incline, t_triceps), (e_incline, t_compound), (e_incline, t_push);
  -- Dumbbell Shoulder Press: shoulders, triceps, compound, push
  insert into exercise_tags values (e_db_shoulder, t_shoulders), (e_db_shoulder, t_triceps), (e_db_shoulder, t_compound), (e_db_shoulder, t_push);
  -- Dips: chest, triceps, compound, push
  insert into exercise_tags values (e_dips, t_chest), (e_dips, t_triceps), (e_dips, t_compound), (e_dips, t_push);
  -- Push-ups: chest, triceps, compound, push
  insert into exercise_tags values (e_pushups, t_chest), (e_pushups, t_triceps), (e_pushups, t_compound), (e_pushups, t_push);
  -- Tricep Pushdown: triceps, isolation, push
  insert into exercise_tags values (e_tri_push, t_triceps), (e_tri_push, t_isolation), (e_tri_push, t_push);
  -- Lateral Raise: shoulders, isolation, push
  insert into exercise_tags values (e_lat_raise, t_shoulders), (e_lat_raise, t_isolation), (e_lat_raise, t_push);
  -- Chest Fly: chest, isolation, push
  insert into exercise_tags values (e_chest_fly, t_chest), (e_chest_fly, t_isolation), (e_chest_fly, t_push);
  -- Skull Crushers: triceps, isolation, push
  insert into exercise_tags values (e_skull, t_triceps), (e_skull, t_isolation), (e_skull, t_push);
  -- Deadlift: back, legs, compound, pull
  insert into exercise_tags values (e_deadlift, t_back), (e_deadlift, t_legs), (e_deadlift, t_compound), (e_deadlift, t_pull);
  -- Barbell Row: back, biceps, compound, pull
  insert into exercise_tags values (e_bb_row, t_back), (e_bb_row, t_biceps), (e_bb_row, t_compound), (e_bb_row, t_pull);
  -- Pull-ups: back, biceps, compound, pull
  insert into exercise_tags values (e_pullups, t_back), (e_pullups, t_biceps), (e_pullups, t_compound), (e_pullups, t_pull);
  -- Lat Pulldown: back, biceps, compound, pull
  insert into exercise_tags values (e_lat_pull, t_back), (e_lat_pull, t_biceps), (e_lat_pull, t_compound), (e_lat_pull, t_pull);
  -- Seated Cable Row: back, biceps, compound, pull
  insert into exercise_tags values (e_cable_row, t_back), (e_cable_row, t_biceps), (e_cable_row, t_compound), (e_cable_row, t_pull);
  -- Face Pull: shoulders, back, isolation, pull
  insert into exercise_tags values (e_face_pull, t_shoulders), (e_face_pull, t_back), (e_face_pull, t_isolation), (e_face_pull, t_pull);
  -- Barbell Curl: biceps, isolation, pull
  insert into exercise_tags values (e_bb_curl, t_biceps), (e_bb_curl, t_isolation), (e_bb_curl, t_pull);
  -- Dumbbell Curl: biceps, isolation, pull
  insert into exercise_tags values (e_db_curl, t_biceps), (e_db_curl, t_isolation), (e_db_curl, t_pull);
  -- Hammer Curl: biceps, isolation, pull
  insert into exercise_tags values (e_hammer, t_biceps), (e_hammer, t_isolation), (e_hammer, t_pull);
  -- Chin-ups: back, biceps, compound, pull
  insert into exercise_tags values (e_chinups, t_back), (e_chinups, t_biceps), (e_chinups, t_compound), (e_chinups, t_pull);
end $$;
