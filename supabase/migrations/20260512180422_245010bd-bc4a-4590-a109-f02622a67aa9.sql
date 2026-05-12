-- 1. Profiles (Refinement)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    nome TEXT,
    email TEXT,
    avatar_url TEXT,
    plano TEXT DEFAULT 'free',
    status TEXT DEFAULT 'inactive',
    role TEXT DEFAULT 'user',
    access_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    customer_email TEXT,
    provider TEXT DEFAULT 'lastlink',
    provider_customer_id TEXT,
    provider_subscription_id TEXT,
    plan_name TEXT,
    status TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. AI Generations
CREATE TABLE IF NOT EXISTS public.ai_generations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    input_text TEXT,
    output_text TEXT,
    category TEXT,
    tone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Favorites
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    generation_id UUID REFERENCES public.ai_generations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, generation_id)
);

-- 5. Prompt Library
CREATE TABLE IF NOT EXISTS public.prompt_library (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    niche TEXT,
    prompt_text TEXT,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Funnels
CREATE TABLE IF NOT EXISTS public.funnels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    niche TEXT,
    steps JSONB,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Usage Limits
CREATE TABLE IF NOT EXISTS public.usage_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL UNIQUE,
    generations_today INTEGER DEFAULT 0,
    generation_limit INTEGER DEFAULT 5,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Enablement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- AI Generations
CREATE POLICY "Users can view own generations" ON public.ai_generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generations" ON public.ai_generations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favorites
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Content (Public/Authenticated read)
CREATE POLICY "Auth users can read prompt library" ON public.prompt_library FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can read funnels" ON public.funnels FOR SELECT USING (auth.role() = 'authenticated');

-- Usage Limits
CREATE POLICY "Users can view own usage" ON public.usage_limits FOR SELECT USING (auth.uid() = user_id);

-- Auth Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, status, access_expires_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    'active', -- Initial active status for 7 days (as per default)
    (now() + interval '7 days')
  );

  INSERT INTO public.usage_limits (user_id, generation_limit)
  VALUES (NEW.id, 5);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed Content
INSERT INTO public.prompt_library (title, description, category, niche, prompt_text, is_premium)
VALUES 
('Venda Direta Imobiliária', 'Focado em agendamento de visitas para corretores.', 'Vendas', 'Imobiliária', 'Você é um corretor experiente. O cliente perguntou: {input}. Responda com foco em agendar uma visita física.', false),
('Quebra de Objeção Estética', 'Como lidar com o "está caro" em clínicas.', 'Objeção', 'Estética', 'Você é consultora de estética. O cliente disse: {input}. Reforce o valor do procedimento e os benefícios a longo prazo.', true),
('Fechamento de Academia', 'Gatilhos de urgência para matrículas.', 'Fechamento', 'Fitness', 'Foque nos benefícios de saúde e na promoção que expira hoje. O cliente disse: {input}.', false);

INSERT INTO public.funnels (title, description, niche, steps, is_premium)
VALUES 
('Funil Gold de Estética', 'Captura e conversão para clínicas.', 'Estética', '[{"name": "Atração", "text": "Convite para avaliação gratuita"}, {"name": "Nutrição", "text": "Depoimentos de antes e depois"}, {"name": "Fechamento", "text": "Voucher de desconto válido por 24h"}]', true),
('Corretor de Elite', 'Atendimento rápido no WhatsApp.', 'Imobiliária', '[{"name": "Boas-vindas", "text": "Apresentação e envio de catálogo"}, {"name": "Qualificação", "text": "Pergunta sobre orçamento e região"}, {"name": "Agendamento", "text": "Sugestão de horários de visita"}]', false);
