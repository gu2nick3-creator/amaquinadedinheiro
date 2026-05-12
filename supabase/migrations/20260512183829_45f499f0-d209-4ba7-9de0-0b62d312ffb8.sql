-- Função para incrementar o uso diário
CREATE OR REPLACE FUNCTION public.increment_usage(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.usage_limits
  SET generations_today = generations_today + 1,
      updated_at = now()
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
