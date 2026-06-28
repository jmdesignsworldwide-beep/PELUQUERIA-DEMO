-- ───────────────────────────────────────────────────────────────────────────
-- TANDA 2 · Datos del DASHBOARD (citas, profesionales, clientes, servicios)
-- RLS + FORCE en todas. El dashboard LEE de aquí (fuente única).
-- Los datos se anclan al DÍA ACTUAL (zona RD) vía ensure_demo_data(), para que
-- el demo siempre se vea "vivo hoy" sin importar cuándo se abra.
-- ───────────────────────────────────────────────────────────────────────────

-- ===== PROFESIONALES (estilistas / barberos) =====
create table if not exists public.professionals (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  title      text,
  created_at timestamptz not null default now()
);
create index if not exists professionals_owner_idx on public.professionals (owner_id);
alter table public.professionals enable row level security;
alter table public.professionals force  row level security;
drop policy if exists professionals_select_own on public.professionals;
create policy professionals_select_own on public.professionals
  for select using (auth.uid() = owner_id);

-- ===== CLIENTES (clientas / clientes) =====
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  phone      text,
  created_at timestamptz not null default now()
);
create index if not exists clients_owner_idx on public.clients (owner_id);
alter table public.clients enable row level security;
alter table public.clients force  row level security;
drop policy if exists clients_select_own on public.clients;
create policy clients_select_own on public.clients
  for select using (auth.uid() = owner_id);

-- ===== SERVICIOS =====
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  price        numeric(10,2) not null,
  duration_min int not null default 45,
  sort         int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists services_owner_idx on public.services (owner_id);
alter table public.services enable row level security;
alter table public.services force  row level security;
drop policy if exists services_select_own on public.services;
create policy services_select_own on public.services
  for select using (auth.uid() = owner_id);

