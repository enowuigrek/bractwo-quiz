-- Odpadanie, część 3: plansza etapu podaje, ilu przechodzi, a prowadzący ustawia progi przed startem.
-- Plansza etapu: ilu przechodzi po tym etapie (próg z sesji)
create or replace function wewn.etap_json(p_etap_id uuid, p_s public.sesje)
 returns jsonb
 language sql
 stable
 set search_path to ''
as $function$
  select jsonb_build_object(
    'id', e.id,
    'nr', e.nr,
    'liczba', (select count(*) from public.etapy where quiz_id = e.quiz_id),
    'nazwa', e.nazwa,
    'opis', e.opis,
    'mnoznik', e.mnoznik,
    'czas_s', case when e.seria then coalesce(e.czas_s, 60) else coalesce(e.czas_s, p_s.czas_s) end,
    'finalowy', e.finalowy,
    'seria', e.seria,
    'final_po_etapie', exists (
      select 1 from public.etapy n where n.quiz_id = e.quiz_id and n.nr = e.nr + 1 and n.finalowy
    ),
    'final_dalej', exists (
      select 1 from public.etapy n where n.quiz_id = e.quiz_id and n.nr > e.nr and n.finalowy
    ),
    'przechodzi', (p_s.progi ->> e.nr::text)::int,
    'liczba_pytan', (select count(*) from public.zadania where etap_id = e.id),
    'typy', (
      select coalesce(jsonb_agg(t.typ order by t.pierwszy), '[]'::jsonb)
        from (select typ, min(nr) as pierwszy from public.zadania where etap_id = e.id group by typ) t
    )
  )
    from public.etapy e
   where e.id = p_etap_id
$function$;

-- Ustawienie progów przez prowadzącego przed startem: {"2": 12, "3": 6}; pusty obiekt = nikt nie odpada
create or replace function public.ustaw_progi(p_kod text, p_host_token text, p_progi jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_s public.sesje;
  v_k text;
  v_w jsonb;
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  if v_s.faza <> 'poczekalnia' then
    raise exception 'Progi można zmienić tylko przed startem quizu';
  end if;
  if jsonb_typeof(p_progi) <> 'object' then
    raise exception 'Nieprawidłowe progi';
  end if;
  for v_k, v_w in select key, value from jsonb_each(p_progi) loop
    if v_k !~ '^[0-9]{1,2}$' or jsonb_typeof(v_w) <> 'number' or (v_w)::int < 3 or (v_w)::int > 500 then
      raise exception 'Nieprawidłowy próg po etapie %', v_k;
    end if;
  end loop;
  update public.sesje set progi = p_progi where id = v_s.id;
  perform wewn.rozglos(v_s.kod, 'stan', '{}'::jsonb);
  return public.pilot_stan(v_s.kod, p_host_token);
end;
$function$;
