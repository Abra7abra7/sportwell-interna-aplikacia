-- Migrácia na pridanie podpory pre obrázky a GIF animácie z GitHub datasetu
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS gif_url text;
