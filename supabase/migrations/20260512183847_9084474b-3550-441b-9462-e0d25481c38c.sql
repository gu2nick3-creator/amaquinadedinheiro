-- Revogar execução pública para segurança
REVOKE EXECUTE ON FUNCTION public.increment_usage(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_usage(UUID) FROM anon, authenticated;
