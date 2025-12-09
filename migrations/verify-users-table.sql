-- Verification script to check users table structure
-- Run this in pgAdmin Query Tool to verify all columns match requirements

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid)
-- otpExpiry (timestamp with time zone)
-- isRegistered (boolean)
-- createdAt (timestamp with time zone)
-- updatedAt (timestamp with time zone)
-- passwordHash (character varying)
-- otp (character varying)
-- registration_type (character varying)
-- qualification (character varying)
-- college_name (character varying)
-- uniqueId (character varying)
-- fullName (character varying)
-- email (character varying)
-- phone (character varying)

