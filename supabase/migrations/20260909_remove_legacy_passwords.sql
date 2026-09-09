-- ============================================================================
-- NIPUN Supabase Schema Cleanup: Remove Legacy Custom Password Storage
-- Passwords are managed solely by Supabase Auth (auth.users).
-- ============================================================================

ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS password_salt;
