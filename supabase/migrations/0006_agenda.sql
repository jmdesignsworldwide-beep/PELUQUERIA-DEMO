-- ───────────────────────────────────────────────────────────────────────────
-- TANDA 4B · AGENDA INTERNA (estados de cita, bloqueos, escritura de recepción)
-- Misma fuente única que el link público y el Dashboard. RLS + FORCE.
-- ───────────────────────────────────────────────────────────────────────────

-- ===== 1) Estado explícito de la cita =====
alter table public.appointments
  add column if not exists status text not null default 'pendiente'
    check (status in ('pendiente','confirmada','en_proceso','completada','cancelada','no_show'));

-- ===== 2) Políticas de ESCRITURA para recepción (dueño gestiona su agenda) =====
drop policy if exists appointments_insert_own on public.appointments;
create policy appointments_insert_own on public.appointments
  for insert with check (auth.uid() = owner_id);
drop policy if exists appointments_update_own on public.appointments;
create policy appointments_update_own on public.appointments
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ===== 3) Bloqueos de horario (almuerzo, ausencia, etc.) =====
create table if not exists public.time_blocks (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  location_id     uuid references public.locations (id) on delete set null,
  professional_id uuid references public.professionals (id) on delete cascade,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  reason          text,
  created_at      timestamptz not null default now()
);
create index if not exists time_blocks_owner_idx on public.time_blocks (owner_id, starts_at);
alter table public.time_blocks enable row level security;
alter table public.time_blocks force  row level security;
drop policy if exists time_blocks_select_own on public.time_blocks;
create policy time_blocks_select_own on public.time_blocks
  for select using (auth.uid() = owner_id);
drop policy if exists time_blocks_insert_own on public.time_blocks;
create policy time_blocks_insert_own on public.time_blocks
  for insert with check (auth.uid() = owner_id);
drop policy if exists time_blocks_delete_own on public.time_blocks;
create policy time_blocks_delete_own on public.time_blocks
  for delete using (auth.uid() = owner_id);

-- ===== 4) Sembrar estados realistas del día (idempotente, sin pisar cambios) =====
-- Solo toca citas internas que sigan en el default 'pendiente' (no las del link
-- público, que deben quedar pendientes, ni las que recepción ya cambió).
create or replace function public.enrich_demo_statuses(p_owner uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid; v_today date;
begin
  v_owner := coalesce(p_owner, auth.uid());
  if v_owner is null then raise exception 'owner requerido'; end if;
  if auth.uid() is not null and v_owner <> auth.uid() then raise exception 'no autorizado'; end if;

  v_today := (now() at time zone 'America/Santo_Domingo')::date;

  with ranked as (
    select id, is_cancelled,
      (starts_at at time zone 'America/Santo_Domingo')::date d,
      row_number() over (
        partition by owner_id, (starts_at at time zone 'America/Santo_Domingo')::date
        order by starts_at
      ) rn
    from public.appointments
    where owner_id = v_owner and source = 'interna' and status = 'pendiente'
  )
  update public.appointments a set
    status = case
      when r.is_cancelled       then 'cancelada'
      when r.d < v_today        then 'completada'
      when r.rn <= 4            then 'completada'
      when r.rn = 5             then 'en_proceso'
      when r.rn = 7             then 'no_show'
      when r.rn % 2 = 0         then 'confirmada'
      else 'pendiente'
    end,
    is_cancelled = case when r.rn = 7 then true else a.is_cancelled end
  from ranked r where r.id = a.id;
end;
$$;

grant execute on function public.enrich_demo_statuses(uuid) to authenticated;
