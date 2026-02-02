-- Create enum for truck types
CREATE TYPE public.truck_type AS ENUM ('SOLO 1', 'SOLO 2', 'Renault', 'Man');

-- Create enum for driver names
CREATE TYPE public.driver_type AS ENUM ('M. Jalale', 'M. Dawi');

-- Create enum for delivery status
CREATE TYPE public.delivery_status AS ENUM ('pending', 'delivered', 'postponed', 'cancelled');

-- Create trips/deliveries table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  product TEXT NOT NULL,
  truck truck_type NOT NULL,
  driver driver_type NOT NULL,
  delivery_date DATE NOT NULL,
  status delivery_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  postponed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own trips" ON public.trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON public.trips FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();