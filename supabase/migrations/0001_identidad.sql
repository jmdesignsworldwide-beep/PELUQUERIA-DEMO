-- ───────────────────────────────────────────────────────────────────────────
-- TANDA 1 · Esquema mínimo de IDENTIDAD / CUENTAS
-- RLS + FORCE en TODAS las tablas desde el inicio (aislamiento hermético).
-- ───────────────────────────────────────────────────────────────────────────

-- ===== PERFILES (1:1 con auth.users) =====
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  username          text not null unique,
  business_type     text not null check (business_type in ('salon', 'barberia')),
  role              text not null default 'cliente' check (role in ('admin', 'cliente')),
  business_name     text not null,
  access_expires_at timestamptz,                 -- null = sin vencimiento
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force  row level security;

-- Cada cuenta ve SOLO su propia fila. Sin políticas de insert/update/delete,
-- por lo que el cliente no puede modificar perfiles (gestión = admin/servidor,
-- en una tanda posterior). El rol 'cliente' jamás accede a gestión de usuarios.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

-- ===== RATE LIMIT del login (por usuario, server-side) =====
create table if not exists public.login_attempts (
  id         uuid primary key default gen_random_uuid(),
  username   text not null,
  created_at timestamptz not null default now()
);

create index if not exists login_attempts_username_idx
  on public.login_attempts (username, created_at);

alter table public.login_attempts enable row level security;
alter table public.login_attempts force  row level security;
-- Sin políticas: solo el service_role (que bypassa RLS) puede leer/escribir.

-- ===== TRIGGER: crear perfil al crear el usuario de auth =====
-- Los datos de la cuenta (usuario, piel, negocio, rol, vencimiento) viajan en
-- user_metadata al crear el usuario; este trigger los materializa en profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, username, business_type, role, business_name, access_expires_at, is_active
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'business_type', 'salon'),
    coalesce(new.raw_user_meta_data->>'role', 'cliente'),
    coalesce(new.raw_user_meta_data->>'business_name', 'Negocio'),
    case
      when coalesce(new.raw_user_meta_data->>'access_expires_at', '') <> ''
      then (new.raw_user_meta_data->>'access_expires_at')::timestamptz
      else null
    end,
    coalesce((new.raw_user_meta_data->>'is_active')::boolean, true)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
