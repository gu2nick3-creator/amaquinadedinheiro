-- Fix search_path for handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Fix search_path for update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Revoke default execute from public for SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

-- Grant execute to specific roles if needed (authenticated users often need update_updated_at_column)
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
