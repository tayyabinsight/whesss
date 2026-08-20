-- WISDOM HOUSE - STUDENT MANAGEMENT ENHANCEMENTS
-- =============================================

-- 1. Add admission and leaving dates for tracking
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS admission_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS leaving_date DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS password TEXT;

COMMENT ON COLUMN public.students.admission_date IS 'Tracks when the student joined the institution';
COMMENT ON COLUMN public.students.leaving_date IS 'Tracks when the student left the institution';
COMMENT ON COLUMN public.students.password IS 'Plain text portal access password for student login';

-- 2. Ensure status can handle 'left'
-- No change needed if status is TEXT, but we'll document it:
-- Status values: 'active', 'left', 'suspended'

-- 3. Fee Type for Free students
-- Fee Type values: 'Monthly', 'Free', 'Scholarship'

-- 4. Net Amount Calculation Logic (for Dashboard)
-- Total sum of base_fee for students where status = 'active' AND fee_type != 'Free'
