-- IA Vendedora — schema inicial de produção
-- Execute este SQL no Supabase SQL Editor ou via Supabase CLI.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text unique not null,
  plano text default 'free',
  status text default 'inactive',
  role text default 'user',
  access_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_email text,
  provider text default 'lastlink',
  provider_customer_id text,
  provider_subscription_id text,
  plan_name text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  input_text text,
  output_text text,
  category text,
  tone text,
  created_at timestamptz default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  generation_id uuid not null references public.ai_generations(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, generation_id)
);

create table if not exists public.prompt_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  niche text,
  prompt_text text,
  is_premium boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.funnels (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  niche text,
  steps jsonb,
  is_premium boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.usage_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  generations_today integer default 0,
  generation_limit integer default 300,
  last_reset_date date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email, plano, status, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    'free',
    'inactive',
    'user'
  )
  on conflict (id) do update set
    email = excluded.email,
    nome = coalesce(public.profiles.nome, excluded.nome),
    updated_at = now();

  insert into public.usage_limits (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.increment_usage(user_id_param uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.usage_limits (user_id, generations_today, last_reset_date)
  values (user_id_param, 1, current_date)
  on conflict (user_id) do update set
    generations_today = case
      when public.usage_limits.last_reset_date < current_date then 1
      else public.usage_limits.generations_today + 1
    end,
    last_reset_date = current_date,
    updated_at = now();
end;
$$;

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ai_generations enable row level security;
alter table public.favorites enable row level security;
alter table public.prompt_library enable row level security;
alter table public.funnels enable row level security;
alter table public.usage_limits enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
for select using (auth.uid() = user_id);

drop policy if exists "ai_generations_select_own" on public.ai_generations;
create policy "ai_generations_select_own" on public.ai_generations
for select using (auth.uid() = user_id);

drop policy if exists "ai_generations_insert_own" on public.ai_generations;
create policy "ai_generations_insert_own" on public.ai_generations
for insert with check (auth.uid() = user_id);

drop policy if exists "favorites_manage_own" on public.favorites;
create policy "favorites_manage_own" on public.favorites
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "prompt_library_read_authenticated" on public.prompt_library;
create policy "prompt_library_read_authenticated" on public.prompt_library
for select using (auth.role() = 'authenticated');

drop policy if exists "funnels_read_authenticated" on public.funnels;
create policy "funnels_read_authenticated" on public.funnels
for select using (auth.role() = 'authenticated');

drop policy if exists "usage_limits_select_own" on public.usage_limits;
create policy "usage_limits_select_own" on public.usage_limits
for select using (auth.uid() = user_id);

insert into public.prompt_library (title, description, category, niche, prompt_text, is_premium) values
('Cliente pediu desconto', 'Resposta para proteger margem sem perder venda.', 'Objeções', 'Todos', 'Crie uma resposta curta para cliente que pediu desconto, reforçando valor e conduzindo para o fechamento.', false),
('Cliente sumiu', 'Follow-up elegante para recuperar conversa.', 'Follow-up', 'Todos', 'Crie uma mensagem de follow-up para cliente que parou de responder, com tom amigável e CTA simples.', false),
('Fechamento direto', 'Mensagem para fechar venda no WhatsApp.', 'Fechamento', 'Todos', 'Crie uma mensagem de fechamento com urgência leve, segurança e chamada para pagamento.', true),
('Estética - avaliação', 'Convite para avaliação em clínica de estética.', 'Vendas', 'Estética', 'Crie uma resposta para cliente interessado em procedimento estético, levando para agendamento de avaliação.', true)
on conflict do nothing;

insert into public.funnels (title, description, niche, steps, is_premium) values
('Funil Clínica de Estética', 'Captação, qualificação, agendamento e recuperação.', 'Estética', '[{"etapa":"captura","mensagem":"Oi! Vi que você tem interesse em melhorar sua autoestima. Posso te fazer 2 perguntas rápidas?"},{"etapa":"qualificação","mensagem":"Qual resultado você quer alcançar e em quanto tempo?"},{"etapa":"fechamento","mensagem":"Perfeito. Temos uma condição para agendar sua avaliação ainda hoje."}]'::jsonb, true),
('Funil Loja Local', 'Atendimento rápido para transformar dúvida em pedido.', 'Loja', '[{"etapa":"atendimento","mensagem":"Claro! Esse produto está disponível e posso separar para você agora."},{"etapa":"objeção","mensagem":"Entendo. O diferencial é que você já recebe com suporte e garantia."},{"etapa":"fechamento","mensagem":"Quer que eu te envie o link de pagamento para garantir o seu?"}]'::jsonb, false)
on conflict do nothing;
