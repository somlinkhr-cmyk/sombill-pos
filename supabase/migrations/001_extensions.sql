-- ============================================================================
-- 001: Extensions
-- ============================================================================
-- Enable required PostgreSQL extensions
--
-- Dependencies: None
-- Idempotent: Yes (uses CREATE EXTENSION IF NOT EXISTS)
-- ============================================================================

-- Enable UUID extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'Extensions created successfully' as status,
  COUNT(*) as extension_count
FROM pg_extension
WHERE extname IN ('uuid-ossp');
