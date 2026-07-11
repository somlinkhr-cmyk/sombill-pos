-- ============================================================================
-- 001: PostgreSQL Extensions
-- ============================================================================
-- This migration enables required PostgreSQL extensions for UUID generation
-- and cryptographic functions.
--
-- Dependencies: None
-- Idempotent: Yes (uses IF NOT EXISTS)
-- ============================================================================

-- Enable UUID extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify extensions are installed
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');
