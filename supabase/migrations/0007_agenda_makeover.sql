-- ───────────────────────────────────────────────────────────────────────────
-- MAKEOVER AGENDA · Más profesionales + citas repartidas (probar escalado)
-- Reseed one-time (vía PAT). NO se llama on-load (borraría cambios de recepción).
-- ───────────────────────────────────────────────────────────────────────────

-- Estados realistas: agrega 'cancelada' (rn=6) al mix.
create or replace function public.enrich_demo_statuses(p_owner uuid default null)
returns void language plpgsql security definer set search_path = public as $$
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
      when r.is_cancelled then 'cancelada'
      when r.d < v_today  then 'completada'
      when r.rn <= 4      then 'completada'
      when r.rn = 5       then 'en_proceso'
      when r.rn = 6       then 'cancelada'
      when r.rn = 7       then 'no_show'
      when r.rn % 2 = 0   then 'confirmada'
      else 'pendiente'
    end,
    is_cancelled = case when r.rn in (6, 7) then true else a.is_cancelled end
  from ranked r where r.id = a.id;
end;
$$;

-- Reseed: completa profesionales hasta p_pros y regenera 3 citas/profesional/día
-- (últimos 7 días), espaciadas para no chocar. Conserva citas del link público.
create or replace function public.reseed_agenda_demo(p_owner uuid, p_pros int default 8)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_btype text; v_loc uuid; v_today date;
  v_have int; v_need int;
  v_names text[]; v_specs text[];
  v_pros uuid[]; v_clients uuid[]; v_svcs uuid[];
  v_times int[] := array[540, 720, 930]; -- 9:00, 12:00, 15:30
  d int; pidx int; k int;
  v_svc uuid; v_price numeric; v_dur int; v_start timestamptz; v_off int; v_t int;
  n_pro int; n_cli int; n_svc int;
begin
  if p_owner is null then raise exception 'owner requerido'; end if;
  if auth.uid() is not null and p_owner <> auth.uid() then raise exception 'no autorizado'; end if;
  select business_type into v_btype from public.profiles where id = p_owner;
  if v_btype is null then return; end if;
  v_today := (now() at time zone 'America/Santo_Domingo')::date;
  select id into v_loc from public.locations where owner_id = p_owner and is_primary limit 1;

  if v_btype = 'salon' then
    v_names := array['Yamilet Reyes','Cristal Mejía','Dilenny Santos','Katherine Familia','Yinet Pérez','Alba Rosario','Nicole Vargas','Paola Sánchez'];
    v_specs := array['Colorista','Cortes y peinados','Tratamientos','Uñas','Maquillaje','Alisados','Peinados','Cejas y pestañas'];
  else
    v_names := array['Kelvin Reyes','Junior Cabrera','Wascar Méndez','Élido Santana','Franklin Díaz','Yeison Mota','Randy Polanco','Esmin Reyes'];
    v_specs := array['Fades y degradados','Barba y navaja','Cortes clásicos','Diseño y líneas','Coloración','Cortes de niño','Fades y degradados','Barba y navaja'];
  end if;

  select count(*) into v_have from public.professionals where owner_id = p_owner;
  v_need := least(p_pros - v_have, array_length(v_names, 1));
  if v_need > 0 then
    for k in 1 .. v_need loop
      insert into public.professionals (owner_id, name, title, location_id, specialty)
      values (p_owner, v_names[k],
              case when v_btype = 'salon' then 'Estilista' else 'Barbero' end,
              v_loc, v_specs[k]);
    end loop;
  end if;

  select array_agg(id order by created_at, name) into v_pros    from public.professionals where owner_id = p_owner;
  select array_agg(id order by created_at, name) into v_clients from public.clients        where owner_id = p_owner;
  select array_agg(id order by sort)             into v_svcs    from public.services        where owner_id = p_owner;
  n_pro := array_length(v_pros, 1);
  n_cli := array_length(v_clients, 1);
  n_svc := array_length(v_svcs, 1);
  if n_cli is null or n_svc is null then return; end if;

  delete from public.appointments
  where owner_id = p_owner and source = 'interna'
    and (starts_at at time zone 'America/Santo_Domingo')::date >= v_today - 6;

  for d in 0 .. 6 loop
    for pidx in 1 .. n_pro loop
      v_off := ((pidx - 1) % 2) * 30;
      for k in 1 .. array_length(v_times, 1) loop
        v_t := v_times[k] + v_off;
        v_svc := v_svcs[1 + ((d + pidx * 2 + k) % n_svc)];
        select price, duration_min into v_price, v_dur from public.services where id = v_svc;
        v_start := ((v_today - d) + make_interval(mins => v_t)) at time zone 'America/Santo_Domingo';
        insert into public.appointments (
          owner_id, location_id, client_id, professional_id, service_id,
          starts_at, ends_at, amount, payment_method, source, status
        ) values (
          p_owner, v_loc, v_clients[1 + ((d * 5 + pidx * 3 + k) % n_cli)], v_pros[pidx], v_svc,
          v_start, v_start + make_interval(mins => v_dur), v_price, 'efectivo', 'interna', 'pendiente'
        );
      end loop;
    end loop;
  end loop;
end;
$$;

grant execute on function public.reseed_agenda_demo(uuid, int) to authenticated;
