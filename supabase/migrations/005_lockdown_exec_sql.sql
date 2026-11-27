-- ============================================================================
-- Migration 005: Remove Arbitrary SQL Execution RPC (exec_sql)
-- Execute AFTER migrations 001-004 are applied and verified.
-- ============================================================================

REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.exec_sql(text);

-- Also restrict rls_auto_enable if present in public
DO $$
BEGIN
  REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
