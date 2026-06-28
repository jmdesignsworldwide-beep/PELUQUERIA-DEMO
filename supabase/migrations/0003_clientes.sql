-- ───────────────────────────────────────────────────────────────────────────
-- TANDA 3 · CLIENTES (núcleo real: crear/editar/ficha + ficha técnica por piel)
-- Extiende la tabla clients de Tanda 2. RLS + FORCE ya activos.
-- ───────────────────────────────────────────────────────────────────────────

-- ===== 1) Columnas nuevas =====
alter table public.clients
  add column if not exists cedula     text,
  add column if not exists email      text,
  add column if not exists birthdate  date,
  add column if not exists photo_path text,
  add column if not exists notes      text,
  add column if not exists balance    numeric(10,2) not null default 0,
  add column if not exists is_vip     boolean not null default false,
  add column if not exists tech_sheet jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- ===== 2) Políticas RLS de ESCRITURA (el dueño gestiona SU clientela) =====
drop policy if exists clients_insert_own on public.clients;
create policy clients_insert_own on public.clients
  for insert with check (auth.uid() = owner_id);

drop policy if exists clients_update_own on public.clients;
create policy clients_update_own on public.clients
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ===== 3) Storage: bucket privado de fotos, aislado por cuenta =====
insert into storage.buckets (id, name, public)
values ('client-photos', 'client-photos', false)
on conflict (id) do nothing;

-- Cada cuenta solo toca su carpeta: {auth.uid()}/...
drop policy if exists client_photos_select_own on storage.objects;
create policy client_photos_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'client-photos'
         and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists client_photos_insert_own on storage.objects;
create policy client_photos_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'client-photos'
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists client_photos_update_own on storage.objects;
create policy client_photos_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'client-photos'
         and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists client_photos_delete_own on storage.objects;
create policy client_photos_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'client-photos'
         and (storage.foldername(name))[1] = auth.uid()::text);

-- ───────────────────────────────────────────────────────────────────────────
-- ENRIQUECER CLIENTES SEMBRADOS con cédula, email, ficha técnica POR PIEL, etc.
-- Idempotente: solo rellena clientes que aún no tienen cédula.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.enrich_demo_clients(p_owner uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_btype text;
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

  if v_btype = 'salon' then
    with ranked as (
      select id, name,
             row_number() over (order by created_at, name) rn
      from public.clients
      where owner_id = v_owner and cedula is null
    )
    update public.clients c set
      cedula    = lpad(((r.rn*131+40)%1000)::text,3,'0') || '-' ||
                  lpad(((r.rn*8675309)%10000000)::text,7,'0') || '-' || (r.rn%10)::text,
      email     = lower(translate(r.name,' ÁÉÍÓÚÑáéíóúñ','.AEIOUNaeioun')) || '@gmail.com',
      birthdate = make_date(1985 + (r.rn%22)::int, 1 + (r.rn%12)::int, 1 + (r.rn%27)::int),
      is_vip    = (r.rn % 4 = 0),
      balance   = case when r.rn%6=0 then 800 when r.rn%5=0 then -450 else 0 end,
      notes     = (array[
                    'Prefiere tonos cálidos. Muy puntual.',
                    'Alérgica al amoníaco — usar línea sin amoníaco.',
                    'Le gusta conversar poco. Café sin azúcar.',
                    'Cuero cabelludo sensible, evitar calor alto.',
                    'Siempre pide su estilista de confianza.'])[1 + (r.rn%5)],
      tech_sheet = jsonb_build_object(
        'formula_color', (array['Igora 7-1 + oxidante 20vol','Wella 6/0 + 9%','Majirel 5.3 + oxidante 30vol','Cabello virgen (sin color)'])[1 + (r.rn%4)],
        'tonos',         (array['Rubio ceniza','Castaño chocolate','Cobrizo intenso','Negro azulado'])[1 + (r.rn%4)],
        'tratamientos',  (array['Keratina (mar 2026)','Botox capilar (feb 2026)','Hidratación profunda','Ninguno reciente'])[1 + (r.rn%4)],
        'tipo_cabello',  (array['Liso, procesado','Ondulado, virgen','Rizado, teñido','Fino, procesado'])[1 + (r.rn%4)],
        'largo_cabello', (array['corto','mediano','largo'])[1 + (r.rn%3)],
        'alergias',      (array['Ninguna','Amoníaco','Níquel','Ninguna conocida'])[1 + (r.rn%4)]
      ),
      updated_at = now()
    from ranked r where r.id = c.id;
  else
    with ranked as (
      select id, name,
             row_number() over (order by created_at, name) rn
      from public.clients
      where owner_id = v_owner and cedula is null
    )
    update public.clients c set
      cedula    = lpad(((r.rn*131+40)%1000)::text,3,'0') || '-' ||
                  lpad(((r.rn*8675309)%10000000)::text,7,'0') || '-' || (r.rn%10)::text,
      email     = lower(translate(r.name,' ÁÉÍÓÚÑáéíóúñ','.AEIOUNaeioun')) || '@gmail.com',
      birthdate = make_date(1985 + (r.rn%22)::int, 1 + (r.rn%12)::int, 1 + (r.rn%27)::int),
      is_vip    = (r.rn % 4 = 0),
      balance   = case when r.rn%6=0 then 600 when r.rn%5=0 then -300 else 0 end,
      notes     = (array[
                    'Cliente fijo de los sábados. Puntual.',
                    'Sensible con la navaja — ir con calma en el perfilado.',
                    'Le gusta el degradado bien marcado.',
                    'Pide siempre su barbero. Conversa poco.',
                    'Prefiere productos sin alcohol.'])[1 + (r.rn%5)],
      tech_sheet = jsonb_build_object(
        'tipo_corte',   (array['Fade medio + texturizado arriba','Corte clásico con raya','Degradado alto + diseño','Casquete con tijera'])[1 + (r.rn%4)],
        'maquina',      (array['1.5 a los lados, tijera arriba','0.5 abajo, difumina al 2','Skin fade, guía 1 a 3','Solo tijera y peine'])[1 + (r.rn%4)],
        'degradado',    (array['Medio','Alto','Bajo','Skin fade'])[1 + (r.rn%4)],
        'barba',        (array['Perfilado clásico con navaja','Barba completa difuminada','Línea marcada, sin navaja','No usa barba'])[1 + (r.rn%4)],
        'notas_estilo', (array['Raya marcada al lado','Diseño de líneas ocasional','Estilo natural','Texturizado con tijera'])[1 + (r.rn%4)],
        'alergias',     (array['Ninguna','Sensible a la navaja','Alcohol en aftershave','Ninguna conocida'])[1 + (r.rn%4)]
      ),
      updated_at = now()
    from ranked r where r.id = c.id;
  end if;
end;
$$;

grant execute on function public.enrich_demo_clients(uuid) to authenticated;
