-- 1. Ensure columns exist before using them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END
$$;

-- 2. Rebuild the trigger function with more robustness
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles with robust data handling
  INSERT INTO public.profiles (
    id, 
    nome, 
    email, 
    status, 
    plano,
    access_expires_at,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário Novo'),
    NEW.email,
    'active',
    'free',
    (now() + interval '7 days'),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = EXCLUDED.nome;

  -- Insert into usage_limits
  INSERT INTO public.usage_limits (
    user_id, 
    generations_today, 
    generation_limit, 
    last_reset_date
  )
  VALUES (
    NEW.id, 
    0, 
    5, 
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Ensure trigger is correctly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Adjust defaults
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE public.profiles ALTER COLUMN plano SET DEFAULT 'free';
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- 5. Grant permissions to ensure service roles can operate
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.usage_limits TO service_role;
