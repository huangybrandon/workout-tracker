-- Workout templates: reusable named lists of exercises
create table workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Template exercises: exercises belonging to a template
create table workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references workout_templates(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  sort_order integer not null
);

-- Indexes
create index idx_workout_templates_user on workout_templates(user_id);
create index idx_workout_template_exercises_template on workout_template_exercises(template_id);
create index idx_workout_template_exercises_exercise on workout_template_exercises(exercise_id);

-- Enable RLS
alter table workout_templates enable row level security;
alter table workout_template_exercises enable row level security;

-- Workout templates RLS (mirrors workouts)
create policy "Users can view their own templates"
  on workout_templates for select
  using (user_id = auth.uid());

create policy "Users can insert their own templates"
  on workout_templates for insert
  with check (user_id = auth.uid());

create policy "Users can update their own templates"
  on workout_templates for update
  using (user_id = auth.uid());

create policy "Users can delete their own templates"
  on workout_templates for delete
  using (user_id = auth.uid());

-- Template exercises RLS (mirrors workout_sets via parent template)
create policy "Users can view exercises of their own templates"
  on workout_template_exercises for select
  using (exists (
    select 1 from workout_templates where workout_templates.id = workout_template_exercises.template_id and workout_templates.user_id = auth.uid()
  ));

create policy "Users can insert exercises into their own templates"
  on workout_template_exercises for insert
  with check (exists (
    select 1 from workout_templates where workout_templates.id = workout_template_exercises.template_id and workout_templates.user_id = auth.uid()
  ));

create policy "Users can update exercises of their own templates"
  on workout_template_exercises for update
  using (exists (
    select 1 from workout_templates where workout_templates.id = workout_template_exercises.template_id and workout_templates.user_id = auth.uid()
  ));

create policy "Users can delete exercises from their own templates"
  on workout_template_exercises for delete
  using (exists (
    select 1 from workout_templates where workout_templates.id = workout_template_exercises.template_id and workout_templates.user_id = auth.uid()
  ));
