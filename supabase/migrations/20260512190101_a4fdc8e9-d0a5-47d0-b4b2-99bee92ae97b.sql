-- Update existing usage limits to a very high number and ensure profiles are active for testing
UPDATE public.usage_limits SET generation_limit = 10000;
UPDATE public.profiles SET status = 'active', access_expires_at = now() + interval '30 days' WHERE access_expires_at IS NULL;

-- Modify the profile creation trigger function to set 30 days access by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, status, access_expires_at)
  VALUES (
    NEW.id,
    CO_ALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'active',
    now() + interval '30 days'
  );
  
  INSERT INTO public.usage_limits (user_id, generation_limit)
  VALUES (NEW.id, 10000);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the increment_usage function to not be restrictive
CREATE OR REPLACE FUNCTION public.increment_usage(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.usage_limits
  SET 
    generations_today = generations_today + 1,
    updated_at = now()
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;