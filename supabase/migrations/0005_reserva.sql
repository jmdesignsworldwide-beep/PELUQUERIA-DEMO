-- ───────────────────────────────────────────────────────────────────────────
-- TANDA 4 · RESERVA PÚBLICA (el "link monster")
-- Ubicaciones, slug por cuenta, especialidades, categorías, campos de reserva.
-- La página pública usa endpoints de servidor con service_role, SIEMPRE
-- acotados por owner_id resuelto del slug. RLS + FORCE se mantienen.
-- ───────────────────────────────────────────────────────────────────────────

-- ===== 1) profiles: slug público + teléfono/WhatsApp =====
alter table public.profiles
  add column if not exists slug         text,
  add column if not exists public_phone text;
create unique index if not exists profiles_slug_unique
  on public.profiles (slug) where slug is not null;

update public.profiles set slug = 'jm-beauty-salon', public_phone = '809-555-0100'
  where username = 'salon-demo' and slug is null;
update public.profiles set slug = 'jm-barberia', public_phone = '809-555-0200'
  where username = 'barberia-demo' and slug is null;

-- ===== 2) ubicaciones (sucursales) =====
create table if not exists public.locations (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  address         text,
  phone           text,
  is_primary      boolean not null default false,
  open_min        int not null default 540,   -- 09:00
  close_min       int not null default 1140,  -- 19:00
  closed_weekdays int[] not null default '{0}'::int[], -- 0 = domingo
  sort            int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists locations_owner_idx on public.locations (owner_id);
alter table public.locations enable row level security;
alter table public.locations force  row level security;
drop policy if exists locations_select_own on public.locations;
create policy locations_select_own on public.locations
  for select using (auth.uid() = owner_id);

insert into public.locations (owner_id, name, address, phone, is_primary)
select
  p.id,
  case when p.business_type = 'salon'
       then 'JM Beauty Salón — Naco'
       else 'JM Barbería — Piantini' end,
  case when p.business_type = 'salon'
       then 'Av. Tiradentes 45, Naco, Santo Domingo'
       else 'Av. Gustavo Mejía Ricart 80, Piantini, Santo Domingo' end,
  p.public_phone,
  true
from public.profiles p
where p.username in ('salon-demo', 'barberia-demo')
  and not exists (select 1 from public.locations l where l.owner_id = p.id);

-- ===== 3) profesionales: ubicación + especialidad =====
alter table public.professionals
  add column if not exists location_id uuid references public.locations (id) on delete set null,
  add column if not exists specialty   text;

update public.professionals pr set location_id = l.id
from public.locations l
where l.owner_id = pr.owner_id and l.is_primary and pr.location_id is null;

with ranked as (
  select pr.id,
         row_number() over (partition by pr.owner_id order by pr.created_at, pr.name) rn,
         p.business_type bt
  from public.professionals pr
  join public.profiles p on p.id = pr.owner_id
)
update public.professionals pr set specialty = case
  when r.bt = 'salon'
    then (array['Colorista','Cortes y peinados','Tratamientos','Uñas'])[1 + ((r.rn-1) % 4)]
    else (array['Fades y degradados','Barba y navaja','Cortes clásicos','Diseño y líneas'])[1 + ((r.rn-1) % 4)]
  end
from ranked r where r.id = pr.id and pr.specialty is null;

-- ===== 4) servicios: categoría =====
alter table public.services add column if not exists category text;
update public.services s set category = case
  when s.name ~* 'tinte|mechas|balayage|canas|color'      then 'Color'
  when s.name ~* 'manicure|pedicure|uñas|esmaltado|gel'   then 'Uñas'
  when s.name ~* 'maquillaje'                             then 'Maquillaje'
  when s.name ~* 'barba|afeitado'                         then 'Barba'
  when s.name ~* 'diseño|líneas'                          then 'Diseño'
  else case when (select business_type from public.profiles where id = s.owner_id) = 'salon'
            then 'Cabello' else 'Corte' end
end
where s.category is null;

-- ===== 5) citas: campos de reserva =====
alter table public.appointments
  add column if not exists location_id  uuid references public.locations (id) on delete set null,
  add column if not exists booking_code text,
  add column if not exists source       text not null default 'interna'
                    check (source in ('interna','publica'));

update public.appointments a set location_id = l.id
from public.locations l
where l.owner_id = a.owner_id and l.is_primary and a.location_id is null;

-- ===== 6) rate limit de la reserva pública (server-side) =====
create table if not exists public.booking_attempts (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null,
  created_at timestamptz not null default now()
);
create index if not exists booking_attempts_slug_idx
  on public.booking_attempts (slug, created_at);
alter table public.booking_attempts enable row level security;
alter table public.booking_attempts force  row level security;
-- Sin políticas: solo service_role (servidor) la toca.
