-- Finał jako wyścig, część 2: plansza finału zapisuje przewagę finalistów, seria kończy się, gdy ktoś dojdzie
-- do mety (przewaga + dobre ≥ 12), a pytania serii lecą w losowej kolejności, wspólnej dla całej gry.
do $$
declare
  v_def text := pg_get_functiondef('public.pilot_akcja'::regproc);
  v_stare text := $s$             finalisci = case when v_e.finalowy then wewn.wybierz_finalistow(v_s.id) end
       where id = v_s.id;$s$;
  v_nowe text := $s$             finalisci = case when v_e.finalowy then wewn.wybierz_finalistow(v_s.id) end
       where id = v_s.id;
      -- finał: przewaga na starcie wyścigu według punktów sprzed finału
      if v_e.finalowy then
        perform wewn.ustaw_start_finalu(v_s.id);
      end if;$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'pilot_akcja: nie znaleziono wyboru finalistów';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;

create or replace function wewn.zamknij_serie_jesli_gotowe(p_sesja_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_s public.sesje;
  v_teraz timestamptz := clock_timestamp();
  v_pytan int;
  v_meta int;
  v_przy_piwie int;
  v_w_trakcie int;
begin
  select * into v_s from public.sesje where id = p_sesja_id for update;
  if v_s.faza is distinct from 'seria' or v_teraz < v_s.faza_od then
    return;
  end if;
  select count(*) into v_pytan from public.zadania where etap_id = v_s.seria_etap;
  -- finał to wyścig do mety (przewaga + dobre); zwykła seria kończy się, gdy ktoś ma wszystko dobrze
  select case when e.finalowy then wewn.meta_finalu() end into v_meta from public.etapy e where e.id = v_s.seria_etap;
  with postep as (
    select g.id,
           g.start_finalu as start,
           count(o.id) as odpowiedzi,
           coalesce(sum(o.ocena), 0) as dobre
      from public.gracze g
      left join public.odpowiedzi o
        on o.gracz_id = g.id
       and o.zadanie_id in (select z.id from public.zadania z where z.etap_id = v_s.seria_etap)
     where g.sesja_id = v_s.id
       and (v_s.finalisci is null or g.id = any (v_s.finalisci))
     group by g.id
  )
  select count(*) filter (where (v_meta is null and dobre >= v_pytan - 0.001)
                             or (v_meta is not null and start + dobre >= v_meta - 0.001)),
         count(*) filter (where odpowiedzi < v_pytan)
    into v_przy_piwie, v_w_trakcie
    from postep;
  if v_przy_piwie > 0
     or v_w_trakcie = 0
     or (v_s.faza_do is not null and v_teraz >= v_s.faza_do + interval '1 second') then
    perform wewn.zakoncz_serie(v_s.id);
  end if;
end;
$function$;

do $$
declare
  v_def text := pg_get_functiondef('public.seria_pytania'::regproc);
  v_stare text := $s$             ) order by z.nr)$s$;
  v_nowe text := $s$             ) order by md5(z.id::text || v_s.id::text))$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'seria_pytania: nie znaleziono kolejności';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;
