-- Agente Trader: banco inicial (uso pessoal, 1 usuario)
-- Cole no SQL Editor do Supabase e execute.

create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  risco_rs numeric not null default 15,
  limite_stops int not null default 2,
  ativo_padrao text not null default 'WINZ26' check (ativo_padrao in ('WINZ26','WDOZ26'))
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data date not null default current_date,
  hora text not null,
  nome text not null,
  pais text not null,
  impacto text not null check (impacto in ('Alto','Médio','Baixo'))
);

create table public.journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data_hora timestamptz not null default now(),
  ativo text not null check (ativo in ('WINZ26','WDOZ26')),
  lado text not null check (lado in ('Compra','Venda')),
  alinhados boolean not null default false,
  entrada numeric not null,
  stop numeric not null,
  alvo numeric not null,
  saida numeric,
  resultado_rs numeric,
  resultado_r numeric,
  seguiu_checklist boolean not null default false,
  execucao text not null check (execucao in ('No gatilho','Antecipei')),
  saida_alvo text
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  ativo text not null,
  veredito text not null,
  motivo text,
  checklist jsonb,
  plano jsonb,
  imagens text[]
);

create table public.news_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo text not null,
  resumo text,
  link text,
  fonte text,
  publicado_em timestamptz
);

-- Seguranca: cada linha so e visivel para o dono
do $$
declare t text;
begin
  foreach t in array array['settings','events','journal','analyses','news_cache'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own_%1$s" on public.%1$I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t);
  end loop;
end $$;

-- Bucket privado para os prints (pasta = id do usuario)
insert into storage.buckets (id, name, public) values ('prints', 'prints', false)
on conflict (id) do nothing;

create policy "prints_own" on storage.objects for all to authenticated
using (bucket_id = 'prints' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'prints' and (storage.foldername(name))[1] = auth.uid()::text);
