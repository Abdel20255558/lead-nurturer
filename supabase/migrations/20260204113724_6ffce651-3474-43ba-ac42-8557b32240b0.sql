-- Add delivery_time column to trips table
ALTER TABLE public.trips ADD COLUMN delivery_time text;

-- Add comment for documentation
COMMENT ON COLUMN public.trips.delivery_time IS 'Delivery time: matin, apres_midi, or specific time HH:MM';