-- ===== CITAS =====
create table if not exists public.appointments (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  client_id       uuid references public.clients (id) on delete set null,
  professional_id uuid references public.professionals (id) on delete set null,
  service_id      uuid references public.services (id) on delete set null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  amount          numeric(10,2) not null default 0,
  tip             numeric(10,2) not null default 0,
  payment_method  text not null default 'efectivo'
                    check (payment_method in ('efectivo','transferencia','tarjeta')),
  is_cancelled    boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists appointments_owner_starts_idx
  on public.appointments (owner_id, starts_at);
alter table public.appointments enable row level security;
alter table public.appointments force  row level security;
drop policy if exists appointments_select_own on public.appointments;
create policy appointments_select_own on public.appointments
  for select using (auth.uid() = owner_id);

-- ───────────────────────────────────────────────────────────────────────────
-- SIEMBRA "SIEMPRE VIVA": ancla roster + citas de los últimos 7 días al día
-- actual de RD. Idempotente: solo crea lo que falta. SECURITY DEFINER (bypassa
-- RLS para sembrar); un usuario autenticado solo puede sembrar SU propia cuenta.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.ensure_demo_data(p_owner uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner    uuid;
  v_btype    text;
  v_today    date;
  v_day      int;
  i          int;
  v_pros     uuid[];
  v_clients  uuid[];
  v_svcs     uuid[];
  v_svc      uuid;
  v_price    numeric;
  v_dur      int;
  v_start    timestamptz;
  v_times    time[] := array['09:00','09:45','10:30','11:15','12:00','13:30',
                             '14:15','15:00','16:00','17:00','18:00']::time[];
  v_methods  text[] := array['efectivo','transferencia','tarjeta'];
  v_pro_names   text[];
  v_pro_title   text;
  v_client_names text[];
  n_pro int; n_cli int; n_svc int;
begin
  v_owner := coalesce(p_owner, auth.uid());
  if v_owner is null then
    raise exception 'owner requerido';
  end if;
  if auth.uid() is not null and v_owner <> auth.uid() then
    raise exception 'no autorizado';
  end if;

  select business_type into v_btype from public.profiles where id = v_owner;
  if v_btype is null then
    return;
  end if;

  -- Día actual en zona de República Dominicana.
  v_today := (now() at time zone 'America/Santo_Domingo')::date;

  -- ===== 1) ROSTER (idempotente) =====
  if not exists (select 1 from public.professionals where owner_id = v_owner) then
    if v_btype = 'salon' then
      v_pro_names := array['Carolina Reyes','Ymara Peña','Massiel Jiménez','Wendy Disla'];
      v_pro_title := 'Estilista';
    else
      v_pro_names := array['José Alcántara','Manuel De la Cruz','Ramón Pichardo','Starlin Fermín'];
      v_pro_title := 'Barbero';
    end if;
    insert into public.professionals (owner_id, name, title)
    select v_owner, n, v_pro_title from unnest(v_pro_names) as n;
  end if;

  if not exists (select 1 from public.clients where owner_id = v_owner) then
    if v_btype = 'salon' then
      v_client_names := array[
        'Rosa Mejía','Altagracia Núñez','Yokasta Santos','Mariana Espinal',
        'Niurka Polanco','Esmeralda Frías','Dahiana Ventura','Carmen Abreu',
        'Yaneris Cabrera','Scarlett Tavárez','Paola Guzmán','Génesis Mateo'];
    else
      v_client_names := array[
        'Pedro Martínez','Luis Encarnación','Juan Carlos Rosario','Félix Brito',
        'Wilkin Paulino','Ramón Heredia','Ángel Bautista','Franklin Castillo',
        'Elvis Cuevas','Yunior Sánchez','Héctor Vargas','Wander Objío'];
    end if;
    insert into public.clients (owner_id, name, phone)
    select
      v_owner, n,
      (array['809','829','849'])[1 + (idx % 3)] || '-' ||
      lpad(((idx*137 + 200) % 900 + 100)::text, 3, '0') || '-' ||
      lpad(((idx*531 + 1000) % 9000 + 1000)::text, 4, '0')
    from unnest(v_client_names) with ordinality as t(n, idx);
  end if;

  if not exists (select 1 from public.services where owner_id = v_owner) then
    if v_btype = 'salon' then
      insert into public.services (owner_id, name, price, duration_min, sort) values
        (v_owner,'Blower / Secado',       800, 45, 1),
        (v_owner,'Corte de mujer',        900, 45, 2),
        (v_owner,'Tinte global',         3200, 90, 3),
        (v_owner,'Mechas',               5500,120, 4),
        (v_owner,'Balayage',             9000,150, 5),
        (v_owner,'Keratina',             6500,120, 6),
        (v_owner,'Manicure',              500, 45, 7),
        (v_owner,'Manicure en gel',       900, 60, 8),
        (v_owner,'Pedicure',              700, 60, 9),
        (v_owner,'Maquillaje',           2500, 60,10);
    else
      insert into public.services (owner_id, name, price, duration_min, sort) values
        (v_owner,'Corte clásico',          400, 30, 1),
        (v_owner,'Degradado / Fade',       550, 45, 2),
        (v_owner,'Corte + Barba',          750, 60, 3),
        (v_owner,'Perfilado de barba',     350, 30, 4),
        (v_owner,'Afeitado toalla caliente',500, 45, 5),
        (v_owner,'Corte de niño',          300, 30, 6),
        (v_owner,'Diseño / Líneas',        250, 30, 7),
        (v_owner,'Cobertura de canas',    1200, 60, 8);
    end if;
  end if;

  -- Cargar arrays del roster ya sembrado.
  select array_agg(id order by created_at, name) into v_pros   from public.professionals where owner_id = v_owner;
  select array_agg(id order by created_at, name) into v_clients from public.clients        where owner_id = v_owner;
  select array_agg(id order by sort)             into v_svcs    from public.services        where owner_id = v_owner;
  n_pro := array_length(v_pros,1);
  n_cli := array_length(v_clients,1);
  n_svc := array_length(v_svcs,1);

  -- ===== 2) CITAS de los últimos 7 días (idempotente por día) =====
  for v_day in 0..6 loop
    if not exists (
      select 1 from public.appointments
      where owner_id = v_owner
        and (starts_at at time zone 'America/Santo_Domingo')::date = v_today - v_day
    ) then
      for i in 1 .. array_length(v_times,1) loop
        v_svc := v_svcs[1 + ((v_day + i) % n_svc)];
        select price, duration_min into v_price, v_dur from public.services where id = v_svc;
        v_start := ((v_today - v_day) + v_times[i]) at time zone 'America/Santo_Domingo';
        insert into public.appointments (
          owner_id, client_id, professional_id, service_id,
          starts_at, ends_at, amount, tip, payment_method, is_cancelled
        ) values (
          v_owner,
          v_clients[1 + ((v_day*3 + i) % n_cli)],
          v_pros[1 + (i % n_pro)],
          v_svc,
          v_start,
          v_start + make_interval(mins => v_dur),
          v_price,
          case when i % 4 = 0 then round(v_price * 0.10) else 0 end,
          v_methods[1 + (i % 3)],
          (i = 6)   -- una cancelada por día (variedad)
        );
      end loop;
    end if;
  end loop;
end;
$$;

grant execute on function public.ensure_demo_data(uuid) to authenticated;
