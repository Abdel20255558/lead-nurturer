-- Add new status value to client_status enum
ALTER TYPE public.client_status ADD VALUE IF NOT EXISTS 'not_prepared' BEFORE 'not_contacted';