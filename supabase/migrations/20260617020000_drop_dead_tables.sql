-- Zmazanie mŕtvych tabuliek z predošlej architektúry

-- 1. Zmazanie attachments
DROP TABLE IF EXISTS public.attachments CASCADE;

-- 2. Zmazanie medical_cards
DROP TABLE IF EXISTS public.medical_cards CASCADE;

-- 3. Zmazanie starého typu
DROP TYPE IF EXISTS medical_card_type CASCADE;
