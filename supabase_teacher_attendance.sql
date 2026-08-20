-- Table for Teacher Attendance
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
    time_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    month TEXT NOT NULL,
    year TEXT NOT NULL
);

-- Allow Admin access without RLS for now to maintain consistency
ALTER TABLE public.teacher_attendance DISABLE ROW LEVEL SECURITY;
