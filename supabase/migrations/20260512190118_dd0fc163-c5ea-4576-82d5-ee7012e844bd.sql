-- Set search_path for security and fix linter warnings
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.increment_usage(user_id_param UUID) SET search_path = public;