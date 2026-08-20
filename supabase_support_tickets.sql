-- WISDOM HOUSE - SUPPORT & TICKETING SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT UNIQUE NOT NULL, -- e.g. TKT-1001
    subject TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'Billing', 'Academic', 'Technical', 'General'
    priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Urgent'
    status TEXT DEFAULT 'open', -- 'open', 'in-progress', 'resolved', 'closed'
    
    -- Reporter Details
    reporter_name TEXT NOT NULL,
    reporter_role TEXT NOT NULL, -- 'Student', 'Parent', 'Teacher'
    reporter_id TEXT, -- Link to student/teacher ID
    
    -- Staff Assignment
    assigned_to TEXT, -- Staff member name
    
    last_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for internal admin usage
ALTER TABLE public.support_tickets DISABLE ROW LEVEL SECURITY;
