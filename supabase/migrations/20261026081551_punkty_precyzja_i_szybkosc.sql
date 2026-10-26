-- Punkty za odpowiedź w jednym miejscu (26.10, uwagi Łukasza po teście):
-- * „Ile?” (szacowanie): precyzja ważniejsza niż szybkość. Trafienie w punkt daje 900–1000 (im szybciej, tym
--   więcej), każda odpowiedź obok najwyżej 850 × ocena, więc trafienie zawsze bije szybkie, ale nieprecyzyjne.
-- * reszta bez limitu czasu: punkty uciekają szybciej, od 1000 do 500 po 20 s (było 30 s; wielokrotny, pary
--   i kolejność 40 s zamiast 60 s). Z limitem jak dotąd: od 1000 do 500 przez cały limit.
create or replace function wewn.punkty_odpowiedzi(
  p_typ text, p_ocena numeric, p_czas_ms int, p_limit_ms int, p_bonus boolean, p_mnoznik numeric
)
 returns int
 language sql
 immutable
 set search_path to ''
as $function$
  select round(
    coalesce(p_mnoznik, 1) *
    case
      when p_typ = 'szacowanie' then
        case
          when p_ocena >= 1 then case when p_bonus then 900 + 100 * (1 - least(p_czas_ms, p_limit_ms)::numeric / p_limit_ms) else 1000 end
          else 850 * p_ocena * case when p_bonus then 0.9 + 0.1 * (1 - least(p_czas_ms, p_limit_ms)::numeric / p_limit_ms) else 1 end
        end
      else
        p_ocena * case when p_bonus then 500 + 500 * (1 - least(p_czas_ms, p_limit_ms)::numeric / p_limit_ms) else 1000 end
    end
  )::int
$function$;

/** Okno, w którym punkty maleją, gdy pytanie nie ma limitu czasu. */
create or replace function wewn.okno_bez_limitu_ms(p_typ text)
 returns int
 language sql
 immutable
 set search_path to ''
as $function$
  select case when p_typ in ('wielokrotny', 'kolejnosc', 'pary') then 40000 else 20000 end
$function$;

do $$
declare
  v_def text := pg_get_functiondef('public.zapisz_odpowiedz(text,uuid,jsonb)'::regprocedure);
  v_od int := position('  if v_czas is null then' in v_def);
  v_do int := position('  insert into public.odpowiedzi' in v_def);
begin
  if v_od = 0 or v_do = 0 or v_do < v_od then
    raise exception 'zapisz_odpowiedz: nie znaleziono liczenia punktów';
  end if;
  execute substr(v_def, 1, v_od - 1) || $n$  -- okno spadku punktów: bez limitu stałe (wewn.okno_bez_limitu_ms), z limitem cały limit
  if v_czas is null then
    v_limit_ms := wewn.okno_bez_limitu_ms(v_z.typ);
  else
    v_limit_ms := v_czas * 1000;
    v_czas_ms := least(v_czas_ms, v_limit_ms);
  end if;
  -- punkty (precyzja w szacowaniu, szybkość w reszcie) i mnożnik etapu: wewn.punkty_odpowiedzi
  v_punkty := wewn.punkty_odpowiedzi(v_z.typ, v_ocena, v_czas_ms, v_limit_ms, v_s.bonus_czas, v_e.mnoznik);

$n$ || substr(v_def, v_do);
end $$;

create or replace function wewn.udawany_czas_bota(p_gracz_id uuid, p_z public.zadania, p_s public.sesje, p_wiedza numeric)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_e public.etapy;
  v_czas int;
  v_limit_ms int;
  v_ms int;
begin
  select * into v_e from public.etapy where id = p_z.etap_id;
  v_czas := coalesce(v_e.czas_s, p_s.czas_s);
  v_limit_ms := case when v_czas is not null then v_czas * 1000 else wewn.okno_bez_limitu_ms(p_z.typ) end;
  v_ms := least(round(v_limit_ms * 0.7)::int,
                round(2000 + random() * 10000 * (1.3 - p_wiedza))::int);
  update public.odpowiedzi o
     set czas_ms = v_ms,
         punkty = wewn.punkty_odpowiedzi(p_z.typ, o.ocena, v_ms, v_limit_ms, p_s.bonus_czas, v_e.mnoznik)
   where o.gracz_id = p_gracz_id and o.zadanie_id = p_z.id;
end;
$function$;
