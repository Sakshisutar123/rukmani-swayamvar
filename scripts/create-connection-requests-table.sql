-- Create connection_requests table (option 3 - manual run)
-- Run this in your PostgreSQL database (pgAdmin, psql, or your DB tool).

-- 1. Create enum type for status (matches Sequelize convention)
DO $$ BEGIN
  CREATE TYPE "enum_connection_requests_status" AS ENUM('pending', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create table
CREATE TABLE IF NOT EXISTS "connection_requests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "requesterId" UUID NOT NULL REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "requestedId" UUID NOT NULL REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "status" "enum_connection_requests_status" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS "connection_requests_requester_id" ON "connection_requests"("requesterId");
CREATE INDEX IF NOT EXISTS "connection_requests_requested_id" ON "connection_requests"("requestedId");
CREATE UNIQUE INDEX IF NOT EXISTS "connection_requests_requester_id_requested_id" ON "connection_requests"("requesterId", "requestedId");
