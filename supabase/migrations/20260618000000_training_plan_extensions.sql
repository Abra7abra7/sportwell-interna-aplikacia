-- Add new columns for training plans based on user requirements

ALTER TABLE public.training_plans
ADD COLUMN IF NOT EXISTS warmup_notes text;

ALTER TABLE public.plan_exercises
ADD COLUMN IF NOT EXISTS tempo text,
ADD COLUMN IF NOT EXISTS rpe text,
ADD COLUMN IF NOT EXISTS rest_between_exercises integer;
