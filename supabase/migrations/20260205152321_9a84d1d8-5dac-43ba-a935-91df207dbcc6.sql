-- Add a second fixed phone number column for clients with multiple lines
ALTER TABLE public.clients ADD COLUMN phone_fixed_2 text;