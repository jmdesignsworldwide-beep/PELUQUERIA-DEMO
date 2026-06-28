-- ───────────────────────────────────────────────────────────────────────────
-- AJUSTE TANDA 3 · Historial técnico (timeline) por visita
-- El detalle técnico que CAMBIA cada visita vive en appointments.tech_detail
-- (fuente única, RLS ya activa). La ficha base (clients.tech_sheet) queda solo
-- con lo PERMANENTE (tipo de cabello / alergias / notas base).
-- ───────────────────────────────────────────────────────────────────────────

alter table public.appointments
  add column if not exists tech_detail jsonb not null default '{}'::jsonb;

-- ===== Reescribir clients.tech_sheet a SOLO datos permanentes =====
-- (antes guardaba fórmulas/cortes por-visita; eso se mueve al timeline)
create or replace function public.reset_permanent_tech(p_owner uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid; v_btype text;
begin
  v_owner := coalesce(p_owner, auth.uid());
  if v_owner is null then raise exception 'owner requerido'; end if;
  if auth.uid() is not null and v_owner <> auth.uid() then raise exception 'no autorizado'; end if;
  select business_type into v_btype from public.profiles where id = v_owner;
  if v_btype is null then return; end if;

  if v_btype = 'salon' then
    with ranked as (
      select id, row_number() over (order by created_at, name) rn
      from public.clients where owner_id = v_owner
    )
    update public.clients c set tech_sheet = jsonb_build_object(
      'tipo_cabello', (array['Liso','Ondulado','Rizado'])[1 + (r.rn%3)],
      'procesado',    (array['Virgen','Procesado','Teñido'])[1 + (r.rn%3)],
      'alergias',     (array['Ninguna','Amoníaco','Níquel','Ninguna conocida'])[1 + (r.rn%4)]
    ), updated_at = now()
    from ranked r where r.id = c.id;
  else
    with ranked as (
      select id, row_number() over (order by created_at, name) rn
      from public.clients where owner_id = v_owner
    )
    update public.clients c set tech_sheet = jsonb_build_object(
      'alergias',     (array['Ninguna','Sensible a la navaja','Alcohol en aftershave','Ninguna conocida'])[1 + (r.rn%4)],
      'notas_estilo', (array['Raya marcada al lado','Estilo natural','Texturizado con tijera','Diseño ocasional'])[1 + (r.rn%4)]
    ), updated_at = now()
    from ranked r where r.id = c.id;
  end if;
end;
$$;

-- ===== Sembrar tech_detail por-visita, coherente con el servicio =====
create or replace function public.enrich_demo_visits(p_owner uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid; v_btype text;
begin
  v_owner := coalesce(p_owner, auth.uid());
  if v_owner is null then raise exception 'owner requerido'; end if;
  if auth.uid() is not null and v_owner <> auth.uid() then raise exception 'no autorizado'; end if;
  select business_type into v_btype from public.profiles where id = v_owner;
  if v_btype is null then return; end if;

  if v_btype = 'salon' then
    with ranked as (
      select a.id, s.name svc,
             row_number() over (order by a.starts_at) rn
      from public.appointments a
      join public.services s on s.id = a.service_id
      where a.owner_id = v_owner and a.tech_detail = '{}'::jsonb
    )
    update public.appointments a set tech_detail =
      case when r.svc ~* 'tinte|mechas|balayage|keratina|color|canas' then
        jsonb_build_object(
          'formula_color', (array['Igora 7-1 + oxidante 20vol','Wella 6/0 + 9%','Majirel 5.3 + oxidante 30vol','Igora 9-1 + 30vol','Koleston 7/43 + 6%'])[1 + (r.rn%5)],
          'tono',          (array['Rubio ceniza','Castaño chocolate','Cobrizo intenso','Rubio dorado','Negro azulado'])[1 + (r.rn%5)],
          'tratamiento',   (array['Keratina','Botox capilar','Hidratación profunda','Nutrición','Sellado de puntas'])[1 + (r.rn%5)]
        )
      else '{}'::jsonb end
    from ranked r where r.id = a.id;
  else
    with ranked as (
      select a.id,
             row_number() over (order by a.starts_at) rn
      from public.appointments a
      where a.owner_id = v_owner and a.tech_detail = '{}'::jsonb
    )
    update public.appointments a set tech_detail = jsonb_build_object(
      'tipo_corte', (array['Fade medio + texturizado','Corte clásico con raya','Degradado alto + diseño','Casquete con tijera','Low fade + flequillo'])[1 + (r.rn%5)],
      'maquina',    (array['1.5 lados, tijera arriba','0.5 abajo, difumina al 2','Skin fade guía 1 a 3','Solo tijera y peine','2 a los lados, texturizado'])[1 + (r.rn%5)],
      'barba',      (array['Perfilado clásico con navaja','Barba difuminada','Línea marcada sin navaja','Sin barba','Recorte y aceite'])[1 + (r.rn%5)]
    )
    from ranked r where r.id = a.id;
  end if;
end;
$$;

grant execute on function public.reset_permanent_tech(uuid) to authenticated;
grant execute on function public.enrich_demo_visits(uuid) to authenticated;
