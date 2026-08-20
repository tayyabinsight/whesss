-- SQL Script to add sort_order column to students table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

COMMENT ON COLUMN public.students.sort_order IS 'Used for manual alignment/ordering of students in the fee registry';
