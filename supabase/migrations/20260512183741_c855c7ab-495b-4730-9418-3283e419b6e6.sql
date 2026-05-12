-- 1. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- 2. Limpar Políticas Legadas
DROP POLICY IF EXISTS "perfil_select" ON public.profiles;
DROP POLICY IF EXISTS "perfil_update" ON public.profiles;
DROP POLICY IF EXISTS "subs_select" ON public.subscriptions;
DROP POLICY IF EXISTS "ai_all" ON public.ai_generations;
DROP POLICY IF EXISTS "fav_all" ON public.favorites;
DROP POLICY IF EXISTS "prompt_select" ON public.prompt_library;
DROP POLICY IF EXISTS "funis_select" ON public.funnels;
DROP POLICY IF EXISTS "usage_select" ON public.usage_limits;

-- 3. Criar Políticas Reais baseadas nas colunas existentes
CREATE POLICY "perfil_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "perfil_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "subs_select" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_all" ON public.ai_generations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "fav_all" ON public.favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "prompt_select" ON public.prompt_library FOR SELECT USING (true); -- Global
CREATE POLICY "funis_select" ON public.funnels FOR SELECT USING (true); -- Global
CREATE POLICY "usage_select" ON public.usage_limits FOR SELECT USING (auth.uid() = user_id);

-- 4. Automação de Perfil e Limites (Trigger handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, plano, status)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1), 'Gratuito', 'active')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  INSERT INTO public.usage_limits (user_id, generation_limit, generations_today)
  VALUES (NEW.id, 5, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Trigger Updated At para Profiles e Usage Limits
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_limits_updated_at ON public.usage_limits;
CREATE TRIGGER update_usage_limits_updated_at
    BEFORE UPDATE ON public.usage_limits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
