-- ============================================================================
-- 002: Enum Types
-- ============================================================================
-- This migration defines custom enum types for the database.
--
-- Note: This schema uses TEXT with CHECK constraints instead of ENUMs
-- for better flexibility. This file is a placeholder for future enum types.
--
-- Dependencies: None
-- Idempotent: Yes (no enums defined)
-- ============================================================================

-- No enum types are used in this schema.
-- All status fields use TEXT with CHECK constraints for better flexibility.
-- If enums are needed in the future, add them here using:
-- CREATE TYPE IF NOT EXISTS enum_name AS ENUM ('value1', 'value2');

-- ============================================================================
-- Verification
-- ============================================================================
-- No enums to verify
SELECT 'No enum types defined - using TEXT with CHECK constraints' as status;
