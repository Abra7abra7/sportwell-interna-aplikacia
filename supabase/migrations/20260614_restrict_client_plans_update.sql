-- Trigger to prevent client from updating exercise details (sets, reps, tempo, title, pause)
-- and only allow updating feedback fields (completed, rpe, pain_level, notes).

CREATE OR REPLACE FUNCTION public.restrict_client_training_plan_update()
RETURNS trigger AS $$
DECLARE
  old_item jsonb;
  new_item jsonb;
  i int;
BEGIN
  -- If the user is a client, validate that the training plan modifications are restricted to feedback columns
  IF public.is_specialist(auth.uid()) = false THEN
    -- 1. Ensure the user is only updating their own training plan
    IF NEW.client_id <> auth.uid() THEN
      RAISE EXCEPTION 'Môžete upravovať iba svoj vlastný tréningový plán.';
    END IF;

    -- 2. Prevent structural updates (adding/deleting exercises)
    IF jsonb_array_length(NEW.plan_data) <> jsonb_array_length(OLD.plan_data) THEN
      RAISE EXCEPTION 'Klient nemôže pridávať ani odstraňovať cvičenia z plánu.';
    END IF;

    -- 3. Loop through exercises and verify that core properties are identical
    FOR i IN 0 .. jsonb_array_length(OLD.plan_data) - 1 LOOP
      old_item := OLD.plan_data -> i;
      new_item := NEW.plan_data -> i;

      IF (old_item ->> 'id') <> (new_item ->> 'id') OR
         (old_item ->> 'exercise_title') <> (new_item ->> 'exercise_title') OR
         (old_item ->> 'sets') <> (new_item ->> 'sets') OR
         (old_item ->> 'reps') <> (new_item ->> 'reps') OR
         (old_item ->> 'tempo') <> (new_item ->> 'tempo') OR
         (old_item ->> 'pause') <> (new_item ->> 'pause') THEN
        RAISE EXCEPTION 'Klient nemôže meniť predpis cvičení (názov, série, opakovania, tempo, pauzu). Zmena je povolená len pre spätnú väzbu (completed, rpe, pain_level, poznámky).';
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to training_plans table
DROP TRIGGER IF EXISTS trg_restrict_client_training_plan_update ON public.training_plans;
CREATE TRIGGER trg_restrict_client_training_plan_update
BEFORE UPDATE ON public.training_plans
FOR EACH ROW EXECUTE FUNCTION public.restrict_client_training_plan_update();
