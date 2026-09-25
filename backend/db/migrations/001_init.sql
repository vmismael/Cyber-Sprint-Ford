-- Ford Intelligence — esquema inicial
-- Requer PostgreSQL 13+ (gen_random_uuid nativo). Testado em PostgreSQL 16 e Supabase.

-- ---------- Usuários ----------
create table if not exists users (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null check (char_length(name) between 2 and 80),
  email                 text not null unique check (email = lower(email) and char_length(email) <= 254),
  password_hash         text not null,                       -- bcrypt, custo 12
  role                  text not null default 'client' check (role in ('client', 'analyst', 'admin')),
  failed_login_attempts int  not null default 0 check (failed_login_attempts >= 0),
  locked_until          timestamptz,
  created_at            timestamptz not null default now()
);

create table if not exists profiles (
  user_id       uuid primary key references users(id) on delete cascade,
  vehicle_model text not null check (vehicle_model in ('ranger', 'maverick', 'territory', 'mustang', 'raptor')),
  usage_style   text not null check (usage_style in ('urban', 'rural', 'mixed', 'performance')),
  monthly_km    int  not null check (monthly_km between 0 and 50000),
  plan          text not null check (plan in ('agro', 'urban', 'premium')),
  updated_at    timestamptz not null default now()
);

-- ---------- Agendamentos ----------
create table if not exists bookings (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  protocol           text not null unique,
  dealer_id          text not null,
  service            text not null check (service in ('revision', 'oil-change', 'tires', 'diagnostics', 'other')),
  mode               text not null check (mode in ('in-person', 'pickup-delivery')),
  date               text not null check (date ~ '^\d{4}-\d{2}-\d{2}$'),
  slot               text not null check (slot ~ '^\d{2}:\d{2}$'),
  pickup_address_enc text,          -- AES-256-GCM, cifrado na aplicação
  notes_enc          text,          -- AES-256-GCM, cifrado na aplicação
  status             text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at         timestamptz not null default now()
);
create index if not exists bookings_user_idx on bookings (user_id, created_at desc);

-- ---------- Sessões (refresh tokens) ----------
create table if not exists refresh_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  token_hash  text not null unique,  -- SHA-256; o token em si nunca é salvo
  family_id   uuid not null,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  replaced_by uuid,
  created_at  timestamptz not null default now()
);
create index if not exists refresh_tokens_family_idx on refresh_tokens (family_id);
create index if not exists refresh_tokens_user_idx on refresh_tokens (user_id);

-- ---------- Leads (dados fictícios de demonstração) ----------
create table if not exists leads (
  id                text primary key,
  client_name       text not null,
  email             text not null,
  phone             text not null,
  vehicle_model     text not null,
  vehicle_year      int  not null,
  odometer_km       int  not null,
  plan              text not null,
  service           text not null,
  ai_score          int  not null check (ai_score between 0 and 100),
  risk_label        text not null check (risk_label in ('baixo', 'moderado', 'alto')),
  last_activity     text not null,
  status            text not null,
  estimated_revenue int  not null
);

-- ---------- Trilha de auditoria ----------
create table if not exists audit_log (
  id         uuid primary key default gen_random_uuid(),
  timestamp  timestamptz not null default now(),
  level      text not null check (level in ('info', 'warn', 'error')),
  event      text not null,
  user_id    uuid,
  role       text,
  request_id text,
  ip_hash    text,             -- HMAC do IP, nunca o IP em claro
  route      text,
  status     int,
  meta       jsonb not null default '{}'::jsonb
);
create index if not exists audit_log_ts_idx on audit_log (timestamp desc);
create index if not exists audit_log_event_idx on audit_log (event, timestamp desc);

-- A trilha é somente-inclusão: ninguém edita um evento, e só é possível apagar
-- registros com mais de 6 meses (prazo do Marco Civil, art. 15).
create or replace function audit_log_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'audit_log é imutável';
  end if;
  if tg_op = 'DELETE' and old.timestamp > now() - interval '6 months' then
    raise exception 'audit_log: registro dentro do prazo de retenção';
  end if;
  return old;
end $$;

drop trigger if exists audit_log_immutable on audit_log;
create trigger audit_log_immutable
  before update or delete on audit_log
  for each row execute function audit_log_guard();

-- ---------- Retenção (LGPD — necessidade) ----------
-- Agendamentos: 90 dias. Sessões expiradas: 30 dias. Auditoria: 6 meses.
create or replace function purge_expired_data() returns void language sql as $$
  delete from bookings       where created_at < now() - interval '90 days';
  delete from refresh_tokens where expires_at < now() - interval '30 days';
  delete from audit_log      where timestamp  < now() - interval '6 months';
$$;
-- No Supabase, agendar com pg_cron (Database > Extensions > pg_cron):
-- select cron.schedule('purge-expired-data', '0 3 * * *', 'select purge_expired_data()');

-- ---------- Row Level Security ----------
-- A API conecta com credencial de servidor. RLS ligado sem políticas bloqueia
-- qualquer acesso pelas chaves públicas do Supabase (anon/authenticated) à REST automática.
alter table users          enable row level security;
alter table profiles       enable row level security;
alter table bookings       enable row level security;
alter table refresh_tokens enable row level security;
alter table leads          enable row level security;
alter table audit_log      enable row level security;
