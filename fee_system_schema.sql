-- WISDOM HOUSE - CONSOLIDATED FEE SYSTEM SCHEMA
-- =============================================
-- Run this script in the Supabase SQL Editor to ensure your database is in sync.
-- This script is "Safe" to run multiple times (Idempotent).

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES (Base Structure)

-- Fee Categories (Tuition, Admission, etc.)
CREATE TABLE IF NOT EXISTS fee_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    default_amount NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- System Settings
CREATE TABLE IF NOT EXISTS fee_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    voucher_prefix VARCHAR(50) DEFAULT 'WHES-2026-',
    current_increment INTEGER DEFAULT 1,
    late_fine_amount NUMERIC DEFAULT 0,
    manual_prefix VARCHAR(50) DEFAULT 'MANUAL-',
    manual_current_increment INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Student Fee Assignments (Monthly Dues)
CREATE TABLE IF NOT EXISTS student_fees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL,
    class_name VARCHAR(255),
    fee_category_id UUID REFERENCES fee_categories(id),
    amount NUMERIC NOT NULL,
    month VARCHAR(50),
    is_assigned BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Vouchers (The Issued Bill)
CREATE TABLE IF NOT EXISTS fee_vouchers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    voucher_number VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID NOT NULL,
    class_name VARCHAR(255),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    fine NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Voucher Line Items
CREATE TABLE IF NOT EXISTS fee_voucher_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    voucher_id UUID REFERENCES fee_vouchers(id) ON DELETE CASCADE,
    fee_category_id UUID REFERENCES fee_categories(id),
    student_fee_id UUID, -- Important: Link to student_fees assignment
    amount NUMERIC NOT NULL
);

-- Payments (Cash / Bank Collection)
CREATE TABLE IF NOT EXISTS fee_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    voucher_id UUID REFERENCES fee_vouchers(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    amount_paid NUMERIC NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    reference_number VARCHAR(100),
    bank_name VARCHAR(100),
    cheque_date DATE,
    cheque_status VARCHAR(50),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. SCHEMA SYNCHRONIZATION (Adding missing columns to existing tables)

DO $$ 
BEGIN
    -- Sync fee_vouchers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_vouchers' AND column_name='paid_amount') THEN
        ALTER TABLE fee_vouchers ADD COLUMN paid_amount NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_vouchers' AND column_name='fine') THEN
        ALTER TABLE fee_vouchers ADD COLUMN fine NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_vouchers' AND column_name='discount') THEN
        ALTER TABLE fee_vouchers ADD COLUMN discount NUMERIC DEFAULT 0;
    END IF;

    -- Sync fee_voucher_items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_voucher_items' AND column_name='student_fee_id') THEN
        ALTER TABLE fee_voucher_items ADD COLUMN student_fee_id UUID;
    END IF;

    -- Sync fee_payments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_payments' AND column_name='bank_name') THEN
        ALTER TABLE fee_payments ADD COLUMN bank_name VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_payments' AND column_name='cheque_date') THEN
        ALTER TABLE fee_payments ADD COLUMN cheque_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_payments' AND column_name='cheque_status') THEN
        ALTER TABLE fee_payments ADD COLUMN cheque_status VARCHAR(50);
    END IF;

     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_payments' AND column_name='created_at') THEN
        ALTER TABLE fee_payments ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;

    -- Sync fee_settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_settings' AND column_name='manual_prefix') THEN
        ALTER TABLE fee_settings ADD COLUMN manual_prefix VARCHAR(100) DEFAULT 'MANUAL-';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_settings' AND column_name='manual_current_increment') THEN
        ALTER TABLE fee_settings ADD COLUMN manual_current_increment INTEGER DEFAULT 1;
    END IF;

END $$;

-- 4. SEED DATA (If empty)
INSERT INTO fee_settings (voucher_prefix, current_increment)
SELECT 'WHES-26-', 1
WHERE NOT EXISTS (SELECT 1 FROM fee_settings);

INSERT INTO fee_categories (name, default_amount)
SELECT 'Monthly Tuition', 2500
WHERE NOT EXISTS (SELECT 1 FROM fee_categories WHERE name = 'Monthly Tuition');
