-- Migration script for updating users table schema
-- Run this in pgAdmin Query Tool

-- =====================================================
-- OPTION 1: Modify Existing Table (Preserves Data)
-- =====================================================
-- Use this if you already have a users table with data

-- Remove the 'role' column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Add missing columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_type character varying;
ALTER TABLE users ADD COLUMN IF NOT EXISTS qualification character varying;
ALTER TABLE users ADD COLUMN IF NOT EXISTS college_name character varying;

-- =====================================================
-- OPTION 2: Create Fresh Table (Deletes Existing Data)
-- =====================================================
-- Uncomment the lines below ONLY if you want to start fresh
-- WARNING: This will delete all existing data!

/*
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    uniqueId character varying NOT NULL UNIQUE,
    fullName character varying NOT NULL,
    email character varying,
    phone character varying,
    passwordHash character varying,
    otp character varying,
    otpExpiry timestamp with time zone,
    isRegistered boolean DEFAULT false,
    registration_type character varying,
    qualification character varying,
    college_name character varying,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_uniqueId ON users(uniqueId);
*/

-- =====================================================
-- Verify the table structure
-- =====================================================
-- Run this to see the current table structure:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- ORDER BY ordinal_position;

   