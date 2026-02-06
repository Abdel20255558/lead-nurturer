
-- Ajouter les colonnes métier et date de début à la table employees
ALTER TABLE public.employees 
ADD COLUMN job_title text,
ADD COLUMN start_date date;
