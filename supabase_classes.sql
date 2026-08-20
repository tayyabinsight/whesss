-- Paste and run this script in your Supabase project's SQL Editor

-- 1. Create the Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade TEXT NOT NULL, -- e.g. "Class 10", "Nursery"
    section TEXT,        -- e.g. "Science", "A"
    room TEXT,           -- e.g. "Room-101"
    teacher TEXT,        -- Assigned Home Room Teacher
    subjects INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Turn off Row Level Security (RLS) temporarily so your Admin frontend can freely insert/read records.
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
